export interface Project {
  id: string
  name: string
  path: string
  isGitRepo: boolean
}

export interface BizProject {
  id: string
  name: string
  description: string
  gitProjectIds: string[]
  createdAt: string
}

export type TicketStatus = 'todo' | 'dev' | 'test' | 'done'
export type TicketPriority = 'low' | 'medium' | 'high'
export type VersionStatus = 'planning' | 'developing' | 'testing' | 'released'

export interface Version {
  id: string
  bizProjectId: string
  name: string
  description: string
  status: VersionStatus
  plannedDate?: string
  createdAt: string
}

export interface Ticket {
  id: string
  bizProjectId: string
  title: string
  description: string
  status: string
  priority: TicketPriority
  versionId?: string
  createdAt: string
}

export interface TicketBranchLink {
  ticketId: string
  projectId: string
  branchName: string
}

// --- Workflow Configuration ---

export interface WorkflowStep {
  id: string
  name: string
  order: number
  color: string
  actions: WorkflowStepAction[]
}

export type WorkflowStepAction =
  | { type: 'createBranch'; template: string; baseBranch?: string }
  | { type: 'mergeToBranch'; targetBranch: string; push?: boolean }
  | { type: 'triggerDeploy'; deployType: 'webhook' | 'script'; config: Record<string, string> }

export interface WorkflowConfig {
  id: string
  bizProjectId: string
  steps: WorkflowStep[]
  createdAt: string
}
