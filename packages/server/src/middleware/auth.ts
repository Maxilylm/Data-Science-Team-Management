import type { Request, Response, NextFunction } from 'express'
import { getSecrets } from '../config.js'

// Must match: settings router mount (/api/settings) + auth route (/auth)
const EXEMPT_PATHS = ['/api/settings/auth']

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const secrets = getSecrets()

  // If auth is disabled, pass through
  if (!secrets.auth.enabled) {
    next()
    return
  }

  // Exempt paths are always accessible regardless of auth status
  if (EXEMPT_PATHS.includes(req.path)) {
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
