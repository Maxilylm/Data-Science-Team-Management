import { useState, useCallback, useEffect } from 'react'
import { useAgents } from './hooks/useAgents'
import { useTasks } from './hooks/useTasks'
import { useTickets } from './hooks/useTickets'
import { useSSE } from './hooks/useSSE'
import { AgentPanel } from './components/AgentPanel'
import { TicketBoard } from './components/TicketBoard'
import { PromptDialog } from './components/PromptDialog'
import { InputRequired } from './components/InputRequired'
import { LiveFeed } from './components/LiveFeed'
import { CreateAgentDialog } from './components/CreateAgentDialog'
import { CreateTicketDialog } from './components/CreateTicketDialog'
import NeedsInputPanel from './components/NeedsInputPanel'
import { api } from './services/api'
import type { Agent, TicketPriority } from './types'

interface FeedEvent {
  type: string
  timestamp: Date
  agentId?: string
  data?: string
  ticketId?: string
  question?: string
}

const getLayoutStyle = (isDark: boolean): React.CSSProperties => ({
  display: 'flex',
  height: '100vh',
  backgroundColor: isDark ? '#1f2937' : 'white'
})

const mainStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}

const getHeaderStyle = (isDark: boolean): React.CSSProperties => ({
  padding: '16px 24px',
  borderBottom: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: isDark ? '#1f2937' : 'white',
  color: isDark ? '#e5e7eb' : 'inherit'
})

const statsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  alignItems: 'center'
}

const statBadgeStyle = (color: string): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '13px',
  color: color,
  backgroundColor: color + '15',
  padding: '4px 10px',
  borderRadius: '9999px',
  fontWeight: 500
})

export default function App() {
  const { agents, spawnAgent, stopAgent, sendInput, createAgent, deleteAgent } = useAgents()
  const { tasksNeedingInput, refetch: refetchTasks } = useTasks()
  const { tickets, unassignedTickets, summary, createTicket, updateTicket, assignTicket, deleteTicket, answerTicket, refetch: refetchTickets } = useTickets()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([])
  const [showCreateAgentDialog, setShowCreateAgentDialog] = useState(false)
  const [showCreateTicketDialog, setShowCreateTicketDialog] = useState(false)
  const [projectConfig, setProjectConfig] = useState<{ projectPath: string; projectName: string } | null>(null)
  const [showConfigEdit, setShowConfigEdit] = useState(false)
  const [editPath, setEditPath] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode')
    return stored ? JSON.parse(stored) : false
  })

  useEffect(() => {
    api.getConfig().then(setProjectConfig)
  }, [])

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode((prev: boolean) => !prev)
  }

  const handleUpdateConfig = async () => {
    if (editPath) {
      const updated = await api.updateConfig({ projectPath: editPath })
      setProjectConfig(updated)
      setShowConfigEdit(false)
    }
  }

  const handleSSEMessage = useCallback((event: any) => {
    setFeedEvents(prev => [...prev.slice(-99), {
      type: event.type,
      timestamp: new Date(),
      agentId: event.agentId,
      data: event.data || event.task?.subject || event.ticket?.title || event.question,
      ticketId: event.ticketId,
      question: event.question
    }])
    refetchTasks()
    refetchTickets()
  }, [refetchTasks, refetchTickets])

  useSSE('/api/events', { onMessage: handleSSEMessage })

  const handleSpawnAgent = (agentId: string, prompt?: string) => {
    if (prompt) {
      // Direct spawn with provided prompt (e.g., from Assigner)
      spawnAgent({ agentId, prompt })
    } else {
      // Show dialog for user to enter prompt
      const agent = agents.find(a => a.id === agentId)
      if (agent) setSelectedAgent(agent)
    }
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
    setShowCreateAgentDialog(false)
  }

  const handleCreateTicket = (ticket: {
    title: string
    description: string
    priority: TicketPriority
    tags: string[]
  }) => {
    createTicket(ticket)
    setShowCreateTicketDialog(false)
  }

  const handleAssignTicket = (ticketId: string, agentId: string | null) => {
    assignTicket({ id: ticketId, agentId })
  }

  const handleAnswerTicket = (ticketId: string, answer: string) => {
    answerTicket({ id: ticketId, answer })
  }

  const handleUpdateTicket = (ticketId: string, updates: Partial<import('./types').Ticket>) => {
    updateTicket({ id: ticketId, updates })
  }

  const handleDeleteTicket = (ticketId: string) => {
    deleteTicket(ticketId)
  }

  const activeAgentsCount = agents.filter(a => a.status === 'running').length

  return (
    <div style={getLayoutStyle(isDarkMode)}>
      <AgentPanel
        agents={agents}
        onSpawnAgent={handleSpawnAgent}
        onStopAgent={handleStopAgent}
        onDeleteAgent={handleDeleteAgent}
        onCreateAgent={() => setShowCreateAgentDialog(true)}
        isDarkMode={isDarkMode}
      />

      <div style={mainStyle}>
        <header style={getHeaderStyle(isDarkMode)}>
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
                <button
                  onClick={handleUpdateConfig}
                  style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                >
                  Save
                </button>
                <button
                  onClick={() => setShowConfigEdit(false)}
                  style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div style={statsStyle}>
            <div style={statBadgeStyle('#10b981')}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              {activeAgentsCount} active
            </div>
            <div style={statBadgeStyle('#f59e0b')}>
              {summary.unassigned} unassigned
            </div>
            <div style={statBadgeStyle('#3b82f6')}>
              {summary.inProgress} in progress
            </div>
            {summary.needsHelp > 0 && (
              <div style={statBadgeStyle('#ef4444')}>
                {summary.needsHelp} needs help
              </div>
            )}
            <button
              onClick={toggleDarkMode}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'background-color 0.2s',
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {tasksNeedingInput.length > 0 && (
          <div style={{ padding: '16px 24px', backgroundColor: '#fef3c7' }}>
            <InputRequired
              tasks={tasksNeedingInput}
              onSubmitInput={handleSubmitInput}
            />
          </div>
        )}

        <NeedsInputPanel
          tickets={tickets}
          onAnswer={handleAnswerTicket}
        />

        <TicketBoard
          agents={agents}
          tickets={tickets}
          unassignedTickets={unassignedTickets}
          onAssignTicket={handleAssignTicket}
          onCreateTicket={() => setShowCreateTicketDialog(true)}
          onSpawnAgent={handleSpawnAgent}
          onAnswerTicket={handleAnswerTicket}
          onUpdateTicket={handleUpdateTicket}
          onDeleteTicket={handleDeleteTicket}
          isDarkMode={isDarkMode}
        />

        <div style={{ borderTop: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb', backgroundColor: isDarkMode ? '#1f2937' : 'white' }}>
          <LiveFeed events={feedEvents} onAnswerQuestion={handleAnswerTicket} isDarkMode={isDarkMode} />
        </div>
      </div>

      <PromptDialog
        agent={selectedAgent}
        onSubmit={handleSubmitPrompt}
        onClose={() => setSelectedAgent(null)}
        isDarkMode={isDarkMode}
      />

      <CreateAgentDialog
        isOpen={showCreateAgentDialog}
        onSubmit={handleCreateAgent}
        onClose={() => setShowCreateAgentDialog(false)}
        isDarkMode={isDarkMode}
      />

      <CreateTicketDialog
        isOpen={showCreateTicketDialog}
        onSubmit={handleCreateTicket}
        onClose={() => setShowCreateTicketDialog(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  )
}
