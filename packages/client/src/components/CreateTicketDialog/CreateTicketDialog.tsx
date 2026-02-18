import { useState } from 'react'
import type { TicketPriority } from '../../types'

interface CreateTicketDialogProps {
  isOpen: boolean
  onSubmit: (ticket: {
    title: string
    description: string
    priority: TicketPriority
    tags: string[]
  }) => void
  onClose: () => void
  isDarkMode?: boolean
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}

const getDialogStyle = (isDark: boolean): React.CSSProperties => ({
  backgroundColor: isDark ? '#1f2937' : 'white',
  borderRadius: '12px',
  padding: '24px',
  width: '480px',
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

const priorityButtonStyle = (selected: boolean, color: string, isHovered: boolean = false, isDark: boolean = false): React.CSSProperties => ({
  padding: '8px 16px',
  border: `2px solid ${selected ? color : (isDark ? '#4b5563' : '#e5e7eb')}`,
  borderRadius: '6px',
  backgroundColor: selected ? color + '20' : (isHovered ? (isDark ? '#374151' : '#f9fafb') : (isDark ? '#1f2937' : 'white')),
  color: selected ? color : (isDark ? '#9ca3af' : '#6b7280'),
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '13px',
  transition: 'all 0.2s ease'
})

const priorityColors: Record<TicketPriority, string> = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444'
}

export default function CreateTicketDialog({ isOpen, onSubmit, onClose, isDarkMode = false }: CreateTicketDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [tagsInput, setTagsInput] = useState('')
  const [hoveredPriority, setHoveredPriority] = useState<TicketPriority | null>(null)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      tags
    })

    // Reset form
    setTitle('')
    setDescription('')
    setPriority('medium')
    setTagsInput('')
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={getDialogStyle(isDarkMode)} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 600 }}>
          Create New Ticket
        </h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label style={getLabelStyle(isDarkMode)}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Brief description of the task"
              style={getInputStyle(isDarkMode)}
              autoFocus
              required
            />
          </div>

          <div>
            <label style={getLabelStyle(isDarkMode)}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detailed requirements, context, acceptance criteria..."
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
                  onClick={() => setPriority(p)}
                  style={priorityButtonStyle(priority === p, priorityColors[p], hoveredPriority === p, isDarkMode)}
                  onMouseEnter={(e) => {
                    setHoveredPriority(p);
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    setHoveredPriority(null);
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={getLabelStyle(isDarkMode)}>Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="feature, frontend, bug-fix"
              style={getInputStyle(isDarkMode)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: isDarkMode ? '#374151' : 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                color: isDarkMode ? '#e5e7eb' : 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#4b5563' : '#f9fafb';
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : 'white';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: title.trim() ? '#10b981' : '#9ca3af',
                color: 'white',
                cursor: title.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (title.trim()) {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (title.trim()) {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
