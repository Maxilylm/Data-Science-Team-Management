import { readFile } from './readFile.js'
import { writeFile } from './writeFile.js'
import { editFile } from './editFile.js'
import { listFiles } from './listFiles.js'
import { searchFiles } from './searchFiles.js'
import { executeCommand } from './executeCommand.js'

export interface ToolDefinition {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file at the given path.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file, creating it if needed.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        content: { type: 'string', description: 'Content to write' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'edit_file',
    description: 'Replace an exact string in a file with a new string.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        old_string: { type: 'string', description: 'Exact string to find' },
        new_string: { type: 'string', description: 'Replacement string' }
      },
      required: ['path', 'old_string', 'new_string']
    }
  },
  {
    name: 'list_files',
    description: 'List files in a directory, optionally filtered by pattern.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path relative to project root' },
        pattern: { type: 'string', description: 'Glob pattern to filter files (e.g. *.ts)' }
      },
      required: ['path']
    }
  },
  {
    name: 'search_files',
    description: 'Search for a regex pattern across files.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory to search in' },
        pattern: { type: 'string', description: 'Regex pattern to search for' },
        file_pattern: { type: 'string', description: 'Filter files by pattern (e.g. *.ts)' }
      },
      required: ['path', 'pattern']
    }
  },
  {
    name: 'execute_command',
    description: 'Execute a shell command in the project directory.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
        cwd: { type: 'string', description: 'Working directory (relative to project)' }
      },
      required: ['command']
    }
  }
]

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  projectPath: string,
  allowedTools?: string[]
): Promise<string> {
  switch (toolName) {
    case 'read_file':
      return readFile(input as { path: string }, projectPath)
    case 'write_file':
      return writeFile(
        input as { path: string; content: string },
        projectPath
      )
    case 'edit_file':
      return editFile(
        input as { path: string; old_string: string; new_string: string },
        projectPath
      )
    case 'list_files':
      return listFiles(
        input as { path: string; pattern?: string },
        projectPath
      )
    case 'search_files':
      return searchFiles(
        input as { path: string; pattern: string; file_pattern?: string },
        projectPath
      )
    case 'execute_command':
      return executeCommand(
        input as { command: string; cwd?: string },
        projectPath,
        allowedTools
      )
    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

export { readFile, writeFile, editFile, listFiles, searchFiles, executeCommand }
