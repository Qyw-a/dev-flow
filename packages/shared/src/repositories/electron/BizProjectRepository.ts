import { BizProjectRepository } from '../types'
import { BizProject } from '../../types'

export class ElectronBizProjectRepository implements BizProjectRepository {
  async list(): Promise<BizProject[]> {
    return window.api.bizProject.list()
  }

  async create(bizProject: Omit<BizProject, 'id' | 'createdAt'>): Promise<BizProject> {
    return window.api.bizProject.create(bizProject)
  }

  async update(id: string, updates: Partial<Omit<BizProject, 'id' | 'createdAt'>>): Promise<BizProject | null> {
    return window.api.bizProject.update(id, updates)
  }

  async remove(id: string): Promise<void> {
    return window.api.bizProject.remove(id)
  }
}
