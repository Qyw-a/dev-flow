import React from 'react'
import { Layout, Menu } from 'antd'
import { useStore } from '../stores/useStore'

const { Header } = Layout

const AppHeader: React.FC = () => {
  const { mainView, setMainView } = useStore()

  const items = [
    { key: 'ticket', label: '需求管理' },
    { key: 'branch', label: '分支管理' },
    { key: 'workflow', label: '工作流配置' }
  ]

  return (
    <Header
      style={{
        height: 48,
        lineHeight: '48px',
        padding: '0 16px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: 24
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 16, color: '#1677ff' }}>
        DevFlow
      </div>
      <Menu
        mode="horizontal"
        selectedKeys={[mainView]}
        items={items}
        onClick={(e) => setMainView(e.key as 'ticket' | 'branch' | 'workflow')}
        style={{ flex: 1, borderBottom: 'none', lineHeight: '46px' }}
      />
    </Header>
  )
}

export default AppHeader
