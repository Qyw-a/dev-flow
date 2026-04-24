import React, { useEffect } from 'react'
import { Layout, message, Radio } from 'antd'
import { ClusterOutlined, AppstoreOutlined } from '@ant-design/icons'
import ProjectList from './components/ProjectList'
import BatchToolbar from './components/BatchToolbar'
import BranchTable from './components/BranchTable'
import PublicBranchView from './components/PublicBranchView'
import LogPanel from './components/LogPanel'
import { useProjects } from './hooks/useProjects'
import { useStore } from './stores/useStore'

const { Sider, Content } = Layout

const App: React.FC = () => {
  const { refresh } = useProjects()
  const { viewMode, setViewMode } = useStore()

  useEffect(() => {
    refresh().catch((err) => {
      message.error('加载项目失败: ' + err.message)
    })
  }, [refresh])

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={320} theme="light" style={{ borderRight: '1px solid #f0f0f0', padding: 16 }}>
        <ProjectList />
      </Sider>
      <Layout>
        <Content style={{ padding: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <BatchToolbar />
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: <><AppstoreOutlined /> 按项目</>, value: 'project' },
                { label: <><ClusterOutlined /> 按分支</>, value: 'branch' }
              ]}
            />
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {viewMode === 'project' ? <BranchTable /> : <PublicBranchView />}
          </div>
        </Content>
        <LogPanel />
      </Layout>
    </Layout>
  )
}

export default App
