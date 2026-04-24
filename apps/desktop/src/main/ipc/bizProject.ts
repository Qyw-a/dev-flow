import { ipcMain } from 'electron'
import { BizProjectService } from '../services/BizProjectService'
import { BizProject } from '@branch-manager/shared'

export function registerBizProjectIpc(): void {
  ipcMain.handle('bizProject:list', () => {
    return BizProjectService.list()
  })

  ipcMain.handle('bizProject:create', async (_, bizProject: Omit<BizProject, 'id' | 'createdAt'>) => {
    return BizProjectService.create(bizProject)
  })

  ipcMain.handle('bizProject:update', async (_, id: string, updates: Partial<Omit<BizProject, 'id' | 'createdAt'>>) => {
    return BizProjectService.update(id, updates)
  })

  ipcMain.handle('bizProject:remove', async (_, id: string) => {
    BizProjectService.remove(id)
  })
}
