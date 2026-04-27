import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Tree, Button, Empty, Input, Dropdown, Modal, message } from 'antd'
import type { TreeDataNode, MenuProps } from 'antd'
import {
  PlusOutlined,
  TagsOutlined,
  AppstoreAddOutlined,
  FolderOutlined,
  TagOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  InboxOutlined
} from '@ant-design/icons'
import { useStore } from '../stores/useStore'
import { useTickets } from '../hooks/useTickets'
import { useVersions } from '../hooks/useVersions'
import { useWorkflowConfigs } from '../hooks/useWorkflowConfigs'
import { Ticket } from '@dev-flow/shared'

interface TicketListProps {
  onCreateBizProject: () => void
  onRemoveBizProject: (id: string) => void
  onEditBizProject?: (id: string) => void
  onCreateTicketForProject?: (bizProjectId: string) => void
  onCreateVersionForProject?: (bizProjectId: string) => void
  onCreateTicketForVersion?: (bizProjectId: string, versionId: string) => void
  onEditVersion?: (versionId: string) => void
}

const TicketList: React.FC<TicketListProps> = ({
  onCreateBizProject, onRemoveBizProject,
  onEditBizProject, onCreateTicketForProject, onCreateVersionForProject,
  onCreateTicketForVersion, onEditVersion
}) => {
  const { refresh: refreshTickets } = useTickets()
  const { refresh: refreshVersions, remove: removeVersion, update: updateVersion } = useVersions()
  const { refresh: refreshWorkflows } = useWorkflowConfigs()
  const {
    tickets, versions, selectedTicketId, bizProjects, selectTicket
  } = useStore()
  const [search, setSearch] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])

  useEffect(() => {
    refreshTickets()
    refreshVersions()
    refreshWorkflows()
  }, [refreshTickets, refreshVersions, refreshWorkflows])

  const handleRemoveBizProject = useCallback((bpId: string) => {
    const bpTickets = tickets.filter(t => t.bizProjectId === bpId)
    if (bpTickets.length > 0) {
      message.error(`该项目下还有 ${bpTickets.length} 个需求，请先删除所有需求`)
      return
    }
    Modal.confirm({
      title: '确认删除业务项目？',
      content: '删除后不可恢复',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => onRemoveBizProject(bpId)
    })
  }, [tickets, onRemoveBizProject])

  const handleRemoveVersion = useCallback((versionId: string) => {
    const versionTickets = tickets.filter(t => t.versionId === versionId)
    if (versionTickets.length > 0) {
      message.error(`该版本下还有 ${versionTickets.length} 个需求，请先删除所有需求`)
      return
    }
    Modal.confirm({
      title: '确认删除版本？',
      content: '删除后不可恢复',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await removeVersion(versionId)
        message.success('版本已删除')
      }
    })
  }, [tickets, removeVersion])

  const handleArchiveVersion = useCallback((versionId: string) => {
    const versionTickets = tickets.filter(t => t.versionId === versionId)
    const allDone = versionTickets.length > 0 && versionTickets.every(t => t.status === 'done')
    if (!allDone) {
      message.error('该版本下还有未上线的需求，无法归档')
      return
    }
    Modal.confirm({
      title: '确认归档版本？',
      content: '归档后该版本及其需求将不再显示在需求管理目录中',
      okText: '归档',
      cancelText: '取消',
      onOk: async () => {
        await updateVersion(versionId, { archived: true })
        message.success('版本已归档')
      }
    })
  }, [tickets, updateVersion])

  const makeVersionMenu = useCallback((versionId: string, bpId: string): MenuProps['items'] => {
    const items: MenuProps['items'] = []
    if (onCreateTicketForVersion) {
      items.push({
        key: 'create-ticket',
        label: '新建需求',
        icon: <PlusOutlined />,
        onClick: () => onCreateTicketForVersion(bpId, versionId)
      })
    }
    if (onEditVersion) {
      items.push({
        key: 'edit',
        label: '编辑版本',
        icon: <EditOutlined />,
        onClick: () => onEditVersion(versionId)
      })
    }
    items.push({
      key: 'archive',
      label: '归档版本',
      icon: <InboxOutlined />,
      onClick: () => handleArchiveVersion(versionId)
    })
    if (items.length > 0) {
      items.push({ type: 'divider' as const, key: 'divider' })
    }
    items.push({
      key: 'delete',
      label: '删除版本',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleRemoveVersion(versionId)
    })
    return items
  }, [onCreateTicketForVersion, onEditVersion, handleRemoveVersion, handleArchiveVersion])

  const makeBizProjectMenu = useCallback((bpId: string): MenuProps['items'] => {
    const items: MenuProps['items'] = []
    if (onCreateTicketForProject) {
      items.push({
        key: 'create-ticket',
        label: '新建需求',
        icon: <PlusOutlined />,
        onClick: () => onCreateTicketForProject(bpId)
      })
    }
    if (onCreateVersionForProject) {
      items.push({
        key: 'create-version',
        label: '新建版本',
        icon: <TagsOutlined />,
        onClick: () => onCreateVersionForProject(bpId)
      })
    }
    if (items.length > 0) {
      items.push({ type: 'divider' as const, key: 'divider' })
    }
    if (onEditBizProject) {
      items.push({
        key: 'edit',
        label: '编辑项目',
        icon: <EditOutlined />,
        onClick: () => onEditBizProject(bpId)
      })
    }
    items.push({
      key: 'delete',
      label: '删除项目',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleRemoveBizProject(bpId)
    })
    return items
  }, [onCreateTicketForProject, onCreateVersionForProject, onEditBizProject, onRemoveBizProject])

  const buildTreeData = useCallback((): TreeDataNode[] => {
    const filteredTickets = search.trim()
      ? tickets.filter(t =>
          t.title.toLowerCase().includes(search.trim().toLowerCase()) ||
          t.id.toLowerCase().includes(search.trim().toLowerCase())
        )
      : tickets

    const bizProjectMap = new Map<string, typeof bizProjects[0]>()
    bizProjects.forEach(bp => bizProjectMap.set(bp.id, bp))

    const nodes: TreeDataNode[] = []

    const uncategorizedTickets = filteredTickets.filter(t => !t.bizProjectId || !bizProjectMap.has(t.bizProjectId))
    if (uncategorizedTickets.length > 0) {
      nodes.push({
        key: 'uncategorized',
        title: (
          <span style={{ fontWeight: 500, color: '#666' }}>
            <FolderOutlined style={{ marginRight: 4, color: '#faad14' }} />
            未归类
          </span>
        ),
        children: uncategorizedTickets.map(ticket => ({
          key: ticket.id,
          title: <TicketNode ticket={ticket} isSelected={selectedTicketId === ticket.id} />,
          isLeaf: true
        }))
      })
    }

    bizProjects.forEach(bp => {
      const bpTickets = filteredTickets.filter(t => t.bizProjectId === bp.id)
      if (bpTickets.length === 0 && search.trim()) return

      const bpVersions = versions.filter(v => v.bizProjectId === bp.id && !v.archived)
      const bpChildren: TreeDataNode[] = []

      // 显示该业务项目下的所有版本（即使为空）
      bpVersions.forEach(version => {
        const versionTickets = bpTickets.filter(t => t.versionId === version.id)
        // 搜索时跳过没有匹配需求的空版本
        if (search.trim() && versionTickets.length === 0) return

        const verMenu = { items: makeVersionMenu(version.id, bp.id) }

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
            ? versionTickets.map(ticket => ({
                key: ticket.id,
                title: <TicketNode ticket={ticket} isSelected={selectedTicketId === ticket.id} />,
                isLeaf: true
              }))
            : [{ key: `ver-empty-${version.id}`, title: <span style={{ color: '#bbb', fontSize: 12 }}>暂无需求</span>, isLeaf: true, selectable: false }]
        })
      })

      // 无版本的需求
      const noVersionTickets = bpTickets.filter(t => !t.versionId)
      if (noVersionTickets.length > 0) {
        bpChildren.push(...noVersionTickets.map(ticket => ({
          key: ticket.id,
          title: <TicketNode ticket={ticket} isSelected={selectedTicketId === ticket.id} />,
          isLeaf: true
        })))
      }

      const menuItems = makeBizProjectMenu(bp.id)
      const menu = { items: menuItems }

      nodes.push({
        key: `bp-${bp.id}`,
        title: (
          <Dropdown menu={menu} trigger={['contextMenu']}>
            <span
              style={{
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                width: '100%'
              }}
            >
              <FolderOutlined style={{ color: '#1677ff', flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bp.name}
              </span>
              {bpTickets.length > 0 && (
                <span style={{ fontSize: 11, color: '#999', background: '#f5f5f5', padding: '0 6px', borderRadius: 4, flexShrink: 0 }}>
                  {bpTickets.length}
                </span>
              )}
              <Dropdown menu={menu} trigger={['click']}>
                <MoreOutlined
                  style={{ fontSize: 14, color: '#999', flexShrink: 0, padding: '0 2px' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </span>
          </Dropdown>
        ),
        children: bpChildren.length > 0 ? bpChildren : undefined
      })
    })

    return nodes
  }, [tickets, versions, bizProjects, selectedTicketId, search, makeBizProjectMenu, makeVersionMenu])

  const treeData = useMemo(() => buildTreeData(), [buildTreeData])

  useEffect(() => {
    if (!selectedTicketId) return
    const ticket = tickets.find(t => t.id === selectedTicketId)
    if (!ticket) return

    const keys: string[] = []
    if (ticket.bizProjectId) {
      keys.push(`bp-${ticket.bizProjectId}`)
      if (ticket.versionId) {
        keys.push(`ver-${ticket.versionId}`)
      }
    } else {
      keys.push('uncategorized')
    }
    setExpandedKeys(prev => Array.from(new Set([...prev, ...keys])))
  }, [selectedTicketId, tickets])

  const handleSelect = (_: React.Key[], info: { node: TreeDataNode; selected: boolean }) => {
    if (info.node.isLeaf && info.selected) {
      selectTicket(String(info.node.key))
    }
  }

  if (bizProjects.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Empty description="暂无业务项目" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        <Button type="primary" icon={<AppstoreAddOutlined />} onClick={onCreateBizProject}>
          新建业务项目
        </Button>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 12 }}>
        <Button icon={<AppstoreAddOutlined />} onClick={onCreateBizProject} size="small" block>
          新建业务项目
        </Button>
      </div>

      <Input.Search
        placeholder="搜索需求"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
        size="small"
      />

      {treeData.length === 0 ? (
        <Empty description="暂无需求" style={{ marginTop: 40 }} />
      ) : (
        <Tree
          treeData={treeData}
          selectedKeys={selectedTicketId ? [selectedTicketId] : []}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys)}
          onSelect={handleSelect}
          showLine
          blockNode
          style={{ flex: 1, overflow: 'auto' }}
        />
      )}
    </div>
  )
}

function TicketNode({ ticket, isSelected }: { ticket: Ticket; isSelected: boolean }) {
  const { workflowConfigs } = useStore()

  const stepColor = useMemo(() => {
    const config = workflowConfigs.find(c => c.bizProjectId === ticket.bizProjectId)
    if (!config) {
      // 默认回退颜色
      const defaults: Record<string, string> = {
        todo: '#d9d9d9', dev: '#1677ff', test: '#faad14', done: '#52c41a'
      }
      return defaults[ticket.status] || '#d9d9d9'
    }
    const step = config.steps.find(s => s.id === ticket.status)
    return step?.color || '#d9d9d9'
  }, [workflowConfigs, ticket.bizProjectId, ticket.status])

  const stepName = useMemo(() => {
    const config = workflowConfigs.find(c => c.bizProjectId === ticket.bizProjectId)
    if (!config) {
      const defaults: Record<string, string> = {
        todo: '待开发', dev: '开发中', test: '测试中', done: '已上线'
      }
      return defaults[ticket.status] || ticket.status
    }
    const step = config.steps.find(s => s.id === ticket.status)
    return step?.name || ticket.status
  }, [workflowConfigs, ticket.bizProjectId, ticket.status])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 0',
        color: isSelected ? '#1677ff' : undefined,
        fontWeight: isSelected ? 500 : undefined
      }}
    >
      <FileTextOutlined style={{ fontSize: 12, opacity: 0.6 }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {ticket.title}
      </span>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: stepColor,
          flexShrink: 0
        }}
        title={stepName}
      />
    </div>
  )
}

export default TicketList
