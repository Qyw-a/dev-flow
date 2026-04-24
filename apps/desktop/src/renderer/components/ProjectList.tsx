import React from 'react'
import { List, Button, Checkbox, Tag, Empty, Space, Tooltip } from 'antd'
import { PlusOutlined, DeleteOutlined, FolderOpenOutlined, ReloadOutlined } from '@ant-design/icons'
import { useStore } from '../stores/useStore'
import { useProjects } from '../hooks/useProjects'
import { useGitOps } from '../hooks/useGitOps'

const ProjectList: React.FC = () => {
  const { projects, add, remove } = useProjects()
  const { refreshAllBranches } = useGitOps()
  const { selectedProjectIds, toggleProjectSelection, selectAllProjects, clearProjectSelection } = useStore()

  const handleAdd = async () => {
    try {
      await add()
    } catch (err: any) {
      // ignore cancel
    }
  }

  const allSelected = projects.length > 0 && projects.every(p => selectedProjectIds.includes(p.id))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加项目
        </Button>
        <Button icon={<ReloadOutlined />} onClick={refreshAllBranches}>
          刷新分支
        </Button>
        {projects.length > 0 && (
          <Checkbox
            checked={allSelected}
            indeterminate={selectedProjectIds.length > 0 && !allSelected}
            onChange={(e) => {
              if (e.target.checked) {
                selectAllProjects(projects.map(p => p.id))
              } else {
                clearProjectSelection()
              }
            }}
          >
            全选
          </Checkbox>
        )}
      </div>

      {projects.length === 0 ? (
        <Empty description="暂无项目，点击添加" style={{ marginTop: 40 }} />
      ) : (
        <List
          size="small"
          dataSource={projects}
          style={{ flex: 1, overflow: 'auto' }}
          renderItem={(project) => (
            <List.Item
              key={project.id}
              actions={[
                <Tooltip title="移除">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(project.id)}
                  />
                </Tooltip>
              ]}
            >
              <Space>
                <Checkbox
                  checked={selectedProjectIds.includes(project.id)}
                  onChange={() => toggleProjectSelection(project.id)}
                />
                <FolderOpenOutlined />
                <span style={{ fontWeight: 500 }}>{project.name}</span>
                {project.isGitRepo ? (
                  <Tag color="success">Git</Tag>
                ) : (
                  <Tag color="error">非Git</Tag>
                )}
                <span style={{ color: '#888', fontSize: 12 }}>{project.path}</span>
              </Space>
            </List.Item>
          )}
        />
      )}
    </div>
  )
}

export default ProjectList
