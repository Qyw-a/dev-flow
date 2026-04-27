import { useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { repositories } from '@dev-flow/shared'
import { BizProject } from '@dev-flow/shared'

export function useBizProjects() {
  const { bizProjects, setBizProjects } = useStore()

  const refresh = useCallback(async () => {
    const list = await repositories.bizProject.list()
    setBizProjects(list)
    return list
  }, [setBizProjects])

  const create = useCallback(async (bizProject: Omit<BizProject, 'id' | 'createdAt'>) => {
    const created = await repositories.bizProject.create(bizProject)
    setBizProjects([...bizProjects, created])
    return created
  }, [bizProjects, setBizProjects])

  const update = useCallback(async (id: string, updates: Partial<Omit<BizProject, 'id' | 'createdAt'>>) => {
    const updated = await repositories.bizProject.update(id, updates)
    if (updated) {
      setBizProjects(bizProjects.map(b => b.id === id ? updated : b))
    }
    return updated
  }, [bizProjects, setBizProjects])

  const remove = useCallback(async (id: string) => {
    await repositories.bizProject.remove(id)
    await repositories.workflowConfig.removeByBizProjectId(id)
    setBizProjects(bizProjects.filter(b => b.id !== id))
  }, [bizProjects, setBizProjects])

  return { bizProjects, refresh, create, update, remove }
}
