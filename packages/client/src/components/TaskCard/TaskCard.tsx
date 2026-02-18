import type { Task } from '../../types'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '6px',
  padding: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  cursor: 'pointer',
  transition: 'box-shadow 0.2s'
}

const subjectStyle: React.CSSProperties = {
  fontWeight: 500,
  marginBottom: '8px',
  fontSize: '14px'
}

const metaStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const inputRequestStyle: React.CSSProperties = {
  marginTop: '8px',
  padding: '8px',
  backgroundColor: '#fef3c7',
  borderRadius: '4px',
  fontSize: '12px'
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'
      }}
    >
      <div style={subjectStyle}>{task.subject}</div>
      <div style={metaStyle}>
        {task.agentId && (
          <span style={{
            backgroundColor: '#e5e7eb',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {task.agentId}
          </span>
        )}
        {task.activeForm && (
          <span style={{ fontStyle: 'italic' }}>
            {task.activeForm}
          </span>
        )}
      </div>
      {task.inputRequest && (
        <div style={inputRequestStyle}>
          <strong>Input needed:</strong> {task.inputRequest.question}
        </div>
      )}
      {task.blockedBy.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#dc2626' }}>
          Blocked by: {task.blockedBy.join(', ')}
        </div>
      )}
    </div>
  )
}
