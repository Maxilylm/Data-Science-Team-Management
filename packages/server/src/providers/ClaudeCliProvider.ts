import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import type {
  AgentProvider,
  ProviderSpawnOptions,
  ProviderSession
} from './types.js'

interface CliRunningSession extends ProviderSession {
  process: ChildProcess
  startedAt: Date
}

const QUESTION_PATTERNS = [
  /\*\*(.+\?)\*\*\s*[\n\r]+[\s\S]*?(?:Options:|1\.|-)[\s\S]*?\*\*/i,
  /([A-Z][^.!?\n]{10,}\?)\s*[\n\r]+[\s\S]*?-\s*\*\*[^*]+\*\*/,
  /([A-Z][^.!?\n]{10,}\?)\s*[\n\r]+[\s\S]*?Option \d+:/i,
  /([A-Z][^.!?\n]{10,}\?)\s*[\n\r]{2,}[\s\S]*?(?:\n-\s+\*\*|\n\d+\.\s+\*\*)/,
  /((?:Which|Where|What|How|Would|Should|Do|Can|Will|Is)[^.!?\n]+\?)/i,
  /([A-Z][^.!?\n]{5,}\?)\s*[\n\r]+\s*\*\*[^*]+:\*\*/,
  /([A-Z][^.!?\n]{10,}\?)\s*[\n\r]+[\s\S]*?\*\*[A-Z]\)/,
  /([A-Z][^.!?\n]{10,}\?)(?=[\s\S]{0,500}\*\*[^*]+\*\*[\s\S]{0,200}\*\*[^*]+\*\*)/
]

export class ClaudeCliProvider extends EventEmitter implements AgentProvider {
  readonly id = 'claude-cli'
  readonly name = 'Claude CLI'
  readonly description = 'Runs agents via the Claude CLI (claude command)'

  private sessions: Map<string, CliRunningSession> = new Map()

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('claude', ['--version'], { stdio: 'pipe' })
      proc.on('error', () => resolve(false))
      proc.on('close', (code) => resolve(code === 0))
    })
  }

  async spawn(options: ProviderSpawnOptions): Promise<string> {
    const sessionId = options.resumeSessionId ||
      `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const args = this.buildArgs(options)

    const env = { ...process.env, FORCE_COLOR: '0' }
    // Remove CLAUDECODE env var to prevent "nested session" error
    delete env.CLAUDECODE

    const childProcess = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options.projectPath || process.cwd(),
      env
    })

    childProcess.on('error', (err) => {
      console.error('[ClaudeCliProvider] Process error:', err)
    })

    const session: CliRunningSession = {
      process: childProcess,
      sessionId,
      agentId: options.agentId,
      status: 'running',
      ticketId: options.ticketId,
      waitingForInput: false,
      outputBuffer: '',
      startedAt: new Date()
    }

    this.sessions.set(sessionId, session)
    this.setupProcessHandlers(session, options)

    return sessionId
  }

  sendInput(sessionId: string, input: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session || !session.process.stdin || session.process.stdin.destroyed) {
      return false
    }

    session.process.stdin.write(input + '\n')
    session.waitingForInput = false
    session.lastQuestion = undefined
    session.status = 'running'

    this.emit('inputProvided', {
      sessionId,
      agentId: session.agentId,
      input
    })

    return true
  }

  terminate(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.process.kill('SIGTERM')
    this.sessions.delete(sessionId)
    return true
  }

  getSession(sessionId: string): ProviderSession | undefined {
    const session = this.sessions.get(sessionId)
    if (!session) return undefined
    return this.toProviderSession(session)
  }

  getAllSessions(): ProviderSession[] {
    return Array.from(this.sessions.values()).map(s => this.toProviderSession(s))
  }

  getWaitingSessions(): ProviderSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.waitingForInput)
      .map(s => this.toProviderSession(s))
  }

  private buildArgs(options: ProviderSpawnOptions): string[] {
    const args: string[] = []

    if (options.resumeSessionId) {
      args.push('--resume', options.resumeSessionId)
    } else if (options.systemPrompt) {
      // Use --system-prompt so the agent works in any project directory
      // (--agent looks for .claude/agents/<id>.md in the cwd which may not exist)
      args.push('--system-prompt', options.systemPrompt)
    } else if (options.agentId) {
      args.push('--agent', options.agentId)
    }

    if (options.model) {
      args.push('--model', options.model)
    }

    if (options.tools && options.tools.length > 0) {
      args.push('--allowedTools', options.tools.join(','))
    }

    args.push('-p', options.userPrompt)

    return args
  }

  private setupProcessHandlers(
    session: CliRunningSession,
    options: ProviderSpawnOptions
  ): void {
    let inactivityTimer: NodeJS.Timeout | null = null

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        const proc = session.process
        if (!proc.killed && proc.stdin && !proc.stdin.destroyed && !session.waitingForInput) {
          proc.stdin.end()
        }
      }, 30000)
    }

    resetInactivityTimer()

    session.process.stdout?.on('data', (data) => {
      const output = data.toString()
      session.outputBuffer += output

      this.emit('output', {
        sessionId: session.sessionId,
        agentId: options.agentId,
        data: output
      })

      const detected = this.detectQuestion(session)
      if (detected && !session.waitingForInput) {
        session.waitingForInput = true
        session.status = 'waiting_input'
        session.lastQuestion = {
          question: detected.question,
          options: detected.options,
          detectedAt: new Date()
        }

        this.emit('question', {
          sessionId: session.sessionId,
          agentId: session.agentId,
          ticketId: session.ticketId,
          question: detected.question,
          questionOptions: detected.options
        })

        if (inactivityTimer) clearTimeout(inactivityTimer)
      } else {
        resetInactivityTimer()
      }
    })

    session.process.stderr?.on('data', (data) => {
      const error = data.toString()
      this.emit('error', {
        sessionId: session.sessionId,
        agentId: options.agentId,
        data: error
      })
    })

    session.process.on('close', (code) => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      this.sessions.delete(session.sessionId)
      this.emit('close', {
        sessionId: session.sessionId,
        agentId: options.agentId,
        code
      })
    })
  }

  private detectQuestion(session: CliRunningSession): {
    question: string
    options?: string[]
  } | null {
    for (const pattern of QUESTION_PATTERNS) {
      const match = session.outputBuffer.match(pattern)
      if (match) {
        const question = match[1]
        const optionsMatch = session.outputBuffer.match(
          /\d+\.\s+\*\*[^*]+\*\*[^\n]*/g
        )
        const options = optionsMatch?.map(o =>
          o.replace(/^\d+\.\s+/, '').trim()
        )
        return { question, options }
      }
    }
    return null
  }

  private toProviderSession(session: CliRunningSession): ProviderSession {
    return {
      sessionId: session.sessionId,
      status: session.status,
      agentId: session.agentId,
      ticketId: session.ticketId,
      waitingForInput: session.waitingForInput,
      lastQuestion: session.lastQuestion,
      outputBuffer: session.outputBuffer
    }
  }
}
