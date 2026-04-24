import React, { useEffect, useState } from 'react'
import { Table, Button, Tag, Space, Popconfirm, Tooltip, Modal, Input, message, Card, Tabs, Checkbox } from 'antd'
import {
  PlusOutlined,
  MergeCellsOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  BranchesOutlined,
  SwapOutlined
} from '@ant-design/icons'
import { useStore } from '../stores/useStore'
import { useProjects } from '../hooks/useProjects'
import { useGitOps } from '../hooks/useGitOps'
import { BranchInfo } from '../types'

type BranchRow = BranchInfo & { projectId: string }

const BranchTable: React.FC = () => {
  const { projects } = useProjects()
  const {
    branchesMap,
    remoteBranchesMap,
    ticketBranchesMap,
    tickets,
    loadingBranches,
    selectedProjectIds,
    selectedBranches,
    setProjectSelectedBranches
  } = useStore()
  const { refreshBranches, refreshRemoteBranches, createBranch, mergeBranch, pushBranch, deleteBranch, deleteRemoteBranch, checkoutBranch } = useGitOps()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createProjectId, setCreateProjectId] = useState('')
  const [createBaseBranch, setCreateBaseBranch] = useState('')
  const [newBranchName, setNewBranchName] = useState('')

  const [deleteRemoteModalOpen, setDeleteRemoteModalOpen] = useState(false)
  const [deleteRemoteProjectId, setDeleteRemoteProjectId] = useState('')
  const [deleteRemoteBranchName, setDeleteRemoteBranchName] = useState('')
  const [deleteWithLocal, setDeleteWithLocal] = useState(false)

  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id))

  const branchTicketMap = React.useMemo(() => {
    const map = new Map<string, string>()
    Object.entries(ticketBranchesMap).forEach(([ticketId, links]) => {
      links.forEach(link => {
        map.set(`${link.projectId}:${link.branchName}`, ticketId)
      })
    })
    return map
  }, [ticketBranchesMap])

  const getTicketTag = (projectId: string, branchName: string) => {
    const ticketId = branchTicketMap.get(`${projectId}:${branchName}`)
    if (!ticketId) return null
    const ticket = tickets.find(t => t.id === ticketId)
    return ticket ? (
      <Tag color="purple" style={{ fontSize: 11 }}>
        {ticket.id}
      </Tag>
    ) : null
  }

  useEffect(() => {
    selectedProjects.forEach(p => {
      if (p.isGitRepo && !branchesMap[p.id]) {
        refreshBranches(p.id)
      }
      if (p.isGitRepo && !remoteBranchesMap[p.id]) {
        refreshRemoteBranches(p.id)
      }
    })
  }, [selectedProjects.map(p => p.id).join(',')])

  const openCreateModal = (projectId: string, baseBranch: string) => {
    setCreateProjectId(projectId)
    setCreateBaseBranch(baseBranch)
    setNewBranchName(baseBranch + '-new')
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

  const openDeleteRemoteModal = (projectId: string, bname: string) => {
    setDeleteRemoteProjectId(projectId)
    setDeleteRemoteBranchName(bname)
    setDeleteWithLocal(false)
    setDeleteRemoteModalOpen(true)
  }

  const handleDeleteRemoteConfirm = async () => {
    const pid = deleteRemoteProjectId
    const bname = deleteRemoteBranchName
    const localName = bname.replace(/^origin\//, '')
    const hide = message.loading('正在删除远程分支...', 0)
    try {
      const remoteResult = await deleteRemoteBranch(pid, bname)
      if (remoteResult.success && deleteWithLocal) {
        const localBranches = branchesMap[pid] || []
        const hasLocal = localBranches.some(b => b.name === localName)
        if (hasLocal) {
          await deleteBranch(pid, localName)
        }
      }
    } finally {
      hide()
      setDeleteRemoteModalOpen(false)
    }
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {selectedProjects.map(project => {
          const branches = branchesMap[project.id] || []
          const dataSource: BranchRow[] = branches.map(b => ({ ...b, projectId: project.id }))
          const rowSelection = {
            selectedRowKeys: selectedBranches[project.id] || [],
            onChange: (keys: React.Key[]) => {
              setProjectSelectedBranches(project.id, keys as string[])
            },
            getCheckboxProps: (record: BranchInfo) => ({
              disabled: record.current
            })
          }

          return (
            <Card
              key={project.id}
              size="small"
              title={
                <Space>
                  <span style={{ fontWeight: 600 }}>{project.name}</span>
                  {!project.isGitRepo && <Tag color="error">非Git仓库</Tag>}
                </Space>
              }
              extra={
                <Tooltip title="刷新">
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      refreshBranches(project.id)
                      refreshRemoteBranches(project.id)
                    }}
                  />
                </Tooltip>
              }
            >
              <Tabs
                size="small"
                items={[
                  {
                    key: 'local',
                    label: `本地分支 (${branches.length})`,
                    children: (
                      <Table<BranchRow>
                        size="small"
                        dataSource={dataSource}
                        rowSelection={rowSelection}
                        pagination={false}
                        loading={loadingBranches && branches.length === 0}
                        locale={{ emptyText: project.isGitRepo ? '暂无分支数据' : '不是有效的 Git 仓库' }}
                        rowKey="name"
                        scroll={{ x: 'max-content' }}
                        columns={[
                          {
                            title: '分支',
                            key: 'name',
                            render: (_: any, record: BranchRow) => {
                              const remoteNames = (remoteBranchesMap[record.projectId] || []).map(b => b.name)
                              const hasRemote = remoteNames.includes(`origin/${record.name}`)
                              return (
                                <Space>
                                  <BranchesOutlined />
                                  {record.current ? (
                                    <Tag color="blue">{record.name}</Tag>
                                  ) : (
                                    <span>{record.name}</span>
                                  )}
                                  {record.current && <Tag color="cyan">当前</Tag>}
                                  {hasRemote ? (
                                    <Tag color="success" style={{ fontSize: 11 }}>已同步</Tag>
                                  ) : (
                                    <Tag color="warning" style={{ fontSize: 11 }}>未推送</Tag>
                                  )}
                                  {getTicketTag(record.projectId, record.name)}
                                </Space>
                              )
                            }
                          },
                          {
                            title: '最新提交',
                            key: 'commit',
                            width: 300,
                            render: (_: any, record: BranchRow) => (
                              <div>
                                <div style={{ fontSize: 12, color: '#888' }}>{record.commit}</div>
                                <div style={{ fontSize: 12 }}>{record.label}</div>
                                <div style={{ fontSize: 11, color: '#aaa' }}>{record.date}</div>
                              </div>
                            )
                          },
                          {
                            title: '操作',
                            key: 'action',
                            width: 200,
                            render: (_: any, record: BranchRow) => {
                              const isCurrent = record.current
                              const pid = record.projectId
                              const bname = record.name
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
                        ]}
                      />
                    )
                  },
                  {
                    key: 'remote',
                    label: `远程分支 (${(remoteBranchesMap[project.id] || []).length})`,
                    children: (
                      <Table<BranchRow>
                        size="small"
                        dataSource={(remoteBranchesMap[project.id] || []).map(b => ({ ...b, projectId: project.id }))}
                        pagination={false}
                        locale={{ emptyText: '暂无远程分支数据' }}
                        rowKey="name"
                        scroll={{ x: 'max-content' }}
                        columns={[
                          {
                            title: '分支',
                            key: 'name',
                            render: (_: any, record: BranchRow) => {
                              const parts = record.name.split('/')
                              const remote = parts[0]
                              const branchName = parts.slice(1).join('/')
                              const localNames = (branchesMap[record.projectId] || []).map(b => b.name)
                              const hasLocal = localNames.includes(branchName)
                              return (
                                <Space>
                                  <BranchesOutlined />
                                  <span style={{ color: '#888' }}>{remote}/</span>
                                  <span>{branchName}</span>
                                  {hasLocal ? (
                                    <Tag color="success" style={{ fontSize: 11 }}>本地存在</Tag>
                                  ) : (
                                    <Tag color="blue" style={{ fontSize: 11 }}>仅远程</Tag>
                                  )}
                                </Space>
                              )
                            }
                          },
                          {
                            title: '最新提交',
                            key: 'commit',
                            width: 300,
                            render: (_: any, record: BranchRow) => (
                              <div>
                                <div style={{ fontSize: 12, color: '#888' }}>{record.commit}</div>
                                <div style={{ fontSize: 12 }}>{record.label}</div>
                                <div style={{ fontSize: 11, color: '#aaa' }}>{record.date}</div>
                              </div>
                            )
                          },
                          {
                            title: '操作',
                            key: 'action',
                            width: 120,
                            render: (_: any, record: BranchRow) => {
                              const pid = record.projectId
                              const bname = record.name
                              return (
                                <Space size="small">
                                  <Tooltip title="以此为基础创建分支">
                                    <Button
                                      size="small"
                                      icon={<PlusOutlined />}
                                      onClick={() => openCreateModal(pid, bname)}
                                    />
                                  </Tooltip>
                                  <Tooltip title="删除远程分支">
                                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => openDeleteRemoteModal(pid, bname)} />
                                  </Tooltip>
                                </Space>
                              )
                            }
                          }
                        ]}
                      />
                    )
                  }
                ]}
              />
            </Card>
          )
        })}
      </div>

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

      <Modal
        title="确认删除远程分支"
        open={deleteRemoteModalOpen}
        onOk={handleDeleteRemoteConfirm}
        onCancel={() => setDeleteRemoteModalOpen(false)}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginTop: 8 }}>
          <p>确认删除远程分支 <Tag>{deleteRemoteBranchName}</Tag> ？</p>
          <Checkbox
            checked={deleteWithLocal}
            onChange={(e) => setDeleteWithLocal(e.target.checked)}
          >
            同时删除同名本地分支
          </Checkbox>
        </div>
      </Modal>
    </>
  )
}

export default BranchTable
