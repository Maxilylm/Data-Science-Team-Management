import { useState } from 'react'
import type { TicketPriority } from '../../types'
import { priorityColors } from '../../constants/ticketColors'
import { overlayStyle } from '../../constants/dialogStyles'

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

const priorityButtonStyle = (selected: boolean, color: string, isDark: boolean = false): React.CSSProperties => ({
  border: `2px solid ${selected ? color : (isDark ? '#4b5563' : '#e5e7eb')}`,
  backgroundColor: selected ? color + '20' : (isDark ? '#1f2937' : 'white'),
  color: selected ? color : (isDark ? '#9ca3af' : '#6b7280'),
  fontSize: '13px',
})


export default function CreateTicketDialog({ isOpen, onSubmit, onClose, isDarkMode = false }: CreateTicketDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [tagsInput, setTagsInput] = useState('')

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
                  className="btn btn--sm"
                  style={priorityButtonStyle(priority === p, priorityColors[p], isDarkMode)}
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
              className="btn btn--secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="btn btn--success"
            >
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
