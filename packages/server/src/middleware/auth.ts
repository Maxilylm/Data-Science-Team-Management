import type { Request, Response, NextFunction } from 'express'
import { loadSecrets } from '../config.js'

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const secrets = loadSecrets()

  // If auth is disabled, pass through
  if (!secrets.auth.enabled) {
    next()
    return
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const token = authHeader.slice(7)
  if (!secrets.auth.tokens.includes(token)) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  next()
}
