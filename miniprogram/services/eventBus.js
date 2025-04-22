/**
 * 事件总线模块
 * 提供事件发布/订阅功能，用于实现事件驱动架构
 */

// 事件处理器映射
const eventHandlers = {};

// 事件类型枚举
const EventTypes = {
  // 消息相关事件
  MESSAGE_CREATED: 'message_created',
  MESSAGE_UPDATED: 'message_updated',
  MESSAGE_DELETED: 'message_deleted',
  
  // 情感分析相关事件
  EMOTION_ANALYZED: 'emotion_analyzed',
  EMOTION_RECORD_CREATED: 'emotion_record_created',
  
  // 用户兴趣相关事件
  INTEREST_UPDATED: 'interest_updated',
  INTEREST_BATCH_UPDATED: 'interest_batch_updated',
  
  // 用户画像相关事件
  PERCEPTION_UPDATED: 'perception_updated',
  PERCEPTION_GENERATED: 'perception_generated',
  
  // 角色相关事件
  ROLE_SELECTED: 'role_selected',
  ROLE_CREATED: 'role_created',
  ROLE_UPDATED: 'role_updated',
  
  // 聊天相关事件
  CHAT_STARTED: 'chat_started',
  CHAT_ENDED: 'chat_ended',
  
  // 系统相关事件
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  SYSTEM_ERROR: 'system_error'
};

/**
 * 订阅事件
 * @param {string} eventType 事件类型
 * @param {Function} handler 事件处理函数
 * @returns {Function} 取消订阅的函数
 */
function subscribe(eventType, handler) {
  if (!eventType || typeof handler !== 'function') {
    console.error('订阅事件失败: 参数无效');
    return () => {};
  }
  
  // 初始化事件类型的处理器数组
  if (!eventHandlers[eventType]) {
    eventHandlers[eventType] = [];
  }
  
  // 添加处理器
  eventHandlers[eventType].push(handler);
  
  // 返回取消订阅的函数
  return () => {
    unsubscribe(eventType, handler);
  };
}

/**
 * 取消订阅事件
 * @param {string} eventType 事件类型
 * @param {Function} handler 事件处理函数
 */
function unsubscribe(eventType, handler) {
  if (!eventType || !eventHandlers[eventType]) {
    return;
  }
  
  // 如果没有提供处理器，清除该事件类型的所有处理器
  if (!handler) {
    eventHandlers[eventType] = [];
    return;
  }
  
  // 移除特定处理器
  const index = eventHandlers[eventType].indexOf(handler);
  if (index !== -1) {
    eventHandlers[eventType].splice(index, 1);
  }
}

/**
 * 发布事件
 * @param {string} eventType 事件类型
 * @param {Object} eventData 事件数据
 */
function publish(eventType, eventData = {}) {
  if (!eventType) {
    console.error('发布事件失败: 事件类型不能为空');
    return;
  }
  
  // 如果没有该事件类型的处理器，直接返回
  if (!eventHandlers[eventType] || eventHandlers[eventType].length === 0) {
    console.log(`没有处理器订阅事件: ${eventType}`);
    return;
  }
  
  // 添加事件元数据
  const event = {
    type: eventType,
    timestamp: Date.now(),
    ...eventData
  };
  
  console.log(`发布事件: ${eventType}`, event);
  
  // 调用所有处理器
  eventHandlers[eventType].forEach(handler => {
    try {
      handler(event);
    } catch (error) {
      console.error(`事件处理器异常: ${eventType}`, error);
    }
  });
}

/**
 * 异步发布事件
 * @param {string} eventType 事件类型
 * @param {Object} eventData 事件数据
 * @returns {Promise<void>}
 */
async function publishAsync(eventType, eventData = {}) {
  if (!eventType) {
    console.error('异步发布事件失败: 事件类型不能为空');
    return;
  }
  
  // 如果没有该事件类型的处理器，直接返回
  if (!eventHandlers[eventType] || eventHandlers[eventType].length === 0) {
    console.log(`没有处理器订阅事件: ${eventType}`);
    return;
  }
  
  // 添加事件元数据
  const event = {
    type: eventType,
    timestamp: Date.now(),
    ...eventData
  };
  
  console.log(`异步发布事件: ${eventType}`, event);
  
  // 异步调用所有处理器
  const promises = eventHandlers[eventType].map(handler => {
    return new Promise(resolve => {
      try {
        const result = handler(event);
        if (result instanceof Promise) {
          result.then(resolve).catch(error => {
            console.error(`异步事件处理器异常: ${eventType}`, error);
            resolve();
          });
        } else {
          resolve();
        }
      } catch (error) {
        console.error(`事件处理器异常: ${eventType}`, error);
        resolve();
      }
    });
  });
  
  await Promise.all(promises);
}

/**
 * 清除所有事件处理器
 */
function clear() {
  Object.keys(eventHandlers).forEach(eventType => {
    eventHandlers[eventType] = [];
  });
}

// 导出模块
module.exports = {
  EventTypes,
  subscribe,
  unsubscribe,
  publish,
  publishAsync,
  clear
};
