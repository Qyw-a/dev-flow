import { VersionRepository } from '../types'
import { Version } from '../../types'

export class ElectronVersionRepository implements VersionRepository {
  async list(): Promise<Version[]> {
    return window.api.version.list()
  }

  async listByBizProjectId(bizProjectId: string): Promise<Version[]> {
    return window.api.version.listByBizProjectId(bizProjectId)
  }

  async create(version: Omit<Version, 'id' | 'createdAt'>): Promise<Version> {
    return window.api.version.create(version)
  }

  async update(id: string, updates: Partial<Omit<Version, 'id' | 'createdAt'>>): Promise<Version | null> {
    return window.api.version.update(id, updates)
  }

  async remove(id: string): Promise<void> {
    return window.api.version.remove(id)
  }
}
