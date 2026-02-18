import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '../api'

describe('API Service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('should fetch agents', async () => {
    const mockAgents = [{ id: 'agent-1', name: 'Agent 1' }]
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAgents)
    })

    const agents = await api.getAgents()

    expect(fetch).toHaveBeenCalledWith('/api/agents', undefined)
    expect(agents).toEqual(mockAgents)
  })

  it('should spawn agent with prompt', async () => {
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'session-123' })
    })

    const result = await api.spawnAgent('eda-analyst', 'Analyze data')

    expect(fetch).toHaveBeenCalledWith('/api/agents/eda-analyst/spawn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Analyze data' })
    })
    expect(result.sessionId).toBe('session-123')
  })
})
