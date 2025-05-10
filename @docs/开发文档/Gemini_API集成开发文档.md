# Google Gemini API 集成开发文档

## 1. 概述

本文档详细说明了HeartChat微信小程序中Google Gemini API的集成方案。Gemini是Google推出的大型语言模型，具有强大的自然语言理解和生成能力，可以为HeartChat提供高质量的对话生成、情感分析和关键词提取功能。

## 2. 架构设计

### 2.1 集成架构

Gemini API的集成遵循HeartChat现有的分层架构设计：

1. **应用层**：面向业务功能，包括聊天对话、情感分析、用户画像等
2. **服务层**：封装Gemini API的各种能力，提供标准化的服务接口
3. **适配层**：实现与Gemini API的适配和转换，处理认证、请求构建等
4. **基础层**：提供HTTP请求、日志记录等基础功能

### 2.2 模块结构

Gemini API的集成主要涉及以下模块：

- `cloudfunctions/chat/geminiModel.js`：提供基于Gemini的聊天功能
- `cloudfunctions/analysis/geminiModel.js`：提供基于Gemini的情感分析和关键词提取功能
- `miniprogram/services/modelService.js`：提供模型选择和管理功能

## 3. API接口说明

### 3.1 Gemini API基本信息

- **API基础URL**：`https://apiv2.aliyahzombie.top`
- **支持的模型**：
  - `gemini-2.5-flash-preview-04-17`：当前使用的模型
- **认证方式**：API密钥（API Key）

### 3.2 主要接口

#### 3.2.1 生成内容接口

```
POST /models/{model}:generateContent
```

**请求参数**：

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "用户消息内容"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "topP": 0.8,
    "topK": 40,
    "maxOutputTokens": 2048
  }
}
```

**响应格式**：

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "AI回复内容"
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0,
      "safetyRatings": [...]
    }
  ],
  "promptFeedback": {...},
  "usageMetadata": {
    "promptTokenCount": 20,
    "candidatesTokenCount": 30,
    "totalTokenCount": 50
  }
}
```

## 4. 实现细节

### 4.1 聊天功能实现

在`cloudfunctions/chat/geminiModel.js`中，我们实现了以下主要功能：

1. **消息格式转换**：将HeartChat的消息格式转换为Gemini API所需的格式
2. **聊天回复生成**：调用Gemini API生成聊天回复
3. **错误处理**：处理API调用过程中可能出现的各种错误

关键代码：

```javascript
async function generateChatReply(userMessage, history = [], roleInfo = {}, includeEmotionAnalysis = false, customSystemPrompt = null) {
  try {
    // 构建系统提示词
    let systemPrompt = '';
    if (customSystemPrompt) {
      systemPrompt = customSystemPrompt;
    } else if (roleInfo && roleInfo.prompt) {
      systemPrompt = roleInfo.prompt;
    } else {
      systemPrompt = '你是一个友好的AI助手，能够提供有用的信息和支持。';
    }

    // 格式化历史消息
    const formattedHistory = formatMessagesForGemini(history);

    // 构建请求内容
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      }
    ];

    // 添加历史消息和当前用户消息
    formattedHistory.forEach(msg => {
      contents.push(msg);
    });

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    // 调用Gemini API
    const response = await callGeminiAPI({
      model: GEMINI_PRO, // 使用gemini-2.5-flash-preview-04-17模型
      contents: contents,
      temperature: 0.7
    });

    // 解析API响应
    if (response && response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];

      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const content = candidate.content.parts[0].text;
        return {
          success: true,
          reply: content,
          emotionAnalysis: null,
          usage: response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 }
        };
      }
    }

    return {
      success: false,
      error: 'Gemini API返回的回复为空'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || '聊天回复生成失败'
    };
  }
}
```

### 4.2 情感分析实现

在`cloudfunctions/analysis/geminiModel.js`中，我们实现了以下主要功能：

1. **情感分析**：分析文本中表达的情感，包括情感类型、强度、关键词等
2. **关键词提取**：从文本中提取重要的关键词

关键代码：

```javascript
async function analyzeEmotion(text, history = []) {
  try {
    // 构建提示词
    const prompt = `分析以下文本的情感，并以JSON格式返回结果。文本内容：

${text}

请分析文本中表达的情感，并以以下JSON格式返回结果：
{
  "primary": {
    "type": "情绪类型",
    "score": 0.8,
    "description": "对主要情绪的详细描述"
  },
  "secondary": [
    {
      "type": "次要情绪类型1",
      "score": 0.4,
      "description": "对次要情绪的详细描述"
    }
  ],
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "analysis": "整体情感分析描述",
  "suggestions": ["建议1", "建议2"]
}`;

    // 构建请求内容
    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    // 调用Gemini API
    const response = await callGeminiAPI({
      model: GEMINI_PRO, // 使用gemini-2.5-flash-preview-04-17模型
      contents: contents,
      temperature: 0.3
    });

    // 解析API响应
    if (response && response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];

      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const content = candidate.content.parts[0].text;

        try {
          // 尝试解析JSON响应
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            const result = JSON.parse(jsonStr);

            return {
              success: true,
              emotion: result,
              usage: response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 }
            };
          }
        } catch (parseError) {
          return {
            success: false,
            error: '解析情感分析结果失败'
          };
        }
      }
    }

    return {
      success: false,
      error: 'Gemini API返回的情感分析结果为空'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || '情感分析失败'
    };
  }
}
```

### 4.3 模型选择实现

在`miniprogram/services/modelService.js`中，我们实现了以下主要功能：

1. **模型类型管理**：提供模型类型的获取和设置功能
2. **模型配置信息**：提供各模型的配置信息
3. **模型连接测试**：测试模型连接是否正常

## 5. 使用方法

### 5.1 在聊天功能中使用Gemini

```javascript
// 在发送消息时使用Gemini模型（现在是默认模型，无需特别指定）
wx.cloud.callFunction({
  name: 'chat',
  data: {
    action: 'sendMessage',
    chatId: 'chat123',
    roleId: 'role456',
    content: '用户消息内容',
    systemPrompt: '可选的系统提示词'
  }
})

// 如果需要明确指定使用Gemini模型
wx.cloud.callFunction({
  name: 'chat',
  data: {
    action: 'sendMessage',
    chatId: 'chat123',
    roleId: 'role456',
    content: '用户消息内容',
    modelType: 'gemini', // 明确指定使用Gemini模型
    systemPrompt: '可选的系统提示词'
  }
})
```

### 5.2 在情感分析中使用Gemini

```javascript
// 在情感分析时使用Gemini模型（现在是默认模型，无需特别指定）
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'emotion',
    text: '待分析的文本内容',
    saveRecord: true
  }
})

// 如果需要明确指定使用Gemini模型
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'emotion',
    text: '待分析的文本内容',
    modelType: 'gemini', // 明确指定使用Gemini模型
    saveRecord: true
  }
})
```

### 5.3 切换模型类型

```javascript
// 导入模型服务
const modelService = require('../../services/modelService');

// 默认情况下，系统已设置为使用Gemini模型
// 如果需要切换到智谱AI
modelService.setSelectedModelType(modelService.MODEL_TYPES.ZHIPU);

// 如果需要切换回Gemini
modelService.setSelectedModelType(modelService.MODEL_TYPES.GEMINI);

// 获取当前模型类型
const currentModelType = modelService.getSelectedModelType();
```

## 6. 配置和部署

### 6.1 环境变量配置

在云函数中，需要设置以下环境变量：

- `GEMINI_API_KEY`：Google Gemini API密钥

### 6.2 部署步骤

1. 上传并部署`chat`云函数
2. 上传并部署`analysis`云函数
3. 上传小程序代码

## 7. 注意事项

1. **API密钥安全**：API密钥应存储在云函数的环境变量中，不要在客户端代码中硬编码
2. **请求限制**：注意Gemini API的请求限制，避免超出配额
3. **错误处理**：实现完善的错误处理机制，确保在API调用失败时能够优雅降级
4. **响应解析**：注意处理Gemini API返回的JSON格式，确保正确解析

## 8. 参考资料

- [Google Gemini API官方文档](https://ai.google.dev/gemini-api/docs)
- [Google Gemini API参考](https://ai.google.dev/gemini-api/reference)
- [Google Gemini API示例](https://ai.google.dev/gemini-api/examples)
