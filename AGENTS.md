# Branch Manager — AI Agent 项目指南

> 本文档面向 AI 编程助手。阅读前默认你对本项目一无所知。所有内容基于当前代码库的实际情况，不做假设性推断。

---

## 项目概述

Branch Manager 是一款面向多项目团队的**需求-分支关联管理桌面应用**。它基于 Electron 构建，帮助开发者：

- 统一管理多个本地 Git 仓库的项目目录
- 执行分支的创建、合并、推送、删除、切换等操作
- 按项目或按分支名聚合查看分支状态
- 将业务需求（Ticket）与具体分支跨项目关联
- 批量在多个项目中执行相同的 Git 操作

当前版本为 v1.0.0，UI 语言为中文，界面使用 Ant Design 5 组件库。

---

## 技术栈与运行时架构

### 核心技术

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 29 (main + preload + renderer 三进程) |
| 前端框架 | React 18 + TypeScript 5.3 |
| 构建工具 | Vite 5 + electron-vite 2 |
| UI 组件库 | Ant Design 5 (antd) + @ant-design/icons |
| 状态管理 | Zustand 4 |
| Git 操作 | simple-git (Node.js Git 封装) |
| 包管理 | pnpm (monorepo workspace) |

### 架构分层

本项目采用 **pnpm workspace monorepo** 结构：

```
branchManager/
├── apps/desktop/              # Electron 主程序（唯一可运行产物）
│   ├── src/main/              # 主进程 (Node.js)
│   │   ├── index.ts           # 入口：创建窗口、注册 IPC
│   │   ├── ipc/               # IPC 处理器（project / git / ticket / version）
│   │   └── services/          # 业务服务层 + JSON 文件持久化
│   ├── src/preload/           # 预加载脚本（contextBridge 暴露 API）
│   └── src/renderer/          # 渲染进程 (React)
│       ├── components/        # 页面组件
│       ├── hooks/             # 数据获取/业务 Hooks
│       ├── stores/            # Zustand 全局状态
│       └── types.ts           # 渲染进程类型定义
├── packages/git-core/         # Git 操作核心包
│   └── src/GitService.ts      # 基于 simple-git 的静态方法封装
├── packages/shared/           # 共享类型与仓库抽象
│   ├── src/types.ts           # 领域模型（Project/Ticket/Version 等）
│   └── src/repositories/      # Repository 模式接口 + Electron 实现
└── packages/module-support/   # 第三方模块系统支持（当前为占位包）
```

### 进程通信模型

- **主进程 (main)**：负责 Git 命令执行、文件系统读写、系统对话框（`dialog.showOpenDialog`）。
- **预加载脚本 (preload)**：通过 `contextBridge.exposeInMainWorld('api', api)` 将 `ipcRenderer.invoke` 封装成类型安全的 API 暴露给渲染进程。
- **渲染进程 (renderer)**：React 应用。不直接使用 Electron API，而是通过 `@branch-manager/shared` 中的 `repositories` 工厂调用预加载脚本暴露的方法。

IPC 通道命名规范：`domain:action`，例如 `git:createBranch`、`project:list`、`ticket:update`。

---

## 构建与运行命令

所有命令均在**仓库根目录**下通过 `pnpm` 执行：

```bash
# 安装依赖（会触发 postinstall，安装 Electron 原生依赖）
pnpm install

# 开发模式（热更新）
pnpm dev

# 类型检查
pnpm typecheck

# 构建生产包
pnpm build

# 预览生产构建
pnpm preview
```

`apps/desktop` 内部的独立命令（通常不需要直接执行）：

```bash
cd apps/desktop
pnpm dev          # electron-vite dev
pnpm build        # npm run typecheck && electron-vite build
pnpm typecheck    # tsc --noEmit -p tsconfig.json
pnpm preview      # electron-vite preview
pnpm postinstall  # electron-builder install-app-deps
```

`packages/*` 下的包仅提供 `pnpm typecheck`（`tsc --noEmit`），无独立构建产物，由 `electron-vite` 在构建桌面应用时通过路径别名直接引用源码。

---

## 代码组织与模块划分

### 主进程 (`src/main/`)

| 目录/文件 | 职责 |
|-----------|------|
| `index.ts` | 应用生命周期管理：窗口创建、IPC 注册、macOS `activate` 行为 |
| `ipc/*.ts` | IPC 事件注册。每个文件对应一个领域（project/git/ticket/version），将 IPC 事件映射到 Service 方法 |
| `services/*.ts` | 业务逻辑与数据持久化。直接读写 `~/.branch-manager/` 下的 JSON 文件 |

**持久化文件位置**（用户主目录下）：

- `~/.branch-manager/projects.json` — 项目列表
- `~/.branch-manager/tickets.json` — 需求列表
- `~/.branch-manager/ticket-branches.json` — 需求与分支的关联关系
- `~/.branch-manager/versions.json` — 版本列表

### 渲染进程 (`src/renderer/`)

| 目录 | 职责 |
|------|------|
| `components/` | React 组件。所有 UI 文本为中文。使用 Ant Design 组件 + inline style |
| `hooks/` | 自定义 Hooks，封装对 `repositories` 的数据操作与本地状态同步 |
| `stores/useStore.ts` | Zustand 全局状态树，管理项目、分支、需求、版本、日志、视图模式等 |
| `types.ts` | 渲染进程独有的类型（如 `LogEntry`） |

### 共享包 (`packages/shared/`)

采用 **Repository 模式**：

- `types.ts`：定义领域模型接口（`Project`, `Ticket`, `Version`, `TicketBranchLink` 等）
- `repositories/types.ts`：定义仓库接口契约（`ProjectRepository`, `GitRepository` 等）
- `repositories/electron/*.ts`：基于 `window.api.*` 的具体实现
- `repositories/index.ts`：`RepositoryFactory`，通过 getter 暴露各仓库实例

这种设计使得渲染进程的代码不直接依赖 Electron IPC，未来可方便地替换为 Web 端实现或其他运行时实现。

### Git 核心包 (`packages/git-core/`)

- `GitService.ts`：纯静态方法类，封装 `simple-git` 调用
- 支持的操作：分支列表、远程分支列表、创建、合并（支持 `--no-ff`）、推送、删除（支持强制）、切换、`mergeToBranch`、fetch、pull、批量操作
- 所有方法返回 `GitResult`（`{ success, message, projectId }`），不抛异常

---

## 代码风格与开发约定

### TypeScript 配置

- 严格模式开启：`"strict": true`
- 强制无未使用变量/参数：`"noUnusedLocals": true`, `"noUnusedParameters": true`
- 模块解析策略：`"moduleResolution": "bundler"`
- 允许导入 `.ts` 扩展名：`"allowImportingTsExtensions": true`
- JSX 转换：`"jsx": "react-jsx"`

### 路径别名

在 `apps/desktop` 中生效：

| 别名 | 指向 |
|------|------|
| `@renderer/*` | `apps/desktop/src/renderer/*` |
| `@main/*` | `apps/desktop/src/main/*` |
| `@branch-manager/git-core` | `packages/git-core/src/index.ts` |
| `@branch-manager/shared` | `packages/shared/src/index.ts` |

### 命名与风格

- 组件使用 `PascalCase`（如 `BranchManagerView.tsx`）
- Hooks 使用 `camelCase` 并以 `use` 开头（如 `useGitOps.ts`）
- Service 类使用静态方法（如 `ProjectService.add()`）
- IPC 通道使用 `小写领域:小写动作`（如 `git:createBranch`）
- 所有用户可见的字符串为**中文**（如 `'需求创建成功'`、`'项目未找到'`）
- 样式以 **inline style** 为主，少量使用 Ant Design 的 `style` prop，无 CSS Modules / styled-components / Tailwind

### 状态管理约定

- 全局共享状态放入 `stores/useStore.ts`（Zustand）
- 数据获取/副作用封装在 `hooks/` 中（如 `useProjects`, `useGitOps`, `useTickets`, `useVersions`）
- Hooks 内部负责调用 API 后同步更新 Zustand 状态，保持 UI 与数据一致

---

## 测试说明

**当前状态：未配置测试框架。**

代码库中不存在以下任何配置或测试文件：

- Jest / Vitest / Mocha
- Playwright / Cypress / Spectron
- `.test.ts` / `.spec.ts` 文件

`ROADMAP.md` 中已将"补充 IPC 层与 Service 层的单元测试"列为技术债务，但尚未实施。

如需添加测试，建议优先考虑：

1. `packages/git-core` 的纯函数/静态方法（可用 Vitest，无需 Electron 环境）
2. `packages/shared` 的 Repository 接口契约
3. `apps/desktop/src/main/services/` 的 JSON 读写逻辑（需 mock 文件系统）

---

## 安全注意事项

### 当前安全设置

- `contextIsolation: true` — 预加载脚本与页面 JS 隔离
- `sandbox: false` — **关闭沙箱**，因为 `simple-git` 需要执行 `git` 子进程并访问文件系统
- CSP 已在 `index.html` 中配置：
  ```html
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:">
  ```

### 风险点与注意事项

- 主进程直接调用 `simple-git` 执行本地 `git` 命令，需确保传入的路径和分支名经过校验，防止命令注入。当前代码中分支名和路径未做严格的过滤/转义，主要依赖 Node.js 的路径解析和 `simple-git` 的内部处理。
- 用户配置以明文 JSON 存储在用户主目录，无加密。
- 预加载脚本暴露的 `window.api` 对象在全局可用，任何渲染进程代码均可调用。当前应用为本地桌面工具，无外部网页加载，风险可控。

---

## 关键依赖版本

| 包 | 版本 |
|----|------|
| electron | ^29.0.0 |
| electron-vite | ^2.0.0 |
| electron-builder | ^24.12.0 |
| react | ^18.2.0 |
| antd | ^5.14.0 |
| zustand | ^4.5.1 |
| simple-git | ^3.22.0 |
| typescript | ^5.3.3 |
| vite | ^5.1.3 |

---

## 给 AI Agent 的实用提示

1. **修改 UI 文本时保持中文**：所有面向用户的提示、按钮、标题均为中文。
2. **新增 IPC 通道需三处同步**：main 进程的 `ipcMain.handle`、preload 的 `api` 对象、shared 包的 `Repository` 接口及 `Electron*` 实现。
3. **新增持久化数据**：参考现有 Service 模式，在 `~/.branch-manager/` 下新增 JSON 文件，使用 `fs.readFileSync`/`writeFileSync` + `JSON.parse`/`stringify`。
4. **Git 操作在主进程**：渲染进程不应直接引入 `simple-git`，所有 Git 调用必须通过 IPC 落到 `GitService`。
5. **路径别名在构建时解析**：`electron-vite.config.ts` 中定义了 `resolve.alias`，修改包位置需同步更新该配置。
6. **无测试基线**：当前修改代码后，验证方式以 `pnpm typecheck` 和手动运行 `pnpm dev` 为主。
