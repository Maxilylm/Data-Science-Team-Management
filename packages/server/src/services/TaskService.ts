import * as fs from 'fs/promises'
import * as path from 'path'
import type { Task, TaskStatus } from '../types/Task'

interface StoredTask extends Task {
  sessionId: string
}

export class TaskService {
  private tasks: Map<string, StoredTask> = new Map()
  private tasksDir: string

  constructor(tasksDir?: string) {
    this.tasksDir = tasksDir || path.join(process.env.HOME || '', '.claude', 'tasks')
  }

  async loadAllTasks(): Promise<void> {
    this.tasks.clear()

    try {
      const sessions = await fs.readdir(this.tasksDir)

      for (const sessionId of sessions) {
        const sessionPath = path.join(this.tasksDir, sessionId)
        const stat = await fs.stat(sessionPath)

        if (!stat.isDirectory()) continue

        const files = await fs.readdir(sessionPath)
        const jsonFiles = files.filter(f => f.endsWith('.json'))

        for (const file of jsonFiles) {
          const filePath = path.join(sessionPath, file)
          try {
            const content = await fs.readFile(filePath, 'utf-8')
            const task = JSON.parse(content) as Task
            const key = `${sessionId}:${task.id}`
            this.tasks.set(key, { ...task, sessionId })
          } catch {
            // Skip invalid files
          }
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }

  updateTask(sessionId: string, task: Task): void {
    const key = `${sessionId}:${task.id}`
    this.tasks.set(key, { ...task, sessionId })
  }

  removeTask(sessionId: string, taskId: string): void {
    const key = `${sessionId}:${taskId}`
    this.tasks.delete(key)
  }

  getAllTasks(): StoredTask[] {
    return Array.from(this.tasks.values())
  }

  getTasksBySession(sessionId: string): StoredTask[] {
    return this.getAllTasks().filter(t => t.sessionId === sessionId)
  }

  getTasksByAgent(agentId: string): StoredTask[] {
    return this.getAllTasks().filter(t => t.agentId === agentId)
  }

  getTasksByStatus(status: TaskStatus): StoredTask[] {
    return this.getAllTasks().filter(t => t.status === status)
  }

  getTasksNeedingInput(): StoredTask[] {
    return this.getAllTasks().filter(t => t.status === 'needs_input' && t.inputRequest)
  }

  getTaskStats(): { pending: number; inProgress: number; completed: number; needsInput: number } {
    const tasks = this.getAllTasks()
    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      needsInput: tasks.filter(t => t.status === 'needs_input').length
    }
  }
}
