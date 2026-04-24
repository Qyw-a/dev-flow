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
  DeleteOutlined as DeleteIcon,
  StepForwardOutlined
} from '@ant-design/icons'
import { useStore } from '../stores/useStore'
import { useProjects } from '../hooks/useProjects'
import { useTickets } from '../hooks/useTickets'
import { useGitOps } from '../hooks/useGitOps'
import { useWorkflowConfigs } from '../hooks/useWorkflowConfigs'
import { useWorkflowActions } from '../hooks/useWorkflowActions'
import { Ticket, WorkflowConfig } from '@branch-manager/shared'

interface TicketDetailProps {
  ticket: Ticket
  onEdit: () => void
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, onEdit }) => {
  const { projects } = useProjects()
  const { remove, refreshBranches, linkBranch, unlinkBranch, update } = useTickets()
  const { branchesMap, ticketBranchesMap, versions, bizProjects } = useStore()
  const { createBranch, checkoutBranch, mergeBranch, pushBranch } = useGitOps()
  const { getByBizProjectId } = useWorkflowConfigs()
  const { executeStepActions } = useWorkflowActions()

  const [linkProjectId, setLinkProjectId] = useState('')
  const [linkBranchName, setLinkBranchName] = useState('')

  const [createProjectId, setCreateProjectId] = useState('')
  const [createBaseBranch, setCreateBaseBranch] = useState('')
  const [newBranchName, setNewBranchName] = useState('')

  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  const links = ticketBranchesMap[ticket.id] || []
  const version = versions.find(v => v.id === ticket.versionId)
  const bizProject = bizProjects.find(b => b.id === ticket.bizProjectId)

  useEffect(() => {
    refreshBranches(ticket.id)
  }, [ticket.id, refreshBranches])

  // 加载工作流配置
  useEffect(() => {
    if (!ticket.bizProjectId) {
      setWorkflowConfig(null)
      return
    }
    getByBizProjectId(ticket.bizProjectId)
      .then(c => setWorkflowConfig(c))
  }, [ticket.bizProjectId, getByBizProjectId])

  const currentStep = useMemo(() => {
    if (!workflowConfig) return null
    return workflowConfig.steps.find(s => s.id === ticket.status) || null
  }, [workflowConfig, ticket.status])

  const nextSteps = useMemo(() => {
    if (!workflowConfig || !currentStep) return []
    const sorted = [...workflowConfig.steps].sort((a, b) => a.order - b.order)
    const currentIdx = sorted.findIndex(s => s.id === currentStep.id)
    return sorted.slice(currentIdx + 1)
  }, [workflowConfig, currentStep])

  const statusDisplay = useMemo(() => {
    if (!workflowConfig) {
      const defaults: Record<string, { name: string; color: string }> = {
        todo: { name: '待开发', color: '#d9d9d9' },
        dev: { name: '开发中', color: '#1677ff' },
        test: { name: '测试中', color: '#faad14' },
        done: { name: '已上线', color: '#52c41a' }
      }
      return defaults[ticket.status] || { name: ticket.status, color: '#d9d9d9' }
    }
    const step = workflowConfig.steps.find(s => s.id === ticket.status)
    return step ? { name: step.name, color: step.color } : { name: ticket.status, color: '#d9d9d9' }
  }, [workflowConfig, ticket.status])

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

  const handleTransition = async (targetStepId: string) => {
    if (!workflowConfig || !bizProject) return
    const targetStep = workflowConfig.steps.find(s => s.id === targetStepId)
    if (!targetStep) return

    setTransitioning(true)
    const hide = message.loading(`正在流转到「${targetStep.name}」...`, 0)

    try {
      // 执行目标步骤的 actions
      const actionResult = await executeStepActions(ticket, targetStep, bizProject)
      if (!actionResult.success) {
        message.error(`流转失败: ${actionResult.message}`)
        return
      }

      // 更新需求状态
      const updated = await update(ticket.id, { status: targetStepId })
      if (updated) {
        message.success(`已流转到「${targetStep.name}」`)
      } else {
        message.error('状态更新失败')
      }
    } catch (err: any) {
      message.error('流转异常: ' + (err.message || String(err)))
    } finally {
      hide()
      setTransitioning(false)
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
              <Tag color={statusDisplay.color}>{statusDisplay.name}</Tag>
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
          {bizProject && <div style={{ color: '#888', fontSize: 13 }}>业务项目: <Tag color="cyan">{bizProject.name}</Tag></div>}
          {version && <div style={{ color: '#888', fontSize: 13 }}>版本: <Tag color="purple">{version.name}</Tag></div>}
          <div style={{ color: '#888', fontSize: 13 }}>创建时间: {new Date(ticket.createdAt).toLocaleString()}</div>
          <div>{ticket.description || '暂无描述'}</div>

          {/* 工作流流转按钮 */}
          {nextSteps.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #f0f0f0' }}>
              <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13 }}>
                <StepForwardOutlined style={{ marginRight: 6 }} />
                流转到下一步
              </div>
              <Space wrap>
                {nextSteps.map(step => (
                  <Button
                    key={step.id}
                    type="primary"
                    size="small"
                    loading={transitioning}
                    onClick={() => handleTransition(step.id)}
                  >
                    {step.name}
                  </Button>
                ))}
              </Space>
            </div>
          )}
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
