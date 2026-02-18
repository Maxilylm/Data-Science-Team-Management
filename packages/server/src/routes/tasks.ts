import { Router, Request, Response } from 'express'
import type { TaskService } from '../services/TaskService'

export function createTasksRouter(taskService: TaskService): Router {
  const router = Router()

  router.get('/', (_req: Request, res: Response) => {
    const tasks = taskService.getAllTasks()
    res.json(tasks)
  })

  router.get('/kanban', (_req: Request, res: Response) => {
    const tasks = taskService.getAllTasks()
    const kanban = {
      pending: tasks.filter(t => t.status === 'pending'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      completed: tasks.filter(t => t.status === 'completed'),
      needs_input: tasks.filter(t => t.status === 'needs_input')
    }
    res.json(kanban)
  })

  router.get('/stats', (_req: Request, res: Response) => {
    const stats = taskService.getTaskStats()
    res.json(stats)
  })

  router.get('/needs-input', (_req: Request, res: Response) => {
    const tasks = taskService.getTasksNeedingInput()
    res.json(tasks)
  })

  router.get('/agent/:agentId', (req: Request, res: Response) => {
    const tasks = taskService.getTasksByAgent(req.params.agentId)
    res.json(tasks)
  })

  router.get('/session/:sessionId', (req: Request, res: Response) => {
    const tasks = taskService.getTasksBySession(req.params.sessionId)
    res.json(tasks)
  })

  return router
}
