export type AgentStatus = 'idle' | 'running' | 'waiting_input' | 'error'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'needs_input'
export type TicketStatus = 'unassigned' | 'pending' | 'in_progress' | 'needs_help' | 'completed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  assignedTo: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  helpRequest?: {
    fromAgent: string
    message: string
    targetAgent?: string
  }
  parentTicketId?: string
  tags: string[]
}

export interface AgentInstance {
  instanceId: string
  sessionId: string
  status: AgentStatus
  startedAt: string
  prompt?: string
  parentInstanceId?: string
  ticketId?: string
}

export interface Agent {
  id: string
  name: string
  description: string
  model: 'sonnet' | 'opus' | 'haiku'
  color: string
  status: AgentStatus
  sessionId: string | null
  lastSessionId?: string
  instances: AgentInstance[]
  currentTaskId?: string
}

export interface Task {
  id: string
  subject: string
  description: string
  status: TaskStatus
  agentId: string | null
  sessionId: string
  activeForm?: string
  blocks: string[]
  blockedBy: string[]
  inputRequest?: {
    question: string
    options?: string[]
  }
}

export interface KanbanData {
  pending: Task[]
  in_progress: Task[]
  completed: Task[]
  needs_input: Task[]
}
