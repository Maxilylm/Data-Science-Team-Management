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
      instances: [],
      configPath: '/path/to/config.md'
    }
    expect(agent.id).toBe('test-agent')
    expect(agent.status).toBe('idle')
  })

  it('should support optional task and tool fields', () => {
    const agent: Agent = {
      id: 'test-agent',
      name: 'Test Agent',
      description: 'A test agent',
      model: 'opus',
      color: 'green',
      status: 'running',
      sessionId: 'session-123',
      instances: [],
      configPath: '/path/to/config.md',
      currentTaskId: 'task-1',
      tools: ['tool1', 'tool2'],
      lastError: 'Something went wrong'
    }
    expect(agent.model).toBe('opus')
    expect(agent.currentTaskId).toBe('task-1')
    expect(agent.tools).toHaveLength(2)
    expect(agent.lastError).toBeDefined()
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

  it('should support optional activeFormDisplay and inputRequest', () => {
    const task: Task = {
      id: '2',
      subject: 'Running Task',
      description: 'A task in progress',
      status: 'in_progress',
      agentId: 'test-agent',
      sessionId: 'session-123',
      activeFormDisplay: 'Running tests',
      blocks: [],
      blockedBy: [],
      inputRequest: {
        question: 'What is your answer?',
        options: ['Yes', 'No'],
        timestamp: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    expect(task.activeFormDisplay).toBe('Running tests')
    expect(task.inputRequest?.question).toBe('What is your answer?')
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

  it('should support optional endedAt for closed sessions', () => {
    const now = new Date().toISOString()
    const session: Session = {
      id: 'session-123',
      agentId: null,
      projectPath: null,
      startedAt: now,
      lastActivity: now,
      taskIds: [],
      endedAt: now
    }
    expect(session.endedAt).toBe(now)
  })
})
