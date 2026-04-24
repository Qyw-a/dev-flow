import React, { useEffect, useMemo, useState } from 'react'
import {
  Card, Tag, Space, Button, Table, Empty, Select, message, Popconfirm, Tooltip
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  PlusOutlined,
  SwapOutlined,
  MergeCellsOutlined,
  CloudUploadOutlined,
  DeleteOutlined as DeleteIcon
} from '@ant-design/icons'
import { useStore } from '../stores/useStore'
import { useProjects } from '../hooks/useProjects'
import { useTickets } from '../hooks/useTickets'
import { useGitOps } from '../hooks/useGitOps'
import { Ticket, TicketStatus } from '@branch-manager/shared'

const statusColors: Record<TicketStatus, string> = {
  todo: 'default',
  dev: 'processing',
  test: 'warning',
  done: 'success'
}

const statusLabels: Record<TicketStatus, string> = {
  todo: '待开发',
  dev: '开发中',
  test: '测试中',
  done: '已上线'
}

interface TicketDetailProps {
  ticket: Ticket
  onEdit: () => void
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, onEdit }) => {
  const { projects } = useProjects()
  const { remove, refreshBranches, linkBranch, unlinkBranch } = useTickets()
  const { branchesMap, ticketBranchesMap } = useStore()
  const { createBranch, checkoutBranch, mergeBranch, pushBranch } = useGitOps()

  const [linkProjectId, setLinkProjectId] = useState('')
  const [linkBranchName, setLinkBranchName] = useState('')

  const [createProjectId, setCreateProjectId] = useState('')
  const [createBaseBranch, setCreateBaseBranch] = useState('')
  const [newBranchName, setNewBranchName] = useState('')

  const links = ticketBranchesMap[ticket.id] || []

  useEffect(() => {
    refreshBranches(ticket.id)
  }, [ticket.id, refreshBranches])

  const availableProjects = useMemo(() => {
    return projects.filter(p => p.isGitRepo && !links.some(l => l.projectId === p.id))
  }, [projects, links])

  const availableBranches = useMemo(() => {
    if (!linkProjectId) return []
    return (branchesMap[linkProjectId] || []).map(b => b.name)
  }, [linkProjectId, branchesMap])

  const createAvailableProjects = useMemo(() => {
    return projects.filter(p => p.isGitRepo && !links.some(l => l.projectId === p.id))
  }, [projects, links])

  const createAvailableBranches = useMemo(() => {
    if (!createProjectId) return []
    return (branchesMap[createProjectId] || []).map(b => b.name)
  }, [createProjectId, branchesMap])

  const handleLink = async () => {
    if (!linkProjectId || !linkBranchName) {
      message.warning('请选择项目和分支')
      return
    }
    await linkBranch(ticket.id, linkProjectId, linkBranchName)
    setLinkProjectId('')
    setLinkBranchName('')
    message.success('关联成功')
  }

  const handleCreateAndLink = async () => {
    const name = newBranchName.trim()
    if (!createProjectId || !name) {
      message.warning('请选择项目并输入分支名称')
      return
    }
    const result = await createBranch(createProjectId, name, createBaseBranch || undefined)
    if (result.success) {
      await linkBranch(ticket.id, createProjectId, name)
      setCreateProjectId('')
      setCreateBaseBranch('')
      setNewBranchName('')
      message.success('分支创建并关联成功')
    }
  }

  const handleCheckout = async (projectId: string, branchName: string) => {
    const hide = message.loading('正在切换分支...', 0)
    try {
      await checkoutBranch(projectId, branchName)
    } finally {
      hide()
    }
  }

  const handleMerge = async (projectId: string, branchName: string) => {
    const hide = message.loading('正在合并分支...', 0)
    try {
      await mergeBranch(projectId, branchName)
    } finally {
      hide()
    }
  }

  const handlePush = async (projectId: string, branchName: string) => {
    const hide = message.loading('正在推送分支...', 0)
    try {
      await pushBranch(projectId, branchName)
    } finally {
      hide()
    }
  }

  const columns = [
    { title: '项目', dataIndex: 'projectName' },
    { title: '分支', dataIndex: 'branchName' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="切换">
            <Button size="small" icon={<SwapOutlined />} onClick={() => handleCheckout(record.projectId, record.branchName)} />
          </Tooltip>
          <Tooltip title="合并">
            <Button size="small" icon={<MergeCellsOutlined />} onClick={() => handleMerge(record.projectId, record.branchName)} />
          </Tooltip>
          <Tooltip title="推送">
            <Button size="small" icon={<CloudUploadOutlined />} onClick={() => handlePush(record.projectId, record.branchName)} />
          </Tooltip>
          <Tooltip title="解绑">
            <Button size="small" danger icon={<DeleteIcon />} onClick={() => unlinkBranch(ticket.id, record.projectId, record.branchName)} />
          </Tooltip>
        </Space>
      )
    }
  ]

  const dataSource = links.map(l => {
    const project = projects.find(p => p.id === l.projectId)
    return {
      key: `${l.projectId}-${l.branchName}`,
      projectId: l.projectId,
      projectName: project?.name || l.projectId,
      branchName: l.branchName
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'auto' }}>
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{ticket.title}</span>
              <Tag color={statusColors[ticket.status]}>{statusLabels[ticket.status]}</Tag>
              <Tag color={ticket.priority === 'high' ? 'red' : ticket.priority === 'medium' ? 'blue' : 'default'}>
                {ticket.priority === 'high' ? '高优先级' : ticket.priority === 'medium' ? '中优先级' : '低优先级'}
              </Tag>
            </Space>
            <Space>
              <Button size="small" icon={<EditOutlined />} onClick={onEdit}>编辑</Button>
              <Popconfirm
                title="确认删除需求？"
                description={`删除需求 ${ticket.id}`}
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={() => remove(ticket.id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </Space>
          </div>
        }
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div style={{ color: '#888', fontSize: 13 }}>ID: {ticket.id}</div>
          <div style={{ color: '#888', fontSize: 13 }}>创建时间: {new Date(ticket.createdAt).toLocaleString()}</div>
          <div>{ticket.description || '暂无描述'}</div>
        </Space>
      </Card>

      <Card
        size="small"
        title={<span style={{ fontWeight: 600 }}>📌 关联分支</span>}
      >
        {dataSource.length === 0 ? (
          <Empty description="暂无关联分支" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table size="small" columns={columns} dataSource={dataSource} pagination={false} />
        )}

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Select
            placeholder="选择项目"
            value={linkProjectId || undefined}
            onChange={(v) => { setLinkProjectId(v); setLinkBranchName('') }}
            style={{ width: 180 }}
            options={availableProjects.map(p => ({ label: p.name, value: p.id }))}
          />
          <Select
            placeholder="选择分支"
            value={linkBranchName || undefined}
            onChange={(v) => setLinkBranchName(v)}
            style={{ width: 180 }}
            options={availableBranches.map(n => ({ label: n, value: n }))}
            disabled={!linkProjectId}
          />
          <Button type="primary" icon={<LinkOutlined />} onClick={handleLink} disabled={!linkProjectId || !linkBranchName}>
            关联
          </Button>
        </div>

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed #f0f0f0' }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>创建并关联新分支</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Select
              placeholder="选择项目"
              value={createProjectId || undefined}
              onChange={(v) => { setCreateProjectId(v); setCreateBaseBranch(''); setNewBranchName('') }}
              style={{ width: 160 }}
              options={createAvailableProjects.map(p => ({ label: p.name, value: p.id }))}
            />
            <Select
              placeholder="基于分支（可选）"
              value={createBaseBranch || undefined}
              onChange={(v) => setCreateBaseBranch(v)}
              style={{ width: 160 }}
              options={createAvailableBranches.map(n => ({ label: n, value: n }))}
              disabled={!createProjectId}
              allowClear
            />
            <input
              placeholder="新分支名称"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              style={{ width: 160, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 4 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateAndLink} disabled={!createProjectId || !newBranchName.trim()}>
              创建并关联
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default TicketDetail
