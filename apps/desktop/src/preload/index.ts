import { contextBridge, ipcRenderer } from 'electron'
import { Project } from '@branch-manager/shared'
import { BranchInfo, GitResult, BatchOp } from '@branch-manager/git-core'

const api = {
  project: {
    list: (): Promise<Project[]> => ipcRenderer.invoke('project:list'),
    add: (path?: string): Promise<Project | null> => ipcRenderer.invoke('project:add', path),
    remove: (id: string): Promise<void> => ipcRenderer.invoke('project:remove', id)
  },
  git: {
    branches: (projectId: string): Promise<BranchInfo[]> => ipcRenderer.invoke('git:branches', projectId),
    remoteBranches: (projectId: string): Promise<BranchInfo[]> => ipcRenderer.invoke('git:remoteBranches', projectId),
    createBranch: (projectId: string, branchName: string, base?: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:createBranch', projectId, branchName, base),
    mergeBranch: (projectId: string, branchName: string, ff?: boolean): Promise<GitResult> =>
      ipcRenderer.invoke('git:mergeBranch', projectId, branchName, ff),
    pushBranch: (projectId: string, branchName: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:pushBranch', projectId, branchName),
    deleteBranch: (projectId: string, branchName: string, force?: boolean): Promise<GitResult> =>
      ipcRenderer.invoke('git:deleteBranch', projectId, branchName, force),
    checkoutBranch: (projectId: string, branchName: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:checkoutBranch', projectId, branchName),
    mergeToBranch: (projectId: string, sourceBranch: string, targetBranch: string, ff?: boolean): Promise<GitResult> =>
      ipcRenderer.invoke('git:mergeToBranch', projectId, sourceBranch, targetBranch, ff),
    fetch: (projectId: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:fetch', projectId),
    pull: (projectId: string): Promise<GitResult> =>
      ipcRenderer.invoke('git:pull', projectId),
    batch: (ops: BatchOp[]): Promise<GitResult[]> => ipcRenderer.invoke('git:batch', ops)
  }
}

contextBridge.exposeInMainWorld('api', api)

declare global {
  interface Window {
    api: typeof api
  }
}
