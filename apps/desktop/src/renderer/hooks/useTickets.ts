import { useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { Ticket } from '@branch-manager/shared'

export function useTickets() {
  const { tickets, setTickets, setTicketBranches } = useStore()

  const refresh = useCallback(async () => {
    const list = await window.api.ticket.list()
    setTickets(list)
    return list
  }, [setTickets])

  const create = useCallback(async (ticket: Omit<Ticket, 'id' | 'createdAt'>) => {
    const created = await window.api.ticket.create(ticket)
    setTickets([...tickets, created])
    return created
  }, [tickets, setTickets])

  const update = useCallback(async (id: string, updates: Partial<Omit<Ticket, 'id' | 'createdAt'>>) => {
    const updated = await window.api.ticket.update(id, updates)
    if (updated) {
      setTickets(tickets.map(t => t.id === id ? updated : t))
    }
    return updated
  }, [tickets, setTickets])

  const remove = useCallback(async (id: string) => {
    await window.api.ticket.remove(id)
    setTickets(tickets.filter(t => t.id !== id))
  }, [tickets, setTickets])

  const refreshBranches = useCallback(async (ticketId: string) => {
    const links = await window.api.ticket.listBranches(ticketId)
    setTicketBranches(ticketId, links)
    return links
  }, [setTicketBranches])

  const linkBranch = useCallback(async (ticketId: string, projectId: string, branchName: string) => {
    await window.api.ticket.linkBranch(ticketId, projectId, branchName)
    await refreshBranches(ticketId)
  }, [refreshBranches])

  const unlinkBranch = useCallback(async (ticketId: string, projectId: string, branchName: string) => {
    await window.api.ticket.unlinkBranch(ticketId, projectId, branchName)
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
