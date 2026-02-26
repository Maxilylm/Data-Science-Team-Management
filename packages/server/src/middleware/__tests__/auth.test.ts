import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { authMiddleware } from '../auth.js'

vi.mock('../../config.js', () => ({
  loadSecrets: vi.fn()
}))

import { loadSecrets } from '../../config.js'

function createMocks(authHeader?: string) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {}
  } as unknown as Request

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  } as unknown as Response

  const next = vi.fn() as unknown as NextFunction

  return { req, res, next }
}

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('passes through when auth is disabled', () => {
    vi.mocked(loadSecrets).mockReturnValue({
      providers: {},
      auth: { enabled: false, tokens: [] }
    })

    const { req, res, next } = createMocks()
    authMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 401 when auth is enabled and no token provided', () => {
    vi.mocked(loadSecrets).mockReturnValue({
      providers: {},
      auth: { enabled: true, tokens: ['valid-token'] }
    })

    const { req, res, next } = createMocks()
    authMiddleware(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' })
  })

  it('returns 401 when auth is enabled and invalid token', () => {
    vi.mocked(loadSecrets).mockReturnValue({
      providers: {},
      auth: { enabled: true, tokens: ['valid-token'] }
    })

    const { req, res, next } = createMocks('Bearer wrong-token')
    authMiddleware(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' })
  })

  it('passes through when auth is enabled and valid token', () => {
    vi.mocked(loadSecrets).mockReturnValue({
      providers: {},
      auth: { enabled: true, tokens: ['valid-token'] }
    })

    const { req, res, next } = createMocks('Bearer valid-token')
    authMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 401 when authorization header has no Bearer prefix', () => {
    vi.mocked(loadSecrets).mockReturnValue({
      providers: {},
      auth: { enabled: true, tokens: ['valid-token'] }
    })

    const { req, res, next } = createMocks('valid-token')
    authMiddleware(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
  })
})
