import type { Agent } from '../../types'

interface AgentCardProps {
  agent: Agent
  onSpawn?: () => void
  onStop?: () => void
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  marginBottom: '12px'
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '8px'
}

const statusColors: Record<string, string> = {
  idle: '#9ca3af',
  running: '#10b981',
  waiting_input: '#f59e0b',
  error: '#ef4444'
}

export default function AgentCard({ agent, onSpawn, onStop }: AgentCardProps) {
  const isRunning = agent.status === 'running' || agent.status === 'waiting_input'

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: agent.color
        }} />
        <span style={{ fontWeight: 600 }}>{agent.name}</span>
        <span style={{
          marginLeft: 'auto',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusColors[agent.status]
        }} />
      </div>
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
        {agent.description.slice(0, 100)}...
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {!isRunning ? (
          <button
            onClick={onSpawn}
            style={{
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Spawn
          </button>
        ) : (
          <button
            onClick={onStop}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Stop
          </button>
        )}
        <span style={{ fontSize: '12px', color: '#666', alignSelf: 'center' }}>
          {agent.model}
        </span>
      </div>
    </div>
  )
}
