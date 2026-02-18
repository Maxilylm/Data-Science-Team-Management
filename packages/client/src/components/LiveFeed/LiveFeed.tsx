interface FeedEvent {
  type: string
  timestamp: Date
  agentId?: string
  data?: string
}

interface LiveFeedProps {
  events: FeedEvent[]
  maxEvents?: number
}

const feedStyle: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#e5e7eb',
  borderRadius: '8px',
  padding: '12px',
  fontFamily: 'monospace',
  fontSize: '12px',
  height: '200px',
  overflowY: 'auto'
}

const eventStyle: React.CSSProperties = {
  padding: '4px 0',
  borderBottom: '1px solid #374151'
}

function getEventColor(type: string): string {
  switch (type) {
    case 'taskChange': return '#10b981'
    case 'agentOutput': return '#3b82f6'
    case 'agentClosed': return '#f59e0b'
    case 'error': return '#ef4444'
    default: return '#9ca3af'
  }
}

export default function LiveFeed({ events, maxEvents = 50 }: LiveFeedProps) {
  const displayEvents = events.slice(-maxEvents)

  return (
    <div>
      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
        Live Activity
      </h3>
      <div style={feedStyle}>
        {displayEvents.length === 0 ? (
          <div style={{ color: '#6b7280' }}>Waiting for activity...</div>
        ) : (
          displayEvents.map((event, i) => (
            <div key={i} style={eventStyle}>
              <span style={{ color: '#9ca3af' }}>
                {event.timestamp.toLocaleTimeString()}
              </span>
              {' '}
              <span style={{ color: getEventColor(event.type) }}>
                [{event.type}]
              </span>
              {' '}
              {event.agentId && (
                <span style={{ color: '#60a5fa' }}>{event.agentId}: </span>
              )}
              <span>{event.data?.slice(0, 100)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
