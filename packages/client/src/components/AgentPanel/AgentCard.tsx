import type { Agent } from '../../types'

interface AgentCardProps {
  agent: Agent
  onSpawn?: () => void
  onStop?: () => void
  onDelete?: () => void
  isDarkMode?: boolean
}

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
  </svg>
)

const getCardStyle = (isDark: boolean): React.CSSProperties => ({
  backgroundColor: isDark ? '#374151' : 'white',
  borderRadius: '8px',
  padding: '16px',
  boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
  marginBottom: '12px',
  color: isDark ? '#e5e7eb' : 'inherit'
})

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

export default function AgentCard({ agent, onSpawn, onStop, onDelete, isDarkMode = false }: AgentCardProps) {
  const instanceCount = agent.instances?.length || 0
  const isRunning = instanceCount > 0

  return (
    <div style={getCardStyle(isDarkMode)}>
      <div style={headerStyle}>
        <span style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: agent.color
        }} />
        <span style={{ fontWeight: 600 }}>{agent.name}</span>
        {instanceCount > 0 && (
          <span style={{
            backgroundColor: '#10b981',
            color: 'white',
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '10px',
            marginLeft: '4px'
          }}>
            {instanceCount} running
          </span>
        )}
        <span style={{
          marginLeft: 'auto',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusColors[agent.status]
        }} />
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete agent"
            className="btn btn--ghost btn--sm"
            style={{
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <TrashIcon />
          </button>
        )}
      </div>
      <div style={{ fontSize: '13px', color: isDarkMode ? '#9ca3af' : '#666', marginBottom: '12px' }}>
        {agent.description.slice(0, 100)}...
      </div>

      {/* Show running instances */}
      {agent.instances && agent.instances.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {agent.instances.map(instance => (
            <div key={instance.instanceId} style={{
              fontSize: '12px',
              backgroundColor: isDarkMode ? '#1f2937' : '#f0fdf4',
              padding: '6px 8px',
              borderRadius: '4px',
              marginBottom: '4px',
              borderLeft: `3px solid ${agent.color}`
            }}>
              <div style={{ color: isDarkMode ? '#86efac' : '#166534', fontWeight: 500 }}>
                {instance.prompt?.slice(0, 60)}...
              </div>
              {instance.parentInstanceId && (
                <div style={{ color: isDarkMode ? '#6ee7b7' : '#15803d', fontSize: '11px' }}>
                  ↳ spawned by another agent
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onSpawn}
          className="btn btn--primary"
          style={{ fontSize: '13px' }}
        >
          {isRunning ? '+ New Instance' : 'Spawn'}
        </button>
        {isRunning && (
          <button
            onClick={onStop}
            className="btn btn--danger"
            style={{ fontSize: '13px' }}
          >
            Stop All
          </button>
        )}
        <span style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#666', alignSelf: 'center' }}>
          {agent.model}
        </span>
      </div>
    </div>
  )
}
