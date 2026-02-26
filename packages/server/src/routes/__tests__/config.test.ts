import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import { createConfigRouter } from '../config'

// Mock the config module
vi.mock('../../config.js', () => {
  let mockConfig = {
    projectPath: '/test/project',
    projectName: 'Test Project',
    activeProjectId: 'proj-1',
    projects: [
      {
        id: 'proj-1',
        name: 'Test Project',
        path: '/test/project',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastAccessedAt: '2026-01-01T00:00:00.000Z'
      }
    ]
  }

  return {
    getConfig: vi.fn(() => ({ ...mockConfig, projects: [...mockConfig.projects] })),
    updateConfig: vi.fn((updates: any) => {
      mockConfig = { ...mockConfig, ...updates }
      return mockConfig
    }),
    getActiveProject: vi.fn(() => mockConfig.projects.find(p => p.id === mockConfig.activeProjectId)),
    addProject: vi.fn((name: string, projectPath: string) => {
      const project = {
        id: `proj-${Date.now()}`,
        name,
        path: projectPath,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      }
      mockConfig.projects.push(project)
      return project
    }),
    removeProject: vi.fn((id: string) => {
      const idx = mockConfig.projects.findIndex(p => p.id === id)
      if (idx === -1) return false
      mockConfig.projects.splice(idx, 1)
      return true
    }),
    setActiveProject: vi.fn((id: string) => {
      const project = mockConfig.projects.find(p => p.id === id)
      if (project) mockConfig.activeProjectId = id
      return project
    })
  }
})

describe('Config Routes - Project Management', () => {
  let app: express.Express

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/config', createConfigRouter())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('GET /api/config should return config', async () => {
    const res = await request(app).get('/api/config')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('projects')
    expect(res.body).toHaveProperty('activeProjectId')
  })

  it('GET /api/config/projects should return projects list', async () => {
    const res = await request(app).get('/api/config/projects')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('projects')
    expect(res.body).toHaveProperty('activeProjectId')
    expect(Array.isArray(res.body.projects)).toBe(true)
  })

  it('POST /api/config/projects should require name and path', async () => {
    const res = await request(app).post('/api/config/projects').send({})
    expect(res.status).toBe(400)
  })

  it('POST /api/config/projects should reject non-existent directory', async () => {
    const homeDir = os.homedir()
    const res = await request(app).post('/api/config/projects').send({
      name: 'Test',
      path: path.join(homeDir, 'nonexistent-path-that-does-not-exist')
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Directory does not exist')
  })

  it('POST /api/config/projects should reject path outside home directory', async () => {
    const res = await request(app).post('/api/config/projects').send({
      name: 'Dangerous',
      path: '/etc'
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Path must be within home directory')
  })

  it('POST /api/config/projects should accept existing directory within home', async () => {
    const homeDir = os.homedir()
    const tmpDir = path.join(homeDir, `.test-proj-${Date.now()}`)
    fs.mkdirSync(tmpDir, { recursive: true })

    try {
      const res = await request(app).post('/api/config/projects').send({
        name: 'Temp Project',
        path: tmpDir
      })
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.name).toBe('Temp Project')
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('DELETE /api/config/projects/:id should return 404 for unknown id', async () => {
    const { removeProject } = await import('../../config.js')
    ;(removeProject as any).mockReturnValueOnce(false)

    const res = await request(app).delete('/api/config/projects/nonexistent')
    expect(res.status).toBe(404)
  })

  it('POST /api/config/projects/:id/activate should return 404 for unknown id', async () => {
    const { setActiveProject } = await import('../../config.js')
    ;(setActiveProject as any).mockReturnValueOnce(undefined)

    const res = await request(app).post('/api/config/projects/nonexistent/activate')
    expect(res.status).toBe(404)
  })
})

describe('Directory Browser - Path Traversal Prevention', () => {
  let app: express.Express

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/config', createConfigRouter())
  })

  it('should allow browsing home directory', async () => {
    const res = await request(app).get('/api/config/filesystem/browse')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('currentPath')
    expect(res.body).toHaveProperty('entries')
    expect(res.body.isHome).toBe(true)
  })

  it('should reject path traversal outside home directory', async () => {
    const res = await request(app)
      .get('/api/config/filesystem/browse')
      .query({ path: '/etc' })
    expect(res.status).toBe(403)
  })

  it('should reject path traversal with ../', async () => {
    const homeDir = os.homedir()
    const traversalPath = path.join(homeDir, '..', '..', 'etc')
    const res = await request(app)
      .get('/api/config/filesystem/browse')
      .query({ path: traversalPath })
    expect(res.status).toBe(403)
  })

  it('should allow browsing subdirectory of home', async () => {
    const homeDir = os.homedir()
    const res = await request(app)
      .get('/api/config/filesystem/browse')
      .query({ path: homeDir })
    expect(res.status).toBe(200)
    expect(res.body.currentPath).toBe(homeDir)
  })
})
