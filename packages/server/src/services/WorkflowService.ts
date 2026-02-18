import { EventEmitter } from 'events'
import type { ClaudeRunner } from './ClaudeRunner'
import type { AgentService } from './AgentService'
import type { TicketService } from './TicketService'
import { getConfig } from '../config'

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
  // Developer creates PR -> PR Approver reviews and merges
  'developer-to-pr': {
    name: 'Developer to PR Review',
    steps: [
      { agentId: 'developer' },
      {
        agentId: 'pr-approver',
        // Trigger when developer created a PR
        triggerCondition: (output: string) => {
          return /gh pr create|created pull request|PR #\d+|pull\/\d+/i.test(output)
        },
        // Extract PR number/URL from developer's output
        extractContext: (output: string) => {
          // Match GitHub PR URLs
          const urlMatch = output.match(/https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/)
          if (urlMatch) return `PR URL: ${urlMatch[0]}`

          // Match PR numbers
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

  private claudeRunner: ClaudeRunner
  private agentService: AgentService
  private ticketService: TicketService

  constructor(
    claudeRunner: ClaudeRunner,
    agentService: AgentService,
    ticketService: TicketService
  ) {
    super()
    this.claudeRunner = claudeRunner
    this.agentService = agentService
    this.ticketService = ticketService

    // Listen for agent output to accumulate for context extraction
    this.claudeRunner.on('output', (event) => {
      for (const [sessionId, workflow] of this.activeWorkflows.entries()) {
        if (event.sessionId === sessionId) {
          workflow.accumulatedOutput += event.data
        }
      }
    })
  }

  // Start a workflow for a ticket
  startWorkflow(workflowName: string, ticketId: string, sessionId: string): boolean {
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

    console.log(`[Workflow] Started "${workflowName}" for ticket ${ticketId}`)
    this.emit('workflowStarted', { workflowName, ticketId, sessionId })
    return true
  }

  // Called when an agent completes - checks if next workflow step should trigger
  async onAgentComplete(sessionId: string, agentId: string): Promise<boolean> {
    const workflowState = this.activeWorkflows.get(sessionId)
    if (!workflowState) {
      // Check if this agent type has an implicit workflow
      return this.checkImplicitWorkflow(agentId, sessionId)
    }

    const { workflow, currentStep, ticketId, accumulatedOutput } = workflowState
    const nextStepIndex = currentStep + 1

    // Check if there's a next step
    if (nextStepIndex >= workflow.steps.length) {
      console.log(`[Workflow] Completed "${workflow.name}" for ticket ${ticketId}`)
      this.activeWorkflows.delete(sessionId)
      this.emit('workflowCompleted', { workflow: workflow.name, ticketId })
      return false
    }

    const nextStep = workflow.steps[nextStepIndex]

    // Check trigger condition
    if (nextStep.triggerCondition && !nextStep.triggerCondition(accumulatedOutput)) {
      console.log(`[Workflow] Next step "${nextStep.agentId}" trigger condition not met`)
      this.activeWorkflows.delete(sessionId)
      return false
    }

    // Extract context for next agent
    let context = ''
    if (nextStep.extractContext) {
      context = nextStep.extractContext(accumulatedOutput) || ''
    }

    // Spawn next agent
    const spawned = await this.spawnNextAgent(nextStep.agentId, ticketId, context)
    if (spawned) {
      this.activeWorkflows.delete(sessionId)
    }

    return spawned
  }

  // Check if a completing agent should implicitly trigger a workflow
  private async checkImplicitWorkflow(agentId: string, sessionId: string): Promise<boolean> {
    // Get the accumulated output for this session
    const session = this.claudeRunner.getSession(sessionId)
    if (!session?.ticketId) return false

    // Get ticket
    const ticket = this.ticketService.getTicket(session.ticketId)
    if (!ticket) return false

    // Developer completion - check if PR was created
    if (agentId.toLowerCase() === 'developer') {
      // We need to check if developer created a PR
      // Look at the session output if available
      const runningSession = this.claudeRunner.getSession(sessionId)
      if (runningSession) {
        // The output was accumulated - need a way to access it
        // For now, use a simple check based on the agent's typical behavior
        return this.triggerPRReviewIfNeeded(ticket.id)
      }
    }

    return false
  }

  // Trigger PR Approver if there are open PRs
  private async triggerPRReviewIfNeeded(ticketId: string): Promise<boolean> {
    const ticket = this.ticketService.getTicket(ticketId)
    if (!ticket) return false

    // Spawn PR Approver to check for and review open PRs
    const prApprover = this.agentService.getAgent('pr-approver')
    if (!prApprover) {
      console.warn('[Workflow] PR Approver agent not found')
      return false
    }

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
      const newSessionId = await this.claudeRunner.spawn({
        agentId: prApprover.id,
        prompt,
        projectPath: config.projectPath,
        model: prApprover.model,
        allowedTools: prApprover.tools,
        ticketId
      })

      // Create instance for tracking
      const instanceId = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      this.agentService.addInstance(prApprover.id, {
        instanceId,
        sessionId: newSessionId,
        status: 'running',
        startedAt: new Date(),
        prompt: prompt.slice(0, 200),
        ticketId
      })

      // Keep ticket in_progress during PR review
      this.ticketService.updateTicket(ticketId, {
        status: 'in_progress',
        assignedTo: prApprover.id
      })

      console.log(`[Workflow] Auto-triggered PR Approver for ticket: ${ticket.title}`)
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
    if (!agent) {
      console.warn(`[Workflow] Agent not found: ${agentId}`)
      return false
    }

    const ticket = this.ticketService.getTicket(ticketId)
    if (!ticket) {
      console.warn(`[Workflow] Ticket not found: ${ticketId}`)
      return false
    }

    const config = getConfig()
    const prompt = `Continue working on ticket: "${ticket.title}"

Original description: ${ticket.description}

Previous agent context: ${context}

Please complete your part of the workflow.

Ticket ID: ${ticketId}`

    try {
      const sessionId = await this.claudeRunner.spawn({
        agentId: agent.id,
        prompt,
        projectPath: config.projectPath,
        model: agent.model,
        allowedTools: agent.tools,
        ticketId
      })

      // Create instance for tracking
      const instanceId = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      this.agentService.addInstance(agent.id, {
        instanceId,
        sessionId,
        status: 'running',
        startedAt: new Date(),
        prompt: prompt.slice(0, 200),
        ticketId
      })

      // Update ticket assignment
      this.ticketService.updateTicket(ticketId, {
        status: 'in_progress',
        assignedTo: agent.id
      })

      console.log(`[Workflow] Chained to ${agent.id} for ticket: ${ticket.title}`)
      this.emit('agentChained', { toAgent: agent.id, ticketId })

      return true
    } catch (err) {
      console.error(`[Workflow] Failed to spawn ${agentId}:`, err)
      return false
    }
  }

  // Get workflow for an agent
  getWorkflowForAgent(agentId: string): string | null {
    const normalizedId = agentId.toLowerCase()

    // Developer triggers the developer-to-pr workflow
    if (normalizedId === 'developer') {
      return 'developer-to-pr'
    }

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
