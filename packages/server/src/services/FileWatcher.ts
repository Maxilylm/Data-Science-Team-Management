import { EventEmitter } from 'events'
import chokidar from 'chokidar'
import * as fs from 'fs/promises'
import * as path from 'path'
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

  constructor(watchPath?: string) {
    super()
    this.watchPath = watchPath || path.join(process.env.HOME || '', '.claude', 'tasks')
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.watcher = chokidar.watch(this.watchPath, {
        persistent: true,
        ignoreInitial: true,
        depth: 2
      })

      this.watcher.on('add', (filePath) => this.handleFileChange('add', filePath))
      this.watcher.on('change', (filePath) => this.handleFileChange('change', filePath))
      this.watcher.on('unlink', (filePath) => this.handleFileChange('unlink', filePath))
      this.watcher.on('ready', () => resolve())
    })
  }

  private async handleFileChange(type: 'add' | 'change' | 'unlink', filePath: string): Promise<void> {
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
        task = JSON.parse(content) as Task
      } catch {
        return
      }
    }

    const event: TaskChangeEvent = { type, sessionId, taskId, task }
    this.emit('taskChange', event)
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
    }
  }
}
