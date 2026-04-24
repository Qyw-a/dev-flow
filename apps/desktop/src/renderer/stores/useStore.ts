import { create } from 'zustand'
import { Project, BranchInfo, LogEntry } from '../types'
import { Ticket, TicketBranchLink, Version, BizProject, WorkflowConfig } from '@branch-manager/shared'

type ViewMode = 'project' | 'branch'
type MainView = 'ticket' | 'branch' | 'workflow'

interface AppState {
  projects: Project[]
  selectedProjectIds: string[]
  branchesMap: Record<string, BranchInfo[]>
  remoteBranchesMap: Record<string, BranchInfo[]>
  selectedBranches: Record<string, string[]> // projectId -> branchNames[]
  selectedPublicBranches: string[]
  viewMode: ViewMode
  mainView: MainView
  bizProjects: BizProject[]
  selectedBizProjectId: string | null
  tickets: Ticket[]
  selectedTicketId: string | null
  ticketBranchesMap: Record<string, TicketBranchLink[]>
  versions: Version[]
  selectedVersionId: string | null
  workflowConfigs: WorkflowConfig[]
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
  setMainView: (mode: MainView) => void
  setBizProjects: (bizProjects: BizProject[]) => void
  selectBizProject: (id: string | null) => void
  setTickets: (tickets: Ticket[]) => void
  selectTicket: (id: string | null) => void
  setTicketBranches: (ticketId: string, links: TicketBranchLink[]) => void
  setVersions: (versions: Version[]) => void
  selectVersion: (id: string | null) => void
  setWorkflowConfigs: (configs: WorkflowConfig[] | ((prev: WorkflowConfig[]) => WorkflowConfig[])) => void
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
  mainView: 'branch',
  bizProjects: [],
  selectedBizProjectId: null,
  tickets: [],
  selectedTicketId: null,
  ticketBranchesMap: {},
  versions: [],
  selectedVersionId: null,
  workflowConfigs: [],
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
  setMainView: (mode) => set({ mainView: mode }),
  setBizProjects: (bizProjects) => set({ bizProjects }),
  selectBizProject: (id) => set({ selectedBizProjectId: id, selectedVersionId: null, selectedTicketId: null }),
  setTickets: (tickets) => set({ tickets }),
  selectTicket: (id) => set({ selectedTicketId: id }),
  setTicketBranches: (ticketId, links) => set((state) => ({
    ticketBranchesMap: { ...state.ticketBranchesMap, [ticketId]: links }
  })),
  setVersions: (versions) => set({ versions }),
  selectVersion: (id) => set({ selectedVersionId: id }),
  setWorkflowConfigs: (configs) => set((state) => ({
    workflowConfigs: typeof configs === 'function' ? configs(state.workflowConfigs) : configs
  })),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
  clearLogs: () => set({ logs: [] }),
  setLoadingBranches: (loading) => set({ loadingBranches: loading })
}))
