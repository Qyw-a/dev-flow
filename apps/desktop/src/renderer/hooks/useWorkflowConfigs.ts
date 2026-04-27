import { useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { repositories } from '@dev-flow/shared'
import { WorkflowConfig, WorkflowStep } from '@dev-flow/shared'

export function useWorkflowConfigs() {
  const { workflowConfigs, setWorkflowConfigs } = useStore()

  const refresh = useCallback(async () => {
    const list = await repositories.workflowConfig.list()
    setWorkflowConfigs(list)
    return list
  }, [setWorkflowConfigs])

  const getByBizProjectId = useCallback(async (bizProjectId: string): Promise<WorkflowConfig> => {
    const fromStore = workflowConfigs.find(c => c.bizProjectId === bizProjectId)
    if (fromStore) return fromStore
    const config = await repositories.workflowConfig.getOrCreateDefault(bizProjectId)
    setWorkflowConfigs(prev => {
      const exists = prev.find(c => c.id === config.id)
      if (exists) return prev
      return [...prev, config]
    })
    return config
  }, [workflowConfigs, setWorkflowConfigs])

  const save = useCallback(async (config: Omit<WorkflowConfig, 'id' | 'createdAt'> & { id?: string }) => {
    const saved = await repositories.workflowConfig.save(config)
    setWorkflowConfigs(prev => {
      const idx = prev.findIndex(c => c.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
    return saved
  }, [setWorkflowConfigs])

  const remove = useCallback(async (id: string) => {
    await repositories.workflowConfig.remove(id)
    setWorkflowConfigs(prev => prev.filter(c => c.id !== id))
  }, [setWorkflowConfigs])

  const getDefaultWorkflowSteps = useCallback((): WorkflowStep[] => {
    return [
      { id: 'todo', name: '待开发', order: 0, color: '#d9d9d9', actions: [] },
      { id: 'dev', name: '开发中', order: 1, color: '#1677ff', actions: [] },
      { id: 'test', name: '测试中', order: 2, color: '#faad14', actions: [] },
      { id: 'done', name: '已上线', order: 3, color: '#52c41a', actions: [] }
    ]
  }, [])

  return {
    workflowConfigs,
    refresh,
    getByBizProjectId,
    save,
    remove,
    getDefaultWorkflowSteps
  }
}
