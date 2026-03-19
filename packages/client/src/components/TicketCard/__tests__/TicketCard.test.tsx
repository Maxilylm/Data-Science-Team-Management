import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TicketCard from '../TicketCard'
import type { Ticket } from '../../../types'

const baseTicket: Ticket = {
  id: 'ticket-1',
  title: 'Fix login bug',
  description: 'Users cannot log in',
  status: 'in_progress',
  priority: 'high',
  tags: ['auth', 'bug'],
  createdBy: 'admin',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  assignedTo: null
}

describe('TicketCard accessibility', () => {
  it('status badge has role=status', () => {
    render(<TicketCard ticket={baseTicket} />)
    const badge = screen.getByRole('status')
    expect(badge).toBeTruthy()
    expect(badge.textContent?.toLowerCase()).toContain('in progress')
  })

  it('Assign button has an aria-label', () => {
    render(<TicketCard ticket={baseTicket} onAssign={vi.fn()} />)
    const assignBtn = screen.getByRole('button', { name: /assign/i })
    expect(assignBtn.getAttribute('aria-label')).toBeTruthy()
  })
})
