import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'

export interface ClaudeRunnerOptions {
  agentId: string
  prompt: string
  projectPath?: string
  model?: 'sonnet' | 'opus' | 'haiku'
  allowedTools?: string[]  // Tools to auto-allow
  resumeSessionId?: string  // Resume an existing session
  ticketId?: string  // Associated ticket for tracking
  onOutput?: (data: string) => void
  onError?: (data: string) => void
}

export interface RunningSession {
  process: ChildProcess
  agentId: string
  sessionId: string
  startedAt: Date
  ticketId?: string
  waitingForInput: boolean
  lastQuestion?: {
    question: string
    options?: string[]
    detectedAt: Date
  }
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
      startedAt: new Date(),
      ticketId: options.ticketId,
      waitingForInput: false
    }

    this.sessions.set(sessionId, session)

    // Track output for question detection
    let outputBuffer = ''
    let inactivityTimer: NodeJS.Timeout | null = null

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      // Close stdin after 30 seconds of inactivity (agent likely finished or stuck)
      inactivityTimer = setTimeout(() => {
        if (!childProcess.killed && childProcess.stdin && !childProcess.stdin.destroyed && !session.waitingForInput) {
          childProcess.stdin.end()
        }
      }, 30000)
    }

    resetInactivityTimer()

    childProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      outputBuffer += output
      options.onOutput?.(output)
      this.emit('output', { sessionId, agentId: options.agentId, data: output })

      // Detect if Claude is asking a question (multiple patterns)
      // Patterns designed to catch Claude's AskUserQuestion tool output
      const questionPatterns = [
        // Pattern 1: **question?** followed by options
        /\*\*(.+\?)\*\*\s*[\n\r]+[\s\S]*?(?:Options:|1\.|-)[\s\S]*?\*\*/i,
        // Pattern 2: Plain question ending with ? followed by bold options (like "- **Option**")
        /([A-Z][^.!?\n]{10,}\?)\s*[\n\r]+[\s\S]*?-\s*\*\*[^*]+\*\*/,
        // Pattern 3: Question followed by Option N: format
        /([A-Z][^.!?\n]{10,}\?)\s*[\n\r]+[\s\S]*?Option \d+:/i,
        // Pattern 4: Question on its own line followed by blank line and bullet points
        /([A-Z][^.!?\n]{10,}\?)\s*[\n\r]{2,}[\s\S]*?(?:\n-\s+\*\*|\n\d+\.\s+\*\*)/,
        // Pattern 5: WH-question words and Should/Do/Can/Will questions
        /((?:Which|Where|What|How|Would|Should|Do|Can|Will|Is)[^.!?\n]+\?)/i,
        // Pattern 6: Any question followed by bold section header (like "**Toggle location:**")
        /([A-Z][^.!?\n]{5,}\?)\s*[\n\r]+\s*\*\*[^*]+:\*\*/,
        // Pattern 7: Question followed by **A)** or **B)** style options
        /([A-Z][^.!?\n]{10,}\?)\s*[\n\r]+[\s\S]*?\*\*[A-Z]\)/,
        // Pattern 8: Generic - any sentence ending with ? followed by 2+ bold items within 500 chars
        /([A-Z][^.!?\n]{10,}\?)(?=[\s\S]{0,500}\*\*[^*]+\*\*[\s\S]{0,200}\*\*[^*]+\*\*)/
      ]

      let match: RegExpMatchArray | null = null
      for (const pattern of questionPatterns) {
        match = outputBuffer.match(pattern)
        if (match) break
      }

      if (match && !session.waitingForInput) {
        // Extract question and options
        const question = match[1]
        const optionsMatch = outputBuffer.match(/\d+\.\s+\*\*[^*]+\*\*[^\n]*/g)
        const questionOptions = optionsMatch?.map(o => o.replace(/^\d+\.\s+/, '').trim())

        session.waitingForInput = true
        session.lastQuestion = {
          question,
          options: questionOptions,
          detectedAt: new Date()
        }

        // Emit event for question detection
        this.emit('question', {
          sessionId,
          agentId: session.agentId,
          ticketId: session.ticketId,
          question,
          questionOptions
        })

        // Don't close stdin - wait for user input
        if (inactivityTimer) clearTimeout(inactivityTimer)
      } else {
        resetInactivityTimer()
      }
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
    if (!session || !session.process.stdin || session.process.stdin.destroyed) return false

    session.process.stdin.write(input + '\n')
    session.waitingForInput = false
    session.lastQuestion = undefined

    // Emit event that input was provided
    this.emit('inputProvided', { sessionId, agentId: session.agentId, input })

    return true
  }

  getWaitingSessions(): RunningSession[] {
    return Array.from(this.sessions.values()).filter(s => s.waitingForInput)
  }

  isWaitingForInput(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    return session?.waitingForInput ?? false
  }

  getSessionQuestion(sessionId: string): RunningSession['lastQuestion'] | undefined {
    return this.sessions.get(sessionId)?.lastQuestion
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
