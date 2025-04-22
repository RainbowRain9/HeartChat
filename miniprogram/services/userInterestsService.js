/**
 * 用户兴趣服务
 * 提供用户兴趣数据的获取和更新功能
 */

// 引入事件总线
const eventBus = require('./eventBus');
const { EventTypes } = eventBus;

// 缓存相关常量
const CACHE_KEY_PREFIX = 'user_interests_cache_';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟

/**
 * 获取用户兴趣数据
 * @param {string} userId 用户ID
 * @param {boolean} forceRefresh 是否强制刷新
 * @returns {Promise<Object>} 用户兴趣数据
 */
async function getUserInterests(userId, forceRefresh = false) {
  try {
    if (!userId) {
      console.warn('获取用户兴趣数据失败: 用户ID为空');
      return { keywords: [] };
    }

    // 检查缓存
    if (!forceRefresh) {
      const cachedData = getCachedInterests(userId);
      if (cachedData) {
        console.log('使用缓存的用户兴趣数据');
        return cachedData;
      }
    }

    // 调用云函数
    console.log('调用云函数获取用户兴趣数据');
    const result = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'getUserInterests',
        userId
      }
    });

    console.log('云函数返回结果:', result);

    if (result.result && result.result.success) {
      const interestsData = result.result.data || { keywords: [] };

      // 更新缓存
      cacheInterests(userId, interestsData);

      return interestsData;
    } else {
      console.warn('获取用户兴趣数据失败:', result.result ? result.result.error : '未知错误');
      return { keywords: [] };
    }
  } catch (error) {
    console.error('获取用户兴趣数据异常:', error);
    return { keywords: [] };
  }
}

/**
 * 更新用户兴趣关键词
 * @param {string} userId 用户ID
 * @param {string} keyword 关键词
 * @param {number} weightDelta 权重变化值
 * @returns {Promise<boolean>} 是否更新成功
 */
async function updateUserInterest(userId, keyword, weightDelta = 0.1) {
  try {
    if (!userId || !keyword) {
      console.warn('更新用户兴趣关键词失败: 参数不完整');
      return false;
    }

    // 调用云函数
    console.log('调用云函数更新用户兴趣关键词');
    const result = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'updateUserInterest',
        userId,
        keyword,
        weightDelta
      }
    });

    console.log('云函数返回结果:', result);

    if (result.result && result.result.success) {
      // 清除缓存
      clearInterestsCache(userId);

      // 发布事件
      eventBus.publish(EventTypes.INTEREST_UPDATED, {
        userId,
        keyword,
        weightDelta
      });

      return true;
    } else {
      console.warn('更新用户兴趣关键词失败:', result.result ? result.result.error : '未知错误');
      return false;
    }
  } catch (error) {
    console.error('更新用户兴趣关键词异常:', error);
    return false;
  }
}

/**
 * 批量更新用户兴趣关键词
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
      console.warn('批量更新用户兴趣关键词失败: 参数不完整');
      return {
        success: false,
        error: '参数不完整',
        data: null
      };
    }

    // 处理关键词数据，确保每个关键词都有分类和情感分数
    const processedKeywords = keywords.map(keyword => {
      // 确保关键词对象包含必要字段
      return {
        word: keyword.word,
        weight: keyword.weight || 1,
        category: keyword.category || '未分类',
        emotionScore: keyword.emotionScore || 0,
        lastUpdated: new Date()
      };
    });

    console.log('处理后的关键词数据:', JSON.stringify(processedKeywords, null, 2));

    // 如果没有提供分类统计，则生成分类统计
    if (!categoryStats) {
      categoryStats = {};
      processedKeywords.forEach(keyword => {
        const category = keyword.category || '未分类';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });
    }

    console.log('分类统计数据:', JSON.stringify(categoryStats, null, 2));

    // 调用云函数
    console.log('调用云函数批量更新用户兴趣关键词');
    const result = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'batchUpdateUserInterests',
        userId,
        keywords: processedKeywords,
        autoClassify,
        categoryStats,
        categoriesArray
      }
    });

    console.log('云函数返回结果:', result);

    if (result.result && result.result.success) {
      // 清除缓存
      clearInterestsCache(userId);

      // 发布事件
      eventBus.publish(EventTypes.INTEREST_BATCH_UPDATED, {
        userId,
        keywords: processedKeywords,
        categoryStats,
        categoriesArray
      });

      return {
        success: true,
        message: '批量更新用户兴趣关键词成功',
        data: {
          userId,
          keywords: processedKeywords,
          categoryStats,
          categoriesArray,
          result: result.result
        }
      };
    } else {
      const errorMsg = result.result ? result.result.error : '未知错误';
      console.warn('批量更新用户兴趣关键词失败:', errorMsg);
      return {
        success: false,
        error: errorMsg,
        data: null
      };
    }
  } catch (error) {
    console.error('批量更新用户兴趣关键词异常:', error);
    return {
      success: false,
      error: error.message || '批量更新用户兴趣关键词异常',
      data: null
    };
  }
}

/**
 * 删除用户兴趣关键词
 * @param {string} userId 用户ID
 * @param {string} keyword 关键词
 * @returns {Promise<boolean>} 是否删除成功
 */
async function deleteUserInterest(userId, keyword) {
  try {
    if (!userId || !keyword) {
      console.warn('删除用户兴趣关键词失败: 参数不完整');
      return false;
    }

    // 调用云函数
    console.log('调用云函数删除用户兴趣关键词');
    const result = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'deleteUserInterest',
        userId,
        keyword
      }
    });

    console.log('云函数返回结果:', result);

    if (result.result && result.result.success) {
      // 清除缓存
      clearInterestsCache(userId);

      // 发布事件
      eventBus.publish(EventTypes.INTEREST_UPDATED, {
        userId,
        keyword,
        deleted: true
      });

      return true;
    } else {
      console.warn('删除用户兴趣关键词失败:', result.result ? result.result.error : '未知错误');
      return false;
    }
  } catch (error) {
    console.error('删除用户兴趣关键词异常:', error);
    return false;
  }
}

/**
 * 更新关键词分类
 * @param {string} userId 用户ID
 * @param {string} keyword 关键词
 * @param {string} category 分类
 * @returns {Promise<boolean>} 是否更新成功
 */
async function updateKeywordCategory(userId, keyword, category) {
  try {
    if (!userId || !keyword || !category) {
      console.warn('更新关键词分类失败: 参数不完整');
      return false;
    }

    // 调用云函数
    console.log('调用云函数更新关键词分类');
    const result = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'updateKeywordCategory',
        userId,
        keyword,
        category
      }
    });

    console.log('云函数返回结果:', result);

    if (result.result && result.result.success) {
      // 清除缓存
      clearInterestsCache(userId);

      // 发布事件
      eventBus.publish(EventTypes.INTEREST_UPDATED, {
        userId,
        keyword,
        category
      });

      return true;
    } else {
      console.warn('更新关键词分类失败:', result.result ? result.result.error : '未知错误');
      return false;
    }
  } catch (error) {
    console.error('更新关键词分类异常:', error);
    return false;
  }
}

/**
 * 批量更新关键词分类
 * @param {string} userId 用户ID
 * @param {Array} categorizations 分类数组，每个元素包含keyword和category字段
 * @returns {Promise<boolean>} 是否更新成功
 */
async function batchUpdateKeywordCategories(userId, categorizations) {
  try {
    if (!userId || !Array.isArray(categorizations) || categorizations.length === 0) {
      console.warn('批量更新关键词分类失败: 参数不完整');
      return false;
    }

    // 调用云函数
    console.log('调用云函数批量更新关键词分类');
    const result = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'batchUpdateKeywordCategories',
        userId,
        categorizations
      }
    });

    console.log('云函数返回结果:', result);

    if (result.result && result.result.success) {
      // 清除缓存
      clearInterestsCache(userId);

      // 发布事件
      eventBus.publish(EventTypes.INTEREST_BATCH_UPDATED, {
        userId,
        categorizations
      });

      return true;
    } else {
      console.warn('批量更新关键词分类失败:', result.result ? result.result.error : '未知错误');
      return false;
    }
  } catch (error) {
    console.error('批量更新关键词分类异常:', error);
    return false;
  }
}

/**
 * 更新关键词情感分数
 * @param {string} userId 用户ID
 * @param {string} keyword 关键词
 * @param {number} emotionScore 情感分数
 * @returns {Promise<boolean>} 是否更新成功
 */
async function updateKeywordEmotionScore(userId, keyword, emotionScore) {
  try {
    if (!userId || !keyword || typeof emotionScore !== 'number') {
      console.warn('更新关键词情感分数失败: 参数不完整');
      return false;
    }

    // 调用云函数
    console.log('调用云函数更新关键词情感分数');
    const result = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'updateKeywordEmotionScore',
        userId,
        keyword,
        emotionScore
      }
    });

    console.log('云函数返回结果:', result);

    if (result.result && result.result.success) {
      // 清除缓存
      clearInterestsCache(userId);

      // 发布事件
      eventBus.publish(EventTypes.INTEREST_UPDATED, {
        userId,
        keyword,
        emotionScore
      });

      return true;
    } else {
      console.warn('更新关键词情感分数失败:', result.result ? result.result.error : '未知错误');
      return false;
    }
  } catch (error) {
    console.error('更新关键词情感分数异常:', error);
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
      console.warn('处理对话并更新兴趣失败: 参数不完整');
      return false;
    }

    // 调用关键词服务提取关键词
    const keywordService = require('./keywordService');
    const keywords = await keywordService.extractKeywords(text, 5);

    if (!keywords || keywords.length === 0) {
      console.log('未从对话中提取到关键词');
      return false;
    }

    // 批量更新用户兴趣
    return await batchUpdateUserInterests(userId, keywords);
  } catch (error) {
    console.error('处理对话并更新兴趣异常:', error);
    return false;
  }
}

/**
 * 获取用户兴趣标签云数据
 * @param {string} userId 用户ID
 * @param {boolean} forceRefresh 是否强制刷新
 * @param {boolean} useCategories 是否使用分类数据而不是关键词数据
 * @returns {Promise<Array>} 标签云数据数组
 */
async function getInterestTagCloudData(userId, forceRefresh = false, useCategories = true) {
  try {
    // 获取用户兴趣数据
    const interestsData = await getUserInterests(userId, forceRefresh);

    if (!interestsData) {
      console.log('用户兴趣数据为空');
      return [];
    }

    // 如果使用分类数据
    if (useCategories) {
      // 检查分类数据是否存在
      if (!interestsData.categories || !Array.isArray(interestsData.categories) || interestsData.categories.length === 0) {
        console.log('用户兴趣分类数据为空');
        return [];
      }

      // 将分类数据转换为标签云格式
      const tagCloudData = interestsData.categories.map(category => ({
        name: category.name,
        value: category.count || 0,
        category: category.name,
        isCategory: true
      }));

      // 按计数排序
      tagCloudData.sort((a, b) => b.value - a.value);

      return tagCloudData;
    } else {
      // 使用关键词数据
      if (!interestsData.keywords || interestsData.keywords.length === 0) {
        console.log('用户兴趣关键词数据为空');
        return [];
      }

      // 转换为标签云数据格式
      const tagCloudData = interestsData.keywords.map(item => ({
        name: item.word,
        value: Math.round(item.weight * 100),
        category: item.category || '未分类',
        emotionScore: item.emotionScore || 0,
        isCategory: false
      }));

      // 按权重排序
      tagCloudData.sort((a, b) => b.value - a.value);

      return tagCloudData;
    }
  } catch (error) {
    console.error('获取用户兴趣标签云数据异常:', error);
    return [];
  }
}

/**
 * 获取用户兴趣分类统计
 * @param {string} userId 用户ID
 * @param {boolean} forceRefresh 是否强制刷新
 * @returns {Promise<Object>} 分类统计数据
 */
async function getInterestCategoryStats(userId, forceRefresh = false) {
  try {
    // 获取用户兴趣数据
    const interestsData = await getUserInterests(userId, forceRefresh);

    if (!interestsData || !interestsData.keywords || interestsData.keywords.length === 0) {
      console.log('用户兴趣数据为空');
      return {};
    }

    // 统计各分类的关键词数量
    const categoryStats = {};

    interestsData.keywords.forEach(item => {
      const category = item.category || '未分类';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    return categoryStats;
  } catch (error) {
    console.error('获取用户兴趣分类统计异常:', error);
    return {};
  }
}

// 缓存相关函数

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
    console.error('解析缓存数据失败:', e);
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
  getUserInterests,
  updateUserInterest,
  batchUpdateUserInterests,
  deleteUserInterest,
  updateKeywordCategory,
  batchUpdateKeywordCategories,
  updateKeywordEmotionScore,
  processDialogueAndUpdateInterests,
  getInterestTagCloudData,
  getInterestCategoryStats,
  clearInterestsCache
};
