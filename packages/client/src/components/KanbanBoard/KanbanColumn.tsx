import type { Task } from '../../types'
import TaskCard from '../TaskCard/TaskCard'

interface KanbanColumnProps {
  title: string
  tasks: Task[]
  color: string
  onTaskClick?: (task: Task) => void
}

const columnStyle: React.CSSProperties = {
  flex: 1,
  minWidth: '280px',
  backgroundColor: '#f4f5f7',
  borderRadius: '8px',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  maxHeight: 'calc(100vh - 200px)',
  overflowY: 'auto'
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '8px',
  fontWeight: 600
}

export default function KanbanColumn({ title, tasks, color, onTaskClick }: KanbanColumnProps) {
  return (
    <div style={columnStyle}>
      <div style={headerStyle}>
        <span style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: color
        }} />
        <span>{title}</span>
        <span style={{ color: '#666', fontWeight: 400 }}>({tasks.length})</span>
      </div>
      {tasks.map(task => (
        <TaskCard
          key={`${task.sessionId}-${task.id}`}
          task={task}
          onClick={() => onTaskClick?.(task)}
        />
      ))}
    </div>
  )
}
