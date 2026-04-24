import React, { useEffect, useMemo, useState } from 'react'
import { Table, Tag, Space, Card, Empty, Checkbox, Tabs } from 'antd'
import { BranchesOutlined, GlobalOutlined } from '@ant-design/icons'
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
  const { refreshAllRemoteBranches } = useGitOps()

  const [activeTab, setActiveTab] = useState<'local' | 'remote'>('local')

  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id))

  useEffect(() => {
    if (activeTab === 'remote') {
      refreshAllRemoteBranches()
    }
  }, [activeTab, refreshAllRemoteBranches])

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

  const columns = [
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
                columns={columns}
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
  )
}

export default PublicBranchView
