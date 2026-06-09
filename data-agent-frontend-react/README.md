# DataAgent Frontend - React 版本

本项目是 DataAgent 的 React 前端实现,从 Nuxt.js/Vue 迁移而来。

## 🛠 技术栈

- **框架**: React 19 + TypeScript
- **UI 库**: Ant Design 6.x
- **路由**: React Router v7
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **构建工具**: Vite 8
- **包管理器**: pnpm

## 📂 目录结构

```
src/
├── assets/css/          # 样式文件
├── components/          # React 组件
│   ├── chat/           # 聊天相关组件
│   ├── common/         # 通用组件
│   └── ...
├── pages/              # 页面组件
│   ├── agent/          # Agent 相关页面
│   ├── knowledge/      # 知识库页面
│   ├── system/         # 系统管理页面
│   └── ...
├── services/           # API 服务层
│   ├── chat/           # 聊天服务
│   ├── agent/          # Agent 服务
│   └── ...
├── stores/             # Zustand stores
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
├── hooks/              # 自定义 Hooks
├── App.tsx             # 应用入口(路由配置)
└── main.tsx            # 主入口文件
```

## 🚀 快速开始

### 前置条件
- Node.js 20.x 或更高版本
- 已安装 pnpm (`npm install -g pnpm`)

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:3000

### 构建生产版本
```bash
pnpm build
```

## 🔄 从 Nuxt/Vue 迁移说明

### 核心变化对比

| 维度 | Nuxt/Vue (原项目) | React (新项目) |
|------|------------------|---------------|
| 框架 | Nuxt 4 (Vue 3) | React 19 |
| UI库 | Vuetify 3 | Ant Design 6.x |
| 路由 | Nuxt File-based Routing | React Router v7 |
| 状态管理 | Pinia | Zustand |
| 构建工具 | Nuxt Build | Vite 8 |
| 自动导入 | Nuxt Auto-imports | 显式 import |

### 迁移清单

#### ✅ 已完成
- [x] 项目基础结构搭建
- [x] Vite + TypeScript 配置
- [x] Ant Design 6.x 集成与主题配置
- [x] React Router v7 路由配置
- [x] Zustand 状态管理(chat store)
- [x] Axios HTTP 客户端配置
- [x] 聊天核心页面(ChatPage)
- [x] 聊天输入组件(ChatInputArea)
- [x] 聊天侧边栏(ChatSidebar)
- [x] 消息列表(ChatMessageList)
- [x] 样式系统迁移

#### ⏳ 待完成
- [ ] 其他服务层迁移(agent、datasource、graph等)
- [ ] 完整页面功能实现
- [ ] Markdown 渲染集成
- [ ] ECharts 图表集成
- [ ] SSE 流式响应实现
- [ ] 单元测试
- [ ] 性能优化

### 关键代码对照

#### 1. 状态管理

**Vue/Pinia:**
```typescript
import { defineStore } from 'pinia';

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>([]);
  
  async function loadSessions(agentId: number) {
    sessions.value = await chatService.getAgentSessions(agentId);
  }
  
  return { sessions, loadSessions };
});
```

**React/Zustand:**
```typescript
import { create } from 'zustand';

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  
  loadSessions: async (agentId: number) => {
    const sessions = await chatService.getAgentSessions(agentId);
    set({ sessions });
  },
}));
```

#### 2. 组件写法

**Vue:**
```vue
<template>
  <div class="chat-page">
    <ChatSidebar />
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '~/stores/chat';
const store = useChatStore();
</script>
```

**React:**
```tsx
import { useChatStore } from '@/stores/chat';
import ChatSidebar from '@/components/chat/ChatSidebar';

const ChatPage = () => {
  const store = useChatStore();
  
  return (
    <div className="chat-page">
      <ChatSidebar />
    </div>
  );
};
```

#### 3. 路由

**Nuxt (file-based):**
```
app/pages/chat.vue → /chat
```

**React Router:**
```tsx
<Route path="/chat" element={<ChatPage />} />
```

## 📝 开发规范

### 组件命名
- 使用 PascalCase: `ChatInputArea.tsx`
- 组件文件与组件名一致

### 导入顺序
```typescript
// 1. React 和相关库
import { useState, useEffect } from 'react';

// 2. 第三方库
import { Button } from 'antd';

// 3. 内部模块(按层级)
import { useChatStore } from '@/stores/chat';
import ChatSidebar from '@/components/chat/ChatSidebar';

// 4. 样式
import './styles.css';
```

### 类型定义
- 所有 props 必须有明确的类型
- 避免使用 `any`,使用 `unknown` 或具体类型
- 接口命名使用 `I` 前缀或直接名词

### 状态管理
- 全局状态使用 Zustand
- 局部状态使用 `useState`
- 复杂逻辑使用 `useReducer`

## 🔧 配置说明

### Vite 配置 (vite.config.ts)
- 路径别名: `@` → `src/`
- 代理配置: `/api` → `http://localhost:8065`
- 端口: 3000

### TypeScript 配置
- 严格模式启用
- 路径映射: `@/*` → `src/*`

### Ant Design 主题
主色调: `#c17f59` (与原 Vuetify 主题保持一致)

## 🐛 常见问题

### 1. 路径别名不生效
确保 `tsconfig.app.json` 中配置了 paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 2. Ant Design 样式未加载
检查 `main.tsx` 是否导入了 ConfigProvider

### 3. Zustand store 更新不触发重渲染
确保在组件中使用 store:
```tsx
const store = useChatStore();
// 直接使用 store.sessions 等
```

## 📚 参考资料

- [React 官方文档](https://react.dev/)
- [Ant Design 6.x](https://ant.design/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [React Router](https://reactrouter.com/)
- [Vite](https://vite.dev/)

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

Apache License 2.0

---

*从 Nuxt/Vue 迁移至 React - Powered by DataAgent Team*
