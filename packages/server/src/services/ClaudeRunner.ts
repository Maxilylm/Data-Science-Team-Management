import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'

export interface ClaudeRunnerOptions {
  agentId: string
  prompt: string
  projectPath?: string
  model?: 'sonnet' | 'opus' | 'haiku'
  allowedTools?: string[]  // Tools to auto-allow
  resumeSessionId?: string  // Resume an existing session
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

    // Note: --cwd is not a valid claude CLI option (used in display only)

    if (options.allowedTools && options.allowedTools.length > 0) {
      for (const tool of options.allowedTools) {
        args.push('--allowedTools', tool)
      }
    }

    args.push('-p', `"${options.prompt.replace(/"/g, '\\"')}"`)

    return args.join(' ')
  }

  async spawn(options: ClaudeRunnerOptions): Promise<string> {
    const sessionId = options.resumeSessionId || `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const args: string[] = []

    // Resume existing session or start new one with agent
    if (options.resumeSessionId) {
      args.push('--resume', options.resumeSessionId)
    } else if (options.agentId) {
      args.push('--agent', options.agentId)
    }

    if (options.model) {
      args.push('--model', options.model)
    }

    // Allow specific tools without prompting (for automated runs)
    if (options.allowedTools && options.allowedTools.length > 0) {
      args.push('--allowedTools', options.allowedTools.join(','))
    }

    // Use -p for the prompt (runs in non-interactive mode)
    args.push('-p', options.prompt)

    const childProcess = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options.projectPath || process.cwd(),
      env: { ...process.env, FORCE_COLOR: '0' }  // Disable colors for cleaner output
    })

    childProcess.on('error', (err) => {
      console.error('[ClaudeRunner] Process error:', err)
    })

    const session: RunningSession = {
      process: childProcess,
      agentId: options.agentId,
      sessionId,
      startedAt: new Date()
    }

    this.sessions.set(sessionId, session)

    // Close stdin immediately - claude CLI waits for stdin to close before completing
    childProcess.stdin?.end()

    childProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      options.onOutput?.(output)
      this.emit('output', { sessionId, agentId: options.agentId, data: output })
    })

    childProcess.stderr?.on('data', (data) => {
      const error = data.toString()
      options.onError?.(error)
      this.emit('error', { sessionId, agentId: options.agentId, data: error })
    })

    childProcess.on('close', (code) => {
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
