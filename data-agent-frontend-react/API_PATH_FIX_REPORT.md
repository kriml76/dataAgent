# ✅ API 路径重复问题修复报告

**修复时间**: 2026-06-09  
**问题描述**: 请求 URL 出现双重 `/api` 前缀 - `http://localhost:8999/api/api/agent/list`  
**根本原因**: Axios baseURL 和服务层 API_BASE_URL 都包含了 `/api` 前缀

---

## 🔍 问题分析

### 错误配置

```typescript
// ❌ request.ts - Axios 配置
const apiClient = axios.create({
  baseURL: '/api',  // 已有 /api 前缀
});

// ❌ agent/index.ts - 服务层配置
const API_BASE_URL = '/api/agent';  // 又加了 /api 前缀

// 最终请求: /api + /api/agent/list = /api/api/agent/list ❌
```

### 正确配置

```typescript
// ✅ request.ts - Axios 配置
const apiClient = axios.create({
  baseURL: '/api',  // 统一前缀
});

// ✅ agent/index.ts - 服务层配置
const API_BASE_URL = '/agent';  // 只保留资源路径

// 最终请求: /api + /agent/list = /api/agent/list ✅
```

---

## 📊 修复清单

### 已修复的服务文件 (9个)

| 文件 | 原路径 | 修复后 | 状态 |
|------|--------|--------|------|
| agent/index.ts | `/api/agent` | `/agent` | ✅ |
| datasource/index.ts | `/api/datasource` | `/datasource` | ✅ |
| businessKnowledge/index.ts | `/api/business-knowledge` | `/business-knowledge` | ✅ |
| semanticModel/index.ts | `/api/semantic-model` | `/semantic-model` | ✅ |
| agentKnowledge/index.ts | `/api/agent-knowledge` | `/agent-knowledge` | ✅ |
| prompt/index.ts | `/api/prompt-config` | `/prompt-config` | ✅ |
| modelConfig/index.ts | `/api/model-config` | `/model-config` | ✅ |
| logicalRelation/index.ts | `/api/datasource` | `/datasource` | ✅ |
| presetQuestion/index.ts | `/api/agent` | `/agent` | ✅ |

### 其他修复

| 文件 | 原路径 | 修复后 | 说明 |
|------|--------|--------|------|
| fileUpload/index.ts | `/api/upload/avatar` | `/upload/avatar` | 文件上传接口 |

### 无需修复的文件

以下文件已正确使用相对路径(无 `/api` 前缀):
- ✅ chat/index.ts - 使用 `/agent/${id}/sessions` 等
- ✅ graph/index.ts - 使用相对路径
- ✅ agentDatasource/index.ts - 使用相对路径
- ✅ common/index.ts - 工具类,无 API 调用
- ✅ resultSet/index.ts - 使用相对路径
- ✅ sessionStateManager/index.ts - 纯逻辑,无 API 调用

---

## 🎯 修复效果

### 修复前
```
GET http://localhost:8999/api/api/agent/list
Status: 500 Internal Server Error ❌
```

### 修复后
```
GET http://localhost:8999/api/agent/list
  ↓ Vite Proxy
→ http://localhost:8065/api/agent/list
Status: 200 OK ✅
```

---

## ✅ 质量检查

```bash
✅ TypeScript: 零错误
✅ ESLint: 零警告
✅ API 路径: 无重复前缀
✅ 开发服务器: http://localhost:8999/ 运行中
```

---

## 📝 最佳实践

### 统一的路径管理规范

1. **Axios baseURL**: 负责统一的 API 前缀 (`/api`)
2. **服务层**: 只定义资源路径 (`/agent`, `/datasource` 等)
3. **避免硬编码**: 不要在服务层重复添加 `/api` 前缀

### 示例代码

```typescript
// ✅ 正确的做法
// request.ts
const apiClient = axios.create({
  baseURL: '/api',
});

// services/agent/index.ts
const API_BASE_URL = '/agent';  // 不含 /api
export default {
  list: () => apiClient.get(`${API_BASE_URL}/list`),
};

// ❌ 错误的做法
const API_BASE_URL = '/api/agent';  // 重复了 /api
```

---

## 🔗 相关文档

- [代理配置检查报告](./PROXY_CONFIGURATION_CHECK.md)
- [Mock 数据清除报告](./MOCK_DATA_REMOVAL_REPORT.md)
- [迁移完整性报告](./MIGRATION_VERIFICATION.md)

**结论**: 🎉 **API 路径重复问题已修复,可以正常调用后端接口!**
