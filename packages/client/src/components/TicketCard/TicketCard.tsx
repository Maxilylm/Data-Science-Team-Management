import { useState } from 'react'
import type { Ticket } from '../../types'
import { priorityColors, statusColors } from '../../constants/ticketColors'

interface TicketCardProps {
  ticket: Ticket
  onAssign?: (ticketId: string) => void
  onStatusChange?: (ticketId: string, status: Ticket['status']) => void
  onAnswer?: (ticketId: string, answer: string) => void
  onClick?: (ticket: Ticket) => void
  compact?: boolean
  isDarkMode?: boolean
}


const getCardStyle = (isDark: boolean): React.CSSProperties => ({
  backgroundColor: isDark ? '#374151' : 'white',
  borderRadius: '8px',
  padding: '12px',
  boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
  marginBottom: '8px',
  borderLeft: '4px solid transparent',
  color: isDark ? '#e5e7eb' : 'inherit'
})

export default function TicketCard({ ticket, onAssign, onStatusChange: _onStatusChange, onAnswer, onClick, compact = false, isDarkMode = false }: TicketCardProps) {
  const statusStyle = statusColors[ticket.status]
  const [answerText, setAnswerText] = useState('')
  const [showAnswerInput, setShowAnswerInput] = useState(false)

  const handleAnswer = () => {
    if (answerText.trim() && onAnswer) {
      onAnswer(ticket.id, answerText.trim())
      setAnswerText('')
      setShowAnswerInput(false)
    }
  }

  return (
    <div
      className="card--interactive"
      style={{
        ...getCardStyle(isDarkMode),
        borderLeftColor: priorityColors[ticket.priority]
      }}
      onClick={() => onClick?.(ticket)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0, flex: 1 }}>
          {ticket.title}
        </h4>
        <span
          role="status"
          style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '9999px',
            backgroundColor: statusStyle.bg,
            color: statusStyle.text,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {ticket.status.replace('_', ' ')}
        </span>
      </div>

      {!compact && (
        <p style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#6b7280', margin: '0 0 8px 0', lineHeight: 1.4 }}>
          {ticket.description.length > 100
            ? ticket.description.substring(0, 100) + '...'
            : ticket.description}
        </p>
      )}

      {ticket.helpRequest && (
        <div style={{
          backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '8px',
          fontSize: '12px',
          border: isDarkMode ? '1px solid #991b1b' : '1px solid #fecaca'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>❓</span>
            <strong style={{ color: isDarkMode ? '#fca5a5' : '#991b1b' }}>Agent needs input:</strong>
          </div>
          <div style={{ color: isDarkMode ? '#fecaca' : '#7f1d1d', marginBottom: '12px', lineHeight: 1.5 }}>
            {ticket.helpRequest.message}
          </div>

          {onAnswer && !showAnswerInput && (
            <button
              className="btn btn--danger btn--sm"
              onClick={(e) => { e.stopPropagation(); setShowAnswerInput(true); }}
            >
              Answer & Resume
            </button>
          )}

          {showAnswerInput && (
            <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '8px' }}>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your answer here..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: isDarkMode ? '1px solid #991b1b' : '1px solid #fecaca',
                  borderRadius: '4px',
                  fontSize: '12px',
                  minHeight: '60px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  backgroundColor: isDarkMode ? '#1f2937' : 'white',
                  color: isDarkMode ? '#e5e7eb' : 'inherit'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  className="btn btn--success btn--sm"
                  onClick={handleAnswer}
                  disabled={!answerText.trim()}
                >
                  Send Answer
                </button>
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => { setShowAnswerInput(false); setAnswerText(''); }}
                  style={{
                    backgroundColor: isDarkMode ? '#4b5563' : undefined,
                    color: isDarkMode ? '#e5e7eb' : undefined
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {ticket.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                borderRadius: '4px',
                color: isDarkMode ? '#9ca3af' : '#4b5563'
              }}
            >
              {tag}
            </span>
          ))}
          {ticket.tags.length > 3 && (
            <span style={{ fontSize: '10px', color: '#9ca3af' }}>
              +{ticket.tags.length - 3}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {!ticket.assignedTo && onAssign && (
            <button
              className="btn btn--primary btn--sm"
              aria-label={`Assign ticket: ${ticket.title}`}
              onClick={(e) => { e.stopPropagation(); onAssign(ticket.id); }}
            >
              Assign
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: '8px', fontSize: '10px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
        <span>by {ticket.createdBy}</span>
        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
