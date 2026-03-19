import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { Task } from '../types'

export function useTasks() {
  const { data: allTasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: api.getTasks,
    refetchInterval: 5000
  })

  const kanbanData = useMemo(() => ({
    pending: allTasks.filter((t: Task) => t.status === 'pending'),
    in_progress: allTasks.filter((t: Task) => t.status === 'in_progress'),
    completed: allTasks.filter((t: Task) => t.status === 'completed'),
    needs_input: allTasks.filter((t: Task) => t.status === 'needs_input')
  }), [allTasks])

  const tasksNeedingInput = kanbanData.needs_input

  return {
    kanbanData,
    tasksNeedingInput,
    isLoading,
    error,
    refetch
  }
}
