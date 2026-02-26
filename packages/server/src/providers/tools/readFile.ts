import * as fs from 'fs'
import * as path from 'path'

export interface ReadFileInput {
  path: string
}

export function validatePath(filePath: string, projectPath: string): string {
  const resolved = path.resolve(projectPath, filePath)
  // Check textual prefix first (for files that don't exist yet -- writeFile)
  const normalizedProject = path.resolve(projectPath) + path.sep
  if (!resolved.startsWith(normalizedProject) && resolved !== path.resolve(projectPath)) {
    throw new Error(`Path "${filePath}" is outside the project directory`)
  }
  // For existing files, also check after resolving symlinks
  if (fs.existsSync(resolved)) {
    const realPath = fs.realpathSync(resolved)
    const realProject = fs.realpathSync(path.resolve(projectPath)) + path.sep
    if (!realPath.startsWith(realProject) && realPath !== fs.realpathSync(path.resolve(projectPath))) {
      throw new Error(`Path "${filePath}" resolves to outside the project directory (symlink)`)
    }
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
