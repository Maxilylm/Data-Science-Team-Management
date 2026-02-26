import * as fs from 'fs'
import * as path from 'path'
import { validatePath } from './readFile.js'

export interface SearchFilesInput {
  path: string
  pattern: string
  file_pattern?: string
}

interface SearchResult {
  file: string
  line: number
  content: string
}

export async function searchFiles(
  input: SearchFilesInput,
  projectPath: string
): Promise<string> {
  const resolvedPath = validatePath(input.path || '.', projectPath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Path not found: ${input.path}`)
  }

  const regex = new RegExp(input.pattern, 'gi')
  const results: SearchResult[] = []

  const files = collectFiles(resolvedPath, input.file_pattern)

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        results.push({
          file: path.relative(projectPath, file),
          line: i + 1,
          content: lines[i].trim()
        })
        regex.lastIndex = 0
      }
    }

    if (results.length >= 100) break
  }

  if (results.length === 0) {
    return `No matches found for pattern: ${input.pattern}`
  }

  return results
    .map(r => `${r.file}:${r.line}: ${r.content}`)
    .join('\n')
}

function collectFiles(
  dir: string,
  filePattern?: string,
  maxDepth = 5,
  depth = 0
): string[] {
  if (depth >= maxDepth) return []

  const stats = fs.statSync(dir)
  if (!stats.isDirectory()) {
    return [dir]
  }

  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue
    }

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      results.push(
        ...collectFiles(fullPath, filePattern, maxDepth, depth + 1)
      )
    } else if (!filePattern || matchPattern(entry.name, filePattern)) {
      results.push(fullPath)
    }
  }

  return results
}

function matchPattern(name: string, pattern: string): boolean {
  const regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp(`^${regex}$`).test(name)
}
