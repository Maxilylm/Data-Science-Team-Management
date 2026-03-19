import type { Agent } from '../../types'
import AgentCard from './AgentCard'

interface AgentPanelProps {
  agents: Agent[]
  onSpawnAgent: (agentId: string) => void
  onStopAgent: (agentId: string) => void
  onDeleteAgent?: (agentId: string) => void
  onCreateAgent?: () => void
  isDarkMode?: boolean
}

const getPanelStyle = (isDark: boolean): React.CSSProperties => ({
  width: '300px',
  backgroundColor: isDark ? '#1f2937' : '#f9fafb',
  padding: '16px',
  borderRight: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
  height: '100vh',
  overflowY: 'auto',
  color: isDark ? '#e5e7eb' : 'inherit'
})

const getTitleStyle = (isDark: boolean): React.CSSProperties => ({
  fontSize: '18px',
  fontWeight: 600,
  color: isDark ? '#e5e7eb' : 'inherit'
})

const getSectionLabelStyle = (isDark: boolean): React.CSSProperties => ({
  fontSize: '12px',
  color: isDark ? '#9ca3af' : '#666',
  marginBottom: '8px'
})

export default function AgentPanel({ agents, onSpawnAgent, onStopAgent, onDeleteAgent, onCreateAgent, isDarkMode = false }: AgentPanelProps) {
  const runningAgents = agents.filter(a => a.status !== 'idle')
  const idleAgents = agents.filter(a => a.status === 'idle')

  return (
    <div style={getPanelStyle(isDarkMode)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={getTitleStyle(isDarkMode)}>Agents</div>
        {onCreateAgent && (
          <button
            onClick={onCreateAgent}
            className="btn btn--success btn--sm"
          >
            + New
          </button>
        )}
      </div>

      {runningAgents.length > 0 && (
        <>
          <div style={getSectionLabelStyle(isDarkMode)}>
            ACTIVE ({runningAgents.length})
          </div>
          {runningAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onStop={() => onStopAgent(agent.id)}
              onDelete={onDeleteAgent ? () => onDeleteAgent(agent.id) : undefined}
              isDarkMode={isDarkMode}
            />
          ))}
        </>
      )}

      <div style={{ ...getSectionLabelStyle(isDarkMode), marginTop: '16px' }}>
        AVAILABLE ({idleAgents.length})
      </div>
      {idleAgents.map(agent => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onSpawn={() => onSpawnAgent(agent.id)}
          onDelete={onDeleteAgent ? () => onDeleteAgent(agent.id) : undefined}
          isDarkMode={isDarkMode}
        />
      ))}
    </div>
  )
}
