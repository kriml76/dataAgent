# IntentRecognitionNode 意图识别节点详解

## 一、核心功能定位

该节点是工作流中的**意图识别节点**，负责判断用户输入的类型：是**闲聊请求**还是**数据分析请求**，为后续节点路由提供决策依据。

---

## 二、核心执行流程

```
用户输入 → 获取历史上下文 → 构建提示词 → 调用LLM → 解析结果 → 输出识别结果
```

---

## 三、关键代码解析

### 1. 核心方法 `apply()`

```java
@Override
public Map<String, Object> apply(OverAllState state) throws Exception {
    // 1. 获取用户输入
    String userInput = StateUtil.getStringValue(state, INPUT_KEY);
    
    // 2. 获取多轮对话上下文（默认为"(无)"）
    String multiTurn = StateUtil.getStringValue(state, MULTI_TURN_CONTEXT, "(无)");
    
    // 3. 构建意图识别提示词
    String prompt = PromptHelper.buildIntentRecognitionPrompt(multiTurn, userInput);
    
    // 4. 调用LLM服务
    Flux<ChatResponse> responseFlux = llmService.callUser(prompt);
    
    // 5. 创建流式响应生成器
    Flux<GraphResponse<StreamingOutput>> generator = FluxUtil.createStreamingGenerator(...);
    
    return Map.of(INTENT_RECOGNITION_NODE_OUTPUT, generator);
}
```

### 2. 核心组件说明

| 组件 | 作用 |
|------|------|
| `LlmService` | 调用大语言模型的核心服务 |
| `JsonParseUtil` | JSON解析工具，将LLM响应转换为DTO对象 |
| `PromptHelper` | 提示词构建工具，构建意图识别的Prompt |
| `FluxUtil` | 流式响应处理工具，支持实时输出 |
| `StateUtil` | 状态管理工具，从工作流状态中读取数据 |

### 3. 流式响应生成机制

```java
FluxUtil.createStreamingGenerator(
    this.getClass(), state, responseFlux,
    // 前缀：在LLM响应前输出的内容
    Flux.just(ChatResponseUtil.createResponse("正在进行意图识别..."),
              ChatResponseUtil.createPureResponse(TextType.JSON.getStartSign())),
    // 后缀：在LLM响应后输出的内容
    Flux.just(ChatResponseUtil.createPureResponse(TextType.JSON.getEndSign()),
              ChatResponseUtil.createResponse("\n意图识别完成！")),
    // 结果转换函数：将LLM响应转换为IntentRecognitionOutputDTO
    result -> {
        IntentRecognitionOutputDTO intentRecognitionOutput = 
            jsonParseUtil.tryConvertToObject(result, IntentRecognitionOutputDTO.class);
        return Map.of(INTENT_RECOGNITION_NODE_OUTPUT, intentRecognitionOutput);
    }
);
```

**输出格式示例：**
```
正在进行意图识别...
{"intent": "data_analysis", "confidence": 0.95, "details": "..."}
意图识别完成！
```

---

## 四、关键设计特点

| 设计特点 | 说明 |
|----------|------|
| **流式输出** | 使用 `Flux` 实现响应式流式输出，用户可以实时看到识别进度 |
| **多轮上下文支持** | 支持携带历史对话上下文进行意图识别，提升准确性 |
| **统一响应格式** | 输出JSON格式的识别结果，便于后续节点处理 |
| **异常容错** | 使用 `tryConvertToObject` 方法进行JSON解析，具有容错能力 |

---

## 五、数据流转图

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   用户输入      │ ──→ │  构建提示词      │ ──→ │   调用LLM      │
│  (userInput)    │     │  (PromptHelper) │     │ (LlmService)    │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                     FluxUtil.createStreamingGenerator          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │ 前缀输出 │ →  │ LLM响应  │ →  │ 结果解析 │ →  │ 后缀输出 │ │
│  │ (进度提示)│    │ (流式)   │    │(JSON转DTO)│   │(完成提示)│ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                                          │
                                                          ↓
                                       ┌──────────────────────────┐
                                       │ IntentRecognitionOutputDTO│
                                       │ 包含意图类型、置信度等    │
                                       └──────────────────────────┘
```

---

## 六、与工作流的协作

该节点作为工作流中的一个步骤，输出的 `IntentRecognitionOutputDTO` 会被后续节点使用，决定是路由到：
- **闲聊处理节点**：处理日常对话
- **数据分析处理节点**：处理数据查询和分析请求

---

## 七、文件路径

```
/Users/liubenjun/Desktop/DataAgent/data-agent-management/src/main/java/com/alibaba/cloud/ai/dataagent/workflow/node/IntentRecognitionNode.java
```

---

*生成时间：2026年6月5日*