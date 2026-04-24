import { contextBridge, ipcRenderer } from 'electron'
import { Project, Ticket, TicketBranchLink, Version } from '@branch-manager/shared'
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
  },
  ticket: {
    list: (): Promise<Ticket[]> => ipcRenderer.invoke('ticket:list'),
    create: (ticket: Omit<Ticket, 'id' | 'createdAt'>): Promise<Ticket> => ipcRenderer.invoke('ticket:create', ticket),
    update: (id: string, updates: Partial<Omit<Ticket, 'id' | 'createdAt'>>): Promise<Ticket | null> => ipcRenderer.invoke('ticket:update', id, updates),
    remove: (id: string): Promise<void> => ipcRenderer.invoke('ticket:remove', id),
    listBranches: (ticketId: string): Promise<TicketBranchLink[]> => ipcRenderer.invoke('ticket:listBranches', ticketId),
    linkBranch: (ticketId: string, projectId: string, branchName: string): Promise<void> => ipcRenderer.invoke('ticket:linkBranch', ticketId, projectId, branchName),
    unlinkBranch: (ticketId: string, projectId: string, branchName: string): Promise<void> => ipcRenderer.invoke('ticket:unlinkBranch', ticketId, projectId, branchName)
  },
  version: {
    list: (): Promise<Version[]> => ipcRenderer.invoke('version:list'),
    create: (version: Omit<Version, 'id' | 'createdAt'>): Promise<Version> => ipcRenderer.invoke('version:create', version),
    update: (id: string, updates: Partial<Omit<Version, 'id' | 'createdAt'>>): Promise<Version | null> => ipcRenderer.invoke('version:update', id, updates),
    remove: (id: string): Promise<void> => ipcRenderer.invoke('version:remove', id)
  }
}

contextBridge.exposeInMainWorld('api', api)

declare global {
  interface Window {
    api: typeof api
  }
}
