/**
 * AI模型服务
 * 提供统一的AI模型调用接口，支持多种AI模型平台
 *
 * @architecture 该模块实现了统一的AI模型调用接口，支持智谱AI、Google Gemini、OpenAI、Crond API和CloseAI等多种模型平台
 * @dependency axios HTTP请求库
 * @history 2025-05-15 初始版本
 */

// 是否为开发环境，控制日志输出
const isDev = true; // 设置为true可以开启详细日志

// 导入axios
const axios = require('axios');

// 模型平台配置
const MODEL_PLATFORMS = {
  // 智谱AI
  ZHIPU: {
    name: '智谱',
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
  // WHIMSY
  WHIMSY: {
    name: 'Whimsy',
    baseUrl: 'https://doi9.top/v1',
    apiKeyEnv: 'WHIMSY_API_KEY',
    defaultModel: 'gemini-2.5-flash-preview-04-17-non-thinking',
    models: ['gemini-2.5-pro-preview-05-06', 'gemini-2.5-flash-preview-04-17-non-thinking', 'gemini-2.5-flash-preview-04-17'],
    authType: 'Bearer',
    endpoints: {
      chat: '/chat/completions'
    }
  },
  // Crond API
  CROND: {
    name: 'ChatGpt',
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
    name: 'DeepSeek',
    baseUrl: 'https://api.closeai.im/v1',
    apiKeyEnv: 'CLOSEAI_API_KEY',
    defaultModel: 'deepseek-ai/DeepSeek-V3-0324',
    models: ['deepseek-ai/DeepSeek-V3-0324'],
    authType: 'Bearer',
    endpoints: {
      chat: '/chat/completions'
    }
  }
};

/**
 * 延迟函数
 * @param {number} ms 延迟毫秒数
 * @returns {Promise} 延迟Promise
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取API密钥
 * @param {string} platformKey 平台键名
 * @returns {string} API密钥
 */
function getApiKey(platformKey) {
  const platform = MODEL_PLATFORMS[platformKey];
  if (!platform) {
    throw new Error(`未知的平台: ${platformKey}`);
  }

  const apiKey = process.env[platform.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`未设置${platform.apiKeyEnv}环境变量`);
  }

  return apiKey;
}

/**
 * 获取平台配置
 * @param {string} platformKey 平台键名
 * @returns {Object} 平台配置
 */
function getPlatformConfig(platformKey) {
  const platform = MODEL_PLATFORMS[platformKey];
  if (!platform) {
    throw new Error(`未知的平台: ${platformKey}`);
  }

  return platform;
}

/**
 * 格式化消息为平台特定格式
 * @param {Array} messages 消息数组
 * @param {string} platformKey 平台键名
 * @returns {Array|Object} 格式化后的消息
 */
function formatMessages(messages, platformKey) {
  console.log(`格式化消息为${platformKey}格式`, messages);

  if (platformKey === 'GEMINI') {
    // Gemini使用特殊格式
    const formattedMessages = [];
    let systemPrompt = '';

    // 提取系统提示词
    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt = msg.content;
        break;
      }
    }

    // 构建对话内容
    const contents = [];
    for (const msg of messages) {
      if (msg.role !== 'system') {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }

    // 如果有系统提示词，添加到第一个用户消息前
    if (systemPrompt && contents.length > 0) {
      const firstUserIndex = contents.findIndex(c => c.role === 'user');
      if (firstUserIndex >= 0) {
        const userMsg = contents[firstUserIndex].parts[0].text;
        contents[firstUserIndex].parts[0].text = `${systemPrompt}\n\n${userMsg}`;
      } else {
        // 如果没有用户消息，添加一个系统消息
        contents.unshift({
          role: 'user',
          parts: [{ text: systemPrompt }]
        });
      }
    }

    console.log('格式化后的Gemini消息:', { contents });
    return { contents };
  } else if (platformKey === 'WHIMSY') {
    // Whimsy使用类似OpenAI的格式，但需要特殊处理
    return messages;
  } else {
    // 其他平台(OpenAI, Crond, CloseAI, 智谱AI)使用标准格式
    console.log('使用标准格式消息');
    return messages;
  }
}

/**
 * 解析API响应
 * @param {Object} response API响应
 * @param {string} platformKey 平台键名
 * @returns {Object} 解析后的响应
 */
function parseResponse(response, platformKey) {
  console.log(`解析${platformKey}响应:`, JSON.stringify(response, null, 2));

  if (platformKey === 'GEMINI') {
    // Gemini响应格式
    if (response && response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return {
          content: candidate.content.parts[0].text,
          usage: response.usageMetadata || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        };
      }
    }
  } else if (platformKey === 'WHIMSY') {
    // Whimsy响应格式 (类似OpenAI)
    if (response && response.choices && response.choices.length > 0) {
      return {
        content: response.choices[0].message.content,
        usage: response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }
  } else if (platformKey === 'ZHIPU') {
    // 智谱AI响应格式
    if (response && response.choices && response.choices.length > 0) {
      return {
        content: response.choices[0].message.content,
        usage: response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }
  } else {
    // 标准响应格式 (OpenAI, Crond, CloseAI)
    if (response && response.choices && response.choices.length > 0) {
      return {
        content: response.choices[0].message.content,
        usage: response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }
  }

  console.error('无法解析API响应:', JSON.stringify(response, null, 2));
  throw new Error('无法解析API响应');
}

/**
 * 调用AI模型API
 * @param {Object} params 请求参数
 * @param {string} platformKey 平台键名
 * @param {number} retryCount 重试次数，默认为3
 * @param {number} retryDelay 重试延迟，默认为1000ms
 * @returns {Promise<Object>} API响应
 */
async function callModelApi(params, platformKey, retryCount = 3, retryDelay = 1000) {
  try {
    // 获取平台配置
    const platform = getPlatformConfig(platformKey);

    // 获取API密钥
    const apiKey = getApiKey(platformKey);

    // 构建请求URL
    const url = `${platform.baseUrl}${platform.endpoints.chat}`;

    // 格式化消息
    const formattedMessages = formatMessages(params.messages, platformKey);

    // 构建请求体
    let requestBody;
    if (platformKey === 'GEMINI') {
      requestBody = {
        contents: formattedMessages.contents,
        generationConfig: {
          temperature: params.temperature || 0.7,
          maxOutputTokens: params.max_tokens || 2048,
          topP: params.top_p || 1
        }
      };
    } else if (platformKey === 'WHIMSY') {
      // Whimsy API 使用类似OpenAI的格式
      requestBody = {
        model: params.model || platform.defaultModel,
        messages: formattedMessages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 2048,
        top_p: params.top_p || 1
      };
    } else if (platformKey === 'ZHIPU') {
      // 智谱AI API
      requestBody = {
        model: params.model || platform.defaultModel,
        messages: formattedMessages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 2048,
        top_p: params.top_p || 1
      };

      // 如果有response_format参数，添加到请求体
      if (params.response_format) {
        requestBody.response_format = params.response_format;
      }
    } else {
      // 其他平台(OpenAI, Crond, CloseAI)使用标准格式
      requestBody = {
        model: params.model || platform.defaultModel,
        messages: formattedMessages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 2048,
        top_p: params.top_p || 1,
        frequency_penalty: params.frequency_penalty || 0,
        presence_penalty: params.presence_penalty || 0
      };

      // 如果有response_format参数，添加到请求体
      if (params.response_format) {
        requestBody.response_format = params.response_format;
      }
    }

    if (isDev) {
      console.log(`调用${platform.name} API, 请求体:`, JSON.stringify(requestBody, null, 2));
    }

    console.log('发送请求到:', url);

    try {
      // 发送请求
      const response = await axios({
        method: 'POST',
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${platform.authType} ${apiKey}`
        },
        data: requestBody
      });

      // 检查响应状态
      if (response.status !== 200) {
        console.error(`${platform.name} API返回错误状态码:`, response.status);
        throw new Error(`${platform.name} API调用失败: 状态码 ${response.status}`);
      }

      // 获取响应数据
      const result = response.data;

      // 解析响应
      const parsedResult = parseResponse(result, platformKey);

      return parsedResult;
    } catch (error) {
      // 处理429错误（请求过多）
      if (error.response && error.response.status === 429 && retryCount > 0) {
        console.log(`遇到429错误，等待${retryDelay}ms后重试，剩余重试次数: ${retryCount-1}`);

        // 等待一段时间后重试
        await delay(retryDelay);

        // 递归调用自身，减少重试次数，增加延迟时间
        return callModelApi(params, platformKey, retryCount - 1, retryDelay * 2);
      }

      // 其他错误或重试次数用完，抛出异常
      throw error;
    }
  } catch (error) {
    console.error(`调用${platformKey} API失败:`, error);
    throw error;
  }
}

/**
 * 生成聊天回复
 * @param {string} userMessage 用户消息
 * @param {Array} history 历史消息记录
 * @param {Object} roleInfo 角色信息
 * @param {boolean} includeEmotionAnalysis 是否包含情绪分析
 * @param {string} customSystemPrompt 自定义系统提示词
 * @param {Object} options 选项，包括平台、模型和模型参数
 * @returns {Promise<Object>} 生成的回复
 */
async function generateChatReply(userMessage, history = [], roleInfo = {}, includeEmotionAnalysis = false, customSystemPrompt = null, options = {}) {
  try {
    // 验证参数
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
      return {
        success: false,
        error: '无效的用户消息'
      };
    }

    // 获取平台和模型
    const platformKey = options.platform || 'GEMINI';
    const platform = getPlatformConfig(platformKey);
    const modelName = options.model || platform.defaultModel;

    // 获取模型参数
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const max_tokens = options.max_tokens !== undefined ? options.max_tokens : 2048;
    const top_p = options.top_p !== undefined ? options.top_p : 1.0;
    const presence_penalty = options.presence_penalty !== undefined ? options.presence_penalty : 0.0;
    const frequency_penalty = options.frequency_penalty !== undefined ? options.frequency_penalty : 0.0;

    // 记录模型参数
    if (isDev) {
      console.log('模型参数:', {
        temperature,
        max_tokens,
        top_p,
        presence_penalty,
        frequency_penalty
      });
    }

    // 构建系统提示词
    let systemPrompt = '';
    if (customSystemPrompt) {
      systemPrompt = customSystemPrompt;
    } else if (roleInfo && roleInfo.prompt) {
      systemPrompt = roleInfo.prompt;
    } else {
      systemPrompt = '';
    }

    // 构建消息数组
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加历史消息
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        messages.push(msg);
      });
    }

    // 添加当前用户消息
    messages.push({ role: 'user', content: userMessage });

    if (isDev) {
      console.log(`发送到${platform.name}的消息:`, JSON.stringify(messages, null, 2));
    }

    // 调用模型API
    const response = await callModelApi({
      model: modelName,
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens,
      top_p: top_p,
      presence_penalty: presence_penalty,
      frequency_penalty: frequency_penalty
    }, platformKey);

    // 情绪分析将完全由专门的云函数 @cloudfunctions\analysis/ 处理
    const aiReply = response.content;
    const emotionAnalysis = null;

    if (includeEmotionAnalysis) {
      // 不再处理情绪分析，但保留条件分支以保持代码结构完整
      console.log('情绪分析功能已禁用，使用专门的云函数处理');
    }

    return {
      success: true,
      reply: aiReply,
      emotionAnalysis: emotionAnalysis,
      usage: response.usage
    };
  } catch (error) {
    console.error('聊天回复生成失败:', error);
    return {
      success: false,
      error: error.message || '聊天回复生成失败'
    };
  }
}

/**
 * 获取可用模型列表
 * @param {string} platformKey 平台键名
 * @returns {Promise<Array<string>>} 可用模型列表
 */
async function getAvailableModels(platformKey) {
  try {
    // 获取平台配置
    const platform = getPlatformConfig(platformKey);

    // 返回平台支持的模型列表
    return platform.models;
  } catch (error) {
    console.error('获取可用模型列表失败:', error);
    return [];
  }
}

// 导出模块
module.exports = {
  MODEL_PLATFORMS,
  generateChatReply,
  getAvailableModels,
  callModelApi
};
