import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import TicketDetailDialog from '../TicketDetailDialog'
import type { Ticket } from '../../../types'

// Mock localStorage to avoid Node built-in shadowing jsdom
const store: Record<string, string> = {}
const mockLocalStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
  get length() { return Object.keys(store).length },
  key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
}
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true })

const baseTicket: Ticket = {
  id: 'ticket-123',
  title: 'Fix the bug',
  description: 'A nasty bug',
  status: 'in_progress',
  priority: 'high',
  tags: ['bug'],
  createdBy: 'admin',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  assignedTo: null,
}

describe('TicketDetailDialog delete confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(store).forEach(k => delete store[k])
  })

  it('does not call window.confirm when delete button is clicked', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onDelete = vi.fn()

    render(
      <TicketDetailDialog
        ticket={baseTicket}
        isOpen={true}
        onClose={vi.fn()}
        onDelete={onDelete}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    expect(confirmSpy).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('shows ConfirmDialog with title and message when delete is clicked', () => {
    render(
      <TicketDetailDialog
        ticket={baseTicket}
        isOpen={true}
        onClose={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))

    expect(screen.getByText('Delete Ticket')).toBeTruthy()
    expect(screen.getByText(/are you sure you want to delete this ticket/i)).toBeTruthy()
  })

  it('calls onDelete and onClose when ConfirmDialog confirm button is clicked', () => {
    const onDelete = vi.fn()
    const onClose = vi.fn()

    render(
      <TicketDetailDialog
        ticket={baseTicket}
        isOpen={true}
        onClose={onClose}
        onDelete={onDelete}
      />
    )

    // Open the confirm dialog
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))

    // Click the confirm button inside ConfirmDialog (aria-labelledby="confirm-dialog-title")
    const confirmDialog = screen.getByRole('dialog', { name: /delete ticket/i })
    const confirmButton = confirmDialog.querySelector('button:last-child') as HTMLElement
    fireEvent.click(confirmButton)

    expect(onDelete).toHaveBeenCalledWith(baseTicket.id)
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onDelete when ConfirmDialog cancel button is clicked', () => {
    const onDelete = vi.fn()

    render(
      <TicketDetailDialog
        ticket={baseTicket}
        isOpen={true}
        onClose={vi.fn()}
        onDelete={onDelete}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onDelete).not.toHaveBeenCalled()
  })

  it('closes ConfirmDialog when cancel is clicked', () => {
    render(
      <TicketDetailDialog
        ticket={baseTicket}
        isOpen={true}
        onClose={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(screen.getByText('Delete Ticket')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText('Delete Ticket')).toBeNull()
  })
})
