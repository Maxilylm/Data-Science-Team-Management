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

const dialogStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '24px',
  width: '600px',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflowY: 'auto'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  marginBottom: '12px'
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  marginBottom: '4px',
  color: '#374151'
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical'
}

const colors = ['blue', 'green', 'purple', 'orange', 'red', 'pink', 'cyan', 'yellow']
const models = ['sonnet', 'opus', 'haiku']

export default function CreateAgentDialog({ isOpen, onSubmit, onClose }: CreateAgentDialogProps) {
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
      <div style={dialogStyle} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>
          Create New Agent
        </h2>

        <label style={labelStyle}>Agent ID</label>
        <input
          style={inputStyle}
          placeholder="e.g., data-analyst"
          value={id}
          onChange={e => setId(e.target.value)}
        />

        <label style={labelStyle}>Name</label>
        <input
          style={inputStyle}
          placeholder="e.g., Data Analyst"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <label style={labelStyle}>Description</label>
        <input
          style={inputStyle}
          placeholder="Brief description of what this agent does"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Model</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={model}
              onChange={e => setModel(e.target.value)}
            >
              {models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Color</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={color}
              onChange={e => setColor(e.target.value)}
            >
              {colors.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <label style={labelStyle}>System Prompt (optional)</label>
        <textarea
          style={textareaStyle}
          placeholder="Custom instructions for this agent..."
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            style={{
              padding: '10px 20px',
              backgroundColor: isValid ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isValid ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            Create Agent
          </button>
        </div>
      </div>
    </div>
  )
}
