/**
 * 关键词提取服务
 * 提供关键词提取相关功能
 */

/**
 * 提取文本关键词
 * @param {string} text 待分析文本
 * @param {number} topK 返回关键词数量
 * @returns {Promise<Array>} 关键词数组
 */
async function extractKeywords(text, topK = 10) {
  try {
    // 验证参数
    if (!text || typeof text !== 'string' || text.trim() === '') {
      console.warn('关键词提取文本为空');
      return [];
    }

    // 调用 analysis 云函数
    const result = await wx.cloud.callFunction({
      name: 'analysis',
      data: {
        type: 'keywords',
        text: text,
        topK: topK
      }
    });

    // 验证结果
    if (!result || !result.result || !result.result.success) {
      console.error('关键词提取云函数返回错误:', result?.result?.error || '未知错误');
      return [];
    }

    console.log('关键词提取成功:', result.result);

    // 返回关键词数组
    return result.result.data.keywords || [];
  } catch (error) {
    console.error('关键词提取调用失败:', error);
    return [];
  }
}

/**
 * 聚类分析
 * @param {string} text 待分析文本
 * @param {number} threshold 聚类阈值
 * @param {number} minClusterSize 最小簇大小
 * @returns {Promise<Array>} 聚类结果
 */
async function clusterKeywords(text, threshold = 0.7, minClusterSize = 2) {
  try {
    // 验证参数
    if (!text || typeof text !== 'string' || text.trim() === '') {
      console.warn('聚类分析文本为空');
      return [];
    }

    // 调用 analysis 云函数
    const result = await wx.cloud.callFunction({
      name: 'analysis',
      data: {
        type: 'cluster',
        text: text,
        threshold: threshold,
        minClusterSize: minClusterSize
      }
    });

    // 验证结果
    if (!result || !result.result || !result.result.success) {
      console.error('聚类分析云函数返回错误:', result?.result?.error || '未知错误');
      return [];
    }

    console.log('聚类分析成功:', result.result);

    // 返回聚类结果
    return result.result.data.clusters || [];
  } catch (error) {
    console.error('聚类分析调用失败:', error);
    return [];
  }
}

/**
 * 分析用户兴趣
 * @param {Array<string>} messages 用户历史消息
 * @returns {Promise<Object>} 兴趣分析结果
 */
async function analyzeUserInterests(messages) {
  try {
    // 验证参数
    if (!Array.isArray(messages) || messages.length === 0) {
      console.warn('用户兴趣分析消息为空');
      return { interests: [], summary: '' };
    }

    // 调用 analysis 云函数
    const result = await wx.cloud.callFunction({
      name: 'analysis',
      data: {
        type: 'user_interests',
        messages: messages
      }
    });

    // 验证结果
    if (!result || !result.result || !result.result.success) {
      console.error('用户兴趣分析云函数返回错误:', result?.result?.error || '未知错误');
      return { interests: [], summary: '' };
    }

    console.log('用户兴趣分析成功:', result.result);

    // 返回兴趣分析结果
    return result.result.data || { interests: [], summary: '' };
  } catch (error) {
    console.error('用户兴趣分析调用失败:', error);
    return { interests: [], summary: '' };
  }
}

// 创建服务对象
const keywordService = {
  extractKeywords,
  clusterKeywords,
  analyzeUserInterests
};

// 导出服务对象
module.exports = keywordService;
