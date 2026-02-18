import type { Agent, Task, KanbanData } from '../types'

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

  spawnAgent(agentId: string, prompt: string, projectPath?: string): Promise<{ sessionId: string }> {
    return fetchJson(`${BASE_URL}/agents/${agentId}/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, projectPath })
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
  }
}
