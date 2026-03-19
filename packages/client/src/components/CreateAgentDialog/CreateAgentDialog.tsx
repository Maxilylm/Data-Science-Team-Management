import { useState } from 'react'

interface CreateAgentDialogProps {
  isOpen: boolean
  onSubmit: (agent: {
    id: string
    name: string
    description: string
    model?: string
    color?: string
    systemPrompt?: string
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
  width: '600px',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  color: isDark ? '#e5e7eb' : 'inherit'
})

const getInputStyle = (isDark: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '10px 12px',
  border: isDark ? '1px solid #4b5563' : '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  marginBottom: '12px',
  backgroundColor: isDark ? '#374151' : 'white',
  color: isDark ? '#e5e7eb' : 'inherit'
})

const getLabelStyle = (isDark: boolean): React.CSSProperties => ({
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  marginBottom: '4px',
  color: isDark ? '#d1d5db' : '#374151'
})

const getTextareaStyle = (isDark: boolean): React.CSSProperties => ({
  ...getInputStyle(isDark),
  minHeight: '100px',
  resize: 'vertical'
})

const colors = ['blue', 'green', 'purple', 'orange', 'red', 'pink', 'cyan', 'yellow']
const models = ['sonnet', 'opus', 'haiku']

export default function CreateAgentDialog({ isOpen, onSubmit, onClose, isDarkMode = false }: CreateAgentDialogProps) {
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('sonnet')
  const [color, setColor] = useState('blue')
  const [systemPrompt, setSystemPrompt] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    if (id.trim() && name.trim() && description.trim()) {
      onSubmit({
        id: id.trim().toLowerCase().replace(/\s+/g, '-'),
        name: name.trim(),
        description: description.trim(),
        model,
        color,
        systemPrompt: systemPrompt.trim() || undefined
      })
      // Reset form
      setId('')
      setName('')
      setDescription('')
      setModel('sonnet')
      setColor('blue')
      setSystemPrompt('')
    }
  }

  const isValid = id.trim() && name.trim() && description.trim()

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={getDialogStyle(isDarkMode)} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>
          Create New Agent
        </h2>

        <label style={getLabelStyle(isDarkMode)}>Agent ID</label>
        <input
          style={getInputStyle(isDarkMode)}
          placeholder="e.g., data-analyst"
          value={id}
          onChange={e => setId(e.target.value)}
        />

        <label style={getLabelStyle(isDarkMode)}>Name</label>
        <input
          style={getInputStyle(isDarkMode)}
          placeholder="e.g., Data Analyst"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <label style={getLabelStyle(isDarkMode)}>Description</label>
        <input
          style={getInputStyle(isDarkMode)}
          placeholder="Brief description of what this agent does"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={getLabelStyle(isDarkMode)}>Model</label>
            <select
              style={{ ...getInputStyle(isDarkMode), cursor: 'pointer' }}
              value={model}
              onChange={e => setModel(e.target.value)}
            >
              {models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={getLabelStyle(isDarkMode)}>Color</label>
            <select
              style={{ ...getInputStyle(isDarkMode), cursor: 'pointer' }}
              value={color}
              onChange={e => setColor(e.target.value)}
            >
              {colors.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <label style={getLabelStyle(isDarkMode)}>System Prompt (optional)</label>
        <textarea
          style={getTextareaStyle(isDarkMode)}
          placeholder="Custom instructions for this agent..."
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button
            onClick={onClose}
            className="btn btn--secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="btn btn--primary"
          >
            Create Agent
          </button>
        </div>
      </div>
    </div>
  )
}
