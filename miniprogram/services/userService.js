/**
 * 用户服务模块
 * 负责用户资料的获取和保存
 */

const cloudFuncCaller = require('./cloudFuncCaller');

// 缓存相关常量
const USER_PROFILE_CACHE_KEY = 'user_profile_cache_';
const CACHE_EXPIRY = 60 * 60 * 1000; // 1小时

/**
 * 获取用户资料
 * @param {string} userId 用户ID
 * @param {boolean} forceRefresh 是否强制刷新
 * @returns {Promise<Object>} 用户资料
 */
async function getUserProfile(userId, forceRefresh = false) {
  try {
    if (!userId) {
      console.warn('获取用户资料失败: 用户ID为空');
      return null;
    }

    // 检查缓存
    if (!forceRefresh) {
      const cachedData = getCachedUserProfile(userId);
      if (cachedData) {
        console.log('使用缓存的用户资料数据');
        return cachedData;
      }
    }

    // 调用云函数获取用户资料
    const result = await cloudFuncCaller.callCloudFunc('user', {
      action: 'getInfo',
      userId
    });

    if (result.success && result.data && result.data.user) {
      // 获取用户详细资料
      const userProfileResult = await getUserProfileFromDB(userId);

      // 合并基本信息和详细资料
      const profileData = {
        ...result.data.user,
        ...userProfileResult
      };

      // 更新缓存
      cacheUserProfile(userId, profileData);
      return profileData;
    } else {
      console.warn('获取用户资料失败:', result.error || '未知错误');
      return null;
    }
  } catch (error) {
    console.error('获取用户资料异常:', error);
    return null;
  }
}

/**
 * 从数据库获取用户详细资料
 * @param {string} userId 用户ID
 * @returns {Promise<Object>} 用户详细资料
 */
async function getUserProfileFromDB(userId) {
  try {
    const db = wx.cloud.database();

    // 获取用户详细资料
    const profileResult = await db.collection('user_profile')
      .where({ user_id: userId })
      .get();

    // 获取用户基本信息
    const userBaseResult = await db.collection('user_base')
      .where({ user_id: userId })
      .get();

    // 合并结果
    const profileData = profileResult.data && profileResult.data.length > 0 ? profileResult.data[0] : {};
    const userBaseData = userBaseResult.data && userBaseResult.data.length > 0 ? userBaseResult.data[0] : {};

    // 构建完整的用户资料
    return {
      ...profileData,
      username: userBaseData.username,
      avatarUrl: userBaseData.avatar_url,
      userId: userBaseData.user_id,
      // 将数据库字段名转换为前端使用的字段名
      nickName: userBaseData.username,
      gender: profileData.gender,
      age: profileData.age || '',
      bio: profileData.bio || ''
    };
  } catch (error) {
    console.error('从数据库获取用户详细资料失败:', error);
    return {};
  }
}

/**
 * 保存用户资料
 * @param {string} userId 用户ID
 * @param {Object} profileData 用户资料数据
 * @returns {Promise<boolean>} 是否保存成功
 */
async function saveUserProfile(userId, profileData) {
  try {
    if (!userId || !profileData) {
      console.warn('保存用户资料失败: 参数不完整');
      return false;
    }

    // 提取基本信息和详细资料
    const { nickName, avatarUrl } = profileData;
    const { gender, age, bio } = profileData;

    // 调用云函数保存用户资料
    const result = await cloudFuncCaller.callCloudFunc('user', {
      action: 'updateProfile',
      userId,
      username: nickName,
      avatarUrl,
      gender,
      bio,
      // 添加其他可能的字段
      country: profileData.country || '',
      province: profileData.province || '',
      city: profileData.city || '',
      settings: {
        darkMode: profileData.darkMode || false,
        notificationEnabled: profileData.notificationEnabled || true,
        language: profileData.language || 'zh_CN'
      }
    });

    if (result.success) {
      // 更新缓存
      cacheUserProfile(userId, profileData);

      // 更新本地存储的userInfo
      updateLocalUserInfo(profileData);

      return true;
    } else {
      console.warn('保存用户资料失败:', result.error || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('保存用户资料异常:', error);
    return false;
  }
}

/**
 * 更新本地存储的userInfo
 * @param {Object} profileData 用户资料数据
 */
function updateLocalUserInfo(profileData) {
  try {
    // 获取当前存储的用户信息
    const userInfo = wx.getStorageSync('userInfo') || {};

    // 更新用户信息
    const updatedUserInfo = {
      ...userInfo,
      nickName: profileData.nickName || userInfo.nickName,
      avatarUrl: profileData.avatarUrl || userInfo.avatarUrl,
      gender: profileData.gender || userInfo.gender,
      age: profileData.age || userInfo.age,
      bio: profileData.bio || userInfo.bio
    };

    // 保存到本地存储
    wx.setStorageSync('userInfo', updatedUserInfo);

    // 更新全局状态
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.userInfo = {
        ...app.globalData.userInfo,
        ...updatedUserInfo
      };
    }
  } catch (error) {
    console.error('更新本地用户信息失败:', error);
  }
}

/**
 * 获取缓存的用户资料
 * @param {string} userId 用户ID
 * @returns {Object|null} 缓存的数据或null
 */
function getCachedUserProfile(userId) {
  const cacheKey = USER_PROFILE_CACHE_KEY + userId;
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
 * 缓存用户资料
 * @param {string} userId 用户ID
 * @param {Object} data 要缓存的数据
 */
function cacheUserProfile(userId, data) {
  const cacheKey = USER_PROFILE_CACHE_KEY + userId;
  const cacheData = {
    timestamp: Date.now(),
    data
  };

  wx.setStorageSync(cacheKey, JSON.stringify(cacheData));
}

/**
 * 清除用户资料缓存
 * @param {string} userId 用户ID，如果不提供则清除所有用户的缓存
 */
function clearUserProfileCache(userId) {
  if (userId) {
    const cacheKey = USER_PROFILE_CACHE_KEY + userId;
    wx.removeStorageSync(cacheKey);
  } else {
    // 获取所有storage keys
    const keys = wx.getStorageInfoSync().keys;
    // 清除所有以USER_PROFILE_CACHE_KEY开头的缓存
    keys.forEach(key => {
      if (key.startsWith(USER_PROFILE_CACHE_KEY)) {
        wx.removeStorageSync(key);
      }
    });
  }
}

/**
 * 从用户信息中获取用户ID
 * @param {Object} userInfo - 用户信息对象
 * @returns {String|null} 用户ID
 */
function getUserId(userInfo) {
  if (!userInfo) return null;

  // 优先使用userId，其次是user_id，再次是_id，最后是openid
  return userInfo.userId || userInfo.user_id || userInfo._id || userInfo.openid || null;
}

/**
 * 从用户信息中获取openid
 * @param {Object} userInfo - 用户信息对象
 * @param {Boolean} tryCache - 是否尝试从缓存中获取
 * @returns {String|null} openid
 */
function getOpenId(userInfo, tryCache = true) {
  if (!userInfo) return null;

  // 先检查顶层
  let openid = userInfo.openid;

  // 再检查stats对象
  if (!openid && userInfo.stats && userInfo.stats.openid) {
    openid = userInfo.stats.openid;
  }

  // 如果还是没有，尝试从本地缓存中获取
  if (!openid && tryCache) {
    try {
      const cachedOpenid = wx.getStorageSync('openId');
      if (cachedOpenid) {
        openid = cachedOpenid;
      }
    } catch (e) {
      console.error('从缓存获取openid失败:', e);
    }
  }

  return openid || null;
}

/**
 * 获取用户ID和openid
 * @param {Object} userInfo - 用户信息对象
 * @param {Boolean} tryCache - 是否尝试从缓存中获取openid
 * @returns {Object} 包含userId和openid的对象
 */
function getUserIdentifiers(userInfo, tryCache = true) {
  if (!userInfo) return { userId: null, openid: null };

  const userId = getUserId(userInfo);
  const openid = getOpenId(userInfo, tryCache);

  return { userId, openid };
}

/**
 * 构建数据库查询条件
 * @param {Object} userInfo - 用户信息对象
 * @param {Boolean} tryCache - 是否尝试从缓存中获取openid
 * @returns {Object} 查询条件对象
 */
function buildUserQuery(userInfo, tryCache = true) {
  const { userId, openid } = getUserIdentifiers(userInfo, tryCache);

  // 优先使用openid查询
  if (openid) {
    return { openId: openid };
  }
  // 如果没有openid，则使用userId
  else if (userId) {
    return { userId: userId };
  }

  // 如果都没有，返回空对象
  return {};
}

/**
 * 检查用户是否有效
 * @param {Object} userInfo - 用户信息对象
 * @param {Boolean} tryCache - 是否尝试从缓存中获取openid
 * @returns {Boolean} 用户是否有效
 */
function isValidUser(userInfo, tryCache = true) {
  if (!userInfo) return false;

  const { userId, openid } = getUserIdentifiers(userInfo, tryCache);
  return !!(userId || openid);
}

module.exports = {
  getUserProfile,
  saveUserProfile,
  clearUserProfileCache,
  getUserId,
  getOpenId,
  getUserIdentifiers,
  buildUserQuery,
  isValidUser
};
