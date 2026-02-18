import { describe, it, expect, beforeEach } from 'vitest'
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
