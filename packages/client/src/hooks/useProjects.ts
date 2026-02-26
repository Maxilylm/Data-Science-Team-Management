import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export function useProjects() {
  const queryClient = useQueryClient()

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
    }
  })

  const initializeMutation = useMutation({
    mutationFn: (data: { name: string; path: string }) => api.initializeProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.activateProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['config'] })
    }
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
