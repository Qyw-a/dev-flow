import React, { useEffect, useState } from 'react'
import { Layout, message } from 'antd'
import AppHeader from './components/AppHeader'
import BranchManagerView from './components/BranchManagerView'
import TicketList from './components/TicketList'
import TicketDetail from './components/TicketDetail'
import TicketCreateModal from './components/TicketCreateModal'
import { useProjects } from './hooks/useProjects'
import { useTickets } from './hooks/useTickets'
import { useStore } from './stores/useStore'
import { Ticket } from '@branch-manager/shared'

const { Sider, Content } = Layout

const TicketView: React.FC = () => {
  const { tickets, selectedTicketId, selectTicket } = useStore()
  const { create, update } = useTickets()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null

  const handleCreate = () => {
    setEditingTicket(null)
    setModalOpen(true)
  }

  const handleEdit = () => {
    if (selectedTicket) {
      setEditingTicket(selectedTicket)
      setModalOpen(true)
    }
  }

  const handleConfirm = async (values: Omit<Ticket, 'id' | 'createdAt'>) => {
    if (editingTicket) {
      const updated = await update(editingTicket.id, values)
      if (updated) message.success('需求更新成功')
    } else {
      const created = await create(values)
      if (created) {
        selectTicket(created.id)
        message.success('需求创建成功')
      }
    }
    setModalOpen(false)
  }

  return (
    <Layout style={{ height: '100%' }}>
      <Sider width={320} theme="light" style={{ borderRight: '1px solid #f0f0f0', padding: 16 }}>
        <TicketList onCreate={handleCreate} />
      </Sider>
      <Content style={{ padding: 16, overflow: 'auto' }}>
        {selectedTicket ? (
          <TicketDetail ticket={selectedTicket} onEdit={handleEdit} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
            请在左侧选择一个需求
          </div>
        )}
      </Content>
      <TicketCreateModal
        open={modalOpen}
        ticket={editingTicket}
        onCancel={() => setModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </Layout>
  )
}

const WorkflowView: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
    工作流配置模块开发中...
  </div>
)

const App: React.FC = () => {
  const { refresh } = useProjects()
  const { mainView } = useStore()

  useEffect(() => {
    refresh().catch((err) => {
      message.error('加载项目失败: ' + err.message)
    })
  }, [refresh])

  return (
    <Layout style={{ height: '100vh' }}>
      <AppHeader />
      <Content style={{ overflow: 'hidden' }}>
        {mainView === 'branch' && <BranchManagerView />}
        {mainView === 'ticket' && <TicketView />}
        {mainView === 'workflow' && <WorkflowView />}
      </Content>
    </Layout>
  )
}

export default App
