import type { KanbanData, Task } from '../../types'
import KanbanColumn from './KanbanColumn'

interface KanbanBoardProps {
  data: KanbanData
  onTaskClick?: (task: Task) => void
}

const boardStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  padding: '16px',
  overflowX: 'auto'
}

export default function KanbanBoard({ data, onTaskClick }: KanbanBoardProps) {
  return (
    <div style={boardStyle}>
      <KanbanColumn
        title="Needs Input"
        tasks={data.needs_input}
        color="#f59e0b"
        onTaskClick={onTaskClick}
      />
      <KanbanColumn
        title="Pending"
        tasks={data.pending}
        color="#6b7280"
        onTaskClick={onTaskClick}
      />
      <KanbanColumn
        title="In Progress"
        tasks={data.in_progress}
        color="#3b82f6"
        onTaskClick={onTaskClick}
      />
      <KanbanColumn
        title="Completed"
        tasks={data.completed}
        color="#10b981"
        onTaskClick={onTaskClick}
      />
    </div>
  )
}
