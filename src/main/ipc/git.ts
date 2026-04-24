import { ipcMain } from 'electron'
import { GitService } from '../services/GitService'
import { ProjectService } from '../services/ProjectService'
import { BatchOp } from '../types'

export function registerGitIpc(): void {
  ipcMain.handle('git:branches', async (_, projectId: string) => {
    const projects = ProjectService.list()
    const project = projects.find(p => p.id === projectId)
    if (!project) throw new Error('项目未找到')
    if (!project.isGitRepo) throw new Error('不是 Git 仓库')
    return GitService.branches(project.path)
  })

  ipcMain.handle('git:remoteBranches', async (_, projectId: string) => {
    const projects = ProjectService.list()
    const project = projects.find(p => p.id === projectId)
    if (!project) throw new Error('项目未找到')
    if (!project.isGitRepo) throw new Error('不是 Git 仓库')
    return GitService.remoteBranches(project.path)
  })

  ipcMain.handle('git:createBranch', async (_, projectId: string, branchName: string, base?: string) => {
    const projects = ProjectService.list()
    const project = projects.find(p => p.id === projectId)
    if (!project) throw new Error('项目未找到')
    return GitService.createBranch(project.path, branchName, base)
  })

  ipcMain.handle('git:mergeBranch', async (_, projectId: string, branchName: string, ff?: boolean) => {
    const projects = ProjectService.list()
    const project = projects.find(p => p.id === projectId)
    if (!project) throw new Error('项目未找到')
    return GitService.mergeBranch(project.path, branchName, ff)
  })

  ipcMain.handle('git:pushBranch', async (_, projectId: string, branchName: string) => {
    const projects = ProjectService.list()
    const project = projects.find(p => p.id === projectId)
    if (!project) throw new Error('项目未找到')
    return GitService.pushBranch(project.path, branchName)
  })

  ipcMain.handle('git:deleteBranch', async (_, projectId: string, branchName: string, force?: boolean) => {
    const projects = ProjectService.list()
    const project = projects.find(p => p.id === projectId)
    if (!project) throw new Error('项目未找到')
    return GitService.deleteBranch(project.path, branchName, force)
  })

  ipcMain.handle('git:checkoutBranch', async (_, projectId: string, branchName: string) => {
    const projects = ProjectService.list()
    const project = projects.find(p => p.id === projectId)
    if (!project) throw new Error('项目未找到')
    return GitService.checkoutBranch(project.path, branchName)
  })

  ipcMain.handle('git:mergeToBranch', async (_, projectId: string, sourceBranch: string, targetBranch: string, ff?: boolean) => {
    const projects = ProjectService.list()
    const project = projects.find(p => p.id === projectId)
    if (!project) throw new Error('项目未找到')
    return GitService.mergeToBranch(project.path, sourceBranch, targetBranch, ff)
  })

  ipcMain.handle('git:fetch', async (_, projectId: string) => {
    const projects = ProjectService.list()
    const project = projects.find(p => p.id === projectId)
    if (!project) throw new Error('项目未找到')
    return GitService.fetch(project.path)
  })

  ipcMain.handle('git:pull', async (_, projectId: string) => {
    const projects = ProjectService.list()
    const project = projects.find(p => p.id === projectId)
    if (!project) throw new Error('项目未找到')
    return GitService.pull(project.path)
  })

  ipcMain.handle('git:batch', async (_, ops: BatchOp[]) => {
    const projects = ProjectService.list()
    const projectMap = new Map(projects.map(p => [p.id, p.path]))
    return GitService.batch(projectMap, ops)
  })
}
