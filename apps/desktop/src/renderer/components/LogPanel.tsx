import React from 'react'
import { List, Tag, Button, Space } from 'antd'
import { ClearOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useStore } from '../stores/useStore'

const LogPanel: React.FC = () => {
  const { logs, clearLogs } = useStore()

  return (
    <div style={{ height: 200, display: 'flex', flexDirection: 'column', borderTop: '1px solid #f0f0f0' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
        <span style={{ fontWeight: 500 }}>操作日志</span>
        <Button size="small" icon={<ClearOutlined />} onClick={clearLogs} disabled={logs.length === 0}>
          清空
        </Button>
      </div>
      <List
        size="small"
        style={{ flex: 1, overflow: 'auto', padding: '0 12px' }}
        dataSource={logs}
        locale={{ emptyText: '暂无操作记录' }}
        renderItem={(log) => (
          <List.Item style={{ padding: '4px 0', borderBottom: 'none' }}>
            <Space wrap>
              <span style={{ color: '#888', fontSize: 12 }}>{log.time}</span>
              <span style={{ fontWeight: 500, fontSize: 13 }}>{log.projectName}</span>
              <Tag color={log.success ? 'success' : 'error'} icon={log.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                {log.action}
              </Tag>
              <span style={{ fontSize: 13, color: log.success ? '#333' : '#cf1322' }}>{log.message}</span>
            </Space>
          </List.Item>
        )}
      />
    </div>
  )
}

export default LogPanel
