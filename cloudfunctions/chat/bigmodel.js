/**
 * 智谱AI (BigModel) 模块
 * 提供基于智谱AI的聊天功能
 */
const axios = require('axios');

// 智谱AI API配置
// 注意：实际使用时应从环境变量或安全配置中读取API密钥，而不是硬编码
const API_KEY = process.env.ZHIPU_API_KEY || ''; // 从环境变量获取API密钥
const API_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';

// 模型配置
const GLM_4_FLASH = 'glm-4-flash'; // 快速版本，适合对话

/**
 * 生成智谱AI API请求所需的认证头
 * @returns {Object} 包含Authorization的请求头
 */
function getAuthHeaders() {
  // 实际项目中应使用智谱AI SDK进行认证
  // 这里简化处理，假设API_KEY已经是完整的Bearer Token
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  };
}

/**
 * 使用GLM-4-Flash模型生成聊天回复
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

    // 优先使用自定义系统提示词（包含用户画像信息）
    if (customSystemPrompt) {
      systemPrompt = customSystemPrompt;
      console.log('使用自定义系统提示词（包含用户画像）');
    } else if (roleInfo && roleInfo.prompt) {
      // 优先使用角色的prompt字段（为了兼容系统预设角色）
      systemPrompt = roleInfo.prompt;
      console.log('使用角色的prompt字段作为系统提示词');
    } else if (roleInfo && roleInfo.system_prompt) {
      // 如果没有prompt，则使用system_prompt字段
      systemPrompt = roleInfo.system_prompt;
      console.log('使用角色的system_prompt字段作为系统提示词');
    } else {
      // 默认系统提示词
      systemPrompt = `你是一个友好、有帮助的AI助手。请以自然、友好的方式回复用户的消息。

对话风格指导：
- 使用非常简短的对话方式，尽量模仿真实手机聊天
- 每条消息不超过1-2句话，尽量保持简洁
- 将长回复拆分成多条非常短小的消息，就像真实人类在聊天软件中发消息一样
- 避免使用长句和复杂句式，使用简单直接的表达
- 当需要表达复杂想法时，将内容分成多个非常简短的消息，每条消息只表达一个简单观点

格式要求：
- 绝对不要使用Markdown语法，如双星号加粗、单星号斜体、反引号代码等
- 不要使用标题格式如#或##
- 列表项直接使用数字或文字开头，不要使用特殊符号如-或*
- 当需要列举多个要点时，直接使用“1.”“2.”等编号，不要使用特殊格式
- 尽量使用简单的纯文本格式，就像在手机聊天软件中发送消息一样`;
    }

    // 我们已经禁用了聊天回复中的情绪分析功能
    // 情绪分析将完全由专门的云函数 @cloudfunctions\analysis/ 处理
    // 因此这里不再添加情绪分析相关指令
    if (includeEmotionAnalysis) {
      // 不再添加情绪分析相关指令，但保留条件分支以保持代码结构完整
      console.log('情绪分析功能已禁用，使用专门的云函数处理');
    }
    // 结束情绪分析相关代码

    // 构建消息数组
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // 添加历史消息（最多10条，避免超出token限制）
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-10);
      recentHistory.forEach(msg => {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        }
      });
    }

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: userMessage
    });

    console.log('发送到智谱AI的消息:', JSON.stringify(messages, null, 2));

    // 调用智谱AI API
    const response = await axios.post(`${API_BASE_URL}/chat/completions`, {
      model: GLM_4_FLASH,
      messages: messages,
      temperature: 0.7, // 适当的温度，使回复更自然
      stream: false // 不使用流式输出
    }, {
      headers: getAuthHeaders()
    });

    // 解析API响应
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;

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
        usage: response.data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    } else {
      return {
        success: false,
        error: '智谱AI返回的回复为空'
      };
    }
  } catch (error) {
    console.error('智谱AI聊天回复生成失败:', error);
    return {
      success: false,
      error: error.message || '聊天回复生成失败'
    };
  }
}

// 导出模块
module.exports = {
  generateChatReply
};
