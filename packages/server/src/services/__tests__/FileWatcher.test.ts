import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FileWatcher } from '../FileWatcher'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

describe('FileWatcher', () => {
  let testDir: string
  let watcher: FileWatcher

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `test-watcher-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })
    watcher = new FileWatcher(testDir)
  })

  afterEach(async () => {
    await watcher.stop()
    await fs.rm(testDir, { recursive: true, force: true })
  })

  it('should emit event when task file is created', async () => {
    const events: any[] = []
    watcher.on('taskChange', (event) => events.push(event))

    await watcher.start()

    const sessionDir = path.join(testDir, 'session-123')
    await fs.mkdir(sessionDir, { recursive: true })

    const taskFile = path.join(sessionDir, '1.json')
    await fs.writeFile(taskFile, JSON.stringify({
      id: '1',
      subject: 'Test Task',
      status: 'pending'
    }))

    await new Promise(r => setTimeout(r, 200))

    expect(events.length).toBeGreaterThan(0)
    expect(events[0].sessionId).toBe('session-123')
    expect(events[0].task.subject).toBe('Test Task')
  })
})
