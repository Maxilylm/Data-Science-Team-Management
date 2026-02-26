import { spawn } from 'child_process'
import { validatePath } from './readFile.js'

export interface ExecuteCommandInput {
  command: string
  args?: string[]
  cwd?: string
}

const COMMAND_ALLOWLIST = [
  'ls', 'cat', 'head', 'tail', 'grep', 'find', 'wc',
  'sort', 'uniq', 'diff', 'echo', 'pwd', 'mkdir', 'cp',
  'mv', 'rm', 'touch', 'chmod', 'git', 'npm', 'npx',
  'node', 'tsc', 'vitest', 'jest', 'prettier', 'eslint',
  'gh', 'curl', 'jq', 'sed', 'awk', 'tr', 'cut',
  'basename', 'dirname', 'realpath', 'which', 'env',
  'pip', 'python', 'python3', 'cargo', 'go', 'make'
]

export function isCommandAllowed(
  command: string,
  allowedTools?: string[]
): boolean {
  const baseCommand = command.split(/\s/)[0]
  if (COMMAND_ALLOWLIST.includes(baseCommand)) return true
  if (allowedTools?.includes(baseCommand)) return true
  return false
}

export async function executeCommand(
  input: ExecuteCommandInput,
  projectPath: string,
  allowedTools?: string[]
): Promise<string> {
  const command = input.command
  if (!isCommandAllowed(command, allowedTools)) {
    throw new Error(
      `Command "${command.split(/\s/)[0]}" is not in the allowlist`
    )
  }

  const cwd = input.cwd
    ? validatePath(input.cwd, projectPath)
    : projectPath

  return new Promise((resolve, reject) => {
    const proc = spawn('sh', ['-c', command], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 60000
    })

    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (data) => { stdout += data.toString() })
    proc.stderr?.on('data', (data) => { stderr += data.toString() })

    proc.on('close', (code) => {
      if (code !== 0 && stderr) {
        resolve(`Exit code: ${code}\nstdout:\n${stdout}\nstderr:\n${stderr}`)
      } else {
        resolve(stdout || '(no output)')
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Command failed: ${err.message}`))
    })
  })
}
