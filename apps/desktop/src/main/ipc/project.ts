import { ipcMain, dialog, BrowserWindow } from 'electron'
import { ProjectService } from '../services/ProjectService'

export function registerProjectIpc(): void {
  ipcMain.handle('project:list', () => {
    return ProjectService.list()
  })

  ipcMain.handle('project:add', async (_, dirPath?: string) => {
    if (!dirPath) {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) throw new Error('未找到窗口')
      const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory']
      })
      if (result.canceled || result.filePaths.length === 0) {
        return null
      }
      dirPath = result.filePaths[0]
    }
    return ProjectService.add(dirPath)
  })

  ipcMain.handle('project:remove', (_, id: string) => {
    ProjectService.remove(id)
  })
}
