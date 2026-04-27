import { Project } from '@dev-flow/shared'
import { BranchInfo, GitResult } from '@dev-flow/git-core'

export type { Project, BranchInfo, GitResult }

export interface LogEntry {
  id: string
  projectName: string
  action: string
  success: boolean
  message: string
  time: string
}
