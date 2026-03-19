import { useState } from 'react'
import type { Agent } from '../../types'

interface PromptDialogProps {
  agent: Agent | null
  onSubmit: (agentId: string, prompt: string, resume?: boolean) => void
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
  width: '500px',
  maxWidth: '90vw',
  color: isDark ? '#e5e7eb' : 'inherit'
})

const getTextareaStyle = (isDark: boolean): React.CSSProperties => ({
  width: '100%',
  minHeight: '120px',
  padding: '12px',
  border: isDark ? '1px solid #4b5563' : '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  resize: 'vertical',
  marginBottom: '16px',
  backgroundColor: isDark ? '#374151' : 'white',
  color: isDark ? '#e5e7eb' : 'inherit'
})

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px'
}

export default function PromptDialog({ agent, onSubmit, onClose, isDarkMode = false }: PromptDialogProps) {
  const [prompt, setPrompt] = useState('')

  if (!agent) return null

  const canResume = !!agent.lastSessionId

  const handleSubmit = (resume: boolean = false) => {
    if (prompt.trim()) {
      onSubmit(agent.id, prompt, resume)
      setPrompt('')
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={getDialogStyle(isDarkMode)} onClick={e => e.stopPropagation()}>
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

        <p style={{ fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#666', marginBottom: '12px' }}>
          {agent.description.slice(0, 200)}
        </p>

        {canResume && (
          <div style={{
            backgroundColor: isDarkMode ? '#065f46' : '#f0fdf4',
            border: isDarkMode ? '1px solid #10b981' : '1px solid #86efac',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '12px',
            fontSize: '13px',
            color: isDarkMode ? '#6ee7b7' : '#166534'
          }}>
            This agent has a previous session that can be resumed.
          </div>
        )}

        <textarea
          style={getTextareaStyle(isDarkMode)}
          placeholder="Describe the task for this agent..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          autoFocus
        />

        <div style={buttonRowStyle}>
          <button
            onClick={onClose}
            className="btn btn--secondary"
          >
            Cancel
          </button>
          {canResume && (
            <button
              onClick={() => handleSubmit(true)}
              disabled={!prompt.trim()}
              className="btn btn--success"
            >
              Resume Session
            </button>
          )}
          <button
            onClick={() => handleSubmit(false)}
            disabled={!prompt.trim()}
            className="btn btn--primary"
          >
            {canResume ? 'New Session' : 'Start Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
