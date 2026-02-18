export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'needs_input'

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
  inputRequest?: InputRequest
  createdAt: string
  updatedAt: string
}

export interface InputRequest {
  question: string
  options?: string[]
  timestamp: string
}

export interface TaskCreate {
  subject: string
  description: string
  agentId?: string
}
