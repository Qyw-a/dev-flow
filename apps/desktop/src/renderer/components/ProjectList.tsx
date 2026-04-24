import React from 'react'
import { List, Button, Checkbox, Tag, Empty, Tooltip } from 'antd'
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
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Tooltip title="添加项目">
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAdd} />
        </Tooltip>
        <Tooltip title="刷新分支">
          <Button size="small" icon={<ReloadOutlined />} onClick={refreshAllBranches} />
        </Tooltip>
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
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Checkbox
                  checked={selectedProjectIds.includes(project.id)}
                  onChange={() => toggleProjectSelection(project.id)}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <FolderOpenOutlined style={{ marginTop: 4, flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 500 }}>{project.name}</span>
                    {project.isGitRepo ? (
                      <Tag color="success" style={{ fontSize: 11, lineHeight: '16px', padding: '0 4px', margin: 0, flexShrink: 0 }}>Git</Tag>
                    ) : (
                      <Tag color="error" style={{ fontSize: 11, lineHeight: '16px', padding: '0 4px', margin: 0, flexShrink: 0 }}>非Git</Tag>
                    )}
                  </div>
                  <span style={{ color: '#888', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.path}</span>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  )
}

export default ProjectList
