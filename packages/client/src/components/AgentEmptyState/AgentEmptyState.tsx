import type { AgentStatus } from '../../types'

interface AgentEmptyStateProps {
  agentStatus: AgentStatus
  onAssignTicket: () => void
  isDarkMode?: boolean
}

const isRunning = (status: AgentStatus) => status === 'running'

export default function AgentEmptyState({ agentStatus, onAssignTicket, isDarkMode = false }: AgentEmptyStateProps) {
  const textColor = isDarkMode ? '#6b7280' : '#9ca3af'
  const subTextColor = isDarkMode ? '#4b5563' : '#d1d5db'

  return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.4 }}>
        {isRunning(agentStatus) ? '⚡' : '📋'}
      </div>
      <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 500, color: textColor }}>
        No tickets assigned
      </p>
      {isRunning(agentStatus) ? (
        <p style={{ margin: 0, fontSize: '12px', color: subTextColor }}>
          Assign tickets to queue them up
        </p>
      ) : (
        <button
          onClick={onAssignTicket}
          className="btn btn--ghost btn--sm"
          style={{
            marginTop: '8px',
            color: isDarkMode ? '#6b7280' : '#9ca3af',
            border: `1px dashed ${isDarkMode ? '#4b5563' : '#d1d5db'}`
          }}
        >
          Assign a ticket
        </button>
      )}
    </div>
  )
}
