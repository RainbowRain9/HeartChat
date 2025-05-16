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
 * 聚类分析
 * @param {string} text 待分析文本
 * @param {number} threshold 聚类阈值
 * @param {number} minClusterSize 最小簇大小
 * @param {Object} options 选项，包括平台和模型
 * @returns {Promise<Object>} 聚类结果
 */
async function clusterKeywords(text, threshold = 0.7, minClusterSize = 2, options = {}) {
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
          console.error('解析JSON响应失败:', parseError.message || parseError);
          return {
            success: false,
            error: '解析聚类分析结果失败'
          };
        }
      }

      return {
        success: false,
        error: '返回的聚类分析结果为空'
      };
    } else if (platformKey === 'OPENAI' || platformKey === 'CROND' || platformKey === 'CLOSEAI' || platformKey === 'GROK' || platformKey === 'CLAUDE') {
      // OpenAI, Crond API, CloseAI, Grok, Claude 处理
      // 构建Prompt
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
          console.error('解析JSON响应失败:', parseError.message || parseError);
          return {
            success: false,
            error: '解析聚类分析结果失败'
          };
        }
      }

      return {
        success: false,
        error: '返回的聚类分析结果为空'
      };
    } else {
      // 智谱AI处理
      // 构建Prompt
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
          console.error('解析JSON响应失败:', parseError.message || parseError);
          return {
            success: false,
            error: '解析聚类分析结果失败'
          };
        }
      }

      return {
        success: false,
        error: '返回的聚类分析结果为空'
      };
    }
  } catch (error) {
    console.error('聚类分析失败:', error.message || error);
    return {
      success: false,
      error: error.message || '聚类分析失败'
    };
  }
}

/**
 * 分析用户兴趣
 * @param {Array<string>} messages 用户历史消息
 * @param {Object} options 选项，包括平台和模型
 * @returns {Promise<Object>} 兴趣分析结果
 */
async function analyzeUserInterests(messages, options = {}) {
  try {
    // 验证参数
    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        success: false,
        error: '无效的消息参数'
      };
    }

    // 获取平台和模型
    const platformKey = options.platform || 'GEMINI';
    const platform = getPlatformConfig(platformKey);
    const modelName = options.model || platform.defaultModel;

    // 合并消息文本
    const combinedText = messages.join('\n');

    if (platformKey === 'GEMINI') {
      // Gemini特殊处理
      // 构建Prompt
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
              data: {
                interests: result.interests || [],
                summary: result.summary || '无法生成兴趣总结'
              }
            };
          }
        } catch (parseError) {
          console.error('解析JSON响应失败:', parseError.message || parseError);
          return {
            success: false,
            error: '解析兴趣分析结果失败'
          };
        }
      }

      return {
        success: false,
        error: '返回的兴趣分析结果为空'
      };
    } else if (platformKey === 'OPENAI' || platformKey === 'CROND' || platformKey === 'CLOSEAI' || platformKey === 'GROK' || platformKey === 'CLAUDE') {
      // OpenAI, Crond API, CloseAI, Grok, Claude 处理
      // 构建Prompt
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

      // 调用API
      const response = await callModelApi({
        model: modelName,
        body: {
          messages: promptMessages,
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
            data: {
              interests: result.interests || [],
              summary: result.summary || '无法生成兴趣总结'
            }
          };
        } catch (parseError) {
          console.error('解析JSON响应失败:', parseError.message || parseError);
          return {
            success: false,
            error: '解析兴趣分析结果失败'
          };
        }
      }

      return {
        success: false,
        error: '返回的兴趣分析结果为空'
      };
    } else {
      // 智谱AI处理
      // 构建Prompt
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
      const response = await callModelApi({
        model: modelName,
        body: {
          messages: promptMessages,
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
            data: {
              interests: result.interests || [],
              summary: result.summary || '无法生成兴趣总结'
            }
          };
        } catch (parseError) {
          console.error('解析JSON响应失败:', parseError.message || parseError);
          return {
            success: false,
            error: '解析兴趣分析结果失败'
          };
        }
      }

      return {
        success: false,
        error: '返回的兴趣分析结果为空'
      };
    }
  } catch (error) {
    console.error('用户兴趣分析失败:', error.message || error);
    return {
      success: false,
      error: error.message || '用户兴趣分析失败'
    };
  }
}

// 导出模块
module.exports = {
  init,
  clusterKeywords,
  analyzeUserInterests
};
