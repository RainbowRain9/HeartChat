# HeartChat Gemini API集成文档

## 功能概述

HeartChat项目集成了Google Gemini API，提供高质量的对话生成、情感分析、关键词提取和用户兴趣分析功能。Gemini模型具有强大的多模态能力和自然语言理解能力，可以为应用提供更加智能和个性化的交互体验。

## 集成架构

Gemini API的集成遵循HeartChat现有的分层架构设计，包括应用层、服务层、适配层和基础层。

### 分层架构

1. **应用层**：面向业务功能，包括聊天对话、情感分析、用户画像等
2. **服务层**：封装Gemini API的各种能力，提供标准化的服务接口
3. **适配层**：实现与Gemini API的适配和转换，处理认证、请求构建等
4. **基础层**：提供HTTP请求、日志记录等基础功能

### 集成方式

Gemini API的集成主要通过以下方式实现：

1. 创建专门的Gemini模型适配模块（`geminiModel.js`）
2. 在现有的云函数中添加对Gemini API的支持
3. 提供模型切换功能，允许在智谱AI和Gemini之间切换
4. 统一的错误处理和日志记录机制

## API密钥配置

Gemini API需要API密钥进行认证。API密钥应存储在云函数的环境变量中，确保安全性。

```javascript
// 从环境变量获取API密钥
const API_KEY = process.env.GEMINI_API_KEY || '';
```

## 云函数接口

### 1. 聊天功能

**调用方式**：
```javascript
wx.cloud.callFunction({
  name: 'chat',
  data: {
    action: 'sendMessage',
    chatId: 'chat123',
    roleId: 'role456',
    content: '用户消息内容',
    modelType: 'gemini', // 指定使用Gemini模型
    systemPrompt: '可选的系统提示词'
  }
})
```

**返回数据**：
```javascript
{
  success: true,
  chatId: 'chat123',
  isNewChat: false,
  message: { /* 用户消息对象 */ },
  aiMessages: [ /* AI回复消息数组 */ ],
  emotionAnalysis: null // 情感分析由专门的云函数处理
}
```

### 2. 情感分析

**调用方式**：
```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'emotion',
    text: '待分析的文本内容',
    modelType: 'gemini', // 指定使用Gemini模型
    saveRecord: true,  // 可选参数，是否保存记录到数据库
    roleId: 'role123',  // 可选参数，关联的角色ID
    chatId: 'chat456'   // 可选参数，关联的聊天ID
  }
})
```

**返回数据**：
```javascript
{
  success: true,
  emotion: {
    primary: {
      type: "喜悦",
      score: 0.85,
      description: "用户表现出明显的喜悦情绪..."
    },
    secondary: [
      {
        type: "期待",
        score: 0.35,
        description: "用户对未来事件有一定期待..."
      }
    ],
    keywords: ["开心", "高兴", "期待"],
    analysis: "用户整体情绪积极，表现出明显的喜悦...",
    suggestions: ["可以分享更多积极的内容...", "可以询问用户喜悦的具体原因..."]
  }
}
```

### 3. 关键词提取

**调用方式**：
```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'keywords',
    text: '待分析的文本内容',
    modelType: 'gemini', // 指定使用Gemini模型
    limit: 5  // 可选参数，限制返回的关键词数量
  }
})
```

**返回数据**：
```javascript
{
  success: true,
  keywords: [
    {
      word: "人工智能",
      weight: 0.92,
      category: "技术"
    },
    {
      word: "机器学习",
      weight: 0.85,
      category: "技术"
    }
    // ...更多关键词
  ]
}
```

### 4. 用户兴趣分析

**调用方式**：
```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'userInterests',
    text: '用户的历史消息文本',
    modelType: 'gemini', // 指定使用Gemini模型
    userId: 'user123'  // 用户ID
  }
})
```

**返回数据**：
```javascript
{
  success: true,
  interests: {
    categories: ["技术", "音乐", "旅行"],
    items: [
      {
        name: "人工智能",
        category: "技术",
        confidence: 0.95
      },
      {
        name: "古典音乐",
        category: "音乐",
        confidence: 0.87
      }
      // ...更多兴趣项
    ],
    analysis: "用户对技术领域特别是人工智能表现出浓厚兴趣..."
  }
}
```

## 模型参数配置

Gemini API支持多种参数配置，以下是常用参数：

| 参数名 | 说明 | 默认值 | 取值范围 |
|-------|------|-------|---------|
| model | 模型名称 | gemini-2.5-flash-preview-04-17 | gemini-2.5-flash-preview-04-17 |
| temperature | 温度参数，控制输出随机性 | 0.7 | 0.0-1.0 |
| topP | 控制输出多样性 | 0.8 | 0.0-1.0 |
| topK | 控制输出多样性 | 40 | 1-100 |
| maxOutputTokens | 最大输出token数 | 2048 | 1-8192 |

## 错误处理

Gemini API调用可能出现的错误类型及处理方式：

1. **认证错误**：API密钥无效或过期
   - 检查环境变量中的API密钥是否正确设置
   - 在云开发控制台更新API密钥

2. **请求错误**：请求参数不正确
   - 检查请求参数格式是否符合要求
   - 确保消息格式正确

3. **配额限制**：超出API调用配额
   - 实现请求限流机制
   - 考虑升级API使用计划

4. **模型错误**：模型处理失败
   - 实现自动重试机制
   - 降级到备用模型

## 最佳实践

1. **API密钥安全**：
   - 仅在云函数环境变量中存储API密钥
   - 不要在客户端代码中硬编码API密钥

2. **请求优化**：
   - 合理设置temperature参数，控制回复的创造性
   - 对于情感分析等任务，使用较低的temperature值（0.1-0.3）
   - 对于创意对话，使用较高的temperature值（0.7-0.9）

3. **错误处理**：
   - 实现优雅的错误处理和降级策略
   - 在API调用失败时提供友好的用户提示

4. **缓存策略**：
   - 对频繁使用的分析结果实现缓存机制
   - 减少不必要的API调用，控制成本

## 更新日志

- 2025-05-01: 初始版本，集成Gemini API基础功能
- 2025-05-02: 添加模型切换功能，支持在智谱AI和Gemini之间切换
- 2025-05-03: 优化Gemini API的错误处理和重试机制
- 2025-05-04: 修改默认模型类型为Gemini，设置API基础URL为https://apiv2.aliyahzombie.top，使用模型ID为gemini-2.5-flash-preview-04-17
