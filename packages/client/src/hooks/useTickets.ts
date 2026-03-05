import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { Ticket, TicketPriority } from '../types'

export function useTickets() {
  const queryClient = useQueryClient()

  const { data: tickets = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tickets'],
    queryFn: api.getTickets,
    refetchInterval: 5000
  })

  const unassignedTickets = useMemo(
    () => tickets.filter(t => !t.assignedTo),
    [tickets]
  )

  const summary = useMemo(() => ({
    total: tickets.length,
    unassigned: unassignedTickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    needsHelp: tickets.filter(t => t.status === 'needs_help').length,
    completed: tickets.filter(t => t.status === 'completed').length
  }), [tickets, unassignedTickets])

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
    summary,
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
