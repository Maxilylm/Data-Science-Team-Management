import { useEffect, useRef, useState, useCallback } from 'react'

interface UseSSEOptions {
  onMessage?: (data: any) => void
  onError?: (error: Event) => void
  onOpen?: () => void
}

export function useSSE(url: string, options: UseSSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<any>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource(url)
    eventSourceRef.current = es

    es.addEventListener('open', () => {
      setIsConnected(true)
      options.onOpen?.()
    })

    es.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastEvent(data)
        options.onMessage?.(data)
      } catch {
        // Ignore parse errors
      }
    })

    es.addEventListener('error', (event) => {
      setIsConnected(false)
      options.onError?.(event)
    })
  }, [url, options])

  useEffect(() => {
    connect()

    return () => {
      eventSourceRef.current?.close()
    }
  }, [connect])

  return { isConnected, lastEvent, reconnect: connect }
}
