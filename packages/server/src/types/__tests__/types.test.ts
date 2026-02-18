import { describe, it, expect } from 'vitest'
import type { Agent, AgentStatus } from '../Agent'
import type { Task, TaskStatus } from '../Task'
import type { Session } from '../Session'

describe('Agent type', () => {
  it('should have required fields', () => {
    const agent: Agent = {
      id: 'test-agent',
      name: 'Test Agent',
      description: 'A test agent',
      model: 'sonnet',
      color: 'blue',
      status: 'idle',
      sessionId: null,
      configPath: '/path/to/config.md'
    }
    expect(agent.id).toBe('test-agent')
    expect(agent.status).toBe('idle')
  })
})

describe('Task type', () => {
  it('should have required fields including agentId', () => {
    const task: Task = {
      id: '1',
      subject: 'Test Task',
      description: 'A test task',
      status: 'pending',
      agentId: 'test-agent',
      sessionId: 'session-123',
      blocks: [],
      blockedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    expect(task.agentId).toBe('test-agent')
    expect(task.status).toBe('pending')
  })
})

describe('Session type', () => {
  it('should track agent and task associations', () => {
    const session: Session = {
      id: 'session-123',
      agentId: 'test-agent',
      projectPath: '/path/to/project',
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      taskIds: ['1', '2', '3']
    }
    expect(session.agentId).toBe('test-agent')
    expect(session.taskIds).toHaveLength(3)
  })
})
