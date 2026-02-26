import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'
import { ProviderManager } from '../ProviderManager.js'

// Mock both providers
vi.mock('../ClaudeCliProvider.js', () => {
  return {
    ClaudeCliProvider: vi.fn().mockImplementation(() => {
      const emitter = new EventEmitter()
      return Object.assign(emitter, {
        id: 'claude-cli',
        name: 'Claude CLI',
        description: 'Mock CLI provider',
        isAvailable: vi.fn().mockResolvedValue(true),
        spawn: vi.fn().mockResolvedValue('cli-session-1'),
        sendInput: vi.fn().mockReturnValue(true),
        terminate: vi.fn().mockReturnValue(true),
        getSession: vi.fn().mockReturnValue(undefined),
        getAllSessions: vi.fn().mockReturnValue([]),
        getWaitingSessions: vi.fn().mockReturnValue([])
      })
    })
  }
})

vi.mock('../AnthropicApiProvider.js', () => {
  return {
    AnthropicApiProvider: vi.fn().mockImplementation(() => {
      const emitter = new EventEmitter()
      return Object.assign(emitter, {
        id: 'anthropic-api',
        name: 'Anthropic API',
        description: 'Mock API provider',
        configure: vi.fn(),
        isAvailable: vi.fn().mockResolvedValue(false),
        spawn: vi.fn().mockResolvedValue('api-session-1'),
        sendInput: vi.fn().mockReturnValue(true),
        terminate: vi.fn().mockReturnValue(true),
        getSession: vi.fn().mockReturnValue(undefined),
        getAllSessions: vi.fn().mockReturnValue([]),
        getWaitingSessions: vi.fn().mockReturnValue([])
      })
    })
  }
})

describe('ProviderManager', () => {
  let manager: ProviderManager

  beforeEach(() => {
    vi.clearAllMocks()
    manager = new ProviderManager()
  })

  it('spawns on the active provider (claude-cli by default)', async () => {
    const sessionId = await manager.spawn({
      agentId: 'test-agent',
      userPrompt: 'hello',
      projectPath: '/tmp/project'
    })
    expect(sessionId).toBe('cli-session-1')
  })

  it('spawns on anthropic-api when set as active', async () => {
    manager.setActiveProvider('anthropic-api')
    const sessionId = await manager.spawn({
      agentId: 'test-agent',
      userPrompt: 'hello',
      projectPath: '/tmp/project'
    })
    expect(sessionId).toBe('api-session-1')
  })

  it('routes sendInput to the correct provider via session map', async () => {
    await manager.spawn({
      agentId: 'test-agent',
      userPrompt: 'hello',
      projectPath: '/tmp/project'
    })

    const result = manager.sendInput('cli-session-1', 'yes')
    expect(result).toBe(true)

    const cliProvider = manager.getProvider('claude-cli')!
    expect(cliProvider.sendInput).toHaveBeenCalledWith('cli-session-1', 'yes')
  })

  it('routes terminate to the correct provider via session map', async () => {
    await manager.spawn({
      agentId: 'test-agent',
      userPrompt: 'hello',
      projectPath: '/tmp/project'
    })

    const result = manager.terminate('cli-session-1')
    expect(result).toBe(true)

    const cliProvider = manager.getProvider('claude-cli')!
    expect(cliProvider.terminate).toHaveBeenCalledWith('cli-session-1')
  })

  it('returns false for sendInput on unknown session', () => {
    const result = manager.sendInput('unknown-session', 'test')
    expect(result).toBe(false)
  })

  it('forwards events from providers', async () => {
    const outputHandler = vi.fn()
    manager.on('output', outputHandler)

    const cliProvider = manager.getProvider('claude-cli')!
    cliProvider.emit('output', {
      sessionId: 'cli-session-1',
      agentId: 'test-agent',
      data: 'hello world'
    })

    expect(outputHandler).toHaveBeenCalledWith({
      sessionId: 'cli-session-1',
      agentId: 'test-agent',
      data: 'hello world'
    })
  })

  it('forwards close events from providers', () => {
    const closeHandler = vi.fn()
    manager.on('close', closeHandler)

    const apiProvider = manager.getProvider('anthropic-api')!
    apiProvider.emit('close', {
      sessionId: 'api-session-1',
      agentId: 'test-agent',
      code: 0
    })

    expect(closeHandler).toHaveBeenCalledWith({
      sessionId: 'api-session-1',
      agentId: 'test-agent',
      code: 0
    })
  })

  it('throws when setting an unknown provider as active', () => {
    expect(() => manager.setActiveProvider('nonexistent')).toThrow(
      'Provider not found: nonexistent'
    )
  })
})
