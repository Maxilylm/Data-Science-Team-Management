import { EventEmitter } from 'events'
import chokidar from 'chokidar'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import type { Task } from '../types/Task'

export interface TaskChangeEvent {
  type: 'add' | 'change' | 'unlink'
  sessionId: string
  taskId: string
  task: Task | null
}

export class FileWatcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null
  private watchPath: string
  private isShuttingDown = false

  constructor(watchPath?: string) {
    super()
    const homeDir = process.env.HOME || os.homedir()
    this.watchPath = watchPath || path.join(homeDir, '.claude', 'tasks')
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.watcher = chokidar.watch(this.watchPath, {
        persistent: true,
        ignoreInitial: true,
        depth: 2
      })

      this.watcher.on('add', (filePath) => this.handleFileChange('add', filePath))
      this.watcher.on('change', (filePath) => this.handleFileChange('change', filePath))
      this.watcher.on('unlink', (filePath) => this.handleFileChange('unlink', filePath))
      this.watcher.on('ready', () => resolve())
      this.watcher.on('error', (error) => reject(error))
    })
  }

  private async handleFileChange(type: 'add' | 'change' | 'unlink', filePath: string): Promise<void> {
    if (this.isShuttingDown) return

    if (!filePath.endsWith('.json')) return

    const relativePath = path.relative(this.watchPath, filePath)
    const parts = relativePath.split(path.sep)

    if (parts.length !== 2) return

    const [sessionId, fileName] = parts
    const taskId = path.basename(fileName, '.json')

    let task: Task | null = null

    if (type !== 'unlink') {
      try {
        const content = await fs.readFile(filePath, 'utf-8')
        const parsed = JSON.parse(content)

        // Validate required Task fields
        if (!parsed.id || !parsed.subject) {
          this.emit('parseError', { filePath, error: 'Missing required fields (id, subject)' })
          return
        }

        task = parsed as Task
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.emit('parseError', { filePath, error: errorMessage })
        return
      }
    }

    const event: TaskChangeEvent = { type, sessionId, taskId, task }
    this.emit('taskChange', event)
  }

  async stop(): Promise<void> {
    if (!this.watcher) return

    this.isShuttingDown = true
    await this.watcher.close()
    this.watcher = null
    this.isShuttingDown = false
  }
}
