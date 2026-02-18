import type { Agent } from '../../types'
import AgentCard from './AgentCard'

interface AgentPanelProps {
  agents: Agent[]
  onSpawnAgent: (agentId: string) => void
  onStopAgent: (agentId: string) => void
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
  fontWeight: 600,
  marginBottom: '16px'
}

export default function AgentPanel({ agents, onSpawnAgent, onStopAgent }: AgentPanelProps) {
  const runningAgents = agents.filter(a => a.status !== 'idle')
  const idleAgents = agents.filter(a => a.status === 'idle')

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>Agents</div>

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
