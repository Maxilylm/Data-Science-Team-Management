import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// Mock localStorage before App imports it
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

const mockAgent = {
  id: 'developer',
  name: 'Developer',
  description: 'Writes code',
  model: 'sonnet' as const,
  color: 'blue',
  status: 'idle' as const,
  sessionId: null,
  instances: [],
}

const mockDeleteAgent = vi.fn()

vi.mock('../hooks/useAgents', () => ({
  useAgents: () => ({
    agents: [mockAgent],
    spawnAgent: vi.fn(),
    stopAgent: vi.fn(),
    sendInput: vi.fn(),
    createAgent: vi.fn(),
    deleteAgent: mockDeleteAgent,
  }),
}))

vi.mock('../hooks/useTasks', () => ({
  useTasks: () => ({ tasksNeedingInput: [], refetch: vi.fn() }),
}))

vi.mock('../hooks/useTickets', () => ({
  useTickets: () => ({
    tickets: [],
    unassignedTickets: [],
    summary: { unassigned: 0, inProgress: 0, needsHelp: 0 },
    createTicket: vi.fn(),
    updateTicket: vi.fn(),
    assignTicket: vi.fn(),
    deleteTicket: vi.fn(),
    answerTicket: vi.fn(),
    refetch: vi.fn(),
  }),
}))

vi.mock('../hooks/useProjects', () => ({
  useProjects: () => ({
    projects: [],
    activeProject: null,
    activeProjectId: null,
    activateProject: vi.fn(),
    createProject: vi.fn(),
    initializeProject: vi.fn(),
    deleteProject: vi.fn(),
    isActivating: false,
  }),
}))

vi.mock('../hooks/useSSE', () => ({
  useSSE: () => undefined,
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthEnabled: false,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
  }),
}))

import App from '../App'

describe('App delete agent confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(store).forEach(k => delete store[k])
  })

  it('does not call window.confirm when delete agent button is clicked', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<App />)

    const deleteBtn = screen.getByTitle('Delete agent')
    fireEvent.click(deleteBtn)

    expect(confirmSpy).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('shows ConfirmDialog when delete agent button is clicked', () => {
    render(<App />)

    const deleteBtn = screen.getByTitle('Delete agent')
    fireEvent.click(deleteBtn)

    expect(screen.getByText('Delete Agent')).toBeTruthy()
    expect(screen.getByText(/delete agent.*This will remove/i)).toBeTruthy()
  })

  it('calls deleteAgent when ConfirmDialog confirm is clicked', () => {
    render(<App />)

    const deleteBtn = screen.getByTitle('Delete agent')
    fireEvent.click(deleteBtn)

    const confirmDialog = screen.getByRole('dialog', { name: /delete agent/i })
    const confirmButton = confirmDialog.querySelector('button:last-child') as HTMLElement
    fireEvent.click(confirmButton)

    expect(mockDeleteAgent).toHaveBeenCalledWith('developer')
  })

  it('does not call deleteAgent when ConfirmDialog cancel is clicked', () => {
    render(<App />)

    const deleteBtn = screen.getByTitle('Delete agent')
    fireEvent.click(deleteBtn)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockDeleteAgent).not.toHaveBeenCalled()
  })
})
