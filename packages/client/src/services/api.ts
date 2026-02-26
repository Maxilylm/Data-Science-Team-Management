import type { Agent, Task, KanbanData, Ticket, TicketPriority, Project, BrowseResult } from '../types'

const BASE_URL = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json()
}

export const api = {
  // Agents
  getAgents(): Promise<Agent[]> {
    return fetchJson(`${BASE_URL}/agents`)
  },

  getAgent(id: string): Promise<Agent> {
    return fetchJson(`${BASE_URL}/agents/${id}`)
  },

  createAgent(agent: {
    id: string
    name: string
    description: string
    model?: string
    color?: string
    systemPrompt?: string
  }): Promise<Agent> {
    return fetchJson(`${BASE_URL}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent)
    })
  },

  spawnAgent(agentId: string, prompt: string, options?: { projectPath?: string; resume?: boolean }): Promise<{ sessionId: string; resumed?: boolean }> {
    return fetchJson(`${BASE_URL}/agents/${agentId}/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, projectPath: options?.projectPath, resume: options?.resume })
    })
  },

  sendInput(agentId: string, input: string): Promise<{ success: boolean }> {
    return fetchJson(`${BASE_URL}/agents/${agentId}/input`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    })
  },

  stopAgent(agentId: string): Promise<{ success: boolean }> {
    return fetchJson(`${BASE_URL}/agents/${agentId}/stop`, {
      method: 'POST'
    })
  },

  deleteAgent(agentId: string): Promise<{ success: boolean }> {
    return fetchJson(`${BASE_URL}/agents/${agentId}`, {
      method: 'DELETE'
    })
  },

  // Tasks
  getTasks(): Promise<Task[]> {
    return fetchJson(`${BASE_URL}/tasks`)
  },

  getKanbanTasks(): Promise<KanbanData> {
    return fetchJson(`${BASE_URL}/tasks/kanban`)
  },

  getTasksNeedingInput(): Promise<Task[]> {
    return fetchJson(`${BASE_URL}/tasks/needs-input`)
  },

  getTasksByAgent(agentId: string): Promise<Task[]> {
    return fetchJson(`${BASE_URL}/tasks/agent/${agentId}`)
  },

  getTaskStats(): Promise<{ pending: number; inProgress: number; completed: number; needsInput: number }> {
    return fetchJson(`${BASE_URL}/tasks/stats`)
  },

  // Config
  getConfig(): Promise<{ projectPath: string; projectName: string }> {
    return fetchJson(`${BASE_URL}/config`)
  },

  updateConfig(config: { projectPath?: string; projectName?: string }): Promise<{ projectPath: string; projectName: string }> {
    return fetchJson(`${BASE_URL}/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
  },

  // Projects
  getProjects(): Promise<{ projects: Project[]; activeProjectId: string | null }> {
    return fetchJson(`${BASE_URL}/config/projects`)
  },

  createProject(data: { name: string; path: string }): Promise<Project> {
    return fetchJson(`${BASE_URL}/config/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },

  initializeProject(data: { name: string; path: string }): Promise<Project> {
    return fetchJson(`${BASE_URL}/config/projects/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },

  deleteProject(id: string): Promise<{ success: boolean }> {
    return fetchJson(`${BASE_URL}/config/projects/${id}`, { method: 'DELETE' })
  },

  activateProject(id: string): Promise<Project> {
    return fetchJson(`${BASE_URL}/config/projects/${id}/activate`, { method: 'POST' })
  },

  browseDirectory(path?: string): Promise<BrowseResult> {
    const params = path ? `?path=${encodeURIComponent(path)}` : ''
    return fetchJson(`${BASE_URL}/config/filesystem/browse${params}`)
  },

  // Tickets
  getTickets(): Promise<Ticket[]> {
    return fetchJson(`${BASE_URL}/tickets`)
  },

  getTicketsByAgent(agentId: string): Promise<Ticket[]> {
    return fetchJson(`${BASE_URL}/tickets/agent/${agentId}`)
  },

  getUnassignedTickets(): Promise<Ticket[]> {
    return fetchJson(`${BASE_URL}/tickets/unassigned`)
  },

  getTicketsSummary(): Promise<{ total: number; unassigned: number; pending: number; inProgress: number; needsHelp: number; completed: number }> {
    return fetchJson(`${BASE_URL}/tickets/summary`)
  },

  createTicket(ticket: { title: string; description: string; assignedTo?: string; priority?: TicketPriority; tags?: string[] }): Promise<Ticket> {
    return fetchJson(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ticket, createdBy: 'user' })
    })
  },

  updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    return fetchJson(`${BASE_URL}/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
  },

  assignTicket(id: string, agentId: string | null): Promise<Ticket> {
    return fetchJson(`${BASE_URL}/tickets/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId })
    })
  },

  deleteTicket(id: string): Promise<{ success: boolean }> {
    return fetchJson(`${BASE_URL}/tickets/${id}`, { method: 'DELETE' })
  },

  answerTicketQuestion(id: string, answer: string): Promise<{ success: boolean; ticket: Ticket }> {
    return fetchJson(`${BASE_URL}/tickets/${id}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer })
    })
  }
}
