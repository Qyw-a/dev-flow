import { Project, BranchInfo, GitResult } from '../main/types'

export type { Project, BranchInfo, GitResult }

export interface LogEntry {
  id: string
  projectName: string
  action: string
  success: boolean
  message: string
  time: string
}
