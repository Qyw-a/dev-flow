import { WorkflowConfigRepository } from '../types'
import { WorkflowConfig } from '../../types'

export class ElectronWorkflowConfigRepository implements WorkflowConfigRepository {
  async list(): Promise<WorkflowConfig[]> {
    return window.api.workflowConfig.list()
  }

  async getByBizProjectId(bizProjectId: string): Promise<WorkflowConfig | null> {
    return window.api.workflowConfig.getByBizProjectId(bizProjectId)
  }

  async getOrCreateDefault(bizProjectId: string): Promise<WorkflowConfig> {
    return window.api.workflowConfig.getOrCreateDefault(bizProjectId)
  }

  async save(config: Omit<WorkflowConfig, 'id' | 'createdAt'> & { id?: string }): Promise<WorkflowConfig> {
    return window.api.workflowConfig.save(config)
  }

  async remove(id: string): Promise<void> {
    return window.api.workflowConfig.remove(id)
  }

  async removeByBizProjectId(bizProjectId: string): Promise<void> {
    return window.api.workflowConfig.removeByBizProjectId(bizProjectId)
  }
}
