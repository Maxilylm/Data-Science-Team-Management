import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { Ticket, TicketPriority } from '../types'

export function useTickets() {
  const queryClient = useQueryClient()

  const { data: tickets = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tickets'],
    queryFn: api.getTickets,
    refetchInterval: 2000
  })

  const { data: unassignedTickets = [] } = useQuery({
    queryKey: ['tickets', 'unassigned'],
    queryFn: api.getUnassignedTickets,
    refetchInterval: 2000
  })

  const { data: summary } = useQuery({
    queryKey: ['tickets', 'summary'],
    queryFn: api.getTicketsSummary,
    refetchInterval: 2000
  })

  const createTicketMutation = useMutation({
    mutationFn: (ticket: {
      title: string
      description: string
      assignedTo?: string
      priority?: TicketPriority
      tags?: string[]
    }) => api.createTicket(ticket),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    }
  })

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Ticket> }) =>
      api.updateTicket(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    }
  })

  const assignTicketMutation = useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string | null }) =>
      api.assignTicket(id, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    }
  })

  const deleteTicketMutation = useMutation({
    mutationFn: (id: string) => api.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    }
  })

  const answerTicketMutation = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      api.answerTicketQuestion(id, answer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    }
  })

  const getTicketsByAgent = (agentId: string): Ticket[] => {
    return tickets.filter(t => t.assignedTo === agentId)
  }

  return {
    tickets,
    unassignedTickets,
    summary: summary || { total: 0, unassigned: 0, pending: 0, inProgress: 0, needsHelp: 0, completed: 0 },
    isLoading,
    error,
    refetch,
    getTicketsByAgent,
    createTicket: createTicketMutation.mutate,
    updateTicket: updateTicketMutation.mutate,
    assignTicket: assignTicketMutation.mutate,
    deleteTicket: deleteTicketMutation.mutate,
    answerTicket: answerTicketMutation.mutate,
    isCreating: createTicketMutation.isPending,
    isAnswering: answerTicketMutation.isPending
  }
}
