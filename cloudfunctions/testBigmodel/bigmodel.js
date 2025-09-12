/**
 * 智谱AI (BigModel) 模块
 * 提供基于智谱AI的情感分析和关键词提取功能
 */
const axios = require('axios');

// 智谱AI API配置
// 注意：实际使用时应从环境变量或安全配置中读取API密钥，而不是硬编码
// 这里仅作为示例，实际部署时请修改为从环境变量获取
const API_KEY = process.env.ZHIPU_API_KEY || ''; // 从环境变量获取API密钥
const API_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';

// 模型配置
const GLM_4_FLASH = 'glm-4.5-flash'; // 快速版本，适合对话和基础分析
const EMBEDDING_3 = 'embedding-3'; // 文本向量化模型

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
 * 使用GLM-4-Flash模型进行情感分析
 * @param {string} text 待分析文本
 * @returns {Promise<Object>} 情感分析结果
 */
async function analyzeEmotion(text) {
  try {
    // 验证参数
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return {
        success: false,
        error: '无效的文本参数'
      };
    }

    // 构建Prompt，要求模型进行更全面的情感分析并以JSON格式返回
    const messages = [
      {
        role: 'system',
        content: `你是一个专业且富有同理心的情感分析助手。请细致分析用户最新输入的文本，并可选择性地参考之前的对话上下文（如果提供），以JSON格式返回全面的情感分析结果。
        返回的JSON对象应包含以下字段：
        - primary_emotion: (String) 检测到的主要情感类型 (例如: "anxiety", "joy", "anger", "calm", "sadness", "surprise", "disgust", "anticipation", "urgency", "disappointment", "fatigue" 等)。
        - secondary_emotions: (Array<String>) 检测到的次要情感（最多2个，按强度排序，如果没有则为空数组 []）。
        - intensity: (Float) 主要情感的强度，范围 0.0 (几乎没有) 到 1.0 (非常强烈)。
        - valence: (Float) 情感的愉悦度/极性，范围 -1.0 (非常负面) 到 1.0 (非常正面)，0.0 代表中性。
        - arousal: (Float) 情感的激动/唤醒水平，范围 0.0 (非常平静/低能量) 到 1.0 (非常激动/高能量)。
        - trend: (String) 与上一轮分析相比的情绪变化趋势 ("rising", "falling", "stable")。如果无法判断或无上一轮数据，则为 "unknown"。
        - attention_level: (String) 估计的用户在对话中的注意力或投入程度 ("high", "medium", "low")。
        - radar_dimensions: (Object) 针对以下维度的评分估计 (范围 0.0 到 1.0): {"trust": Float (信任度), "openness": Float (开放度), "resistance": Float (抗拒/防御), "stress": Float (压力水平), "control": Float (控制感/确定性)}。请根据对话内容合理估计。
        - topic_keywords: (Array<String>) 与当前讨论**主题**相关的关键词，最多5个，按重要性排序。
        - emotion_triggers: (Array<String>) 最可能引发当前主要情感的用户文本中的关键词或短语，最多3个。
        - suggestions: (Array<String>) 基于当前情感、主题和维度分析，提供1-3条具体、可行的建议策略或共情回应。
        - summary: (String) 用一句话简洁地总结用户当前的情感状态、可能的原因以及关键特征。

        请确保输出是严格的JSON格式。如果某些字段无法可靠判断，可以使用合理的默认值（如 intensity: 0.5, valence: 0.0, arousal: 0.5, trend: "unknown", attention_level: "medium", radar_dimensions 各项为 0.5）或返回空数组/null（对于 secondary_emotions, emotion_triggers）。
        用户文本：` // 注意：实际调用时会在此处拼接用户输入的文本
      }
      // 这里可以根据需要加入历史消息作为 'user' 或 'assistant' role
      // 例如：
      // { role: 'user', content: '之前的用户消息...' },
      // { role: 'assistant', content: '之前的AI回复...' },
      // { role: 'user', content: event.userMessage } // 当前用户消息通常放在最后
    ];

    // 调用智谱AI API
    const response = await axios.post(`${API_BASE_URL}/chat/completions`, {
      model: GLM_4_FLASH,
      messages: messages,
      temperature: 0.3, // 较低的温度以获得更确定性的结果
      response_format: { type: 'json_object' } // 请求JSON格式的响应
    }, {
      headers: getAuthHeaders()
    });

    // 解析API响应
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      try {
        // 尝试解析JSON响应
        const content = response.data.choices[0].message.content;
        const result = JSON.parse(content);

        // 构建标准化的返回结果
        return {
          success: true,
          result: {
            primary_emotion: result.primary_emotion || 'calm',
            secondary_emotions: result.secondary_emotions || [],
            intensity: result.intensity || 0.5,
            valence: result.valence || 0.0,
            arousal: result.arousal || 0.5,
            trend: result.trend || 'unknown',
            attention_level: result.attention_level || 'medium',
            radar_dimensions: result.radar_dimensions || { trust: 0.5, openness: 0.5, resistance: 0.5, stress: 0.5, control: 0.5 },
            topic_keywords: result.topic_keywords || [],
            emotion_triggers: result.emotion_triggers || [],
            suggestions: result.suggestions || [],
            summary: result.summary || 'Unable to generate emotion report',
            originalText: text
          }
        };
      } catch (parseError) {
        console.error('解析智谱AI JSON响应失败:', parseError);
        return {
          success: false,
          error: '解析情感分析结果失败'
        };
      }
    } else {
      return {
        success: false,
        error: '智谱AI返回的情感分析结果为空'
      };
    }
  } catch (error) {
    console.error('智谱AI情感分析失败:', error);
    return {
      success: false,
      error: error.message || '情感分析服务调用失败'
    };
  }
}

/**
 * 使用GLM-4-Flash模型提取关键词
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
    const messages = [
      {
        role: 'system',
        content: `你是一个专业的文本分析助手。请从用户提供的文本中提取最重要的关键词，并以JSON格式返回结果。
        返回的JSON应包含以下字段：
        - keywords: 关键词数组，每个元素是一个对象，包含word(关键词)和weight(权重,0-1之间的浮点数)
        
        请确保返回的是有效的JSON格式，不要添加额外的解释或前缀。提取的关键词数量不超过${topK}个，按重要性降序排列。`
      },
      {
        role: 'user',
        content: text
      }
    ];

    // 调用智谱AI API
    const response = await axios.post(`${API_BASE_URL}/chat/completions`, {
      model: GLM_4_FLASH,
      messages: messages,
      temperature: 0.2, // 较低的温度以获得更确定性的结果
      response_format: { type: 'json_object' } // 请求JSON格式的响应
    }, {
      headers: getAuthHeaders()
    });

    // 解析API响应
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      try {
        // 尝试解析JSON响应
        const content = response.data.choices[0].message.content;
        const result = JSON.parse(content);

        // 确保keywords是一个数组
        const keywords = Array.isArray(result.keywords) ? result.keywords : [];

        // 构建标准化的返回结果
        return {
          success: true,
          data: {
            keywords: keywords.slice(0, topK) // 确保不超过topK个关键词
          }
        };
      } catch (parseError) {
        console.error('解析智谱AI JSON响应失败:', parseError);
        return {
          success: false,
          error: '解析关键词提取结果失败'
        };
      }
    } else {
      return {
        success: false,
        error: '智谱AI返回的关键词提取结果为空'
      };
    }
  } catch (error) {
    console.error('智谱AI关键词提取失败:', error);
    return {
      success: false,
      error: error.message || '关键词提取服务调用失败'
    };
  }
}

/**
 * 使用Embedding-3模型获取文本向量
 * @param {string|Array<string>} texts 文本或文本数组
 * @returns {Promise<Object>} 向量结果
 */
async function getEmbeddings(texts) {
  try {
    // 验证参数
    if (!texts) {
      return {
        success: false,
        error: '无效的文本参数'
      };
    }

    // 确保texts是数组
    const textArray = Array.isArray(texts) ? texts : [texts];

    // 验证数组不为空
    if (textArray.length === 0) {
      return {
        success: false,
        error: '文本数组为空'
      };
    }

    // 调用智谱AI Embedding API
    const response = await axios.post(`${API_BASE_URL}/embeddings`, {
      model: EMBEDDING_3,
      input: textArray
    }, {
      headers: getAuthHeaders()
    });

    // 解析API响应
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      // 提取向量数据
      const embeddings = response.data.data.map(item => item.embedding);

      // 构建标准化的返回结果
      return {
        success: true,
        data: {
          vectors: embeddings
        }
      };
    } else {
      return {
        success: false,
        error: '智谱AI返回的向量结果为空或格式错误'
      };
    }
  } catch (error) {
    console.error('智谱AI向量获取失败:', error);
    return {
      success: false,
      error: error.message || '向量获取服务调用失败'
    };
  }
}

/**
 * 使用GLM-4-Flash模型进行聚类分析
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
    const messages = [
      {
        role: 'system',
        content: `你是一个专业的文本分析助手。请从用户提供的文本中提取关键词，并将语义相近的关键词聚类，以JSON格式返回结果。
        返回的JSON应包含以下字段：
        - clusters: 聚类结果数组，每个元素是一个对象，包含以下字段：
          - keywords: 该簇包含的关键词数组
          - center: 该簇的中心词或主题
          - size: 该簇的大小(关键词数量)
        
        请确保返回的是有效的JSON格式，不要添加额外的解释或前缀。每个簇至少包含${minClusterSize}个关键词，相似度阈值为${threshold}。`
      },
      {
        role: 'user',
        content: text
      }
    ];

    // 调用智谱AI API
    const response = await axios.post(`${API_BASE_URL}/chat/completions`, {
      model: GLM_4_FLASH,
      messages: messages,
      temperature: 0.3,
      response_format: { type: 'json_object' } // 请求JSON格式的响应
    }, {
      headers: getAuthHeaders()
    });

    // 解析API响应
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      try {
        // 尝试解析JSON响应
        const content = response.data.choices[0].message.content;
        const result = JSON.parse(content);

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
      } catch (parseError) {
        console.error('解析智谱AI JSON响应失败:', parseError);
        return {
          success: false,
          error: '解析聚类分析结果失败'
        };
      }
    } else {
      return {
        success: false,
        error: '智谱AI返回的聚类分析结果为空'
      };
    }
  } catch (error) {
    console.error('智谱AI聚类分析失败:', error);
    return {
      success: false,
      error: error.message || '聚类分析服务调用失败'
    };
  }
}

/**
 * 使用GLM-4-Flash模型生成用户兴趣分析报告
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
    const promptMessages = [
      {
        role: 'system',
        content: `你是一个专业的用户兴趣分析助手。请分析用户的历史消息，提取用户可能的兴趣领域，并以JSON格式返回分析结果。
        返回的JSON应包含以下字段：
        - interests: 兴趣领域数组，每个元素是一个对象，包含以下字段：
          - name: 兴趣领域名称
          - confidence: 置信度，0-1之间的浮点数
          - keywords: 与该兴趣相关的关键词数组
        - summary: 用户兴趣的简短总结
        
        请确保返回的是有效的JSON格式，不要添加额外的解释或前缀。`
      },
      {
        role: 'user',
        content: `以下是用户的历史消息，请分析其中可能的兴趣领域：\n${combinedText}`
      }
    ];

    // 调用智谱AI API
    const response = await axios.post(`${API_BASE_URL}/chat/completions`, {
      model: GLM_4_FLASH,
      messages: promptMessages,
      temperature: 0.3,
      response_format: { type: 'json_object' } // 请求JSON格式的响应
    }, {
      headers: getAuthHeaders()
    });

    // 解析API响应
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      try {
        // 尝试解析JSON响应
        const content = response.data.choices[0].message.content;
        const result = JSON.parse(content);

        // 构建标准化的返回结果
        return {
          success: true,
          data: {
            interests: result.interests || [],
            summary: result.summary || '无法生成兴趣总结'
          }
        };
      } catch (parseError) {
        console.error('解析智谱AI JSON响应失败:', parseError);
        return {
          success: false,
          error: '解析兴趣分析结果失败'
        };
      }
    } else {
      return {
        success: false,
        error: '智谱AI返回的兴趣分析结果为空'
      };
    }
  } catch (error) {
    console.error('智谱AI兴趣分析失败:', error);
    return {
      success: false,
      error: error.message || '兴趣分析服务调用失败'
    };
  }
}

// 导出模块
module.exports = {
  analyzeEmotion,
  extractKeywords,
  getEmbeddings,
  clusterKeywords,
  analyzeUserInterests
};
