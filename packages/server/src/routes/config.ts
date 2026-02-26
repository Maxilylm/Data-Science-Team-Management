import { Router, Request, Response } from 'express'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execSync } from 'child_process'
import {
  getConfig,
  updateConfig,
  getActiveProject,
  addProject,
  removeProject,
  setActiveProject
} from '../config.js'

interface DirectoryEntry {
  name: string
  path: string
  isDirectory: boolean
}

function isPathSafe(targetPath: string): boolean {
  const homeDir = os.homedir()
  const resolved = path.resolve(targetPath)
  return resolved.startsWith(homeDir)
}

function listDirectory(dirPath: string): DirectoryEntry[] {
  const resolved = path.resolve(dirPath)
  if (!isPathSafe(resolved)) {
    throw new Error('Path outside home directory')
  }

  const entries = fs.readdirSync(resolved, { withFileTypes: true })
  return entries
    .filter(e => !e.name.startsWith('.') || e.name === '.claude')
    .filter(e => e.isDirectory())
    .map(e => ({
      name: e.name,
      path: path.join(resolved, e.name),
      isDirectory: true
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export interface ConfigRouterOptions {
  onProjectSwitch?: (projectPath: string) => Promise<void>
}

export function createConfigRouter(options?: ConfigRouterOptions): Router {
  const router = Router()

  // Get current config
  router.get('/', (_req: Request, res: Response) => {
    res.json(getConfig())
  })

  // Update config
  router.patch('/', (req: Request, res: Response) => {
    const { projectPath, projectName } = req.body
    const updates: Record<string, string> = {}

    if (projectPath) updates.projectPath = projectPath
    if (projectName) updates.projectName = projectName

    const updated = updateConfig(updates)
    res.json(updated)
  })

  // --- Project Management Routes ---

  // List all projects
  router.get('/projects', (_req: Request, res: Response) => {
    const cfg = getConfig()
    res.json({
      projects: cfg.projects,
      activeProjectId: cfg.activeProjectId
    })
  })

  // Register a new project (existing directory)
  router.post('/projects', (req: Request, res: Response) => {
    const { name, path: projectPath } = req.body

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name is required' })
      return
    }
    if (!projectPath || typeof projectPath !== 'string') {
      res.status(400).json({ error: 'Path is required' })
      return
    }

    const resolved = path.resolve(projectPath)

    if (!fs.existsSync(resolved)) {
      res.status(400).json({ error: 'Directory does not exist' })
      return
    }

    const stat = fs.statSync(resolved)
    if (!stat.isDirectory()) {
      res.status(400).json({ error: 'Path is not a directory' })
      return
    }

    const project = addProject(name.trim(), resolved)
    res.status(201).json(project)
  })

  // Create a new project directory with scaffolding
  router.post('/projects/create', (req: Request, res: Response) => {
    const { name, path: projectPath } = req.body

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name is required' })
      return
    }
    if (!projectPath || typeof projectPath !== 'string') {
      res.status(400).json({ error: 'Path is required' })
      return
    }

    const resolved = path.resolve(projectPath)

    if (!isPathSafe(resolved)) {
      res.status(400).json({ error: 'Path must be within home directory' })
      return
    }

    try {
      // Create directory structure
      fs.mkdirSync(resolved, { recursive: true })

      const agentsDir = path.join(resolved, '.claude', 'agents')
      fs.mkdirSync(agentsDir, { recursive: true })

      // Create default agent config
      const defaultAgent = `---
name: Developer
description: "General purpose development agent"
model: sonnet
color: blue
---

You are a developer agent. Follow best practices and write clean code.
`
      fs.writeFileSync(path.join(agentsDir, 'developer.md'), defaultAgent)

      // Initialize git repo
      try {
        execSync('git init', { cwd: resolved, stdio: 'pipe' })
      } catch {
        // Git init failure is non-critical
      }

      const project = addProject(name.trim(), resolved)
      res.status(201).json(project)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ error: `Failed to create project: ${msg}` })
    }
  })

  // Delete (unregister) a project
  router.delete('/projects/:id', (req: Request, res: Response) => {
    const { id } = req.params
    const removed = removeProject(id)

    if (!removed) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    res.json({ success: true })
  })

  // Activate a project
  router.post('/projects/:id/activate', async (req: Request, res: Response) => {
    const { id } = req.params
    const project = setActiveProject(id)

    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    // Notify listeners about project switch
    if (options?.onProjectSwitch) {
      try {
        await options.onProjectSwitch(project.path)
      } catch (err) {
        console.error('Error during project switch callback:', err)
      }
    }

    res.json(project)
  })

  // Filesystem browser
  router.get('/filesystem/browse', (req: Request, res: Response) => {
    const browsePath = (req.query.path as string) || os.homedir()
    const resolved = path.resolve(browsePath)

    if (!isPathSafe(resolved)) {
      res.status(403).json({ error: 'Access denied: path outside home directory' })
      return
    }

    try {
      const entries = listDirectory(resolved)
      res.json({
        currentPath: resolved,
        parentPath: path.dirname(resolved),
        isHome: resolved === os.homedir(),
        entries
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      res.status(400).json({ error: msg })
    }
  })

  return router
}
