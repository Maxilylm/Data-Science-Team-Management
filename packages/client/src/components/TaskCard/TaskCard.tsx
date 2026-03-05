import type { Task } from '../../types'

interface TaskCardProps {
  task: Task
  onClick?: () => void
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
      className="card card--interactive"
      onClick={onClick}
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
