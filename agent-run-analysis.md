
# Agent Run 页面前后端逻辑详解

## 一、页面概述

`http://10.1.76.243:8688/agent/1/run` 是一个智能体对话运行页面，核心功能是支持流式响应、结果集展示、图表渲染和人工反馈。

---

## 二、前端逻辑

### 2.1 组件结构

| 区域 | 功能描述 |
|------|----------|
| 左侧历史消息栏 | 显示会话历史列表，支持会话切换和删除 |
| 右侧对话栏 | 主要交互区域，展示消息历史和流式响应 |
| 流式响应区域 | 实时显示AI处理过程的各个节点输出 |
| 人类反馈区域 | 用户对AI执行计划的反馈界面 |
| 输入区域 | 用户输入框和选项控制（人工反馈、NL2SQL模式等） |

### 2.2 核心流程

#### 2.2.1 用户发送消息 `sendMessage()`

```typescript
// 核心步骤：
1. 验证输入和会话状态
2. 保存用户消息到后端 (ChatService.saveMessage)
3. 构建 GraphRequest 请求对象
4. 调用 sendGraphRequest() 发送流式请求
```

**GraphRequest 请求结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| agentId | string | 智能体ID |
| query | string | 用户查询内容 |
| humanFeedback | boolean | 是否启用人工反馈 |
| nl2sqlOnly | boolean | 是否仅生成SQL |
| rejectedPlan | boolean | 是否拒绝上一个计划 |
| threadId | string | 线程ID（用于会话保持） |

#### 2.2.2 发送流式请求 `sendGraphRequest()`

```typescript
// 核心步骤：
1. 设置流式状态 (isStreaming = true)
2. 调用 GraphService.streamSearch()
3. 处理不同类型的节点响应
4. 实时更新UI显示
5. 保存消息到历史记录
```

#### 2.2.3 SSE服务调用 `GraphService.streamSearch()`

```typescript
// 请求端点：POST /api/stream/search
// 使用 Server-Sent Events (SSE) 实现流式响应
```

### 2.3 支持的消息类型

| 类型 | 说明 | 渲染方式 |
|------|------|----------|
| TEXT | 普通文本 | HTML换行处理 |
| HTML | HTML格式内容 | 直接渲染 |
| MARK_DOWN | Markdown报告 | Markdown渲染组件 |
| RESULT_SET | 数据库查询结果 | 表格展示+分页 |
| PYTHON/SQL/JSON | 代码块 | highlight.js语法高亮 |

---

## 三、后端逻辑

### 3.1 控制器端点

**文件路径：** `data-agent-management/src/main/java/com/alibaba/cloud/ai/dataagent/controller/GraphController.java`

```java
@GetMapping(value = "/stream/search", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<GraphNodeResponse>> streamSearch(
    @RequestParam("agentId") String agentId,
    @RequestParam(value = "threadId", required = false) String threadId, 
    @RequestParam("query") String query,
    @RequestParam(value = "humanFeedback", required = false) boolean humanFeedback,
    @RequestParam(value = "humanFeedbackContent", required = false) String humanFeedbackContent,
    @RequestParam(value = "rejectedPlan", required = false) boolean rejectedPlan,
    @RequestParam(value = "nl2sqlOnly", required = false) boolean nl2sqlOnly,
    ServerHttpResponse response)
```

### 3.2 处理流程

```
1. 设置SSE响应头
   ├── Cache-Control: no-cache
   ├── Connection: keep-alive
   └── Access-Control-Allow-Origin: *

2. 构建请求对象
   └── GraphRequest.builder()

3. 调用业务层
   └── graphService.graphStreamProcess(sink, request)

4. 返回响应式流
   └── Flux<ServerSentEvent<GraphNodeResponse>>
```

### 3.3 生命周期管理

| 事件 | 处理逻辑 |
|------|----------|
| onSubscribe | 记录订阅日志 |
| onCancel | 停止流处理 + 清理资源 |
| onError | 记录错误日志 + 停止流处理 |
| onComplete | 记录完成日志 |

---

## 四、数据流向

```
用户输入 
    ↓
sendMessage() 
    ↓
构建 GraphRequest 
    ↓
sendGraphRequest() 
    ↓
GraphService.streamSearch() 
    ↓
SSE连接到 /api/stream/search 
    ↓
后端 GraphController.streamSearch() 
    ↓
GraphService.graphStreamProcess() 
    ↓
流式响应 (Server-Sent Events) 
    ↓
前端实时更新UI 
    ↓
保存消息历史
```

---

## 五、特殊功能

### 5.1 人工反馈模式

- 用户可以对AI生成的执行计划进行审核
- 支持接受或拒绝计划
- 拒绝后可重新生成

### 5.2 NL2SQL模式

- 仅生成SQL语句而不执行
- 适用于需要人工审核SQL的场景

### 5.3 报告生成

支持两种报告格式：
- **Markdown报告**：轻量级，便于编辑
- **HTML报告**：丰富格式，适合展示

### 5.4 结果集展示

- 数据库查询结果以表格形式展示
- 支持分页浏览
- 支持复制功能

### 5.5 代码高亮

使用 highlight.js 对以下语言进行语法高亮：
- SQL
- Python
- JSON

---

## 六、关键文件清单

| 类型 | 文件路径 | 说明 |
|------|----------|------|
| 前端页面 | `data-agent-frontend/src/views/AgentRun.vue` | 主页面组件 |
| 前端服务 | `data-agent-frontend/src/services/graph.ts` | SSE服务封装 |
| 后端控制器 | `data-agent-management/src/main/java/com/alibaba/cloud/ai/dataagent/controller/GraphController.java` | REST API端点 |

---

## 七、技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | Vue 3 + TypeScript |
| UI组件 | Element Plus |
| 流式通信 | Server-Sent Events (SSE) |
| 后端框架 | Spring Boot |
| 响应式编程 | Reactor (Flux/Mono) |
| 代码高亮 | highlight.js |
| Markdown渲染 | marked |
| HTML净化 | DOMPurify |
