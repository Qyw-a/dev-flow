import React, { useEffect, useMemo, useState } from 'react'
import { Table, Tag, Space, Card, Empty, Checkbox, Tabs, Button, Tooltip, Modal, Input, message, Popconfirm } from 'antd'
import {
  BranchesOutlined,
  GlobalOutlined,
  PlusOutlined,
  MergeCellsOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  SwapOutlined
} from '@ant-design/icons'
import { useStore } from '../stores/useStore'
import { useProjects } from '../hooks/useProjects'
import { useGitOps } from '../hooks/useGitOps'

interface BranchProjectRow {
  key: string
  branchName: string
  projectId: string
  projectName: string
  current: boolean
  commit: string
  label: string
  date: string
}

const PublicBranchView: React.FC = () => {
  const { projects } = useProjects()
  const {
    branchesMap,
    remoteBranchesMap,
    selectedProjectIds,
    selectedPublicBranches,
    togglePublicBranchSelection
  } = useStore()
  const {
    refreshAllRemoteBranches,
    createBranch,
    mergeBranch,
    pushBranch,
    deleteBranch,
    checkoutBranch
  } = useGitOps()

  const [activeTab, setActiveTab] = useState<'local' | 'remote'>('local')

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createProjectId, setCreateProjectId] = useState('')
  const [createBaseBranch, setCreateBaseBranch] = useState('')
  const [newBranchName, setNewBranchName] = useState('')

  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id))

  useEffect(() => {
    if (activeTab === 'remote') {
      refreshAllRemoteBranches()
    }
  }, [activeTab, refreshAllRemoteBranches])

  const openCreateModal = (projectId: string, baseBranch: string) => {
    setCreateProjectId(projectId)
    setCreateBaseBranch(baseBranch)
    setNewBranchName(baseBranch.replace(/^origin\//, '') + '-new')
    setCreateModalOpen(true)
  }

  const handleCreateConfirm = async () => {
    const name = newBranchName.trim()
    if (!name) {
      message.warning('请输入分支名称')
      return
    }
    setCreateModalOpen(false)
    await createBranch(createProjectId, name, createBaseBranch)
  }

  const handleCheckout = async (projectId: string, bname: string) => {
    const hide = message.loading('正在切换分支...', 0)
    try {
      await checkoutBranch(projectId, bname)
    } finally {
      hide()
    }
  }

  const handleMerge = async (projectId: string, bname: string) => {
    const hide = message.loading('正在合并分支...', 0)
    try {
      await mergeBranch(projectId, bname)
    } finally {
      hide()
    }
  }

  const handlePush = async (projectId: string, bname: string) => {
    const hide = message.loading('正在推送分支...', 0)
    try {
      await pushBranch(projectId, bname)
    } finally {
      hide()
    }
  }

  const handleDelete = async (projectId: string, bname: string) => {
    const hide = message.loading('正在删除分支...', 0)
    try {
      await deleteBranch(projectId, bname)
    } finally {
      hide()
    }
  }

  const localData = useMemo(() => {
    const map = new Map<string, BranchProjectRow[]>()
    selectedProjects.forEach(project => {
      const branches = branchesMap[project.id] || []
      branches.forEach(branch => {
        const list = map.get(branch.name) || []
        list.push({
          key: `${project.id}-${branch.name}`,
          branchName: branch.name,
          projectId: project.id,
          projectName: project.name,
          current: branch.current,
          commit: branch.commit,
          label: branch.label,
          date: branch.date
        })
        map.set(branch.name, list)
      })
    })
    const names = Array.from(map.keys()).sort()
    return { grouped: map, branchNames: names }
  }, [selectedProjects, branchesMap])

  const remoteData = useMemo(() => {
    const map = new Map<string, BranchProjectRow[]>()
    selectedProjects.forEach(project => {
      const branches = remoteBranchesMap[project.id] || []
      branches.forEach(branch => {
        const list = map.get(branch.name) || []
        list.push({
          key: `${project.id}-${branch.name}`,
          branchName: branch.name,
          projectId: project.id,
          projectName: project.name,
          current: false,
          commit: branch.commit,
          label: branch.label,
          date: branch.date
        })
        map.set(branch.name, list)
      })
    })
    const names = Array.from(map.keys()).sort()
    return { grouped: map, branchNames: names }
  }, [selectedProjects, remoteBranchesMap])

  const baseColumns = [
    {
      title: '项目',
      dataIndex: 'projectName',
      render: (name: string, record: BranchProjectRow) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{name}</span>
          {record.current && <Tag color="cyan">当前</Tag>}
        </Space>
      )
    },
    {
      title: '最新提交',
      render: (_: any, record: BranchProjectRow) => (
        <div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.commit}</div>
          <div style={{ fontSize: 12 }}>{record.label}</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>{record.date}</div>
        </div>
      )
    }
  ]

  const localColumns = [
    ...baseColumns,
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: BranchProjectRow) => {
        const isCurrent = record.current
        const pid = record.projectId
        const bname = record.branchName
        return (
          <Space size="small">
            <Tooltip title="切换到该分支">
              <Button
                size="small"
                icon={<SwapOutlined />}
                disabled={isCurrent}
                onClick={() => handleCheckout(pid, bname)}
              />
            </Tooltip>
            <Tooltip title="以此为基础创建分支">
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => openCreateModal(pid, bname)}
              />
            </Tooltip>
            <Tooltip title="合并到当前分支">
              <Button
                size="small"
                icon={<MergeCellsOutlined />}
                disabled={isCurrent}
                onClick={() => handleMerge(pid, bname)}
              />
            </Tooltip>
            <Tooltip title="推送">
              <Button
                size="small"
                icon={<CloudUploadOutlined />}
                onClick={() => handlePush(pid, bname)}
              />
            </Tooltip>
            <Popconfirm
              title="确认删除分支？"
              description={`删除分支 ${bname}`}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(pid, bname)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} disabled={isCurrent} />
            </Popconfirm>
          </Space>
        )
      }
    }
  ]

  const remoteColumns = [
    ...baseColumns,
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: BranchProjectRow) => {
        const pid = record.projectId
        const bname = record.branchName
        return (
          <Space size="small">
            <Tooltip title="以此为基础创建分支">
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => openCreateModal(pid, bname)}
              />
            </Tooltip>
          </Space>
        )
      }
    }
  ]

  const renderBranchCards = (
    data: { grouped: Map<string, BranchProjectRow[]>; branchNames: string[] },
    isRemote: boolean
  ) => {
    if (data.branchNames.length === 0) {
      return <Empty description={isRemote ? '暂无远程分支数据' : '暂无分支数据'} style={{ marginTop: 60 }} />
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.branchNames.map(name => {
          const rows = data.grouped.get(name) || []
          const projectCount = rows.length
          const checked = selectedPublicBranches.includes(name)
          const parts = isRemote ? name.split('/') : []
          const remotePrefix = isRemote ? parts[0] : ''
          const branchDisplayName = isRemote ? parts.slice(1).join('/') : name

          return (
            <Card
              key={name}
              size="small"
              title={
                <Space>
                  {!isRemote && (
                    <Checkbox
                      checked={checked}
                      onChange={() => togglePublicBranchSelection(name)}
                    />
                  )}
                  {isRemote ? <GlobalOutlined /> : <BranchesOutlined />}
                  {isRemote ? (
                    <>
                      <span style={{ color: '#888' }}>{remotePrefix}/</span>
                      <span style={{ fontWeight: 600 }}>{branchDisplayName}</span>
                    </>
                  ) : (
                    <span style={{ fontWeight: 600 }}>{name}</span>
                  )}
                  <Tag color="blue">{projectCount} 个项目</Tag>
                </Space>
              }
            >
              <Table<BranchProjectRow>
                size="small"
                columns={isRemote ? remoteColumns : localColumns}
                dataSource={rows}
                pagination={false}
                rowKey="key"
              />
            </Card>
          )
        })}
      </div>
    )
  }

  if (selectedProjects.length === 0) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 60, color: '#888' }}>
        请在左侧选择项目
      </div>
    )
  }

  return (
    <>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'local' | 'remote')}
        items={[
          {
            key: 'local',
            label: `本地分支 (${localData.branchNames.length})`,
            children: renderBranchCards(localData, false)
          },
          {
            key: 'remote',
            label: `远程分支 (${remoteData.branchNames.length})`,
            children: renderBranchCards(remoteData, true)
          }
        ]}
      />

      <Modal
        title="创建分支"
        open={createModalOpen}
        onOk={handleCreateConfirm}
        onCancel={() => setCreateModalOpen(false)}
        okText="创建"
        cancelText="取消"
      >
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>
            {createBaseBranch.startsWith('origin/') ? '基于远程分支：' : '基于分支：'}
            <Tag>{createBaseBranch}</Tag>
          </div>
          <Input
            placeholder="请输入新分支名称"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            onPressEnter={handleCreateConfirm}
            autoFocus
          />
        </div>
      </Modal>
    </>
  )
}

export default PublicBranchView
