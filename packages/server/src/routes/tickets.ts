import { Router, Request, Response } from 'express'
import type { TicketService } from '../services/TicketService'
import type { ClaudeRunner } from '../services/ClaudeRunner'
import type { AgentService } from '../services/AgentService'
import type { TicketStatus, TicketPriority } from '../types/Agent'
import { getConfig } from '../config'

export function createTicketsRouter(
  ticketService: TicketService,
  claudeRunner?: ClaudeRunner,
  agentService?: AgentService
): Router {
  const router = Router()

  // Get all tickets
  router.get('/', (_req: Request, res: Response) => {
    res.json(ticketService.getAllTickets())
  })

  // Get ticket summary
  router.get('/summary', (_req: Request, res: Response) => {
    res.json(ticketService.getSummary())
  })

  // Get unassigned tickets
  router.get('/unassigned', (_req: Request, res: Response) => {
    res.json(ticketService.getUnassignedTickets())
  })

  // Get tickets needing help
  router.get('/needs-help', (_req: Request, res: Response) => {
    res.json(ticketService.getTicketsNeedingHelp())
  })

  // Get tickets by agent
  router.get('/agent/:agentId', (req: Request, res: Response) => {
    res.json(ticketService.getTicketsByAgent(req.params.agentId))
  })

  // Get single ticket
  router.get('/:id', (req: Request, res: Response) => {
    const ticket = ticketService.getTicket(req.params.id)
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' })
      return
    }
    res.json(ticket)
  })

  // Create ticket
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

  // Update ticket
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

    // Auto-start the assigned agent if requested and services are available
    if (autoStart && agentId && claudeRunner && agentService) {
      const agent = agentService.getAgent(agentId.toLowerCase())
      if (agent) {
        try {
          const config = getConfig()
          const prompt = `Work on ticket: "${ticket.title}"\n\nDescription: ${ticket.description}\n\nTicket ID: ${ticket.id}\nPriority: ${ticket.priority}\nTags: ${ticket.tags.join(', ') || 'none'}`

          const sessionId = await claudeRunner.spawn({
            agentId: agent.id,
            prompt,
            projectPath: config.projectPath,
            model: agent.model,
            allowedTools: agent.tools,
            ticketId: ticket.id
          })

          // Create instance for tracking
          const instanceId = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          agentService.addInstance(agent.id, {
            instanceId,
            sessionId,
            status: 'running',
            startedAt: new Date(),
            prompt: prompt.slice(0, 200),
            ticketId: ticket.id
          })

          // Update ticket status to in_progress
          ticketService.updateTicket(ticket.id, { status: 'in_progress' })

          console.log(`[Ticket] Auto-started ${agent.id} for ticket: ${ticket.title}`)
        } catch (err) {
          console.error(`[Ticket] Failed to auto-start agent ${agentId}:`, err)
        }
      }
    }

    res.json(ticket)
  })

  // Request help
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

  // Resolve help request
  router.post('/:id/resolve-help', (req: Request, res: Response) => {
    const ticket = ticketService.resolveHelp(req.params.id)
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' })
      return
    }
    res.json(ticket)
  })

  // Answer a question from an agent (send input and resume)
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

    if (!claudeRunner || !agentService) {
      res.status(500).json({ error: 'Services not available' })
      return
    }

    // Find the agent assigned to this ticket
    const agent = ticket.assignedTo ? agentService.getAgent(ticket.assignedTo.toLowerCase()) : null
    if (!agent) {
      res.status(400).json({ error: 'No agent assigned to this ticket' })
      return
    }

    // Check if there's a running instance we can send input to
    const runningInstance = agent.instances.find(i => i.ticketId === ticket.id)
    if (runningInstance) {
      // Try to send input to running process
      const success = claudeRunner.sendInput(runningInstance.sessionId, answer)
      if (success) {
        // Update ticket status back to in_progress
        const updatedTicket = ticketService.updateTicket(ticket.id, {
          status: 'in_progress',
          helpRequest: undefined
        })
        agentService.updateInstanceStatus(agent.id, runningInstance.instanceId, 'running')
        res.json({ success: true, ticket: updatedTicket })
        return
      }
    }

    // No running instance or input failed - respawn the agent with the answer as context
    // Note: Claude CLI --resume requires UUID session IDs which we don't have
    // So we provide the answer as continuation context in a new prompt
    const config = getConfig()

    try {
      const prompt = `Continue working on ticket: "${ticket.title}"

You previously asked: "${ticket.helpRequest?.message || 'a question'}"

User's answer: ${answer}

Original ticket description: ${ticket.description}

Please continue implementing based on this answer.

Ticket ID: ${ticket.id}`

      const sessionId = await claudeRunner.spawn({
        agentId: agent.id,
        prompt,
        projectPath: config.projectPath,
        model: agent.model,
        allowedTools: agent.tools,
        ticketId: ticket.id
        // Don't use resumeSessionId - our session IDs aren't valid UUIDs for Claude CLI
      })

      // Create new instance for tracking
      const instanceId = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      agentService.addInstance(agent.id, {
        instanceId,
        sessionId,
        status: 'running',
        startedAt: new Date(),
        prompt: prompt.slice(0, 200),
        ticketId: ticket.id
      })

      // Update ticket status back to in_progress
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

  // Delete ticket
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
