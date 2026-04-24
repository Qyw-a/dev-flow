import { GitRepository } from '../types'
import { BranchInfo, GitResult, BatchOp } from '@branch-manager/git-core'

export class ElectronGitRepository implements GitRepository {
  async branches(projectId: string): Promise<BranchInfo[]> {
    return window.api.git.branches(projectId)
  }

  async remoteBranches(projectId: string): Promise<BranchInfo[]> {
    return window.api.git.remoteBranches(projectId)
  }

  async createBranch(projectId: string, branchName: string, base?: string): Promise<GitResult> {
    return window.api.git.createBranch(projectId, branchName, base)
  }

  async mergeBranch(projectId: string, branchName: string, ff?: boolean): Promise<GitResult> {
    return window.api.git.mergeBranch(projectId, branchName, ff)
  }

  async pushBranch(projectId: string, branchName: string): Promise<GitResult> {
    return window.api.git.pushBranch(projectId, branchName)
  }

  async deleteBranch(projectId: string, branchName: string, force?: boolean): Promise<GitResult> {
    return window.api.git.deleteBranch(projectId, branchName, force)
  }

  async checkoutBranch(projectId: string, branchName: string): Promise<GitResult> {
    return window.api.git.checkoutBranch(projectId, branchName)
  }

  async mergeToBranch(projectId: string, sourceBranch: string, targetBranch: string, ff?: boolean): Promise<GitResult> {
    return window.api.git.mergeToBranch(projectId, sourceBranch, targetBranch, ff)
  }

  async fetch(projectId: string): Promise<GitResult> {
    return window.api.git.fetch(projectId)
  }

  async pull(projectId: string): Promise<GitResult> {
    return window.api.git.pull(projectId)
  }

  async batch(ops: BatchOp[]): Promise<GitResult[]> {
    return window.api.git.batch(ops)
  }
}
