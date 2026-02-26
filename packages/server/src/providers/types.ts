import { EventEmitter } from 'events'

export interface ProviderSpawnOptions {
  agentId: string
  systemPrompt?: string
  userPrompt: string
  projectPath: string
  model?: string
  tools?: string[]
  ticketId?: string
  resumeSessionId?: string
}

export type ProviderSessionStatus = 'running' | 'waiting_input' | 'completed' | 'error'

export interface ProviderSession {
  sessionId: string
  status: ProviderSessionStatus
  agentId: string
  ticketId?: string
  waitingForInput: boolean
  lastQuestion?: {
    question: string
    options?: string[]
    detectedAt: Date
  }
  outputBuffer: string
}

export interface ProviderInfo {
  id: string
  name: string
  description: string
  isAvailable: boolean
  config?: Record<string, unknown>
}

export interface ProviderConfig {
  active: string
  configs: Record<string, Record<string, unknown>>
}

export interface SecretsConfig {
  providers: Record<string, Record<string, string>>
  auth: {
    enabled: boolean
    tokens: string[]
  }
}

export interface AgentProvider extends EventEmitter {
  readonly id: string
  readonly name: string
  readonly description: string

  isAvailable(): Promise<boolean>
  spawn(options: ProviderSpawnOptions): Promise<string>
  sendInput(sessionId: string, input: string): boolean
  terminate(sessionId: string): boolean
  getSession(sessionId: string): ProviderSession | undefined
  getAllSessions(): ProviderSession[]
  getWaitingSessions(): ProviderSession[]
}

export interface ProviderEvent {
  sessionId: string
  agentId: string
  ticketId?: string
}

export interface ProviderOutputEvent extends ProviderEvent {
  data: string
}

export interface ProviderErrorEvent extends ProviderEvent {
  data: string
}

export interface ProviderCloseEvent extends ProviderEvent {
  code: number | null
}

export interface ProviderQuestionEvent extends ProviderEvent {
  question: string
  questionOptions?: string[]
}

export interface ProviderInputEvent extends ProviderEvent {
  input: string
}
