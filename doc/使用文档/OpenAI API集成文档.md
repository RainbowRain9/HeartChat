# OpenAI API 集成文档

## 概述

HeartChat 现已支持 OpenAI API，可以使用 OpenAI 的大语言模型进行聊天对话。本文档介绍了 OpenAI API 的集成方式、配置方法和使用指南。

## 功能特性

- 支持 OpenAI 的 GPT-3.5-Turbo、GPT-4 和 GPT-4-Turbo 模型
- 在聊天界面可以实时切换不同的 AI 模型（智谱AI、Google Gemini、OpenAI）
- 与现有的智谱AI和Google Gemini模型保持一致的接口和使用方式
- 支持对话历史记录、角色记忆和情感分析等核心功能

## 配置方法

### 环境变量配置

在云函数环境中，需要设置以下环境变量：

- `OPENAI_API_KEY`：OpenAI API 密钥

可以通过以下步骤配置环境变量：

1. 登录微信云开发控制台
2. 进入云函数 -> 环境变量
3. 添加环境变量 `OPENAI_API_KEY`，值为你的 OpenAI API 密钥
4. 保存配置

### 模型配置

OpenAI 模型配置在 `cloudfunctions/chat/openaiModel.js` 文件中：

```javascript
// 模型配置
const GPT_3_5_TURBO = 'gpt-3.5-turbo'; // 默认模型
const GPT_4 = 'gpt-4'; // 高级模型
const GPT_4_TURBO = 'gpt-4-turbo'; // 高级模型的快速版本
```

默认使用 `gpt-3.5-turbo` 模型，如需使用其他模型，可以修改代码中的默认值或在调用时指定模型。

## 使用方法

### 在聊天界面切换模型

1. 打开聊天界面
2. 点击导航栏右侧的模型选择器
3. 在弹出的模型列表中选择 "OpenAI"
4. 系统会自动测试连接并切换到 OpenAI 模型

### 通过代码调用

可以通过以下方式在代码中指定使用 OpenAI 模型：

```javascript
// 在发送消息时指定模型类型
wx.cloud.callFunction({
  name: 'chat',
  data: {
    action: 'sendMessage',
    chatId: chatId,
    roleId: roleId,
    content: message,
    modelType: 'openai' // 指定使用 OpenAI 模型
  }
});
```

### 模型服务接口

`modelService.js` 提供了以下接口用于模型管理：

- `getAvailableModelTypes()`：获取所有可用的模型类型
- `getSelectedModelType()`：获取当前选择的模型类型
- `setSelectedModelType(modelType)`：设置选择的模型类型
- `getModelDisplayName(modelType)`：获取模型类型的显示名称
- `getModelConfig(modelType)`：获取模型配置信息
- `testModelConnection(modelType)`：测试模型连接

## 技术实现

### 文件结构

- `cloudfunctions/chat/openaiModel.js`：OpenAI 模型实现
- `miniprogram/services/modelService.js`：模型服务
- `miniprogram/components/model-selector/`：模型选择器组件

### OpenAI API 调用

OpenAI API 调用通过 `callOpenAIAPI` 函数实现：

```javascript
async function callOpenAIAPI(params, retryCount = 3, retryDelay = 1000) {
  // 验证API密钥
  if (!API_KEY) {
    throw new Error('OpenAI API密钥未配置');
  }

  // 构建请求URL和请求体
  const url = `${API_BASE_URL}/chat/completions`;
  const body = JSON.stringify({
    model: params.model || GPT_3_5_TURBO,
    messages: params.messages,
    temperature: params.temperature || 0.7,
    max_tokens: params.max_tokens || 2048,
    top_p: params.top_p || 1,
    frequency_penalty: params.frequency_penalty || 0,
    presence_penalty: params.presence_penalty || 0
  });

  // 发送请求并处理响应
  // ...
}
```

### 聊天回复生成

聊天回复通过 `generateChatReply` 函数实现：

```javascript
async function generateChatReply(userMessage, history = [], roleInfo = {}, includeEmotionAnalysis = false, customSystemPrompt = null) {
  // 构建系统提示词
  let systemPrompt = customSystemPrompt || roleInfo.prompt || '你是一个友好的AI助手';

  // 构建消息数组
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // 添加历史消息和当前用户消息
  // ...

  // 调用OpenAI API
  const response = await callOpenAIAPI({
    model: GPT_3_5_TURBO,
    messages: messages,
    temperature: 0.7,
    max_tokens: 2048
  });

  // 解析API响应
  // ...
}
```

## 注意事项

1. **API 密钥安全**：确保 OpenAI API 密钥安全，不要在客户端代码中硬编码
2. **费用控制**：OpenAI API 是付费服务，请注意控制使用量，避免产生过高费用
3. **错误处理**：实现了重试机制，但仍需注意处理 API 调用失败的情况
4. **模型兼容性**：不同模型的能力和特性有差异，可能需要针对特定模型调整提示词

## 常见问题

### Q: 如何获取 OpenAI API 密钥？
A: 访问 [OpenAI API 网站](https://platform.openai.com/)，注册账号并创建 API 密钥。

### Q: 为什么切换到 OpenAI 模型后没有响应？
A: 请检查以下几点：
   - 确认已正确配置 OpenAI API 密钥
   - 检查网络连接是否正常
   - 查看云函数日志，了解具体错误信息

### Q: 不同模型之间的回复有什么差异？
A: 不同模型有各自的特点：
   - 智谱AI (GLM-4-Flash)：中文理解能力强，适合中文场景
   - Google Gemini：多模态能力强，理解力和创造力较好
   - OpenAI (GPT-3.5/4)：通用能力强，英文表现尤其出色

## 更新历史

- 2025-05-10：初始版本，实现 OpenAI API 集成
- 2025-05-10：添加模型选择器组件，支持在聊天界面切换模型
