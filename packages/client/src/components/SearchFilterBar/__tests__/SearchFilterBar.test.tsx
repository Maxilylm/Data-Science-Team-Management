import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import SearchFilterBar from '../SearchFilterBar'
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

describe('SearchFilterBar', () => {
  const defaultProps = {
    onFilterChange: vi.fn(),
    isDarkMode: false,
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    Object.keys(store).forEach(k => delete store[k])
    document.documentElement.classList.remove('dark', 'light')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders search input and filter dropdowns', () => {
    render(<SearchFilterBar {...defaultProps} />, { wrapper: withTheme })
    expect(screen.getByPlaceholderText(/search tickets/i)).toBeTruthy()
    expect(screen.getByText('Status:')).toBeTruthy()
    expect(screen.getByText('Priority:')).toBeTruthy()
  })

  it('debounces search input - does not fire immediately', () => {
    render(<SearchFilterBar {...defaultProps} />, { wrapper: withTheme })
    const input = screen.getByPlaceholderText(/search tickets/i)

    fireEvent.change(input, { target: { value: 'test' } })

    // onFilterChange should NOT be called immediately
    expect(defaultProps.onFilterChange).not.toHaveBeenCalled()
  })

  it('debounces search input - fires after 250ms', () => {
    render(<SearchFilterBar {...defaultProps} />, { wrapper: withTheme })
    const input = screen.getByPlaceholderText(/search tickets/i)

    fireEvent.change(input, { target: { value: 'test' } })

    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(defaultProps.onFilterChange).toHaveBeenCalledTimes(1)
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ searchQuery: 'test' })
    )
  })

  it('debounces rapid keystrokes - only fires once', () => {
    render(<SearchFilterBar {...defaultProps} />, { wrapper: withTheme })
    const input = screen.getByPlaceholderText(/search tickets/i)

    fireEvent.change(input, { target: { value: 't' } })
    act(() => { vi.advanceTimersByTime(100) })
    fireEvent.change(input, { target: { value: 'te' } })
    act(() => { vi.advanceTimersByTime(100) })
    fireEvent.change(input, { target: { value: 'tes' } })
    act(() => { vi.advanceTimersByTime(250) })

    expect(defaultProps.onFilterChange).toHaveBeenCalledTimes(1)
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ searchQuery: 'tes' })
    )
  })

  it('status change fires immediately (no debounce)', () => {
    render(<SearchFilterBar {...defaultProps} />, { wrapper: withTheme })
    const statusSelect = screen.getAllByRole('combobox')[0]

    fireEvent.change(statusSelect, { target: { value: 'pending' } })

    expect(defaultProps.onFilterChange).toHaveBeenCalledTimes(1)
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' })
    )
  })

  it('priority change fires immediately (no debounce)', () => {
    render(<SearchFilterBar {...defaultProps} />, { wrapper: withTheme })
    const prioritySelect = screen.getAllByRole('combobox')[1]

    fireEvent.change(prioritySelect, { target: { value: 'high' } })

    expect(defaultProps.onFilterChange).toHaveBeenCalledTimes(1)
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'high' })
    )
  })

  it('clear filters resets all state', () => {
    render(<SearchFilterBar {...defaultProps} />, { wrapper: withTheme })
    const statusSelect = screen.getAllByRole('combobox')[0]

    // Set a filter first
    fireEvent.change(statusSelect, { target: { value: 'pending' } })
    vi.clearAllMocks()

    // Clear button should now appear
    const clearBtn = screen.getByText('Clear filters')
    fireEvent.click(clearBtn)

    expect(defaultProps.onFilterChange).toHaveBeenCalledWith({
      searchQuery: '',
      status: null,
      priority: null,
      agentId: null
    })
  })

  it('shows agent filter when agents are provided', () => {
    const agents = [
      { id: 'a1', name: 'Agent 1', description: '', model: 'sonnet' as const, color: '#000', status: 'idle' as const, sessionId: null, instances: [] }
    ]
    render(<SearchFilterBar {...defaultProps} agents={agents} />, { wrapper: withTheme })
    expect(screen.getByText('Agent:')).toBeTruthy()
    expect(screen.getByText('Agent 1')).toBeTruthy()
  })

  it('applies dark background when isDarkMode is true', () => {
    const { container } = render(<SearchFilterBar {...defaultProps} isDarkMode />, { wrapper: withTheme })
    const containerDiv = container.firstChild as HTMLElement
    expect(containerDiv.style.backgroundColor).toBe('rgb(31, 41, 55)')
  })
})
