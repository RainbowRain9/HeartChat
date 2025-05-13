# 统一AI模型服务设计文档

## 1. 概述

统一AI模型服务（aiModelService）是HeartChat项目中的一个核心模块，旨在提供统一的接口来调用不同的AI模型平台，包括智谱AI、Google Gemini、OpenAI、Crond API和CloseAI等。通过这个服务，我们可以轻松地在不同的AI模型之间切换，而无需修改上层业务逻辑。

## 2. 设计目标

- **统一接口**：为所有AI模型平台提供统一的调用接口
- **可扩展性**：易于添加新的AI模型平台
- **配置化**：通过配置文件管理不同平台的参数
- **错误处理**：提供统一的错误处理机制
- **重试机制**：对于可重试的错误（如429）实现自动重试
- **日志记录**：详细记录API调用过程，便于问题诊断

## 3. 架构设计

### 3.1 模块结构

```
cloudfunctions/
  └── chat/
      ├── index.js                # 云函数入口
      ├── aiModelService.js       # 统一AI模型服务
      └── package.json            # 依赖配置
```

### 3.2 核心组件

- **MODEL_PLATFORMS**：模型平台配置对象，包含各平台的基本信息
- **callModelApi**：统一的API调用函数，处理请求发送和响应解析
- **generateChatReply**：生成聊天回复的统一接口
- **getAvailableModels**：获取可用模型列表的统一接口

### 3.3 平台配置

每个AI模型平台的配置包括以下字段：

```javascript
{
  name: '平台名称',
  baseUrl: 'API基础URL',
  apiKeyEnv: 'API密钥环境变量名',
  defaultModel: '默认模型',
  models: ['支持的模型列表'],
  authType: '认证类型',
  endpoints: {
    chat: '聊天接口路径'
  }
}
```

## 4. 实现细节

### 4.1 模型平台配置

```javascript
const MODEL_PLATFORMS = {
  // 智谱AI
  ZHIPU: {
    name: '智谱AI',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiKeyEnv: 'ZHIPU_API_KEY',
    defaultModel: 'glm-4-flash',
    models: ['glm-4-flash', 'glm-4'],
    authType: 'Bearer',
    endpoints: {
      chat: '/chat/completions'
    }
  },
  // Google Gemini
  GEMINI: {
    name: 'Google Gemini',
    baseUrl: 'https://apiv2.aliyahzombie.top',
    apiKeyEnv: 'GEMINI_API_KEY',
    defaultModel: 'gemini-2.5-flash-preview-04-17',
    models: ['gemini-2.5-flash-preview-04-17'],
    authType: 'Bearer',
    endpoints: {
      chat: '/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent'
    }
  },
  // 其他平台...
}
```

### 4.2 消息格式转换

不同的AI模型平台可能使用不同的消息格式，我们需要进行转换：

```javascript
function formatMessages(messages, platformKey) {
  if (platformKey === 'GEMINI') {
    // Gemini使用特殊格式
    // ...
  } else {
    // 其他平台使用标准格式
    return messages;
  }
}
```

### 4.3 响应解析

同样，不同平台的响应格式也可能不同：

```javascript
function parseResponse(response, platformKey) {
  if (platformKey === 'GEMINI') {
    // Gemini响应格式
    // ...
  } else {
    // 标准响应格式
    // ...
  }
}
```

### 4.4 API调用

统一的API调用函数处理请求发送和错误重试：

```javascript
async function callModelApi(params, platformKey, retryCount = 3, retryDelay = 1000) {
  try {
    // 获取平台配置
    // 构建请求
    // 发送请求
    // 解析响应
  } catch (error) {
    // 处理错误，包括重试逻辑
  }
}
```

### 4.5 生成聊天回复

提供统一的接口生成聊天回复：

```javascript
async function generateChatReply(userMessage, history, roleInfo, includeEmotionAnalysis, customSystemPrompt, options) {
  // 构建消息
  // 调用API
  // 处理响应
}
```

## 5. 使用方法

### 5.1 基本用法

```javascript
// 导入统一AI模型服务
const aiModelService = require('./aiModelService');

// 生成聊天回复
const result = await aiModelService.generateChatReply(
  "用户消息",
  historyMessages,
  roleInfo,
  false,
  systemPrompt,
  {
    platform: 'GEMINI',
    model: 'gemini-2.5-flash-preview-04-17'
  }
);
```

### 5.2 获取模型列表

```javascript
// 获取特定平台的模型列表
const models = await aiModelService.getAvailableModels('OPENAI');
```

### 5.3 添加新的模型平台

要添加新的模型平台，只需在`MODEL_PLATFORMS`对象中添加新的配置：

```javascript
const MODEL_PLATFORMS = {
  // 现有平台...
  
  // 新平台
  NEW_PLATFORM: {
    name: '新平台',
    baseUrl: 'https://api.newplatform.com',
    apiKeyEnv: 'NEW_PLATFORM_API_KEY',
    defaultModel: 'default-model',
    models: ['model-1', 'model-2'],
    authType: 'Bearer',
    endpoints: {
      chat: '/chat/completions'
    }
  }
};
```

## 6. 错误处理

统一AI模型服务实现了以下错误处理机制：

1. **API密钥验证**：在调用API前验证API密钥是否配置
2. **请求错误处理**：捕获并处理HTTP请求错误
3. **响应验证**：验证API响应是否符合预期格式
4. **重试机制**：对于429错误（请求过多）实现指数退避重试
5. **详细日志**：记录详细的错误信息，便于问题诊断

## 7. 环境变量配置

需要在云函数环境中配置以下环境变量：

- `ZHIPU_API_KEY`：智谱AI API密钥
- `GEMINI_API_KEY`：Google Gemini API密钥
- `OPENAI_API_KEY`：OpenAI API密钥
- `CROND_API_KEY`：Crond API密钥
- `CLOSEAI_API_KEY`：CloseAI API密钥

## 8. 性能优化

统一AI模型服务实现了以下性能优化措施：

1. **请求合并**：将多个参数合并到一个请求中
2. **响应缓存**：可以实现响应缓存，减少重复请求
3. **连接复用**：使用axios的keepAlive选项复用HTTP连接
4. **错误重试**：对于可重试的错误实现自动重试，提高成功率

## 9. 安全性考虑

1. **API密钥保护**：API密钥存储在环境变量中，不在代码中硬编码
2. **HTTPS通信**：所有API调用都使用HTTPS协议
3. **错误信息保护**：不向客户端暴露敏感的错误信息

## 10. 未来扩展

1. **模型参数调整**：支持更多的模型参数调整，如temperature、top_p等
2. **流式响应**：支持流式响应，实现打字机效果
3. **多模态支持**：支持图像、音频等多模态输入
4. **模型性能监控**：添加性能监控功能，记录响应时间、成功率等指标
5. **自动故障转移**：当一个模型平台不可用时，自动切换到备用平台

## 11. 总结

统一AI模型服务通过提供统一的接口和配置化的设计，大大简化了多模型平台的集成和管理。它不仅减少了代码冗余，提高了可维护性，还为未来添加新的模型平台提供了便利。

通过这个服务，HeartChat可以灵活地在不同的AI模型之间切换，为用户提供更多样化、更高质量的AI交互体验。
