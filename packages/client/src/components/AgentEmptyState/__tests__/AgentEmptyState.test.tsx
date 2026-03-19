import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import AgentEmptyState from '../AgentEmptyState'
import { ThemeProvider } from '../../../contexts/ThemeContext'

// Mock localStorage for ThemeProvider
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

const withTheme = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('AgentEmptyState', () => {
  const defaultProps = {
    agentStatus: 'idle' as const,
    onAssignTicket: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(store).forEach(k => delete store[k])
    document.documentElement.classList.remove('dark', 'light')
  })

  describe('idle agent', () => {
    it('shows "No tickets assigned" message', () => {
      render(<AgentEmptyState {...defaultProps} agentStatus="idle" />, { wrapper: withTheme })
      expect(screen.getByText('No tickets assigned')).toBeTruthy()
    })

    it('shows "Assign a ticket" call-to-action', () => {
      render(<AgentEmptyState {...defaultProps} agentStatus="idle" />, { wrapper: withTheme })
      expect(screen.getByText(/assign a ticket/i)).toBeTruthy()
    })

    it('calls onAssignTicket when CTA is clicked', () => {
      const onAssignTicket = vi.fn()
      render(<AgentEmptyState {...defaultProps} agentStatus="idle" onAssignTicket={onAssignTicket} />, { wrapper: withTheme })
      fireEvent.click(screen.getByText(/assign a ticket/i))
      expect(onAssignTicket).toHaveBeenCalledOnce()
    })
  })

  describe('running agent', () => {
    it('shows "No tickets assigned" message', () => {
      render(<AgentEmptyState {...defaultProps} agentStatus="running" />, { wrapper: withTheme })
      expect(screen.getByText('No tickets assigned')).toBeTruthy()
    })

    it('shows a queuing message instead of the idle CTA', () => {
      render(<AgentEmptyState {...defaultProps} agentStatus="running" />, { wrapper: withTheme })
      expect(screen.getByText(/queue/i)).toBeTruthy()
    })

    it('does not show the idle assign CTA button', () => {
      render(<AgentEmptyState {...defaultProps} agentStatus="running" />, { wrapper: withTheme })
      // The CTA button should not be rendered for running agents
      const button = screen.queryByRole('button', { name: /assign a ticket/i })
      expect(button).toBeNull()
    })
  })

  describe('waiting_input agent', () => {
    it('shows "No tickets assigned" message', () => {
      render(<AgentEmptyState {...defaultProps} agentStatus="waiting_input" />, { wrapper: withTheme })
      expect(screen.getByText('No tickets assigned')).toBeTruthy()
    })

    it('shows "Assign a ticket" call-to-action like idle', () => {
      render(<AgentEmptyState {...defaultProps} agentStatus="waiting_input" />, { wrapper: withTheme })
      expect(screen.getByText(/assign a ticket/i)).toBeTruthy()
    })
  })

  it('renders without isDarkMode prop when wrapped in ThemeProvider', () => {
    // Verify the component works correctly with ThemeContext (no isDarkMode prop)
    expect(() => {
      render(<AgentEmptyState agentStatus="idle" onAssignTicket={vi.fn()} />, { wrapper: withTheme })
    }).not.toThrow()
    expect(screen.getByText('No tickets assigned')).toBeTruthy()
  })
})
