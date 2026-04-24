import React, { useState, useEffect, useCallback } from 'react'
import { Layout, Card, Button, Input, Empty, message, Space, Tag, Tooltip, Divider } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SaveOutlined,
  BranchesOutlined,
  MergeCellsOutlined,
  RocketOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useStore } from '../stores/useStore'
import { useWorkflowConfigs } from '../hooks/useWorkflowConfigs'
import { WorkflowConfig, WorkflowStep, WorkflowStepAction } from '@branch-manager/shared'

const { Sider, Content } = Layout

const PRESET_COLORS = [
  '#d9d9d9', '#1677ff', '#faad14', '#52c41a',
  '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96'
]

function createEmptyStep(order: number): WorkflowStep {
  return {
    id: 'step-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: '新步骤',
    order,
    color: '#1677ff',
    actions: []
  }
}

function sortSteps(steps: WorkflowStep[]): WorkflowStep[] {
  return [...steps].sort((a, b) => a.order - b.order)
}

function reorderSteps(steps: WorkflowStep[]): WorkflowStep[] {
  return sortSteps(steps).map((s, i) => ({ ...s, order: i }))
}

function getActionOfType(step: WorkflowStep, type: WorkflowStepAction['type']): WorkflowStepAction | undefined {
  return step.actions.find(a => a.type === type)
}

function setAction(step: WorkflowStep, action: WorkflowStepAction): WorkflowStep {
  const filtered = step.actions.filter(a => a.type !== action.type)
  return { ...step, actions: [...filtered, action] }
}

function removeAction(step: WorkflowStep, type: WorkflowStepAction['type']): WorkflowStep {
  return { ...step, actions: step.actions.filter(a => a.type !== type) }
}

const WorkflowView: React.FC = () => {
  const { bizProjects } = useStore()
  const { getByBizProjectId, save } = useWorkflowConfigs()

  const [selectedBizProjectId, setSelectedBizProjectId] = useState<string | null>(null)
  const [config, setConfig] = useState<WorkflowConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!selectedBizProjectId) {
      setConfig(null)
      return
    }
    setLoading(true)
    getByBizProjectId(selectedBizProjectId)
      .then(c => setConfig(c))
      .finally(() => setLoading(false))
  }, [selectedBizProjectId, getByBizProjectId])

  const handleAddStep = useCallback(() => {
    if (!config) return
    const steps = sortSteps(config.steps)
    const newStep = createEmptyStep(steps.length)
    setConfig({ ...config, steps: [...config.steps, newStep] })
  }, [config])

  const handleUpdateStep = useCallback((stepId: string, updater: (step: WorkflowStep) => WorkflowStep) => {
    if (!config) return
    setConfig({
      ...config,
      steps: config.steps.map(s => s.id === stepId ? updater(s) : s)
    })
  }, [config])

  const handleRemoveStep = useCallback((stepId: string) => {
    if (!config) return
    const nextSteps = reorderSteps(config.steps.filter(s => s.id !== stepId))
    setConfig({ ...config, steps: nextSteps })
  }, [config])

  const handleMoveStep = useCallback((stepId: string, direction: -1 | 1) => {
    if (!config) return
    const sorted = sortSteps(config.steps)
    const idx = sorted.findIndex(s => s.id === stepId)
    if (idx < 0) return
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= sorted.length) return
    const next = [...sorted]
    const temp = next[idx]
    next[idx] = next[newIdx]
    next[newIdx] = temp
    setConfig({ ...config, steps: reorderSteps(next) })
  }, [config])

  const handleSave = useCallback(async () => {
    if (!config) return
    setSaving(true)
    try {
      const toSave = { ...config, steps: reorderSteps(config.steps) }
      await save(toSave)
      setConfig(toSave)
      message.success('工作流配置保存成功')
    } catch (err: any) {
      message.error('保存失败: ' + (err.message || String(err)))
    } finally {
      setSaving(false)
    }
  }, [config, save])

  return (
    <Layout style={{ height: '100%' }}>
      <Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0', padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>业务项目</div>
        {bizProjects.length === 0 ? (
          <Empty description="暂无业务项目" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {bizProjects.map(bp => (
              <div
                key={bp.id}
                onClick={() => setSelectedBizProjectId(bp.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: selectedBizProjectId === bp.id ? '#e6f4ff' : 'transparent',
                  border: selectedBizProjectId === bp.id ? '1px solid #91caff' : '1px solid transparent',
                  fontWeight: selectedBizProjectId === bp.id ? 500 : 400,
                  transition: 'all 0.2s'
                }}
              >
                {bp.name}
              </div>
            ))}
          </Space>
        )}
      </Sider>

      <Content style={{ padding: 16, overflow: 'auto' }}>
        {!selectedBizProjectId ? (
          <Empty description="请选择左侧业务项目进行配置" style={{ marginTop: 120 }} />
        ) : loading ? (
          <Empty description="加载中..." style={{ marginTop: 120 }} />
        ) : !config ? (
          <Empty description="配置加载失败" style={{ marginTop: 120 }} />
        ) : (
          <div style={{ maxWidth: 720 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                <SettingOutlined style={{ marginRight: 8 }} />
                工作流配置
              </div>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
                保存配置
              </Button>
            </div>

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {sortSteps(config.steps).map((step, index) => (
                <StepEditorCard
                  key={step.id}
                  step={step}
                  index={index}
                  total={config.steps.length}
                  onUpdate={(updater) => handleUpdateStep(step.id, updater)}
                  onRemove={() => handleRemoveStep(step.id)}
                  onMove={(dir) => handleMoveStep(step.id, dir)}
                />
              ))}
            </Space>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddStep}
              style={{ width: '100%', marginTop: 16 }}
            >
              添加步骤
            </Button>
          </div>
        )}
      </Content>
    </Layout>
  )
}

// --- Step Editor Card ---

interface StepEditorCardProps {
  step: WorkflowStep
  index: number
  total: number
  onUpdate: (updater: (step: WorkflowStep) => WorkflowStep) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}

const StepEditorCard: React.FC<StepEditorCardProps> = ({ step, index, total, onUpdate, onRemove, onMove }) => {
  const createBranchAction = getActionOfType(step, 'createBranch')
  const mergeAction = getActionOfType(step, 'mergeToBranch')
  const deployAction = getActionOfType(step, 'triggerDeploy')

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
          <Tag color={step.color}>{index + 1}</Tag>
          <Input
            value={step.name}
            onChange={(e) => onUpdate(s => ({ ...s, name: e.target.value }))}
            style={{ width: 160, fontWeight: 500 }}
            size="small"
            placeholder="步骤名称"
          />
          <Space size={4} style={{ marginLeft: 'auto' }}>
            {PRESET_COLORS.map(c => (
              <div
                key={c}
                onClick={() => onUpdate(s => ({ ...s, color: c }))}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: c,
                  cursor: 'pointer',
                  border: step.color === c ? '2px solid #000' : '2px solid transparent'
                }}
              />
            ))}
            <Tooltip title="上移">
              <Button size="small" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => onMove(-1)} />
            </Tooltip>
            <Tooltip title="下移">
              <Button size="small" icon={<ArrowDownOutlined />} disabled={index === total - 1} onClick={() => onMove(1)} />
            </Tooltip>
            <Tooltip title="删除">
              <Button size="small" danger icon={<DeleteOutlined />} onClick={onRemove} />
            </Tooltip>
          </Space>
        </div>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {/* Create Branch Action */}
        <ActionRow
          icon={<BranchesOutlined />}
          title="自动创建分支"
          enabled={!!createBranchAction}
          onToggle={(enabled) => {
            if (enabled) {
              onUpdate(s => setAction(s, { type: 'createBranch', template: 'feature/{ticketId}-{shortTitle}', baseBranch: '' }))
            } else {
              onUpdate(s => removeAction(s, 'createBranch'))
            }
          }}
        >
          {createBranchAction && createBranchAction.type === 'createBranch' && (
            <>
              <Space style={{ marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ color: '#888', fontSize: 12 }}>分支模板:</span>
                <Input
                  size="small"
                  value={createBranchAction.template}
                  onChange={(e) => onUpdate(s => setAction(s, { ...createBranchAction, template: e.target.value }))}
                  style={{ width: 280 }}
                  placeholder="feature/{ticketId}-{shortTitle}"
                />
                <span style={{ color: '#888', fontSize: 12 }}>基于分支:</span>
                <Input
                  size="small"
                  value={createBranchAction.baseBranch || ''}
                  onChange={(e) => onUpdate(s => setAction(s, { ...createBranchAction, baseBranch: e.target.value || undefined }))}
                  style={{ width: 120 }}
                  placeholder="默认当前分支"
                />
              </Space>
              <div style={{ marginTop: 4, color: '#888', fontSize: 11 }}>
                可用变量：{'{ticketId}'} {'{title}'} {'{shortTitle}'} {'{date}'} {'{yyyyMMdd}'} {'{datetime}'} {'{time}'} {'{author}'}
              </div>
            </>
          )}
        </ActionRow>

        <Divider style={{ margin: '8px 0' }} />

        {/* Merge Action */}
        <ActionRow
          icon={<MergeCellsOutlined />}
          title="自动合并到分支"
          enabled={!!mergeAction}
          onToggle={(enabled) => {
            if (enabled) {
              onUpdate(s => setAction(s, { type: 'mergeToBranch', targetBranch: '', push: true }))
            } else {
              onUpdate(s => removeAction(s, 'mergeToBranch'))
            }
          }}
        >
          {mergeAction && mergeAction.type === 'mergeToBranch' && (
            <Space style={{ marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ color: '#888', fontSize: 12 }}>目标分支:</span>
              <Input
                size="small"
                value={mergeAction.targetBranch}
                onChange={(e) => onUpdate(s => setAction(s, { ...mergeAction, targetBranch: e.target.value }))}
                style={{ width: 200 }}
                placeholder="如 main、{versionBranch}"
              />
              <label style={{ fontSize: 12, color: '#888', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={mergeAction.push !== false}
                  onChange={(e) => onUpdate(s => setAction(s, { ...mergeAction, push: e.target.checked }))}
                  style={{ marginRight: 4 }}
                />
                合并后推送
              </label>
            </Space>
          )}
        </ActionRow>

        <Divider style={{ margin: '8px 0' }} />

        {/* Trigger Deploy Action */}
        <ActionRow
          icon={<RocketOutlined />}
          title="触发发布（预留）"
          enabled={!!deployAction}
          onToggle={(enabled) => {
            if (enabled) {
              onUpdate(s => setAction(s, { type: 'triggerDeploy', deployType: 'webhook', config: {} }))
            } else {
              onUpdate(s => removeAction(s, 'triggerDeploy'))
            }
          }}
        >
          {deployAction && (
            <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
              CI/CD 发布触发功能开发中，当前仅作为占位配置。
            </div>
          )}
        </ActionRow>
      </Space>
    </Card>
  )
}

// --- Action Row ---

interface ActionRowProps {
  icon: React.ReactNode
  title: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
  children?: React.ReactNode
}

const ActionRow: React.FC<ActionRowProps> = ({ icon, title, enabled, onToggle, children }) => {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span style={{ color: '#555' }}>{icon}</span>
        <span style={{ fontWeight: 500 }}>{title}</span>
      </label>
      {enabled && children}
    </div>
  )
}

export default WorkflowView
