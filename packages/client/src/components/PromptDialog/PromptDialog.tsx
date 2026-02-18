import { useState } from 'react'
import type { Agent } from '../../types'

interface PromptDialogProps {
  agent: Agent | null
  onSubmit: (agentId: string, prompt: string) => void
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
  width: '500px',
  maxWidth: '90vw'
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '120px',
  padding: '12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  resize: 'vertical',
  marginBottom: '16px'
}

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px'
}

export default function PromptDialog({ agent, onSubmit, onClose }: PromptDialogProps) {
  const [prompt, setPrompt] = useState('')

  if (!agent) return null

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(agent.id, prompt)
      setPrompt('')
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: agent.color
          }} />
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
            Task {agent.name}
          </h2>
        </div>

        <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
          {agent.description.slice(0, 200)}
        </p>

        <textarea
          style={textareaStyle}
          placeholder="Describe the task for this agent..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          autoFocus
        />

        <div style={buttonRowStyle}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: prompt.trim() ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: prompt.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Start Task
          </button>
        </div>
      </div>
    </div>
  )
}
