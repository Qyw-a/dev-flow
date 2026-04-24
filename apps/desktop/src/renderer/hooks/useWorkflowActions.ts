import { useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { useGitOps } from './useGitOps'
import { repositories } from '@branch-manager/shared'
import { Ticket, WorkflowStep, BizProject } from '@branch-manager/shared'
import { LogEntry } from '../types'

export function useWorkflowActions() {
  const { projects, addLog } = useStore()
  const { createBranch, mergeToBranch, pushBranch } = useGitOps()

  const renderBranchName = useCallback((template: string, ticket: Ticket): string => {
    const shortTitle = ticket.title
      .replace(/[\\/?%*:|"<>\s]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 20)
    return template
      .replace(/{ticketId}/g, ticket.id)
      .replace(/{shortTitle}/g, shortTitle)
      .replace(/{title}/g, ticket.title.slice(0, 40))
  }, [])

  const createBranchForTicket = useCallback(async (
    ticket: Ticket,
    template: string,
    baseBranch: string | undefined,
    projectId: string
  ): Promise<{ success: boolean; branchName: string; message: string }> => {
    const branchName = renderBranchName(template, ticket)
    const project = projects.find(p => p.id === projectId)
    if (!project) {
      return { success: false, branchName, message: '项目未找到' }
    }
    const result = await createBranch(projectId, branchName, baseBranch || undefined)
    if (result.success) {
      await repositories.ticketBranch.linkBranch(ticket.id, projectId, branchName)
      return { success: true, branchName, message: result.message }
    }
    return { success: false, branchName, message: result.message }
  }, [projects, createBranch, renderBranchName])

  const mergeTicketBranches = useCallback(async (
    ticket: Ticket,
    targetBranch: string,
    projectIds: string[],
    shouldPush: boolean
  ): Promise<{ success: boolean; message: string }> => {
    const links = await repositories.ticketBranch.listBranches(ticket.id)
    const errors: string[] = []

    for (const projectId of projectIds) {
      const project = projects.find(p => p.id === projectId)
      if (!project) continue

      const link = links.find(l => l.projectId === projectId)
      if (!link) {
        const log: LogEntry = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          projectName: project.name,
          action: `合并到 ${targetBranch}`,
          success: true,
          message: '需求未关联该项目的分支，跳过',
          time: new Date().toLocaleTimeString()
        }
        addLog(log)
        continue
      }

      const result = await mergeToBranch(projectId, link.branchName, targetBranch)
      if (!result.success) {
        errors.push(`${project.name}: ${result.message}`)
        const log: LogEntry = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          projectName: project.name,
          action: `合并到 ${targetBranch}`,
          success: false,
          message: result.message,
          time: new Date().toLocaleTimeString()
        }
        addLog(log)
        continue
      }

      const log: LogEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        projectName: project.name,
        action: `合并到 ${targetBranch}`,
        success: true,
        message: result.message,
        time: new Date().toLocaleTimeString()
      }
      addLog(log)

      if (shouldPush) {
        const pushResult = await pushBranch(projectId, targetBranch)
        const pushLog: LogEntry = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          projectName: project.name,
          action: `推送 ${targetBranch}`,
          success: pushResult.success,
          message: pushResult.message,
          time: new Date().toLocaleTimeString()
        }
        addLog(pushLog)
        if (!pushResult.success) {
          errors.push(`${project.name}: 推送失败 - ${pushResult.message}`)
        }
      }
    }

    if (errors.length > 0) {
      return { success: false, message: errors.join('; ') }
    }
    return { success: true, message: '合并成功' }
  }, [projects, mergeToBranch, pushBranch, addLog])

  const executeStepActions = useCallback(async (
    ticket: Ticket,
    step: WorkflowStep,
    bizProject: BizProject
  ): Promise<{ success: boolean; message: string }> => {
    const gitProjectIds = bizProject.gitProjectIds || []

    for (const action of step.actions) {
      switch (action.type) {
        case 'createBranch': {
          for (const projectId of gitProjectIds) {
            const result = await createBranchForTicket(ticket, action.template, action.baseBranch, projectId)
            if (!result.success) {
              return { success: false, message: `创建分支失败: ${result.message}` }
            }
          }
          break
        }
        case 'mergeToBranch': {
          const result = await mergeTicketBranches(ticket, action.targetBranch, gitProjectIds, action.push !== false)
          if (!result.success) {
            return { success: false, message: `合并失败: ${result.message}` }
          }
          break
        }
        case 'triggerDeploy': {
          const log: LogEntry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            projectName: bizProject.name,
            action: '触发发布',
            success: true,
            message: '发布触发已预留（CI/CD 集成开发中）',
            time: new Date().toLocaleTimeString()
          }
          addLog(log)
          break
        }
      }
    }

    return { success: true, message: '所有动作执行成功' }
  }, [createBranchForTicket, mergeTicketBranches, addLog])

  return {
    renderBranchName,
    createBranchForTicket,
    mergeTicketBranches,
    executeStepActions
  }
}
