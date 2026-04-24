import fs from 'fs'
import path from 'path'
import os from 'os'
import { Project } from '@branch-manager/shared'

const CONFIG_DIR = path.join(os.homedir(), '.branch-manager')
const CONFIG_FILE = path.join(CONFIG_DIR, 'projects.json')

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function readConfig(): Project[] {
  ensureConfigDir()
  if (!fs.existsSync(CONFIG_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8')
    return JSON.parse(data) as Project[]
  } catch {
    return []
  }
}

function writeConfig(projects: Project[]): void {
  ensureConfigDir()
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(projects, null, 2))
}

function isGitRepo(dir: string): boolean {
  return fs.existsSync(path.join(dir, '.git'))
}

export class ProjectService {
  static list(): Project[] {
    return readConfig()
  }

  static add(dirPath: string): Project | null {
    const normalized = path.resolve(dirPath.trim())
    if (!fs.existsSync(normalized)) {
      throw new Error(`路径不存在: ${normalized}`)
    }
    const stats = fs.statSync(normalized)
    if (!stats.isDirectory()) {
      throw new Error(`不是目录: ${normalized}`)
    }
    const projects = readConfig()
    if (projects.some(p => p.path === normalized)) {
      throw new Error('该项目已添加')
    }
    const project: Project = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: path.basename(normalized),
      path: normalized,
      isGitRepo: isGitRepo(normalized)
    }
    projects.push(project)
    writeConfig(projects)
    return project
  }

  static remove(id: string): void {
    const projects = readConfig().filter(p => p.id !== id)
    writeConfig(projects)
  }
}
