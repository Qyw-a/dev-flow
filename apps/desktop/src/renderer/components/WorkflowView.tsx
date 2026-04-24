import React from 'react'
import { Layout, Card, List, Tag, Empty } from 'antd'
import { useStore } from '../stores/useStore'

const { Sider, Content } = Layout

const presetWorkflows = [
  { name: 'Git Flow', description: 'main / develop / feature/* / release/* / hotfix/*', branches: ['main', 'develop', 'feature/', 'release/', 'hotfix/'] },
  { name: 'GitHub Flow', description: 'main + feature/*', branches: ['main', 'feature/'] },
  { name: 'GitLab Flow', description: 'main / production + feature/*', branches: ['main', 'production', 'feature/'] }
]

const WorkflowView: React.FC = () => {
  const { projects } = useStore()

  return (
    <Layout style={{ height: '100%' }}>
      <Sider width={320} theme="light" style={{ borderRight: '1px solid #f0f0f0', padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>工作流模板</div>
        <List
          size="small"
          dataSource={presetWorkflows}
          renderItem={(wf) => (
            <List.Item style={{ cursor: 'pointer', padding: '8px 0' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{wf.name}</div>
                <div style={{ color: '#888', fontSize: 12 }}>{wf.description}</div>
              </div>
            </List.Item>
          )}
        />
      </Sider>
      <Content style={{ padding: 16, overflow: 'auto' }}>
        <Card title="工作流配置" size="small">
          <Empty description="工作流配置功能开发中，敬请期待" />
        </Card>

        <Card title="项目绑定" size="small" style={{ marginTop: 16 }}>
          <List
            size="small"
            dataSource={projects}
            renderItem={(project) => (
              <List.Item>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{project.name}</span>
                  <Tag>未绑定</Tag>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </Content>
    </Layout>
  )
}

export default WorkflowView
