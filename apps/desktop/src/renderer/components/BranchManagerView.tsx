import React from 'react'
import { Layout, Radio } from 'antd'
import { ClusterOutlined, AppstoreOutlined } from '@ant-design/icons'
import ProjectList from './ProjectList'
import BatchToolbar from './BatchToolbar'
import BranchTable from './BranchTable'
import PublicBranchView from './PublicBranchView'
import LogPanel from './LogPanel'
import { useStore } from '../stores/useStore'

const { Sider, Content } = Layout

const BranchManagerView: React.FC = () => {
  const { viewMode, setViewMode } = useStore()

  return (
    <Layout style={{ height: '100%' }}>
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

export default BranchManagerView
