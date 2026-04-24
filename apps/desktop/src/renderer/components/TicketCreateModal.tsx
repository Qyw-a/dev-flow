import React, { useState, useEffect } from 'react'
import { Modal, Input, Select, message } from 'antd'
import { Ticket, TicketPriority, BizProject } from '@branch-manager/shared'
import { useWorkflowConfigs } from '../hooks/useWorkflowConfigs'

interface Props {
  open: boolean
  ticket: Ticket | null
  bizProjectId: string
  defaultVersionId?: string
  bizProjects: BizProject[]
  versions: import('@branch-manager/shared').Version[]
  onCancel: () => void
  onConfirm: (values: Omit<Ticket, 'id' | 'createdAt'>) => void
}

const TicketCreateModal: React.FC<Props> = ({ open, ticket, bizProjectId, defaultVersionId, bizProjects, versions, onCancel, onConfirm }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<string>('todo')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [versionId, setVersionId] = useState<string | undefined>(undefined)
  const [selectedBizProjectId, setSelectedBizProjectId] = useState<string>(bizProjectId)
  const [statusOptions, setStatusOptions] = useState<{ label: string; value: string }[]>([])
  const isEdit = !!ticket
  const { getByBizProjectId } = useWorkflowConfigs()

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title)
      setDescription(ticket.description)
      setStatus(ticket.status)
      setPriority(ticket.priority)
      setVersionId(ticket.versionId)
      setSelectedBizProjectId(ticket.bizProjectId)
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setVersionId(defaultVersionId)
      setSelectedBizProjectId(bizProjectId)
    }
  }, [ticket, open, bizProjectId, defaultVersionId])

  // 动态加载工作流状态选项
  useEffect(() => {
    if (!open || !selectedBizProjectId) return
    getByBizProjectId(selectedBizProjectId).then(config => {
      const steps = [...config.steps].sort((a, b) => a.order - b.order)
      setStatusOptions(steps.map(s => ({ label: s.name, value: s.id })))
      if (!ticket) {
        setStatus(steps[0]?.id || 'todo')
      }
    })
  }, [open, selectedBizProjectId, getByBizProjectId, ticket])

  const handleOk = () => {
    const t = title.trim()
    if (!t) {
      message.warning('请输入需求标题')
      return
    }
    if (!selectedBizProjectId) {
      message.warning('请选择业务项目')
      return
    }
    onConfirm({
      title: t,
      description: description.trim(),
      status,
      priority,
      versionId: versionId || undefined,
      bizProjectId: selectedBizProjectId
    })
    setTitle('')
    setDescription('')
  }

  const filteredVersions = versions.filter(v => v.bizProjectId === selectedBizProjectId)

  return (
    <Modal
      title={isEdit ? '编辑需求' : '新建需求'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>业务项目：</label>
          <Select
            value={selectedBizProjectId || undefined}
            onChange={(v) => { setSelectedBizProjectId(v); setVersionId(undefined) }}
            style={{ width: '100%' }}
            options={bizProjects.map(b => ({ label: b.name, value: b.id }))}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>标题：</label>
          <Input
            placeholder="请输入需求标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>描述：</label>
          <Input.TextArea
            placeholder="请输入需求描述"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>状态：</label>
            <Select
              value={status}
              onChange={(v) => setStatus(v)}
              style={{ width: '100%' }}
              options={statusOptions}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>优先级：</label>
            <Select
              value={priority}
              onChange={(v) => setPriority(v)}
              style={{ width: '100%' }}
              options={[
                { label: '低', value: 'low' },
                { label: '中', value: 'medium' },
                { label: '高', value: 'high' }
              ]}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>所属版本：</label>
          <Select
            placeholder="选择版本（可选）"
            value={versionId}
            onChange={(v) => setVersionId(v)}
            style={{ width: '100%' }}
            allowClear
            options={filteredVersions.map(v => ({ label: v.name, value: v.id }))}
          />
        </div>
      </div>
    </Modal>
  )
}

export default TicketCreateModal
