# GraphController 详细分析

## 一、概述

`GraphController` 是 DataAgent 项目中的**图工作流 API 控制器**，提供 **SSE（Server-Sent Events）流式接口**，用于实时处理自然语言转 SQL（NL2SQL）和数据分析请求。它是前端与后端核心工作流服务之间的桥梁。

## 二、架构定位

### 分层归属

| 层级 | ID | 名称 | 描述 |
|------|----|------|------|
| 后端控制器层 | `layer:后端控制器层` | 后端控制器层 | Spring Boot REST API 控制器，处理前端请求并返回响应 |

### 组件关系图

```
┌─────────────────────────────────────────────────────────────┐
│                    前端服务层 (Frontend)                     │
│  graph.ts  │  chat.ts                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP SSE 请求
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   GraphController                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  /api/stream/search (SSE 流式接口)                  │    │
│  └─────────────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────────────┘
                        │ 调用
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    GraphService                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  graphStreamProcess() - 流式处理核心方法            │    │
│  │  stopStreamProcessing() - 停止流式处理             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 三、核心代码分析

### 3.1 类定义与依赖注入

```java
@Slf4j
@RestController
@AllArgsConstructor
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class GraphController {
    private final GraphService graphService;
}
```

| 注解 | 作用 |
|------|------|
| `@Slf4j` | Lombok 注解，自动生成日志记录器 |
| `@RestController` | Spring 注解，标识为 REST 控制器 |
| `@AllArgsConstructor` | Lombok 注解，生成全参构造函数，支持构造器注入 |
| `@CrossOrigin(origins = "*")` | 允许跨域请求 |
| `@RequestMapping("/api")` | 定义基础 API 路径 |

### 3.2 流式搜索接口

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

#### 请求参数说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `agentId` | String | 是 | 代理 ID，标识当前会话使用的智能代理 |
| `threadId` | String | 否 | 线程 ID，用于标识和管理会话上下文 |
| `query` | String | 是 | 用户的自然语言查询 |
| `humanFeedback` | boolean | 否 | 是否包含人工反馈 |
| `humanFeedbackContent` | String | 否 | 人工反馈内容 |
| `rejectedPlan` | boolean | 否 | 是否拒绝了之前的计划（用于重新规划） |
| `nl2sqlOnly` | boolean | 否 | 是否仅执行 NL2SQL（跳过后续分析） |

### 3.3 SSE 响应头配置

```java
response.getHeaders().add("Cache-Control", "no-cache");
response.getHeaders().add("Connection", "keep-alive");
response.getHeaders().add("Access-Control-Allow-Origin", "*");
```

这些响应头确保：
- **禁用缓存**：实时数据不被浏览器缓存
- **保持连接**：支持长连接流式传输
- **允许跨域**：前端可以跨域接收 SSE 事件

### 3.4 Sink 机制与数据流

```java
Sinks.Many<ServerSentEvent<GraphNodeResponse>> sink = Sinks.many().unicast().onBackpressureBuffer();
```

**Sink 类型说明**：

| 类型 | 说明 |
|------|------|
| `Sinks.many()` | 创建多播 Sink |
| `.unicast()` | 单订阅者模式（一对一） |
| `.onBackpressureBuffer()` | 背压策略：缓冲溢出数据 |

**数据流流程**：

```
GraphService.graphStreamProcess()
        │
        ▼
    Sink.emit() ──────► Flux<ServerSentEvent> ──────► 前端客户端
        │                      │
        │                      ▼
        │              过滤空内容事件
        │                      │
        │                      ▼
        │              订阅/取消/错误处理
        └──────────────────────┘
```

### 3.5 请求对象构建

```java
GraphRequest request = GraphRequest.builder()
    .agentId(agentId)
    .threadId(threadId)
    .query(query)
    .humanFeedback(humanFeedback)
    .humanFeedbackContent(humanFeedbackContent)
    .rejectedPlan(rejectedPlan)
    .nl2sqlOnly(nl2sqlOnly)
    .build();
```

使用 Builder 模式构建请求对象，参数清晰且易于扩展。

### 3.6 事件过滤逻辑

```java
return sink.asFlux().filter(sse -> {
    // 1. 如果 event 是 "complete" 或 "error"，直接放行
    if (STREAM_EVENT_COMPLETE.equals(sse.event()) || STREAM_EVENT_ERROR.equals(sse.event())) {
        return true;
    }
    // 2. 过滤空内容事件
    return sse.data() != null && sse.data().getText() != null && !sse.data().getText().isEmpty();
})
```

**过滤规则**：
1. `complete` 和 `error` 事件始终保留（用于通知客户端结束状态）
2. 其他事件必须包含非空文本内容

### 3.7 生命周期回调

```java
.doOnSubscribe(subscription -> log.info("Client subscribed, threadId: {}", request.getThreadId()))
.doOnCancel(() -> {
    log.info("Client disconnected, threadId: {}", request.getThreadId());
    if (request.getThreadId() != null) {
        graphService.stopStreamProcessing(request.getThreadId());
    }
})
.doOnError(e -> {
    log.error("Error occurred, threadId: {}", request.getThreadId(), e);
    if (request.getThreadId() != null) {
        graphService.stopStreamProcessing(request.getThreadId());
    }
})
.doOnComplete(() -> log.info("Stream completed, threadId: {}", request.getThreadId()))
```

| 回调 | 触发时机 | 处理逻辑 |
|------|----------|----------|
| `doOnSubscribe` | 客户端订阅 | 记录日志 |
| `doOnCancel` | 客户端取消订阅 | 记录日志 + 停止后台处理 |
| `doOnError` | 发生错误 | 记录日志 + 停止后台处理 |
| `doOnComplete` | 流正常结束 | 记录日志 |

## 四、技术栈与设计模式

### 4.1 核心技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Spring Boot | 3.x | REST API 框架 |
| Spring WebFlux | - | 响应式编程，支持 SSE |
| Reactor | - | 响应式流实现 |
| Lombok | - | 简化代码 |

### 4.2 设计模式

1. **控制器模式**：处理 HTTP 请求，调用服务层
2. **观察者模式**：Sink/Flux 实现发布-订阅机制
3. **Builder 模式**：GraphRequest 的构建

## 五、数据流总结

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        请求处理流程                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  1. 前端发起 GET /api/stream/search 请求                               │
│                        │                                              │
│                        ▼                                              │
│  2. 设置 SSE 响应头 (Cache-Control, Connection, CORS)                 │
│                        │                                              │
│                        ▼                                              │
│  3. 创建 Sink 用于接收异步事件                                         │
│                        │                                              │
│                        ▼                                              │
│  4. 构建 GraphRequest 对象                                            │
│                        │                                              │
│                        ▼                                              │
│  5. 调用 GraphService.graphStreamProcess(sink, request)               │
│                        │                                              │
│                        ▼                                              │
│  6. 将 Sink 转换为 Flux，应用过滤和生命周期回调                         │
│                        │                                              │
│                        ▼                                              │
│  7. 流式返回 ServerSentEvent 到前端                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## 六、关键特性

| 特性 | 实现方式 | 优势 |
|------|----------|------|
| **实时流式传输** | SSE (Server-Sent Events) | 服务端主动推送，低延迟 |
| **背压处理** | `onBackpressureBuffer()` | 防止生产者过快导致内存溢出 |
| **优雅关闭** | `doOnCancel`/`doOnError` | 客户端断开时停止后台任务 |
| **跨域支持** | `@CrossOrigin` + 响应头 | 支持前端跨域调用 |

## 七、依赖关系

| 依赖组件 | 类型 | 路径 |
|----------|------|------|
| GraphService | 服务接口 | `service/graph/GraphService.java` |
| GraphRequest | DTO | `dto/GraphRequest.java` |
| GraphNodeResponse | VO | `vo/GraphNodeResponse.java` |
| Constant | 常量 | `constant/Constant.java` |

---

*Generated from DataAgent knowledge graph analysis*
