import { useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { repositories } from '@branch-manager/shared'

export function useProjects() {
  const { projects, setProjects } = useStore()

  const refresh = useCallback(async () => {
    const list = await repositories.project.list()
    setProjects(list)
    return list
  }, [setProjects])

  const add = useCallback(async (path?: string) => {
    const project = await repositories.project.add(path)
    if (project) {
      setProjects([...projects, project])
    }
    return project
  }, [projects, setProjects])

  const remove = useCallback(async (id: string) => {
    await repositories.project.remove(id)
    setProjects(projects.filter(p => p.id !== id))
  }, [projects, setProjects])

  return { projects, refresh, add, remove }
}
