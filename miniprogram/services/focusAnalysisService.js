/**
 * 关注点分析服务
 * 提供用户关注点分析相关功能
 */

// 引入云函数调用工具
const cloudFuncCaller = require('./cloudFuncCaller');
const userService = require('./userService');

/**
 * 分析用户关注点
 * @param {string} userId 用户ID，默认为当前登录用户
 * @param {Array} keywords 关键词数组，可选
 * @param {Array} emotionRecords 情绪记录数组，可选
 * @param {Date} date 指定日期，可选
 * @returns {Promise<Object>} 分析结果
 */
async function analyzeFocusPoints(userId = null, keywords = null, emotionRecords = null, date = null) {
  try {
    // 如果没有提供用户ID，获取当前登录用户
    if (!userId) {
      const userInfo = await userService.getUserInfo();
      userId = userInfo.openId;
    }

    // 验证用户ID
    if (!userId) {
      console.warn('分析用户关注点失败: 用户ID为空');
      return {
        success: false,
        error: '用户ID不能为空'
      };
    }

    // 准备参数
    const params = {
      type: 'focus_points',
      userId: userId
    };

    // 如果提供了关键词，添加到参数中
    if (keywords && Array.isArray(keywords) && keywords.length > 0) {
      params.keywords = keywords;
    }

    // 如果提供了情绪记录，添加到参数中
    if (emotionRecords && Array.isArray(emotionRecords) && emotionRecords.length > 0) {
      params.emotionRecords = emotionRecords;
    }

    // 如果提供了日期，添加到参数中
    if (date) {
      params.date = date;
    }

    // 调用云函数
    console.log('调用云函数分析用户关注点:', params);
    const result = await cloudFuncCaller.callCloudFunc('analysis', params);

    // 返回结果
    return result;
  } catch (error) {
    console.error('分析用户关注点异常:', error);
    return {
      success: false,
      error: error.message || '分析用户关注点失败'
    };
  }
}

/**
 * 获取用户关注点分析结果
 * @param {string} userId 用户ID，默认为当前登录用户
 * @param {Date} date 指定日期，默认为当天
 * @param {boolean} forceRefresh 是否强制刷新，默认为false
 * @returns {Promise<Object>} 分析结果
 */
async function getUserFocusPoints(userId = null, date = null, forceRefresh = false) {
  try {
    // 如果没有提供用户ID，获取当前登录用户
    if (!userId) {
      const userInfo = await userService.getUserInfo();
      userId = userInfo.openId;
    }

    // 验证用户ID
    if (!userId) {
      console.warn('获取用户关注点失败: 用户ID为空');
      return {
        success: false,
        error: '用户ID不能为空'
      };
    }

    // 检查缓存
    if (!forceRefresh) {
      const cachedData = getCachedFocusPoints(userId, date);
      if (cachedData) {
        console.log('使用缓存的用户关注点数据');
        return cachedData;
      }
    }

    // 分析用户关注点
    const result = await analyzeFocusPoints(userId, null, null, date);

    // 如果分析成功，缓存结果
    if (result.success && result.data) {
      cacheFocusPoints(userId, result.data, date);
    }

    // 返回结果
    return result;
  } catch (error) {
    console.error('获取用户关注点异常:', error);
    return {
      success: false,
      error: error.message || '获取用户关注点失败'
    };
  }
}

// 缓存相关函数
const CACHE_KEY_PREFIX = 'user_focus_points_cache_';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟

/**
 * 获取缓存的关注点数据
 * @param {string} userId 用户ID
 * @param {Date} date 日期
 * @returns {Object|null} 缓存的数据或null
 */
function getCachedFocusPoints(userId, date) {
  // 生成缓存键
  const dateStr = date ? new Date(date).toISOString().split('T')[0] : 'latest';
  const cacheKey = `${CACHE_KEY_PREFIX}${userId}_${dateStr}`;
  
  const cacheString = wx.getStorageSync(cacheKey);
  if (!cacheString) return null;

  try {
    const cache = JSON.parse(cacheString);

    // 检查缓存是否过期
    const now = Date.now();
    if (now - cache.timestamp > CACHE_EXPIRY) return null;

    return {
      success: true,
      data: cache.data
    };
  } catch (e) {
    console.error('解析缓存数据失败:', e);
    return null;
  }
}

/**
 * 缓存关注点数据
 * @param {string} userId 用户ID
 * @param {Object} data 数据
 * @param {Date} date 日期
 */
function cacheFocusPoints(userId, data, date) {
  // 生成缓存键
  const dateStr = date ? new Date(date).toISOString().split('T')[0] : 'latest';
  const cacheKey = `${CACHE_KEY_PREFIX}${userId}_${dateStr}`;
  
  const cacheData = {
    timestamp: Date.now(),
    data: data
  };

  try {
    wx.setStorageSync(cacheKey, JSON.stringify(cacheData));
  } catch (e) {
    console.error('缓存关注点数据失败:', e);
  }
}

/**
 * 清除关注点缓存
 * @param {string} userId 用户ID
 * @param {Date} date 日期，如果不提供则清除所有日期的缓存
 */
function clearFocusPointsCache(userId, date) {
  if (date) {
    // 清除指定日期的缓存
    const dateStr = new Date(date).toISOString().split('T')[0];
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}_${dateStr}`;
    wx.removeStorageSync(cacheKey);
  } else {
    // 清除所有日期的缓存
    try {
      const keys = wx.getStorageInfoSync().keys;
      const prefix = `${CACHE_KEY_PREFIX}${userId}_`;
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          wx.removeStorageSync(key);
        }
      });
    } catch (e) {
      console.error('清除关注点缓存失败:', e);
    }
  }
}

// 导出模块
module.exports = {
  analyzeFocusPoints,
  getUserFocusPoints,
  clearFocusPointsCache
};
