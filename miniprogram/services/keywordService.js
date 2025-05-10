/**
 * 关键词服务模块
 * 提供关键词提取、存储和检索功能
 */

// 引入云函数调用工具
const cloudFuncCaller = require('./cloudFuncCaller');

// 是否为开发环境，控制日志输出
const isDev = true; // 设置为true可以开启详细日志

/**
 * 从文本中提取关键词
 * @param {string} text 待分析文本
 * @param {number} topK 返回关键词数量，默认10个
 * @returns {Promise<Array>} 关键词数组，每个元素包含word和weight字段
 */
async function extractKeywords(text, topK = 10) {
  try {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      if (isDev) {
        console.warn('提取关键词失败: 文本为空');
      }
      return [];
    }

    // 调用云函数提取关键词
    const result = await cloudFuncCaller.callCloudFunc('analysis', {
      type: 'keywords',
      text,
      topK
    });

    if (result.success && result.data && result.data.keywords) {
      return result.data.keywords;
    } else {
      if (isDev) {
        console.warn('提取关键词失败:', result.error || '未知错误');
      }
      return [];
    }
  } catch (error) {
    console.error('提取关键词异常:', error.message || error);
    return [];
  }
}

/**
 * 获取词向量
 * @param {Array<string>} texts 文本数组
 * @returns {Promise<Array>} 词向量数组
 */
async function getWordVectors(texts) {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      if (isDev) {
        console.warn('获取词向量失败: 文本数组为空');
      }
      return [];
    }

    // 调用云函数获取词向量
    const result = await cloudFuncCaller.callCloudFunc('analysis', {
      type: 'word_vectors',
      texts
    });

    if (result.success && result.data && result.data.vectors) {
      return result.data.vectors;
    } else {
      if (isDev) {
        console.warn('获取词向量失败:', result.error || '未知错误');
      }
      return [];
    }
  } catch (error) {
    console.error('获取词向量异常:', error.message || error);
    return [];
  }
}

/**
 * 聚类分析关键词
 * @param {string} text 待分析文本
 * @param {number} threshold 聚类阈值，默认0.7
 * @param {number} minClusterSize 最小簇大小，默认2
 * @returns {Promise<Array>} 聚类结果数组
 */
async function clusterKeywords(text, threshold = 0.7, minClusterSize = 2) {
  try {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      if (isDev) {
        console.warn('聚类分析失败: 文本为空');
      }
      return [];
    }

    // 调用云函数进行聚类分析
    const result = await cloudFuncCaller.callCloudFunc('analysis', {
      type: 'cluster',
      text,
      threshold,
      minClusterSize
    });

    if (result.success && result.data && result.data.clusters) {
      return result.data.clusters;
    } else {
      if (isDev) {
        console.warn('聚类分析失败:', result.error || '未知错误');
      }
      return [];
    }
  } catch (error) {
    console.error('聚类分析异常:', error.message || error);
    return [];
  }
}

/**
 * 分析用户兴趣
 * @param {Array<string>} messages 用户消息数组
 * @returns {Promise<Object>} 用户兴趣分析结果
 */
async function analyzeUserInterests(messages) {
  try {
    if (!Array.isArray(messages) || messages.length === 0) {
      if (isDev) {
        console.warn('分析用户兴趣失败: 消息数组为空');
      }
      return { interests: [], summary: '' };
    }

    // 调用云函数分析用户兴趣
    const result = await cloudFuncCaller.callCloudFunc('analysis', {
      type: 'user_interests',
      messages
    });

    if (result.success && result.data) {
      return result.data;
    } else {
      if (isDev) {
        console.warn('分析用户兴趣失败:', result.error || '未知错误');
      }
      return { interests: [], summary: '' };
    }
  } catch (error) {
    console.error('分析用户兴趣异常:', error.message || error);
    return { interests: [], summary: '' };
  }
}

/**
 * 获取用户兴趣数据
 * @param {string} userId 用户ID
 * @param {boolean} forceRefresh 是否强制刷新
 * @returns {Promise<Object>} 用户兴趣数据
 */
async function getUserInterests(userId, forceRefresh = false) {
  try {
    if (!userId) {
      if (isDev) {
        console.warn('获取用户兴趣数据失败: 用户ID为空');
      }
      return { keywords: [] };
    }

    // 检查缓存
    if (!forceRefresh) {
      const cachedData = getCachedInterests(userId);
      if (cachedData) {
        if (isDev) {
          console.log('使用缓存的用户兴趣数据');
        }
        return cachedData;
      }
    }

    // 调用云函数获取用户兴趣数据
    const result = await cloudFuncCaller.callCloudFunc('user', {
      action: 'getUserInterests',
      userId
    });

    if (result.success && result.data) {
      // 更新缓存
      cacheInterests(userId, result.data);
      return result.data;
    } else {
      if (isDev) {
        console.warn('获取用户兴趣数据失败:', result.error || '未知错误');
      }
      return { keywords: [] };
    }
  } catch (error) {
    console.error('获取用户兴趣数据异常:', error.message || error);
    return { keywords: [] };
  }
}

/**
 * 更新用户兴趣数据
 * @param {string} userId 用户ID
 * @param {string} keyword 关键词
 * @param {number} weightDelta 权重变化值
 * @returns {Promise<boolean>} 是否更新成功
 */
async function updateUserInterest(userId, keyword, weightDelta = 0.1) {
  try {
    if (!userId || !keyword) {
      if (isDev) {
        console.warn('更新用户兴趣数据失败: 参数不完整');
      }
      return false;
    }

    // 调用云函数更新用户兴趣数据
    const result = await cloudFuncCaller.callCloudFunc('user', {
      action: 'updateUserInterest',
      userId,
      keyword,
      weightDelta
    });

    if (result.success) {
      // 清除缓存
      clearInterestsCache(userId);
      return true;
    } else {
      if (isDev) {
        console.warn('更新用户兴趣数据失败:', result.error || '未知错误');
      }
      return false;
    }
  } catch (error) {
    console.error('更新用户兴趣数据异常:', error.message || error);
    return false;
  }
}

/**
 * 批量更新用户兴趣数据
 * @param {string} userId 用户ID
 * @param {Array} keywords 关键词数组，每个元素包含word和weight字段
 * @param {boolean} autoClassify 是否自动分类关键词
 * @param {Object} categoryStats 分类统计数据，可选
 * @param {Array} categoriesArray 分类数组，可选
 * @returns {Promise<boolean>} 是否更新成功
 */
async function batchUpdateUserInterests(userId, keywords, autoClassify = true, categoryStats = null, categoriesArray = null) {
  try {
    if (!userId || !Array.isArray(keywords) || keywords.length === 0) {
      if (isDev) {
        console.warn('批量更新用户兴趣数据失败: 参数不完整');
      }
      return false;
    }

    // 调用云函数批量更新用户兴趣数据
    const result = await cloudFuncCaller.callCloudFunc('user', {
      action: 'batchUpdateUserInterests',
      userId,
      keywords,
      autoClassify,
      categoryStats,
      categoriesArray
    });

    if (result.success) {
      // 清除缓存
      clearInterestsCache(userId);
      return true;
    } else {
      if (isDev) {
        console.warn('批量更新用户兴趣数据失败:', result.error || '未知错误');
      }
      return false;
    }
  } catch (error) {
    console.error('批量更新用户兴趣数据异常:', error.message || error);
    return false;
  }
}

/**
 * 从对话中提取关键词并更新用户兴趣
 * @param {string} userId 用户ID
 * @param {string} text 对话文本
 * @returns {Promise<boolean>} 是否更新成功
 */
async function processDialogueAndUpdateInterests(userId, text) {
  try {
    if (!userId || !text) {
      if (isDev) {
        console.warn('处理对话并更新兴趣失败: 参数不完整');
      }
      return false;
    }

    // 提取关键词
    const keywords = await extractKeywords(text, 5);
    if (keywords.length === 0) {
      if (isDev) {
        console.log('未从对话中提取到关键词');
      }
      return false;
    }

    // 引入用户兴趣服务
    const userInterestsService = require('./userInterestsService');

    // 尝试分类关键词
    try {
      // 调用云函数分类关键词
      const result = await wx.cloud.callFunction({
        name: 'analysis',
        data: {
          type: 'classify_keywords',
          keywords: keywords.map(k => k.word),
          batch: true
        }
      });

      if (result.result && result.result.success &&
          result.result.data && Array.isArray(result.result.data.classifications)) {

        // 将分类结果转换为映射
        const categoryMap = {};
        result.result.data.classifications.forEach(item => {
          categoryMap[item.keyword] = item.category;
        });

        // 将分类结果合并到关键词中
        const classifiedKeywords = keywords.map(keyword => ({
          word: keyword.word,
          weight: keyword.weight,
          category: categoryMap[keyword.word] || '未分类',
          emotionScore: 0
        }));

        // 创建分类统计数据
        const categoryStats = {};
        classifiedKeywords.forEach(keyword => {
          if (keyword.category) {
            categoryStats[keyword.category] = (categoryStats[keyword.category] || 0) + 1;
          }
        });

        // 创建分类数组
        const categoriesArray = Object.entries(categoryStats).map(([name, count]) => ({
          name,
          count,
          firstSeen: new Date(),
          lastUpdated: new Date()
        }));

        // 批量更新用户兴趣
        return await userInterestsService.batchUpdateUserInterests(
          userId,
          classifiedKeywords,
          true, // 自动分类
          categoryStats, // 传递分类统计
          categoriesArray // 传递分类数组
        );
      }
    } catch (classifyError) {
      console.error('分类关键词失败:', classifyError.message || classifyError);
      // 分类失败不影响主流程
    }

    // 如果分类失败，使用默认分类
    const defaultKeywords = keywords.map(keyword => ({
      word: keyword.word,
      weight: keyword.weight,
      category: '未分类',
      emotionScore: 0
    }));

    // 创建默认分类统计数据
    const categoryStats = {
      '未分类': defaultKeywords.length
    };

    // 创建分类数组
    const categoriesArray = [{
      name: '未分类',
      count: defaultKeywords.length,
      firstSeen: new Date(),
      lastUpdated: new Date()
    }];

    // 批量更新用户兴趣
    return await userInterestsService.batchUpdateUserInterests(
      userId,
      defaultKeywords,
      true, // 自动分类
      categoryStats, // 传递分类统计
      categoriesArray // 传递分类数组
    );
  } catch (error) {
    console.error('处理对话并更新兴趣异常:', error.message || error);
    return false;
  }
}

// 缓存相关函数
const CACHE_KEY_PREFIX = 'user_interests_cache_';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟

/**
 * 获取缓存的兴趣数据
 * @param {string} userId 用户ID
 * @returns {Object|null} 缓存的数据或null
 */
function getCachedInterests(userId) {
  const cacheKey = CACHE_KEY_PREFIX + userId;
  const cacheString = wx.getStorageSync(cacheKey);
  if (!cacheString) return null;

  try {
    const cache = JSON.parse(cacheString);

    // 检查缓存是否过期
    const now = Date.now();
    if (now - cache.timestamp > CACHE_EXPIRY) return null;

    return cache.data;
  } catch (e) {
    console.error('解析缓存数据失败:', e.message || e);
    return null;
  }
}

/**
 * 缓存兴趣数据
 * @param {string} userId 用户ID
 * @param {Object} data 要缓存的数据
 */
function cacheInterests(userId, data) {
  const cacheKey = CACHE_KEY_PREFIX + userId;
  const cacheData = {
    timestamp: Date.now(),
    data
  };

  wx.setStorageSync(cacheKey, JSON.stringify(cacheData));
}

/**
 * 清除兴趣数据缓存
 * @param {string} userId 用户ID，如果不提供则清除所有用户的缓存
 */
function clearInterestsCache(userId) {
  if (userId) {
    const cacheKey = CACHE_KEY_PREFIX + userId;
    wx.removeStorageSync(cacheKey);
  } else {
    // 获取所有storage keys
    const keys = wx.getStorageInfoSync().keys;
    // 清除所有以CACHE_KEY_PREFIX开头的缓存
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        wx.removeStorageSync(key);
      }
    });
  }
}

// 导出模块
module.exports = {
  extractKeywords,
  getWordVectors,
  clusterKeywords,
  analyzeUserInterests,
  getUserInterests,
  updateUserInterest,
  batchUpdateUserInterests,
  processDialogueAndUpdateInterests,
  clearInterestsCache
};
