import fs from 'fs'
import path from 'path'
import os from 'os'
import { Version } from '@branch-manager/shared'

const CONFIG_DIR = path.join(os.homedir(), '.branch-manager')
const VERSIONS_FILE = path.join(CONFIG_DIR, 'versions.json')

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function readVersions(): Version[] {
  ensureConfigDir()
  if (!fs.existsSync(VERSIONS_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(VERSIONS_FILE, 'utf-8')
    return JSON.parse(data) as Version[]
  } catch {
    return []
  }
}

function writeVersions(versions: Version[]): void {
  ensureConfigDir()
  fs.writeFileSync(VERSIONS_FILE, JSON.stringify(versions, null, 2))
}

export class VersionService {
  static list(): Version[] {
    return readVersions()
  }

  static listByBizProjectId(bizProjectId: string): Version[] {
    return readVersions().filter(v => v.bizProjectId === bizProjectId)
  }

  static create(version: Omit<Version, 'id' | 'createdAt'>): Version {
    const versions = readVersions()
    const newVersion: Version = {
      ...version,
      id: 'VER-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString()
    }
    versions.push(newVersion)
    writeVersions(versions)
    return newVersion
  }

  static update(id: string, updates: Partial<Omit<Version, 'id' | 'createdAt'>>): Version | null {
    const versions = readVersions()
    const idx = versions.findIndex(v => v.id === id)
    if (idx === -1) return null
    versions[idx] = { ...versions[idx], ...updates }
    writeVersions(versions)
    return versions[idx]
  }

  static remove(id: string): void {
    const versions = readVersions().filter(v => v.id !== id)
    writeVersions(versions)
  }
}
