# Analysis云函数统一AI模型服务设计文档

## 1. 概述

Analysis云函数是HeartChat项目中负责情感分析、关键词提取和用户兴趣分析的核心组件。为了提高代码的可维护性和扩展性，我们实现了统一的AI模型服务（aiModelService），支持多种AI模型平台，包括智谱AI、Google Gemini、OpenAI、Crond API和CloseAI等。

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
  └── analysis/
      ├── index.js                # 云函数入口
      ├── aiModelService.js       # 统一AI模型服务（主模块）
      ├── aiModelService_part2.js # 统一AI模型服务（扩展模块1）
      ├── aiModelService_part3.js # 统一AI模型服务（扩展模块2）
      ├── keywordClassifier.js    # 关键词分类器
      ├── keywordEmotionLinker.js # 关键词情感关联
      ├── userInterestAnalyzer.js # 用户兴趣分析器
      └── package.json            # 依赖配置
```

### 3.2 核心组件

- **MODEL_PLATFORMS**：模型平台配置对象，包含各平台的基本信息
- **callModelApi**：统一的API调用函数，处理请求发送和响应解析
- **analyzeEmotion**：情感分析的统一接口
- **extractKeywords**：关键词提取的统一接口
- **getEmbeddings**：词向量获取的统一接口
- **clusterKeywords**：聚类分析的统一接口
- **analyzeUserInterests**：用户兴趣分析的统一接口

### 3.3 平台配置

每个AI模型平台的配置包括以下字段：

```javascript
{
  name: '平台名称',
  baseUrl: 'API基础URL',
  apiKeyEnv: 'API密钥环境变量名',
  defaultModel: '默认模型',
  embeddingModel: '词向量模型',
  models: ['支持的模型列表'],
  authType: '认证类型',
  endpoints: {
    chat: '聊天接口路径',
    embedding: '词向量接口路径'
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
    embeddingModel: 'embedding-3',
    models: ['glm-4-flash', 'glm-4'],
    authType: 'Bearer',
    endpoints: {
      chat: '/chat/completions',
      embedding: '/embeddings'
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
  // OpenAI
  OPENAI: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    defaultModel: 'gpt-3.5-turbo',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    authType: 'Bearer',
    endpoints: {
      chat: '/chat/completions'
    }
  },
  // Crond API
  CROND: {
    name: 'Crond API',
    baseUrl: 'https://new.crond.dev/v1',
    apiKeyEnv: 'CROND_API_KEY',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'deepseek-v3', 'o3-mini'],
    authType: 'Bearer',
    endpoints: {
      chat: '/chat/completions'
    }
  },
  // CloseAI
  CLOSEAI: {
    name: 'CloseAI',
    baseUrl: 'https://api.closeai.im/v1',
    apiKeyEnv: 'CLOSEAI_API_KEY',
    defaultModel: 'deepseek-ai/DeepSeek-V3-0324',
    models: ['deepseek-ai/DeepSeek-V3-0324'],
    authType: 'Bearer',
    endpoints: {
      chat: '/chat/completions'
    }
  }
}
```

### 4.2 API调用

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

### 4.3 情感分析

提供统一的接口进行情感分析：

```javascript
async function analyzeEmotion(text, history = [], options = {}) {
  // 验证参数
  // 获取平台和模型
  // 根据平台类型构建请求
  // 调用API
  // 解析响应
}
```

### 4.4 关键词提取

提供统一的接口提取关键词：

```javascript
async function extractKeywords(text, topK = 10, options = {}) {
  // 验证参数
  // 获取平台和模型
  // 根据平台类型构建请求
  // 调用API
  // 解析响应
}
```

### 4.5 词向量获取

提供统一的接口获取词向量：

```javascript
async function getEmbeddings(texts, options = {}) {
  // 验证参数
  // 获取平台和模型
  // 根据平台类型构建请求
  // 调用API
  // 解析响应
}
```

### 4.6 聚类分析

提供统一的接口进行聚类分析：

```javascript
async function clusterKeywords(text, threshold = 0.7, minClusterSize = 2, options = {}) {
  // 验证参数
  // 获取平台和模型
  // 根据平台类型构建请求
  // 调用API
  // 解析响应
}
```

### 4.7 用户兴趣分析

提供统一的接口分析用户兴趣：

```javascript
async function analyzeUserInterests(messages, options = {}) {
  // 验证参数
  // 获取平台和模型
  // 根据平台类型构建请求
  // 调用API
  // 解析响应
}
```

## 5. 使用方法

### 5.1 情感分析

```javascript
// 使用统一AI模型服务进行情感分析
const emotionResponse = await aiModelService.analyzeEmotion(text, history, { platform: 'GEMINI' });

// 使用OpenAI进行情感分析
const emotionResponse = await aiModelService.analyzeEmotion(text, history, { platform: 'OPENAI' });

// 使用Crond API进行情感分析
const emotionResponse = await aiModelService.analyzeEmotion(text, history, { platform: 'CROND', model: 'deepseek-v3' });

if (emotionResponse.success) {
  // 处理情感分析结果
  const result = emotionResponse.result;
  console.log('主要情感:', result.primary_emotion);
  console.log('情感强度:', result.intensity);
}
```

### 5.2 关键词提取

```javascript
// 使用统一AI模型服务提取关键词
const keywordsResponse = await aiModelService.extractKeywords(text, 10, { platform: 'ZHIPU' });

// 使用CloseAI提取关键词
const keywordsResponse = await aiModelService.extractKeywords(text, 10, { platform: 'CLOSEAI' });

if (keywordsResponse.success) {
  // 处理关键词提取结果
  const keywords = keywordsResponse.data.keywords;
  console.log('提取的关键词:', keywords);
}
```

### 5.3 词向量获取

```javascript
// 使用统一AI模型服务获取词向量
const embeddingsResponse = await aiModelService.getEmbeddings(texts, { platform: 'ZHIPU' });

if (embeddingsResponse.success) {
  // 处理词向量结果
  const embeddings = embeddingsResponse.data.embeddings;
  console.log('词向量数量:', embeddings.length);
}
```

### 5.4 聚类分析

```javascript
// 使用统一AI模型服务进行聚类分析
const clusterResponse = await aiModelService.clusterKeywords(text, 0.7, 2, { platform: 'GEMINI' });

if (clusterResponse.success) {
  // 处理聚类分析结果
  const clusters = clusterResponse.data.clusters;
  console.log('聚类数量:', clusters.length);
}
```

### 5.5 用户兴趣分析

```javascript
// 使用统一AI模型服务进行用户兴趣分析
const interestsResponse = await aiModelService.analyzeUserInterests(messages, { platform: 'ZHIPU' });

if (interestsResponse.success) {
  // 处理用户兴趣分析结果
  const interests = interestsResponse.data.interests;
  console.log('用户兴趣:', interests);
}
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

1. **支持更多模型平台**：添加更多AI模型平台的支持
2. **模型参数调整**：支持更多的模型参数调整，如temperature、top_p等
3. **流式响应**：支持流式响应，实现打字机效果
4. **多模态支持**：支持图像、音频等多模态输入
5. **模型性能监控**：添加性能监控功能，记录响应时间、成功率等指标

## 11. 总结

统一AI模型服务通过提供统一的接口和配置化的设计，大大简化了多模型平台的集成和管理。它不仅减少了代码冗余，提高了可维护性，还为未来添加新的模型平台提供了便利。

通过这个服务，Analysis云函数可以灵活地在不同的AI模型之间切换，为HeartChat提供更多样化、更高质量的情感分析和用户兴趣分析能力。
