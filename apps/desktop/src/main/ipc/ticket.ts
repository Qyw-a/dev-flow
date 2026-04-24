import { ipcMain } from 'electron'
import { TicketService } from '../services/TicketService'
import { Ticket } from '@branch-manager/shared'

export function registerTicketIpc(): void {
  ipcMain.handle('ticket:list', () => {
    return TicketService.list()
  })

  ipcMain.handle('ticket:listByBizProjectId', (_, bizProjectId: string) => {
    return TicketService.listByBizProjectId(bizProjectId)
  })

  ipcMain.handle('ticket:create', async (_, ticket: Omit<Ticket, 'id' | 'createdAt'>) => {
    return TicketService.create(ticket)
  })

  ipcMain.handle('ticket:update', async (_, id: string, updates: Partial<Omit<Ticket, 'id' | 'createdAt'>>) => {
    return TicketService.update(id, updates)
  })

  ipcMain.handle('ticket:remove', async (_, id: string) => {
    TicketService.remove(id)
  })

  ipcMain.handle('ticket:listBranches', async (_, ticketId: string) => {
    return TicketService.listBranches(ticketId)
  })

  ipcMain.handle('ticket:linkBranch', async (_, ticketId: string, projectId: string, branchName: string) => {
    TicketService.linkBranch(ticketId, projectId, branchName)
  })

  ipcMain.handle('ticket:unlinkBranch', async (_, ticketId: string, projectId: string, branchName: string) => {
    TicketService.unlinkBranch(ticketId, projectId, branchName)
  })
}
