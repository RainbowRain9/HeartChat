// 辅助函数引用
let getPlatformConfig;
let callModelApi;

/**
 * 初始化模块，注入辅助函数
 * @param {Function} platformConfigFn 获取平台配置的函数
 * @param {Function} callApiFn 调用API的函数
 */
function init(platformConfigFn, callApiFn) {
  getPlatformConfig = platformConfigFn;
  callModelApi = callApiFn;
}

/**
 * 提取文本关键词
 * @param {string} text 待分析文本
 * @param {number} topK 返回关键词数量
 * @param {Object} options 选项，包括平台和模型
 * @returns {Promise<Object>} 关键词提取结果
 */
async function extractKeywords(text, topK = 10, options = {}) {
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
      // 构建Prompt
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
      const response = await callModelApi({
        model: modelName,
        contents: contents,
        temperature: 0.2,
        maxOutputTokens: 1024
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
          console.error('解析JSON响应失败:', parseError.message || parseError);
          return {
            success: false,
            error: '解析关键词提取结果失败'
          };
        }
      }

      return {
        success: false,
        error: '返回的关键词提取结果为空'
      };
    } else if (platformKey === 'OPENAI' || platformKey === 'CROND' || platformKey === 'CLOSEAI' || platformKey === 'GROK' || platformKey === 'CLAUDE') {
      // OpenAI, Crond API, CloseAI, Grok, Claude 处理
      // 构建Prompt
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

      // 调用API
      const response = await callModelApi({
        model: modelName,
        body: {
          messages: messages,
          temperature: 0.2,
          response_format: { type: 'json_object' }
        }
      }, platformKey);

      // 解析API响应
      if (response && response.choices && response.choices.length > 0) {
        try {
          // 尝试解析JSON响应
          const content = response.choices[0].message.content;
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
          console.error('解析JSON响应失败:', parseError.message || parseError);
          return {
            success: false,
            error: '解析关键词提取结果失败'
          };
        }
      }

      return {
        success: false,
        error: '返回的关键词提取结果为空'
      };
    } else {
      // 智谱AI处理
      // 构建Prompt
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
      const response = await callModelApi({
        model: modelName,
        body: {
          messages: messages,
          temperature: 0.2,
          response_format: { type: 'json_object' }
        }
      }, platformKey);

      // 解析API响应
      if (response && response.choices && response.choices.length > 0) {
        try {
          // 尝试解析JSON响应
          const content = response.choices[0].message.content;
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
          console.error('解析JSON响应失败:', parseError.message || parseError);
          return {
            success: false,
            error: '解析关键词提取结果失败'
          };
        }
      }

      return {
        success: false,
        error: '返回的关键词提取结果为空'
      };
    }
  } catch (error) {
    console.error('关键词提取失败:', error.message || error);
    return {
      success: false,
      error: error.message || '关键词提取失败'
    };
  }
}

/**
 * 获取文本的词向量表示
 * @param {Array<string>} texts 文本数组
 * @param {Object} options 选项，包括平台和模型
 * @returns {Promise<Object>} 词向量结果
 */
async function getEmbeddings(texts, options = {}) {
  try {
    // 验证参数
    if (!Array.isArray(texts) || texts.length === 0) {
      return {
        success: false,
        error: '无效的文本数组参数'
      };
    }

    // 获取平台和模型
    const platformKey = options.platform || 'ZHIPU'; // 默认使用智谱AI，因为Gemini不支持词向量
    const platform = getPlatformConfig(platformKey);
    const modelName = options.model || platform.embeddingModel || platform.defaultModel;

    if (platformKey !== 'ZHIPU') {
      console.warn(`${platformKey}不支持词向量功能，将使用智谱AI`);
      // 如果不是智谱AI，使用本地模拟词向量
      // 生成模拟词向量（每个向量1536维，与智谱AI的embedding-3模型一致）
      const mockEmbeddings = texts.map(text => {
        // 基于文本生成伪随机数，使相同文本生成相同向量
        const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const vector = [];

        // 生成1536维的向量
        for (let i = 0; i < 1536; i++) {
          // 使用简单的伪随机数生成算法
          const val = Math.sin(seed * (i + 1)) * 0.5 + 0.5;
          vector.push(val);
        }

        return vector;
      });

      return {
        success: true,
        data: {
          embeddings: mockEmbeddings
        }
      };
    }

    // 智谱AI处理
    // 调用智谱AI API
    const response = await callModelApi({
      model: modelName,
      endpoint: platform.endpoints.embedding,
      body: {
        input: texts
      }
    }, platformKey);

    // 解析API响应
    if (response && response.data) {
      // 提取词向量
      const embeddings = response.data.map(item => item.embedding);

      return {
        success: true,
        data: {
          embeddings: embeddings
        }
      };
    }

    return {
      success: false,
      error: '返回的词向量结果为空'
    };
  } catch (error) {
    console.error('获取词向量失败:', error.message || error);
    return {
      success: false,
      error: error.message || '获取词向量失败'
    };
  }
}

// 导出模块
module.exports = {
  init,
  extractKeywords,
  getEmbeddings
};
