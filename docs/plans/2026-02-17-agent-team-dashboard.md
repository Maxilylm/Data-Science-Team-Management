# Agent Team Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web-based Kanban dashboard to manage and monitor multiple Claude agents with personas, tools, and tasks in real-time.

**Architecture:** React frontend with Express/Node.js backend extending claude-task-viewer patterns. Agents are defined via `.claude/agents/` config files and spawned via Claude CLI subprocess. Tasks stored in `~/.claude/tasks/` with extended metadata for agent assignment.

**Tech Stack:** React + TypeScript (frontend), Express + Node.js (backend), Server-Sent Events (real-time), Claude CLI (agent execution), chokidar (file watching)

---

## Project Structure

```
agent-team-dashboard/
├── packages/
│   ├── server/
│   │   ├── src/
│   │   │   ├── index.ts                 # Express entry
│   │   │   ├── routes/
│   │   │   │   ├── agents.ts            # Agent CRUD + spawn
│   │   │   │   ├── tasks.ts             # Task management
│   │   │   │   ├── sessions.ts          # Session monitoring
│   │   │   │   └── events.ts            # SSE endpoint
│   │   │   ├── services/
│   │   │   │   ├── AgentService.ts      # Agent lifecycle
│   │   │   │   ├── TaskService.ts       # Task CRUD
│   │   │   │   ├── FileWatcher.ts       # Directory monitoring
│   │   │   │   └── ClaudeRunner.ts      # CLI subprocess
│   │   │   └── types/
│   │   │       ├── Agent.ts
│   │   │       ├── Task.ts
│   │   │       └── Session.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── client/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   │   ├── KanbanBoard/
│       │   │   ├── AgentPanel/
│       │   │   ├── TaskCard/
│       │   │   ├── PromptDialog/
│       │   │   ├── InputRequired/
│       │   │   └── LiveFeed/
│       │   ├── hooks/
│       │   │   ├── useAgents.ts
│       │   │   ├── useTasks.ts
│       │   │   └── useSSE.ts
│       │   ├── services/
│       │   │   └── api.ts
│       │   └── types/
│       │       └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── package.json                          # Monorepo root
└── README.md
```

---

## Task 1: Initialize Monorepo Structure

**Files:**
- Create: `package.json`
- Create: `packages/server/package.json`
- Create: `packages/server/tsconfig.json`
- Create: `packages/client/package.json`
- Create: `packages/client/tsconfig.json`

**Step 1: Write root package.json**

```json
{
  "name": "agent-team-dashboard",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=server\" \"npm run dev --workspace=client\"",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.3.3"
  }
}
```

**Step 2: Write server package.json**

```json
{
  "name": "server",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "chokidar": "^3.5.3",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "vitest": "^1.2.0"
  }
}
```

**Step 3: Write server tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

**Step 4: Write client package.json**

```json
{
  "name": "client",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.17.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.0",
    "vitest": "^1.2.0",
    "typescript": "^5.3.3"
  }
}
```

**Step 5: Install dependencies**

Run: `npm install`
Expected: All workspaces installed successfully

**Step 6: Commit**

```bash
git init
git add package.json packages/
git commit -m "feat: initialize monorepo structure

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Define Core Types

**Files:**
- Create: `packages/server/src/types/Agent.ts`
- Create: `packages/server/src/types/Task.ts`
- Create: `packages/server/src/types/Session.ts`
- Test: `packages/server/src/types/__tests__/types.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/server/src/types/__tests__/types.test.ts
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
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && npm test`
Expected: FAIL with "Cannot find module '../Agent'"

**Step 3: Write Agent.ts**

```typescript
// packages/server/src/types/Agent.ts
export type AgentStatus = 'idle' | 'running' | 'waiting_input' | 'error'

export interface Agent {
  id: string
  name: string
  description: string
  model: 'sonnet' | 'opus' | 'haiku'
  color: string
  status: AgentStatus
  sessionId: string | null
  configPath: string
  currentTaskId?: string
  tools?: string[]
  lastError?: string
}

export interface AgentConfig {
  name: string
  description: string
  model?: 'sonnet' | 'opus' | 'haiku'
  color?: string
  tools?: string[]
}
```

**Step 4: Write Task.ts**

```typescript
// packages/server/src/types/Task.ts
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'needs_input'

export interface Task {
  id: string
  subject: string
  description: string
  status: TaskStatus
  agentId: string | null
  sessionId: string
  activeForm?: string
  blocks: string[]
  blockedBy: string[]
  inputRequest?: InputRequest
  createdAt: string
  updatedAt: string
}

export interface InputRequest {
  question: string
  options?: string[]
  timestamp: string
}

export interface TaskCreate {
  subject: string
  description: string
  agentId?: string
}
```

**Step 5: Write Session.ts**

```typescript
// packages/server/src/types/Session.ts
export interface Session {
  id: string
  agentId: string | null
  projectPath: string | null
  startedAt: string
  lastActivity: string
  taskIds: string[]
}
```

**Step 6: Run test to verify it passes**

Run: `cd packages/server && npm test`
Expected: PASS

**Step 7: Commit**

```bash
git add packages/server/src/types/
git commit -m "feat: add core type definitions for Agent, Task, Session

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Implement FileWatcher Service

**Files:**
- Create: `packages/server/src/services/FileWatcher.ts`
- Test: `packages/server/src/services/__tests__/FileWatcher.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/server/src/services/__tests__/FileWatcher.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

    await new Promise(r => setTimeout(r, 100))

    expect(events.length).toBeGreaterThan(0)
    expect(events[0].sessionId).toBe('session-123')
    expect(events[0].task.subject).toBe('Test Task')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && npm test -- FileWatcher`
Expected: FAIL with "Cannot find module '../FileWatcher'"

**Step 3: Write FileWatcher.ts**

```typescript
// packages/server/src/services/FileWatcher.ts
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
    this.watcher = chokidar.watch(this.watchPath, {
      persistent: true,
      ignoreInitial: false,
      depth: 2
    })

    this.watcher.on('add', (filePath) => this.handleFileChange('add', filePath))
    this.watcher.on('change', (filePath) => this.handleFileChange('change', filePath))
    this.watcher.on('unlink', (filePath) => this.handleFileChange('unlink', filePath))
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
```

**Step 4: Run test to verify it passes**

Run: `cd packages/server && npm test -- FileWatcher`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/services/FileWatcher.ts packages/server/src/services/__tests__/
git commit -m "feat: add FileWatcher service for ~/.claude/tasks monitoring

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Implement AgentService

**Files:**
- Create: `packages/server/src/services/AgentService.ts`
- Test: `packages/server/src/services/__tests__/AgentService.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/server/src/services/__tests__/AgentService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AgentService } from '../AgentService'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

describe('AgentService', () => {
  let service: AgentService
  let testConfigDir: string

  beforeEach(async () => {
    testConfigDir = path.join(os.tmpdir(), `test-agents-${Date.now()}`)
    await fs.mkdir(testConfigDir, { recursive: true })
    service = new AgentService(testConfigDir)
  })

  it('should load agents from config directory', async () => {
    const agentConfig = `---
name: test-agent
description: "A test agent"
model: sonnet
color: blue
---

You are a test agent.
`
    await fs.writeFile(path.join(testConfigDir, 'test-agent.md'), agentConfig)

    const agents = await service.loadAgents()

    expect(agents).toHaveLength(1)
    expect(agents[0].name).toBe('test-agent')
    expect(agents[0].model).toBe('sonnet')
  })

  it('should get agent by id', async () => {
    const agentConfig = `---
name: my-agent
description: "My agent"
model: opus
color: green
---

Instructions here.
`
    await fs.writeFile(path.join(testConfigDir, 'my-agent.md'), agentConfig)
    await service.loadAgents()

    const agent = service.getAgent('my-agent')

    expect(agent).toBeDefined()
    expect(agent?.model).toBe('opus')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && npm test -- AgentService`
Expected: FAIL with "Cannot find module '../AgentService'"

**Step 3: Write AgentService.ts**

```typescript
// packages/server/src/services/AgentService.ts
import * as fs from 'fs/promises'
import * as path from 'path'
import type { Agent, AgentConfig } from '../types/Agent'

export class AgentService {
  private agents: Map<string, Agent> = new Map()
  private configDir: string

  constructor(configDir?: string) {
    this.configDir = configDir || path.join(process.cwd(), '.claude', 'agents')
  }

  async loadAgents(): Promise<Agent[]> {
    this.agents.clear()

    try {
      const files = await fs.readdir(this.configDir)
      const mdFiles = files.filter(f => f.endsWith('.md'))

      for (const file of mdFiles) {
        const filePath = path.join(this.configDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const config = this.parseFrontmatter(content)

        if (config) {
          const id = path.basename(file, '.md')
          const agent: Agent = {
            id,
            name: config.name || id,
            description: config.description || '',
            model: config.model || 'sonnet',
            color: config.color || 'gray',
            status: 'idle',
            sessionId: null,
            configPath: filePath,
            tools: config.tools
          }
          this.agents.set(id, agent)
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }

    return Array.from(this.agents.values())
  }

  private parseFrontmatter(content: string): AgentConfig | null {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/
    const match = content.match(frontmatterRegex)

    if (!match) return null

    const frontmatter = match[1]
    const config: AgentConfig = { name: '', description: '' }

    for (const line of frontmatter.split('\n')) {
      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) continue

      const key = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      if (key === 'name') config.name = value
      else if (key === 'description') config.description = value
      else if (key === 'model') config.model = value as 'sonnet' | 'opus' | 'haiku'
      else if (key === 'color') config.color = value
    }

    return config
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id)
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values())
  }

  updateAgentStatus(id: string, status: Agent['status'], sessionId?: string): void {
    const agent = this.agents.get(id)
    if (agent) {
      agent.status = status
      if (sessionId !== undefined) agent.sessionId = sessionId
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/server && npm test -- AgentService`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/services/AgentService.ts packages/server/src/services/__tests__/AgentService.test.ts
git commit -m "feat: add AgentService to load agents from .claude/agents/

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Implement ClaudeRunner Service

**Files:**
- Create: `packages/server/src/services/ClaudeRunner.ts`
- Test: `packages/server/src/services/__tests__/ClaudeRunner.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/server/src/services/__tests__/ClaudeRunner.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClaudeRunner, ClaudeRunnerOptions } from '../ClaudeRunner'

describe('ClaudeRunner', () => {
  let runner: ClaudeRunner

  beforeEach(() => {
    runner = new ClaudeRunner()
  })

  it('should build correct CLI command for agent', () => {
    const options: ClaudeRunnerOptions = {
      agentId: 'eda-analyst',
      prompt: 'Analyze the data',
      projectPath: '/path/to/project'
    }

    const command = runner.buildCommand(options)

    expect(command.includes('claude')).toBe(true)
    expect(command.includes('--agent')).toBe(true)
    expect(command.includes('eda-analyst')).toBe(true)
  })

  it('should include model override if specified', () => {
    const options: ClaudeRunnerOptions = {
      agentId: 'test-agent',
      prompt: 'Do something',
      model: 'opus'
    }

    const command = runner.buildCommand(options)

    expect(command.includes('--model')).toBe(true)
    expect(command.includes('opus')).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && npm test -- ClaudeRunner`
Expected: FAIL with "Cannot find module '../ClaudeRunner'"

**Step 3: Write ClaudeRunner.ts**

```typescript
// packages/server/src/services/ClaudeRunner.ts
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

    // Prompt is passed via stdin or --prompt
    args.push('--print')  // Non-interactive mode
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
```

**Step 4: Run test to verify it passes**

Run: `cd packages/server && npm test -- ClaudeRunner`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/services/ClaudeRunner.ts packages/server/src/services/__tests__/ClaudeRunner.test.ts
git commit -m "feat: add ClaudeRunner service to spawn Claude CLI processes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Implement TaskService

**Files:**
- Create: `packages/server/src/services/TaskService.ts`
- Test: `packages/server/src/services/__tests__/TaskService.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/server/src/services/__tests__/TaskService.test.ts
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
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && npm test -- TaskService`
Expected: FAIL with "Cannot find module '../TaskService'"

**Step 3: Write TaskService.ts**

```typescript
// packages/server/src/services/TaskService.ts
import * as fs from 'fs/promises'
import * as path from 'path'
import type { Task, TaskStatus } from '../types/Task'

interface StoredTask extends Task {
  sessionId: string
}

export class TaskService {
  private tasks: Map<string, StoredTask> = new Map()
  private tasksDir: string

  constructor(tasksDir?: string) {
    this.tasksDir = tasksDir || path.join(process.env.HOME || '', '.claude', 'tasks')
  }

  async loadAllTasks(): Promise<void> {
    this.tasks.clear()

    try {
      const sessions = await fs.readdir(this.tasksDir)

      for (const sessionId of sessions) {
        const sessionPath = path.join(this.tasksDir, sessionId)
        const stat = await fs.stat(sessionPath)

        if (!stat.isDirectory()) continue

        const files = await fs.readdir(sessionPath)
        const jsonFiles = files.filter(f => f.endsWith('.json'))

        for (const file of jsonFiles) {
          const filePath = path.join(sessionPath, file)
          try {
            const content = await fs.readFile(filePath, 'utf-8')
            const task = JSON.parse(content) as Task
            const key = `${sessionId}:${task.id}`
            this.tasks.set(key, { ...task, sessionId })
          } catch {
            // Skip invalid files
          }
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }

  updateTask(sessionId: string, task: Task): void {
    const key = `${sessionId}:${task.id}`
    this.tasks.set(key, { ...task, sessionId })
  }

  removeTask(sessionId: string, taskId: string): void {
    const key = `${sessionId}:${taskId}`
    this.tasks.delete(key)
  }

  getAllTasks(): StoredTask[] {
    return Array.from(this.tasks.values())
  }

  getTasksBySession(sessionId: string): StoredTask[] {
    return this.getAllTasks().filter(t => t.sessionId === sessionId)
  }

  getTasksByAgent(agentId: string): StoredTask[] {
    return this.getAllTasks().filter(t => t.agentId === agentId)
  }

  getTasksByStatus(status: TaskStatus): StoredTask[] {
    return this.getAllTasks().filter(t => t.status === status)
  }

  getTasksNeedingInput(): StoredTask[] {
    return this.getAllTasks().filter(t => t.status === 'needs_input' && t.inputRequest)
  }

  getTaskStats(): { pending: number; inProgress: number; completed: number; needsInput: number } {
    const tasks = this.getAllTasks()
    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      needsInput: tasks.filter(t => t.status === 'needs_input').length
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/server && npm test -- TaskService`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/services/TaskService.ts packages/server/src/services/__tests__/TaskService.test.ts
git commit -m "feat: add TaskService for task CRUD and filtering

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Implement API Routes

**Files:**
- Create: `packages/server/src/routes/agents.ts`
- Create: `packages/server/src/routes/tasks.ts`
- Create: `packages/server/src/routes/sessions.ts`
- Create: `packages/server/src/routes/events.ts`
- Test: `packages/server/src/routes/__tests__/routes.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/server/src/routes/__tests__/routes.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import { createAgentsRouter } from '../agents'
import { createTasksRouter } from '../tasks'
import { AgentService } from '../../services/AgentService'
import { TaskService } from '../../services/TaskService'

describe('API Routes', () => {
  describe('Agents Router', () => {
    it('should return all agents', async () => {
      const mockAgentService = {
        getAllAgents: vi.fn().mockReturnValue([
          { id: 'agent-1', name: 'Agent 1', status: 'idle' }
        ])
      } as any

      const app = express()
      app.use('/api/agents', createAgentsRouter(mockAgentService, {} as any))

      const response = await request(app).get('/api/agents')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(1)
      expect(response.body[0].name).toBe('Agent 1')
    })
  })

  describe('Tasks Router', () => {
    it('should return tasks grouped by status for kanban', async () => {
      const mockTaskService = {
        getAllTasks: vi.fn().mockReturnValue([
          { id: '1', subject: 'Task 1', status: 'pending' },
          { id: '2', subject: 'Task 2', status: 'in_progress' },
          { id: '3', subject: 'Task 3', status: 'completed' }
        ])
      } as any

      const app = express()
      app.use('/api/tasks', createTasksRouter(mockTaskService))

      const response = await request(app).get('/api/tasks/kanban')

      expect(response.status).toBe(200)
      expect(response.body.pending).toHaveLength(1)
      expect(response.body.in_progress).toHaveLength(1)
      expect(response.body.completed).toHaveLength(1)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && npm test -- routes`
Expected: FAIL with "Cannot find module '../agents'"

**Step 3: Add supertest dependency**

```bash
cd packages/server && npm install --save-dev supertest @types/supertest
```

**Step 4: Write agents.ts router**

```typescript
// packages/server/src/routes/agents.ts
import { Router, Request, Response } from 'express'
import type { AgentService } from '../services/AgentService'
import type { ClaudeRunner } from '../services/ClaudeRunner'

export function createAgentsRouter(
  agentService: AgentService,
  claudeRunner: ClaudeRunner
): Router {
  const router = Router()

  router.get('/', (req: Request, res: Response) => {
    const agents = agentService.getAllAgents()
    res.json(agents)
  })

  router.get('/:id', (req: Request, res: Response) => {
    const agent = agentService.getAgent(req.params.id)
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' })
    }
    res.json(agent)
  })

  router.post('/:id/spawn', async (req: Request, res: Response) => {
    const agent = agentService.getAgent(req.params.id)
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    const { prompt, projectPath } = req.body
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    try {
      const sessionId = await claudeRunner.spawn({
        agentId: agent.id,
        prompt,
        projectPath,
        model: agent.model
      })

      agentService.updateAgentStatus(agent.id, 'running', sessionId)

      res.json({ sessionId, agentId: agent.id })
    } catch (error) {
      res.status(500).json({ error: 'Failed to spawn agent' })
    }
  })

  router.post('/:id/input', (req: Request, res: Response) => {
    const agent = agentService.getAgent(req.params.id)
    if (!agent || !agent.sessionId) {
      return res.status(404).json({ error: 'Agent not running' })
    }

    const { input } = req.body
    const success = claudeRunner.sendInput(agent.sessionId, input)

    if (success) {
      res.json({ success: true })
    } else {
      res.status(400).json({ error: 'Failed to send input' })
    }
  })

  router.post('/:id/stop', (req: Request, res: Response) => {
    const agent = agentService.getAgent(req.params.id)
    if (!agent || !agent.sessionId) {
      return res.status(404).json({ error: 'Agent not running' })
    }

    const success = claudeRunner.terminate(agent.sessionId)
    if (success) {
      agentService.updateAgentStatus(agent.id, 'idle', null)
      res.json({ success: true })
    } else {
      res.status(400).json({ error: 'Failed to stop agent' })
    }
  })

  return router
}
```

**Step 5: Write tasks.ts router**

```typescript
// packages/server/src/routes/tasks.ts
import { Router, Request, Response } from 'express'
import type { TaskService } from '../services/TaskService'

export function createTasksRouter(taskService: TaskService): Router {
  const router = Router()

  router.get('/', (req: Request, res: Response) => {
    const tasks = taskService.getAllTasks()
    res.json(tasks)
  })

  router.get('/kanban', (req: Request, res: Response) => {
    const tasks = taskService.getAllTasks()
    const kanban = {
      pending: tasks.filter(t => t.status === 'pending'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      completed: tasks.filter(t => t.status === 'completed'),
      needs_input: tasks.filter(t => t.status === 'needs_input')
    }
    res.json(kanban)
  })

  router.get('/stats', (req: Request, res: Response) => {
    const stats = taskService.getTaskStats()
    res.json(stats)
  })

  router.get('/needs-input', (req: Request, res: Response) => {
    const tasks = taskService.getTasksNeedingInput()
    res.json(tasks)
  })

  router.get('/agent/:agentId', (req: Request, res: Response) => {
    const tasks = taskService.getTasksByAgent(req.params.agentId)
    res.json(tasks)
  })

  router.get('/session/:sessionId', (req: Request, res: Response) => {
    const tasks = taskService.getTasksBySession(req.params.sessionId)
    res.json(tasks)
  })

  return router
}
```

**Step 6: Write events.ts router (SSE)**

```typescript
// packages/server/src/routes/events.ts
import { Router, Request, Response } from 'express'
import type { FileWatcher } from '../services/FileWatcher'
import type { ClaudeRunner } from '../services/ClaudeRunner'

export function createEventsRouter(
  fileWatcher: FileWatcher,
  claudeRunner: ClaudeRunner
): Router {
  const router = Router()
  const clients: Set<Response> = new Set()

  router.get('/', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    clients.add(res)

    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

    req.on('close', () => {
      clients.delete(res)
    })
  })

  function broadcast(event: object): void {
    const data = `data: ${JSON.stringify(event)}\n\n`
    for (const client of clients) {
      client.write(data)
    }
  }

  fileWatcher.on('taskChange', (event) => {
    broadcast({ type: 'taskChange', ...event })
  })

  claudeRunner.on('output', (event) => {
    broadcast({ type: 'agentOutput', ...event })
  })

  claudeRunner.on('close', (event) => {
    broadcast({ type: 'agentClosed', ...event })
  })

  return router
}
```

**Step 7: Run test to verify it passes**

Run: `cd packages/server && npm test -- routes`
Expected: PASS

**Step 8: Commit**

```bash
git add packages/server/src/routes/
git commit -m "feat: add API routes for agents, tasks, and SSE events

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Implement Express Server Entry Point

**Files:**
- Create: `packages/server/src/index.ts`
- Test: Manual - start server and verify endpoints

**Step 1: Write index.ts**

```typescript
// packages/server/src/index.ts
import express from 'express'
import cors from 'cors'
import path from 'path'
import { AgentService } from './services/AgentService'
import { TaskService } from './services/TaskService'
import { FileWatcher } from './services/FileWatcher'
import { ClaudeRunner } from './services/ClaudeRunner'
import { createAgentsRouter } from './routes/agents'
import { createTasksRouter } from './routes/tasks'
import { createEventsRouter } from './routes/events'

const PORT = process.env.PORT || 3456

async function main() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  // Initialize services
  const agentService = new AgentService()
  const taskService = new TaskService()
  const fileWatcher = new FileWatcher()
  const claudeRunner = new ClaudeRunner()

  // Load initial data
  await agentService.loadAgents()
  await taskService.loadAllTasks()

  // Wire up file watcher to task service
  fileWatcher.on('taskChange', (event) => {
    if (event.type === 'unlink') {
      taskService.removeTask(event.sessionId, event.taskId)
    } else if (event.task) {
      taskService.updateTask(event.sessionId, event.task)
    }
  })

  // Wire up claude runner status updates
  claudeRunner.on('close', (event) => {
    const agents = agentService.getAllAgents()
    const agent = agents.find(a => a.sessionId === event.sessionId)
    if (agent) {
      agentService.updateAgentStatus(agent.id, 'idle', null)
    }
  })

  // Start file watcher
  await fileWatcher.start()

  // Mount routes
  app.use('/api/agents', createAgentsRouter(agentService, claudeRunner))
  app.use('/api/tasks', createTasksRouter(taskService))
  app.use('/api/events', createEventsRouter(fileWatcher, claudeRunner))

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      agents: agentService.getAllAgents().length,
      tasks: taskService.getAllTasks().length
    })
  })

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../client/dist')))
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
    })
  }

  app.listen(PORT, () => {
    console.log(`Agent Team Dashboard server running on http://localhost:${PORT}`)
    console.log(`Watching for tasks in ~/.claude/tasks/`)
    console.log(`Loaded ${agentService.getAllAgents().length} agents from .claude/agents/`)
  })
}

main().catch(console.error)
```

**Step 2: Run server manually**

Run: `cd packages/server && npm run dev`
Expected: Server starts on port 3456

**Step 3: Test health endpoint**

Run: `curl http://localhost:3456/health`
Expected: `{"status":"healthy","agents":N,"tasks":N}`

**Step 4: Commit**

```bash
git add packages/server/src/index.ts
git commit -m "feat: add Express server entry point with service wiring

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Setup React Client with Vite

**Files:**
- Create: `packages/client/index.html`
- Create: `packages/client/vite.config.ts`
- Create: `packages/client/src/main.tsx`
- Create: `packages/client/src/App.tsx`
- Create: `packages/client/src/types/index.ts`

**Step 1: Write index.html**

```html
<!-- packages/client/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Agent Team Dashboard</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: system-ui, -apple-system, sans-serif; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 2: Write vite.config.ts**

```typescript
// packages/client/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3456',
    }
  }
})
```

**Step 3: Write client types**

```typescript
// packages/client/src/types/index.ts
export type AgentStatus = 'idle' | 'running' | 'waiting_input' | 'error'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'needs_input'

export interface Agent {
  id: string
  name: string
  description: string
  model: 'sonnet' | 'opus' | 'haiku'
  color: string
  status: AgentStatus
  sessionId: string | null
  currentTaskId?: string
}

export interface Task {
  id: string
  subject: string
  description: string
  status: TaskStatus
  agentId: string | null
  sessionId: string
  activeForm?: string
  blocks: string[]
  blockedBy: string[]
  inputRequest?: {
    question: string
    options?: string[]
  }
}

export interface KanbanData {
  pending: Task[]
  in_progress: Task[]
  completed: Task[]
  needs_input: Task[]
}
```

**Step 4: Write main.tsx**

```typescript
// packages/client/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
```

**Step 5: Write initial App.tsx**

```typescript
// packages/client/src/App.tsx
import React from 'react'

export default function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Agent Team Dashboard</h1>
      <p>Loading...</p>
    </div>
  )
}
```

**Step 6: Start client**

Run: `cd packages/client && npm run dev`
Expected: Vite dev server on http://localhost:5173

**Step 7: Commit**

```bash
git add packages/client/
git commit -m "feat: setup React client with Vite

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Implement useSSE Hook

**Files:**
- Create: `packages/client/src/hooks/useSSE.ts`
- Test: `packages/client/src/hooks/__tests__/useSSE.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/client/src/hooks/__tests__/useSSE.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSSE } from '../useSSE'

describe('useSSE', () => {
  let mockEventSource: any

  beforeEach(() => {
    mockEventSource = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn()
    }
    vi.stubGlobal('EventSource', vi.fn(() => mockEventSource))
  })

  it('should connect to SSE endpoint', () => {
    renderHook(() => useSSE('/api/events'))

    expect(EventSource).toHaveBeenCalledWith('/api/events')
  })

  it('should call onMessage when message received', () => {
    const onMessage = vi.fn()
    renderHook(() => useSSE('/api/events', { onMessage }))

    const messageHandler = mockEventSource.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === 'message'
    )?.[1]

    act(() => {
      messageHandler({ data: JSON.stringify({ type: 'taskChange' }) })
    })

    expect(onMessage).toHaveBeenCalledWith({ type: 'taskChange' })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/client && npm test -- useSSE`
Expected: FAIL

**Step 3: Install testing dependencies**

```bash
cd packages/client && npm install --save-dev @testing-library/react @testing-library/react-hooks jsdom
```

**Step 4: Write useSSE.ts**

```typescript
// packages/client/src/hooks/useSSE.ts
import { useEffect, useRef, useState, useCallback } from 'react'

interface UseSSEOptions {
  onMessage?: (data: any) => void
  onError?: (error: Event) => void
  onOpen?: () => void
}

export function useSSE(url: string, options: UseSSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<any>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource(url)
    eventSourceRef.current = es

    es.addEventListener('open', () => {
      setIsConnected(true)
      options.onOpen?.()
    })

    es.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastEvent(data)
        options.onMessage?.(data)
      } catch {
        // Ignore parse errors
      }
    })

    es.addEventListener('error', (event) => {
      setIsConnected(false)
      options.onError?.(event)
    })
  }, [url, options])

  useEffect(() => {
    connect()

    return () => {
      eventSourceRef.current?.close()
    }
  }, [connect])

  return { isConnected, lastEvent, reconnect: connect }
}
```

**Step 5: Run test to verify it passes**

Run: `cd packages/client && npm test -- useSSE`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/client/src/hooks/
git commit -m "feat: add useSSE hook for real-time updates

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Implement API Service

**Files:**
- Create: `packages/client/src/services/api.ts`
- Test: `packages/client/src/services/__tests__/api.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/client/src/services/__tests__/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '../api'

describe('API Service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('should fetch agents', async () => {
    const mockAgents = [{ id: 'agent-1', name: 'Agent 1' }]
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAgents)
    })

    const agents = await api.getAgents()

    expect(fetch).toHaveBeenCalledWith('/api/agents')
    expect(agents).toEqual(mockAgents)
  })

  it('should spawn agent with prompt', async () => {
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'session-123' })
    })

    const result = await api.spawnAgent('eda-analyst', 'Analyze data')

    expect(fetch).toHaveBeenCalledWith('/api/agents/eda-analyst/spawn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Analyze data' })
    })
    expect(result.sessionId).toBe('session-123')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/client && npm test -- api`
Expected: FAIL

**Step 3: Write api.ts**

```typescript
// packages/client/src/services/api.ts
import type { Agent, Task, KanbanData } from '../types'

const BASE_URL = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json()
}

export const api = {
  // Agents
  getAgents(): Promise<Agent[]> {
    return fetchJson(`${BASE_URL}/agents`)
  },

  getAgent(id: string): Promise<Agent> {
    return fetchJson(`${BASE_URL}/agents/${id}`)
  },

  spawnAgent(agentId: string, prompt: string, projectPath?: string): Promise<{ sessionId: string }> {
    return fetchJson(`${BASE_URL}/agents/${agentId}/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, projectPath })
    })
  },

  sendInput(agentId: string, input: string): Promise<{ success: boolean }> {
    return fetchJson(`${BASE_URL}/agents/${agentId}/input`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    })
  },

  stopAgent(agentId: string): Promise<{ success: boolean }> {
    return fetchJson(`${BASE_URL}/agents/${agentId}/stop`, {
      method: 'POST'
    })
  },

  // Tasks
  getTasks(): Promise<Task[]> {
    return fetchJson(`${BASE_URL}/tasks`)
  },

  getKanbanTasks(): Promise<KanbanData> {
    return fetchJson(`${BASE_URL}/tasks/kanban`)
  },

  getTasksNeedingInput(): Promise<Task[]> {
    return fetchJson(`${BASE_URL}/tasks/needs-input`)
  },

  getTasksByAgent(agentId: string): Promise<Task[]> {
    return fetchJson(`${BASE_URL}/tasks/agent/${agentId}`)
  },

  getTaskStats(): Promise<{ pending: number; inProgress: number; completed: number; needsInput: number }> {
    return fetchJson(`${BASE_URL}/tasks/stats`)
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/client && npm test -- api`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/client/src/services/
git commit -m "feat: add API service for agent and task operations

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Implement KanbanBoard Component

**Files:**
- Create: `packages/client/src/components/KanbanBoard/KanbanBoard.tsx`
- Create: `packages/client/src/components/KanbanBoard/KanbanColumn.tsx`
- Create: `packages/client/src/components/KanbanBoard/index.ts`

**Step 1: Write KanbanColumn.tsx**

```typescript
// packages/client/src/components/KanbanBoard/KanbanColumn.tsx
import React from 'react'
import type { Task } from '../../types'
import TaskCard from '../TaskCard/TaskCard'

interface KanbanColumnProps {
  title: string
  tasks: Task[]
  color: string
  onTaskClick?: (task: Task) => void
}

const columnStyle: React.CSSProperties = {
  flex: 1,
  minWidth: '280px',
  backgroundColor: '#f4f5f7',
  borderRadius: '8px',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  maxHeight: 'calc(100vh - 200px)',
  overflowY: 'auto'
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '8px',
  fontWeight: 600
}

export default function KanbanColumn({ title, tasks, color, onTaskClick }: KanbanColumnProps) {
  return (
    <div style={columnStyle}>
      <div style={headerStyle}>
        <span style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: color
        }} />
        <span>{title}</span>
        <span style={{ color: '#666', fontWeight: 400 }}>({tasks.length})</span>
      </div>
      {tasks.map(task => (
        <TaskCard
          key={`${task.sessionId}-${task.id}`}
          task={task}
          onClick={() => onTaskClick?.(task)}
        />
      ))}
    </div>
  )
}
```

**Step 2: Write KanbanBoard.tsx**

```typescript
// packages/client/src/components/KanbanBoard/KanbanBoard.tsx
import React from 'react'
import type { KanbanData, Task } from '../../types'
import KanbanColumn from './KanbanColumn'

interface KanbanBoardProps {
  data: KanbanData
  onTaskClick?: (task: Task) => void
}

const boardStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  padding: '16px',
  overflowX: 'auto'
}

export default function KanbanBoard({ data, onTaskClick }: KanbanBoardProps) {
  return (
    <div style={boardStyle}>
      <KanbanColumn
        title="Needs Input"
        tasks={data.needs_input}
        color="#f59e0b"
        onTaskClick={onTaskClick}
      />
      <KanbanColumn
        title="Pending"
        tasks={data.pending}
        color="#6b7280"
        onTaskClick={onTaskClick}
      />
      <KanbanColumn
        title="In Progress"
        tasks={data.in_progress}
        color="#3b82f6"
        onTaskClick={onTaskClick}
      />
      <KanbanColumn
        title="Completed"
        tasks={data.completed}
        color="#10b981"
        onTaskClick={onTaskClick}
      />
    </div>
  )
}
```

**Step 3: Write index.ts**

```typescript
// packages/client/src/components/KanbanBoard/index.ts
export { default as KanbanBoard } from './KanbanBoard'
export { default as KanbanColumn } from './KanbanColumn'
```

**Step 4: Commit**

```bash
git add packages/client/src/components/KanbanBoard/
git commit -m "feat: add KanbanBoard component with columns

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Implement TaskCard Component

**Files:**
- Create: `packages/client/src/components/TaskCard/TaskCard.tsx`
- Create: `packages/client/src/components/TaskCard/index.ts`

**Step 1: Write TaskCard.tsx**

```typescript
// packages/client/src/components/TaskCard/TaskCard.tsx
import React from 'react'
import type { Task } from '../../types'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '6px',
  padding: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  cursor: 'pointer',
  transition: 'box-shadow 0.2s'
}

const subjectStyle: React.CSSProperties = {
  fontWeight: 500,
  marginBottom: '8px',
  fontSize: '14px'
}

const metaStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const inputRequestStyle: React.CSSProperties = {
  marginTop: '8px',
  padding: '8px',
  backgroundColor: '#fef3c7',
  borderRadius: '4px',
  fontSize: '12px'
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'
      }}
    >
      <div style={subjectStyle}>{task.subject}</div>
      <div style={metaStyle}>
        {task.agentId && (
          <span style={{
            backgroundColor: '#e5e7eb',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {task.agentId}
          </span>
        )}
        {task.activeForm && (
          <span style={{ fontStyle: 'italic' }}>
            {task.activeForm}
          </span>
        )}
      </div>
      {task.inputRequest && (
        <div style={inputRequestStyle}>
          <strong>Input needed:</strong> {task.inputRequest.question}
        </div>
      )}
      {task.blockedBy.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#dc2626' }}>
          Blocked by: {task.blockedBy.join(', ')}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Write index.ts**

```typescript
// packages/client/src/components/TaskCard/index.ts
export { default as TaskCard } from './TaskCard'
```

**Step 3: Commit**

```bash
git add packages/client/src/components/TaskCard/
git commit -m "feat: add TaskCard component with input request display

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 14: Implement AgentPanel Component

**Files:**
- Create: `packages/client/src/components/AgentPanel/AgentPanel.tsx`
- Create: `packages/client/src/components/AgentPanel/AgentCard.tsx`
- Create: `packages/client/src/components/AgentPanel/index.ts`

**Step 1: Write AgentCard.tsx**

```typescript
// packages/client/src/components/AgentPanel/AgentCard.tsx
import React from 'react'
import type { Agent } from '../../types'

interface AgentCardProps {
  agent: Agent
  onSpawn?: () => void
  onStop?: () => void
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  marginBottom: '12px'
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '8px'
}

const statusColors: Record<string, string> = {
  idle: '#9ca3af',
  running: '#10b981',
  waiting_input: '#f59e0b',
  error: '#ef4444'
}

export default function AgentCard({ agent, onSpawn, onStop }: AgentCardProps) {
  const isRunning = agent.status === 'running' || agent.status === 'waiting_input'

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: agent.color
        }} />
        <span style={{ fontWeight: 600 }}>{agent.name}</span>
        <span style={{
          marginLeft: 'auto',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusColors[agent.status]
        }} />
      </div>
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
        {agent.description.slice(0, 100)}...
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {!isRunning ? (
          <button
            onClick={onSpawn}
            style={{
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Spawn
          </button>
        ) : (
          <button
            onClick={onStop}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Stop
          </button>
        )}
        <span style={{ fontSize: '12px', color: '#666', alignSelf: 'center' }}>
          {agent.model}
        </span>
      </div>
    </div>
  )
}
```

**Step 2: Write AgentPanel.tsx**

```typescript
// packages/client/src/components/AgentPanel/AgentPanel.tsx
import React from 'react'
import type { Agent } from '../../types'
import AgentCard from './AgentCard'

interface AgentPanelProps {
  agents: Agent[]
  onSpawnAgent: (agentId: string) => void
  onStopAgent: (agentId: string) => void
}

const panelStyle: React.CSSProperties = {
  width: '300px',
  backgroundColor: '#f9fafb',
  padding: '16px',
  borderRight: '1px solid #e5e7eb',
  height: '100vh',
  overflowY: 'auto'
}

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  marginBottom: '16px'
}

export default function AgentPanel({ agents, onSpawnAgent, onStopAgent }: AgentPanelProps) {
  const runningAgents = agents.filter(a => a.status !== 'idle')
  const idleAgents = agents.filter(a => a.status === 'idle')

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>Agents</div>

      {runningAgents.length > 0 && (
        <>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            ACTIVE ({runningAgents.length})
          </div>
          {runningAgents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onStop={() => onStopAgent(agent.id)}
            />
          ))}
        </>
      )}

      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', marginTop: '16px' }}>
        AVAILABLE ({idleAgents.length})
      </div>
      {idleAgents.map(agent => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onSpawn={() => onSpawnAgent(agent.id)}
        />
      ))}
    </div>
  )
}
```

**Step 3: Write index.ts**

```typescript
// packages/client/src/components/AgentPanel/index.ts
export { default as AgentPanel } from './AgentPanel'
export { default as AgentCard } from './AgentCard'
```

**Step 4: Commit**

```bash
git add packages/client/src/components/AgentPanel/
git commit -m "feat: add AgentPanel with spawn/stop controls

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 15: Implement PromptDialog Component

**Files:**
- Create: `packages/client/src/components/PromptDialog/PromptDialog.tsx`
- Create: `packages/client/src/components/PromptDialog/index.ts`

**Step 1: Write PromptDialog.tsx**

```typescript
// packages/client/src/components/PromptDialog/PromptDialog.tsx
import React, { useState } from 'react'
import type { Agent } from '../../types'

interface PromptDialogProps {
  agent: Agent | null
  onSubmit: (agentId: string, prompt: string) => void
  onClose: () => void
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}

const dialogStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '24px',
  width: '500px',
  maxWidth: '90vw'
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '120px',
  padding: '12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  resize: 'vertical',
  marginBottom: '16px'
}

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px'
}

export default function PromptDialog({ agent, onSubmit, onClose }: PromptDialogProps) {
  const [prompt, setPrompt] = useState('')

  if (!agent) return null

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(agent.id, prompt)
      setPrompt('')
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: agent.color
          }} />
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
            Task {agent.name}
          </h2>
        </div>

        <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
          {agent.description.slice(0, 200)}
        </p>

        <textarea
          style={textareaStyle}
          placeholder="Describe the task for this agent..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          autoFocus
        />

        <div style={buttonRowStyle}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: prompt.trim() ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: prompt.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Start Task
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Write index.ts**

```typescript
// packages/client/src/components/PromptDialog/index.ts
export { default as PromptDialog } from './PromptDialog'
```

**Step 3: Commit**

```bash
git add packages/client/src/components/PromptDialog/
git commit -m "feat: add PromptDialog for spawning agents with tasks

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 16: Implement InputRequired Component

**Files:**
- Create: `packages/client/src/components/InputRequired/InputRequired.tsx`
- Create: `packages/client/src/components/InputRequired/index.ts`

**Step 1: Write InputRequired.tsx**

```typescript
// packages/client/src/components/InputRequired/InputRequired.tsx
import React, { useState } from 'react'
import type { Task } from '../../types'

interface InputRequiredProps {
  tasks: Task[]
  onSubmitInput: (agentId: string, input: string) => void
}

const panelStyle: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  borderLeft: '4px solid #f59e0b',
  padding: '16px',
  marginBottom: '16px'
}

const taskItemStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '6px',
  padding: '12px',
  marginBottom: '8px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
}

export default function InputRequired({ tasks, onSubmitInput }: InputRequiredProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({})

  if (tasks.length === 0) return null

  const handleSubmit = (task: Task) => {
    const input = inputs[task.id]
    if (input?.trim() && task.agentId) {
      onSubmitInput(task.agentId, input)
      setInputs(prev => ({ ...prev, [task.id]: '' }))
    }
  }

  return (
    <div style={panelStyle}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
        Input Required ({tasks.length})
      </h3>
      {tasks.map(task => (
        <div key={`${task.sessionId}-${task.id}`} style={taskItemStyle}>
          <div style={{ fontWeight: 500, marginBottom: '4px' }}>{task.subject}</div>
          {task.agentId && (
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
              Agent: {task.agentId}
            </div>
          )}
          {task.inputRequest && (
            <>
              <div style={{ marginBottom: '8px' }}>
                {task.inputRequest.question}
              </div>
              {task.inputRequest.options ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {task.inputRequest.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => task.agentId && onSubmitInput(task.agentId, option)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={inputs[task.id] || ''}
                    onChange={e => setInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit(task)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                    placeholder="Type your response..."
                  />
                  <button
                    onClick={() => handleSubmit(task)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Send
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Write index.ts**

```typescript
// packages/client/src/components/InputRequired/index.ts
export { default as InputRequired } from './InputRequired'
```

**Step 3: Commit**

```bash
git add packages/client/src/components/InputRequired/
git commit -m "feat: add InputRequired component for agent prompts

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 17: Implement LiveFeed Component

**Files:**
- Create: `packages/client/src/components/LiveFeed/LiveFeed.tsx`
- Create: `packages/client/src/components/LiveFeed/index.ts`

**Step 1: Write LiveFeed.tsx**

```typescript
// packages/client/src/components/LiveFeed/LiveFeed.tsx
import React from 'react'

interface FeedEvent {
  type: string
  timestamp: Date
  agentId?: string
  data?: string
}

interface LiveFeedProps {
  events: FeedEvent[]
  maxEvents?: number
}

const feedStyle: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#e5e7eb',
  borderRadius: '8px',
  padding: '12px',
  fontFamily: 'monospace',
  fontSize: '12px',
  height: '200px',
  overflowY: 'auto'
}

const eventStyle: React.CSSProperties = {
  padding: '4px 0',
  borderBottom: '1px solid #374151'
}

export default function LiveFeed({ events, maxEvents = 50 }: LiveFeedProps) {
  const displayEvents = events.slice(-maxEvents)

  return (
    <div>
      <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
        Live Activity
      </h3>
      <div style={feedStyle}>
        {displayEvents.length === 0 ? (
          <div style={{ color: '#6b7280' }}>Waiting for activity...</div>
        ) : (
          displayEvents.map((event, i) => (
            <div key={i} style={eventStyle}>
              <span style={{ color: '#9ca3af' }}>
                {event.timestamp.toLocaleTimeString()}
              </span>
              {' '}
              <span style={{ color: getEventColor(event.type) }}>
                [{event.type}]
              </span>
              {' '}
              {event.agentId && (
                <span style={{ color: '#60a5fa' }}>{event.agentId}: </span>
              )}
              <span>{event.data?.slice(0, 100)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function getEventColor(type: string): string {
  switch (type) {
    case 'taskChange': return '#10b981'
    case 'agentOutput': return '#3b82f6'
    case 'agentClosed': return '#f59e0b'
    case 'error': return '#ef4444'
    default: return '#9ca3af'
  }
}
```

**Step 2: Write index.ts**

```typescript
// packages/client/src/components/LiveFeed/index.ts
export { default as LiveFeed } from './LiveFeed'
```

**Step 3: Commit**

```bash
git add packages/client/src/components/LiveFeed/
git commit -m "feat: add LiveFeed component for real-time activity

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 18: Wire Up Complete App

**Files:**
- Modify: `packages/client/src/App.tsx`
- Create: `packages/client/src/hooks/useAgents.ts`
- Create: `packages/client/src/hooks/useTasks.ts`

**Step 1: Write useAgents.ts**

```typescript
// packages/client/src/hooks/useAgents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export function useAgents() {
  const queryClient = useQueryClient()

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: api.getAgents,
    refetchInterval: 5000
  })

  const spawnMutation = useMutation({
    mutationFn: ({ agentId, prompt }: { agentId: string; prompt: string }) =>
      api.spawnAgent(agentId, prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })

  const stopMutation = useMutation({
    mutationFn: api.stopAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    }
  })

  const sendInputMutation = useMutation({
    mutationFn: ({ agentId, input }: { agentId: string; input: string }) =>
      api.sendInput(agentId, input)
  })

  return {
    agents,
    isLoading,
    error,
    spawnAgent: spawnMutation.mutate,
    stopAgent: stopMutation.mutate,
    sendInput: sendInputMutation.mutate
  }
}
```

**Step 2: Write useTasks.ts**

```typescript
// packages/client/src/hooks/useTasks.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

export function useTasks() {
  const { data: kanbanData, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', 'kanban'],
    queryFn: api.getKanbanTasks,
    refetchInterval: 2000
  })

  const { data: tasksNeedingInput = [] } = useQuery({
    queryKey: ['tasks', 'needs-input'],
    queryFn: api.getTasksNeedingInput,
    refetchInterval: 1000
  })

  return {
    kanbanData: kanbanData || { pending: [], in_progress: [], completed: [], needs_input: [] },
    tasksNeedingInput,
    isLoading,
    error,
    refetch
  }
}
```

**Step 3: Update App.tsx**

```typescript
// packages/client/src/App.tsx
import React, { useState, useCallback } from 'react'
import { useAgents } from './hooks/useAgents'
import { useTasks } from './hooks/useTasks'
import { useSSE } from './hooks/useSSE'
import { AgentPanel } from './components/AgentPanel'
import { KanbanBoard } from './components/KanbanBoard'
import { PromptDialog } from './components/PromptDialog'
import { InputRequired } from './components/InputRequired'
import { LiveFeed } from './components/LiveFeed'
import type { Agent } from './types'

interface FeedEvent {
  type: string
  timestamp: Date
  agentId?: string
  data?: string
}

const layoutStyle: React.CSSProperties = {
  display: 'flex',
  height: '100vh'
}

const mainStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}

const headerStyle: React.CSSProperties = {
  padding: '16px 24px',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}

export default function App() {
  const { agents, spawnAgent, stopAgent, sendInput } = useAgents()
  const { kanbanData, tasksNeedingInput, refetch } = useTasks()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([])

  const handleSSEMessage = useCallback((event: any) => {
    setFeedEvents(prev => [...prev, {
      type: event.type,
      timestamp: new Date(),
      agentId: event.agentId,
      data: event.data || event.task?.subject
    }])
    refetch()
  }, [refetch])

  useSSE('/api/events', { onMessage: handleSSEMessage })

  const handleSpawnAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (agent) setSelectedAgent(agent)
  }

  const handleSubmitPrompt = (agentId: string, prompt: string) => {
    spawnAgent({ agentId, prompt })
    setSelectedAgent(null)
  }

  const handleStopAgent = (agentId: string) => {
    stopAgent(agentId)
  }

  const handleSubmitInput = (agentId: string, input: string) => {
    sendInput({ agentId, input })
  }

  return (
    <div style={layoutStyle}>
      <AgentPanel
        agents={agents}
        onSpawnAgent={handleSpawnAgent}
        onStopAgent={handleStopAgent}
      />

      <div style={mainStyle}>
        <header style={headerStyle}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
            Agent Team Dashboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>
              {agents.filter(a => a.status === 'running').length} active agents
            </span>
          </div>
        </header>

        <div style={{ padding: '16px 24px' }}>
          <InputRequired
            tasks={tasksNeedingInput}
            onSubmitInput={handleSubmitInput}
          />
        </div>

        <KanbanBoard data={kanbanData} />

        <div style={{ padding: '16px 24px' }}>
          <LiveFeed events={feedEvents} />
        </div>
      </div>

      <PromptDialog
        agent={selectedAgent}
        onSubmit={handleSubmitPrompt}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add packages/client/src/
git commit -m "feat: wire up complete App with all components

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 19: Add CLI Entry Point

**Files:**
- Create: `bin/agent-dashboard.js`
- Modify: `package.json`

**Step 1: Write bin/agent-dashboard.js**

```javascript
#!/usr/bin/env node
// bin/agent-dashboard.js

const { spawn } = require('child_process')
const path = require('path')
const open = require('open')

const PORT = process.env.PORT || 3456
const serverPath = path.join(__dirname, '../packages/server/dist/index.js')

console.log(`Starting Agent Team Dashboard on http://localhost:${PORT}`)

const server = spawn('node', [serverPath], {
  env: { ...process.env, PORT },
  stdio: 'inherit'
})

if (process.argv.includes('--open')) {
  setTimeout(() => {
    open(`http://localhost:${PORT}`)
  }, 1000)
}

process.on('SIGINT', () => {
  server.kill()
  process.exit()
})
```

**Step 2: Update root package.json**

```json
{
  "name": "agent-team-dashboard",
  "version": "1.0.0",
  "bin": {
    "agent-dashboard": "./bin/agent-dashboard.js"
  },
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=server\" \"npm run dev --workspace=client\"",
    "build": "npm run build --workspaces",
    "start": "node bin/agent-dashboard.js",
    "test": "npm run test --workspaces"
  },
  "dependencies": {
    "open": "^10.0.0"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.3.3"
  },
  "workspaces": [
    "packages/*"
  ]
}
```

**Step 3: Commit**

```bash
git add bin/ package.json
git commit -m "feat: add CLI entry point for agent-dashboard command

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 20: Add README and Final Polish

**Files:**
- Create: `README.md`

**Step 1: Write README.md**

```markdown
# Agent Team Dashboard

A web-based Kanban dashboard for managing and monitoring multiple Claude agents with personas, tools, and tasks in real-time.

## Features

- **Kanban Board**: Track tasks across Pending, In Progress, Completed, and Needs Input columns
- **Agent Panel**: View all configured agents, spawn new agent sessions, and stop running ones
- **Real-time Updates**: Live task status via Server-Sent Events
- **Input Handling**: Respond to agent questions directly from the dashboard
- **Live Feed**: Monitor all agent activity in real-time

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
# Start the dashboard
npm start

# Start with auto-open browser
npm start -- --open

# Development mode
npm run dev
```

## Configuration

Agents are configured via `.claude/agents/*.md` files with frontmatter:

```yaml
---
name: eda-analyst
description: "Exploratory data analysis specialist"
model: sonnet
color: cyan
---

You are an expert Data Analyst...
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │AgentPanel│  │KanbanBoard│  │InputReq'd│  │LiveFeed │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                           │ HTTP/SSE
┌─────────────────────────────────────────────────────────┐
│                   Express Backend                        │
│  ┌────────────┐  ┌───────────┐  ┌──────────────────┐   │
│  │AgentService│  │TaskService │  │FileWatcher (SSE) │   │
│  └────────────┘  └───────────┘  └──────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              ClaudeRunner (subprocess)            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                    ~/.claude/tasks/
```

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with architecture overview

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

This plan implements a complete Agent Team Dashboard with:

1. **Backend (Express/Node.js)**:
   - `AgentService`: Loads agent configs from `.claude/agents/`
   - `TaskService`: Manages tasks from `~/.claude/tasks/`
   - `FileWatcher`: Monitors task directory with chokidar
   - `ClaudeRunner`: Spawns Claude CLI subprocesses
   - SSE endpoint for real-time updates

2. **Frontend (React/TypeScript)**:
   - `AgentPanel`: Shows all agents with spawn/stop controls
   - `KanbanBoard`: Four-column task board
   - `PromptDialog`: Task agents with custom prompts
   - `InputRequired`: Respond to agent questions
   - `LiveFeed`: Real-time activity stream

3. **Integration**:
   - Extends existing `.claude/agents/` configuration
   - Compatible with `~/.claude/tasks/` storage (like claude-task-viewer)
   - CLI entry point for easy launching

Total: 20 tasks, ~2-3 hours estimated implementation time.
