import { useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { repositories } from '@branch-manager/shared'
import { Ticket } from '@branch-manager/shared'

export function useTickets() {
  const { tickets, setTickets, setTicketBranches } = useStore()

  const refresh = useCallback(async () => {
    const list = await repositories.ticket.list()
    setTickets(list)
    return list
  }, [setTickets])

  const create = useCallback(async (ticket: Omit<Ticket, 'id' | 'createdAt'>) => {
    const created = await repositories.ticket.create(ticket)
    setTickets([...tickets, created])
    return created
  }, [tickets, setTickets])

  const update = useCallback(async (id: string, updates: Partial<Omit<Ticket, 'id' | 'createdAt'>>) => {
    const updated = await repositories.ticket.update(id, updates)
    if (updated) {
      setTickets(tickets.map(t => t.id === id ? updated : t))
    }
    return updated
  }, [tickets, setTickets])

  const remove = useCallback(async (id: string) => {
    await repositories.ticket.remove(id)
    setTickets(tickets.filter(t => t.id !== id))
  }, [tickets, setTickets])

  const refreshBranches = useCallback(async (ticketId: string) => {
    const links = await repositories.ticketBranch.listBranches(ticketId)
    setTicketBranches(ticketId, links)
    return links
  }, [setTicketBranches])

  const linkBranch = useCallback(async (ticketId: string, projectId: string, branchName: string) => {
    await repositories.ticketBranch.linkBranch(ticketId, projectId, branchName)
    await refreshBranches(ticketId)
  }, [refreshBranches])

  const unlinkBranch = useCallback(async (ticketId: string, projectId: string, branchName: string) => {
    await repositories.ticketBranch.unlinkBranch(ticketId, projectId, branchName)
    await refreshBranches(ticketId)
  }, [refreshBranches])

  return {
    tickets,
    refresh,
    create,
    update,
    remove,
    refreshBranches,
    linkBranch,
    unlinkBranch
  }
}
