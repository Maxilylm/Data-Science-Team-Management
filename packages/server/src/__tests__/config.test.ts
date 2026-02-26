import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

let testDir: string
let configPath: string

// We dynamically import the config module so that the env var is set before module evaluation
async function importConfig() {
  // Clear the module cache to force re-evaluation with updated env var
  const modulePath = path.resolve(__dirname, '../config.js')
  // Vitest uses its own module system; we rely on resetConfigSingleton + env var
  const mod = await import('../config.js')
  return mod
}

beforeEach(() => {
  testDir = path.join(os.tmpdir(), `test-config-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)
  fs.mkdirSync(testDir, { recursive: true })
  configPath = path.join(testDir, 'dashboard-config.json')
  process.env.DASHBOARD_CONFIG_PATH = configPath
})

afterEach(() => {
  delete process.env.DASHBOARD_CONFIG_PATH
  fs.rmSync(testDir, { recursive: true, force: true })
})

describe('Config migration', () => {
  it('should migrate legacy format to new format with projects array', async () => {
    const { loadConfig, resetConfigSingleton } = await importConfig()
    resetConfigSingleton()

    // Write legacy config (no projects array)
    const legacyConfig = {
      projectPath: '/home/user/myproject',
      projectName: 'My Project'
    }
    fs.writeFileSync(configPath, JSON.stringify(legacyConfig))

    const result = loadConfig()

    expect(result.projects).toHaveLength(1)
    expect(result.projects[0].name).toBe('My Project')
    expect(result.projects[0].path).toBe('/home/user/myproject')
    expect(result.activeProjectId).toBe(result.projects[0].id)
    expect(result.projectPath).toBe('/home/user/myproject')
    expect(result.projectName).toBe('My Project')
  })

  it('should persist migrated config to disk so projectId is stable', async () => {
    const { loadConfig, resetConfigSingleton } = await importConfig()
    resetConfigSingleton()

    // Write legacy config
    const legacyConfig = {
      projectPath: '/home/user/myproject',
      projectName: 'My Project'
    }
    fs.writeFileSync(configPath, JSON.stringify(legacyConfig))

    // First load triggers migration and persists
    const firstLoad = loadConfig()
    resetConfigSingleton()

    // Second load should read the persisted migrated config
    const secondLoad = loadConfig()

    // The project ID should be the same across both loads
    expect(secondLoad.activeProjectId).toBe(firstLoad.activeProjectId)
    expect(secondLoad.projects[0].id).toBe(firstLoad.projects[0].id)
  })

  it('should preserve new format projects array', async () => {
    const { loadConfig, resetConfigSingleton } = await importConfig()
    resetConfigSingleton()

    const newConfig = {
      projectPath: '/home/user/proj1',
      projectName: 'Project 1',
      activeProjectId: 'proj-123',
      projects: [
        {
          id: 'proj-123',
          name: 'Project 1',
          path: '/home/user/proj1',
          createdAt: '2026-01-01T00:00:00.000Z',
          lastAccessedAt: '2026-01-01T00:00:00.000Z'
        }
      ]
    }
    fs.writeFileSync(configPath, JSON.stringify(newConfig))

    const result = loadConfig()
    expect(result.projects).toHaveLength(1)
    expect(result.activeProjectId).toBe('proj-123')
    expect(result.projects[0].id).toBe('proj-123')
  })
})

describe('Project CRUD operations', () => {
  it('should add a project to the projects array', async () => {
    const { addProject, getConfig, resetConfigSingleton } = await importConfig()
    resetConfigSingleton()

    // Seed a config file
    const seedConfig = {
      projectPath: '/home/user/proj1',
      projectName: 'Project 1',
      activeProjectId: 'proj-1',
      projects: [
        {
          id: 'proj-1',
          name: 'Project 1',
          path: '/home/user/proj1',
          createdAt: '2026-01-01T00:00:00.000Z',
          lastAccessedAt: '2026-01-01T00:00:00.000Z'
        }
      ]
    }
    fs.writeFileSync(configPath, JSON.stringify(seedConfig))

    const newProject = addProject('Project 2', '/home/user/proj2')

    expect(newProject.name).toBe('Project 2')
    expect(newProject.path).toBe('/home/user/proj2')
    expect(newProject.id).toMatch(/^proj-/)

    const cfg = getConfig()
    expect(cfg.projects).toHaveLength(2)
    expect(cfg.projects[1].name).toBe('Project 2')

    // Verify persisted to disk
    const onDisk = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    expect(onDisk.projects).toHaveLength(2)
  })

  it('should remove a project by id', async () => {
    const { removeProject, getConfig, resetConfigSingleton } = await importConfig()
    resetConfigSingleton()

    const seedConfig = {
      projectPath: '/home/user/proj1',
      projectName: 'Project 1',
      activeProjectId: 'proj-1',
      projects: [
        { id: 'proj-1', name: 'P1', path: '/p1', createdAt: '', lastAccessedAt: '' },
        { id: 'proj-2', name: 'P2', path: '/p2', createdAt: '', lastAccessedAt: '' }
      ]
    }
    fs.writeFileSync(configPath, JSON.stringify(seedConfig))

    const result = removeProject('proj-1')
    expect(result).toBe(true)

    const cfg = getConfig()
    expect(cfg.projects).toHaveLength(1)
    expect(cfg.projects[0].id).toBe('proj-2')
  })

  it('should return false when removing non-existent project', async () => {
    const { removeProject, resetConfigSingleton } = await importConfig()
    resetConfigSingleton()

    const seedConfig = {
      projectPath: '/p1',
      projectName: 'P1',
      activeProjectId: 'proj-1',
      projects: [
        { id: 'proj-1', name: 'P1', path: '/p1', createdAt: '', lastAccessedAt: '' }
      ]
    }
    fs.writeFileSync(configPath, JSON.stringify(seedConfig))

    const result = removeProject('nonexistent')
    expect(result).toBe(false)
  })

  it('should fall back to first project when active is removed', async () => {
    const { removeProject, getConfig, resetConfigSingleton } = await importConfig()
    resetConfigSingleton()

    const seedConfig = {
      projectPath: '/p1',
      projectName: 'P1',
      activeProjectId: 'proj-1',
      projects: [
        { id: 'proj-1', name: 'P1', path: '/p1', createdAt: '', lastAccessedAt: '' },
        { id: 'proj-2', name: 'P2', path: '/p2', createdAt: '', lastAccessedAt: '' }
      ]
    }
    fs.writeFileSync(configPath, JSON.stringify(seedConfig))

    removeProject('proj-1')

    const cfg = getConfig()
    expect(cfg.activeProjectId).toBe('proj-2')
    expect(cfg.projects).toHaveLength(1)
  })

  it('should switch active project and update lastAccessedAt', async () => {
    const { setActiveProject, getConfig, resetConfigSingleton } = await importConfig()
    resetConfigSingleton()

    const seedConfig = {
      projectPath: '/p1',
      projectName: 'P1',
      activeProjectId: 'proj-1',
      projects: [
        { id: 'proj-1', name: 'P1', path: '/p1', createdAt: '', lastAccessedAt: '2026-01-01' },
        { id: 'proj-2', name: 'P2', path: '/p2', createdAt: '', lastAccessedAt: '2026-01-01' }
      ]
    }
    fs.writeFileSync(configPath, JSON.stringify(seedConfig))

    const project = setActiveProject('proj-2')
    expect(project).toBeDefined()
    expect(project!.id).toBe('proj-2')
    expect(project!.lastAccessedAt).not.toBe('2026-01-01')

    const cfg = getConfig()
    expect(cfg.activeProjectId).toBe('proj-2')
    expect(cfg.projectPath).toBe('/p2')
    expect(cfg.projectName).toBe('P2')
  })

  it('should return undefined when activating non-existent project', async () => {
    const { setActiveProject, resetConfigSingleton } = await importConfig()
    resetConfigSingleton()

    const seedConfig = {
      projectPath: '/p1',
      projectName: 'P1',
      activeProjectId: 'proj-1',
      projects: [
        { id: 'proj-1', name: 'P1', path: '/p1', createdAt: '', lastAccessedAt: '' }
      ]
    }
    fs.writeFileSync(configPath, JSON.stringify(seedConfig))

    const result = setActiveProject('nonexistent')
    expect(result).toBeUndefined()
  })
})
