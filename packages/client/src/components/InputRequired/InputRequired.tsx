import { useState } from 'react'
import type { Task } from '../../types'

interface InputRequiredProps {
  tasks: Task[]
  onSubmitInput: (agentId: string, input: string) => void
}

const panelStyle: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  borderLeft: '4px solid #f59e0b',
  padding: '16px',
  marginBottom: '16px'
}

const taskItemStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '6px',
  padding: '12px',
  marginBottom: '8px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
}

export default function InputRequired({ tasks, onSubmitInput }: InputRequiredProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({})

  if (tasks.length === 0) return null

  const handleSubmit = (task: Task) => {
    const input = inputs[task.id]
    if (input?.trim() && task.agentId) {
      onSubmitInput(task.agentId, input)
      setInputs(prev => ({ ...prev, [task.id]: '' }))
    }
  }

  return (
    <div style={panelStyle}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
        Input Required ({tasks.length})
      </h3>
      {tasks.map(task => (
        <div key={`${task.sessionId}-${task.id}`} style={taskItemStyle}>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>{task.subject}</div>
          {task.agentId && (
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
              Agent: {task.agentId}
            </div>
          )}
          {task.inputRequest && (
            <>
              <div style={{ marginBottom: '8px' }}>
                {task.inputRequest.question}
              </div>
              {task.inputRequest.options ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {task.inputRequest.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => task.agentId && onSubmitInput(task.agentId, option)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={inputs[task.id] || ''}
                    onChange={e => setInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit(task)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                    placeholder="Type your response..."
                  />
                  <button
                    onClick={() => handleSubmit(task)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                  >
                    Send
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
