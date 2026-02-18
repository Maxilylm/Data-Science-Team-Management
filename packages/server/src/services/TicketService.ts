import { EventEmitter } from 'events'
import type { Ticket, TicketStatus, TicketPriority } from '../types/Agent'

export class TicketService extends EventEmitter {
  private tickets: Map<string, Ticket> = new Map()

  createTicket(data: {
    title: string
    description: string
    createdBy: string
    assignedTo?: string
    priority?: TicketPriority
    parentTicketId?: string
    tags?: string[]
  }): Ticket {
    const id = `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const now = new Date()

    const ticket: Ticket = {
      id,
      title: data.title,
      description: data.description,
      status: data.assignedTo ? 'pending' : 'unassigned',
      priority: data.priority || 'medium',
      assignedTo: data.assignedTo || null,
      createdBy: data.createdBy,
      createdAt: now,
      updatedAt: now,
      parentTicketId: data.parentTicketId,
      tags: data.tags || []
    }

    this.tickets.set(id, ticket)
    this.emit('ticketCreated', ticket)
    return ticket
  }

  updateTicket(id: string, updates: Partial<Omit<Ticket, 'id' | 'createdAt' | 'createdBy'>>): Ticket | null {
    const ticket = this.tickets.get(id)
    if (!ticket) return null

    const updated: Ticket = {
      ...ticket,
      ...updates,
      updatedAt: new Date()
    }

    this.tickets.set(id, updated)
    this.emit('ticketUpdated', updated)
    return updated
  }

  assignTicket(id: string, agentId: string | null): Ticket | null {
    return this.updateTicket(id, {
      assignedTo: agentId,
      status: agentId ? 'pending' : 'unassigned'
    })
  }

  updateStatus(id: string, status: TicketStatus): Ticket | null {
    return this.updateTicket(id, { status })
  }

  requestHelp(id: string, fromAgent: string, message: string, targetAgent?: string): Ticket | null {
    return this.updateTicket(id, {
      status: 'needs_help',
      helpRequest: { fromAgent, message, targetAgent }
    })
  }

  resolveHelp(id: string): Ticket | null {
    const ticket = this.tickets.get(id)
    if (!ticket) return null

    return this.updateTicket(id, {
      status: 'in_progress',
      helpRequest: undefined
    })
  }

  getTicket(id: string): Ticket | undefined {
    return this.tickets.get(id)
  }

  getAllTickets(): Ticket[] {
    return Array.from(this.tickets.values())
  }

  getTicketsByAgent(agentId: string): Ticket[] {
    return this.getAllTickets().filter(t => t.assignedTo === agentId)
  }

  getUnassignedTickets(): Ticket[] {
    return this.getAllTickets().filter(t => t.assignedTo === null)
  }

  getTicketsByStatus(status: TicketStatus): Ticket[] {
    return this.getAllTickets().filter(t => t.status === status)
  }

  getTicketsNeedingHelp(): Ticket[] {
    return this.getAllTickets().filter(t => t.status === 'needs_help')
  }

  deleteTicket(id: string): boolean {
    const ticket = this.tickets.get(id)
    if (!ticket) return false

    this.tickets.delete(id)
    this.emit('ticketDeleted', ticket)
    return true
  }

  // Get summary for dashboard
  getSummary() {
    const tickets = this.getAllTickets()
    return {
      total: tickets.length,
      unassigned: tickets.filter(t => t.status === 'unassigned').length,
      pending: tickets.filter(t => t.status === 'pending').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      needsHelp: tickets.filter(t => t.status === 'needs_help').length,
      completed: tickets.filter(t => t.status === 'completed').length
    }
  }
}
