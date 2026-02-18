export type AgentStatus = 'idle' | 'running' | 'waiting_input' | 'error'

export interface Agent {
  id: string
  name: string
  description: string
  model: 'sonnet' | 'opus' | 'haiku'
  color: string
  status: AgentStatus
  sessionId: string | null
  configPath: string
  currentTaskId?: string
  tools?: string[]
  lastError?: string
}

export interface AgentConfig {
  name: string
  description: string
  model?: 'sonnet' | 'opus' | 'haiku'
  color?: string
  tools?: string[]
}
