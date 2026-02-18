import { useState, useCallback } from 'react'
import { useAgents } from './hooks/useAgents'
import { useTasks } from './hooks/useTasks'
import { useSSE } from './hooks/useSSE'
import { AgentPanel } from './components/AgentPanel'
import { KanbanBoard } from './components/KanbanBoard'
import { PromptDialog } from './components/PromptDialog'
import { InputRequired } from './components/InputRequired'
import { LiveFeed } from './components/LiveFeed'
import { CreateAgentDialog } from './components/CreateAgentDialog'
import type { Agent } from './types'

interface FeedEvent {
  type: string
  timestamp: Date
  agentId?: string
  data?: string
}

const layoutStyle: React.CSSProperties = {
  display: 'flex',
  height: '100vh'
}

const mainStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}

const headerStyle: React.CSSProperties = {
  padding: '16px 24px',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}

export default function App() {
  const { agents, spawnAgent, stopAgent, sendInput, createAgent } = useAgents()
  const { kanbanData, tasksNeedingInput, refetch } = useTasks()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleSSEMessage = useCallback((event: any) => {
    setFeedEvents(prev => [...prev, {
      type: event.type,
      timestamp: new Date(),
      agentId: event.agentId,
      data: event.data || event.task?.subject
    }])
    refetch()
  }, [refetch])

  useSSE('/api/events', { onMessage: handleSSEMessage })

  const handleSpawnAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (agent) setSelectedAgent(agent)
  }

  const handleSubmitPrompt = (agentId: string, prompt: string) => {
    spawnAgent({ agentId, prompt })
    setSelectedAgent(null)
  }

  const handleStopAgent = (agentId: string) => {
    stopAgent(agentId)
  }

  const handleSubmitInput = (agentId: string, input: string) => {
    sendInput({ agentId, input })
  }

  const handleCreateAgent = (agent: {
    id: string
    name: string
    description: string
    model?: string
    color?: string
    systemPrompt?: string
  }) => {
    createAgent(agent)
    setShowCreateDialog(false)
  }

  return (
    <div style={layoutStyle}>
      <AgentPanel
        agents={agents}
        onSpawnAgent={handleSpawnAgent}
        onStopAgent={handleStopAgent}
        onCreateAgent={() => setShowCreateDialog(true)}
      />

      <div style={mainStyle}>
        <header style={headerStyle}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
            Agent Team Dashboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>
              {agents.filter(a => a.status === 'running').length} active agents
            </span>
          </div>
        </header>

        <div style={{ padding: '16px 24px' }}>
          <InputRequired
            tasks={tasksNeedingInput}
            onSubmitInput={handleSubmitInput}
          />
        </div>

        <KanbanBoard data={kanbanData} />

        <div style={{ padding: '16px 24px' }}>
          <LiveFeed events={feedEvents} />
        </div>
      </div>

      <PromptDialog
        agent={selectedAgent}
        onSubmit={handleSubmitPrompt}
        onClose={() => setSelectedAgent(null)}
      />

      <CreateAgentDialog
        isOpen={showCreateDialog}
        onSubmit={handleCreateAgent}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  )
}
