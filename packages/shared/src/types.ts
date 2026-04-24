export interface Project {
  id: string
  name: string
  path: string
  isGitRepo: boolean
}

export type TicketStatus = 'todo' | 'dev' | 'test' | 'done'
export type TicketPriority = 'low' | 'medium' | 'high'
export type VersionStatus = 'planning' | 'developing' | 'testing' | 'released'

export interface Version {
  id: string
  name: string
  description: string
  status: VersionStatus
  plannedDate?: string
  createdAt: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  versionId?: string
  createdAt: string
}

export interface TicketBranchLink {
  ticketId: string
  projectId: string
  branchName: string
}
