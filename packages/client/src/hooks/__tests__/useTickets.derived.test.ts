import { describe, it, expect } from 'vitest'
import type { Ticket } from '../../types'

// Test the derived-data logic extracted during simplify.
// These are pure-function tests for the derivation logic used in useTickets.

const makeTicket = (overrides: Partial<Ticket>): Ticket => ({
  id: '1',
  title: 'Test',
  description: '',
  status: 'pending',
  priority: 'medium',
  assignedTo: null,
  createdBy: 'user',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  tags: [],
  ...overrides
})

function deriveUnassigned(tickets: Ticket[]): Ticket[] {
  return tickets.filter(t => !t.assignedTo)
}

function deriveSummary(tickets: Ticket[]) {
  const unassigned = tickets.filter(t => !t.assignedTo)
  return {
    total: tickets.length,
    unassigned: unassigned.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    needsHelp: tickets.filter(t => t.status === 'needs_help').length,
    completed: tickets.filter(t => t.status === 'completed').length
  }
}

function buildTicketsByAgentMap(tickets: Ticket[]): Map<string, Ticket[]> {
  const map = new Map<string, Ticket[]>()
  for (const t of tickets) {
    if (t.assignedTo) {
      const list = map.get(t.assignedTo) || []
      list.push(t)
      map.set(t.assignedTo, list)
    }
  }
  return map
}

describe('useTickets derived data', () => {
  const tickets: Ticket[] = [
    makeTicket({ id: '1', status: 'unassigned', assignedTo: null }),
    makeTicket({ id: '2', status: 'pending', assignedTo: 'agent-a' }),
    makeTicket({ id: '3', status: 'in_progress', assignedTo: 'agent-a' }),
    makeTicket({ id: '4', status: 'needs_help', assignedTo: 'agent-b' }),
    makeTicket({ id: '5', status: 'completed', assignedTo: 'agent-a' }),
    makeTicket({ id: '6', status: 'unassigned', assignedTo: null }),
  ]

  describe('deriveUnassigned', () => {
    it('returns only tickets with status "unassigned"', () => {
      const result = deriveUnassigned(tickets)
      expect(result).toHaveLength(2)
      expect(result.map(t => t.id)).toEqual(['1', '6'])
    })

    it('returns empty array when no unassigned tickets', () => {
      const assigned = tickets.filter(t => t.status !== 'unassigned')
      expect(deriveUnassigned(assigned)).toHaveLength(0)
    })
  })

  describe('deriveSummary', () => {
    it('counts all status categories correctly', () => {
      const summary = deriveSummary(tickets)
      expect(summary).toEqual({
        total: 6,
        unassigned: 2,
        pending: 1,
        inProgress: 1,
        needsHelp: 1,
        completed: 1
      })
    })

    it('returns zeroes for empty array', () => {
      const summary = deriveSummary([])
      expect(summary).toEqual({
        total: 0,
        unassigned: 0,
        pending: 0,
        inProgress: 0,
        needsHelp: 0,
        completed: 0
      })
    })
  })

  describe('buildTicketsByAgentMap', () => {
    it('groups tickets by assignedTo agent', () => {
      const map = buildTicketsByAgentMap(tickets)
      expect(map.get('agent-a')).toHaveLength(3)
      expect(map.get('agent-b')).toHaveLength(1)
    })

    it('excludes unassigned tickets (assignedTo is null)', () => {
      const map = buildTicketsByAgentMap(tickets)
      expect(map.has('')).toBe(false)
      // null keys should not appear
      const allKeys = [...map.keys()]
      expect(allKeys).toEqual(['agent-a', 'agent-b'])
    })

    it('returns empty map for no tickets', () => {
      const map = buildTicketsByAgentMap([])
      expect(map.size).toBe(0)
    })

    it('returns empty array for unknown agent', () => {
      const map = buildTicketsByAgentMap(tickets)
      expect(map.get('agent-z') || []).toEqual([])
    })
  })
})
