import type { Agent } from '../../types'
import AgentCard from './AgentCard'

interface AgentPanelProps {
  agents: Agent[]
  onSpawnAgent: (agentId: string) => void
  onStopAgent: (agentId: string) => void
  onCreateAgent?: () => void
}

const panelStyle: React.CSSProperties = {
  width: '300px',
  backgroundColor: '#f9fafb',
  padding: '16px',
  borderRight: '1px solid #e5e7eb',
  height: '100vh',
  overflowY: 'auto'
}

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600
}

export default function AgentPanel({ agents, onSpawnAgent, onStopAgent, onCreateAgent }: AgentPanelProps) {
  const runningAgents = agents.filter(a => a.status !== 'idle')
  const idleAgents = agents.filter(a => a.status === 'idle')

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={titleStyle}>Agents</div>
        {onCreateAgent && (
          <button
            onClick={onCreateAgent}
            style={{
              padding: '6px 12px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            + New
          </button>
        )}
      </div>

      {runningAgents.length > 0 && (
        <>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            ACTIVE ({runningAgents.length})
          </div>
          {runningAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onStop={() => onStopAgent(agent.id)}
            />
          ))}
        </>
      )}

      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', marginTop: '16px' }}>
        AVAILABLE ({idleAgents.length})
      </div>
      {idleAgents.map(agent => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onSpawn={() => onSpawnAgent(agent.id)}
        />
      ))}
    </div>
  )
}
