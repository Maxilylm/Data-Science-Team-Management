import express from 'express'
import cors from 'cors'
import path from 'path'
import { AgentService } from './services/AgentService'
import { TaskService } from './services/TaskService'
import { FileWatcher } from './services/FileWatcher'
import { ClaudeRunner } from './services/ClaudeRunner'
import { TicketService } from './services/TicketService'
import { WorkflowService } from './services/WorkflowService'
import { createAgentsRouter } from './routes/agents'
import { createTasksRouter } from './routes/tasks'
import { createEventsRouter } from './routes/events'
import { createConfigRouter } from './routes/config'
import { createTicketsRouter } from './routes/tickets'
import { getConfig } from './config'

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
  const ticketService = new TicketService()
  const workflowService = new WorkflowService(claudeRunner, agentService, ticketService)

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
    // Track output for workflow context extraction
    workflowService.trackOutput(event.sessionId, event.data)
  })

  claudeRunner.on('error', (event) => {
    console.log(`[${event.agentId}] stderr:`, event.data)
  })

  claudeRunner.on('close', async (event) => {
    console.log(`[${event.agentId}] closed with code:`, event.code)

    // Check accumulated output for PR creation (for workflow chaining)
    const accumulatedOutput = workflowService.getAccumulatedOutput(event.sessionId)

    // Find and remove the instance by session ID
    const result = agentService.getInstanceBySession(event.sessionId)
    if (result) {
      const { agent, instance } = result
      agentService.removeInstance(agent.id, instance.instanceId)

      // Check if this agent triggers a workflow chain
      if (instance.ticketId && agent.id.toLowerCase() === 'developer') {
        // Check if developer created a PR
        const prCreated = /gh pr create|created pull request|PR #\d+|pull\/\d+|Creating pull request/i.test(accumulatedOutput)

        if (prCreated) {
          console.log(`[Workflow] Developer created PR, triggering PR Approver...`)

          // Extract PR info for the next agent
          const prUrl = accumulatedOutput.match(/https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/)
          const prNum = accumulatedOutput.match(/PR #(\d+)|pull request.*#(\d+)/i)

          // Spawn PR Approver
          const prApprover = agentService.getAgent('pr-approver')
          if (prApprover) {
            const ticket = ticketService.getTicket(instance.ticketId)
            if (ticket) {
              const config = getConfig()
              const prContext = prUrl ? prUrl[0] : (prNum ? `PR #${prNum[1] || prNum[2]}` : 'the latest PR')

              const prompt = `Review and merge ${prContext} created for ticket: "${ticket.title}"

Original ticket: ${ticket.description}

Instructions:
1. List open PRs with \`gh pr list\`
2. View the PR diff with \`gh pr diff <number>\`
3. If code looks good and CI passes, approve and merge:
   \`gh pr review <number> --approve -b "LGTM"\`
   \`gh pr merge <number> --squash --delete-branch\`
4. Report what was done

Ticket ID: ${instance.ticketId}`

              try {
                const newSessionId = await claudeRunner.spawn({
                  agentId: prApprover.id,
                  prompt,
                  projectPath: config.projectPath,
                  model: prApprover.model,
                  allowedTools: prApprover.tools,
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

                console.log(`[Workflow] PR Approver started for ticket: ${ticket.title}`)
              } catch (err) {
                console.error('[Workflow] Failed to start PR Approver:', err)
                // Mark ticket completed if we can't chain
                ticketService.updateTicket(instance.ticketId, { status: 'completed' })
              }
            }
          } else {
            // No PR Approver, mark completed
            ticketService.updateTicket(instance.ticketId, { status: 'completed' })
          }
        } else {
          // Developer finished without creating PR
          const ticket = ticketService.getTicket(instance.ticketId)
          // Only mark completed if not waiting for input (needs_help means user needs to answer)
          if (ticket && ticket.status === 'in_progress') {
            ticketService.updateTicket(ticket.id, { status: 'completed' })
          }
          // If ticket.status === 'needs_help', leave it - user will answer and we'll resume
        }
      } else if (instance.ticketId) {
        // Non-developer agent finished
        const ticket = ticketService.getTicket(instance.ticketId)
        // Only mark completed if not waiting for input
        if (ticket && ticket.status === 'in_progress') {
          ticketService.updateTicket(ticket.id, { status: 'completed' })
        }
        // If ticket.status === 'needs_help', leave it - user will answer and we'll resume
      }
    }

    // Clean up output buffer
    workflowService.clearOutput(event.sessionId)
  })

  // Handle when agent asks a question
  claudeRunner.on('question', (event) => {
    console.log(`[${event.agentId}] asking question:`, event.question)
    // Update ticket status to needs_help
    if (event.ticketId) {
      ticketService.updateTicket(event.ticketId, {
        status: 'needs_help',
        helpRequest: {
          fromAgent: event.agentId,
          message: event.question
        }
      })
    }
    // Update agent instance status
    const result = agentService.getInstanceBySession(event.sessionId)
    if (result) {
      agentService.updateInstanceStatus(result.agent.id, result.instance.instanceId, 'waiting_input')
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
  app.use('/api/agents', createAgentsRouter(agentService, claudeRunner))
  app.use('/api/tasks', createTasksRouter(taskService))
  app.use('/api/tickets', createTicketsRouter(ticketService, claudeRunner, agentService))
  app.use('/api/events', createEventsRouter(fileWatcher, claudeRunner, ticketService, workflowService))
  app.use('/api/config', createConfigRouter({
    onProjectSwitch: async (projectPath: string) => {
      const newAgentsDir = path.join(projectPath, '.claude', 'agents')
      agentService.setConfigDir(newAgentsDir)
      await agentService.loadAgents()
      console.log(`[Project] Switched to: ${projectPath}`)
      console.log(`[Project] Reloaded ${agentService.getAllAgents().length} agents`)
    }
  }))

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

  const config = getConfig()
  app.listen(PORT, () => {
    console.log(`Agent Team Dashboard server running on http://localhost:${PORT}`)
    console.log(`Project: ${config.projectName}`)
    console.log(`Working directory: ${config.projectPath}`)
    console.log(`Loaded ${agentService.getAllAgents().length} agents from .claude/agents/`)
  })
}

main().catch(console.error)
