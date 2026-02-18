export type AgentStatus = 'idle' | 'running' | 'waiting_input' | 'error'
export type ModelType = 'sonnet' | 'opus' | 'haiku'

export interface Agent {
  id: string
  name: string
  description: string
  model: ModelType
  color: string
  status: AgentStatus
  sessionId: string | null
  /** Last session ID for resuming conversations */
  lastSessionId?: string
  configPath: string
  /** ID of task currently being executed by this agent */
  currentTaskId?: string
  /** List of tool identifiers this agent can invoke */
  tools?: string[]
  /** Error message; only present when status === 'error' */
  lastError?: string
}

export interface AgentConfig {
  name: string
  description: string
  model?: ModelType
  color?: string
  tools?: string[]
}
