export interface Project {
  id: string
  name: string
  path: string
  isGitRepo: boolean
}

export type TicketStatus = 'todo' | 'dev' | 'test' | 'done'
export type TicketPriority = 'low' | 'medium' | 'high'

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
}

export interface TicketBranchLink {
  ticketId: string
  projectId: string
  branchName: string
}
