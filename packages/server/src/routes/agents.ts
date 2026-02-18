import { Router, Request, Response } from 'express'
import type { AgentService } from '../services/AgentService'
import type { ClaudeRunner } from '../services/ClaudeRunner'

export function createAgentsRouter(
  agentService: AgentService,
  claudeRunner: ClaudeRunner
): Router {
  const router = Router()

  router.get('/', (_req: Request, res: Response) => {
    const agents = agentService.getAllAgents()
    res.json(agents)
  })

  // Create a new agent
  router.post('/', async (req: Request, res: Response) => {
    const { id, name, description, model, color, systemPrompt } = req.body

    if (!id || !name || !description) {
      res.status(400).json({ error: 'id, name, and description are required' })
      return
    }

    // Check if agent already exists
    if (agentService.getAgent(id)) {
      res.status(409).json({ error: 'Agent with this ID already exists' })
      return
    }

    try {
      const agent = await agentService.createAgent(
        id,
        { name, description, model, color },
        systemPrompt || `You are ${name}. ${description}`
      )
      res.status(201).json(agent)
    } catch (error) {
      res.status(500).json({ error: 'Failed to create agent' })
    }
  })

  router.get('/:id', (req: Request, res: Response) => {
    const agent = agentService.getAgent(req.params.id)
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' })
      return
    }
    res.json(agent)
  })

  router.post('/:id/spawn', async (req: Request, res: Response) => {
    const agent = agentService.getAgent(req.params.id)
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' })
      return
    }

    const { prompt, projectPath } = req.body
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' })
      return
    }

    try {
      const sessionId = await claudeRunner.spawn({
        agentId: agent.id,
        prompt,
        projectPath,
        model: agent.model
      })

      agentService.updateAgentStatus(agent.id, 'running', sessionId)

      res.json({ sessionId, agentId: agent.id })
    } catch {
      res.status(500).json({ error: 'Failed to spawn agent' })
    }
  })

  router.post('/:id/input', (req: Request, res: Response) => {
    const agent = agentService.getAgent(req.params.id)
    if (!agent || !agent.sessionId) {
      res.status(404).json({ error: 'Agent not running' })
      return
    }

    const { input } = req.body
    const success = claudeRunner.sendInput(agent.sessionId, input)

    if (success) {
      res.json({ success: true })
    } else {
      res.status(400).json({ error: 'Failed to send input' })
    }
  })

  router.post('/:id/stop', (req: Request, res: Response) => {
    const agent = agentService.getAgent(req.params.id)
    if (!agent || !agent.sessionId) {
      res.status(404).json({ error: 'Agent not running' })
      return
    }

    const success = claudeRunner.terminate(agent.sessionId)
    if (success) {
      agentService.updateAgentStatus(agent.id, 'idle', undefined)
      res.json({ success: true })
    } else {
      res.status(400).json({ error: 'Failed to stop agent' })
    }
  })

  router.delete('/:id', async (req: Request, res: Response) => {
    const agent = agentService.getAgent(req.params.id)
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' })
      return
    }

    // Stop the agent if running
    if (agent.sessionId) {
      claudeRunner.terminate(agent.sessionId)
    }

    try {
      await agentService.deleteAgent(req.params.id)
      res.json({ success: true })
    } catch {
      res.status(500).json({ error: 'Failed to delete agent' })
    }
  })

  return router
}
