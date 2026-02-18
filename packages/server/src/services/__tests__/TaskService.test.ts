import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TaskService } from '../TaskService'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

describe('TaskService', () => {
  let service: TaskService
  let testDir: string

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `test-tasks-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })
    service = new TaskService(testDir)
  })

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('should load all tasks across sessions', async () => {
    const session1 = path.join(testDir, 'session-1')
    const session2 = path.join(testDir, 'session-2')
    await fs.mkdir(session1)
    await fs.mkdir(session2)

    await fs.writeFile(path.join(session1, '1.json'), JSON.stringify({
      id: '1', subject: 'Task 1', status: 'pending', agentId: 'agent-a'
    }))
    await fs.writeFile(path.join(session2, '1.json'), JSON.stringify({
      id: '1', subject: 'Task 2', status: 'in_progress', agentId: 'agent-b'
    }))

    await service.loadAllTasks()
    const tasks = service.getAllTasks()

    expect(tasks).toHaveLength(2)
  })

  it('should get tasks by agent', async () => {
    const session = path.join(testDir, 'session-1')
    await fs.mkdir(session)

    await fs.writeFile(path.join(session, '1.json'), JSON.stringify({
      id: '1', subject: 'Task 1', status: 'pending', agentId: 'eda-analyst'
    }))
    await fs.writeFile(path.join(session, '2.json'), JSON.stringify({
      id: '2', subject: 'Task 2', status: 'pending', agentId: 'mlops-engineer'
    }))

    await service.loadAllTasks()
    const edaTasks = service.getTasksByAgent('eda-analyst')

    expect(edaTasks).toHaveLength(1)
    expect(edaTasks[0].subject).toBe('Task 1')
  })

  it('should filter tasks needing input', async () => {
    const session = path.join(testDir, 'session-1')
    await fs.mkdir(session)

    await fs.writeFile(path.join(session, '1.json'), JSON.stringify({
      id: '1', subject: 'Task 1', status: 'needs_input',
      inputRequest: { question: 'What next?', timestamp: new Date().toISOString() }
    }))

    await service.loadAllTasks()
    const needsInput = service.getTasksNeedingInput()

    expect(needsInput).toHaveLength(1)
  })
})
