import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export function useProjects(options?: { onError?: (msg: string) => void }) {
  const queryClient = useQueryClient()
  const onMutationError = (err: Error) => options?.onError?.(err.message)

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects
  })

  const projects = data?.projects ?? []
  const activeProjectId = data?.activeProjectId ?? null

  const activeProject = projects.find(p => p.id === activeProjectId) ?? null

  const createMutation = useMutation({
    mutationFn: (data: { name: string; path: string }) => api.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: onMutationError
  })

  const initializeMutation = useMutation({
    mutationFn: (data: { name: string; path: string }) => api.initializeProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: onMutationError
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: onMutationError
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.activateProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['config'] })
    },
    onError: onMutationError
  })

  return {
    projects,
    activeProject,
    activeProjectId,
    isLoading,
    error,
    createProject: createMutation.mutate,
    initializeProject: initializeMutation.mutate,
    deleteProject: deleteMutation.mutate,
    activateProject: activateMutation.mutate,
    isActivating: activateMutation.isPending
  }
}
