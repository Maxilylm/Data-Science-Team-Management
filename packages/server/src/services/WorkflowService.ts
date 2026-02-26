import { EventEmitter } from 'events'
import type { ProviderManager } from '../providers/ProviderManager.js'
import type { AgentService } from './AgentService.js'
import type { TicketService } from './TicketService.js'
import { getConfig } from '../config.js'

export interface WorkflowStep {
  agentId: string
  triggerCondition?: (output: string) => boolean
  extractContext?: (output: string) => string | null
}

export interface Workflow {
  name: string
  steps: WorkflowStep[]
}

// Default workflows
const DEFAULT_WORKFLOWS: Record<string, Workflow> = {
  'developer-to-pr': {
    name: 'Developer to PR Review',
    steps: [
      { agentId: 'developer' },
      {
        agentId: 'pr-approver',
        triggerCondition: (output: string) => {
          return /gh pr create|created pull request|PR #\d+|pull\/\d+/i.test(output)
        },
        extractContext: (output: string) => {
          const urlMatch = output.match(/https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/)
          if (urlMatch) return `PR URL: ${urlMatch[0]}`

          const prMatch = output.match(/PR #(\d+)|pull request #?(\d+)|created.*#(\d+)/i)
          if (prMatch) {
            const prNum = prMatch[1] || prMatch[2] || prMatch[3]
            return `PR #${prNum}`
          }

          return null
        }
      }
    ]
  }
}

export class WorkflowService extends EventEmitter {
  private activeWorkflows: Map<string, {
    workflow: Workflow
    currentStep: number
    ticketId: string
    accumulatedOutput: string
  }> = new Map()

  private providerManager: ProviderManager
  private agentService: AgentService
  private ticketService: TicketService

  constructor(
    providerManager: ProviderManager,
    agentService: AgentService,
    ticketService: TicketService
  ) {
    super()
    this.providerManager = providerManager
    this.agentService = agentService
    this.ticketService = ticketService

    this.providerManager.on('output', (event) => {
      for (const [sessionId, workflow] of this.activeWorkflows.entries()) {
        if (event.sessionId === sessionId) {
          workflow.accumulatedOutput += event.data
        }
      }
    })
  }

  startWorkflow(
    workflowName: string,
    ticketId: string,
    sessionId: string
  ): boolean {
    const workflow = DEFAULT_WORKFLOWS[workflowName]
    if (!workflow) {
      console.warn(`[Workflow] Unknown workflow: ${workflowName}`)
      return false
    }

    this.activeWorkflows.set(sessionId, {
      workflow,
      currentStep: 0,
      ticketId,
      accumulatedOutput: ''
    })

    this.emit('workflowStarted', { workflowName, ticketId, sessionId })
    return true
  }

  async onAgentComplete(
    sessionId: string,
    agentId: string
  ): Promise<boolean> {
    const workflowState = this.activeWorkflows.get(sessionId)
    if (!workflowState) {
      return this.checkImplicitWorkflow(agentId, sessionId)
    }

    const { workflow, currentStep, ticketId, accumulatedOutput } = workflowState
    const nextStepIndex = currentStep + 1

    if (nextStepIndex >= workflow.steps.length) {
      this.activeWorkflows.delete(sessionId)
      this.emit('workflowCompleted', { workflow: workflow.name, ticketId })
      return false
    }

    const nextStep = workflow.steps[nextStepIndex]

    if (nextStep.triggerCondition && !nextStep.triggerCondition(accumulatedOutput)) {
      this.activeWorkflows.delete(sessionId)
      return false
    }

    let context = ''
    if (nextStep.extractContext) {
      context = nextStep.extractContext(accumulatedOutput) || ''
    }

    const spawned = await this.spawnNextAgent(nextStep.agentId, ticketId, context)
    if (spawned) {
      this.activeWorkflows.delete(sessionId)
    }

    return spawned
  }

  private async checkImplicitWorkflow(
    agentId: string,
    sessionId: string
  ): Promise<boolean> {
    const session = this.providerManager.getSession(sessionId)
    if (!session?.ticketId) return false

    const ticket = this.ticketService.getTicket(session.ticketId)
    if (!ticket) return false

    if (agentId.toLowerCase() === 'developer') {
      return this.triggerPRReviewIfNeeded(ticket.id)
    }

    return false
  }

  private async triggerPRReviewIfNeeded(ticketId: string): Promise<boolean> {
    const ticket = this.ticketService.getTicket(ticketId)
    if (!ticket) return false

    const prApprover = this.agentService.getAgent('pr-approver')
    if (!prApprover) return false

    const config = getConfig()
    const prompt = `Review and merge any open pull requests related to ticket: "${ticket.title}"

Original ticket description: ${ticket.description}

Instructions:
1. Run \`gh pr list\` to see open PRs
2. If there's a recent PR matching this work, review it with \`gh pr diff\`
3. If the changes look good and tests pass, approve and merge with \`gh pr merge --squash --delete-branch\`
4. Report back what was done

Ticket ID: ${ticketId}`

    try {
      const newSessionId = await this.providerManager.spawn({
        agentId: prApprover.id,
        userPrompt: prompt,
        projectPath: config.projectPath,
        model: prApprover.model,
        tools: prApprover.tools,
        ticketId
      })

      const instanceId = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      this.agentService.addInstance(prApprover.id, {
        instanceId,
        sessionId: newSessionId,
        status: 'running',
        startedAt: new Date(),
        prompt: prompt.slice(0, 200),
        ticketId
      })

      this.ticketService.updateTicket(ticketId, {
        status: 'in_progress',
        assignedTo: prApprover.id
      })

      this.emit('agentChained', {
        fromAgent: 'developer',
        toAgent: 'pr-approver',
        ticketId
      })

      return true
    } catch (err) {
      console.error('[Workflow] Failed to trigger PR Approver:', err)
      return false
    }
  }

  private async spawnNextAgent(
    agentId: string,
    ticketId: string,
    context: string
  ): Promise<boolean> {
    const agent = this.agentService.getAgent(agentId.toLowerCase())
    if (!agent) return false

    const ticket = this.ticketService.getTicket(ticketId)
    if (!ticket) return false

    const config = getConfig()
    const prompt = `Continue working on ticket: "${ticket.title}"

Original description: ${ticket.description}

Previous agent context: ${context}

Please complete your part of the workflow.

Ticket ID: ${ticketId}`

    try {
      const sessionId = await this.providerManager.spawn({
        agentId: agent.id,
        userPrompt: prompt,
        projectPath: config.projectPath,
        model: agent.model,
        tools: agent.tools,
        ticketId
      })

      const instanceId = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      this.agentService.addInstance(agent.id, {
        instanceId,
        sessionId,
        status: 'running',
        startedAt: new Date(),
        prompt: prompt.slice(0, 200),
        ticketId
      })

      this.ticketService.updateTicket(ticketId, {
        status: 'in_progress',
        assignedTo: agent.id
      })

      this.emit('agentChained', { toAgent: agent.id, ticketId })
      return true
    } catch (err) {
      console.error(`[Workflow] Failed to spawn ${agentId}:`, err)
      return false
    }
  }

  getWorkflowForAgent(agentId: string): string | null {
    if (agentId.toLowerCase() === 'developer') return 'developer-to-pr'
    return null
  }

  // Track accumulated output for a session
  private outputBuffers: Map<string, string> = new Map()

  trackOutput(sessionId: string, output: string): void {
    const current = this.outputBuffers.get(sessionId) || ''
    this.outputBuffers.set(sessionId, current + output)
  }

  getAccumulatedOutput(sessionId: string): string {
    return this.outputBuffers.get(sessionId) || ''
  }

  clearOutput(sessionId: string): void {
    this.outputBuffers.delete(sessionId)
  }
}
