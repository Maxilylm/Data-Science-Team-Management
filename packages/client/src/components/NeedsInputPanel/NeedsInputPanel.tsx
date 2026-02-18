import { useState } from 'react'
import type { Ticket } from '../../types'

interface NeedsInputPanelProps {
  tickets: Ticket[]
  onAnswer: (ticketId: string, answer: string) => void
}

const panelStyle: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  borderRadius: '12px',
  padding: '16px',
  margin: '0 24px 16px 24px',
  border: '2px solid #fecaca',
  boxShadow: '0 4px 6px rgba(239, 68, 68, 0.1)'
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '12px',
  paddingBottom: '12px',
  borderBottom: '1px solid #fecaca'
}

const ticketItemStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #fecaca',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
}

export default function NeedsInputPanel({ tickets, onAnswer }: NeedsInputPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<Record<string, boolean>>({})

  const needsInputTickets = tickets.filter(t => t.status === 'needs_help' && t.helpRequest)

  if (needsInputTickets.length === 0) return null

  const handleAnswer = async (ticketId: string) => {
    const answer = answers[ticketId]?.trim()
    if (!answer) return

    setSending(prev => ({ ...prev, [ticketId]: true }))
    try {
      await onAnswer(ticketId, answer)
      setAnswers(prev => ({ ...prev, [ticketId]: '' }))
    } finally {
      setSending(prev => ({ ...prev, [ticketId]: false }))
    }
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontSize: '24px' }}>!</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#991b1b' }}>
            Agents Need Your Input
          </h3>
          <span style={{ fontSize: '12px', color: '#dc2626' }}>
            {needsInputTickets.length} ticket{needsInputTickets.length !== 1 ? 's' : ''} waiting for response
          </span>
        </div>
      </div>

      {needsInputTickets.map(ticket => (
        <div key={ticket.id} style={ticketItemStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '4px',
                  fontWeight: 500
                }}>
                  {ticket.assignedTo}
                </span>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{ticket.title}</span>
              </div>
            </div>
          </div>

          {ticket.helpRequest && (
            <div style={{
              backgroundColor: '#fef3c7',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '12px',
              border: '1px solid #fde68a'
            }}>
              <div style={{ fontWeight: 500, marginBottom: '4px', fontSize: '12px', color: '#92400e' }}>
                Agent is asking:
              </div>
              <div style={{ fontSize: '14px', color: '#78350f', lineHeight: 1.5 }}>
                {ticket.helpRequest.message}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea
              value={answers[ticket.id] || ''}
              onChange={(e) => setAnswers(prev => ({ ...prev, [ticket.id]: e.target.value }))}
              placeholder="Type your answer here and press Send..."
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                minHeight: '60px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAnswer(ticket.id)
                }
              }}
            />
            <button
              onClick={() => handleAnswer(ticket.id)}
              disabled={!answers[ticket.id]?.trim() || sending[ticket.id]}
              style={{
                padding: '10px 20px',
                backgroundColor: answers[ticket.id]?.trim() && !sending[ticket.id] ? '#16a34a' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: answers[ticket.id]?.trim() && !sending[ticket.id] ? 'pointer' : 'not-allowed',
                fontWeight: 500,
                fontSize: '14px',
                alignSelf: 'flex-end',
                minWidth: '80px'
              }}
            >
              {sending[ticket.id] ? 'Sending...' : 'Send'}
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
            Press Cmd/Ctrl + Enter to send
          </div>
        </div>
      ))}
    </div>
  )
}
