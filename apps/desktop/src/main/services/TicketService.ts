import fs from 'fs'
import path from 'path'
import os from 'os'
import { Ticket, TicketBranchLink } from '@branch-manager/shared'

const CONFIG_DIR = path.join(os.homedir(), '.branch-manager')
const TICKETS_FILE = path.join(CONFIG_DIR, 'tickets.json')
const TICKET_BRANCHES_FILE = path.join(CONFIG_DIR, 'ticket-branches.json')

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function readTickets(): Ticket[] {
  ensureConfigDir()
  if (!fs.existsSync(TICKETS_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(TICKETS_FILE, 'utf-8')
    return JSON.parse(data) as Ticket[]
  } catch {
    return []
  }
}

function writeTickets(tickets: Ticket[]): void {
  ensureConfigDir()
  fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2))
}

function readTicketBranches(): TicketBranchLink[] {
  ensureConfigDir()
  if (!fs.existsSync(TICKET_BRANCHES_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(TICKET_BRANCHES_FILE, 'utf-8')
    return JSON.parse(data) as TicketBranchLink[]
  } catch {
    return []
  }
}

function writeTicketBranches(links: TicketBranchLink[]): void {
  ensureConfigDir()
  fs.writeFileSync(TICKET_BRANCHES_FILE, JSON.stringify(links, null, 2))
}

export class TicketService {
  static list(): Ticket[] {
    return readTickets()
  }

  static create(ticket: Omit<Ticket, 'id' | 'createdAt'>): Ticket {
    const tickets = readTickets()
    const newTicket: Ticket = {
      ...ticket,
      id: 'REQ-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString()
    }
    tickets.push(newTicket)
    writeTickets(tickets)
    return newTicket
  }

  static update(id: string, updates: Partial<Omit<Ticket, 'id' | 'createdAt'>>): Ticket | null {
    const tickets = readTickets()
    const idx = tickets.findIndex(t => t.id === id)
    if (idx === -1) return null
    tickets[idx] = { ...tickets[idx], ...updates }
    writeTickets(tickets)
    return tickets[idx]
  }

  static remove(id: string): void {
    const tickets = readTickets().filter(t => t.id !== id)
    writeTickets(tickets)
    // 同时清理关联关系
    const links = readTicketBranches().filter(l => l.ticketId !== id)
    writeTicketBranches(links)
  }

  static listBranches(ticketId: string): TicketBranchLink[] {
    return readTicketBranches().filter(l => l.ticketId === ticketId)
  }

  static linkBranch(ticketId: string, projectId: string, branchName: string): void {
    const links = readTicketBranches()
    // 避免重复关联
    const exists = links.some(l => l.ticketId === ticketId && l.projectId === projectId && l.branchName === branchName)
    if (exists) return
    links.push({ ticketId, projectId, branchName })
    writeTicketBranches(links)
  }

  static unlinkBranch(ticketId: string, projectId: string, branchName: string): void {
    const links = readTicketBranches().filter(
      l => !(l.ticketId === ticketId && l.projectId === projectId && l.branchName === branchName)
    )
    writeTicketBranches(links)
  }

  static getTicketByBranch(projectId: string, branchName: string): string | null {
    const link = readTicketBranches().find(l => l.projectId === projectId && l.branchName === branchName)
    return link?.ticketId || null
  }
}
