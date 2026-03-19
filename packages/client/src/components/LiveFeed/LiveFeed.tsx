import { useState, useRef, useEffect } from 'react'

interface FeedEvent {
  type: string
  timestamp: Date
  agentId?: string
  data?: string
  ticketId?: string
  question?: string
}

interface LiveFeedProps {
  events: FeedEvent[]
  maxEvents?: number
  onAnswerQuestion?: (ticketId: string, answer: string) => void
  isDarkMode?: boolean
}

const getFeedStyle = (isDark: boolean): React.CSSProperties => ({
  backgroundColor: isDark ? '#111827' : '#f9fafb',
  color: isDark ? '#e5e7eb' : '#1f2937',
  borderRadius: '8px',
  padding: '12px',
  fontFamily: 'monospace',
  fontSize: '12px',
  overflowY: 'auto',
  border: isDark ? '1px solid #374151' : '1px solid #e5e7eb'
})

const getEventStyle = (isDark: boolean): React.CSSProperties => ({
  padding: '6px 0',
  borderBottom: isDark ? '1px solid #374151' : '1px solid #e5e7eb'
})

function getEventColor(type: string): string {
  switch (type) {
    case 'taskChange': return '#10b981'
    case 'agentOutput': return '#3b82f6'
    case 'agentClosed': return '#f59e0b'
    case 'agentQuestion': return '#ef4444'
    case 'agentChained': return '#8b5cf6'
    case 'ticketCreated': return '#8b5cf6'
    case 'ticketUpdated': return '#8b5cf6'
    case 'workflowStarted': return '#10b981'
    case 'workflowCompleted': return '#10b981'
    case 'error': return '#ef4444'
    default: return '#9ca3af'
  }
}

function getEventIcon(type: string): string {
  switch (type) {
    case 'taskChange': return '📋'
    case 'agentOutput': return '💬'
    case 'agentClosed': return '✅'
    case 'agentQuestion': return '❓'
    case 'agentChained': return '🔗'
    case 'ticketCreated': return '🎫'
    case 'ticketUpdated': return '🔄'
    case 'workflowStarted': return '▶️'
    case 'workflowCompleted': return '🏁'
    case 'error': return '❌'
    default: return '•'
  }
}

export default function LiveFeed({ events, maxEvents = 100, onAnswerQuestion, isDarkMode = false }: LiveFeedProps) {
  const [expanded, setExpanded] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({})
  const feedRef = useRef<HTMLDivElement>(null)
  const displayEvents = events.slice(-maxEvents)

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (feedRef.current && expanded) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [events.length, expanded])

  const agentOutputCount = displayEvents.filter(e => e.type === 'agentOutput').length

  return (
    <div style={{ padding: '12px 24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: isDarkMode ? '#e5e7eb' : 'inherit' }}>
          Live Activity
          {agentOutputCount > 0 && (
            <span style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '11px'
            }}>
              {agentOutputCount} outputs
            </span>
          )}
        </h3>
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: isDarkMode ? '#9ca3af' : '#6b7280'
          }}
        >
          {expanded ? '▼' : '▲'}
        </button>
      </div>

      {expanded && (
        <div ref={feedRef} style={{ ...getFeedStyle(isDarkMode), height: '250px' }}>
          {displayEvents.length === 0 ? (
            <div style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', textAlign: 'center', padding: '20px' }}>
              Waiting for activity...
            </div>
          ) : (
            displayEvents.map((event, i) => {
              const eventKey = `${event.timestamp.getTime()}-${event.type}-${i}`
              return (
              <div
                key={eventKey}
                style={{
                  ...getEventStyle(isDarkMode),
                  backgroundColor: selectedEvent === i ? (isDarkMode ? '#374151' : '#e5e7eb') : 'transparent',
                  cursor: event.data && event.data.length > 100 ? 'pointer' : 'default',
                  borderRadius: '4px',
                  padding: '8px',
                  marginBottom: '4px'
                }}
                onClick={() => setSelectedEvent(selectedEvent === i ? null : i)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>{getEventIcon(event.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                        {event.timestamp.toLocaleTimeString()}
                      </span>
                      <span style={{
                        color: getEventColor(event.type),
                        fontSize: '11px',
                        backgroundColor: getEventColor(event.type) + '20',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        {event.type}
                      </span>
                      {event.agentId && (
                        <span style={{
                          color: '#60a5fa',
                          fontSize: '11px',
                          fontWeight: 500
                        }}>
                          {event.agentId}
                        </span>
                      )}
                    </div>
                    <div style={{
                      color: isDarkMode ? '#d1d5db' : '#374151',
                      whiteSpace: selectedEvent === i ? 'pre-wrap' : 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      wordBreak: 'break-word'
                    }}>
                      {event.type === 'agentQuestion' ? (
                        <span style={{ color: '#fca5a5', fontWeight: 500 }}>
                          {event.question || event.data}
                        </span>
                      ) : (
                        <>
                          {selectedEvent === i ? event.data : event.data?.slice(0, 150)}
                          {event.data && event.data.length > 150 && selectedEvent !== i && (
                            <span style={{ color: '#6b7280' }}> ...</span>
                          )}
                        </>
                      )}
                    </div>
                    {/* Inline answer for question events */}
                    {event.type === 'agentQuestion' && event.ticketId && onAnswerQuestion && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Quick answer..."
                          value={answerInputs[eventKey] || ''}
                          onChange={(e) => setAnswerInputs(prev => ({ ...prev, [eventKey]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && answerInputs[eventKey]?.trim() && event.ticketId) {
                              onAnswerQuestion(event.ticketId, answerInputs[eventKey].trim())
                              setAnswerInputs(prev => ({ ...prev, [eventKey]: '' }))
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            fontSize: '12px',
                            backgroundColor: isDarkMode ? '#374151' : 'white',
                            border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                            borderRadius: '4px',
                            color: isDarkMode ? 'white' : '#1f2937'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (answerInputs[eventKey]?.trim() && event.ticketId) {
                              onAnswerQuestion(event.ticketId, answerInputs[eventKey].trim())
                              setAnswerInputs(prev => ({ ...prev, [eventKey]: '' }))
                            }
                          }}
                          disabled={!answerInputs[eventKey]?.trim()}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: answerInputs[eventKey]?.trim() ? '#16a34a' : (isDarkMode ? '#4b5563' : '#9ca3af'),
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: answerInputs[eventKey]?.trim() ? 'pointer' : 'not-allowed'
                          }}
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
      )}
    </div>
  )
}
