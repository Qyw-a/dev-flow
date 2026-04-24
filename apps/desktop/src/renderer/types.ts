import { Project } from '@branch-manager/shared'
import { BranchInfo, GitResult } from '@branch-manager/git-core'

export type { Project, BranchInfo, GitResult }

export interface LogEntry {
  id: string
  projectName: string
  action: string
  success: boolean
  message: string
  time: string
}
