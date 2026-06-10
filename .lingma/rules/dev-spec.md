---
trigger: always_on
---
# DataAgent 项目开发规范

## 0. 关键上下文（最高优先级）

### 前端技术栈（data-agent-frontend-react）
- **框架**: React 19 + Vite 8（基于 Rollup 构建）
- **模式**: 纯 SPA 单页应用（无服务端渲染）
- **语言**: TypeScript 6（严格模式）。**严禁**使用 `.js` 文件，所有文件必须为 `.ts` 或 `.tsx`
- **UI 库**: Ant Design 6.x（必须使用 `<Button>`、`<Form>` 等组件，而非原生 HTML 元素）
- **状态管理**: Zustand 5（轻量级状态管理，不使用 Redux）
- **路由**: React Router DOM 7.x
- **HTTP 客户端**: Axios 1.x
- **图表库**: ECharts 6.x
- **代码规范**: ESLint + TypeScript ESLint + Prettier
- **路径别名**: `@/` 指向 `src/` 目录

### 后端技术栈（data-agent-management）
- **开发语言**: Java 17+
- **核心框架**: Spring Boot 3.4.8 + Spring AI Alibaba 1.1.0.0
- **构建工具**: Maven（多层 Makefile 协调构建）
- **AI 能力**: Text-to-SQL（StateGraph 驱动）、RAG 向量检索、Python 代码执行器
- **数据库**: MyBatis + 多数据源支持（MySQL/PostgreSQL/达梦等）
- **代码规范**: Spring JavaFormat + CheckStyle + Spotless
- **测试框架**: JUnit 5 + TestContainers

### 项目架构
- **前端工程**: data-agent-frontend-react（React + TS + Ant Design）
- **后端工程**: data-agent-management（Spring Boot + Spring AI Alibaba）
- **代理端口**: 前端开发服务器运行在 8999 端口，通过 Vite Proxy 代理到后端 8065 端口
- **API 路径**: `/api/*` 和 `/nl2sql/*`

## 1. 知识检索协议（Knowledge Retrieval）

在回答问题或编写代码之前，必须执行以下步骤：

### 1.1 框架层参考
- **React/Vite**: 涉及 React Hooks、Vite 配置时**必须**优先参考官方文档
- **Ant Design 6**: 使用组件前查阅 [antd v6 文档](https://ant.design/components/overview-cn)，注意 v6 的 API 变化
- **Spring Boot/Spring AI**: 后端开发参考 Spring 官方文档和 Spring AI Alibaba 文档

### 1.2 React 性能优化（强制执行）
编写、审查或重构 React 代码时，**必须**参考 `.agents/skills/vercel-react-best-practices` 中的规则：
- 避免不必要的重渲染
- 正确使用 `useMemo`、`useCallback`、`React.memo`
- 遵循 React Server Components 最佳实践（如适用）
- 组件拆分原则：单一职责、可复用性

### 1.3 技能文档检索
涉及以下场景时，先检索 `.agents/skills/` 目录下的技能文档：
- **Ant Design 组件**: `.agents/skills/ant-design/`
- **图表开发**: `.agents/skills/antv-g2-chart/`、`.agents/skills/antv-s2-expert/`
- **TypeScript 专家级建议**: `.agents/skills/typescript-expert/`
- **前端设计美学**: `.agents/skills/frontend-design/`
- **BI 专业技术**: `.agents/skills/bi-technical-expert/`
- **查询页面创建**: `.agents/skills/create-query-page/`、`.agents/skills/create-query-page-v2/`

### 1.4 本地上下文（Local Context）
修改现有组件或逻辑前，**必须读取**：
- 目标文件本身
- 相关依赖文件（imports/exports）
- 类型定义文件（`types/` 目录）
- 服务层代码（`services/` 目录）
- Store 状态管理（`stores/` 目录）

### 1.5 查重机制（Similarity Check）
- **原则**: "先存在，后创建"（Exist before Create）
- 如果发现已存在类似功能的代码，**必须**优先考虑复用，而不是新建
- 检查范围：
  - `src/components/`: 可复用 UI 组件
  - `src/hooks/`: 自定义 Hooks
  - `src/utils/`: 工具函数
  - `src/services/`: API 服务层

### 1.6 类型定义优先
- 优先引用 `src/types/` 或同级目录下的 `.ts` 类型定义
- **禁止**凭空猜测数据结构，必须从实际 API 响应或已有类型中推导
- 新类型定义应添加到 `src/types/` 目录并导出

## 2. 编码规范（Coding Standards）

### 2.1 严格 TypeScript（零容忍 any）
- 所有变量、参数、返回值必须有明确的类型定义
- **严禁**使用 `any` 类型，如需临时绕过使用 `unknown` 并进行类型守卫
- 启用 TypeScript 严格模式（`strict: true`）
- 接口命名使用 PascalCase，以 `I` 开头或直接使用名词（如 `User`、`IUserConfig`）
- 类型别名使用 PascalCase，以 `Type` 结尾（如 `UserRoleType`）
- 泛型参数使用单个大写字母（如 `<T>`、`<K, V>`）或描述性名称（如 `<ItemType>`）

### 2.2 文档先行（Documentation First）
生成代码时，必须包含标准的 JSDoc/TSDoc 注释：

**组件文档示例**:
```typescript
/**
 * @description 业务知识管理页面，支持知识的增删改查和分类展示
 * @example
 * ```tsx
 * <BusinessKnowledge />
 * ```
 */
export const BusinessKnowledge: React.FC = () => {
  // ...
}
```

**Props 文档示例**:
```typescript
interface AgentCardProps {
  /** 智能体唯一标识 */
  agentId: string;
  /** 智能体名称 */
  name: string;
  /** 是否显示操作按钮，默认为 true */
  showActions?: boolean;
  /** 点击卡片时的回调 */
  onClick?: (agentId: string) => void;
}
```

**函数文档示例**:
```typescript
/**
 * @description 获取智能体列表
 * @param params - 查询参数
 * @param params.page - 页码，从 1 开始
 * @param params.pageSize - 每页数量，默认 10
 * @returns 分页的智能体列表数据
 * @throws {Error} 当网络请求失败时抛出错误
 */
export const fetchAgentList = async (
  params: { page: number; pageSize?: number }
): Promise<PaginatedResponse<Agent>> => {
  // ...
}
```

### 2.3 架构结构与目录组织

#### 前端目录结构（data-agent-frontend-react/src/）
```
src/
├── components/     # 可复用 UI 组件（按功能模块分目录）
│   ├── common/     # 通用组件（Button、Input 等封装）
│   ├── business/   # 业务组件（AgentCard、KnowledgeTable 等）
│   └── layout/     # 布局组件（Header、Sidebar 等）
├── pages/          # 页面组件（路由级别的组件）
│   ├── home/       # 首页
│   ├── agent/      # 智能体管理
│   ├── datasource/ # 数据源管理
│   └── chat/       # 对话分析页面
├── services/       # API 服务层（按业务模块分目录）
│   ├── agent/      # 智能体相关 API
│   ├── chat/       # 对话相关 API
│   └── datasource/ # 数据源相关 API
├── stores/         # Zustand 状态管理
│   └── chat.ts     # 对话状态 store
├── hooks/          # 自定义 React Hooks
│   └── useAgent.ts # 智能体相关 hook
├── utils/          # 工具函数
│   ├── request.ts  # Axios 封装
│   ├── format.ts   # 数据格式化
│   └── validate.ts # 表单验证
├── types/          # TypeScript 类型定义
│   ├── agent.ts    # 智能体类型
│   └── common.ts   # 通用类型
├── assets/         # 静态资源（图片、样式等）
├── App.tsx         # 根组件
└── main.tsx        # 入口文件
```

#### 后端目录结构（data-agent-management/src/main/java/）
```
com.alibaba.cloud.ai.dataagent/
├── controller/     # REST API 控制器
├── service/        # 业务逻辑层
│   └── impl/       # 服务实现
├── repository/     # 数据访问层（MyBatis Mapper）
├── entity/         # 实体类（数据库表映射）
├── dto/            # 数据传输对象
├── config/         # 配置类
├── graph/          # StateGraph 节点定义
├── mcp/            # MCP 服务器实现
└── util/           # 工具类
```

### 2.4 API 调用规范
- **统一使用 Axios**，所有服务层代码存放在 `src/services/` 目录
- 每个业务模块独立一个目录，包含 `index.ts` 导出所有 API
- API 函数命名规范：`fetch{Resource}{Action}`（如 `fetchAgentList`、`createDatasource`）
- 错误处理：使用 try-catch 包裹，返回统一的错误格式
- 请求拦截器：统一添加 token、请求日志
- 响应拦截器：统一处理错误码、数据解包

### 2.5 React Hooks 使用规范
- **必须**使用函数式组件 + Hooks，**禁止**使用类组件
- 常用 Hooks：`useState`、`useEffect`、`useMemo`、`useCallback`、`useRef`、`useContext`
- 自定义 Hooks 命名必须以 `use` 开头（如 `useAgentList`、`useChatSession`）
- `useEffect` 依赖数组必须完整，避免遗漏依赖导致闭包陷阱
- 避免在条件语句或循环中调用 Hooks

### 2.6 Ant Design 6 使用规范
- **必须**使用 Ant Design 组件，而非原生 HTML 元素
  - ✅ `<Button type="primary">提交</Button>`
  - ❌ `<button className="btn-primary">提交</button>`
- Form 表单项正确使用：
  - 普通字段直接在 `Form.Item` 中使用控件
  - `noStyle shouldUpdate` 仅用于监听其他字段变化的复杂场景
  - 避免不必要的嵌套导致表单值绑定失败
- 表格使用 `Table` 组件，配合 `columns` 定义列配置
- 模态框使用 `Modal` 组件，控制 `open` 属性显示隐藏
- 消息提示使用 `message`、`notification`、`Modal.confirm` 等

### 2.7 Zustand 状态管理规范
- Store 文件放在 `src/stores/` 目录
- 使用 `create` 函数创建 store，结合 `persist` 中间件持久化（如需要）
- State 更新使用 immer 风格的 setState（直接修改 draft）
- 避免在 store 中存放派生状态，使用 selector 或 useMemo 计算
- Store 命名规范：`use{Name}Store`（如 `useChatStore`）

### 2.8 样式规范
- 使用 CSS Modules 或 styled-components（根据项目配置）
- 类名使用 kebab-case（如 `.agent-card`）
- 避免内联样式，除非是动态计算的样式
- 响应式设计使用 Ant Design 的 Grid 系统或 CSS Media Queries
- 颜色、间距等设计令牌统一定义在主题配置中

## 3. 复用与重构策略（Reuse & Refactor）

### 3.1 DRY 原则（拒绝重复）
- **禁止**生成重复的工具函数或极其相似的 UI 组件
- 如果发现现有组件/函数满足当前 **80%** 的需求，**严禁**复制一份代码进行修改
- 检查清单：
  - `src/components/` 中是否有相似组件
  - `src/hooks/` 中是否有相似逻辑
  - `src/utils/` 中是否有相似工具函数
  - `src/services/` 中是否有相似 API 调用

### 3.2 多态扩展（Polymorphic Extension）
- **方案**: 通过增加 **可选属性（Optional Props）**、**泛型（Generics）** 或 **回调策略** 来扩展现有组件/函数
- **示例**:
  ```typescript
  // ❌ 错误：复制组件
  const AgentCardWithDelete = () => { /* ... */ }
  
  // ✅ 正确：通过 props 扩展
  interface AgentCardProps {
    showDelete?: boolean;
    onDelete?: (id: string) => void;
  }
  ```

### 3.3 安全护栏（Guardrail）
- 重构时必须保证 **向后兼容性（Backward Compatibility）**
- **示例**:
  ```typescript
  // 原函数
  const fetchData = (id: string) => { /* ... */ }
  
  // ✅ 正确：新增可选参数
  const fetchData = (id: string, options?: FetchOptions) => { /* ... */ }
  
  // ❌ 错误：修改必填参数
  const fetchData = (id: string, newParam: string) => { /* ... */ }
  ```
- API 变更时提供迁移指南或废弃警告（使用 `@deprecated` JSDoc）

### 3.4 重构触发器
当你发现以下情况时，**立即停止**并考虑重构：
- 复制粘贴代码超过 3 行
- 同一逻辑在 3 个以上地方出现
- 函数/组件超过 200 行
- 嵌套层级超过 3 层
- 单个文件超过 500 行

**重构行动**:
- 将公共逻辑提取到 `src/utils/` 或 `src/hooks/`
- 将重复 UI 提取为可复用组件到 `src/components/common/`
- 更新所有引用点，确保向后兼容
- 编写单元测试覆盖重构后的代码

## 4. 协作协议

### 4.1 文档管理
- **禁止**手动修改文档，文档由自动化脚本生成
- API 文档通过 SpringDoc OpenAPI 自动生成（后端）
- 前端组件文档通过 JSDoc + TypeDoc 生成（如需要）
- README 等核心文档保持更新，但详细技术文档由代码注释生成

### 4.2 代码检查（提交前强制）
提交代码前，必须确保通过以下检查：

#### 前端检查
```bash
# TypeScript 类型检查（无 Type Error）
npm run build  # 或 npx tsc --noEmit

# ESLint 代码质量检查
npm run lint

# Prettier 代码格式化
npx prettier --write src/
```

**检查项**:
- ✅ 无 TypeScript 类型错误
- ✅ 无 ESLint 错误或警告
- ✅ 代码格式符合 Prettier 规范
- ✅ 无 console.log 遗留（生产代码）
- ✅ 无 debugger 语句
- ✅ 无未使用的 imports/variables

#### 后端检查
```bash
# Maven 构建 + 代码检查
mvn clean verify

# 单独运行代码格式检查
mvn spring-javaformat:apply
mvn spotless:apply

# 运行单元测试
mvn test
```

**检查项**:
- ✅ 通过 Checkstyle 代码规范检查
- ✅ 通过 Spring JavaFormat 格式化
- ✅ 通过 Spotless 代码清理
- ✅ 所有单元测试通过
- ✅ 无编译警告

### 4.3 Git 提交规范
- 使用语义化提交信息（Conventional Commits）
- 格式：`<type>(<scope>): <subject>`
- 类型：`feat`、`fix`、`docs`、`style`、`refactor`、`test`、`chore`
- 示例：
  ```
  feat(agent): 添加智能体批量删除功能
  fix(chat): 修复消息列表滚动异常
  docs(readme): 更新安装说明
  ```

### 4.4 分支管理
- `main`: 主分支，保持稳定可发布状态
- `develop`: 开发分支，日常开发合并到此分支
- `feature/*`: 功能分支，从 develop 检出
- `hotfix/*`: 热修复分支，从 main 检出
- 提交 PR/MR 前确保代码通过所有检查

### 4.5 Code Review 清单
- [ ] 代码是否符合 TypeScript 严格模式
- [ ] 是否添加了必要的 JSDoc 注释
- [ ] 是否有重复代码可以提取
- [ ] 是否遵循了 DRY 原则
- [ ] 错误处理是否完善
- [ ] 是否有性能问题（不必要的重渲染、内存泄漏等）
- [ ] 是否通过了所有自动化检查
- [ ] 是否有对应的单元测试（如需要）

## 5. DataAgent 特定规范

### 5.1 智能体（Agent）开发
- 智能体配置存储在数据库中，通过 `agent` 服务层管理
- 智能体运行基于 StateGraph，节点定义在 `graph/` 目录
- 新增智能体类型时，必须同时更新前端类型定义和后端 DTO

### 5.2 Text-to-SQL 流程
- 用户输入 → 意图识别 → SQL 生成 → 执行 → 结果展示
- 每个阶段都有对应的 Graph Node
- 支持人工反馈机制，用户可在计划阶段干预

### 5.3 数据源管理
- 支持多种数据库：MySQL、PostgreSQL、达梦、Greenplum 等
- 数据源配置包含连接信息、表结构元数据
- 向量存储用于 RAG 增强，提升 SQL 准确性

### 5.4 对话会话管理
- 使用 Zustand store 管理对话状态（`src/stores/chat.ts`）
- 会话历史持久化到后端数据库
- 支持多轮对话上下文保持

### 5.5 报告生成
- 使用 ECharts 进行数据可视化
- 支持 HTML/Markdown 格式输出
- Python 代码执行器用于深度分析（统计、预测等）

### 5.6 MCP 服务器
- DataAgent 作为 MCP Tool Server 提供 NL2SQL 能力
- 遵循 Model Context Protocol 规范
- 可被其他 AI 应用集成调用

## 6. 常见问题与最佳实践

### 6.1 React 性能优化
- 使用 `React.memo` 包裹纯展示组件
- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 缓存回调函数
- 避免在 JSX 中定义内联函数/对象
- 大列表使用虚拟滚动（如 `rc-virtual-list`）

### 6.2 表单处理
- 使用 Ant Design Form 统一管理表单状态
- 复杂表单拆分为多个子 Form 或使用 Form.List
- 表单验证规则统一定义，避免硬编码
- 异步验证使用 `validator` 属性

### 6.3 错误边界
- 使用 React Error Boundary 捕获组件错误
- API 请求错误统一在拦截器中处理
- 展示友好的错误提示，避免白屏

### 6.4 国际化（如需要）
- 使用 react-i18next 或类似库
- 所有用户可见文本必须支持国际化
- 翻译文件放在 `src/locales/` 目录

### 6.5 环境变量
- 开发环境：`.env.development`
- 生产环境：`.env.production`
- 通过 `import.meta.env.VITE_*` 访问
- **禁止**在前端代码中硬编码敏感信息（API Key、密码等）
