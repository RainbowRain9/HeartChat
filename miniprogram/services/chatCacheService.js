/**
 * 聊天缓存服务
 * 提供聊天记录的本地缓存管理功能
 */

// 缓存前缀
const CACHE_PREFIX = 'chat_';
// 每页消息数量
const PAGE_SIZE = 20;
// 最大缓存聊天数
const MAX_CACHED_CHATS = 10;

/**
 * 保存消息到本地缓存
 * @param {string} chatId 聊天ID
 * @param {Array} messages 消息数组
 * @param {boolean} isLatest 是否为最新消息
 * @param {number} pageNum 页码(可选)
 * @param {Object} roleInfo 角色信息(可选)
 */
function saveMessagesToCache(chatId, messages, isLatest, pageNum, roleInfo) {
  if (!chatId || !messages || messages.length === 0) {
    console.log('保存缓存参数无效');
    return;
  }

  const cacheKey = `${CACHE_PREFIX}${chatId}`;
  let chatCache = wx.getStorageSync(cacheKey) || {
    basic: {
      roleId: roleInfo?.roleId || '',
      roleName: roleInfo?.name || '',
      lastUpdateTime: Date.now(),
      messageCount: 0
    },
    messages: {
      latest: [],
      pages: {}
    }
  };

  // 更新基本信息
  if (roleInfo) {
    chatCache.basic.roleId = roleInfo.roleId || chatCache.basic.roleId;
    chatCache.basic.roleName = roleInfo.name || chatCache.basic.roleName;
  }

  if (isLatest) {
    chatCache.basic.lastUpdateTime = Date.now();
    // 只在新增消息时更新计数
    const existingIds = new Set(chatCache.messages.latest.map(msg => msg._id));
    const newCount = messages.filter(msg => !existingIds.has(msg._id)).length;
    chatCache.basic.messageCount += newCount;
  }

  // 保存消息
  if (isLatest) {
    // 合并最新消息，避免重复
    const existingIds = new Set(chatCache.messages.latest.map(msg => msg._id));
    const newMessages = messages.filter(msg => !existingIds.has(msg._id));

    // 处理分段消息的关联
    const messageMap = {};
    [...chatCache.messages.latest, ...newMessages].forEach(msg => {
      messageMap[msg._id] = msg;
    });

    // 将分段消息按照索引排序
    const sortedMessages = [...chatCache.messages.latest, ...newMessages].sort((a, b) => {
      // 如果都是分段消息且来自同一原始消息
      if (a.isSegment && b.isSegment && a.originalMessageId === b.originalMessageId) {
        return a.segmentIndex - b.segmentIndex;
      }
      // 否则按时间戳排序
      return a.timestamp - b.timestamp;
    }).slice(-PAGE_SIZE * 2); // 由于分段消息可能会增加消息数量，所以增加缓存容量

    chatCache.messages.latest = sortedMessages;
  } else if (pageNum) {
    // 保存历史页面
    chatCache.messages.pages[`page_${pageNum}`] = messages;
  }

  // 保存到缓存
  try {
    wx.setStorageSync(cacheKey, chatCache);
    console.log(`成功保存聊天记录到缓存: ${chatId}, 消息数: ${messages.length}`);
  } catch (error) {
    console.error('保存聊天记录到缓存失败:', error);
    // 如果存储失败，可能是缓存已满，尝试清理旧数据
    cleanupOldCache();
    // 再次尝试保存
    try {
      wx.setStorageSync(cacheKey, chatCache);
      console.log('清理缓存后成功保存');
    } catch (e) {
      console.error('二次尝试保存缓存失败:', e);
    }
  }
}

/**
 * 从本地缓存加载消息
 * @param {string} chatId 聊天ID
 * @param {number} pageNum 页码(可选)
 * @returns {Array|null} 消息数组或null
 */
function loadMessagesFromCache(chatId, pageNum) {
  if (!chatId) return null;

  const cacheKey = `${CACHE_PREFIX}${chatId}`;
  const chatCache = wx.getStorageSync(cacheKey);

  if (!chatCache || !chatCache.messages) {
    console.log(`缓存中没有找到聊天记录: ${chatId}`);
    return null;
  }

  if (pageNum) {
    // 加载特定页面
    return chatCache.messages.pages[`page_${pageNum}`] || null;
  } else {
    // 加载最新消息
    return chatCache.messages.latest || [];
  }
}

/**
 * 获取聊天基本信息
 * @param {string} chatId 聊天ID
 * @returns {Object|null} 聊天基本信息
 */
function getChatBasicInfo(chatId) {
  if (!chatId) return null;

  const cacheKey = `${CACHE_PREFIX}${chatId}`;
  const chatCache = wx.getStorageSync(cacheKey);

  return chatCache?.basic || null;
}

/**
 * 更新单条消息
 * @param {string} chatId 聊天ID
 * @param {string} messageId 消息ID
 * @param {Object} updates 更新内容
 * @returns {boolean} 是否成功
 */
function updateMessageInCache(chatId, messageId, updates) {
  if (!chatId || !messageId || !updates) return false;

  const cacheKey = `${CACHE_PREFIX}${chatId}`;
  const chatCache = wx.getStorageSync(cacheKey);

  if (!chatCache || !chatCache.messages) return false;

  let updated = false;

  // 更新最新消息
  if (chatCache.messages.latest && chatCache.messages.latest.length > 0) {
    const index = chatCache.messages.latest.findIndex(msg => msg._id === messageId);
    if (index !== -1) {
      chatCache.messages.latest[index] = {
        ...chatCache.messages.latest[index],
        ...updates
      };
      updated = true;
    }
  }

  // 更新分页消息
  if (chatCache.messages.pages) {
    for (const pageKey in chatCache.messages.pages) {
      const page = chatCache.messages.pages[pageKey];
      if (page && page.length > 0) {
        const index = page.findIndex(msg => msg._id === messageId);
        if (index !== -1) {
          page[index] = {
            ...page[index],
            ...updates
          };
          updated = true;
        }
      }
    }
  }

  if (updated) {
    try {
      wx.setStorageSync(cacheKey, chatCache);
      console.log(`成功更新缓存中的消息: ${messageId}`);
      return true;
    } catch (error) {
      console.error('更新缓存消息失败:', error);
      return false;
    }
  }

  return false;
}

/**
 * 清理旧缓存
 */
function cleanupOldCache() {
  try {
    // 获取所有缓存键
    const keys = wx.getStorageInfoSync().keys;
    const chatKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

    if (chatKeys.length <= MAX_CACHED_CHATS) return; // 如果聊天记录少于限制，不清理

    // 按最后更新时间排序
    const sortedChats = chatKeys.map(key => {
      const cache = wx.getStorageSync(key);
      return {
        key,
        lastUpdateTime: cache?.basic?.lastUpdateTime || 0
      };
    }).sort((a, b) => a.lastUpdateTime - b.lastUpdateTime);

    // 删除最旧的聊天记录，直到数量符合限制
    const deleteCount = chatKeys.length - MAX_CACHED_CHATS;
    for (let i = 0; i < deleteCount; i++) {
      wx.removeStorageSync(sortedChats[i].key);
      console.log(`已清理旧聊天记录缓存: ${sortedChats[i].key}`);
    }
  } catch (error) {
    console.error('清理缓存失败:', error);
  }
}

/**
 * 清除指定聊天的缓存
 * @param {string} chatId 聊天ID
 */
function clearChatCache(chatId) {
  if (!chatId) return;

  const cacheKey = `${CACHE_PREFIX}${chatId}`;
  try {
    wx.removeStorageSync(cacheKey);
    console.log(`已清除聊天缓存: ${chatId}`);
  } catch (error) {
    console.error(`清除聊天缓存失败: ${chatId}`, error);
  }
}

/**
 * 获取所有缓存的聊天
 * @returns {Array} 聊天基本信息数组
 */
function getAllCachedChats() {
  try {
    const keys = wx.getStorageInfoSync().keys;
    const chatKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

    return chatKeys.map(key => {
      const cache = wx.getStorageSync(key);
      const chatId = key.replace(CACHE_PREFIX, '');
      return {
        chatId,
        ...cache.basic
      };
    }).sort((a, b) => b.lastUpdateTime - a.lastUpdateTime); // 按最后更新时间倒序
  } catch (error) {
    console.error('获取所有缓存聊天失败:', error);
    return [];
  }
}

// 导出服务
module.exports = {
  saveMessagesToCache,
  loadMessagesFromCache,
  getChatBasicInfo,
  updateMessageInCache,
  cleanupOldCache,
  clearChatCache,
  getAllCachedChats,
  PAGE_SIZE
};
