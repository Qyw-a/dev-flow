import { ipcMain } from 'electron'
import { VersionService } from '../services/VersionService'
import { Version } from '@branch-manager/shared'

export function registerVersionIpc(): void {
  ipcMain.handle('version:list', () => {
    return VersionService.list()
  })

  ipcMain.handle('version:create', async (_, version: Omit<Version, 'id' | 'createdAt'>) => {
    return VersionService.create(version)
  })

  ipcMain.handle('version:update', async (_, id: string, updates: Partial<Omit<Version, 'id' | 'createdAt'>>) => {
    return VersionService.update(id, updates)
  })

  ipcMain.handle('version:remove', async (_, id: string) => {
    VersionService.remove(id)
  })
}
