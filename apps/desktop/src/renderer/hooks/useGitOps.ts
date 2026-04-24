import { useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { repositories } from '@branch-manager/shared'
import { GitResult, LogEntry } from '../types'

export function useGitOps() {
  const { setBranches, setRemoteBranches, addLog, projects } = useStore()

  const refreshBranches = useCallback(async (projectId: string) => {
    const branches = await repositories.git.branches(projectId)
    setBranches(projectId, branches)
    return branches
  }, [setBranches])

  const refreshRemoteBranches = useCallback(async (projectId: string) => {
    const branches = await repositories.git.remoteBranches(projectId)
    setRemoteBranches(projectId, branches)
    return branches
  }, [setRemoteBranches])

  const refreshAllBranches = useCallback(async () => {
    const { projects } = useStore.getState()
    for (const p of projects) {
      if (!p.isGitRepo) continue
      try {
        const branches = await repositories.git.branches(p.id)
        setBranches(p.id, branches)
      } catch (err: any) {
        setBranches(p.id, [])
      }
    }
  }, [setBranches])

  const refreshAllRemoteBranches = useCallback(async () => {
    const { projects } = useStore.getState()
    for (const p of projects) {
      if (!p.isGitRepo) continue
      try {
        const branches = await repositories.git.remoteBranches(p.id)
        setRemoteBranches(p.id, branches)
      } catch (err: any) {
        setRemoteBranches(p.id, [])
      }
    }
  }, [setRemoteBranches])

  const logResult = useCallback((projectName: string, action: string, result: GitResult) => {
    const log: LogEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      projectName,
      action,
      success: result.success,
      message: result.message,
      time: new Date().toLocaleTimeString()
    }
    addLog(log)
  }, [addLog])

  const createBranch = useCallback(async (projectId: string, branchName: string, base?: string) => {
    const result = await repositories.git.createBranch(projectId, branchName, base)
    const project = projects.find(p => p.id === projectId)
    logResult(project?.name || projectId, `创建分支 ${branchName}`, result)
    if (result.success) await refreshBranches(projectId)
    return result
  }, [projects, logResult, refreshBranches])

  const mergeBranch = useCallback(async (projectId: string, branchName: string, ff?: boolean) => {
    const result = await repositories.git.mergeBranch(projectId, branchName, ff)
    const project = projects.find(p => p.id === projectId)
    logResult(project?.name || projectId, `合并分支 ${branchName}`, result)
    if (result.success) await refreshBranches(projectId)
    return result
  }, [projects, logResult, refreshBranches])

  const pushBranch = useCallback(async (projectId: string, branchName: string) => {
    const result = await repositories.git.pushBranch(projectId, branchName)
    const project = projects.find(p => p.id === projectId)
    logResult(project?.name || projectId, `推送分支 ${branchName}`, result)
    return result
  }, [projects, logResult])

  const deleteBranch = useCallback(async (projectId: string, branchName: string, force?: boolean) => {
    const result = await repositories.git.deleteBranch(projectId, branchName, force)
    const project = projects.find(p => p.id === projectId)
    logResult(project?.name || projectId, `删除分支 ${branchName}`, result)
    if (result.success) await refreshBranches(projectId)
    return result
  }, [projects, logResult, refreshBranches])

  const checkoutBranch = useCallback(async (projectId: string, branchName: string) => {
    const result = await repositories.git.checkoutBranch(projectId, branchName)
    const project = projects.find(p => p.id === projectId)
    logResult(project?.name || projectId, `切换分支 ${branchName}`, result)
    if (result.success) await refreshBranches(projectId)
    return result
  }, [projects, logResult, refreshBranches])

  const mergeToBranch = useCallback(async (projectId: string, sourceBranch: string, targetBranch: string, ff?: boolean) => {
    const result = await repositories.git.mergeToBranch(projectId, sourceBranch, targetBranch, ff)
    const project = projects.find(p => p.id === projectId)
    logResult(project?.name || projectId, `将 ${sourceBranch} 合并到 ${targetBranch}`, result)
    if (result.success) await refreshBranches(projectId)
    return result
  }, [projects, logResult, refreshBranches])

  const fetchRepo = useCallback(async (projectId: string) => {
    const result = await repositories.git.fetch(projectId)
    const project = projects.find(p => p.id === projectId)
    logResult(project?.name || projectId, 'fetch', result)
    if (result.success) await refreshBranches(projectId)
    return result
  }, [projects, logResult, refreshBranches])

  const pullRepo = useCallback(async (projectId: string) => {
    const result = await repositories.git.pull(projectId)
    const project = projects.find(p => p.id === projectId)
    logResult(project?.name || projectId, 'pull', result)
    if (result.success) await refreshBranches(projectId)
    return result
  }, [projects, logResult, refreshBranches])

  const batch = useCallback(async (ops: { projectId: string; type: 'create' | 'merge' | 'push' | 'delete' | 'checkout'; branchName: string; base?: string; force?: boolean; ff?: boolean }[]) => {
    const results = await repositories.git.batch(ops)
    results.forEach((result, idx) => {
      const op = ops[idx]
      const project = projects.find(p => p.id === op.projectId)
      const actionMap: Record<string, string> = {
        create: '创建',
        merge: '合并',
        push: '推送',
        delete: '删除',
        checkout: '切换'
      }
      logResult(project?.name || op.projectId, `${actionMap[op.type]}分支 ${op.branchName}`, result)
    })
    const affected = new Set(ops.map(o => o.projectId))
    for (const pid of affected) {
      await refreshBranches(pid)
    }
    return results
  }, [projects, logResult, refreshBranches])

  return {
    refreshBranches,
    refreshRemoteBranches,
    refreshAllBranches,
    refreshAllRemoteBranches,
    createBranch,
    mergeBranch,
    pushBranch,
    deleteBranch,
    checkoutBranch,
    mergeToBranch,
    fetchRepo,
    pullRepo,
    batch
  }
}
