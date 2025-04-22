/**
 * 用户画像服务模块
 * 提供用户画像生成、存储和检索功能
 */

// 引入云函数调用工具
const cloudFuncCaller = require('./cloudFuncCaller');

/**
 * 获取用户画像
 * @param {string} userId 用户ID
 * @param {boolean} forceRefresh 是否强制刷新
 * @returns {Promise<Object>} 用户画像数据
 */
async function getUserPerception(userId, forceRefresh = false) {
  try {
    if (!userId) {
      console.warn('获取用户画像失败: 用户ID为空');
      return null;
    }

    // 检查缓存
    if (!forceRefresh) {
      const cachedData = getCachedPerception(userId);
      if (cachedData) {
        console.log('使用缓存的用户画像数据');
        return cachedData;
      }
    }

    // 调用云函数获取用户画像
    const result = await cloudFuncCaller.callCloudFunc('user', {
      action: 'getUserPerception',
      userId
    });

    if (result.success && result.data) {
      // 更新缓存
      cachePerception(userId, result.data);
      return result.data;
    } else {
      console.warn('获取用户画像失败:', result.error || '未知错误');
      return null;
    }
  } catch (error) {
    console.error('获取用户画像异常:', error);
    return null;
  }
}

/**
 * 生成用户画像
 * @param {string} userId 用户ID
 * @param {boolean} useAI 是否使用AI增强
 * @returns {Promise<Object>} 生成结果
 */
async function generateUserPerception(userId, useAI = true) {
  try {
    if (!userId) {
      console.warn('生成用户画像失败: 用户ID为空');
      return { success: false, error: '用户ID不能为空' };
    }

    // 调用云函数生成用户画像
    const result = await cloudFuncCaller.callCloudFunc('user', {
      action: 'generateUserPerception',
      userId,
      useAI
    }, {
      showLoading: true,
      loadingText: '正在生成用户画像...'
    });

    if (result.success && result.data) {
      // 更新缓存
      cachePerception(userId, result.data);
      return { success: true, data: result.data };
    } else {
      console.warn('生成用户画像失败:', result.error || '未知错误');
      return { success: false, error: result.error || '生成用户画像失败' };
    }
  } catch (error) {
    console.error('生成用户画像异常:', error);
    return { success: false, error: error.message || '生成用户画像异常' };
  }
}

/**
 * 获取用户个性特征
 * @param {string} userId 用户ID
 * @param {boolean} forceRefresh 是否强制刷新
 * @returns {Promise<Array>} 个性特征数组
 */
async function getPersonalityTraits(userId, forceRefresh = false) {
  try {
    const perception = await getUserPerception(userId, forceRefresh);
    if (!perception || !perception.personalityTraits) {
      console.warn('获取用户个性特征失败: 用户画像数据不完整');
      return [];
    }

    return perception.personalityTraits;
  } catch (error) {
    console.error('获取用户个性特征异常:', error);
    return [];
  }
}

/**
 * 获取用户兴趣标签
 * @param {string} userId 用户ID
 * @param {boolean} forceRefresh 是否强制刷新
 * @returns {Promise<Array>} 兴趣标签数组
 */
async function getUserInterests(userId, forceRefresh = false) {
  try {
    const perception = await getUserPerception(userId, forceRefresh);
    if (!perception || !perception.interests) {
      console.warn('获取用户兴趣标签失败: 用户画像数据不完整');
      return [];
    }

    return perception.interests;
  } catch (error) {
    console.error('获取用户兴趣标签异常:', error);
    return [];
  }
}

/**
 * 获取用户情感模式
 * @param {string} userId 用户ID
 * @param {boolean} forceRefresh 是否强制刷新
 * @returns {Promise<Object>} 情感模式数据
 */
async function getEmotionPatterns(userId, forceRefresh = false) {
  try {
    const perception = await getUserPerception(userId, forceRefresh);
    if (!perception || !perception.emotionPatterns) {
      console.warn('获取用户情感模式失败: 用户画像数据不完整');
      return null;
    }

    return perception.emotionPatterns;
  } catch (error) {
    console.error('获取用户情感模式异常:', error);
    return null;
  }
}

/**
 * 获取用户个性总结
 * @param {string} userId 用户ID
 * @param {boolean} forceRefresh 是否强制刷新
 * @returns {Promise<string>} 个性总结文本
 */
async function getPersonalitySummary(userId, forceRefresh = false) {
  try {
    const perception = await getUserPerception(userId, forceRefresh);
    if (!perception || !perception.personalitySummary) {
      console.warn('获取用户个性总结失败: 用户画像数据不完整');
      return '';
    }

    return perception.personalitySummary;
  } catch (error) {
    console.error('获取用户个性总结异常:', error);
    return '';
  }
}

/**
 * 生成用户画像系统提示词
 * @param {string} userId 用户ID
 * @param {boolean} forceRefresh 是否强制刷新
 * @returns {Promise<string>} 系统提示词
 */
async function generateUserSystemPrompt(userId, forceRefresh = false) {
  try {
    const perception = await getUserPerception(userId, forceRefresh);
    if (!perception) {
      console.warn('生成用户系统提示词失败: 无法获取用户画像');
      return '';
    }

    // 构建系统提示词
    let prompt = '以下是关于用户的信息，请在回复中考虑这些特点：\n\n';

    // 添加个性总结
    if (perception.personalitySummary) {
      prompt += `用户个性：${perception.personalitySummary}\n\n`;
    }

    // 添加个性特征
    if (perception.personalityTraits && perception.personalityTraits.length > 0) {
      prompt += '用户个性特征：\n';
      perception.personalityTraits.forEach(trait => {
        const score = Math.round(trait.score * 100);
        prompt += `- ${trait.trait}：${score}%\n`;
      });
      prompt += '\n';
    }

    // 添加兴趣标签
    if (perception.interests && perception.interests.length > 0) {
      prompt += `用户兴趣：${perception.interests.join('、')}\n\n`;
    }

    // 添加情感模式
    if (perception.emotionPatterns) {
      const patterns = perception.emotionPatterns;
      
      if (patterns.dominantEmotions && patterns.dominantEmotions.length > 0) {
        prompt += '用户主要情绪：';
        patterns.dominantEmotions.forEach((emotion, index) => {
          prompt += `${emotion.emotion}(${emotion.percentage}%)`;
          if (index < patterns.dominantEmotions.length - 1) {
            prompt += '、';
          }
        });
        prompt += '\n';
      }
      
      if (patterns.emotionTrends && patterns.emotionTrends.trend) {
        prompt += `情绪趋势：${patterns.emotionTrends.trend}\n`;
      }
    }

    return prompt;
  } catch (error) {
    console.error('生成用户系统提示词异常:', error);
    return '';
  }
}

// 缓存相关函数
const PERCEPTION_CACHE_KEY = 'user_perception_cache_';
const CACHE_EXPIRY = 60 * 60 * 1000; // 1小时

/**
 * 获取缓存的用户画像数据
 * @param {string} userId 用户ID
 * @returns {Object|null} 缓存的数据或null
 */
function getCachedPerception(userId) {
  const cacheKey = PERCEPTION_CACHE_KEY + userId;
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
 * 缓存用户画像数据
 * @param {string} userId 用户ID
 * @param {Object} data 要缓存的数据
 */
function cachePerception(userId, data) {
  const cacheKey = PERCEPTION_CACHE_KEY + userId;
  const cacheData = {
    timestamp: Date.now(),
    data
  };
  
  wx.setStorageSync(cacheKey, JSON.stringify(cacheData));
}

/**
 * 清除用户画像缓存
 * @param {string} userId 用户ID，如果不提供则清除所有用户的缓存
 */
function clearPerceptionCache(userId) {
  if (userId) {
    const cacheKey = PERCEPTION_CACHE_KEY + userId;
    wx.removeStorageSync(cacheKey);
  } else {
    // 获取所有storage keys
    const keys = wx.getStorageInfoSync().keys;
    // 清除所有以PERCEPTION_CACHE_KEY开头的缓存
    keys.forEach(key => {
      if (key.startsWith(PERCEPTION_CACHE_KEY)) {
        wx.removeStorageSync(key);
      }
    });
  }
}

// 导出模块
module.exports = {
  getUserPerception,
  generateUserPerception,
  getPersonalityTraits,
  getUserInterests,
  getEmotionPatterns,
  getPersonalitySummary,
  generateUserSystemPrompt,
  clearPerceptionCache
};
