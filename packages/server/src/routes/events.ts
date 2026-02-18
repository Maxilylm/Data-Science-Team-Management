import { Router, Request, Response } from 'express'
import type { FileWatcher } from '../services/FileWatcher'
import type { ClaudeRunner } from '../services/ClaudeRunner'

export function createEventsRouter(
  fileWatcher: FileWatcher,
  claudeRunner: ClaudeRunner
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

  return router
}
