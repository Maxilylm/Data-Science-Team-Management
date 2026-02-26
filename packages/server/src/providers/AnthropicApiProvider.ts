import { EventEmitter } from 'events'
import type {
  AgentProvider,
  ProviderSpawnOptions,
  ProviderSession
} from './types.js'
import { TOOL_DEFINITIONS, executeTool } from './tools/index.js'

interface ApiSession extends ProviderSession {
  abortController: AbortController
  projectPath: string
  allowedTools?: string[]
}

interface MessageContent {
  type: string
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
}

interface ApiMessage {
  role: 'user' | 'assistant'
  content: string | MessageContent[]
}

interface ApiResponse {
  id: string
  content: MessageContent[]
  stop_reason: string | null
  model: string
  usage: { input_tokens: number; output_tokens: number }
}

const QUESTION_PATTERNS = [
  /((?:Which|Where|What|How|Would|Should|Do|Can|Will|Is)[^.!?\n]+\?)/i,
  /([A-Z][^.!?\n]{10,}\?)/
]

export class AnthropicApiProvider extends EventEmitter implements AgentProvider {
  readonly id = 'anthropic-api'
  readonly name = 'Anthropic API'
  readonly description = 'Direct API calls to Anthropic Messages API'

  private sessions: Map<string, ApiSession> = new Map()
  private apiKey: string = ''
  private baseUrl: string = 'https://api.anthropic.com'

  configure(config: { apiKey?: string; baseUrl?: string }): void {
    if (config.apiKey) this.apiKey = config.apiKey
    if (config.baseUrl) this.baseUrl = config.baseUrl
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      })
      return response.ok
    } catch {
      return false
    }
  }

  async spawn(options: ProviderSpawnOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured')
    }

    const sessionId = `api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const abortController = new AbortController()

    const session: ApiSession = {
      sessionId,
      agentId: options.agentId,
      status: 'running',
      ticketId: options.ticketId,
      waitingForInput: false,
      outputBuffer: '',
      abortController,
      projectPath: options.projectPath,
      allowedTools: options.tools
    }

    this.sessions.set(sessionId, session)

    // Run the agentic loop asynchronously
    this.runAgenticLoop(session, options).catch((err) => {
      console.error('[AnthropicApiProvider] Loop error:', err)
      session.status = 'error'
      this.emit('error', {
        sessionId,
        agentId: options.agentId,
        data: err.message
      })
      this.sessions.delete(sessionId)
      this.emit('close', {
        sessionId,
        agentId: options.agentId,
        code: 1
      })
    })

    return sessionId
  }

  sendInput(sessionId: string, input: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session || !session.waitingForInput) return false

    session.waitingForInput = false
    session.lastQuestion = undefined
    session.status = 'running'

    this.emit('inputProvided', {
      sessionId,
      agentId: session.agentId,
      input
    })

    // Resume the agentic loop with user input
    this.resumeWithInput(session, input).catch((err) => {
      console.error('[AnthropicApiProvider] Resume error:', err)
    })

    return true
  }

  terminate(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.abortController.abort()
    this.sessions.delete(sessionId)
    return true
  }

  getSession(sessionId: string): ProviderSession | undefined {
    const session = this.sessions.get(sessionId)
    if (!session) return undefined
    return this.toProviderSession(session)
  }

  getAllSessions(): ProviderSession[] {
    return Array.from(this.sessions.values()).map(s =>
      this.toProviderSession(s)
    )
  }

  getWaitingSessions(): ProviderSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.waitingForInput)
      .map(s => this.toProviderSession(s))
  }

  private conversationHistory: Map<string, ApiMessage[]> = new Map()

  private async runAgenticLoop(
    session: ApiSession,
    options: ProviderSpawnOptions
  ): Promise<void> {
    const messages: ApiMessage[] = [
      { role: 'user', content: options.userPrompt }
    ]
    this.conversationHistory.set(session.sessionId, messages)

    const model = this.mapModel(options.model)

    await this.executeLoop(session, messages, model, options.systemPrompt)
  }

  private async resumeWithInput(
    session: ApiSession,
    input: string
  ): Promise<void> {
    const messages = this.conversationHistory.get(session.sessionId)
    if (!messages) return

    messages.push({ role: 'user', content: input })
    const model = 'claude-sonnet-4-20250514' // default for resume

    await this.executeLoop(session, messages, model)
  }

  private async executeLoop(
    session: ApiSession,
    messages: ApiMessage[],
    model: string,
    systemPrompt?: string
  ): Promise<void> {
    let continueLoop = true

    while (continueLoop && !session.abortController.signal.aborted) {
      const response = await this.callApi(
        messages, model, systemPrompt, session.abortController.signal
      )

      // Process response content
      const textParts: string[] = []
      const toolUses: MessageContent[] = []

      for (const block of response.content) {
        if (block.type === 'text' && block.text) {
          textParts.push(block.text)
        } else if (block.type === 'tool_use') {
          toolUses.push(block)
        }
      }

      // Emit text output
      if (textParts.length > 0) {
        const text = textParts.join('\n')
        session.outputBuffer += text + '\n'
        this.emit('output', {
          sessionId: session.sessionId,
          agentId: session.agentId,
          data: text
        })
      }

      // Add assistant message to history
      messages.push({ role: 'assistant', content: response.content })

      // If there are tool uses, execute them
      if (toolUses.length > 0 && response.stop_reason === 'tool_use') {
        const toolResults = await this.executeTools(
          toolUses, session.projectPath, session.allowedTools
        )

        messages.push({ role: 'user', content: toolResults })
        continue // Loop back to send tool results
      }

      // No more tool calls - check for questions
      if (textParts.length > 0) {
        const question = this.detectQuestion(textParts.join('\n'))
        if (question) {
          session.waitingForInput = true
          session.status = 'waiting_input'
          session.lastQuestion = {
            question,
            detectedAt: new Date()
          }
          this.emit('question', {
            sessionId: session.sessionId,
            agentId: session.agentId,
            ticketId: session.ticketId,
            question
          })
          return // Wait for user input
        }
      }

      // Model finished
      continueLoop = false
    }

    // Clean up
    session.status = 'completed'
    this.sessions.delete(session.sessionId)
    this.conversationHistory.delete(session.sessionId)
    this.emit('close', {
      sessionId: session.sessionId,
      agentId: session.agentId,
      code: 0
    })
  }

  private async callApi(
    messages: ApiMessage[],
    model: string,
    systemPrompt?: string,
    signal?: AbortSignal
  ): Promise<ApiResponse> {
    const body: Record<string, unknown> = {
      model,
      max_tokens: 8192,
      messages,
      tools: TOOL_DEFINITIONS
    }

    if (systemPrompt) {
      body.system = systemPrompt
    }

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error ${response.status}: ${errorText}`)
    }

    return response.json() as Promise<ApiResponse>
  }

  private async executeTools(
    toolUses: MessageContent[],
    projectPath: string,
    allowedTools?: string[]
  ): Promise<MessageContent[]> {
    const results: MessageContent[] = []

    for (const tool of toolUses) {
      if (!tool.name || !tool.id) continue

      try {
        const result = await executeTool(
          tool.name,
          tool.input || {},
          projectPath,
          allowedTools
        )

        results.push({
          type: 'tool_result',
          id: tool.id,
          text: result
        } as MessageContent)
      } catch (err) {
        results.push({
          type: 'tool_result',
          id: tool.id,
          text: `Error: ${(err as Error).message}`
        } as MessageContent)
      }
    }

    return results
  }

  private detectQuestion(text: string): string | null {
    for (const pattern of QUESTION_PATTERNS) {
      const match = text.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  private mapModel(model?: string): string {
    switch (model) {
      case 'opus': return 'claude-opus-4-20250514'
      case 'sonnet': return 'claude-sonnet-4-20250514'
      case 'haiku': return 'claude-haiku-3-5-20241022'
      default: return 'claude-sonnet-4-20250514'
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01'
    }
  }

  private toProviderSession(session: ApiSession): ProviderSession {
    return {
      sessionId: session.sessionId,
      status: session.status,
      agentId: session.agentId,
      ticketId: session.ticketId,
      waitingForInput: session.waitingForInput,
      lastQuestion: session.lastQuestion,
      outputBuffer: session.outputBuffer
    }
  }
}
