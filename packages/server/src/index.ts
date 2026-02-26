import express from 'express'
import cors from 'cors'
import path from 'path'
import { AgentService } from './services/AgentService.js'
import { TaskService } from './services/TaskService.js'
import { FileWatcher } from './services/FileWatcher.js'
import { TicketService } from './services/TicketService.js'
import { WorkflowService } from './services/WorkflowService.js'
import { ProviderManager } from './providers/ProviderManager.js'
import { createAgentsRouter } from './routes/agents.js'
import { createTasksRouter } from './routes/tasks.js'
import { createEventsRouter } from './routes/events.js'
import { createConfigRouter } from './routes/config.js'
import { createTicketsRouter } from './routes/tickets.js'
import { createSettingsRouter } from './routes/settings.js'
import { authMiddleware } from './middleware/auth.js'
import { getConfig, loadSecrets } from './config.js'

const PORT = process.env.PORT || 3456

async function main() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  // Apply auth middleware conditionally
  app.use(authMiddleware)

  // Initialize services
  const agentService = new AgentService()
  const taskService = new TaskService()
  const fileWatcher = new FileWatcher()
  const ticketService = new TicketService()

  // Initialize provider manager with config
  const config = getConfig()
  const secrets = loadSecrets()
  const providerManager = new ProviderManager({
    active: config.provider?.active || 'claude-cli',
    configs: buildProviderConfigs(config, secrets)
  })

  const workflowService = new WorkflowService(providerManager, agentService, ticketService)

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

  // Wire up provider manager status updates
  providerManager.on('output', (event) => {
    console.log(`[${event.agentId}] stdout:`, event.data)
    workflowService.trackOutput(event.sessionId, event.data)
  })

  providerManager.on('error', (event) => {
    console.log(`[${event.agentId}] stderr:`, event.data)
  })

  providerManager.on('close', async (event) => {
    console.log(`[${event.agentId}] closed with code:`, event.code)

    const accumulatedOutput = workflowService.getAccumulatedOutput(event.sessionId)
    const result = agentService.getInstanceBySession(event.sessionId)
    if (result) {
      const { agent, instance } = result
      agentService.removeInstance(agent.id, instance.instanceId)

      if (instance.ticketId && agent.id.toLowerCase() === 'developer') {
        const prCreated = /gh pr create|created pull request|PR #\d+|pull\/\d+|Creating pull request/i.test(accumulatedOutput)

        if (prCreated) {
          await handleDeveloperPrCreated(
            instance, agent, accumulatedOutput, providerManager, agentService, ticketService
          )
        } else {
          handleAgentFinished(instance, ticketService)
        }
      } else if (instance.ticketId) {
        handleAgentFinished(instance, ticketService)
      }
    }

    workflowService.clearOutput(event.sessionId)
  })

  providerManager.on('question', (event) => {
    console.log(`[${event.agentId}] asking question:`, event.question)
    if (event.ticketId) {
      ticketService.updateTicket(event.ticketId, {
        status: 'needs_help',
        helpRequest: {
          fromAgent: event.agentId,
          message: event.question
        }
      })
    }
    const result = agentService.getInstanceBySession(event.sessionId)
    if (result) {
      agentService.updateInstanceStatus(
        result.agent.id, result.instance.instanceId, 'waiting_input'
      )
    }
  })

  // Start file watcher
  await fileWatcher.start()

  // Wire up ticket events for SSE broadcasting
  ticketService.on('ticketCreated', (ticket) => {
    console.log(`[Ticket] Created: ${ticket.title}`)
  })
  ticketService.on('ticketUpdated', (ticket) => {
    console.log(`[Ticket] Updated: ${ticket.title} -> ${ticket.status}`)
  })

  // Mount routes
  app.use('/api/agents', createAgentsRouter(agentService, providerManager))
  app.use('/api/tasks', createTasksRouter(taskService))
  app.use('/api/tickets', createTicketsRouter(ticketService, providerManager, agentService))
  app.use('/api/events', createEventsRouter(fileWatcher, providerManager, ticketService, workflowService))
  app.use('/api/config', createConfigRouter({
    onProjectSwitch: async (projectPath: string) => {
      const newAgentsDir = path.join(projectPath, '.claude', 'agents')
      agentService.setConfigDir(newAgentsDir)
      await agentService.loadAgents()
      console.log(`[Project] Switched to: ${projectPath}`)
      console.log(`[Project] Reloaded ${agentService.getAllAgents().length} agents`)
    }
  }))
  app.use('/api/settings', createSettingsRouter(providerManager))

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      agents: agentService.getAllAgents().length,
      tasks: taskService.getAllTasks().length,
      activeProvider: providerManager.getActiveProviderId()
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
    console.log(`Project: ${config.projectName}`)
    console.log(`Working directory: ${config.projectPath}`)
    console.log(`Active provider: ${providerManager.getActiveProviderId()}`)
    console.log(`Loaded ${agentService.getAllAgents().length} agents from .claude/agents/`)
  })
}

function buildProviderConfigs(
  config: ReturnType<typeof getConfig>,
  secrets: ReturnType<typeof loadSecrets>
): Record<string, Record<string, unknown>> {
  const configs: Record<string, Record<string, unknown>> = {
    ...config.provider?.configs
  }

  // Merge secrets into provider configs
  for (const [providerId, providerSecrets] of Object.entries(secrets.providers)) {
    configs[providerId] = { ...configs[providerId], ...providerSecrets }
  }

  return configs
}

async function handleDeveloperPrCreated(
  instance: { ticketId?: string },
  agent: { id: string },
  accumulatedOutput: string,
  providerManager: ProviderManager,
  agentService: AgentService,
  ticketService: TicketService
): Promise<void> {
  console.log(`[Workflow] Developer created PR, triggering PR Approver...`)

  const prUrl = accumulatedOutput.match(/https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/)
  const prNum = accumulatedOutput.match(/PR #(\d+)|pull request.*#(\d+)/i)

  const prApprover = agentService.getAgent('pr-approver')
  if (!prApprover || !instance.ticketId) {
    if (instance.ticketId) {
      ticketService.updateTicket(instance.ticketId, { status: 'completed' })
    }
    return
  }

  const ticket = ticketService.getTicket(instance.ticketId)
  if (!ticket) return

  const config = getConfig()
  const prContext = prUrl ? prUrl[0] : (prNum ? `PR #${prNum[1] || prNum[2]}` : 'the latest PR')

  const prompt = buildPrApproverPrompt(prContext, ticket)

  try {
    const newSessionId = await providerManager.spawn({
      agentId: prApprover.id,
      userPrompt: prompt,
      projectPath: config.projectPath,
      model: prApprover.model,
      tools: prApprover.tools,
      ticketId: instance.ticketId
    })

    const newInstanceId = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    agentService.addInstance(prApprover.id, {
      instanceId: newInstanceId,
      sessionId: newSessionId,
      status: 'running',
      startedAt: new Date(),
      prompt: prompt.slice(0, 200),
      ticketId: instance.ticketId
    })

    ticketService.updateTicket(instance.ticketId, {
      status: 'in_progress',
      assignedTo: prApprover.id
    })
  } catch (err) {
    console.error('[Workflow] Failed to start PR Approver:', err)
    ticketService.updateTicket(instance.ticketId!, { status: 'completed' })
  }
}

function buildPrApproverPrompt(
  prContext: string,
  ticket: { title: string; description: string; id: string }
): string {
  return `Review and merge ${prContext} created for ticket: "${ticket.title}"

Original ticket: ${ticket.description}

Instructions:
1. List open PRs with \`gh pr list\`
2. View the PR diff with \`gh pr diff <number>\`
3. If code looks good and CI passes, approve and merge:
   \`gh pr review <number> --approve -b "LGTM"\`
   \`gh pr merge <number> --squash --delete-branch\`
4. Report what was done

Ticket ID: ${ticket.id}`
}

function handleAgentFinished(
  instance: { ticketId?: string },
  ticketService: TicketService
): void {
  if (!instance.ticketId) return
  const ticket = ticketService.getTicket(instance.ticketId)
  if (ticket && ticket.status === 'in_progress') {
    ticketService.updateTicket(ticket.id, { status: 'completed' })
  }
}

main().catch(console.error)
