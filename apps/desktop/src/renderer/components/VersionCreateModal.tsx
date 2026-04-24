import React, { useState, useEffect } from 'react'
import { Modal, Input, Select, message } from 'antd'
import { Version, VersionStatus } from '@branch-manager/shared'

interface Props {
  open: boolean
  version: Version | null
  onCancel: () => void
  onConfirm: (values: Omit<Version, 'id' | 'createdAt'>) => void
}

const VersionCreateModal: React.FC<Props> = ({ open, version, onCancel, onConfirm }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<VersionStatus>('planning')
  const [plannedDate, setPlannedDate] = useState('')
  const isEdit = !!version

  useEffect(() => {
    if (version) {
      setName(version.name)
      setDescription(version.description)
      setStatus(version.status)
      setPlannedDate(version.plannedDate || '')
    } else {
      setName('')
      setDescription('')
      setStatus('planning')
      setPlannedDate('')
    }
  }, [version, open])

  const handleOk = async () => {
    const n = name.trim()
    if (!n) {
      message.warning('请输入版本名称')
      return
    }
    await onConfirm({
      name: n,
      description: description.trim(),
      status,
      plannedDate: plannedDate || undefined
    })
    setName('')
    setDescription('')
    setPlannedDate('')
  }

  return (
    <Modal
      title={isEdit ? '编辑版本' : '新建版本'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>版本名称：</label>
          <Input
            placeholder="如 v1.0.0"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>描述：</label>
          <Input.TextArea
            placeholder="版本描述"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
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
                { label: '规划中', value: 'planning' },
                { label: '开发中', value: 'developing' },
                { label: '测试中', value: 'testing' },
                { label: '已发布', value: 'released' }
              ]}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>计划日期：</label>
            <Input
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default VersionCreateModal
