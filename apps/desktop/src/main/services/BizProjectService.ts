import fs from 'fs'
import path from 'path'
import os from 'os'
import { BizProject } from '@branch-manager/shared'

const CONFIG_DIR = path.join(os.homedir(), '.branch-manager')
const BIZ_PROJECTS_FILE = path.join(CONFIG_DIR, 'biz-projects.json')

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function readBizProjects(): BizProject[] {
  ensureConfigDir()
  if (!fs.existsSync(BIZ_PROJECTS_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(BIZ_PROJECTS_FILE, 'utf-8')
    return JSON.parse(data) as BizProject[]
  } catch {
    return []
  }
}

function writeBizProjects(bizProjects: BizProject[]): void {
  ensureConfigDir()
  fs.writeFileSync(BIZ_PROJECTS_FILE, JSON.stringify(bizProjects, null, 2))
}

export class BizProjectService {
  static list(): BizProject[] {
    return readBizProjects()
  }

  static create(bizProject: Omit<BizProject, 'id' | 'createdAt'>): BizProject {
    const list = readBizProjects()
    const newItem: BizProject = {
      ...bizProject,
      id: 'BP-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString()
    }
    list.push(newItem)
    writeBizProjects(list)
    return newItem
  }

  static update(id: string, updates: Partial<Omit<BizProject, 'id' | 'createdAt'>>): BizProject | null {
    const list = readBizProjects()
    const idx = list.findIndex(b => b.id === id)
    if (idx === -1) return null
    list[idx] = { ...list[idx], ...updates }
    writeBizProjects(list)
    return list[idx]
  }

  static remove(id: string): void {
    const list = readBizProjects().filter(b => b.id !== id)
    writeBizProjects(list)
  }
}
