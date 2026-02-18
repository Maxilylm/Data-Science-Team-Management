export type AgentStatus = 'idle' | 'running' | 'waiting_input' | 'error'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'needs_input'

export interface Agent {
  id: string
  name: string
  description: string
  model: 'sonnet' | 'opus' | 'haiku'
  color: string
  status: AgentStatus
  sessionId: string | null
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
