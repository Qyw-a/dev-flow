import { ipcMain } from 'electron'
import { WorkflowConfigService } from '../services/WorkflowConfigService'
import { WorkflowConfig } from '@branch-manager/shared'

export function registerWorkflowConfigIpc(): void {
  ipcMain.handle('workflowConfig:list', () => {
    return WorkflowConfigService.list()
  })

  ipcMain.handle('workflowConfig:getByBizProjectId', (_, bizProjectId: string) => {
    return WorkflowConfigService.getByBizProjectId(bizProjectId)
  })

  ipcMain.handle('workflowConfig:getOrCreateDefault', (_, bizProjectId: string) => {
    return WorkflowConfigService.getOrCreateDefault(bizProjectId)
  })

  ipcMain.handle('workflowConfig:save', async (_, config: Omit<WorkflowConfig, 'id' | 'createdAt'> & { id?: string }) => {
    return WorkflowConfigService.save(config)
  })

  ipcMain.handle('workflowConfig:remove', async (_, id: string) => {
    WorkflowConfigService.remove(id)
  })

  ipcMain.handle('workflowConfig:removeByBizProjectId', async (_, bizProjectId: string) => {
    WorkflowConfigService.removeByBizProjectId(bizProjectId)
  })
}
