import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'

export interface ClaudeRunnerOptions {
  agentId: string
  prompt: string
  projectPath?: string
  model?: 'sonnet' | 'opus' | 'haiku'
  onOutput?: (data: string) => void
  onError?: (data: string) => void
}

export interface RunningSession {
  process: ChildProcess
  agentId: string
  sessionId: string
  startedAt: Date
}

export class ClaudeRunner extends EventEmitter {
  private sessions: Map<string, RunningSession> = new Map()

  buildCommand(options: ClaudeRunnerOptions): string {
    const args: string[] = ['claude']

    if (options.agentId) {
      args.push('--agent', options.agentId)
    }

    if (options.model) {
      args.push('--model', options.model)
    }

    if (options.projectPath) {
      args.push('--cwd', options.projectPath)
    }

    args.push('--print')
    args.push('-p', `"${options.prompt.replace(/"/g, '\\"')}"`)

    return args.join(' ')
  }

  async spawn(options: ClaudeRunnerOptions): Promise<string> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const args: string[] = []

    if (options.agentId) {
      args.push('--agent', options.agentId)
    }

    if (options.model) {
      args.push('--model', options.model)
    }

    if (options.projectPath) {
      args.push('--cwd', options.projectPath)
    }

    args.push('--print')
    args.push('-p', options.prompt)

    const process = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options.projectPath
    })

    const session: RunningSession = {
      process,
      agentId: options.agentId,
      sessionId,
      startedAt: new Date()
    }

    this.sessions.set(sessionId, session)

    process.stdout?.on('data', (data) => {
      const output = data.toString()
      options.onOutput?.(output)
      this.emit('output', { sessionId, agentId: options.agentId, data: output })
    })

    process.stderr?.on('data', (data) => {
      const error = data.toString()
      options.onError?.(error)
      this.emit('error', { sessionId, agentId: options.agentId, data: error })
    })

    process.on('close', (code) => {
      this.sessions.delete(sessionId)
      this.emit('close', { sessionId, agentId: options.agentId, code })
    })

    return sessionId
  }

  sendInput(sessionId: string, input: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session || !session.process.stdin) return false

    session.process.stdin.write(input + '\n')
    return true
  }

  terminate(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.process.kill('SIGTERM')
    this.sessions.delete(sessionId)
    return true
  }

  getSession(sessionId: string): RunningSession | undefined {
    return this.sessions.get(sessionId)
  }

  getAllSessions(): RunningSession[] {
    return Array.from(this.sessions.values())
  }
}
