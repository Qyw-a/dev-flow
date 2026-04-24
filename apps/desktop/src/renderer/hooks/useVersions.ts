import { useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { repositories } from '@branch-manager/shared'
import { Version } from '@branch-manager/shared'

export function useVersions() {
  const { versions, setVersions } = useStore()

  const refresh = useCallback(async () => {
    const list = await repositories.version.list()
    setVersions(list)
    return list
  }, [setVersions])

  const refreshByBizProjectId = useCallback(async (bizProjectId: string) => {
    const list = await repositories.version.listByBizProjectId(bizProjectId)
    setVersions(list)
    return list
  }, [setVersions])

  const create = useCallback(async (version: Omit<Version, 'id' | 'createdAt'>) => {
    const created = await repositories.version.create(version)
    setVersions([...versions, created])
    return created
  }, [versions, setVersions])

  const update = useCallback(async (id: string, updates: Partial<Omit<Version, 'id' | 'createdAt'>>) => {
    const updated = await repositories.version.update(id, updates)
    if (updated) {
      setVersions(versions.map(v => v.id === id ? updated : v))
    }
    return updated
  }, [versions, setVersions])

  const remove = useCallback(async (id: string) => {
    await repositories.version.remove(id)
    setVersions(versions.filter(v => v.id !== id))
  }, [versions, setVersions])

  return { versions, refresh, refreshByBizProjectId, create, update, remove }
}
