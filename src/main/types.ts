export interface Project {
  id: string
  name: string
  path: string
  isGitRepo: boolean
}

export interface BranchInfo {
  name: string
  current: boolean
  commit: string
  label: string
  date: string
}

export interface GitResult {
  success: boolean
  message: string
  projectId: string
}

export interface BatchOp {
  projectId: string
  type: 'create' | 'merge' | 'push' | 'delete' | 'checkout'
  branchName: string
  base?: string
  force?: boolean
  ff?: boolean
}
