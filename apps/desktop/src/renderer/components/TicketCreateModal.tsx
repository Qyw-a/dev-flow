import React, { useState, useEffect } from 'react'
import { Modal, Input, Select, message } from 'antd'
import { Ticket, TicketStatus, TicketPriority } from '@branch-manager/shared'
import { useStore } from '../stores/useStore'

interface Props {
  open: boolean
  ticket: Ticket | null
  onCancel: () => void
  onConfirm: (values: Omit<Ticket, 'id' | 'createdAt'>) => void
}

const TicketCreateModal: React.FC<Props> = ({ open, ticket, onCancel, onConfirm }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TicketStatus>('todo')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [versionId, setVersionId] = useState<string | undefined>(undefined)
  const isEdit = !!ticket
  const { versions } = useStore()

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title)
      setDescription(ticket.description)
      setStatus(ticket.status)
      setPriority(ticket.priority)
      setVersionId(ticket.versionId)
    } else {
      setTitle('')
      setDescription('')
      setStatus('todo')
      setPriority('medium')
      setVersionId(undefined)
    }
  }, [ticket, open])

  const handleOk = () => {
    const t = title.trim()
    if (!t) {
      message.warning('请输入需求标题')
      return
    }
    onConfirm({ title: t, description: description.trim(), status, priority, versionId: versionId || undefined })
    setTitle('')
    setDescription('')
  }

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
              options={[
                { label: '待开发', value: 'todo' },
                { label: '开发中', value: 'dev' },
                { label: '测试中', value: 'test' },
                { label: '已上线', value: 'done' }
              ]}
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
            options={versions.map(v => ({ label: v.name, value: v.id }))}
          />
        </div>
      </div>
    </Modal>
  )
}

export default TicketCreateModal
