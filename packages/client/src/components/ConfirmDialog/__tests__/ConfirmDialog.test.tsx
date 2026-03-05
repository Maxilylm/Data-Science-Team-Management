import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import ConfirmDialog from '../ConfirmDialog'
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

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Delete agent',
    message: 'Are you sure?',
    confirmLabel: 'Delete',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(store).forEach(k => delete store[k])
    document.documentElement.classList.remove('dark', 'light')
  })

  it('renders title and message', () => {
    render(<ConfirmDialog {...defaultProps} />, { wrapper: withTheme })
    expect(screen.getByText('Delete agent')).toBeTruthy()
    expect(screen.getByText('Are you sure?')).toBeTruthy()
  })

  it('renders cancel and confirm buttons', () => {
    render(<ConfirmDialog {...defaultProps} />, { wrapper: withTheme })
    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /delete/i })).toBeTruthy()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />, { wrapper: withTheme })
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />, { wrapper: withTheme })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(defaultProps.onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Escape key is pressed', () => {
    render(<ConfirmDialog {...defaultProps} />, { wrapper: withTheme })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(defaultProps.onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when overlay backdrop is clicked', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} />, { wrapper: withTheme })
    const overlay = container.firstChild as HTMLElement
    fireEvent.click(overlay)
    expect(defaultProps.onCancel).toHaveBeenCalledOnce()
  })

  it('does not call onCancel when dialog content is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />, { wrapper: withTheme })
    fireEvent.click(screen.getByText('Delete agent'))
    expect(defaultProps.onCancel).not.toHaveBeenCalled()
  })

  it('confirm button has destructive (red) styling', () => {
    render(<ConfirmDialog {...defaultProps} confirmVariant="danger" />, { wrapper: withTheme })
    const confirmBtn = screen.getByRole('button', { name: /delete/i })
    const style = confirmBtn.getAttribute('style') || ''
    expect(style).toContain('rgb(239, 68, 68)')
  })

  it('applies dark background to dialog when ThemeContext is dark (no isDarkMode prop)', () => {
    store['darkMode'] = 'true'
    render(<ConfirmDialog {...defaultProps} />, { wrapper: withTheme })
    const dialog = screen.getByRole('dialog')
    const dialogContent = dialog.querySelector('[style]') as HTMLElement
    expect(dialogContent.style.backgroundColor).toBe('rgb(31, 41, 55)')
  })
})
