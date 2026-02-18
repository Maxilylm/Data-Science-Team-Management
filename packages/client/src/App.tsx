import { useState, useCallback, useEffect } from 'react'
import { useAgents } from './hooks/useAgents'
import { useTasks } from './hooks/useTasks'
import { useSSE } from './hooks/useSSE'
import { AgentPanel } from './components/AgentPanel'
import { KanbanBoard } from './components/KanbanBoard'
import { PromptDialog } from './components/PromptDialog'
import { InputRequired } from './components/InputRequired'
import { LiveFeed } from './components/LiveFeed'
import { CreateAgentDialog } from './components/CreateAgentDialog'
import { api } from './services/api'
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
  const { agents, spawnAgent, stopAgent, sendInput, createAgent, deleteAgent } = useAgents()
  const { kanbanData, tasksNeedingInput, refetch } = useTasks()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [projectConfig, setProjectConfig] = useState<{ projectPath: string; projectName: string } | null>(null)
  const [showConfigEdit, setShowConfigEdit] = useState(false)
  const [editPath, setEditPath] = useState('')

  useEffect(() => {
    api.getConfig().then(setProjectConfig)
  }, [])

  const handleUpdateConfig = async () => {
    if (editPath) {
      const updated = await api.updateConfig({ projectPath: editPath })
      setProjectConfig(updated)
      setShowConfigEdit(false)
    }
  }

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

  const handleSubmitPrompt = (agentId: string, prompt: string, resume?: boolean) => {
    spawnAgent({ agentId, prompt, resume })
    setSelectedAgent(null)
  }

  const handleStopAgent = (agentId: string) => {
    stopAgent(agentId)
  }

  const handleDeleteAgent = (agentId: string) => {
    if (confirm(`Delete agent "${agentId}"? This will remove the agent configuration file.`)) {
      deleteAgent(agentId)
    }
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
        onDeleteAgent={handleDeleteAgent}
        onCreateAgent={() => setShowCreateDialog(true)}
      />

      <div style={mainStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
              {projectConfig?.projectName || 'Agent Team Dashboard'}
            </h1>
            {!showConfigEdit ? (
              <div
                onClick={() => { setEditPath(projectConfig?.projectPath || ''); setShowConfigEdit(true); }}
                style={{ fontSize: '12px', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Click to change project path"
              >
                📁 {projectConfig?.projectPath || 'No project configured'}
                <span style={{ fontSize: '10px', color: '#999' }}>(click to edit)</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={editPath}
                  onChange={(e) => setEditPath(e.target.value)}
                  style={{ padding: '4px 8px', fontSize: '12px', width: '400px', border: '1px solid #ddd', borderRadius: '4px' }}
                  placeholder="/path/to/your/project"
                  autoFocus
                />
                <button onClick={handleUpdateConfig} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Save
                </button>
                <button onClick={() => setShowConfigEdit(false)} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
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
