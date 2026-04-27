import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Tree, Empty, Input, Dropdown, Modal, message, Tag } from 'antd'
import type { TreeDataNode, MenuProps } from 'antd'
import {
  FolderOutlined,
  TagOutlined,
  FileTextOutlined,
  MoreOutlined,
  RollbackOutlined
} from '@ant-design/icons'
import { useStore } from '../stores/useStore'
import { useTickets } from '../hooks/useTickets'
import { useVersions } from '../hooks/useVersions'
import { useWorkflowConfigs } from '../hooks/useWorkflowConfigs'
import { Ticket } from '@dev-flow/shared'

const ArchiveView: React.FC = () => {
  const { refresh: refreshTickets } = useTickets()
  const { refresh: refreshVersions, update: updateVersion } = useVersions()
  const { refresh: refreshWorkflows } = useWorkflowConfigs()
  const { tickets, versions, bizProjects, workflowConfigs } = useStore()
  const [search, setSearch] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])

  useEffect(() => {
    refreshTickets()
    refreshVersions()
    refreshWorkflows()
  }, [refreshTickets, refreshVersions, refreshWorkflows])

  const handleUnarchive = useCallback((versionId: string) => {
    Modal.confirm({
      title: '确认取消归档？',
      content: '取消归档后该版本将重新显示在需求管理目录中',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        await updateVersion(versionId, { archived: false })
        message.success('已取消归档')
      }
    })
  }, [updateVersion])

  const makeVersionMenu = useCallback((versionId: string): MenuProps['items'] => {
    return [
      {
        key: 'unarchive',
        label: '取消归档',
        icon: <RollbackOutlined />,
        onClick: () => handleUnarchive(versionId)
      }
    ]
  }, [handleUnarchive])

  const getStepInfo = useCallback((ticket: Ticket) => {
    const config = workflowConfigs.find(c => c.bizProjectId === ticket.bizProjectId)
    if (!config) {
      const defaults: Record<string, { name: string; color: string }> = {
        todo: { name: '待开发', color: '#d9d9d9' },
        dev: { name: '开发中', color: '#1677ff' },
        test: { name: '测试中', color: '#faad14' },
        done: { name: '已上线', color: '#52c41a' }
      }
      return defaults[ticket.status] || { name: ticket.status, color: '#d9d9d9' }
    }
    const step = config.steps.find(s => s.id === ticket.status)
    return step ? { name: step.name, color: step.color } : { name: ticket.status, color: '#d9d9d9' }
  }, [workflowConfigs])

  const treeData = useMemo((): TreeDataNode[] => {
    const filteredTickets = search.trim()
      ? tickets.filter(t =>
          t.title.toLowerCase().includes(search.trim().toLowerCase()) ||
          t.id.toLowerCase().includes(search.trim().toLowerCase())
        )
      : tickets

    const archivedVersions = versions.filter(v => v.archived)
    const nodes: TreeDataNode[] = []

    bizProjects.forEach(bp => {
      const bpArchivedVersions = archivedVersions.filter(v => v.bizProjectId === bp.id)
      if (bpArchivedVersions.length === 0) return

      const bpChildren: TreeDataNode[] = []

      bpArchivedVersions.forEach(version => {
        const versionTickets = filteredTickets.filter(t => t.versionId === version.id)
        if (search.trim() && versionTickets.length === 0) return

        const verMenu = { items: makeVersionMenu(version.id) }

        bpChildren.push({
          key: `ver-${version.id}`,
          title: (
            <Dropdown menu={verMenu} trigger={['contextMenu']}>
              <span
                style={{
                  fontWeight: 500,
                  color: '#722ed1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  width: '100%'
                }}
              >
                <TagOutlined style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {version.name}
                </span>
                {version.versionBranch && (
                  <span style={{ fontSize: 11, color: '#1677ff', background: '#e6f4ff', padding: '0 6px', borderRadius: 4, flexShrink: 0 }}>
                    {version.versionBranch}
                  </span>
                )}
                <span style={{ fontSize: 11, color: '#999', background: '#f5f5f5', padding: '0 6px', borderRadius: 4, flexShrink: 0 }}>
                  {versionTickets.length}
                </span>
                <Dropdown menu={verMenu} trigger={['click']}>
                  <MoreOutlined
                    style={{ fontSize: 14, color: '#999', flexShrink: 0, padding: '0 2px' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              </span>
            </Dropdown>
          ),
          children: versionTickets.length > 0
            ? versionTickets.map(ticket => {
                const stepInfo = getStepInfo(ticket)
                return {
                  key: ticket.id,
                  title: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                      <FileTextOutlined style={{ fontSize: 12, opacity: 0.6 }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.title}
                      </span>
                      <Tag color={stepInfo.color} style={{ fontSize: 11, margin: 0 }}>{stepInfo.name}</Tag>
                    </div>
                  ),
                  isLeaf: true
                }
              })
            : [{ key: `ver-empty-${version.id}`, title: <span style={{ color: '#bbb', fontSize: 12 }}>暂无需求</span>, isLeaf: true, selectable: false }]
        })
      })

      if (bpChildren.length > 0) {
        nodes.push({
          key: `bp-${bp.id}`,
          title: (
            <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, width: '100%' }}>
              <FolderOutlined style={{ color: '#1677ff', flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bp.name}
              </span>
            </span>
          ),
          children: bpChildren
        })
      }
    })

    return nodes
  }, [tickets, versions, bizProjects, search, makeVersionMenu, getStepInfo])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>归档历史</div>
      </div>

      <Input.Search
        placeholder="搜索已归档需求"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
        size="small"
      />

      {treeData.length === 0 ? (
        <Empty description="暂无已归档版本" style={{ marginTop: 60 }} />
      ) : (
        <Tree
          treeData={treeData}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys)}
          showLine
          blockNode
          style={{ flex: 1, overflow: 'auto' }}
        />
      )}
    </div>
  )
}

export default ArchiveView
