import fs from 'fs'
import path from 'path'
import os from 'os'
import { WorkflowConfig, WorkflowStep } from '@dev-flow/shared'

const CONFIG_DIR = path.join(os.homedir(), '.dev-flow')
const WORKFLOW_CONFIGS_FILE = path.join(CONFIG_DIR, 'workflow-configs.json')

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function readWorkflowConfigs(): WorkflowConfig[] {
  ensureConfigDir()
  if (!fs.existsSync(WORKFLOW_CONFIGS_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(WORKFLOW_CONFIGS_FILE, 'utf-8')
    return JSON.parse(data) as WorkflowConfig[]
  } catch {
    return []
  }
}

function writeWorkflowConfigs(configs: WorkflowConfig[]): void {
  ensureConfigDir()
  fs.writeFileSync(WORKFLOW_CONFIGS_FILE, JSON.stringify(configs, null, 2))
}

export function getDefaultWorkflowSteps(): WorkflowStep[] {
  return [
    { id: 'todo', name: '待开发', order: 0, color: '#d9d9d9', actions: [] },
    { id: 'dev', name: '开发中', order: 1, color: '#1677ff', actions: [] },
    { id: 'test', name: '测试中', order: 2, color: '#faad14', actions: [] },
    { id: 'done', name: '已上线', order: 3, color: '#52c41a', actions: [] }
  ]
}

export class WorkflowConfigService {
  static list(): WorkflowConfig[] {
    return readWorkflowConfigs()
  }

  static getByBizProjectId(bizProjectId: string): WorkflowConfig | null {
    const configs = readWorkflowConfigs()
    return configs.find(c => c.bizProjectId === bizProjectId) || null
  }

  static getOrCreateDefault(bizProjectId: string): WorkflowConfig {
    const existing = WorkflowConfigService.getByBizProjectId(bizProjectId)
    if (existing) return existing
    return {
      id: 'wf-' + Date.now().toString(36).toUpperCase(),
      bizProjectId,
      steps: getDefaultWorkflowSteps(),
      createdAt: new Date().toISOString()
    }
  }

  static save(config: Omit<WorkflowConfig, 'id' | 'createdAt'> & { id?: string }): WorkflowConfig {
    const configs = readWorkflowConfigs()
    const idx = configs.findIndex(c => c.id === config.id)

    const now = new Date().toISOString()
    const toSave: WorkflowConfig = {
      ...config,
      id: config.id || 'wf-' + Date.now().toString(36).toUpperCase(),
      createdAt: config.id ? (configs[idx]?.createdAt || now) : now
    }

    if (idx >= 0) {
      configs[idx] = toSave
    } else {
      configs.push(toSave)
    }

    writeWorkflowConfigs(configs)
    return toSave
  }

  static remove(id: string): void {
    const configs = readWorkflowConfigs().filter(c => c.id !== id)
    writeWorkflowConfigs(configs)
  }

  static removeByBizProjectId(bizProjectId: string): void {
    const configs = readWorkflowConfigs().filter(c => c.bizProjectId !== bizProjectId)
    writeWorkflowConfigs(configs)
  }
}
