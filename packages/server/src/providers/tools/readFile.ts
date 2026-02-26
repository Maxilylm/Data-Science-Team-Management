import * as fs from 'fs'
import * as path from 'path'

export interface ReadFileInput {
  path: string
}

export function validatePath(filePath: string, projectPath: string): string {
  const resolved = path.resolve(projectPath, filePath)
  if (!resolved.startsWith(path.resolve(projectPath))) {
    throw new Error(`Path "${filePath}" is outside the project directory`)
  }
  return resolved
}

export async function readFile(
  input: ReadFileInput,
  projectPath: string
): Promise<string> {
  const resolvedPath = validatePath(input.path, projectPath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${input.path}`)
  }

  const stats = fs.statSync(resolvedPath)
  if (stats.isDirectory()) {
    throw new Error(`Path is a directory, not a file: ${input.path}`)
  }

  return fs.readFileSync(resolvedPath, 'utf-8')
}
