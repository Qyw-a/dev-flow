import { Project, Ticket, TicketBranchLink, Version } from '../types'
import { BranchInfo, GitResult, BatchOp } from '@branch-manager/git-core'

export interface ProjectRepository {
  list(): Promise<Project[]>
  add(path?: string): Promise<Project | null>
  remove(id: string): Promise<void>
}

export interface TicketRepository {
  list(): Promise<Ticket[]>
  create(ticket: Omit<Ticket, 'id' | 'createdAt'>): Promise<Ticket>
  update(id: string, updates: Partial<Omit<Ticket, 'id' | 'createdAt'>>): Promise<Ticket | null>
  remove(id: string): Promise<void>
}

export interface TicketBranchRepository {
  listBranches(ticketId: string): Promise<TicketBranchLink[]>
  linkBranch(ticketId: string, projectId: string, branchName: string): Promise<void>
  unlinkBranch(ticketId: string, projectId: string, branchName: string): Promise<void>
}

export interface VersionRepository {
  list(): Promise<Version[]>
  create(version: Omit<Version, 'id' | 'createdAt'>): Promise<Version>
  update(id: string, updates: Partial<Omit<Version, 'id' | 'createdAt'>>): Promise<Version | null>
  remove(id: string): Promise<void>
}

export interface GitRepository {
  branches(projectId: string): Promise<BranchInfo[]>
  remoteBranches(projectId: string): Promise<BranchInfo[]>
  createBranch(projectId: string, branchName: string, base?: string): Promise<GitResult>
  mergeBranch(projectId: string, branchName: string, ff?: boolean): Promise<GitResult>
  pushBranch(projectId: string, branchName: string): Promise<GitResult>
  deleteBranch(projectId: string, branchName: string, force?: boolean): Promise<GitResult>
  checkoutBranch(projectId: string, branchName: string): Promise<GitResult>
  mergeToBranch(projectId: string, sourceBranch: string, targetBranch: string, ff?: boolean): Promise<GitResult>
  fetch(projectId: string): Promise<GitResult>
  pull(projectId: string): Promise<GitResult>
  batch(ops: BatchOp[]): Promise<GitResult[]>
}
