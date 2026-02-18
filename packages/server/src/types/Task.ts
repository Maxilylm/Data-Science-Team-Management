export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'needs_input'

export interface Task {
  id: string
  subject: string
  description: string
  status: TaskStatus
  /** ID of agent executing this task, or null if unassigned */
  agentId: string | null
  sessionId: string
  /** Present continuous form displayed while task runs (e.g., "Running tests") */
  activeFormDisplay?: string
  /** IDs of tasks that cannot start until this task completes */
  blocks: string[]
  /** IDs of tasks that must complete before this task can start */
  blockedBy: string[]
  /** Request for user input; present only when status === 'needs_input' */
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
