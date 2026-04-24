import React, { useState, useMemo } from 'react'
import { Button, Input, Space, Modal, Checkbox, Select, message, Tag, Tooltip } from 'antd'
import {
  PlusOutlined,
  MergeCellsOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  SwapOutlined,
  ClusterOutlined,
  CloudDownloadOutlined,
  ImportOutlined
} from '@ant-design/icons'
import { useStore } from '../stores/useStore'
import { useGitOps } from '../hooks/useGitOps'
import { useProjects } from '../hooks/useProjects'

const BatchToolbar: React.FC = () => {
  const {
    selectedProjectIds,
    selectedBranches,
    clearAllBranchSelection,
    branchesMap,
    viewMode,
    selectedPublicBranches,
    clearPublicBranchSelection
  } = useStore()
  const { projects } = useProjects()
  const { batch, mergeToBranch, fetchRepo, pullRepo } = useGitOps()
  const [baseBranch, setBaseBranch] = useState('')
  const [forceDelete, setForceDelete] = useState(false)
  const [ffMerge, setFfMerge] = useState<boolean | undefined>(undefined)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<'create' | 'merge' | 'push' | 'delete' | 'checkout' | 'mergeTo' | null>(null)
  const [targetBranch, setTargetBranch] = useState('')

  const selectedGitProjects = projects.filter(
    p => selectedProjectIds.includes(p.id) && p.isGitRepo
  )

  const allSelectedBranchList = useMemo(() => {
    const result: { projectId: string; branchName: string }[] = []
    Object.entries(selectedBranches).forEach(([pid, branches]) => {
      branches.forEach(bname => result.push({ projectId: pid, branchName: bname }))
    })
    return result
  }, [selectedBranches])

  const allBranchNames = useMemo(() => {
    const set = new Set<string>()
    Object.values(branchesMap).forEach(branches => {
      branches.forEach(b => set.add(b.name))
    })
    return Array.from(set).sort()
  }, [branchesMap])

  const openModal = (type: 'create' | 'merge' | 'push' | 'delete' | 'checkout' | 'mergeTo') => {
    if (type === 'create') {
      if (selectedGitProjects.length === 0) {
        message.warning('请先选择至少一个 Git 项目')
        return
      }
    } else if (type === 'mergeTo') {
      if (selectedPublicBranches.length === 0) {
        message.warning('请先选择至少一个公共分支')
        return
      }
    } else {
      if (allSelectedBranchList.length === 0) {
        message.warning('请先选择至少一个分支')
        return
      }
    }
    setModalType(type)
    setModalVisible(true)
  }

  const handleConfirm = async () => {
    if (!modalType) return

    if (modalType === 'create') {
      if (!baseBranch.trim()) {
        message.error('分支名称不能为空')
        return
      }
      const ops = selectedGitProjects.map(p => ({
        projectId: p.id,
        type: 'create' as const,
        branchName: baseBranch.trim(),
        base: undefined
      }))
      setModalVisible(false)
      setBaseBranch('')
      await batch(ops)
      return
    }

    if (modalType === 'mergeTo') {
      if (!targetBranch) {
        message.error('请选择目标分支')
        return
      }
      if (selectedPublicBranches.includes(targetBranch)) {
        message.error('目标分支不能在选中的源分支中')
        return
      }
      setModalVisible(false)
      const hide = message.loading('正在合并...', 0)
      try {
        for (const source of selectedPublicBranches) {
          for (const project of selectedGitProjects) {
            const branches = branchesMap[project.id] || []
            const hasSource = branches.some(b => b.name === source)
            const hasTarget = branches.some(b => b.name === targetBranch)
            if (hasSource && hasTarget) {
              await mergeToBranch(project.id, source, targetBranch, ffMerge)
            }
          }
        }
      } finally {
        hide()
        clearPublicBranchSelection()
        setTargetBranch('')
      }
      return
    }

    const ops = allSelectedBranchList.map(item => ({
      projectId: item.projectId,
      type: modalType,
      branchName: item.branchName,
      force: modalType === 'delete' ? forceDelete : undefined,
      ff: modalType === 'merge' ? ffMerge : undefined
    }))

    setModalVisible(false)
    await batch(ops)
    clearAllBranchSelection()
  }

  const handleBatchFetch = async () => {
    if (selectedGitProjects.length === 0) {
      message.warning('请先选择至少一个 Git 项目')
      return
    }
    const hide = message.loading('正在 fetch...', 0)
    try {
      for (const project of selectedGitProjects) {
        await fetchRepo(project.id)
      }
    } finally {
      hide()
    }
  }

  const handleBatchPull = async () => {
    if (selectedGitProjects.length === 0) {
      message.warning('请先选择至少一个 Git 项目')
      return
    }
    const hide = message.loading('正在 pull...', 0)
    try {
      for (const project of selectedGitProjects) {
        await pullRepo(project.id)
      }
    } finally {
      hide()
    }
  }

  const modalTitleMap: Record<string, string> = {
    create: '批量创建分支',
    merge: '批量合并分支',
    push: '批量推送分支',
    delete: '批量删除分支',
    checkout: '批量切换分支',
    mergeTo: '合并到目标分支'
  }

  return (
    <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Space>
        <Tooltip title="批量 Fetch">
          <Button size="small" icon={<CloudDownloadOutlined />} onClick={handleBatchFetch} />
        </Tooltip>
        <Tooltip title="批量 Pull">
          <Button size="small" icon={<ImportOutlined />} onClick={handleBatchPull} />
        </Tooltip>
      </Space>
      {viewMode === 'project' ? (
        <>
          <Space>
            <Tooltip title="批量创建">
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openModal('create')} />
            </Tooltip>
            <Tooltip title="批量推送">
              <Button size="small" icon={<CloudUploadOutlined />} onClick={() => openModal('push')} />
            </Tooltip>
            <Tooltip title="批量合并">
              <Button size="small" icon={<MergeCellsOutlined />} onClick={() => openModal('merge')} />
            </Tooltip>
            <Tooltip title="批量切换">
              <Button size="small" icon={<SwapOutlined />} onClick={() => openModal('checkout')} />
            </Tooltip>
            <Tooltip title="批量删除">
              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => openModal('delete')} />
            </Tooltip>
          </Space>

          {allSelectedBranchList.length > 0 && (
            <Tag color="processing">
              已选择 {allSelectedBranchList.length} 个分支
              <Button
                type="link"
                size="small"
                style={{ padding: '0 4px', height: 'auto', fontSize: 12 }}
                onClick={clearAllBranchSelection}
              >
                清空
              </Button>
            </Tag>
          )}
        </>
      ) : (
        <>
          <Space>
            <Tooltip title="合并到分支">
              <Button type="primary" size="small" icon={<ClusterOutlined />} onClick={() => openModal('mergeTo')} />
            </Tooltip>
          </Space>

          {selectedPublicBranches.length > 0 && (
            <Tag color="processing">
              已选择 {selectedPublicBranches.length} 个公共分支
              <Button
                type="link"
                size="small"
                style={{ padding: '0 4px', height: 'auto', fontSize: 12 }}
                onClick={clearPublicBranchSelection}
              >
                清空
              </Button>
            </Tag>
          )}
        </>
      )}

      <Modal
        title={modalType ? modalTitleMap[modalType] : ''}
        open={modalVisible}
        onOk={handleConfirm}
        onCancel={() => setModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        {modalType === 'create' ? (
          <>
            <p>将在以下 <strong>{selectedGitProjects.length}</strong> 个项目中创建分支：</p>
            <ul style={{ maxHeight: 120, overflow: 'auto' }}>
              {selectedGitProjects.map(p => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
            <div style={{ marginTop: 12 }}>
              <label>分支名称：</label>
              <Input
                placeholder="请输入新分支名称"
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                style={{ marginTop: 4 }}
                autoFocus
              />
            </div>
          </>
        ) : modalType === 'mergeTo' ? (
          <>
            <p>将以下 <strong>{selectedPublicBranches.length}</strong> 个公共分支合并到目标分支：</p>
            <ul style={{ maxHeight: 120, overflow: 'auto' }}>
              {selectedPublicBranches.map(name => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            <div style={{ marginTop: 12 }}>
              <label>目标分支：</label>
              <Select
                placeholder="请选择目标分支"
                value={targetBranch || undefined}
                onChange={(v) => setTargetBranch(v)}
                style={{ width: '100%', marginTop: 4 }}
                options={allBranchNames
                  .filter(n => !selectedPublicBranches.includes(n))
                  .map(n => ({ label: n, value: n }))}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label>合并策略：</label>
              <Select
                value={ffMerge}
                onChange={(v) => setFfMerge(v)}
                style={{ width: '100%', marginTop: 4 }}
                options={[
                  { label: '默认', value: undefined },
                  { label: '快进合并 (--ff)', value: true },
                  { label: '非快进合并 (--no-ff)', value: false }
                ]}
              />
            </div>
          </>
        ) : (
          <>
            <p>将对以下 <strong>{allSelectedBranchList.length}</strong> 个选中分支执行操作：</p>
            <ul style={{ maxHeight: 160, overflow: 'auto' }}>
              {allSelectedBranchList.map((item, idx) => {
                const project = projects.find(p => p.id === item.projectId)
                const branches = branchesMap[item.projectId] || []
                const currentBranch = branches.find(b => b.current)
                return (
                  <li key={idx}>
                    <Tag>{project?.name || item.projectId}</Tag>
                    {modalType === 'merge'
                      ? `将 ${item.branchName} 合并到 ${currentBranch?.name || '当前分支'}`
                      : item.branchName}
                  </li>
                )
              })}
            </ul>

            {modalType === 'merge' && (
              <div style={{ marginTop: 12 }}>
                <label>合并策略：</label>
                <Select
                  value={ffMerge}
                  onChange={(v) => setFfMerge(v)}
                  style={{ width: '100%', marginTop: 4 }}
                  options={[
                    { label: '默认', value: undefined },
                    { label: '快进合并 (--ff)', value: true },
                    { label: '非快进合并 (--no-ff)', value: false }
                  ]}
                />
              </div>
            )}

            {modalType === 'delete' && (
              <div style={{ marginTop: 12 }}>
                <Checkbox checked={forceDelete} onChange={(e) => setForceDelete(e.target.checked)}>
                  强制删除（-D）
                </Checkbox>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}

export default BatchToolbar
