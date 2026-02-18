import * as fs from 'fs'
import * as path from 'path'

export interface DashboardConfig {
  projectPath: string
  projectName: string
}

const CONFIG_PATH = path.join(process.cwd(), '..', '..', '.claude', 'dashboard-config.json')

const DEFAULT_CONFIG: DashboardConfig = {
  projectPath: path.join(process.cwd(), '..', '..'),  // Default to repo root
  projectName: 'Data Science Team Management'
}

export function loadConfig(): DashboardConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8')
      return { ...DEFAULT_CONFIG, ...JSON.parse(content) }
    }
  } catch (error) {
    console.warn('Failed to load dashboard config, using defaults:', error)
  }
  return DEFAULT_CONFIG
}

export function saveConfig(config: Partial<DashboardConfig>): DashboardConfig {
  const current = loadConfig()
  const updated = { ...current, ...config }

  const configDir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2))
  return updated
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
