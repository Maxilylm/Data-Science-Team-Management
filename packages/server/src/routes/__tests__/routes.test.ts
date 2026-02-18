import { describe, it, expect, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import { createAgentsRouter } from '../agents'
import { createTasksRouter } from '../tasks'

describe('API Routes', () => {
  describe('Agents Router', () => {
    it('should return all agents', async () => {
      const mockAgentService = {
        getAllAgents: vi.fn().mockReturnValue([
          { id: 'agent-1', name: 'Agent 1', status: 'idle' }
        ])
      } as any

      const app = express()
      app.use('/api/agents', createAgentsRouter(mockAgentService, {} as any))

      const response = await request(app).get('/api/agents')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(1)
      expect(response.body[0].name).toBe('Agent 1')
    })
  })

  describe('Tasks Router', () => {
    it('should return tasks grouped by status for kanban', async () => {
      const mockTaskService = {
        getAllTasks: vi.fn().mockReturnValue([
          { id: '1', subject: 'Task 1', status: 'pending' },
          { id: '2', subject: 'Task 2', status: 'in_progress' },
          { id: '3', subject: 'Task 3', status: 'completed' }
        ])
      } as any

      const app = express()
      app.use('/api/tasks', createTasksRouter(mockTaskService))

      const response = await request(app).get('/api/tasks/kanban')

      expect(response.status).toBe(200)
      expect(response.body.pending).toHaveLength(1)
      expect(response.body.in_progress).toHaveLength(1)
      expect(response.body.completed).toHaveLength(1)
    })
  })
})
