import React, { useEffect, useMemo, useState } from 'react'
import {
  Card, Tag, Space, Button, Table, Empty, Select, message, Popconfirm, Tooltip
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
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
  const { checkoutBranch, mergeBranch, pushBranch } = useGitOps()

  const [linkProjectId, setLinkProjectId] = useState('')
  const [linkBranchName, setLinkBranchName] = useState('')

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
      </Card>
    </div>
  )
}

export default TicketDetail
