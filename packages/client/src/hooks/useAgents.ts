import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export function useAgents() {
  const queryClient = useQueryClient()

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: api.getAgents,
    refetchInterval: 5000
  })

  const spawnMutation = useMutation({
    mutationFn: ({ agentId, prompt, resume }: { agentId: string; prompt: string; resume?: boolean }) =>
      api.spawnAgent(agentId, prompt, { resume }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })

  const stopMutation = useMutation({
    mutationFn: api.stopAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })

  const sendInputMutation = useMutation({
    mutationFn: ({ agentId, input }: { agentId: string; input: string }) =>
      api.sendInput(agentId, input)
  })

  const createMutation = useMutation({
    mutationFn: api.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })

  return {
    agents,
    isLoading,
    error,
    spawnAgent: spawnMutation.mutate,
    stopAgent: stopMutation.mutate,
    sendInput: sendInputMutation.mutate,
    createAgent: createMutation.mutate,
    deleteAgent: deleteMutation.mutate
  }
}
