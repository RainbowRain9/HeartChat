# Gemini API 集成开发文档

## 1. 引言

### 1.1. 目的
本文档旨在指导开发者将 Google Gemini API 集成到 HeartChat 项目中，以增强应用的 AI 对话、情感分析及其他潜在智能功能。

### 1.2. 背景
为了提供更先进、更多样化的 AI 交互体验，HeartChat 计划引入 Google 的 Gemini 系列模型。Gemini 模型在多模态理解、复杂推理和对话能力方面表现出色，有望提升用户满意度和应用核心竞争力。

## 2. Gemini API 概述

### 2.1. 可用模型
HeartChat 初步计划集成以下 Gemini 模型：
- **Gemini Pro**: 用于平衡性能和成本的文本生成和对话任务。 (例如模型标识符：`gemini-pro` 或 `gemini-1.0-pro`)
- **Gemini Flash**: (例如模型标识符：`gemini-1.5-flash-latest`) 适用于对延迟敏感且成本效益要求高的场景。
- (未来可能考虑 Gemini Ultra 或更高级版本，根据需求和API支持情况)

### 2.2. 主要功能
- **文本生成**: 根据提示生成高质量文本。
- **多轮对话**: 支持上下文感知的对话交互。
- (潜在功能：多模态输入处理，如果API支持且项目需要)

### 2.3. API 认证方式
Gemini API 通常使用 API Key 进行认证。API Key 需要妥善保管，并通过云函数的环境变量进行配置。

## 3. 云函数集成方案 (`httpRequest`)

HeartChat 项目通过统一的 `httpRequest` 云函数调用外部AI服务。我们将扩展此云函数以支持 Gemini API。

### 3.1. API 密钥管理
1.  在 Google AI Studio 或 Google Cloud Console 获取 Gemini API Key。
2.  在微信小程序云开发控制台中，为 `httpRequest` 云函数配置环境变量：
    *   `GEMINI_API_KEY`: 存储您的 Gemini API Key。

### 3.2. 扩展 `httpRequest` 云函数

#### 3.2.1. 新增 `provider`: `gemini`
在 `httpRequest` 云函数的逻辑中，增加对 `provider: 'gemini'` 的处理分支。

#### 3.2.2. 请求参数设计
调用 `httpRequest` 时，传递给云函数的 `event` 对象结构如下：

```javascript
// 调用 Gemini 服务示例
wx.cloud.callFunction({
  name: 'httpRequest',
  data: {
    provider: 'gemini',
    action: 'chat', // 或 'generateContent', 'countTokens' 等 Gemini 支持的操作
    config: { // 可选，用于覆盖默认模型等配置
      model: 'gemini-pro', // 例如：'gemini-pro', 'gemini-1.5-flash-latest'
      // 其他 Gemini 特定配置
    },
    data: { // 传递给 Gemini API 的核心数据
      contents: [ // Gemini API 的 contents 结构
        {
          role: "user", // 或 "model"
          parts: [{ text: "你好，世界！" }]
        },
        // ... 更多历史消息 (user/model 交替)
      ],
      generationConfig: { // Gemini API 的 generationConfig
        temperature: 0.7,
        topP: 0.9, // Gemini API 中可能用 top_p
        topK: 40,  // Gemini API 中可能用 top_k
        maxOutputTokens: 2048,
        // stopSequences: ["
"], // 停止序列
        // candidateCount: 1, // 生成候选数量
      },
      safetySettings: [ // 可选，安全设置
        // { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        // { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        // { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        // { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
      ],
      stream: false // 是否使用流式输出，默认为 false
    }
  }
});
```

#### 3.2.3. Gemini API 调用逻辑
在 `httpRequest` 云函数内部，当 `provider` 为 `gemini` 时：
1.  从环境变量中读取 `GEMINI_API_KEY`。
2.  根据 `action` 和 `event.data` 构建向 Gemini API 发送的请求。
    *   Gemini API 的端点通常是：`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${method}`。
        *   `modelName`: 例如 `gemini-pro` 或 `gemini-1.5-flash-latest`。
        *   `method`:
            *   非流式文本生成: `generateContent`
            *   流式文本生成: `streamGenerateContent`
            *   计算Token数: `countTokens`
            *   获取模型信息: `getModel`
            *   列出模型: `listModels` (可能不需要通过此函数)
            *   嵌入文本: `embedContent` (如果需要)
    *   请求方法：`POST` (大部分情况) 或 `GET` (如 `getModel`, `listModels`)。
    *   请求头：`Content-Type: application/json`。
    *   URL参数：`key=${GEMINI_API_KEY}`。
    *   请求体：根据具体 `method` 而定，例如 `generateContent` 通常包含 `contents`, `generationConfig`, `safetySettings`。

3.  使用 `got` (或微信云函数推荐的 HTTP 请求库) 发送请求。

#### 3.2.4. 响应处理与格式化
- **非流式响应 (`generateContent`)**:
    - 解析 Gemini API 返回的 JSON 数据。
    - 提取生成的文本内容 (通常在 `candidates[0].content.parts[0].text`)。
    - 同时关注 `candidates[0].finishReason` (如 `STOP`, `MAX_TOKENS`, `SAFETY` 等) 和 `promptFeedback`。
    - 将其包装在标准化的成功响应结构中返回给小程序端。
- **流式响应 (`streamGenerateContent`)**:
    - 如果 `data.stream` 为 `true`，`httpRequest` 云函数需要建立与 Gemini API 的流式连接。
    - Gemini API 的流式响应是 Server-Sent Events (SSE) 格式。
    - **挑战**: 微信云函数直接将 SSE 流式响应转发给小程序端存在较大困难。
    - **初步解决方案**:
        1.  **推荐**: 先期实现非流式版本。
        2.  **后续优化**:
            *   **前端模拟流式**: 云函数一次性获取完整响应，然后前端通过定时器逐字显示，模拟打字机效果。这并非真流式，但能改善部分体验。
            *   **WebSocket 中转**: 搭建一个支持 WebSocket 的中间服务，云函数将 Gemini 的 SSE 流推送到此服务，小程序再通过 WebSocket 连接接收。这会增加架构复杂度。
            *   **小程序端直接请求 (不推荐)**: 不通过云函数，小程序端直接请求 Gemini API (如果 Google 允许跨域且能处理 API Key 安全问题)。这通常不推荐，因为 API Key 暴露在前端风险很高。
    - 如果决定尝试在云函数层面处理 SSE 并分块返回，需要仔细研究微信云函数对 HTTP 响应的限制。

#### 3.2.5. 错误处理
捕获 Gemini API 返回的错误 (HTTP 状态码非 200，或响应体中包含错误信息)，并将其转换为项目统一的错误格式返回给小程序端。常见的错误包括：
- `400 Bad Request`: 请求参数错误。
- `401 Unauthorized`: API Key 无效或未提供。
- `403 Forbidden`: API Key 权限不足。
- `429 Resource Exhausted`: 请求频率超限或配额不足。
- `500 Internal Server Error`: Google 服务器内部错误。
- `503 Service Unavailable`: 服务暂时不可用。

### 3.3. 示例代码片段 (在 `httpRequest/index.js` 中)

```javascript
// httpRequest/index.js (示意代码)
// 确保已安装 got: npm install got

const got = require('got');

// ... 其他 provider 的处理 ...

else if (event.provider === 'gemini') {
  const { GEMINI_API_KEY } = process.env;
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API Key not configured in environment variables', code: 500 };
  }

  const modelName = event.config?.model || 'gemini-pro'; // 默认模型
  const geminiPayload = event.data; // { contents, generationConfig, safetySettings, stream }
  const action = event.action || 'chat'; // 默认为 chat, 对应 generateContent

  let apiMethodPath;
  let httpMethod = 'POST'; // 默认为POST

  switch (action) {
    case 'chat':
    case 'generateContent':
      apiMethodPath = geminiPayload.stream ? `:streamGenerateContent` : `:generateContent`;
      break;
    case 'countTokens':
      apiMethodPath = `:countTokens`;
      break;
    // case 'embedContent': // 如果需要嵌入功能
    //   apiMethodPath = `:embedContent`;
    //   break;
    default:
      return { success: false, error: `Unsupported Gemini action: ${action}`, code: 400 };
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}${apiMethodPath}?key=${GEMINI_API_KEY}`;

  try {
    if (geminiPayload.stream && (action === 'chat' || action === 'generateContent')) {
      // TODO: 实现流式请求和响应处理 (挑战较大)
      console.warn('Gemini streaming is requested but not yet fully implemented in httpRequest for direct cloud function response.');
      // 暂时按非流式处理或返回特定提示
      // return { success: false, error: 'Gemini streaming not yet fully supported for direct cloud function response', code: 501 };
      // 作为临时方案，可以强制非流式处理
      const nonStreamApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
      const requestBody = {
        contents: geminiPayload.contents,
        generationConfig: geminiPayload.generationConfig,
        safetySettings: geminiPayload.safetySettings,
      };
      const response = await got.post(nonStreamApiUrl, {
        json: requestBody,
        responseType: 'json'
      });
       // (与下方非流式响应处理逻辑相同)
      if (response.body && response.body.candidates && response.body.candidates.length > 0) {
        const candidate = response.body.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const assistantMessage = candidate.content.parts[0].text;
          return {
            success: true,
            data: {
              role: 'model', // Gemini uses 'model'
              content: assistantMessage,
              finishReason: candidate.finishReason,
              usageMetadata: response.body.usageMetadata, // 包含 token 计数等
              promptFeedback: response.body.promptFeedback
            }
          };
        }
      }
      return { success: false, error: 'Unexpected response structure from Gemini API (simulated non-stream)', data: response.body, code: 500 };

    } else if (action === 'chat' || action === 'generateContent') {
      // 非流式请求
      const requestBody = {
        contents: geminiPayload.contents,
        generationConfig: geminiPayload.generationConfig,
        safetySettings: geminiPayload.safetySettings,
      };
      const response = await got.post(apiUrl, {
        json: requestBody,
        responseType: 'json'
      });

      if (response.body && response.body.candidates && response.body.candidates.length > 0) {
        const candidate = response.body.candidates[0];
        // 检查 candidate.content 是否存在，因为 safety anootations 可能导致没有 content
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const assistantMessage = candidate.content.parts[0].text;
          return {
            success: true,
            data: {
              role: 'model', // Gemini uses 'model'
              content: assistantMessage,
              finishReason: candidate.finishReason, // e.g., "STOP", "MAX_TOKENS", "SAFETY"
              // usageMetadata: response.body.usageMetadata // 仅部分模型和方法提供
              // promptFeedback: response.body.promptFeedback // 包含安全评估结果
            }
          };
        } else if (candidate.finishReason === 'SAFETY') {
           return { success: false, error: 'Content generation stopped due to safety concerns.', code: 400, details: candidate.safetyRatings };
        }
      }
      // 如果响应结构不符合预期或没有有效候选
      console.error('Unexpected response structure or no valid candidate from Gemini API:', response.body);
      return { success: false, error: 'Unexpected response structure or no valid candidate from Gemini API', data: response.body, code: 500 };

    } else if (action === 'countTokens') {
      const requestBody = { contents: geminiPayload.contents };
      const response = await got.post(apiUrl, {
        json: requestBody,
        responseType: 'json'
      });
      if (response.body && response.body.totalTokens) {
        return { success: true, data: { totalTokens: response.body.totalTokens } };
      }
      return { success: false, error: 'Failed to count tokens', data: response.body, code: 500 };
    }
    // ... 其他 action 的处理 ...
  } catch (error) {
    console.error('Gemini API call error in cloud function:', error.response ? JSON.stringify(error.response.body) : error.message);
    const errorBody = error.response ? error.response.body : null;
    let errorMessage = 'Gemini API request failed';
    if (errorBody && errorBody.error && errorBody.error.message) {
        errorMessage = errorBody.error.message;
    }
    return {
      success: false,
      error: errorMessage,
      details: errorBody,
      code: error.response ? error.response.statusCode : 500
    };
  }
}

// ...
```

## 4. 前端调用方式

### 4.1. 小程序端 `wx.cloud.callFunction`
小程序端通过调用 `httpRequest` 云函数来与 Gemini API 交互。

### 4.2. 参数传递
参照 3.2.2 中的请求参数设计，构建传递给云函数的 `data` 对象。特别注意将聊天历史转换为 Gemini API 所需的 `contents` 格式。

### 4.3. 接收和处理响应
- **非流式**: 直接从云函数返回的 `result.data.content` 中获取 AI 回复。检查 `result.success` 和 `result.error` 进行错误处理。
- **流式 (如果后续实现)**: 前端需要有能力处理从云函数（或WebSocket代理）接收到的连续数据块，并逐步更新UI。

### 4.4. 示例代码 (小程序 JS - 聊天场景)

```javascript
// 在小程序的 chat 页面或相关 service 文件中

async function sendChatMessageToGemini(userMessage, historyMessages = [], selectedModel = 'gemini-pro') {
  // 构建 Gemini 'contents' 数组
  // historyMessages 格式: [{role: 'user'/'assistant', content: '...'}]
  // Gemini 'contents' 格式: [{role: 'user'/'model', parts: [{text: '...'}]}]

  const contents = [];
  // 可以选择性地添加一个全局的系统指令作为contents数组的第一个元素，角色为user。
  // 例如: contents.push({ role: "user", parts: [{ text: "你是一个乐于助人的AI助手，请用友善和简洁的语言回答问题。" }] });
  // 注意：Gemini 没有专门的 system 角色，系统指令通常放在第一个 user message 中，或者由 'model' 自身通过微调习得。
  // 或者，如果API支持，可以使用 `system_instruction` 字段 (需要查阅具体模型的API文档)

  historyMessages.forEach(msg => {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model', // 项目中使用 'assistant' 对应 Gemini 的 'model'
      parts: [{ text: msg.content }]
    });
  });
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  try {
    console.log('Sending to Gemini:', JSON.stringify(contents, null, 2));
    const res = await wx.cloud.callFunction({
      name: 'httpRequest',
      data: {
        provider: 'gemini',
        action: 'chat', // 或 'generateContent'
        config: {
          model: selectedModel // 从用户配置或默认值读取
        },
        data: {
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000, // 根据需要调整
            // topP: 0.9,
            // topK: 40,
          },
          // safetySettings: [ // 根据需要配置安全等级
          //   { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          //   { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          //   { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          //   { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
          // ],
          stream: false // 初始设置为 false
        }
      }
    });

    console.log('Gemini cloud function response:', res);

    if (res.result && res.result.success) {
      const aiResponse = res.result.data.content;
      const finishReason = res.result.data.finishReason;
      console.log('Gemini AI Response:', aiResponse, 'Finish Reason:', finishReason);
      // 在这里更新聊天界面，显示AI的回复
      return { success: true, content: aiResponse, finishReason: finishReason };
    } else {
      const errorMsg = res.result ? (res.result.error + (res.result.details ? ` (${JSON.stringify(res.result.details)})` : '')) : 'Unknown error from cloud function';
      console.error('Gemini API call failed from frontend:', errorMsg);
      // 向用户显示更友好的错误提示
      return { success: false, error: '抱歉，AI服务暂时遇到问题，请稍后再试。', details: errorMsg };
    }
  } catch (error) {
    console.error('Error calling cloud function for Gemini:', error);
    return { success: false, error: '抱歉，与AI服务通信失败，请检查网络或稍后再试。', details: error.toString() };
  }
}
```

## 5. 应用场景

### 5.1. 聊天功能集成
-   **消息格式转换**: 在 `miniprogram/packageChat/pages/chat/chat.js` (或管理聊天逻辑的service层) 中，发送消息前，将项目的聊天历史消息格式转换为 Gemini API 所需的 `contents` 格式。
-   **模型选择**: 可以在应用设置中允许用户选择偏好的AI模型（例如，在已有的智谱、文心模型之外增加Gemini选项），或者后端根据特定场景智能路由到Gemini。
-   **上下文管理**: 确保传递给Gemini的 `contents` 包含适当长度和结构的对话历史，以维持上下文连贯性。考虑Token限制。

### 5.2. 情感分析
虽然 Gemini 主要用于生成文本，但可以通过精心设计的提示词 (prompt engineering) 来引导模型进行情感分析。例如，在 `contents` 的最后一条用户消息后追加：
`{ role: "user", parts: [{text: "请分析以上对话中我的主要情绪是什么，并给出简要说明。"}] }`
然后解析模型的回复。这需要一个特定的 `action` 或在前端调用时修改 `contents`。

### 5.3. 其他潜在应用
-   **每日报告内容生成**: 利用 Gemini 生成每日心情报告中的总结文字或建议。
-   **角色扮演增强**: Gemini 的强对话能力可能用于提升AI角色的扮演真实感和互动性。
-   **文本摘要**: 对较长的聊天记录或用户输入进行摘要。
-   **创意写作辅助**: 帮助用户进行创意性写作。

## 6. 配置与部署

1.  **云函数依赖**:
    *   确保 `cloudfunctions/httpRequest/package.json` 中已添加 `got` 依赖 (`npm install got` 在云函数目录下执行)。
2.  **云函数部署**:
    *   修改 `cloudfunctions/httpRequest/index.js` 以包含 Gemini 的处理逻辑。
    *   将更新后的 `httpRequest` 云函数（包括 `node_modules`）上传并部署到云开发环境。
3.  **环境变量配置**:
    *   在微信开发者工具的云开发控制台，为 `httpRequest` 云函数配置 `GEMINI_API_KEY` 环境变量。

## 7. 测试

1.  **云函数测试**:
    *   使用云函数控制台的 "云端测试" 功能，构造符合 3.2.2 节定义的 `event` 对象，模拟调用 `httpRequest` (provider: 'gemini')。
    *   测试不同的 `action` (如 `generateContent`, `countTokens`)。
    *   验证与 Gemini API 的连通性、认证、参数传递和响应解析是否正确。
    *   测试错误处理逻辑（例如，使用无效的API Key，或发送格式错误的请求体）。
2.  **集成测试 (小程序端)**:
    *   在小程序聊天界面，实际发起对话，选择或切换到 Gemini 模型。
    *   验证 Gemini 的回复是否正确获取并显示。
    *   测试不同参数（如 temperature, maxOutputTokens）对回复的影响。
    *   检查用户历史消息是否正确转换为 `contents` 格式。
    *   测试前端的错误提示是否友好。
3.  **场景测试**:
    *   测试长对话的上下文保持情况。
    *   测试特定提示词的效果（如用于情感分析或角色扮演）。
    *   测试安全设置 (`safetySettings`) 的过滤效果。

## 8. 注意事项与未来展望

-   **API成本与配额**: 密切关注 Gemini API 的调用成本和Google Cloud项目中的配额限制。不同模型（Pro, Flash）的定价不同。
-   **模型版本管理**: Gemini API 和模型会持续更新。注意API文档中的版本号 (e.g., `v1beta`) 和模型名称 (e.g., `gemini-1.0-pro`, `gemini-1.5-pro-latest`, `gemini-1.5-flash-latest`)。选择最新的稳定版本。
-   **Token限制**: Gemini 模型有输入和输出的Token限制。需要处理超长对话历史（例如，截断、摘要）。可以使用 `countTokens` 方法预估Token数。
-   **安全性设置 (`safetySettings`)**: Gemini API 允许配置安全设置以过滤潜在有害内容。应根据应用场景和目标用户群合理配置，平衡安全与表达自由。
-   **流式输出体验**: 为了聊天等即时交互场景获得最佳用户体验，后续应投入资源研究和实现从小程序到云函数再到Gemini API的真流式数据传输方案。
-   **多模态能力**: 若项目有需求，未来可逐步探索和集成 Gemini 的多模态能力 (如图像理解、视频分析等)。
-   **错误监控与日志**: 在云函数和前端加强对Gemini API调用相关的错误监控和详细日志记录，方便快速定位和解决问题。
-   **遵守Google API服务条款和使用政策。**
-   **区域可用性**: 注意 Gemini API 和特定模型可能存在的区域可用性限制。 