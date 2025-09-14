# 智谱AI模型集成

<cite>
**本文档引用文件**  
- [bigmodel.js](file://cloudfunctions/analysis/bigmodel.js)
- [aiModelService.js](file://cloudfunctions/analysis/aiModelService.js)
- [aiModelService_part2.js](file://cloudfunctions/analysis/aiModelService_part2.js)
- [aiModelService_part3.js](file://cloudfunctions/analysis/aiModelService_part3.js)
</cite>

## 目录
1. [项目结构](#项目结构)  
2. [API认证机制](#api认证机制)  
3. [请求体构建过程](#请求体构建过程)  
4. [流式响应处理逻辑](#流式响应处理逻辑)  
5. [请求/响应示例与上下文维护](#请求响应示例与上下文维护)  
6. [错误处理机制](#错误处理机制)  
7. [与aiModelService.js的调用契约](#与aimodelservicejs的调用契约)  
8. [性能优化措施](#性能优化措施)

## 项目结构

智谱AI模型集成主要位于 `cloudfunctions/analysis/` 目录下，核心文件包括 `bigmodel.js`、`aiModelService.js` 及其分片模块 `aiModelService_part2.js` 和 `aiModelService_part3.js`。该架构通过统一接口支持多平台AI模型调用，其中 `bigmodel.js` 专注于智谱AI（Zhipu AI）的实现，而 `aiModelService.js` 提供跨平台的抽象层。

**Section sources**  
- [bigmodel.js](file://cloudfunctions/analysis/bigmodel.js#L1-L705)  
- [aiModelService.js](file://cloudfunctions/analysis/aiModelService.js#L1-L663)

## API认证机制

智谱AI的API认证通过 `Authorization` 请求头实现，采用 `Bearer Token` 模式。系统从环境变量 `ZHIPU_API_KEY` 中读取密钥，并在每次请求时动态构造认证头。

在 `bigmodel.js` 中，`getAuthHeaders()` 函数负责生成认证头：
```javascript
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  };
}
```
其中 `API_KEY` 通过 `process.env.ZHIPU_API_KEY` 获取，确保密钥不会硬编码在源码中，提升安全性。

**Section sources**  
- [bigmodel.js](file://cloudfunctions/analysis/bigmodel.js#L25-L35)

## 请求体构建过程

请求体的构建由多个参数共同决定，包括 prompt 序列化、temperature、max_tokens 等。系统通过 `analyzeEmotion`、`extractKeywords` 等函数构建符合智谱AI API规范的请求体。

### Prompt 序列化
系统使用 `messages` 数组传递对话历史，包含 `system` 角色设定和 `user` 输入内容。`system` 消息中定义了详细的JSON输出格式要求，确保模型返回结构化数据。

### 参数映射
关键参数映射如下：
- **temperature**: 控制生成内容的随机性，情感分析设为 `0.3` 以保证稳定性
- **response_format**: 设置为 `{ type: 'json_object' }` 强制返回JSON格式
- **max_tokens**: 未显式设置，默认由API决定

请求体示例：
```javascript
{
  model: 'glm-4-flash',
  messages: [...],
  temperature: 0.3,
  response_format: { type: 'json_object' }
}
```

**Section sources**  
- [bigmodel.js](file://cloudfunctions/analysis/bigmodel.js#L100-L150)  
- [bigmodel.js](file://cloudfunctions/analysis/bigmodel.js#L200-L250)

## 流式响应处理逻辑

尽管当前 `bigmodel.js` 实现中未直接处理流式响应（SSE），但其设计为上层服务提供了支持基础。在统一服务 `aiModelService.js` 中，通过 `stream` 参数控制是否启用流式传输。

当启用流式响应时，系统应监听 `data` 事件，逐块接收AI生成内容，并通过SSE推送给前端。虽然 `bigmodel.js` 当前使用 `axios.post` 同步调用，但可通过配置 `responseType: 'stream'` 支持流式处理。

**Section sources**  
- [aiModelService.js](file://cloudfunctions/analysis/aiModelService.js#L300-L350)  
- [aiModelService-db.js](file://cloudfunctions/chat/aiModelService-db.js#L227-L282)

## 请求/响应示例与上下文维护

### 多轮对话上下文维护
系统通过 `history` 参数维护多轮对话上下文。在调用 `analyzeEmotion` 时，传入历史消息数组，系统会将其截取最后5条作为上下文，避免过长输入影响性能。

```javascript
if (Array.isArray(history) && history.length > 0) {
  const contextMessages = history.slice(-5);
  contextMessages.forEach(msg => {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  });
}
```

### 请求/响应示例
**请求示例**:
```json
{
  "text": "我今天感到非常焦虑，工作压力很大。",
  "history": [
    {
      "role": "user",
      "content": "昨天心情还不错"
    },
    {
      "role": "assistant",
      "content": "很高兴听到你昨天心情不错"
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "result": {
    "primary_emotion": "焦虑",
    "intensity": 0.8,
    "valence": -0.6,
    "arousal": 0.9,
    "trend": "上升",
    "topic_keywords": ["工作", "压力", "焦虑"],
    "suggestions": ["尝试深呼吸放松", "与朋友倾诉"]
  }
}
```

**Section sources**  
- [bigmodel.js](file://cloudfunctions/analysis/bigmodel.js#L130-L150)  
- [bigmodel.js](file://cloudfunctions/analysis/bigmodel.js#L250-L300)

## 错误处理机制

系统实现了多层次的错误处理机制，涵盖网络超时、API限流（429）和认证失败（401）等场景。

### 网络与API错误
在 `callModelApi` 函数中，系统捕获HTTP异常并进行分类处理：
- **429错误**：自动重试机制，延迟时间指数增长（`retryDelay * 2`）
- **401错误**：抛出认证失败异常，提示检查API密钥
- **其他错误**：记录详细日志并返回用户友好错误信息

### 解析错误
对API返回的JSON响应进行 `try-catch` 包裹，防止解析失败导致服务中断：
```javascript
try {
  const result = JSON.parse(content);
} catch (parseError) {
  console.error('解析JSON响应失败:', parseError);
  return { success: false, error: '解析结果失败' };
}
```

**Section sources**  
- [aiModelService.js](file://cloudfunctions/analysis/aiModelService.js#L350-L400)  
- [bigmodel.js](file://cloudfunctions/analysis/bigmodel.js#L270-L290)

## 与aiModelService.js的调用契约

`bigmodel.js` 与 `aiModelService.js` 通过模块化设计实现松耦合调用。`aiModelService.js` 作为统一入口，通过 `MODEL_PLATFORMS` 配置对象管理不同平台，其中 `ZHIPU` 平台指向智谱AI。

### 调用流程
1. 上层调用 `aiModelService.analyzeEmotion()`
2. 根据 `options.platform` 判断是否为 `ZHIPU`
3. 若是，则通过 `callModelApi` 调用智谱AI接口
4. 返回标准化结果

### 接口一致性
所有平台实现统一的返回结构：
```javascript
{
  success: Boolean,
  result: Object,
  error: String
}
```

**Section sources**  
- [aiModelService.js](file://cloudfunctions/analysis/aiModelService.js#L450-L661)  
- [aiModelService_part2.js](file://cloudfunctions/analysis/aiModelService_part2.js#L1-L317)  
- [aiModelService_part3.js](file://cloudfunctions/analysis/aiModelService_part3.js#L1-L479)

## 性能优化措施

### 连接池管理
系统通过 `axios` 默认的连接复用机制实现连接池管理，减少TCP握手开销。在高并发场景下，可通过配置 `httpAgent` 进一步优化。

### 请求缓存
当 `ZHIPU_API_KEY` 未设置或API调用失败时，系统自动降级为本地模拟词向量生成，避免服务中断：
```javascript
if (!process.env.ZHIPU_API_KEY) {
  // 生成模拟词向量
  return { source: 'local', ... };
}
```

### 降级与容错
- **API失败降级**：词向量获取失败时返回本地模拟数据
- **平台切换**：支持通过 `modelService.setSelectedModelType()` 动态切换模型平台
- **重试机制**：429错误自动重试，最多3次，延迟指数增长

**Section sources**  
- [bigmodel.js](file://cloudfunctions/analysis/bigmodel.js#L500-L550)  
- [aiModelService.js](file://cloudfunctions/analysis/aiModelService.js#L350-L400)