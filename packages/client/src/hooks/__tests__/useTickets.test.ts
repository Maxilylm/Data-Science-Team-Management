import { describe, it, expect } from 'vitest'
import type { Ticket } from '../../types'

// Test the ticket filtering logic that will be used
function getTicketsByAgent(tickets: Ticket[], agentId: string): Ticket[] {
  // Case-insensitive comparison for assignedTo
  const normalizedAgentId = agentId.toLowerCase()
  return tickets.filter(t => t.assignedTo?.toLowerCase() === normalizedAgentId)
}

describe('ticket filtering', () => {
  const mockTickets: Ticket[] = [
    {
      id: '1',
      title: 'Test ticket 1',
      description: 'Test',
      status: 'pending',
      priority: 'medium',
      assignedTo: 'Developer',  // Capitalized
      createdBy: 'user',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      tags: []
    },
    {
      id: '2',
      title: 'Test ticket 2',
      description: 'Test',
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'developer',  // lowercase
      createdBy: 'user',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      tags: []
    },
    {
      id: '3',
      title: 'Unassigned ticket',
      description: 'Test',
      status: 'unassigned',
      priority: 'low',
      assignedTo: null,
      createdBy: 'user',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      tags: []
    }
  ]

  it('should match tickets regardless of case', () => {
    // Agent ID is lowercase but ticket has capitalized assignedTo
    const result = getTicketsByAgent(mockTickets, 'developer')
    expect(result).toHaveLength(2)
    expect(result.map(t => t.id)).toContain('1')
    expect(result.map(t => t.id)).toContain('2')
  })

  it('should match when agent ID is capitalized', () => {
    const result = getTicketsByAgent(mockTickets, 'Developer')
    expect(result).toHaveLength(2)
  })

  it('should not match unassigned tickets', () => {
    const result = getTicketsByAgent(mockTickets, 'developer')
    expect(result.map(t => t.id)).not.toContain('3')
  })
})
