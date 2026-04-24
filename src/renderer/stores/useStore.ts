import { create } from 'zustand'
import { Project, BranchInfo, LogEntry } from '../types'

type ViewMode = 'project' | 'branch'

interface AppState {
  projects: Project[]
  selectedProjectIds: string[]
  branchesMap: Record<string, BranchInfo[]>
  remoteBranchesMap: Record<string, BranchInfo[]>
  selectedBranches: Record<string, string[]> // projectId -> branchNames[]
  selectedPublicBranches: string[]
  viewMode: ViewMode
  logs: LogEntry[]
  loadingBranches: boolean
  setProjects: (projects: Project[]) => void
  toggleProjectSelection: (id: string) => void
  selectAllProjects: (ids: string[]) => void
  clearProjectSelection: () => void
  setBranches: (projectId: string, branches: BranchInfo[]) => void
  setRemoteBranches: (projectId: string, branches: BranchInfo[]) => void
  setProjectSelectedBranches: (projectId: string, branchNames: string[]) => void
  clearAllBranchSelection: () => void
  togglePublicBranchSelection: (branchName: string) => void
  clearPublicBranchSelection: () => void
  setViewMode: (mode: ViewMode) => void
  addLog: (log: LogEntry) => void
  clearLogs: () => void
  setLoadingBranches: (loading: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  projects: [],
  selectedProjectIds: [],
  branchesMap: {},
  remoteBranchesMap: {},
  selectedBranches: {},
  selectedPublicBranches: [],
  viewMode: 'project',
  logs: [],
  loadingBranches: false,
  setProjects: (projects) => set({ projects }),
  toggleProjectSelection: (id) => set((state) => ({
    selectedProjectIds: state.selectedProjectIds.includes(id)
      ? state.selectedProjectIds.filter((pid) => pid !== id)
      : [...state.selectedProjectIds, id]
  })),
  selectAllProjects: (ids) => set({ selectedProjectIds: ids }),
  clearProjectSelection: () => set({ selectedProjectIds: [] }),
  setBranches: (projectId, branches) => set((state) => ({
    branchesMap: { ...state.branchesMap, [projectId]: branches }
  })),
  setRemoteBranches: (projectId, branches) => set((state) => ({
    remoteBranchesMap: { ...state.remoteBranchesMap, [projectId]: branches }
  })),
  setProjectSelectedBranches: (projectId, branchNames) => set((state) => ({
    selectedBranches: { ...state.selectedBranches, [projectId]: branchNames }
  })),
  clearAllBranchSelection: () => set({ selectedBranches: {} }),
  togglePublicBranchSelection: (branchName) => set((state) => ({
    selectedPublicBranches: state.selectedPublicBranches.includes(branchName)
      ? state.selectedPublicBranches.filter((n) => n !== branchName)
      : [...state.selectedPublicBranches, branchName]
  })),
  clearPublicBranchSelection: () => set({ selectedPublicBranches: [] }),
  setViewMode: (mode) => set({ viewMode: mode }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
  clearLogs: () => set({ logs: [] }),
  setLoadingBranches: (loading) => set({ loadingBranches: loading })
}))
