export type AgentStatus = 'idle' | 'running' | 'waiting_input' | 'error'
export type ModelType = 'sonnet' | 'opus' | 'haiku'

export interface AgentInstance {
  instanceId: string
  sessionId: string
  status: AgentStatus
  startedAt: Date
  prompt?: string
  parentInstanceId?: string  // If spawned by another agent
}

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
  /** Active instances of this agent */
  instances: AgentInstance[]
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
