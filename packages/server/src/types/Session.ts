export interface Session {
  id: string
  agentId: string | null
  projectPath: string | null
  startedAt: string
  lastActivity: string
  taskIds: string[]
}
