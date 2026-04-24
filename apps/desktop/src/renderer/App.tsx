import React, { useEffect, useState } from 'react'
import { Layout, message, Modal, Input } from 'antd'
import AppHeader from './components/AppHeader'
import BranchManagerView from './components/BranchManagerView'
import WorkflowView from './components/WorkflowView'
import TicketList from './components/TicketList'
import TicketDetail from './components/TicketDetail'
import TicketCreateModal from './components/TicketCreateModal'
import VersionCreateModal from './components/VersionCreateModal'
import { useProjects } from './hooks/useProjects'
import { useTickets } from './hooks/useTickets'
import { useVersions } from './hooks/useVersions'
import { useBizProjects } from './hooks/useBizProjects'
import { useStore } from './stores/useStore'
import { useWorkflowConfigs } from './hooks/useWorkflowConfigs'
import { useWorkflowActions } from './hooks/useWorkflowActions'
import { Ticket } from '@branch-manager/shared'

const { Sider, Content } = Layout

const TicketView: React.FC = () => {
  const { tickets, selectedTicketId, selectTicket, selectedBizProjectId, versions, bizProjects, selectBizProject } = useStore()
  const { create, update } = useTickets()
  const { create: createVersion } = useVersions()
  const { create: createBizProject, remove: removeBizProject } = useBizProjects()
  const { getByBizProjectId } = useWorkflowConfigs()
  const { createBranchForTicket } = useWorkflowActions()
  const [modalOpen, setModalOpen] = useState(false)
  const [versionModalOpen, setVersionModalOpen] = useState(false)
  const [bizProjectModalOpen, setBizProjectModalOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [createTicketVersionId, setCreateTicketVersionId] = useState<string | undefined>(undefined)
  const [newBizProjectName, setNewBizProjectName] = useState('')
  const [newBizProjectDesc, setNewBizProjectDesc] = useState('')

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null

  const handleCreateForProject = (bizProjectId: string) => {
    selectBizProject(bizProjectId)
    setEditingTicket(null)
    setCreateTicketVersionId(undefined)
    setModalOpen(true)
  }

  const handleCreateVersionForProject = (bizProjectId: string) => {
    selectBizProject(bizProjectId)
    setVersionModalOpen(true)
  }

  const handleCreateTicketForVersion = (bizProjectId: string, versionId: string) => {
    selectBizProject(bizProjectId)
    setEditingTicket(null)
    setCreateTicketVersionId(versionId)
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

        // 自动创建分支：如果工作流第一步配置了 createBranch 动作
        try {
          const wfConfig = await getByBizProjectId(created.bizProjectId)
          const firstStep = [...wfConfig.steps].sort((a, b) => a.order - b.order)[0]
          const createAction = firstStep?.actions.find(a => a.type === 'createBranch')
          if (createAction && createAction.type === 'createBranch') {
            const bizProject = bizProjects.find(b => b.id === created.bizProjectId)
            const gitProjectIds = bizProject?.gitProjectIds || []
            if (gitProjectIds.length > 0) {
              const hide = message.loading('正在自动创建分支...', 0)
              let createdCount = 0
              for (const projectId of gitProjectIds) {
                const result = await createBranchForTicket(created, createAction.template, createAction.baseBranch, projectId)
                if (result.success) {
                  createdCount++
                }
              }
              hide()
              if (createdCount > 0) {
                message.success(`已自动在 ${createdCount} 个项目中创建分支`)
              }
            }
          }
        } catch {
          // 自动创建分支失败不影响需求创建
        }
      }
    }
    setModalOpen(false)
  }

  const handleVersionConfirm = async (values: Omit<import('@branch-manager/shared').Version, 'id' | 'createdAt'>) => {
    try {
      await createVersion(values)
      message.success('版本创建成功')
    } catch (err: any) {
      message.error('创建失败: ' + (err.message || String(err)))
    } finally {
      setVersionModalOpen(false)
    }
  }

  const handleBizProjectConfirm = async () => {
    const name = newBizProjectName.trim()
    if (!name) {
      message.warning('请输入业务项目名称')
      return
    }
    try {
      await createBizProject({ name, description: newBizProjectDesc.trim(), gitProjectIds: [] })
      message.success('业务项目创建成功')
      setBizProjectModalOpen(false)
      setNewBizProjectName('')
      setNewBizProjectDesc('')
    } catch (err: any) {
      message.error('创建失败: ' + (err.message || String(err)))
    }
  }

  return (
    <Layout style={{ height: '100%' }}>
      <Sider width={320} theme="light" style={{ borderRight: '1px solid #f0f0f0', padding: 16 }}>
        <TicketList
          onCreateBizProject={() => setBizProjectModalOpen(true)}
          onRemoveBizProject={(id: string) => {
            if (selectedBizProjectId === id) {
              selectBizProject(null)
            }
            removeBizProject(id)
          }}
          onCreateTicketForProject={handleCreateForProject}
          onCreateVersionForProject={handleCreateVersionForProject}
          onCreateTicketForVersion={handleCreateTicketForVersion}
        />
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
        bizProjectId={selectedBizProjectId || ''}
        defaultVersionId={createTicketVersionId}
        bizProjects={bizProjects}
        versions={versions}
        onCancel={() => { setModalOpen(false); setCreateTicketVersionId(undefined) }}
        onConfirm={handleConfirm}
      />
      <VersionCreateModal
        open={versionModalOpen}
        version={null}
        bizProjectId={selectedBizProjectId || ''}
        onCancel={() => setVersionModalOpen(false)}
        onConfirm={handleVersionConfirm}
      />
      <Modal
        title="新建业务项目"
        open={bizProjectModalOpen}
        onOk={handleBizProjectConfirm}
        onCancel={() => { setBizProjectModalOpen(false); setNewBizProjectName(''); setNewBizProjectDesc('') }}
        okText="创建"
        cancelText="取消"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>名称：</label>
            <Input
              placeholder="如：电商系统、CRM"
              value={newBizProjectName}
              onChange={(e) => setNewBizProjectName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>描述：</label>
            <Input.TextArea
              placeholder="业务项目描述"
              value={newBizProjectDesc}
              onChange={(e) => setNewBizProjectDesc(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

const App: React.FC = () => {
  const { refresh } = useProjects()
  const { refresh: refreshBizProjects } = useBizProjects()
  const { mainView } = useStore()

  useEffect(() => {
    refresh().catch((err) => {
      message.error('加载项目失败: ' + err.message)
    })
    refreshBizProjects().catch((err) => {
      message.error('加载业务项目失败: ' + err.message)
    })
  }, [refresh, refreshBizProjects])

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
