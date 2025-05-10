/**
 * Google Gemini API 模块
 * 提供基于Google Gemini的情感分析和关键词提取功能
 *
 * @architecture 该模块实现了与Google Gemini API的集成，作为智谱AI的替代选项
 * @dependency httpRequest 云函数用于发送HTTP请求
 * @history 2025-05-01 初始版本
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

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
        temperature: params.temperature || 0.3,
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
 * 使用Gemini模型分析文本情感
 * @param {string} text 待分析的文本
 * @param {Array} history 历史消息记录（可选）
 * @returns {Promise<Object>} 情感分析结果
 */
async function analyzeEmotion(text, history = []) {
  try {
    // 验证参数
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return {
        success: false,
        error: '无效的文本参数'
      };
    }

    // 构建提示词，参考bigmodel.js中的提示词设计
    let prompt = `你是一个专业且富有同理心的情感分析助手。请细致分析以下文本，并可选择性地参考之前的对话上下文（如果提供），以JSON格式返回全面的情感分析结果。

文本内容: "${text}"

返回的JSON对象应包含以下字段：
- primary_emotion: (String) 检测到的主要情感类型，必须使用中文表达 (例如: "焦虑", "喜悦", "愤怒", "平静", "悲伤", "惊讶", "厌恶", "期待", "紧迫", "失望", "疲惫" 等)。
- secondary_emotions: (Array<String>) 检测到的次要情感，必须使用中文表达（最多2个，按强度排序，如果没有则为空数组 []）。
- intensity: (Float) 主要情感的强度，范围 0.0 (几乎没有) 到 1.0 (非常强烈)。
- valence: (Float) 情感的愉悦度/极性，范围 -1.0 (非常负面) 到 1.0 (非常正面)，0.0 代表中性。
- arousal: (Float) 情感的激动/唤醒水平，范围 0.0 (非常平静/低能量) 到 1.0 (非常激动/高能量)。
- trend: (String) 与上一轮分析相比的情绪变化趋势，必须使用中文表达 ("上升", "下降", "稳定")。如果无法判断或无上一轮数据，则为 "未知"。请同时提供英文字段名 trend_en ("rising", "falling", "stable", "unknown")。
- attention_level: (String) 估计的用户在对话中的注意力或投入程度，必须使用中文表达 ("高", "中", "低")。请同时提供英文字段名 attention_level_en ("high", "medium", "low")。
- radar_dimensions: (Object) 针对以下维度的评分估计 (范围 0.0 到 1.0): {"trust": Float (信任度), "openness": Float (开放度), "resistance": Float (抗拒/防御), "stress": Float (压力水平), "control": Float (控制感/确定性)}。请根据对话内容合理估计。
- topic_keywords: (Array<String>) 与当前讨论**主题**相关的关键词，必须使用中文表达，最多5个，按重要性排序。
- emotion_triggers: (Array<String>) 最可能引发当前主要情感的用户文本中的关键词或短语，必须使用中文表达，最多3个。
- suggestions: (Array<String>) 基于当前情感、主题和维度分析，提供1-3条具体、可行的建议策略或共情回应，必须使用中文表达。
- summary: (String) 用一句中文简洁地总结用户当前的情感状态、可能的原因以及关键特征。

请确保输出是严格的JSON格式。如果某些字段无法可靠判断，可以使用合理的默认值（如 intensity: 0.5, valence: 0.0, arousal: 0.5, trend: "未知", attention_level: "中", radar_dimensions 各项为 0.5）或返回空数组/null（对于 secondary_emotions, emotion_triggers）。

重要提示：所有文本字段必须使用中文返回，不要使用英文。这对于前端显示和情感颜色分类至关重要。`;

    // 如果有历史消息，添加到prompt中
    if (Array.isArray(history) && history.length > 0) {
      // 最多添加5条历史消息作为上下文
      const contextMessages = history.slice(-5);
      let contextText = "\n\n对话历史上下文:\n";

      contextMessages.forEach(msg => {
        if (msg.role && msg.content) {
          contextText += `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}\n`;
        }
      });

      prompt += contextText;
    }

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
      temperature: 0.3, // 较低的温度以获得更确定性的结果
      maxOutputTokens: 2048
    });

    // 解析API响应
    if (response && response.candidates && response.candidates.length > 0) {
      try {
        // 尝试解析JSON响应
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const content = candidate.content.parts[0].text;
          // 提取JSON部分
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : content;
          const result = JSON.parse(jsonStr);

          // 构建标准化的返回结果，与bigmodel.js保持一致
          return {
            success: true,
            result: {
              // 兼容旧版字段
              type: result.primary_emotion || result.emotion_type || '平静',
              intensity: result.intensity || 0.5,
              keywords: result.topic_keywords || result.keywords || [],
              suggestions: result.suggestions || [],
              report: result.summary || result.report || '无法生成情感报告',
              originalText: text,
              // 新增字段
              primary_emotion: result.primary_emotion || result.emotion_type || '平静',
              secondary_emotions: result.secondary_emotions || [],
              valence: result.valence || 0.0,
              arousal: result.arousal || 0.5,
              trend: result.trend || '未知',
              trend_en: result.trend_en || 'unknown',
              attention_level: result.attention_level || '中',
              attention_level_en: result.attention_level_en || 'medium',
              radar_dimensions: result.radar_dimensions || {
                trust: 0.5,
                openness: 0.5,
                resistance: 0.5,
                stress: 0.5,
                control: 0.5
              },
              topic_keywords: result.topic_keywords || [],
              emotion_triggers: result.emotion_triggers || [],
              summary: result.summary || result.report || '无法生成情感报告'
            },
            usage: response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 }
          };
        }
      } catch (parseError) {
        console.error('解析Gemini JSON响应失败:', parseError.message || parseError);
        return {
          success: false,
          error: '解析情感分析结果失败'
        };
      }
    }

    return {
      success: false,
      error: 'Gemini返回的情感分析结果为空'
    };
  } catch (error) {
    console.error('Gemini情感分析失败:', error);
    return {
      success: false,
      error: error.message || '情感分析失败'
    };
  }
}

/**
 * 使用Gemini模型提取关键词
 * @param {string} text 待分析文本
 * @param {number} topK 返回关键词数量
 * @returns {Promise<Object>} 关键词提取结果
 */
async function extractKeywords(text, topK = 10) {
  try {
    // 验证参数
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return {
        success: false,
        error: '无效的文本参数'
      };
    }

    // 构建Prompt，要求模型提取关键词并以JSON格式返回
    const prompt = `你是一个专业的文本分析助手。请从以下文本中提取最重要的关键词，并以JSON格式返回结果。文本内容：

${text}

返回的JSON应包含以下字段：
- keywords: 关键词数组，每个元素是一个对象，包含word(关键词)和weight(权重,0-1之间的浮点数)

请确保返回的是有效的JSON格式，不要添加额外的解释或前缀。提取的关键词数量不超过${topK}个，按重要性降序排列。`;

    // 构建请求内容
    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    // 调用Gemini API
    const response = await callGeminiAPI({
      model: GEMINI_FLASH, // 使用gemini-2.5-flash-preview-04-17模型
      contents: contents,
      temperature: 0.2, // 较低的温度以获得更确定性的结果
      maxOutputTokens: 1024
    });

    // 解析API响应
    if (response && response.candidates && response.candidates.length > 0) {
      try {
        // 尝试解析JSON响应
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const content = candidate.content.parts[0].text;
          // 提取JSON部分
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : content;
          const result = JSON.parse(jsonStr);

          // 确保keywords是一个数组
          const keywords = Array.isArray(result.keywords) ? result.keywords : [];

          // 构建标准化的返回结果
          return {
            success: true,
            data: {
              keywords: keywords.slice(0, topK) // 确保不超过topK个关键词
            }
          };
        }
      } catch (parseError) {
        console.error('解析Gemini JSON响应失败:', parseError.message || parseError);
        return {
          success: false,
          error: '解析关键词提取结果失败'
        };
      }
    }

    return {
      success: false,
      error: 'Gemini返回的关键词提取结果为空'
    };
  } catch (error) {
    console.error('Gemini关键词提取失败:', error.message || error);
    return {
      success: false,
      error: error.message || '关键词提取服务调用失败'
    };
  }
}

/**
 * 使用Gemini模型进行聚类分析
 * @param {string} text 待分析文本
 * @param {number} threshold 聚类阈值
 * @param {number} minClusterSize 最小簇大小
 * @returns {Promise<Object>} 聚类结果
 */
async function clusterKeywords(text, threshold = 0.7, minClusterSize = 2) {
  try {
    // 验证参数
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return {
        success: false,
        error: '无效的文本参数'
      };
    }

    // 构建Prompt，要求模型进行聚类分析并以JSON格式返回
    const prompt = `你是一个专业的文本分析助手。请从以下文本中提取关键词，并将语义相近的关键词聚类，以JSON格式返回结果。文本内容：

${text}

返回的JSON应包含以下字段：
- clusters: 聚类结果数组，每个元素是一个对象，包含以下字段：
  - keywords: 该簇包含的关键词数组
  - center: 该簇的中心词或主题
  - size: 该簇的大小(关键词数量)

请确保返回的是有效的JSON格式，不要添加额外的解释或前缀。每个簇至少包含${minClusterSize}个关键词，相似度阈值为${threshold}。`;

    // 构建请求内容
    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    // 调用Gemini API
    const response = await callGeminiAPI({
      model: GEMINI_PRO,
      contents: contents,
      temperature: 0.3,
      maxOutputTokens: 2048
    });

    // 解析API响应
    if (response && response.candidates && response.candidates.length > 0) {
      try {
        // 尝试解析JSON响应
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const content = candidate.content.parts[0].text;
          // 提取JSON部分
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : content;
          const result = JSON.parse(jsonStr);

          // 确保clusters是一个数组
          const clusters = Array.isArray(result.clusters) ? result.clusters : [];

          // 过滤掉不符合最小簇大小要求的簇
          const validClusters = clusters.filter(cluster =>
            Array.isArray(cluster.keywords) && cluster.keywords.length >= minClusterSize
          );

          // 构建标准化的返回结果
          return {
            success: true,
            data: {
              clusters: validClusters
            }
          };
        }
      } catch (parseError) {
        console.error('解析Gemini JSON响应失败:', parseError.message || parseError);
        return {
          success: false,
          error: '解析聚类分析结果失败'
        };
      }
    }

    return {
      success: false,
      error: 'Gemini返回的聚类分析结果为空'
    };
  } catch (error) {
    console.error('Gemini聚类分析失败:', error.message || error);
    return {
      success: false,
      error: error.message || '聚类分析服务调用失败'
    };
  }
}

/**
 * 使用Gemini模型生成用户兴趣分析报告
 * @param {Array<string>} messages 用户历史消息
 * @returns {Promise<Object>} 兴趣分析结果
 */
async function analyzeUserInterests(messages) {
  try {
    // 验证参数
    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        success: false,
        error: '无效的消息参数'
      };
    }

    // 合并消息文本
    const combinedText = messages.join('\n');

    // 构建Prompt，要求模型分析用户兴趣并以JSON格式返回
    const prompt = `你是一个专业的用户兴趣分析助手。请分析以下用户的历史消息，提取用户可能的兴趣领域，并以JSON格式返回分析结果。

以下是用户的历史消息，请分析其中可能的兴趣领域：
${combinedText}

返回的JSON应包含以下字段：
- interests: 兴趣领域数组，每个元素是一个对象，包含以下字段：
  - name: 兴趣领域名称
  - confidence: 置信度，0-1之间的浮点数
  - keywords: 与该兴趣相关的关键词数组
- summary: 用户兴趣的简短总结

请确保返回的是有效的JSON格式，不要添加额外的解释或前缀。`;

    // 构建请求内容
    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    // 调用Gemini API
    const response = await callGeminiAPI({
      model: GEMINI_PRO,
      contents: contents,
      temperature: 0.3,
      maxOutputTokens: 2048
    });

    // 解析API响应
    if (response && response.candidates && response.candidates.length > 0) {
      try {
        // 尝试解析JSON响应
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const content = candidate.content.parts[0].text;
          // 提取JSON部分
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : content;
          const result = JSON.parse(jsonStr);

          // 构建标准化的返回结果
          return {
            success: true,
            data: {
              interests: result.interests || [],
              summary: result.summary || '无法生成兴趣总结'
            }
          };
        }
      } catch (parseError) {
        console.error('解析Gemini JSON响应失败:', parseError.message || parseError);
        return {
          success: false,
          error: '解析兴趣分析结果失败'
        };
      }
    }

    return {
      success: false,
      error: 'Gemini返回的兴趣分析结果为空'
    };
  } catch (error) {
    console.error('Gemini兴趣分析失败:', error.message || error);
    return {
      success: false,
      error: error.message || '兴趣分析服务调用失败'
    };
  }
}

/**
 * 使用Gemini模型生成报告内容
 * @param {string} prompt 提示词
 * @returns {Promise<Object>} 生成结果
 */
async function generateReportContent(prompt) {
  try {
    // 验证参数
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return {
        success: false,
        error: '无效的提示词参数'
      };
    }

    // 构建系统提示词
    const systemPrompt = `你是一个专业的情感分析助手，擅长分析用户的情绪状态并提供有价值的洞察和建议。
    请根据用户提供的文本生成每日心情报告，包括情感总结、洞察、建议、今日运势和鼓励语。
    请确保返回的是有效的JSON格式，不要添加额外的解释或前缀。`;

    // 构建请求内容
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt + "\n\n" + prompt }]
      }
    ];

    // 调用Gemini API
    const response = await callGeminiAPI({
      model: GEMINI_PRO,
      contents: contents,
      temperature: 0.7, // 适当提高创造性
      maxOutputTokens: 2048
    });

    // 解析API响应
    if (response && response.candidates && response.candidates.length > 0) {
      try {
        // 尝试解析JSON响应
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const content = candidate.content.parts[0].text;
          // 提取JSON部分
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : content;
          const result = JSON.parse(jsonStr);

          // 返回结果
          return {
            success: true,
            result: result
          };
        }
      } catch (parseError) {
        console.error('解析Gemini JSON响应失败:', parseError.message || parseError);
        return {
          success: false,
          error: '解析报告内容失败'
        };
      }
    }

    return {
      success: false,
      error: 'Gemini返回的报告内容为空'
    };
  } catch (error) {
    console.error('生成报告内容失败:', error.message || error);
    return {
      success: false,
      error: error.message || '生成报告内容失败'
    };
  }
}

/**
 * 使用Gemini模型进行通用对话调用
 * @param {Object} options 调用选项
 * @param {Array} options.messages 消息数组
 * @param {number} options.temperature 温度参数
 * @param {Object} options.response_format 响应格式
 * @returns {Promise<Object>} 调用结果
 */
async function chatCompletion(options) {
  try {
    // 验证参数
    if (!options || !Array.isArray(options.messages) || options.messages.length === 0) {
      throw new Error('无效的消息参数');
    }

    // 转换消息格式为Gemini格式
    const contents = options.messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role, // Gemini不支持system角色，转为user
      parts: [{ text: msg.content }]
    }));

    // 调用Gemini API
    console.log('调用Gemini对话接口, 消息数量:', options.messages.length);

    const response = await callGeminiAPI({
      model: GEMINI_PRO,
      contents: contents,
      temperature: options.temperature || 0.7,
      maxOutputTokens: options.maxOutputTokens || 2048
    });

    // 返回原始响应
    return response;
  } catch (error) {
    console.error('Gemini对话接口调用失败:', error.message || error);
    throw error;
  }
}

// 导出模块
module.exports = {
  analyzeEmotion,
  extractKeywords,
  clusterKeywords,
  analyzeUserInterests,
  generateReportContent,
  chatCompletion,
  callGeminiAPI,
  GEMINI_PRO,
  GEMINI_FLASH
};
