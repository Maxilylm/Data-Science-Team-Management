import * as fs from 'fs/promises'
import * as path from 'path'
import type { Agent, AgentConfig, AgentInstance, AgentStatus } from '../types/Agent'

export class AgentService {
  private agents: Map<string, Agent> = new Map()
  private configDir: string

  constructor(configDir?: string) {
    // Look for .claude/agents in project root (2 levels up from packages/server)
    this.configDir = configDir || path.join(process.cwd(), '..', '..', '.claude', 'agents')
  }

  async createAgent(id: string, config: AgentConfig, systemPrompt: string): Promise<Agent> {
    const filePath = path.join(this.configDir, `${id}.md`)

    const content = `---
name: ${config.name}
description: "${config.description}"
model: ${config.model || 'sonnet'}
color: ${config.color || 'blue'}
---

${systemPrompt}
`
    await fs.mkdir(this.configDir, { recursive: true })
    await fs.writeFile(filePath, content)

    const agent: Agent = {
      id,
      name: config.name,
      description: config.description,
      model: config.model || 'sonnet',
      color: config.color || 'blue',
      status: 'idle',
      sessionId: null,
      instances: [],
      configPath: filePath,
      tools: config.tools
    }

    this.agents.set(id, agent)
    return agent
  }

  async loadAgents(): Promise<Agent[]> {
    this.agents.clear()

    try {
      const files = await fs.readdir(this.configDir)
      const mdFiles = files.filter(f => f.endsWith('.md'))

      for (const file of mdFiles) {
        const filePath = path.join(this.configDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const config = this.parseFrontmatter(content)

        if (config) {
          const id = path.basename(file, '.md')
          const agent: Agent = {
            id,
            name: config.name || id,
            description: config.description || '',
            model: config.model || 'sonnet',
            color: config.color || 'gray',
            status: 'idle',
            sessionId: null,
            instances: [],
            configPath: filePath,
            tools: config.tools
          }
          this.agents.set(id, agent)
        }
      }
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code === 'ENOENT') {
        // Config directory doesn't exist - expected on fresh install
        console.warn(`Agent config directory not found: ${this.configDir}`)
      } else {
        throw error
      }
    }

    return Array.from(this.agents.values())
  }

  private parseFrontmatter(content: string): AgentConfig | null {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/
    const match = content.match(frontmatterRegex)

    if (!match) return null

    const frontmatter = match[1]
    const config: AgentConfig = { name: '', description: '' }

    for (const line of frontmatter.split('\n')) {
      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) continue

      const key = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      if (key === 'name') config.name = value
      else if (key === 'description') config.description = value
      else if (key === 'model') config.model = value as 'sonnet' | 'opus' | 'haiku'
      else if (key === 'color') config.color = value
      else if (key === 'tools') {
        // Handle comma-separated list or JSON array
        if (value.startsWith('[')) {
          try {
            config.tools = JSON.parse(value)
          } catch {
            config.tools = value.replace(/[\[\]]/g, '').split(',').map(t => t.trim())
          }
        } else {
          config.tools = value.split(',').map(t => t.trim()).filter(t => t.length > 0)
        }
      }
    }

    return config
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id)
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values())
  }

  updateAgentStatus(id: string, status: Agent['status'], sessionId?: string | null): void {
    const agent = this.agents.get(id)
    if (agent) {
      // Save current sessionId as lastSessionId before clearing
      if (agent.sessionId && sessionId === null) {
        agent.lastSessionId = agent.sessionId
      }
      agent.status = status
      if (sessionId !== undefined) agent.sessionId = sessionId

      // Update overall status based on instances
      if (agent.instances.length > 0) {
        agent.status = 'running'
      }
    }
  }

  addInstance(agentId: string, instance: AgentInstance): void {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.instances.push(instance)
      agent.status = 'running'
      agent.sessionId = instance.sessionId
    }
  }

  removeInstance(agentId: string, instanceId: string): void {
    const agent = this.agents.get(agentId)
    if (agent) {
      const instance = agent.instances.find(i => i.instanceId === instanceId)
      if (instance) {
        agent.lastSessionId = instance.sessionId
      }
      agent.instances = agent.instances.filter(i => i.instanceId !== instanceId)
      if (agent.instances.length === 0) {
        agent.status = 'idle'
        agent.sessionId = null
      } else {
        agent.sessionId = agent.instances[0].sessionId
      }
    }
  }

  getInstance(agentId: string, instanceId: string): AgentInstance | undefined {
    return this.agents.get(agentId)?.instances.find(i => i.instanceId === instanceId)
  }

  getInstanceBySession(sessionId: string): { agent: Agent; instance: AgentInstance } | undefined {
    for (const agent of this.agents.values()) {
      const instance = agent.instances.find(i => i.sessionId === sessionId)
      if (instance) {
        return { agent, instance }
      }
    }
    return undefined
  }

  updateInstanceStatus(agentId: string, instanceId: string, status: AgentStatus): void {
    const agent = this.agents.get(agentId)
    if (agent) {
      const instance = agent.instances.find(i => i.instanceId === instanceId)
      if (instance) {
        instance.status = status
        // Update agent status to match the most "active" instance
        if (status === 'waiting_input') {
          agent.status = 'waiting_input'
        }
      }
    }
  }

  getLastSessionId(id: string): string | undefined {
    return this.agents.get(id)?.lastSessionId
  }

  async deleteAgent(id: string): Promise<boolean> {
    const agent = this.agents.get(id)
    if (!agent) return false

    // Delete the config file
    try {
      await fs.unlink(agent.configPath)
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError.code !== 'ENOENT') {
        throw error
      }
    }

    // Remove from memory
    this.agents.delete(id)
    return true
  }
}
