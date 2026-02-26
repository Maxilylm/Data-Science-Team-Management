import { useState, useCallback, useEffect } from 'react'
import { useAgents } from './hooks/useAgents'
import { useTasks } from './hooks/useTasks'
import { useTickets } from './hooks/useTickets'
import { useProjects } from './hooks/useProjects'
import { useSSE } from './hooks/useSSE'
import { useAuth } from './hooks/useAuth'
import { AgentPanel } from './components/AgentPanel'
import { TicketBoard } from './components/TicketBoard'
import { PromptDialog } from './components/PromptDialog'
import { InputRequired } from './components/InputRequired'
import { LiveFeed } from './components/LiveFeed'
import { CreateAgentDialog } from './components/CreateAgentDialog'
import { CreateTicketDialog } from './components/CreateTicketDialog'
import { ProjectSwitcher } from './components/ProjectSwitcher/ProjectSwitcher'
import { ProjectManager } from './components/ProjectManager/ProjectManager'
import { LoginScreen } from './components/LoginScreen/LoginScreen'
import { Settings } from './pages/Settings/Settings'
import NeedsInputPanel from './components/NeedsInputPanel'
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
  const { projects, activeProject, activeProjectId, activateProject, createProject, initializeProject, deleteProject, isActivating } = useProjects()
  const auth = useAuth()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([])
  const [showCreateAgentDialog, setShowCreateAgentDialog] = useState(false)
  const [showCreateTicketDialog, setShowCreateTicketDialog] = useState(false)
  const [showProjectManager, setShowProjectManager] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode')
    return stored ? JSON.parse(stored) : false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  // Listen for auth expiration
  useEffect(() => {
    const handler = () => auth.logout()
    window.addEventListener('auth-expired', handler)
    return () => window.removeEventListener('auth-expired', handler)
  }, [auth])

  const toggleDarkMode = () => {
    setIsDarkMode((prev: boolean) => !prev)
  }

  const handleSSEMessage = useCallback((event: any) => {
    setFeedEvents(prev => [...prev.slice(-99), {
      type: event.type as string,
      timestamp: new Date(),
      agentId: event.agentId as string | undefined,
      data: (event.data || (event.task as Record<string, unknown>)?.subject || (event.ticket as Record<string, unknown>)?.title || event.question) as string | undefined,
      ticketId: event.ticketId as string | undefined,
      question: event.question as string | undefined
    }])
    refetchTasks()
    refetchTickets()
  }, [refetchTasks, refetchTickets])

  useSSE('/api/events', { onMessage: handleSSEMessage })

  const handleSpawnAgent = (agentId: string, prompt?: string) => {
    if (prompt) {
      spawnAgent({ agentId, prompt })
    } else {
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

  // Show loading while checking auth
  if (auth.isLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>
  }

  // Show login if auth is enabled and not authenticated
  if (auth.isAuthEnabled && !auth.isAuthenticated) {
    return <LoginScreen onLogin={auth.login} isDarkMode={isDarkMode} />
  }

  // Show settings page
  if (showSettings) {
    return <Settings onBack={() => setShowSettings(false)} isDarkMode={isDarkMode} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              Agent Team Dashboard
            </h1>
            <ProjectSwitcher
              projects={projects}
              activeProject={activeProject}
              isActivating={isActivating}
              onActivate={activateProject}
              onManageProjects={() => setShowProjectManager(true)}
              isDarkMode={isDarkMode}
            />
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
              onClick={() => setShowSettings(true)}
              style={{
                background: 'none',
                border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '4px 12px',
                borderRadius: '6px',
                color: isDarkMode ? '#e5e7eb' : '#374151'
              }}
            >
              Settings
            </button>
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
              {isDarkMode ? 'L' : 'D'}
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

      <ProjectManager
        isOpen={showProjectManager}
        projects={projects}
        activeProjectId={activeProjectId}
        onClose={() => setShowProjectManager(false)}
        onAddExisting={createProject}
        onCreateNew={initializeProject}
        onRemove={deleteProject}
        onActivate={activateProject}
        isDarkMode={isDarkMode}
      />
    </div>
  )
}
