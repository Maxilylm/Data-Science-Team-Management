import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSSE } from '../useSSE'

describe('useSSE', () => {
  let mockEventSource: any

  beforeEach(() => {
    mockEventSource = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn()
    }
    vi.stubGlobal('EventSource', vi.fn(() => mockEventSource))
  })

  it('should connect to SSE endpoint', () => {
    renderHook(() => useSSE('/api/events'))

    expect(EventSource).toHaveBeenCalledWith('/api/events')
  })

  it('should call onMessage when message received', () => {
    const onMessage = vi.fn()
    renderHook(() => useSSE('/api/events', { onMessage }))

    const messageHandler = mockEventSource.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )?.[1]

    act(() => {
      messageHandler({ data: JSON.stringify({ type: 'taskChange' }) })
    })

    expect(onMessage).toHaveBeenCalledWith({ type: 'taskChange' })
  })
})
