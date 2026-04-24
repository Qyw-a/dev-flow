import React, { useMemo } from 'react'
import { Table, Tag, Space, Card, Empty, Checkbox } from 'antd'
import { BranchesOutlined } from '@ant-design/icons'
import { useStore } from '../stores/useStore'
import { useProjects } from '../hooks/useProjects'

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
    selectedProjectIds,
    selectedPublicBranches,
    togglePublicBranchSelection
  } = useStore()

  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id))

  const { grouped, branchNames } = useMemo(() => {
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

  if (selectedProjects.length === 0) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 60, color: '#888' }}>
        请在左侧选择项目
      </div>
    )
  }

  if (branchNames.length === 0) {
    return <Empty description="暂无分支数据" style={{ marginTop: 60 }} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {branchNames.map(name => {
        const rows = grouped.get(name) || []
        const projectCount = rows.length
        const checked = selectedPublicBranches.includes(name)
        return (
          <Card
            key={name}
            size="small"
            title={
              <Space>
                <Checkbox
                  checked={checked}
                  onChange={() => togglePublicBranchSelection(name)}
                />
                <BranchesOutlined />
                <span style={{ fontWeight: 600 }}>{name}</span>
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

export default PublicBranchView
