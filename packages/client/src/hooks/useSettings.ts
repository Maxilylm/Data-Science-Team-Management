import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export function useSettings() {
  const queryClient = useQueryClient()

  const { data: providers = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ['providers'],
    queryFn: api.getProviders
  })

  const setActiveProviderMutation = useMutation({
    mutationFn: (providerId: string) => api.setActiveProvider(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
    }
  })

  const updateProviderConfigMutation = useMutation({
    mutationFn: ({ providerId, config }: { providerId: string; config: Record<string, unknown> }) =>
      api.updateProviderConfig(providerId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
    }
  })

  const testProviderMutation = useMutation({
    mutationFn: (providerId: string) => api.testProvider(providerId)
  })

  const { data: authConfig, isLoading: isLoadingAuth } = useQuery({
    queryKey: ['auth-config'],
    queryFn: api.getAuthConfig
  })

  const updateAuthMutation = useMutation({
    mutationFn: (config: { enabled: boolean }) => api.updateAuthConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-config'] })
    }
  })

  const generateTokenMutation = useMutation({
    mutationFn: () => api.generateAuthToken(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-config'] })
    }
  })

  return {
    providers,
    isLoadingProviders,
    setActiveProvider: setActiveProviderMutation.mutate,
    updateProviderConfig: updateProviderConfigMutation.mutate,
    testProvider: testProviderMutation.mutateAsync,
    isTestingProvider: testProviderMutation.isPending,
    authConfig,
    isLoadingAuth,
    updateAuth: updateAuthMutation.mutate,
    generateToken: generateTokenMutation.mutateAsync,
    isGeneratingToken: generateTokenMutation.isPending
  }
}
