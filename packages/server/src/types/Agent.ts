export interface Project {
  id: string
  name: string
  path: string
  createdAt: string
  lastAccessedAt: string
}

export type AgentStatus = 'idle' | 'running' | 'waiting_input' | 'error'
export type ModelType = 'sonnet' | 'opus' | 'haiku'
export type TicketStatus = 'unassigned' | 'pending' | 'in_progress' | 'needs_help' | 'completed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  assignedTo: string | null  // Agent ID or null if unassigned
  createdBy: string  // 'user' or agent ID
  createdAt: Date
  updatedAt: Date
  helpRequest?: {
    fromAgent: string
    message: string
    targetAgent?: string  // Specific agent or undefined for any/user
  }
  parentTicketId?: string  // If this is a sub-task
  tags: string[]
}

export interface AgentInstance {
  instanceId: string
  sessionId: string
  status: AgentStatus
  startedAt: Date
  prompt?: string
  parentInstanceId?: string  // If spawned by another agent
  ticketId?: string  // Ticket being worked on
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
