import * as fs from 'fs'
import * as path from 'path'
import type { Project } from './types/Agent.js'
import type { ProviderConfig, SecretsConfig } from './providers/types.js'

export interface DashboardConfig {
  projectPath: string
  projectName: string
  activeProjectId: string | null
  projects: Project[]
  provider?: ProviderConfig
}

interface StoredConfig {
  projectPath?: string
  projectName?: string
  activeProjectId?: string | null
  projects?: Project[]
  provider?: ProviderConfig
}

function getConfigPath(): string {
  return process.env.DASHBOARD_CONFIG_PATH
    || path.join(process.cwd(), '..', '..', '.claude', 'dashboard-config.json')
}

const SECRETS_PATH = path.join(process.cwd(), '..', '..', '.claude', 'secrets.json')

const DEFAULT_PROJECT_PATH = path.join(process.cwd(), '..', '..')
const DEFAULT_PROJECT_NAME = 'Data Science Team Management'

const DEFAULT_SECRETS: SecretsConfig = {
  providers: {},
  auth: {
    enabled: false,
    tokens: []
  }
}

function generateProjectId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function migrateConfig(raw: StoredConfig): DashboardConfig {
  if (raw.projects && Array.isArray(raw.projects)) {
    // Already new format
    const activeProject = raw.projects.find(p => p.id === raw.activeProjectId)
    return {
      projectPath: activeProject?.path || raw.projectPath || DEFAULT_PROJECT_PATH,
      projectName: activeProject?.name || raw.projectName || DEFAULT_PROJECT_NAME,
      activeProjectId: raw.activeProjectId || null,
      projects: raw.projects,
      provider: raw.provider || { active: 'claude-cli', configs: {} }
    }
  }

  // Legacy format: just projectPath/projectName
  const projectPath = raw.projectPath || DEFAULT_PROJECT_PATH
  const projectName = raw.projectName || DEFAULT_PROJECT_NAME
  const now = new Date().toISOString()
  const project: Project = {
    id: generateProjectId(),
    name: projectName,
    path: projectPath,
    createdAt: now,
    lastAccessedAt: now
  }

  return {
    projectPath,
    projectName,
    activeProjectId: project.id,
    projects: [project],
    provider: raw.provider || { active: 'claude-cli', configs: {} }
  }
}

export function loadConfig(): DashboardConfig {
  try {
    if (fs.existsSync(getConfigPath())) {
      const content = fs.readFileSync(getConfigPath(), 'utf-8')
      const raw = JSON.parse(content) as StoredConfig
      const migrated = migrateConfig(raw)

      // If the raw config lacked a projects array, persist the migrated version
      // so that the generated projectId is stable across restarts
      if (!raw.projects || !Array.isArray(raw.projects)) {
        persistConfig(migrated)
      }

      return migrated
    }
  } catch (error) {
    console.warn('Failed to load dashboard config, using defaults:', error)
  }

  // Create default config with a default project
  const now = new Date().toISOString()
  const defaultProject: Project = {
    id: generateProjectId(),
    name: DEFAULT_PROJECT_NAME,
    path: DEFAULT_PROJECT_PATH,
    createdAt: now,
    lastAccessedAt: now
  }

  return {
    projectPath: DEFAULT_PROJECT_PATH,
    projectName: DEFAULT_PROJECT_NAME,
    activeProjectId: defaultProject.id,
    projects: [defaultProject]
  }
}

function persistConfig(config: DashboardConfig): void {
  const configDir = path.dirname(getConfigPath())
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2))
}

export function saveConfig(updates: Partial<DashboardConfig>): DashboardConfig {
  const current = loadConfig()
  const updated = { ...current, ...updates }
  persistConfig(updated)
  return updated
}

export function loadSecrets(): SecretsConfig {
  try {
    if (fs.existsSync(SECRETS_PATH)) {
      const content = fs.readFileSync(SECRETS_PATH, 'utf-8')
      return { ...DEFAULT_SECRETS, ...JSON.parse(content) }
    }
  } catch (error) {
    console.warn('Failed to load secrets, using defaults:', error)
  }
  return DEFAULT_SECRETS
}

export function saveSecrets(secrets: Partial<SecretsConfig>): SecretsConfig {
  const current = loadSecrets()
  const updated = { ...current, ...secrets }

  const secretsDir = path.dirname(SECRETS_PATH)
  if (!fs.existsSync(secretsDir)) {
    fs.mkdirSync(secretsDir, { recursive: true })
  }

  fs.writeFileSync(SECRETS_PATH, JSON.stringify(updated, null, 2), {
    mode: 0o600
  })
  return updated
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****'
  return '****' + key.slice(-4)
}

// Singleton config instance
let config: DashboardConfig | null = null

export function getConfig(): DashboardConfig {
  if (!config) {
    config = loadConfig()
  }
  return config
}

export function updateConfig(updates: Partial<DashboardConfig>): DashboardConfig {
  config = saveConfig(updates)
  return config
}

export function getActiveProject(): Project | undefined {
  const cfg = getConfig()
  if (!cfg.activeProjectId) return cfg.projects[0]
  return cfg.projects.find(p => p.id === cfg.activeProjectId)
}

export function addProject(name: string, projectPath: string): Project {
  const cfg = getConfig()
  const now = new Date().toISOString()
  const project: Project = {
    id: generateProjectId(),
    name,
    path: projectPath,
    createdAt: now,
    lastAccessedAt: now
  }
  cfg.projects.push(project)
  persistConfig(cfg)
  config = cfg
  return project
}

export function removeProject(id: string): boolean {
  const cfg = getConfig()
  const idx = cfg.projects.findIndex(p => p.id === id)
  if (idx === -1) return false

  cfg.projects.splice(idx, 1)

  // If we removed the active project, switch to the first available
  if (cfg.activeProjectId === id) {
    const next = cfg.projects[0]
    cfg.activeProjectId = next?.id || null
    if (next) {
      cfg.projectPath = next.path
      cfg.projectName = next.name
    }
  }

  persistConfig(cfg)
  config = cfg
  return true
}

export function setActiveProject(id: string): Project | undefined {
  const cfg = getConfig()
  const project = cfg.projects.find(p => p.id === id)
  if (!project) return undefined

  project.lastAccessedAt = new Date().toISOString()
  cfg.activeProjectId = id
  cfg.projectPath = project.path
  cfg.projectName = project.name

  persistConfig(cfg)
  config = cfg
  return project
}

export function resetConfigSingleton(): void {
  config = null
}
