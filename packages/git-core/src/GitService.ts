import simpleGit, { SimpleGit } from 'simple-git'
import { BranchInfo, GitResult, BatchOp } from './types'

function getGit(path: string): SimpleGit {
  return simpleGit(path)
}

export class GitService {
  static async branches(projectPath: string): Promise<BranchInfo[]> {
    const git = getGit(projectPath)
    const summary = await git.branchLocal()
    const log = await git.log({ maxCount: 100 })
    const commitMap = new Map(log.all.map(c => [c.hash, c]))

    return summary.all.map(name => {
      const branch = summary.branches[name]
      const commit = commitMap.get(branch.commit)
      return {
        name,
        current: branch.current,
        commit: branch.commit.slice(0, 7),
        label: commit?.message || '',
        date: commit?.date ? new Date(commit.date).toLocaleString() : ''
      }
    })
  }

  static async remoteBranches(projectPath: string): Promise<BranchInfo[]> {
    const git = getGit(projectPath)
    try {
      const summary = await git.branch(['-r'])
      const log = await git.log({ maxCount: 100 })
      const commitMap = new Map(log.all.map(c => [c.hash, c]))

      return summary.all.map(name => {
        const branch = summary.branches[name]
        const commit = commitMap.get(branch.commit)
        return {
          name,
          current: false,
          commit: branch.commit.slice(0, 7),
          label: commit?.message || '',
          date: commit?.date ? new Date(commit.date).toLocaleString() : ''
        }
      })
    } catch {
      return []
    }
  }

  static async createBranch(projectPath: string, branchName: string, base?: string): Promise<GitResult> {
    const git = getGit(projectPath)
    try {
      if (base) {
        await git.checkoutBranch(branchName, base)
      } else {
        await git.checkoutLocalBranch(branchName)
      }
      return { success: true, message: `分支 ${branchName} 创建成功`, projectId: '' }
    } catch (err: any) {
      return { success: false, message: err.message || String(err), projectId: '' }
    }
  }

  static async mergeBranch(projectPath: string, branchName: string, ff?: boolean): Promise<GitResult> {
    const git = getGit(projectPath)
    try {
      const options: string[] = []
      if (ff === false) options.push('--no-ff')
      await git.merge([...options, branchName])
      return { success: true, message: `分支 ${branchName} 合并成功`, projectId: '' }
    } catch (err: any) {
      return { success: false, message: err.message || String(err), projectId: '' }
    }
  }

  static async pushBranch(projectPath: string, branchName: string): Promise<GitResult> {
    const git = getGit(projectPath)
    try {
      await git.push('origin', branchName)
      return { success: true, message: `分支 ${branchName} 推送成功`, projectId: '' }
    } catch (err: any) {
      return { success: false, message: err.message || String(err), projectId: '' }
    }
  }

  static async deleteBranch(projectPath: string, branchName: string, force?: boolean): Promise<GitResult> {
    const git = getGit(projectPath)
    try {
      if (force) {
        await git.deleteLocalBranch(branchName, true)
      } else {
        await git.deleteLocalBranch(branchName, false)
      }
      return { success: true, message: `分支 ${branchName} 删除成功`, projectId: '' }
    } catch (err: any) {
      return { success: false, message: err.message || String(err), projectId: '' }
    }
  }

  static async deleteRemoteBranch(projectPath: string, branchName: string): Promise<GitResult> {
    const git = getGit(projectPath)
    try {
      const remote = branchName.split('/')[0]
      const name = branchName.split('/').slice(1).join('/')
      await git.raw(['push', remote, '--delete', name])
      return { success: true, message: `远程分支 ${branchName} 删除成功`, projectId: '' }
    } catch (err: any) {
      return { success: false, message: err.message || String(err), projectId: '' }
    }
  }

  static async renameBranch(projectPath: string, oldName: string, newName: string): Promise<GitResult> {
    const git = getGit(projectPath)
    try {
      await git.branch(['-m', oldName, newName])
      return { success: true, message: `分支 ${oldName} 已重命名为 ${newName}`, projectId: '' }
    } catch (err: any) {
      return { success: false, message: err.message || String(err), projectId: '' }
    }
  }

  static async checkoutBranch(projectPath: string, branchName: string): Promise<GitResult> {
    const git = getGit(projectPath)
    try {
      await git.checkout(branchName)
      return { success: true, message: `已切换到分支 ${branchName}`, projectId: '' }
    } catch (err: any) {
      return { success: false, message: err.message || String(err), projectId: '' }
    }
  }

  static async mergeToBranch(projectPath: string, sourceBranch: string, targetBranch: string, ff?: boolean): Promise<GitResult> {
    const git = getGit(projectPath)
    try {
      await git.checkout(targetBranch)
      const options: string[] = []
      if (ff === false) options.push('--no-ff')
      await git.merge([...options, sourceBranch])
      return { success: true, message: `已将 ${sourceBranch} 合并到 ${targetBranch}`, projectId: '' }
    } catch (err: any) {
      return { success: false, message: err.message || String(err), projectId: '' }
    }
  }

  static async fetch(projectPath: string): Promise<GitResult> {
    const git = getGit(projectPath)
    try {
      await git.fetch()
      return { success: true, message: 'fetch 成功', projectId: '' }
    } catch (err: any) {
      return { success: false, message: err.message || String(err), projectId: '' }
    }
  }

  static async pull(projectPath: string): Promise<GitResult> {
    const git = getGit(projectPath)
    try {
      await git.pull()
      return { success: true, message: 'pull 成功', projectId: '' }
    } catch (err: any) {
      return { success: false, message: err.message || String(err), projectId: '' }
    }
  }

  static async batch(projectMap: Map<string, string>, ops: BatchOp[]): Promise<GitResult[]> {
    const results: GitResult[] = []
    for (const op of ops) {
      const projectPath = projectMap.get(op.projectId)
      if (!projectPath) {
        results.push({ success: false, message: '项目未找到', projectId: op.projectId })
        continue
      }
      let result: GitResult
      switch (op.type) {
        case 'create':
          result = await GitService.createBranch(projectPath, op.branchName, op.base)
          break
        case 'merge':
          result = await GitService.mergeBranch(projectPath, op.branchName, op.ff)
          break
        case 'push':
          result = await GitService.pushBranch(projectPath, op.branchName)
          break
        case 'delete':
          result = await GitService.deleteBranch(projectPath, op.branchName, op.force)
          break
        case 'checkout':
          result = await GitService.checkoutBranch(projectPath, op.branchName)
          break
        default:
          result = { success: false, message: '未知操作类型', projectId: op.projectId }
      }
      result.projectId = op.projectId
      results.push(result)
    }
    return results
  }
}
