import * as fs from 'fs'
import { validatePath } from './readFile.js'

export interface EditFileInput {
  path: string
  old_string: string
  new_string: string
}

export async function editFile(
  input: EditFileInput,
  projectPath: string
): Promise<string> {
  const resolvedPath = validatePath(input.path, projectPath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${input.path}`)
  }

  const content = fs.readFileSync(resolvedPath, 'utf-8')

  if (!content.includes(input.old_string)) {
    throw new Error(
      `String not found in ${input.path}. ` +
      `Make sure old_string matches exactly.`
    )
  }

  const updated = content.replace(input.old_string, input.new_string)
  fs.writeFileSync(resolvedPath, updated, 'utf-8')

  return `File edited: ${input.path}`
}
