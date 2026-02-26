import * as fs from 'fs'
import * as path from 'path'
import { validatePath } from './readFile.js'

export interface WriteFileInput {
  path: string
  content: string
}

export async function writeFile(
  input: WriteFileInput,
  projectPath: string
): Promise<string> {
  const resolvedPath = validatePath(input.path, projectPath)

  const dir = path.dirname(resolvedPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(resolvedPath, input.content, 'utf-8')
  return `File written: ${input.path}`
}
