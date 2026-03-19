import { useState } from 'react'
import type { Ticket, TicketPriority, TicketStatus } from '../../types'
import { priorityColors, statusColors } from '../../constants/ticketColors'
import { overlayStyle } from '../../constants/dialogStyles'
import ConfirmDialog from '../ConfirmDialog'

interface TicketDetailDialogProps {
  ticket: Ticket | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: (ticketId: string, updates: Partial<Ticket>) => void
  onDelete?: (ticketId: string) => void
  isDarkMode?: boolean
}


const getDialogStyle = (isDark: boolean): React.CSSProperties => ({
  backgroundColor: isDark ? '#1f2937' : 'white',
  borderRadius: '12px',
  padding: '24px',
  width: '600px',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
  color: isDark ? '#e5e7eb' : 'inherit'
})

const getInputStyle = (isDark: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '10px 12px',
  border: isDark ? '1px solid #4b5563' : '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  marginBottom: '16px',
  boxSizing: 'border-box',
  backgroundColor: isDark ? '#374151' : 'white',
  color: isDark ? '#e5e7eb' : 'inherit'
})

const getLabelStyle = (isDark: boolean): React.CSSProperties => ({
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  marginBottom: '6px',
  color: isDark ? '#d1d5db' : '#374151'
})


const priorityButtonStyle = (selected: boolean, color: string, isDark: boolean = false): React.CSSProperties => ({
  padding: '6px 12px',
  border: `2px solid ${selected ? color : (isDark ? '#4b5563' : '#e5e7eb')}`,
  borderRadius: '6px',
  backgroundColor: selected ? color + '20' : (isDark ? '#1f2937' : 'white'),
  color: selected ? color : (isDark ? '#9ca3af' : '#6b7280'),
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '12px',
  transition: 'all 0.2s',
  flex: 1
})

const statusButtonStyle = (selected: boolean, statusColor: { bg: string; text: string }, isDark: boolean = false): React.CSSProperties => ({
  padding: '6px 12px',
  border: `2px solid ${selected ? statusColor.text : (isDark ? '#4b5563' : '#e5e7e7')}`,
  borderRadius: '6px',
  backgroundColor: selected ? statusColor.bg : (isDark ? '#1f2937' : 'white'),
  color: selected ? statusColor.text : (isDark ? '#9ca3af' : '#6b7280'),
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '11px',
  transition: 'all 0.2s',
  flex: 1,
  textAlign: 'center',
  whiteSpace: 'nowrap'
})

export default function TicketDetailDialog({ ticket, isOpen, onClose, onUpdate, onDelete, isDarkMode = false }: TicketDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedPriority, setEditedPriority] = useState<TicketPriority>('medium')
  const [editedStatus, setEditedStatus] = useState<TicketStatus>('unassigned')
  const [editedTagsInput, setEditedTagsInput] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!isOpen || !ticket) return null

  const handleEdit = () => {
    setEditedTitle(ticket.title)
    setEditedDescription(ticket.description)
    setEditedPriority(ticket.priority)
    setEditedStatus(ticket.status)
    setEditedTagsInput(ticket.tags.join(', '))
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!editedTitle.trim() || !onUpdate) return

    const tags = editedTagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    onUpdate(ticket.id, {
      title: editedTitle.trim(),
      description: editedDescription.trim(),
      priority: editedPriority,
      status: editedStatus,
      tags
    })

    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false)
    if (onDelete) {
      onDelete(ticket.id)
      onClose()
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={getDialogStyle(isDarkMode)} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
            {isEditing ? 'Edit Ticket' : 'Ticket Details'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              padding: 0,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        {isEditing ? (
          // Edit Mode
          <div>
            <div>
              <label style={getLabelStyle(isDarkMode)}>Title *</label>
              <input
                type="text"
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                style={getInputStyle(isDarkMode)}
                autoFocus
              />
            </div>

            <div>
              <label style={getLabelStyle(isDarkMode)}>Description</label>
              <textarea
                value={editedDescription}
                onChange={e => setEditedDescription(e.target.value)}
                style={{ ...getInputStyle(isDarkMode), minHeight: '120px', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={getLabelStyle(isDarkMode)}>Priority</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEditedPriority(p)}
                    style={priorityButtonStyle(editedPriority === p, priorityColors[p], isDarkMode)}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={getLabelStyle(isDarkMode)}>Status</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['unassigned', 'pending', 'in_progress', 'needs_help', 'completed'] as TicketStatus[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEditedStatus(s)}
                    style={statusButtonStyle(editedStatus === s, statusColors[s], isDarkMode)}
                  >
                    {s.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={getLabelStyle(isDarkMode)}>Tags (comma-separated)</label>
              <input
                type="text"
                value={editedTagsInput}
                onChange={e => setEditedTagsInput(e.target.value)}
                style={getInputStyle(isDarkMode)}
              />
            </div>
          </div>
        ) : (
          // View Mode
          <div>
            {/* Title with Priority Badge */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, flex: 1 }}>
                  {ticket.title}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: priorityColors[ticket.priority] + '20',
                    color: priorityColors[ticket.priority],
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: `2px solid ${priorityColors[ticket.priority]}`
                  }}
                >
                  {ticket.priority}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: statusColors[ticket.status].bg,
                  color: statusColors[ticket.status].text,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'inline-block'
                }}
              >
                {ticket.status.replace('_', ' ')}
              </span>
            </div>

            {/* Description */}
            {ticket.description && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ ...getLabelStyle(isDarkMode), marginBottom: '8px' }}>Description</label>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {ticket.description}
                </div>
              </div>
            )}

            {/* Help Request */}
            {ticket.helpRequest && (
              <div
                style={{
                  backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: isDarkMode ? '1px solid #991b1b' : '1px solid #fecaca'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>❓</span>
                  <strong style={{ color: isDarkMode ? '#fca5a5' : '#991b1b', fontSize: '14px' }}>
                    Agent needs input
                  </strong>
                </div>
                <div style={{ color: isDarkMode ? '#fecaca' : '#7f1d1d', fontSize: '14px', lineHeight: 1.5 }}>
                  <strong>From:</strong> {ticket.helpRequest.fromAgent}
                </div>
                <div style={{ color: isDarkMode ? '#fecaca' : '#7f1d1d', fontSize: '14px', lineHeight: 1.5, marginTop: '8px' }}>
                  {ticket.helpRequest.message}
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ ...getLabelStyle(isDarkMode), fontSize: '12px' }}>Assigned To</label>
                <div style={{ fontSize: '14px' }}>
                  {ticket.assignedTo || <span style={{ color: isDarkMode ? '#6b7280' : '#9ca3af' }}>Unassigned</span>}
                </div>
              </div>
              <div>
                <label style={{ ...getLabelStyle(isDarkMode), fontSize: '12px' }}>Created By</label>
                <div style={{ fontSize: '14px' }}>{ticket.createdBy}</div>
              </div>
              <div>
                <label style={{ ...getLabelStyle(isDarkMode), fontSize: '12px' }}>Created</label>
                <div style={{ fontSize: '14px' }}>{formatDate(ticket.createdAt)}</div>
              </div>
              <div>
                <label style={{ ...getLabelStyle(isDarkMode), fontSize: '12px' }}>Updated</label>
                <div style={{ fontSize: '14px' }}>{formatDate(ticket.updatedAt)}</div>
              </div>
            </div>

            {/* Tags */}
            {ticket.tags.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ ...getLabelStyle(isDarkMode), marginBottom: '8px' }}>Tags</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {ticket.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                        borderRadius: '6px',
                        color: isDarkMode ? '#d1d5db' : '#4b5563',
                        border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ticket ID */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ ...getLabelStyle(isDarkMode), fontSize: '12px' }}>Ticket ID</label>
              <div style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                color: isDarkMode ? '#9ca3af' : '#6b7280'
              }}>
                {ticket.id}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb'
        }}>
          <div>
            {!isEditing && onDelete && (
              <button
                onClick={handleDelete}
                className="btn btn--danger"
              >
                Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="btn btn--secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!editedTitle.trim()}
                  className="btn btn--success"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="btn btn--secondary"
                >
                  Close
                </button>
                {onUpdate && (
                  <button
                    onClick={handleEdit}
                    className="btn btn--primary"
                  >
                    Edit
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Ticket"
        message="Are you sure you want to delete this ticket? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  )
}
