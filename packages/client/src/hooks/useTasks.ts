import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export function useTasks() {
  const { data: kanbanData, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', 'kanban'],
    queryFn: api.getKanbanTasks,
    refetchInterval: 2000
  })

  const { data: tasksNeedingInput = [] } = useQuery({
    queryKey: ['tasks', 'needs-input'],
    queryFn: api.getTasksNeedingInput,
    refetchInterval: 1000
  })

  return {
    kanbanData: kanbanData || { pending: [], in_progress: [], completed: [], needs_input: [] },
    tasksNeedingInput,
    isLoading,
    error,
    refetch
  }
}
