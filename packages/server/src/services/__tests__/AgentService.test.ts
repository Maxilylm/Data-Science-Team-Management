import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AgentService } from '../AgentService'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

describe('AgentService', () => {
  let service: AgentService
  let testConfigDir: string

  beforeEach(async () => {
    testConfigDir = path.join(os.tmpdir(), `test-agents-${Date.now()}`)
    await fs.mkdir(testConfigDir, { recursive: true })
    service = new AgentService(testConfigDir)
  })

  afterEach(async () => {
    await fs.rm(testConfigDir, { recursive: true, force: true })
  })

  it('should load agents from config directory', async () => {
    const agentConfig = `---
name: test-agent
description: "A test agent"
model: sonnet
color: blue
---

You are a test agent.
`
    await fs.writeFile(path.join(testConfigDir, 'test-agent.md'), agentConfig)

    const agents = await service.loadAgents()

    expect(agents).toHaveLength(1)
    expect(agents[0].name).toBe('test-agent')
    expect(agents[0].model).toBe('sonnet')
  })

  it('should get agent by id', async () => {
    const agentConfig = `---
name: my-agent
description: "My agent"
model: opus
color: green
---

Instructions here.
`
    await fs.writeFile(path.join(testConfigDir, 'my-agent.md'), agentConfig)
    await service.loadAgents()

    const agent = service.getAgent('my-agent')

    expect(agent).toBeDefined()
    expect(agent?.model).toBe('opus')
  })
})
