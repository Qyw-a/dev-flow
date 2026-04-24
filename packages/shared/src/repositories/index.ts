import {
  ProjectRepository,
  BizProjectRepository,
  TicketRepository,
  TicketBranchRepository,
  VersionRepository,
  GitRepository,
  WorkflowConfigRepository
} from './types'
import { ElectronProjectRepository } from './electron/ProjectRepository'
import { ElectronBizProjectRepository } from './electron/BizProjectRepository'
import { ElectronTicketRepository, ElectronTicketBranchRepository } from './electron/TicketRepository'
import { ElectronVersionRepository } from './electron/VersionRepository'
import { ElectronGitRepository } from './electron/GitRepository'
import { ElectronWorkflowConfigRepository } from './electron/WorkflowConfigRepository'

export * from './types'

class RepositoryFactory {
  private _project: ProjectRepository
  private _bizProject: BizProjectRepository
  private _ticket: TicketRepository
  private _ticketBranch: TicketBranchRepository
  private _version: VersionRepository
  private _git: GitRepository
  private _workflowConfig: WorkflowConfigRepository

  constructor() {
    this._project = new ElectronProjectRepository()
    this._bizProject = new ElectronBizProjectRepository()
    this._ticket = new ElectronTicketRepository()
    this._ticketBranch = new ElectronTicketBranchRepository()
    this._version = new ElectronVersionRepository()
    this._git = new ElectronGitRepository()
    this._workflowConfig = new ElectronWorkflowConfigRepository()
  }

  setProjectRepository(repo: ProjectRepository) {
    this._project = repo
  }

  setBizProjectRepository(repo: BizProjectRepository) {
    this._bizProject = repo
  }

  setTicketRepository(repo: TicketRepository) {
    this._ticket = repo
  }

  setTicketBranchRepository(repo: TicketBranchRepository) {
    this._ticketBranch = repo
  }

  setVersionRepository(repo: VersionRepository) {
    this._version = repo
  }

  setGitRepository(repo: GitRepository) {
    this._git = repo
  }

  setWorkflowConfigRepository(repo: WorkflowConfigRepository) {
    this._workflowConfig = repo
  }

  get project() { return this._project }
  get bizProject() { return this._bizProject }
  get ticket() { return this._ticket }
  get ticketBranch() { return this._ticketBranch }
  get version() { return this._version }
  get git() { return this._git }
  get workflowConfig() { return this._workflowConfig }
}

export const repositories = new RepositoryFactory()
