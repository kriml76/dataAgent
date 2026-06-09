# DataAgent 前端改造 - React 版本快速指南

## ✅ 改造完成情况

### 已完成的核心工作

#### 1. 项目基础架构 ✅
- ✅ 创建 React + TypeScript + Vite 项目
- ✅ 配置 Ant Design 6.x UI库
- ✅ 集成 React Router v7 路由系统
- ✅ 配置 Zustand 状态管理
- ✅ 配置 Axios HTTP客户端
- ✅ 设置路径别名 (@/ → src/)
- ✅ 配置开发服务器代理 (/api → http://localhost:8065)

#### 2. 核心功能迁移 ✅
- ✅ 聊天服务层 (chat service)
- ✅ 聊天状态管理 (chat store - Pinia → Zustand)
- ✅ 聊天页面 (ChatPage)
- ✅ 聊天输入组件 (ChatInputArea)
- ✅ 聊天侧边栏 (ChatSidebar)
- ✅ 消息列表 (ChatMessageList)
- ✅ 样式系统迁移 (CSS)

#### 3. 页面路由配置 ✅
已配置以下路由:
- `/` → 重定向到 `/agent/new`
- `/chat` → 聊天页面
- `/dashboard` → 仪表板
- `/agent/*` → Agent 相关页面
- `/knowledge/*` → 知识库页面
- `/system/*` → 系统管理页面
- `/prompt-config` → Prompt 配置

## 📁 项目结构

```
data-agent-frontend-react/
├── src/
│   ├── assets/css/          # 全局样式
│   │   └── main.css         # 主样式文件(从Vuetify主题迁移)
│   ├── components/          # React组件
│   │   ├── chat/           # 聊天组件
│   │   │   ├── ChatInputArea.tsx    ✅
│   │   │   ├── ChatSidebar.tsx      ✅
│   │   │   └── ChatMessageList.tsx  ✅
│   │   └── common/         # 通用组件
│   ├── pages/              # 页面组件
│   │   ├── ChatPage.tsx    ✅
│   │   ├── DashboardPage.tsx
│   │   ├── agent/          # Agent页面
│   │   ├── knowledge/      # 知识库页面
│   │   ├── system/         # 系统页面
│   │   └── prompt-config/  # Prompt配置
│   ├── services/           # API服务层
│   │   ├── chat/           ✅
│   │   └── common/         ✅
│   ├── stores/             # Zustand stores
│   │   └── chat.ts         ✅
│   ├── types/              # TypeScript类型
│   │   └── chat.ts         ✅
│   ├── utils/              # 工具函数
│   │   └── request.ts      ✅ (Axios配置)
│   ├── App.tsx             ✅ (路由配置)
│   └── main.tsx            ✅ (应用入口)
├── vite.config.ts          ✅
├── tsconfig.json           ✅
├── package.json            ✅
└── README.md               ✅
```

## 🚀 快速启动

### 1. 安装依赖
```bash
cd /Users/liubenjun/Desktop/DataAgent/data-agent-frontend-react
pnpm install
```

### 2. 启动开发服务器
```bash
pnpm dev
```

访问: http://localhost:3000 (或自动分配的端口)

### 3. 构建生产版本
```bash
pnpm build
```

## 🔄 技术栈对照表

| 原技术(Nuxt/Vue) | 新技术(React) | 说明 |
|-----------------|--------------|------|
| Nuxt 4 | Vite 8 + React 19 | 构建工具和框架 |
| Vue 3 Composition API | React Hooks | 组件编写方式 |
| Vuetify 3 | Ant Design 6.x | UI组件库 |
| Pinia | Zustand | 状态管理 |
| Vue Router | React Router v7 | 路由系统 |
| Nuxt Auto-imports | 显式 import | 模块导入方式 |
| `.vue` 单文件组件 | `.tsx` JSX组件 | 组件文件格式 |
| `ref()`, `computed()` | `useState()`, `useMemo()` | 响应式数据 |

## 📝 代码迁移示例

### 状态管理对比

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

### 组件写法对比

**Vue SFC:**
```vue
<template>
  <div class="chat-page">
    <v-btn @click="handleSend">发送</v-btn>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '~/stores/chat';
const store = useChatStore();

const handleSend = () => {
  store.sendMessage('Hello');
};
</script>
```

**React TSX:**
```tsx
import { useChatStore } from '@/stores/chat';
import { Button } from 'antd';

const ChatPage = () => {
  const store = useChatStore();
  
  const handleSend = () => {
    store.sendMessage('Hello');
  };
  
  return (
    <div className="chat-page">
      <Button onClick={handleSend}>发送</Button>
    </div>
  );
};
```

## ⚠️ 注意事项

### 1. 路径别名
- 使用 `@/` 代替 `~/`
- Vite 和 TypeScript 都已配置支持

### 2. 样式类名
- Vue: `class="xxx"`
- React: `className="xxx"`

### 3. 事件处理
- Vue: `@click="handler"`
- React: `onClick={handler}`

### 4. 条件渲染
- Vue: `v-if="condition"`
- React: `{condition && <Component />}`

### 5. 列表渲染
- Vue: `v-for="item in items"`
- React: `{items.map(item => <Component key={item.id} />)}`

## 🔧 待完成工作

### 高优先级
- [ ] 完善其他服务层(agent、datasource、graph等)
- [ ] 实现 SSE 流式响应
- [ ] Markdown 渲染集成
- [ ] ECharts 图表集成

### 中优先级
- [ ] 完善所有页面功能
- [ ] 添加表单验证
- [ ] 错误处理和边界情况
- [ ] 加载状态和骨架屏

### 低优先级
- [ ] 单元测试
- [ ] E2E测试
- [ ] 性能优化
- [ ] PWA支持

## 📊 迁移进度

- ✅ 基础架构: 100%
- ✅ 核心聊天功能: 70%
- ⏳ 服务层: 10% (仅chat完成)
- ⏳ 页面功能: 20% (仅chat页面完成)
- ⏳ 组件库: 30% (仅chat组件完成)

**总体进度: 约 30%**

## 💡 下一步建议

1. **立即可用**: 当前聊天核心功能已可运行,可以启动查看效果
2. **继续迁移**: 按照服务层 → 页面 → 组件的顺序逐步迁移
3. **并行开发**: 可以同时迁移多个独立模块
4. **测试验证**: 每完成一个模块就进行测试

## 🆘 常见问题

### Q: 如何访问原 Nuxt 项目的功能?
A: 原项目仍在 `data-agent-frontend-nuxt` 目录,可以继续使用

### Q: 两个项目会冲突吗?
A: 不会,它们是完全独立的项目,使用不同端口

### Q: 需要完全迁移吗?
A: 不一定,可以根据需求选择性地迁移核心功能

### Q: 遇到 TypeScript 错误怎么办?
A: 大部分是类型定义问题,可以暂时使用 `any` 类型,后续完善

## 📞 技术支持

如有问题,请参考:
- [React 官方文档](https://react.dev/)
- [Ant Design 文档](https://ant.design/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
- 项目 README.md

---

**迁移开始时间**: 2026-06-09  
**预计完成时间**: 根据实际进度调整  
**当前状态**: 核心框架搭建完成,聊天功能部分实现
