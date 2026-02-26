import * as fs from 'fs'
import * as path from 'path'
import { validatePath } from './readFile.js'

export interface ListFilesInput {
  path: string
  pattern?: string
}

export async function listFiles(
  input: ListFilesInput,
  projectPath: string
): Promise<string> {
  const resolvedPath = validatePath(input.path || '.', projectPath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Directory not found: ${input.path}`)
  }

  const stats = fs.statSync(resolvedPath)
  if (!stats.isDirectory()) {
    throw new Error(`Path is not a directory: ${input.path}`)
  }

  const files = walkDirectory(resolvedPath, projectPath, input.pattern)
  return files.join('\n')
}

function walkDirectory(
  dir: string,
  projectPath: string,
  pattern?: string,
  maxDepth = 5,
  depth = 0
): string[] {
  if (depth >= maxDepth) return []

  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue
    }

    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(projectPath, fullPath)

    if (pattern && !matchGlob(entry.name, pattern)) {
      if (entry.isDirectory()) {
        results.push(
          ...walkDirectory(fullPath, projectPath, pattern, maxDepth, depth + 1)
        )
      }
      continue
    }

    results.push(relativePath)

    if (entry.isDirectory()) {
      results.push(
        ...walkDirectory(fullPath, projectPath, pattern, maxDepth, depth + 1)
      )
    }
  }

  return results
}

function matchGlob(name: string, pattern: string): boolean {
  const regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp(`^${regex}$`).test(name)
}
