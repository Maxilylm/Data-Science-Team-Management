import { useEffect, useRef, useState, useCallback } from 'react'

export type SSEStatus = 'connected' | 'reconnecting' | 'disconnected'

interface UseSSEOptions {
  onMessage?: (data: any) => void
  onError?: (error: Event) => void
  onOpen?: () => void
}

const MAX_BACKOFF_MS = 30_000

export function useSSE(url: string, options: UseSSEOptions = {}) {
  const [status, setStatus] = useState<SSEStatus>('reconnecting')
  const [lastEvent, setLastEvent] = useState<any>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const backoffRef = useRef(1000)
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    if (retryRef.current) {
      clearTimeout(retryRef.current)
      retryRef.current = null
    }

    const es = new EventSource(url)
    eventSourceRef.current = es

    es.addEventListener('open', () => {
      setStatus('connected')
      backoffRef.current = 1000
      optionsRef.current.onOpen?.()
    })

    es.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastEvent(data)
        optionsRef.current.onMessage?.(data)
      } catch {
        console.warn('[SSE] Failed to parse event:', event.data?.slice(0, 100))
      }
    })

    es.addEventListener('error', (event) => {
      setStatus('reconnecting')
      es.close()
      optionsRef.current.onError?.(event)

      const delay = backoffRef.current
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS)
      retryRef.current = setTimeout(connect, delay)
    })
  }, [url])

  useEffect(() => {
    connect()

    return () => {
      eventSourceRef.current?.close()
      if (retryRef.current) {
        clearTimeout(retryRef.current)
        setStatus('disconnected')
      }
    }
  }, [connect])

  return { isConnected: status === 'connected', status, lastEvent, reconnect: connect }
}
