import { TicketRepository, TicketBranchRepository } from '../types'
import { Ticket, TicketBranchLink } from '../../types'

export class ElectronTicketRepository implements TicketRepository {
  async list(): Promise<Ticket[]> {
    return window.api.ticket.list()
  }

  async listByBizProjectId(bizProjectId: string): Promise<Ticket[]> {
    return window.api.ticket.listByBizProjectId(bizProjectId)
  }

  async create(ticket: Omit<Ticket, 'id' | 'createdAt'>): Promise<Ticket> {
    return window.api.ticket.create(ticket)
  }

  async update(id: string, updates: Partial<Omit<Ticket, 'id' | 'createdAt'>>): Promise<Ticket | null> {
    return window.api.ticket.update(id, updates)
  }

  async remove(id: string): Promise<void> {
    return window.api.ticket.remove(id)
  }
}

export class ElectronTicketBranchRepository implements TicketBranchRepository {
  async listBranches(ticketId: string): Promise<TicketBranchLink[]> {
    return window.api.ticket.listBranches(ticketId)
  }

  async linkBranch(ticketId: string, projectId: string, branchName: string): Promise<void> {
    return window.api.ticket.linkBranch(ticketId, projectId, branchName)
  }

  async unlinkBranch(ticketId: string, projectId: string, branchName: string): Promise<void> {
    return window.api.ticket.unlinkBranch(ticketId, projectId, branchName)
  }
}
