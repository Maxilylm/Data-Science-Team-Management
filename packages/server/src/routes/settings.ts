import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import type { ProviderManager } from '../providers/ProviderManager.js'
import {
  getConfig,
  updateConfig,
  loadSecrets,
  saveSecrets,
  maskApiKey
} from '../config.js'

export function createSettingsRouter(
  providerManager: ProviderManager
): Router {
  const router = Router()

  // List available providers
  router.get('/providers', async (_req: Request, res: Response) => {
    const providers = await providerManager.getAvailableProviders()
    const activeId = providerManager.getActiveProviderId()
    const config = getConfig()

    const result = providers.map((p) => ({
      ...p,
      isActive: p.id === activeId,
      config: getMaskedProviderConfig(p.id, config.provider?.configs)
    }))

    res.json(result)
  })

  // Set active provider
  router.patch('/provider', (req: Request, res: Response) => {
    const { providerId } = req.body
    if (!providerId) {
      res.status(400).json({ error: 'providerId is required' })
      return
    }

    try {
      providerManager.setActiveProvider(providerId)
      const config = getConfig()
      updateConfig({
        provider: {
          active: providerId,
          configs: config.provider?.configs || {}
        }
      })
      res.json({ success: true, activeProvider: providerId })
    } catch (err) {
      res.status(400).json({ error: (err as Error).message })
    }
  })

  // Update provider config
  router.patch('/provider/:id/config', (req: Request, res: Response) => {
    const providerId = req.params.id
    const providerConfig = req.body

    // Separate secrets from regular config
    const { apiKey, ...publicConfig } = providerConfig

    // Save API key to secrets if provided
    if (apiKey) {
      const secrets = loadSecrets()
      if (!secrets.providers[providerId]) {
        secrets.providers[providerId] = {}
      }
      secrets.providers[providerId].apiKey = apiKey
      saveSecrets(secrets)

      // Also configure the provider in memory
      providerManager.configureProvider(providerId, { apiKey })
    }

    // Save public config
    if (Object.keys(publicConfig).length > 0) {
      const config = getConfig()
      const configs = config.provider?.configs || {}
      configs[providerId] = { ...configs[providerId], ...publicConfig }
      updateConfig({
        provider: {
          active: config.provider?.active || 'claude-cli',
          configs
        }
      })

      providerManager.configureProvider(providerId, publicConfig)
    }

    res.json({ success: true })
  })

  // Test provider connectivity
  router.post('/provider/:id/test', async (req: Request, res: Response) => {
    const providerId = req.params.id
    const isAvailable = await providerManager.testProvider(providerId)
    res.json({ providerId, isAvailable })
  })

  // Get auth config
  router.get('/auth', (_req: Request, res: Response) => {
    const secrets = loadSecrets()
    res.json({
      enabled: secrets.auth.enabled,
      tokenCount: secrets.auth.tokens.length
    })
  })

  // Update auth config
  router.patch('/auth', (req: Request, res: Response) => {
    const { enabled } = req.body
    const secrets = loadSecrets()

    if (typeof enabled === 'boolean') {
      secrets.auth.enabled = enabled
    }

    saveSecrets(secrets)
    res.json({
      enabled: secrets.auth.enabled,
      tokenCount: secrets.auth.tokens.length
    })
  })

  // Generate a new auth token
  router.post('/auth/token', (_req: Request, res: Response) => {
    const secrets = loadSecrets()
    const token = crypto.randomBytes(32).toString('hex')
    secrets.auth.tokens.push(token)
    saveSecrets(secrets)

    res.json({ token })
  })

  // Delete an auth token
  router.delete('/auth/token', (req: Request, res: Response) => {
    const { token } = req.body
    if (!token) {
      res.status(400).json({ error: 'token is required' })
      return
    }

    const secrets = loadSecrets()
    secrets.auth.tokens = secrets.auth.tokens.filter(t => t !== token)
    saveSecrets(secrets)

    res.json({ success: true })
  })

  return router
}

function getMaskedProviderConfig(
  providerId: string,
  configs?: Record<string, Record<string, unknown>>
): Record<string, unknown> {
  const config = configs?.[providerId] || {}
  const secrets = loadSecrets()
  const providerSecrets = secrets.providers[providerId] || {}

  const masked: Record<string, unknown> = { ...config }

  if (providerSecrets.apiKey) {
    masked.apiKey = maskApiKey(providerSecrets.apiKey)
  }

  return masked
}
