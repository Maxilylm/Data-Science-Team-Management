import * as fs from 'fs'
import * as path from 'path'
import type { TicketStatus, TicketPriority, ModelType } from '../types/Agent.js'

const VALID_STATUSES: TicketStatus[] = ['unassigned', 'pending', 'in_progress', 'needs_help', 'completed']
const VALID_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent']
const VALID_MODELS: ModelType[] = ['sonnet', 'opus', 'haiku']

export function isValidTicketStatus(value: unknown): value is TicketStatus {
  return typeof value === 'string' && VALID_STATUSES.includes(value as TicketStatus)
}

export function isValidTicketPriority(value: unknown): value is TicketPriority {
  return typeof value === 'string' && VALID_PRIORITIES.includes(value as TicketPriority)
}

export function isValidModel(value: unknown): value is ModelType {
  return typeof value === 'string' && VALID_MODELS.includes(value as ModelType)
}

export function readAgentSystemPrompt(agentId: string): string | undefined {
  try {
    const agentPath = path.join(
      process.cwd(), '..', '..', '.claude', 'agents', `${agentId}.md`
    )
    if (fs.existsSync(agentPath)) {
      return fs.readFileSync(agentPath, 'utf-8')
    }
  } catch {
    // File doesn't exist or can't be read
  }
  return undefined
}
