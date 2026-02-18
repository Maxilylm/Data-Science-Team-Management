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

const filterButtonStyle = (active: boolean): React.CSSProperties => ({
  fontSize: '11px',
  padding: '4px 8px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  backgroundColor: active ? '#3b82f6' : '#f3f4f6',
  color: active ? 'white' : '#6b7280',
  transition: 'all 0.2s ease'
})

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
            style={filterButtonStyle(filter === 'all')}
            onClick={() => setFilter('all')}
            onMouseEnter={(e) => {
              if (filter !== 'all') {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'all') {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            All
          </button>
          <button
            style={filterButtonStyle(filter === 'active')}
            onClick={() => setFilter('active')}
            onMouseEnter={(e) => {
              if (filter !== 'active') {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'active') {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            Active
          </button>
          <button
            style={filterButtonStyle(filter === 'needs_help')}
            onClick={() => setFilter('needs_help')}
            onMouseEnter={(e) => {
              if (filter !== 'needs_help') {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'needs_help') {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            Needs Help
          </button>
          <button
            style={filterButtonStyle(filter === 'completed')}
            onClick={() => setFilter('completed')}
            onMouseEnter={(e) => {
              if (filter !== 'completed') {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'completed') {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            Completed
          </button>
        </div>
        <button
          onClick={onCreateTicket}
          style={{
            padding: '8px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#10b981';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
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
              onClick={() => onSpawnAgent('assigner', 'Check for unassigned tickets and assign them to the appropriate agents based on their descriptions.')}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Run Assigner agent to auto-assign tickets"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d97706';
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f59e0b';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
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
                  onClick={() => onSpawnAgent(agent.id)}
                  disabled={agent.status === 'running'}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: agent.status === 'running' ? '#9ca3af' : agent.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: agent.status === 'running' ? 'not-allowed' : 'pointer',
                    opacity: agent.status === 'running' ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (agent.status !== 'running') {
                      e.currentTarget.style.filter = 'brightness(0.85)';
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (agent.status !== 'running') {
                      e.currentTarget.style.filter = 'brightness(1)';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

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
