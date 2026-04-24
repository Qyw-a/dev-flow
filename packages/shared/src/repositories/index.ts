import {
  ProjectRepository,
  TicketRepository,
  TicketBranchRepository,
  VersionRepository,
  GitRepository
} from './types'
import { ElectronProjectRepository } from './electron/ProjectRepository'
import { ElectronTicketRepository, ElectronTicketBranchRepository } from './electron/TicketRepository'
import { ElectronVersionRepository } from './electron/VersionRepository'
import { ElectronGitRepository } from './electron/GitRepository'

export * from './types'

class RepositoryFactory {
  private _project: ProjectRepository
  private _ticket: TicketRepository
  private _ticketBranch: TicketBranchRepository
  private _version: VersionRepository
  private _git: GitRepository

  constructor() {
    this._project = new ElectronProjectRepository()
    this._ticket = new ElectronTicketRepository()
    this._ticketBranch = new ElectronTicketBranchRepository()
    this._version = new ElectronVersionRepository()
    this._git = new ElectronGitRepository()
  }

  setProjectRepository(repo: ProjectRepository) {
    this._project = repo
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

  get project() { return this._project }
  get ticket() { return this._ticket }
  get ticketBranch() { return this._ticketBranch }
  get version() { return this._version }
  get git() { return this._git }
}

export const repositories = new RepositoryFactory()
