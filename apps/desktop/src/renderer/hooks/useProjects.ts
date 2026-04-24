import { useCallback } from 'react'
import { useStore } from '../stores/useStore'

export function useProjects() {
  const { projects, setProjects } = useStore()

  const refresh = useCallback(async () => {
    const list = await window.api.project.list()
    setProjects(list)
    return list
  }, [setProjects])

  const add = useCallback(async (path?: string) => {
    const project = await window.api.project.add(path)
    if (project) {
      setProjects([...projects, project])
    }
    return project
  }, [projects, setProjects])

  const remove = useCallback(async (id: string) => {
    await window.api.project.remove(id)
    setProjects(projects.filter(p => p.id !== id))
  }, [projects, setProjects])

  return { projects, refresh, add, remove }
}
