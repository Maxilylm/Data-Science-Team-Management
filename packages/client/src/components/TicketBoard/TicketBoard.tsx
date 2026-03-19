import { useState } from 'react'
import type { Agent, Ticket } from '../../types'
import { TicketCard } from '../TicketCard'
import TicketDetailDialog from '../TicketDetailDialog'

interface TicketBoardProps {
  agents: Agent[]
  tickets: Ticket[]
  unassignedTickets: Ticket[]
  onAssignTicket: (ticketId: string, agentId: string | null) => void
  onCreateTicket: () => void
  onSpawnAgent: (agentId: string, prompt?: string) => void
  onAnswerTicket: (ticketId: string, answer: string) => void
  onUpdateTicket?: (ticketId: string, updates: Partial<Ticket>) => void
  onDeleteTicket?: (ticketId: string) => void
  isDarkMode?: boolean
}

const getBoardStyle = (isDark: boolean): React.CSSProperties => ({
  flex: 1,
  overflow: 'auto',
  padding: '16px 24px',
  backgroundColor: isDark ? '#111827' : '#f9fafb'
})

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '16px'
}

const getAgentColumnStyle = (isDark: boolean): React.CSSProperties => ({
  backgroundColor: isDark ? '#1f2937' : 'white',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
  color: isDark ? '#e5e7eb' : 'inherit'
})

const getAgentHeaderStyle = (isDark: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: isDark ? '1px solid #374151' : '1px solid #e5e7eb'
})

const statusDotStyle = (status: Agent['status']): React.CSSProperties => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: status === 'running' ? '#10b981' : status === 'waiting_input' ? '#f59e0b' : '#9ca3af',
  animation: status === 'running' ? 'pulse 2s infinite' : 'none'
})

const ticketFilterStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '12px'
}

type TicketFilter = 'all' | 'active' | 'needs_help' | 'completed'

export default function TicketBoard({
  agents,
  tickets,
  unassignedTickets,
  onAssignTicket: _onAssignTicket,
  onCreateTicket,
  onSpawnAgent,
  onAnswerTicket,
  onUpdateTicket,
  onDeleteTicket,
  isDarkMode = false
}: TicketBoardProps) {
  const [filter, setFilter] = useState<TicketFilter>('active')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsDetailDialogOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailDialogOpen(false)
    setSelectedTicket(null)
  }

  const getAgentTickets = (agentId: string): Ticket[] => {
    // Case-insensitive comparison for assignedTo
    const normalizedAgentId = agentId.toLowerCase()
    let agentTickets = tickets.filter(t => t.assignedTo?.toLowerCase() === normalizedAgentId)

    switch (filter) {
      case 'active':
        return agentTickets.filter(t => t.status !== 'completed')
      case 'needs_help':
        return agentTickets.filter(t => t.status === 'needs_help')
      case 'completed':
        return agentTickets.filter(t => t.status === 'completed')
      default:
        return agentTickets
    }
  }

  const filteredUnassigned = filter === 'completed'
    ? []
    : unassignedTickets

  return (
    <div style={getBoardStyle(isDarkMode)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={ticketFilterStyle}>
          <button
            className={filter === 'all' ? 'btn btn--primary btn--sm' : 'btn btn--secondary btn--sm'}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'active' ? 'btn btn--primary btn--sm' : 'btn btn--secondary btn--sm'}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={filter === 'needs_help' ? 'btn btn--primary btn--sm' : 'btn btn--secondary btn--sm'}
            onClick={() => setFilter('needs_help')}
          >
            Needs Help
          </button>
          <button
            className={filter === 'completed' ? 'btn btn--primary btn--sm' : 'btn btn--secondary btn--sm'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
        <button
          className="btn btn--success"
          onClick={onCreateTicket}
        >
          + New Ticket
        </button>
      </div>

      <div style={gridStyle}>
        {/* Unassigned Tickets Column */}
        <div style={{ ...getAgentColumnStyle(isDarkMode), backgroundColor: isDarkMode ? '#78350f' : '#fef3c7', borderTop: '4px solid #f59e0b' }}>
          <div style={getAgentHeaderStyle(isDarkMode)}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Unassigned</h3>
              <span style={{ fontSize: '12px', color: isDarkMode ? '#fbbf24' : '#92400e' }}>
                {filteredUnassigned.length} ticket{filteredUnassigned.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              className="btn btn--warning btn--sm"
              onClick={() => onSpawnAgent('assigner', 'Check for unassigned tickets and assign them to the appropriate agents based on their descriptions.')}
              title="Run Assigner agent to auto-assign tickets"
            >
              Auto-Assign
            </button>
          </div>

          {filteredUnassigned.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: isDarkMode ? '#fbbf24' : '#92400e', fontSize: '14px' }}>
              No unassigned tickets
            </div>
          ) : (
            filteredUnassigned.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={handleTicketClick}
                onAssign={() => {
                  // Call Assigner agent to assign this specific ticket
                  onSpawnAgent('assigner', `Assign ticket "${ticket.title}" (ID: ${ticket.id}) to the most appropriate agent. Description: ${ticket.description}`)
                }}
                isDarkMode={isDarkMode}
              />
            ))
          )}
        </div>

        {/* Agent Columns */}
        {agents.map(agent => {
          const agentTickets = getAgentTickets(agent.id)

          return (
            <div
              key={agent.id}
              style={{
                ...getAgentColumnStyle(isDarkMode),
                borderTop: `4px solid ${agent.color}`
              }}
            >
              <div style={getAgentHeaderStyle(isDarkMode)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={statusDotStyle(agent.status)} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{agent.name}</h3>
                    <span style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                      {agentTickets.length} ticket{agentTickets.length !== 1 ? 's' : ''} • {agent.model}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn--sm"
                  onClick={() => onSpawnAgent(agent.id)}
                  disabled={agent.status === 'running'}
                  style={{
                    backgroundColor: agent.status === 'running' ? '#9ca3af' : agent.color,
                    color: 'white'
                  }}
                >
                  {agent.status === 'running' ? 'Running...' : 'Run'}
                </button>
              </div>

              {agentTickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '14px' }}>
                  No tickets
                </div>
              ) : (
                agentTickets.map(ticket => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={handleTicketClick}
                    onAnswer={ticket.status === 'needs_help' ? onAnswerTicket : undefined}
                    isDarkMode={isDarkMode}
                  />
                ))
              )}
            </div>
          )
        })}
      </div>

      <TicketDetailDialog
        ticket={selectedTicket}
        isOpen={isDetailDialogOpen}
        onClose={handleCloseDetail}
        onUpdate={onUpdateTicket}
        onDelete={onDeleteTicket}
        isDarkMode={isDarkMode}
      />
    </div>
  )
}
