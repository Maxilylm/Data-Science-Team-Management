import { describe, it, expect } from 'vitest'
import { priorityColors, statusColors } from '../ticketColors'
import type { TicketPriority, TicketStatus } from '../../types'

describe('priorityColors', () => {
  const allPriorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent']

  it('has an entry for every TicketPriority', () => {
    for (const p of allPriorities) {
      expect(priorityColors).toHaveProperty(p)
    }
  })

  it('maps low priority to gray', () => {
    expect(priorityColors.low).toBe('#6b7280')
  })

  it('maps medium priority to blue', () => {
    expect(priorityColors.medium).toBe('#3b82f6')
  })

  it('maps high priority to amber', () => {
    expect(priorityColors.high).toBe('#f59e0b')
  })

  it('maps urgent priority to red', () => {
    expect(priorityColors.urgent).toBe('#ef4444')
  })
})

describe('statusColors', () => {
  const allStatuses: TicketStatus[] = ['unassigned', 'pending', 'in_progress', 'needs_help', 'completed']

  it('has an entry for every TicketStatus', () => {
    for (const s of allStatuses) {
      expect(statusColors).toHaveProperty(s)
    }
  })

  it('each entry has bg and text color', () => {
    for (const s of allStatuses) {
      expect(statusColors[s]).toHaveProperty('bg')
      expect(statusColors[s]).toHaveProperty('text')
    }
  })

  it('maps unassigned to gray', () => {
    expect(statusColors.unassigned).toEqual({ bg: '#f3f4f6', text: '#6b7280' })
  })

  it('maps in_progress to blue', () => {
    expect(statusColors.in_progress).toEqual({ bg: '#dbeafe', text: '#1e40af' })
  })

  it('maps completed to green', () => {
    expect(statusColors.completed).toEqual({ bg: '#d1fae5', text: '#065f46' })
  })

  it('maps needs_help to red', () => {
    expect(statusColors.needs_help).toEqual({ bg: '#fee2e2', text: '#991b1b' })
  })

  it('maps pending to amber', () => {
    expect(statusColors.pending).toEqual({ bg: '#fef3c7', text: '#92400e' })
  })
})
