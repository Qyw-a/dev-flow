import React, { useEffect, useMemo, useState } from 'react'
import { List, Button, Tag, Empty, Space, Input, Radio } from 'antd'
import { PlusOutlined, FileTextOutlined, TagsOutlined } from '@ant-design/icons'
import { useStore } from '../stores/useStore'
import { useTickets } from '../hooks/useTickets'
import { useVersions } from '../hooks/useVersions'
import { TicketStatus } from '@branch-manager/shared'

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

const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'red'
}

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高'
}

interface TicketListProps {
  onCreate: () => void
  onCreateVersion: () => void
}

const TicketList: React.FC<TicketListProps> = ({ onCreate, onCreateVersion }) => {
  const { refresh } = useTickets()
  const { refresh: refreshVersions } = useVersions()
  const { tickets, versions, selectedTicketId, selectedVersionId, selectTicket, selectVersion } = useStore()
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    refresh()
    refreshVersions()
  }, [refresh, refreshVersions])

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      if (selectedVersionId && t.versionId !== selectedVersionId) return false
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        return t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
      }
      return true
    })
  }, [tickets, selectedVersionId, filterStatus, search])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          新建需求
        </Button>
        <Button icon={<TagsOutlined />} onClick={onCreateVersion}>
          版本
        </Button>
      </div>

      {/* 版本列表 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>版本</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Tag
            color={selectedVersionId === null ? 'blue' : 'default'}
            style={{ cursor: 'pointer' }}
            onClick={() => selectVersion(null)}
          >
            全部
          </Tag>
          {versions.map(v => (
            <Tag
              key={v.id}
              color={selectedVersionId === v.id ? 'blue' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => selectVersion(v.id)}
            >
              {v.name}
            </Tag>
          ))}
        </div>
      </div>

      <Input.Search
        placeholder="搜索需求标题或ID"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
      />

      <Radio.Group
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        optionType="button"
        buttonStyle="solid"
        size="small"
        style={{ marginBottom: 12 }}
      >
        <Radio.Button value="all">全部</Radio.Button>
        <Radio.Button value="todo">待开发</Radio.Button>
        <Radio.Button value="dev">开发中</Radio.Button>
        <Radio.Button value="test">测试中</Radio.Button>
        <Radio.Button value="done">已上线</Radio.Button>
      </Radio.Group>

      {filtered.length === 0 ? (
        <Empty description="暂无需求" style={{ marginTop: 40 }} />
      ) : (
        <List
          size="small"
          dataSource={filtered}
          style={{ flex: 1, overflow: 'auto' }}
          renderItem={(ticket) => {
            const version = versions.find(v => v.id === ticket.versionId)
            return (
              <List.Item
                key={ticket.id}
                onClick={() => selectTicket(ticket.id)}
                style={{
                  cursor: 'pointer',
                  background: selectedTicketId === ticket.id ? '#e6f4ff' : 'transparent',
                  borderRadius: 4,
                  padding: '8px 12px',
                  marginBottom: 4,
                  borderLeft: `3px solid ${ticket.status === 'done' ? '#52c41a' : ticket.status === 'dev' ? '#1677ff' : ticket.status === 'test' ? '#faad14' : '#d9d9d9'}`
                }}
              >
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <Space>
                    <FileTextOutlined />
                    <span style={{ fontWeight: 500 }}>{ticket.title}</span>
                  </Space>
                  <Space>
                    <Tag color={statusColors[ticket.status]}>{statusLabels[ticket.status]}</Tag>
                    <Tag color={priorityColors[ticket.priority]}>{priorityLabels[ticket.priority]}</Tag>
                    {version && <Tag color="purple">{version.name}</Tag>}
                    <span style={{ color: '#888', fontSize: 12 }}>{ticket.id}</span>
                  </Space>
                </Space>
              </List.Item>
            )
          }}
        />
      )}
    </div>
  )
}

export default TicketList
