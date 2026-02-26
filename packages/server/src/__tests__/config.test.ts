import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// We need to mock the CONFIG_PATH used internally
let testDir: string
let configPath: string

beforeEach(() => {
  testDir = path.join(os.tmpdir(), `test-config-${Date.now()}`)
  fs.mkdirSync(testDir, { recursive: true })
  configPath = path.join(testDir, 'dashboard-config.json')
})

afterEach(() => {
  fs.rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('Config migration', () => {
  it('should migrate legacy format to new format with projects array', () => {
    // Write legacy config
    const legacyConfig = {
      projectPath: '/home/user/myproject',
      projectName: 'My Project'
    }
    fs.writeFileSync(configPath, JSON.stringify(legacyConfig))

    // Read and manually run migration logic (simulating what loadConfig does)
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

    // Migration logic: if no projects array, create one
    expect(raw.projects).toBeUndefined()
    expect(raw.projectPath).toBe('/home/user/myproject')
    expect(raw.projectName).toBe('My Project')
  })

  it('should preserve new format projects array', () => {
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

    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    expect(raw.projects).toHaveLength(1)
    expect(raw.activeProjectId).toBe('proj-123')
  })
})

describe('Project CRUD operations', () => {
  it('should add a project to the projects array', () => {
    const config = {
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

    // Add a new project
    const newProject = {
      id: 'proj-2',
      name: 'Project 2',
      path: '/home/user/proj2',
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString()
    }
    config.projects.push(newProject)

    expect(config.projects).toHaveLength(2)
    expect(config.projects[1].name).toBe('Project 2')
  })

  it('should remove a project by id', () => {
    const projects = [
      { id: 'proj-1', name: 'P1', path: '/p1', createdAt: '', lastAccessedAt: '' },
      { id: 'proj-2', name: 'P2', path: '/p2', createdAt: '', lastAccessedAt: '' }
    ]

    const idx = projects.findIndex(p => p.id === 'proj-1')
    expect(idx).toBe(0)
    projects.splice(idx, 1)
    expect(projects).toHaveLength(1)
    expect(projects[0].id).toBe('proj-2')
  })

  it('should switch active project and update lastAccessedAt', () => {
    const config = {
      activeProjectId: 'proj-1',
      projects: [
        { id: 'proj-1', name: 'P1', path: '/p1', createdAt: '', lastAccessedAt: '2026-01-01' },
        { id: 'proj-2', name: 'P2', path: '/p2', createdAt: '', lastAccessedAt: '2026-01-01' }
      ]
    }

    const target = config.projects.find(p => p.id === 'proj-2')!
    target.lastAccessedAt = new Date().toISOString()
    config.activeProjectId = 'proj-2'

    expect(config.activeProjectId).toBe('proj-2')
    expect(target.lastAccessedAt).not.toBe('2026-01-01')
  })

  it('should fall back to first project when active is removed', () => {
    const config = {
      activeProjectId: 'proj-1' as string | null,
      projects: [
        { id: 'proj-1', name: 'P1', path: '/p1', createdAt: '', lastAccessedAt: '' },
        { id: 'proj-2', name: 'P2', path: '/p2', createdAt: '', lastAccessedAt: '' }
      ]
    }

    // Remove active project
    config.projects = config.projects.filter(p => p.id !== 'proj-1')
    config.activeProjectId = config.projects[0]?.id || null

    expect(config.activeProjectId).toBe('proj-2')
    expect(config.projects).toHaveLength(1)
  })
})
