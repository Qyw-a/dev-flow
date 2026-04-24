import { app, BrowserWindow, nativeImage } from 'electron'
import path from 'path'
import { registerProjectIpc } from './ipc/project'
import { registerBizProjectIpc } from './ipc/bizProject'
import { registerGitIpc } from './ipc/git'
import { registerTicketIpc } from './ipc/ticket'
import { registerVersionIpc } from './ipc/version'
import { registerWorkflowConfigIpc } from './ipc/workflowConfig'

function getIconPath(): string | undefined {
  if (process.platform === 'win32') {
    return path.join(__dirname, '../../icon.ico')
  }
  if (process.platform === 'linux') {
    return path.join(__dirname, '../../icon.png')
  }
  return undefined
}

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  } else {
    const url = process.env['ELECTRON_RENDERER_URL']
    if (url) {
      mainWindow.loadURL(url)
    } else {
      mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }
  }

  return mainWindow
}

app.whenReady().then(() => {
  registerProjectIpc()
  registerBizProjectIpc()
  registerGitIpc()
  registerTicketIpc()
  registerVersionIpc()
  registerWorkflowConfigIpc()
  createWindow()

  if (process.platform === 'darwin') {
    const dockIconPath = path.join(__dirname, '../../icon.png')
    app.dock.setIcon(nativeImage.createFromPath(dockIconPath))
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
