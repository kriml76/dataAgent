# TypeScript/ESLint 零错误迁移规范

## ✅ 核心原则

**所有迁移代码必须通过 TypeScript 编译和 ESLint 检查,不允许有任何错误或警告!**

## 📋 检查清单

### 1. 类型定义规范

#### ✅ 必须遵守
- [ ] 所有函数参数必须有明确类型
- [ ] 所有函数返回值必须有明确类型
- [ ] 禁止使用 `any` 类型,使用 `unknown` 或具体类型
- [ ] 接口命名使用 PascalCase
- [ ] 可选属性使用 `?` 标记

#### ❌ 禁止
```typescript
// 错误示例
const data: any = {};
function foo(param) { }  // 缺少参数类型
function bar(): any { }  // 避免返回 any
```

#### ✅ 正确示例
```typescript
interface UserData {
  id: number;
  name: string;
  email?: string;  // 可选属性
}

function getUser(id: number): Promise<UserData | null> {
  // ...
}
```

### 2. API 服务层规范

#### Axios 响应处理
由于我们配置了响应拦截器直接返回 `response.data`,所以:

```typescript
// ✅ 正确 - 直接使用泛型指定返回类型
async getUsers(): Promise<User[]> {
  return apiClient.get<User[]>('/users');
}

// ✅ 正确 - 处理可能的错误
async getUser(id: number): Promise<User | null> {
  try {
    return await apiClient.get<User>(`/users/${id}`);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

// ❌ 错误 - 不要访问 response.data
async getUsers() {
  const response = await apiClient.get('/users');
  return response.data;  // 错误!拦截器已经返回了 data
}
```

#### ApiResponse 处理
```typescript
// 对于包装的响应
interface ApiResponse<T = any> {
  code?: number;
  message?: string;
  success?: boolean;
  data?: T;
}

// 使用时
async getData(): Promise<MyData> {
  const response = await apiClient.get<ApiResponse<MyData>>('/data');
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || '请求失败');
}
```

### 3. React 组件规范

#### Props 类型
```typescript
// ✅ 使用 interface 定义 Props
interface ChatMessageProps {
  message: ChatMessage;
  onReply?: (messageId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onReply }) => {
  return <div>{message.content}</div>;
};

// ❌ 避免内联类型
const ChatMessage = ({ message }: { message: any }) => {
  // ...
};
```

#### State 类型
```typescript
// ✅ 明确类型
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);

// ❌ 避免让 TypeScript 推断为 any
const [data, setData] = useState(null);  // 类型为 null
```

#### Event Handlers
```typescript
// ✅ 明确事件类型
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  // ...
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

// ❌ 避免隐式 any
const handleClick = (e) => {  // e 的类型是 any
  // ...
};
```

### 4. Zustand Store 规范

```typescript
// ✅ 完整的类型定义
interface ChatStore {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  
  // Actions
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  
  addMessage: (message: ChatMessage) => 
    set((state) => ({ messages: [...state.messages, message] })),
  
  setLoading: (loading: boolean) => 
    set({ isLoading: loading }),
}));

// ❌ 避免缺少类型定义
export const useChatStore = create((set) => ({
  // TypeScript 无法推断类型
}));
```

### 5. 导入导出规范

#### 路径别名
```typescript
// ✅ 使用 @/ 别名
import { useChatStore } from '@/stores/chat';
import ChatService from '@/services/chat';
import type { ChatMessage } from '@/types/chat';

// ❌ 避免相对路径过深
import { useChatStore } from '../../stores/chat';
```

#### 类型导入
```typescript
// ✅ 使用 import type 导入纯类型
import type { ChatMessage, ChatSession } from '@/types/chat';
import { useChatStore } from '@/stores/chat';  // 运行时值

// ❌ 混合导入(虽然可以工作,但不清晰)
import { ChatMessage, useChatStore } from '@/...';
```

### 6. 常见错误及修复

#### 错误 1: JSX 元素隐式具有类型 "any"
```typescript
// ❌ 错误
const element = <div>Hello</div>;

// ✅ 修复 - 确保安装了 @types/react
// pnpm add -D @types/react @types/react-dom
```

#### 错误 2: 模块找不到
```typescript
// ❌ 错误 - 路径别名未配置
import Foo from '@/components/Foo';

// ✅ 修复 - 检查 vite.config.ts 和 tsconfig.json
// vite.config.ts:
// resolve: { alias: { '@': path.resolve(__dirname, './src') } }
```

#### 错误 3: 隐式 any 类型
```typescript
// ❌ 错误
arr.map(item => item.name);

// ✅ 修复
arr.map((item: ItemType) => item.name);
```

#### 错误 4: Promise 返回类型不匹配
```typescript
// ❌ 错误
async function foo(): Promise<string> {
  return axios.get('/api');  // 返回 AxiosResponse
}

// ✅ 修复
async function foo(): Promise<string> {
  const response = await axios.get<{ data: string }>('/api');
  return response.data.data;
}
```

### 7. 迁移检查流程

每迁移一个文件后,执行:

```bash
# 1. TypeScript 类型检查
pnpm tsc --noEmit

# 2. ESLint 检查
pnpm lint

# 3. 确保无错误后再提交
```

### 8. 工具配置

#### tsconfig.json 严格模式
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### ESLint 配置
确保启用:
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-unused-vars`
- `react-hooks/exhaustive-deps`

## 🎯 迁移优先级

1. **高优先级** - 必须先完成且无错误
   - 工具函数 (utils/)
   - 类型定义 (types/)
   - HTTP 客户端 (utils/request.ts)
   
2. **中优先级** - 核心业务逻辑
   - 服务层 (services/)
   - 状态管理 (stores/)
   
3. **低优先级** - UI 组件
   - 组件 (components/)
   - 页面 (pages/)

## 📝 注意事项

1. **不要忽略错误** - 每个错误都必须修复,不能使用 `@ts-ignore`
2. **渐进式迁移** - 一次迁移一个模块,确保无错误后再继续
3. **保持代码审查** - 每次提交前检查类型错误
4. **文档同步** - 更新 JSDoc 注释,保持类型定义一致

## 🔍 快速检查命令

```bash
# 检查所有 TypeScript 错误
pnpm tsc --noEmit --pretty

# 检查 ESLint 错误
pnpm lint --max-warnings=0

# 构建测试
pnpm build
```

---

**记住:零错误是我们的标准,不是目标!**
