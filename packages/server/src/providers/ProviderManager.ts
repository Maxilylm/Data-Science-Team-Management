import { EventEmitter } from 'events'
import { ClaudeCliProvider } from './ClaudeCliProvider.js'
import { AnthropicApiProvider } from './AnthropicApiProvider.js'
import type {
  AgentProvider,
  ProviderSpawnOptions,
  ProviderSession,
  ProviderInfo,
  ProviderConfig
} from './types.js'

const FORWARDED_EVENTS = [
  'output', 'error', 'close', 'question', 'inputProvided'
]

export class ProviderManager extends EventEmitter {
  private providers: Map<string, AgentProvider> = new Map()
  private activeProviderId: string
  private sessionProviderMap: Map<string, string> = new Map()

  constructor(config?: ProviderConfig) {
    super()

    const cliProvider = new ClaudeCliProvider()
    const apiProvider = new AnthropicApiProvider()

    this.registerProvider(cliProvider)
    this.registerProvider(apiProvider)

    this.activeProviderId = config?.active || 'claude-cli'

    // Apply provider configs
    if (config?.configs) {
      this.applyConfigs(config.configs)
    }
  }

  private registerProvider(provider: AgentProvider): void {
    this.providers.set(provider.id, provider)
    this.forwardEvents(provider)
  }

  private forwardEvents(provider: AgentProvider): void {
    for (const event of FORWARDED_EVENTS) {
      provider.on(event, (data) => {
        this.emit(event, data)
      })
    }
  }

  private applyConfigs(
    configs: Record<string, Record<string, unknown>>
  ): void {
    for (const [providerId, config] of Object.entries(configs)) {
      const provider = this.providers.get(providerId)
      if (provider && 'configure' in provider) {
        (provider as AnthropicApiProvider).configure(
          config as { apiKey?: string; baseUrl?: string }
        )
      }
    }
  }

  getActiveProvider(): AgentProvider {
    const provider = this.providers.get(this.activeProviderId)
    if (!provider) {
      throw new Error(`Active provider not found: ${this.activeProviderId}`)
    }
    return provider
  }

  getActiveProviderId(): string {
    return this.activeProviderId
  }

  setActiveProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider not found: ${providerId}`)
    }
    this.activeProviderId = providerId
  }

  getProvider(providerId: string): AgentProvider | undefined {
    return this.providers.get(providerId)
  }

  async getAvailableProviders(): Promise<ProviderInfo[]> {
    const results: ProviderInfo[] = []

    for (const provider of this.providers.values()) {
      const isAvailable = await provider.isAvailable()
      results.push({
        id: provider.id,
        name: provider.name,
        description: provider.description,
        isAvailable
      })
    }

    return results
  }

  async spawn(options: ProviderSpawnOptions): Promise<string> {
    const provider = this.getActiveProvider()
    const sessionId = await provider.spawn(options)
    this.sessionProviderMap.set(sessionId, provider.id)
    return sessionId
  }

  sendInput(sessionId: string, input: string): boolean {
    const provider = this.getProviderForSession(sessionId)
    if (!provider) return false
    return provider.sendInput(sessionId, input)
  }

  terminate(sessionId: string): boolean {
    const provider = this.getProviderForSession(sessionId)
    if (!provider) return false
    const result = provider.terminate(sessionId)
    if (result) this.sessionProviderMap.delete(sessionId)
    return result
  }

  getSession(sessionId: string): ProviderSession | undefined {
    const provider = this.getProviderForSession(sessionId)
    if (!provider) return undefined
    return provider.getSession(sessionId)
  }

  getAllSessions(): ProviderSession[] {
    const sessions: ProviderSession[] = []
    for (const provider of this.providers.values()) {
      sessions.push(...provider.getAllSessions())
    }
    return sessions
  }

  getWaitingSessions(): ProviderSession[] {
    const sessions: ProviderSession[] = []
    for (const provider of this.providers.values()) {
      sessions.push(...provider.getWaitingSessions())
    }
    return sessions
  }

  isWaitingForInput(sessionId: string): boolean {
    const session = this.getSession(sessionId)
    return session?.waitingForInput ?? false
  }

  getSessionQuestion(sessionId: string): ProviderSession['lastQuestion'] | undefined {
    return this.getSession(sessionId)?.lastQuestion
  }

  configureProvider(
    providerId: string,
    config: Record<string, unknown>
  ): void {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`)
    }
    if ('configure' in provider) {
      (provider as AnthropicApiProvider).configure(
        config as { apiKey?: string; baseUrl?: string }
      )
    }
  }

  async testProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId)
    if (!provider) return false
    return provider.isAvailable()
  }

  private getProviderForSession(
    sessionId: string
  ): AgentProvider | undefined {
    const providerId = this.sessionProviderMap.get(sessionId)
    if (providerId) return this.providers.get(providerId)

    // Fallback: search all providers
    for (const provider of this.providers.values()) {
      if (provider.getSession(sessionId)) {
        this.sessionProviderMap.set(sessionId, provider.id)
        return provider
      }
    }

    return undefined
  }
}
