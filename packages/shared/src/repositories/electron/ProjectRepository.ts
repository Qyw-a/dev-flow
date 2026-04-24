import { ProjectRepository } from '../types'
import { Project } from '../../types'

export class ElectronProjectRepository implements ProjectRepository {
  async list(): Promise<Project[]> {
    return window.api.project.list()
  }

  async add(path?: string): Promise<Project | null> {
    return window.api.project.add(path)
  }

  async remove(id: string): Promise<void> {
    return window.api.project.remove(id)
  }
}
