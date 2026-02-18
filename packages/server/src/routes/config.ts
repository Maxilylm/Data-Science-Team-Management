import { Router, Request, Response } from 'express'
import { getConfig, updateConfig } from '../config'

export function createConfigRouter(): Router {
  const router = Router()

  // Get current config
  router.get('/', (_req: Request, res: Response) => {
    res.json(getConfig())
  })

  // Update config
  router.patch('/', (req: Request, res: Response) => {
    const { projectPath, projectName } = req.body
    const updates: Record<string, string> = {}

    if (projectPath) updates.projectPath = projectPath
    if (projectName) updates.projectName = projectName

    const updated = updateConfig(updates)
    res.json(updated)
  })

  return router
}
