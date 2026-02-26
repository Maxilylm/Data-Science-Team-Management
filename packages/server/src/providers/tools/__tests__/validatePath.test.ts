import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'
import { validatePath } from '../readFile.js'

vi.mock('fs')

const PROJECT_PATH = '/home/user/project'

describe('validatePath', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts a valid relative path within projectPath', () => {
    const result = validatePath('src/index.ts', PROJECT_PATH)
    expect(result).toBe(path.resolve(PROJECT_PATH, 'src/index.ts'))
  })

  it('accepts the projectPath root itself', () => {
    const result = validatePath('.', PROJECT_PATH)
    expect(result).toBe(path.resolve(PROJECT_PATH))
  })

  it('rejects paths outside projectPath via ..', () => {
    expect(() => validatePath('../../etc/passwd', PROJECT_PATH)).toThrow(
      'outside the project directory'
    )
  })

  it('rejects absolute paths outside projectPath', () => {
    expect(() => validatePath('/etc/passwd', PROJECT_PATH)).toThrow(
      'outside the project directory'
    )
  })

  it('rejects paths that are prefixes of projectPath (e.g., /project vs /project-secrets)', () => {
    // /home/user/project-secrets should NOT be accessible from /home/user/project
    expect(() =>
      validatePath('../project-secrets/data.txt', PROJECT_PATH)
    ).toThrow('outside the project directory')
  })

  it('rejects symlinks that resolve outside projectPath', () => {
    const symlinkPath = path.resolve(PROJECT_PATH, 'link.txt')

    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.realpathSync).mockImplementation((p: fs.PathLike) => {
      const s = p.toString()
      if (s === symlinkPath) return '/etc/shadow'
      if (s === path.resolve(PROJECT_PATH)) return path.resolve(PROJECT_PATH)
      return s
    })

    expect(() => validatePath('link.txt', PROJECT_PATH)).toThrow(
      'resolves to outside the project directory (symlink)'
    )
  })

  it('accepts symlinks that resolve within projectPath', () => {
    const symlinkPath = path.resolve(PROJECT_PATH, 'link.txt')
    const realTarget = path.resolve(PROJECT_PATH, 'src/real.txt')

    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.realpathSync).mockImplementation((p: fs.PathLike) => {
      const s = p.toString()
      if (s === symlinkPath) return realTarget
      if (s === path.resolve(PROJECT_PATH)) return path.resolve(PROJECT_PATH)
      return s
    })

    const result = validatePath('link.txt', PROJECT_PATH)
    expect(result).toBe(symlinkPath)
  })
})
