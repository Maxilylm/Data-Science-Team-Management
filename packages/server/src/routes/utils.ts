import * as fs from 'fs'
import * as path from 'path'

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
