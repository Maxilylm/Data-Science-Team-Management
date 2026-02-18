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
  claudeRunner.on('output', (event) => {
    console.log(`[${event.agentId}] stdout:`, event.data)
  })

  claudeRunner.on('error', (event) => {
    console.log(`[${event.agentId}] stderr:`, event.data)
  })

  claudeRunner.on('close', (event) => {
    console.log(`[${event.agentId}] closed with code:`, event.code)
    // Find and remove the instance by session ID
    const result = agentService.getInstanceBySession(event.sessionId)
    if (result) {
      agentService.removeInstance(result.agent.id, result.instance.instanceId)
    }
  })

  // Start file watcher
  await fileWatcher.start()

  // Mount routes
  app.use('/api/agents', createAgentsRouter(agentService, claudeRunner))
  app.use('/api/tasks', createTasksRouter(taskService))
  app.use('/api/events', createEventsRouter(fileWatcher, claudeRunner))

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      agents: agentService.getAllAgents().length,
      tasks: taskService.getAllTasks().length
    })
  })

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../client/dist')))
    app.get('*', (_req, res) => {
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
