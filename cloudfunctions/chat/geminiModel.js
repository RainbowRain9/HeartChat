/**
 * Google Gemini API 模块
 * 提供基于Google Gemini的聊天功能
 *
 * @architecture 该模块实现了与Google Gemini API的集成，作为智谱AI的替代选项
 * @dependency httpRequest 云函数用于发送HTTP请求
 * @history 2025-05-01 初始版本
 */

// 是否为开发环境，控制日志输出
const isDev = true; // 设置为true可以开启详细日志

// Gemini API配置
// 注意：实际使用时应从环境变量或安全配置中读取API密钥，而不是硬编码
const API_KEY = process.env.GEMINI_API_KEY || ''; // 从环境变量获取API密钥
const API_BASE_URL = 'https://apiv2.aliyahzombie.top';

// 模型配置
const GEMINI_PRO = 'gemini-2.5-flash-preview-04-17'; // 默认模型
const GEMINI_FLASH = 'gemini-2.5-flash-preview-04-17'; // 快速版本

/**
 * 延迟函数
 * @param {number} ms 延迟毫秒数
 * @returns {Promise} 延迟Promise
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 调用Google Gemini API
 * @param {Object} params 请求参数
 * @param {number} retryCount 重试次数，默认为3
 * @param {number} retryDelay 重试延迟，默认为1000ms
 * @returns {Promise<Object>} API响应
 */
async function callGeminiAPI(params, retryCount = 3, retryDelay = 1000) {
  try {
    // 验证API密钥
    if (!API_KEY) {
      console.error('未设置GEMINI_API_KEY环境变量');
      throw new Error('Gemini API密钥未配置');
    }

    // 构建请求URL
    // 使用正确的API端点，根据参考文档中的示例
    const url = `${API_BASE_URL}/v1beta/models/${params.model || GEMINI_PRO}:generateContent?key=${API_KEY}`;

    console.log('API URL:', url);

    // 构建请求体，根据参考文档中的示例
    const body = JSON.stringify({
      contents: params.contents,
      generationConfig: {
        temperature: params.temperature || 0.7,
        topP: params.topP || 0.8,
        topK: params.topK || 40,
        maxOutputTokens: params.maxOutputTokens || 2048
      }
    });

    if (isDev) {
      console.log('调用Gemini API, 请求体:', body);
    }

    // 使用axios直接发送请求
    const axios = require('axios');

    console.log('发送请求到:', url);

    try {
      const response = await axios({
        method: 'POST',
        url: url,
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.parse(body) // 将JSON字符串转换为对象
      });

      // 检查响应状态
      if (response.status !== 200) {
        console.error('Gemini API返回错误状态码:', response.status);
        throw new Error(`Gemini API调用失败: 状态码 ${response.status}`);
      }

      // 获取响应数据
      const result = response.data;

      return result;
    } catch (error) {
      // 处理429错误（请求过多）
      if (error.response && error.response.status === 429 && retryCount > 0) {
        console.log(`遇到429错误，等待${retryDelay}ms后重试，剩余重试次数: ${retryCount-1}`);

        // 等待一段时间后重试
        await delay(retryDelay);

        // 递归调用自身，减少重试次数，增加延迟时间
        return callGeminiAPI(params, retryCount - 1, retryDelay * 2);
      }

      // 其他错误或重试次数用完，抛出异常
      throw error;
    }

  } catch (error) {
    console.error('调用Gemini API失败:', error);
    throw error;
  }
}

/**
 * 将消息历史转换为Gemini API格式
 * @param {Array} history 历史消息
 * @returns {Array} Gemini格式的消息历史
 */
function formatMessagesForGemini(history) {
  if (!history || !Array.isArray(history)) {
    return [];
  }

  const formattedMessages = [];
  let currentRole = null;
  let currentParts = [];

  // 处理每条消息
  for (const message of history) {
    const role = message.role === 'assistant' ? 'model' : 'user';

    // 如果角色变化，创建新的消息对象
    if (role !== currentRole && currentParts.length > 0) {
      formattedMessages.push({
        role: currentRole,
        parts: [...currentParts]
      });
      currentParts = [];
    }

    currentRole = role;
    currentParts.push({ text: message.content });
  }

  // 添加最后一组消息
  if (currentParts.length > 0) {
    formattedMessages.push({
      role: currentRole,
      parts: [...currentParts]
    });
  }

  return formattedMessages;
}

/**
 * 使用Gemini模型生成聊天回复
 * @param {string} userMessage 用户消息
 * @param {Array} history 历史消息记录
 * @param {Object} roleInfo 角色信息
 * @param {boolean} includeEmotionAnalysis 是否包含情绪分析
 * @param {string} customSystemPrompt 自定义系统提示词
 * @returns {Promise<Object>} 生成的回复
 */
async function generateChatReply(userMessage, history = [], roleInfo = {}, includeEmotionAnalysis = false, customSystemPrompt = null) {
  try {
    // 验证参数
    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
      return {
        success: false,
        error: '无效的用户消息'
      };
    }

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

    // 添加历史消息
    formattedHistory.forEach(msg => {
      contents.push(msg);
    });

    // 添加当前用户消息
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    if (isDev) {
      console.log('发送到Gemini的消息:', JSON.stringify(contents, null, 2));
    }

    // 调用Gemini API
    const response = await callGeminiAPI({
      model: GEMINI_PRO, // 使用gemini-2.5-flash-preview-04-17模型
      contents: contents,
      temperature: 0.7, // 适当的温度，使回复更自然
      maxOutputTokens: 2048
    });

    // 解析API响应
    if (response && response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];

      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const content = candidate.content.parts[0].text;

        // 我们已经禁用了聊天回复中的情绪分析功能
        // 情绪分析将完全由专门的云函数 @cloudfunctions\analysis/ 处理
        const aiReply = content;
        const emotionAnalysis = null;

        if (includeEmotionAnalysis) {
          // 不再处理情绪分析，但保留条件分支以保持代码结构完整
          console.log('情绪分析功能已禁用，使用专门的云函数处理');
        }

        return {
          success: true,
          reply: aiReply,
          emotionAnalysis: emotionAnalysis,
          usage: response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 }
        };
      }
    }

    return {
      success: false,
      error: 'Gemini API返回的回复为空'
    };
  } catch (error) {
    console.error('Gemini聊天回复生成失败:', error);
    return {
      success: false,
      error: error.message || '聊天回复生成失败'
    };
  }
}

// 导出模块
module.exports = {
  generateChatReply,
  callGeminiAPI,
  formatMessagesForGemini,
  GEMINI_PRO,
  GEMINI_FLASH
};
