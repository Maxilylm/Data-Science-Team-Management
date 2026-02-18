import * as fs from 'fs/promises'
import * as path from 'path'
import type { Agent, AgentConfig } from '../types/Agent'

export class AgentService {
  private agents: Map<string, Agent> = new Map()
  private configDir: string

  constructor(configDir?: string) {
    this.configDir = configDir || path.join(process.cwd(), '.claude', 'agents')
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
            configPath: filePath,
            tools: config.tools
          }
          this.agents.set(id, agent)
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
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
    }

    return config
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id)
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values())
  }

  updateAgentStatus(id: string, status: Agent['status'], sessionId?: string): void {
    const agent = this.agents.get(id)
    if (agent) {
      agent.status = status
      if (sessionId !== undefined) agent.sessionId = sessionId
    }
  }
}
