import { Router, Request, Response } from 'express'
import type { FileWatcher } from '../services/FileWatcher'
import type { ClaudeRunner } from '../services/ClaudeRunner'
import type { TicketService } from '../services/TicketService'
import type { WorkflowService } from '../services/WorkflowService'

export function createEventsRouter(
  fileWatcher: FileWatcher,
  claudeRunner: ClaudeRunner,
  ticketService?: TicketService,
  workflowService?: WorkflowService
): Router {
  const router = Router()
  const clients: Set<Response> = new Set()

  router.get('/', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    clients.add(res)

    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

    req.on('close', () => {
      clients.delete(res)
    })
  })

  function broadcast(event: object): void {
    const data = `data: ${JSON.stringify(event)}\n\n`
    for (const client of clients) {
      client.write(data)
    }
  }

  fileWatcher.on('taskChange', (event) => {
    broadcast({ type: 'taskChange', ...event })
  })

  claudeRunner.on('output', (event) => {
    broadcast({ type: 'agentOutput', ...event })
  })

  claudeRunner.on('close', (event) => {
    broadcast({ type: 'agentClosed', ...event })
  })

  claudeRunner.on('question', (event) => {
    broadcast({ type: 'agentQuestion', ...event })
  })

  claudeRunner.on('inputProvided', (event) => {
    broadcast({ type: 'agentInputProvided', ...event })
  })

  // Ticket events
  if (ticketService) {
    ticketService.on('ticketCreated', (ticket) => {
      broadcast({ type: 'ticketCreated', ticket })
    })

    ticketService.on('ticketUpdated', (ticket) => {
      broadcast({ type: 'ticketUpdated', ticket })
    })

    ticketService.on('ticketDeleted', (ticket) => {
      broadcast({ type: 'ticketDeleted', ticketId: ticket.id })
    })
  }

  // Workflow events
  if (workflowService) {
    workflowService.on('workflowStarted', (event) => {
      broadcast({ type: 'workflowStarted', ...event })
    })

    workflowService.on('workflowCompleted', (event) => {
      broadcast({ type: 'workflowCompleted', ...event })
    })

    workflowService.on('agentChained', (event) => {
      broadcast({ type: 'agentChained', ...event })
    })
  }

  return router
}
