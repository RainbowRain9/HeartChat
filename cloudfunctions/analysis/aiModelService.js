/**
 * AI模型服务
 * 提供统一的AI模型调用接口，支持多种AI模型平台
 *
 * @architecture 该模块实现了统一的AI模型调用接口，支持智谱AI、Google Gemini等多种模型平台
 * @dependency axios HTTP请求库
 * @history 2025-05-15 初始版本
 */

// 是否为开发环境，控制日志输出
const isDev = true; // 设置为true可以开启详细日志

// 导入axios
const axios = require('axios');

// 先定义辅助函数，稍后导入子模块

// 模型平台配置
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
    name: 'Gemini',
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
    name: 'Whimsy AI',
    baseUrl: 'https://doi9.top/v1',
    apiKeyEnv: 'WHIMSY_API_KEY',
    defaultModel: 'gemini-2.5-pro-preview-05-06',
    models: ['gemini-2.5-pro-preview-05-06', 'gemini-2.5-flash-preview-04-17-non-thinking', 'gemini-2.5-flash-preview-04-17'],
    authType: 'Bearer',
    endpoints: {
      chat: '/chat/completions'
    }
  },
  // OpenAI (添加OpenAI平台配置)
  OPENAI: {
    name: 'ChatGPT',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    defaultModel: 'gpt-3.5-turbo',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    authType: 'Bearer',
    endpoints: {
      chat: '/chat/completions',
      embedding: '/embeddings'
    }
  },
  // Crond API
  CROND: {
    name: 'ChatGPT (Crond)',
    baseUrl: 'https://new.crond.dev/v1',
    apiKeyEnv: 'CROND_API_KEY',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'deepseek-v3', 'o3-mini'],
    authType: 'Bearer',
    endpoints: {
      chat: '/chat/completions'
    }
  },
  // DeepSeek AI
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
  },
  // Grok
  GROK: {
    name: 'Grok',
    baseUrl: 'https://neolovec.com/v1',
    apiKeyEnv: 'GROK_API_KEY',
    defaultModel: 'grok-3',
    models: ['grok-3', 'grok-3-beta', 'grok-vision-beta'],
    authType: 'Bearer',
    endpoints: {
      chat: '/chat/completions'
    }
  },
  // Claude
  CLAUDE: {
    name: 'Claude',
    baseUrl: 'https://demo.voapi.top/v1',
    apiKeyEnv: 'CLAUDE_API_KEY',
    defaultModel: 'claude-3-5-sonnet-20240620',
    models: ['claude-3-5-sonnet-20240620', 'gpt-4o-mini-2024-07-18', 'qwen-turbo'],
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

    // 构建请求URL和请求体
    let url, requestBody, headers;

    if (platformKey === 'GEMINI') {
      // Gemini特殊处理
      url = `${platform.baseUrl}/v1beta/models/${params.model || platform.defaultModel}:generateContent?key=${apiKey}`;

      requestBody = {
        contents: params.contents,
        generationConfig: {
          temperature: params.temperature || 0.3,
          topP: params.topP || 0.8,
          topK: params.topK || 40,
          maxOutputTokens: params.maxOutputTokens || 2048
        }
      };

      headers = {
        'Content-Type': 'application/json'
      };
    } else if (platformKey === 'OPENAI' || platformKey === 'CROND' || platformKey === 'CLOSEAI') {
      // OpenAI, Crond API, CloseAI 标准处理
      url = `${platform.baseUrl}${params.endpoint || platform.endpoints.chat}`;

      requestBody = {
        model: params.model || platform.defaultModel,
        messages: params.body?.messages || [],
        temperature: params.temperature || 0.3,
        max_tokens: params.max_tokens || 2048,
        top_p: params.top_p || 0.8,
        frequency_penalty: params.frequency_penalty || 0,
        presence_penalty: params.presence_penalty || 0
      };

      if (params.body?.response_format) {
        requestBody.response_format = params.body.response_format;
      }

      headers = {
        'Content-Type': 'application/json',
        'Authorization': `${platform.authType} ${apiKey}`
      };
    } else {
      // 智谱AI等其他处理
      url = `${platform.baseUrl}${params.endpoint || platform.endpoints.chat}`;

      requestBody = {
        model: params.model || platform.defaultModel,
        ...params.body
      };

      headers = {
        'Content-Type': 'application/json',
        'Authorization': `${platform.authType} ${apiKey}`
      };
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
        headers: headers,
        data: requestBody
      });

      // 检查响应状态
      if (response.status !== 200) {
        console.error(`${platform.name} API返回错误状态码:`, response.status);
        throw new Error(`${platform.name} API调用失败: 状态码 ${response.status}`);
      }

      // 获取响应数据
      return response.data;
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
 * 分析文本情感
 * @param {string} text 待分析文本
 * @param {Array} history 历史消息记录
 * @param {Object} options 选项，包括平台和模型
 * @returns {Promise<Object>} 情感分析结果
 */
async function analyzeEmotion(text, history = [], options = {}) {
  try {
    // 验证参数
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return {
        success: false,
        error: '无效的文本参数'
      };
    }

    // 获取平台和模型
    const platformKey = options.platform || 'GEMINI';
    const platform = getPlatformConfig(platformKey);
    const modelName = options.model || platform.defaultModel;

    if (platformKey === 'GEMINI') {
      // Gemini特殊处理
      // 构建提示词
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
      const response = await callModelApi({
        model: modelName,
        contents: contents,
        temperature: 0.3,
        maxOutputTokens: 2048
      }, platformKey);

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
          console.error('解析JSON响应失败:', parseError.message || parseError);
          return {
            success: false,
            error: '解析情感分析结果失败'
          };
        }
      }

      return {
        success: false,
        error: '返回的情感分析结果为空'
      };
    } else if (platformKey === 'OPENAI' || platformKey === 'CROND' || platformKey === 'CLOSEAI') {
      // OpenAI, Crond API, CloseAI 处理
      // 构建消息数组
      const messages = [
        {
          role: 'system',
          content: `你是一个专业且富有同理心的情感分析助手。请细致分析用户最新输入的文本，并可选择性地参考之前的对话上下文（如果提供），以JSON格式返回全面的情感分析结果。
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

          重要提示：所有文本字段必须使用中文返回，不要使用英文。这对于前端显示和情感颜色分类至关重要。`
        }
      ];

      // 如果有历史消息，添加到messages中
      if (Array.isArray(history) && history.length > 0) {
        // 最多添加5条历史消息作为上下文
        const contextMessages = history.slice(-5);
        contextMessages.forEach(msg => {
          if (msg.role && msg.content) {
            messages.push({
              role: msg.role,
              content: msg.content
            });
          }
        });
      }

      // 添加当前用户消息
      messages.push({
        role: 'user',
        content: text
      });

      // 调用API
      const response = await callModelApi({
        model: modelName,
        body: {
          messages: messages,
          temperature: 0.3,
          response_format: { type: 'json_object' }
        }
      }, platformKey);

      // 解析API响应
      if (response && response.choices && response.choices.length > 0) {
        try {
          // 尝试解析JSON响应
          const content = response.choices[0].message.content;
          const result = JSON.parse(content);

          // 构建标准化的返回结果
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
            usage: response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
          };
        } catch (parseError) {
          console.error('解析JSON响应失败:', parseError.message || parseError);
          return {
            success: false,
            error: '解析情感分析结果失败'
          };
        }
      }

      return {
        success: false,
        error: '返回的情感分析结果为空'
      };
    } else {
      // 智谱AI处理
      // 构建消息数组
      const messages = [
        {
          role: 'system',
          content: `你是一个专业且富有同理心的情感分析助手。请细致分析用户最新输入的文本，并可选择性地参考之前的对话上下文（如果提供），以JSON格式返回全面的情感分析结果。
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

          重要提示：所有文本字段必须使用中文返回，不要使用英文。这对于前端显示和情感颜色分类至关重要。`
        }
      ];

      // 如果有历史消息，添加到messages中
      if (Array.isArray(history) && history.length > 0) {
        // 最多添加5条历史消息作为上下文
        const contextMessages = history.slice(-5);
        contextMessages.forEach(msg => {
          if (msg.role && msg.content) {
            messages.push({
              role: msg.role,
              content: msg.content
            });
          }
        });
      }

      // 添加当前用户消息
      messages.push({
        role: 'user',
        content: text
      });

      // 调用智谱AI API
      const response = await callModelApi({
        model: modelName,
        body: {
          messages: messages,
          temperature: 0.3,
          response_format: { type: 'json_object' }
        }
      }, platformKey);

      // 解析API响应
      if (response && response.choices && response.choices.length > 0) {
        try {
          // 尝试解析JSON响应
          const content = response.choices[0].message.content;
          const result = JSON.parse(content);

          // 构建标准化的返回结果
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
            }
          };
        } catch (parseError) {
          console.error('解析JSON响应失败:', parseError.message || parseError);
          return {
            success: false,
            error: '解析情感分析结果失败'
          };
        }
      }

      return {
        success: false,
        error: '返回的情感分析结果为空'
      };
    }
  } catch (error) {
    console.error('情感分析失败:', error.message || error);
    return {
      success: false,
      error: error.message || '情感分析失败'
    };
  }
}

// 导入子模块并传递辅助函数
const aiModelService_part2 = require('./aiModelService_part2');
const aiModelService_part3 = require('./aiModelService_part3');

// 将辅助函数注入到子模块中
aiModelService_part2.init(getPlatformConfig, callModelApi);
aiModelService_part3.init(getPlatformConfig, callModelApi);

// 导出模块
module.exports = {
  MODEL_PLATFORMS,
  analyzeEmotion,
  extractKeywords: aiModelService_part2.extractKeywords,
  getEmbeddings: aiModelService_part2.getEmbeddings,
  clusterKeywords: aiModelService_part3.clusterKeywords,
  analyzeUserInterests: aiModelService_part3.analyzeUserInterests
};
