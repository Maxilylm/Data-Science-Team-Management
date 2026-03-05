import type { TicketPriority, TicketStatus } from '../types'

/**
 * Maps each ticket priority to its indicator color.
 * Used for border-left accents, badges, and priority selectors.
 */
export const priorityColors: Record<TicketPriority, string> = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444'
}

/**
 * Maps each ticket status to its badge background and text colors.
 * Used for status badges and status selectors.
 */
export const statusColors: Record<TicketStatus, { bg: string; text: string }> = {
  unassigned: { bg: '#f3f4f6', text: '#6b7280' },
  pending: { bg: '#fef3c7', text: '#92400e' },
  in_progress: { bg: '#dbeafe', text: '#1e40af' },
  needs_help: { bg: '#fee2e2', text: '#991b1b' },
  completed: { bg: '#d1fae5', text: '#065f46' }
}
