import { Router, Request, Response } from 'express'
import type { TicketService } from '../services/TicketService.js'
import type { ProviderManager } from '../providers/ProviderManager.js'
import type { AgentService } from '../services/AgentService.js'
import type { TicketStatus, TicketPriority } from '../types/Agent.js'
import { getConfig } from '../config.js'
import { readAgentSystemPrompt } from './utils.js'

export function createTicketsRouter(
  ticketService: TicketService,
  providerManager?: ProviderManager,
  agentService?: AgentService
): Router {
  const router = Router()

  router.get('/', (_req: Request, res: Response) => {
    res.json(ticketService.getAllTickets())
  })

  router.get('/summary', (_req: Request, res: Response) => {
    res.json(ticketService.getSummary())
  })

  router.get('/unassigned', (_req: Request, res: Response) => {
    res.json(ticketService.getUnassignedTickets())
  })

  router.get('/needs-help', (_req: Request, res: Response) => {
    res.json(ticketService.getTicketsNeedingHelp())
  })

  router.get('/agent/:agentId', (req: Request, res: Response) => {
    res.json(ticketService.getTicketsByAgent(req.params.agentId))
  })

  router.get('/:id', (req: Request, res: Response) => {
    const ticket = ticketService.getTicket(req.params.id)
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' })
      return
    }
    res.json(ticket)
  })

  router.post('/', (req: Request, res: Response) => {
    const { title, description, assignedTo, priority, parentTicketId, tags, createdBy } = req.body

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' })
      return
    }

    const ticket = ticketService.createTicket({
      title,
      description,
      createdBy: createdBy || 'user',
      assignedTo,
      priority: priority as TicketPriority,
      parentTicketId,
      tags
    })

    res.status(201).json(ticket)
  })

  router.patch('/:id', (req: Request, res: Response) => {
    const { title, description, status, priority, assignedTo, tags } = req.body

    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (status !== undefined) updates.status = status as TicketStatus
    if (priority !== undefined) updates.priority = priority as TicketPriority
    if (assignedTo !== undefined) updates.assignedTo = assignedTo
    if (tags !== undefined) updates.tags = tags

    const ticket = ticketService.updateTicket(req.params.id, updates)
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' })
      return
    }
    res.json(ticket)
  })

  // Assign ticket (and optionally auto-start the agent)
  router.post('/:id/assign', async (req: Request, res: Response) => {
    const { agentId, autoStart = true } = req.body
    const ticket = ticketService.assignTicket(req.params.id, agentId || null)
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' })
      return
    }

    if (autoStart && agentId && providerManager && agentService) {
      const agent = agentService.getAgent(agentId.toLowerCase())
      if (agent) {
        try {
          const config = getConfig()
          const prompt = `Work on ticket: "${ticket.title}"\n\nDescription: ${ticket.description}\n\nTicket ID: ${ticket.id}\nPriority: ${ticket.priority}\nTags: ${ticket.tags.join(', ') || 'none'}`

          const systemPrompt = readAgentSystemPrompt(agent.id)

          const sessionId = await providerManager.spawn({
            agentId: agent.id,
            userPrompt: prompt,
            systemPrompt,
            projectPath: config.projectPath,
            model: agent.model,
            tools: agent.tools,
            ticketId: ticket.id
          })

          const instanceId = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          agentService.addInstance(agent.id, {
            instanceId,
            sessionId,
            status: 'running',
            startedAt: new Date(),
            prompt: prompt.slice(0, 200),
            ticketId: ticket.id
          })

          ticketService.updateTicket(ticket.id, { status: 'in_progress' })
          console.log(`[Ticket] Auto-started ${agent.id} for ticket: ${ticket.title}`)
        } catch (err) {
          console.error(`[Ticket] Failed to auto-start agent ${agentId}:`, err)
        }
      }
    }

    res.json(ticket)
  })

  router.post('/:id/help', (req: Request, res: Response) => {
    const { fromAgent, message, targetAgent } = req.body
    if (!fromAgent || !message) {
      res.status(400).json({ error: 'fromAgent and message are required' })
      return
    }

    const ticket = ticketService.requestHelp(req.params.id, fromAgent, message, targetAgent)
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' })
      return
    }
    res.json(ticket)
  })

  router.post('/:id/resolve-help', (req: Request, res: Response) => {
    const ticket = ticketService.resolveHelp(req.params.id)
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' })
      return
    }
    res.json(ticket)
  })

  // Answer a question from an agent
  router.post('/:id/answer', async (req: Request, res: Response) => {
    const { answer } = req.body
    if (!answer) {
      res.status(400).json({ error: 'Answer is required' })
      return
    }

    const ticket = ticketService.getTicket(req.params.id)
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' })
      return
    }

    if (!providerManager || !agentService) {
      res.status(500).json({ error: 'Services not available' })
      return
    }

    const agent = ticket.assignedTo
      ? agentService.getAgent(ticket.assignedTo.toLowerCase())
      : null
    if (!agent) {
      res.status(400).json({ error: 'No agent assigned to this ticket' })
      return
    }

    // Try to send input to running instance
    const runningInstance = agent.instances.find(i => i.ticketId === ticket.id)
    if (runningInstance) {
      const success = providerManager.sendInput(runningInstance.sessionId, answer)
      if (success) {
        const updatedTicket = ticketService.updateTicket(ticket.id, {
          status: 'in_progress',
          helpRequest: undefined
        })
        agentService.updateInstanceStatus(agent.id, runningInstance.instanceId, 'running')
        res.json({ success: true, ticket: updatedTicket })
        return
      }
    }

    // Respawn with answer context
    const config = getConfig()
    try {
      const prompt = `Continue working on ticket: "${ticket.title}"

You previously asked: "${ticket.helpRequest?.message || 'a question'}"

User's answer: ${answer}

Original ticket description: ${ticket.description}

Please continue implementing based on this answer.

Ticket ID: ${ticket.id}`

      const systemPrompt = readAgentSystemPrompt(agent.id)

      const sessionId = await providerManager.spawn({
        agentId: agent.id,
        userPrompt: prompt,
        systemPrompt,
        projectPath: config.projectPath,
        model: agent.model,
        tools: agent.tools,
        ticketId: ticket.id
      })

      const instanceId = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      agentService.addInstance(agent.id, {
        instanceId,
        sessionId,
        status: 'running',
        startedAt: new Date(),
        prompt: prompt.slice(0, 200),
        ticketId: ticket.id
      })

      const updatedTicket = ticketService.updateTicket(ticket.id, {
        status: 'in_progress',
        helpRequest: undefined
      })

      console.log(`[Ticket] Resumed agent ${agent.id} for ticket: ${ticket.title}`)
      res.json({ success: true, ticket: updatedTicket, resumed: true })
    } catch (err) {
      console.error('[Ticket] Failed to resume agent:', err)
      res.status(500).json({ error: 'Failed to resume agent with answer' })
    }
  })

  router.delete('/:id', (req: Request, res: Response) => {
    const success = ticketService.deleteTicket(req.params.id)
    if (!success) {
      res.status(404).json({ error: 'Ticket not found' })
      return
    }
    res.json({ success: true })
  })

  return router
}

