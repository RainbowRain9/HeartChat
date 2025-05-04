/**
 * chatHelper.js - 聊天辅助模块
 * 
 * 提供聊天相关的功能，包括：
 * - 加载聊天历史
 * - 构建消息历史
 * - 保存用户消息
 * - 调用AI服务
 * - 处理AI响应
 */

// 导入数据库辅助模块
const dbHelper = require('./dbHelper');
const { updateChatCount } = require('./stats');

// 加载聊天历史
async function loadChatHistory(options = {}) {
  try {
    console.log('开始加载聊天记录...');

    // 验证必要条件
    if (!options.userInfo || !options.userInfo.userId) {
      console.warn('用户未登录，无法加载聊天记录');
      return { success: false, messages: [], emotionAnalysis: null };
    }

    // 显示加载状态（如果需要）
    if (options.showLoading) {
      wx.showLoading({
        title: '加载聊天记录...',
        mask: false
      });
    }

    console.log('当前角色信息:', options.currentRole ? {
      _id: options.currentRole._id,
      role_name: options.currentRole.role_name,
      relationship: options.currentRole.relationship
    } : '未设置');

    // 尝试从本地缓存加载聊天记录
    const cacheKey = `chatHistory_${options.currentRole ? options.currentRole._id : 'default'}`;
    const cachedHistory = wx.getStorageSync(cacheKey);
    const cacheTime = wx.getStorageSync(`${cacheKey}_time`) || 0;
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5分钟缓存过期时间

    // 如果有缓存且未过期，直接使用缓存数据
    if (cachedHistory && (now - cacheTime) < cacheExpiry) {
      console.log('使用本地缓存的聊天记录，消息数量:', cachedHistory.length);
      
      if (options.showLoading) {
        wx.hideLoading();
      }

      return {
        success: true,
        messages: cachedHistory,
        emotionAnalysis: wx.getStorageSync(`${cacheKey}_emotion`) || {
          type: 'neutral',
          intensity: 0.5,
          suggestions: []
        },
        fromCache: true
      };
    }

    // 如果没有缓存或缓存已过期，从云函数获取数据
    console.log('本地缓存不存在或已过期，从云函数获取数据...');

    // 准备查询参数
    const query = { userId: options.userInfo.userId };

    // 如果有当前角色，添加角色条件
    if (options.currentRole && options.currentRole._id) {
      query.roleId = options.currentRole._id;
    }

    console.log('使用查询条件:', query);

    // 直接使用云函数获取数据，避免多次数据库查询
    let foundData = false;
    let messages = [];
    let emotionAnalysis = {
      type: 'neutral',
      intensity: 0.5,
      suggestions: []
    };

    try {
      // 使用云函数查询聊天记录，避免权限问题
      console.log('调用云函数 chat...');
      const callParams = {
        action: 'get',
        userId: options.userInfo.userId,
        roleId: options.currentRole ? options.currentRole._id : null
      };
      console.log('云函数参数:', callParams);

      const { result } = await wx.cloud.callFunction({
        name: 'chat',
        data: callParams
      });

      console.log('云函数返回结果:', result ? {
        success: result.success,
        dataLength: result.data ? result.data.length : 0
      } : '无结果');

      if (result.success && result.data && result.data.length > 0) {
        const lastChat = result.data[0];
        console.log('找到聊天记录:', {
          chatId: lastChat._id,
          roleId: lastChat.roleId,
          roleName: lastChat.role_name,
          hasMessages: lastChat.messages ? lastChat.messages.length : 0
        });

        // 如果有消息数组，使用消息数组
        if (lastChat.messages && lastChat.messages.length > 0) {
          console.log(`聊天记录中包含 ${lastChat.messages.length} 条消息`);

          // 过滤掉空消息和角色提示词
          const filteredMessages = lastChat.messages.filter(msg => {
            // 过滤掉空消息
            if (!msg.content || msg.content.trim() === '') {
              return false;
            }

            // 过滤掉角色提示词
            if (msg.type === 'user' &&
                msg.content.includes('你现在扮演的角色是') &&
                (msg.content.includes('请严格按照以上设定进行对话') ||
                 msg.content.includes('保持角色特征的一致性'))) {
              return false;
            }

            return true;
          });

          console.log(`过滤后保留 ${filteredMessages.length} 条消息`);

          // 保存到本地缓存
          const cacheKey = `chatHistory_${options.currentRole ? options.currentRole._id : 'default'}`;
          const emotionData = lastChat.emotionAnalysis || {
            type: 'neutral',
            intensity: 0.5,
            suggestions: []
          };

          wx.setStorageSync(cacheKey, filteredMessages);
          wx.setStorageSync(`${cacheKey}_time`, Date.now());
          wx.setStorageSync(`${cacheKey}_emotion`, emotionData);

          messages = filteredMessages;
          emotionAnalysis = emotionData;
          foundData = true;
          console.log('成功从云函数加载聊天记录并保存到本地缓存');
        } else {
          console.log('聊天记录中没有消息数组');
        }
      } else {
        console.log('云函数未返回有效数据');
      }
    } catch (cloudErr) {
      console.warn('调用云函数获取聊天记录失败:', cloudErr);
      // 如果云函数调用失败，不再尝试其他方式
    }

    if (options.showLoading) {
      wx.hideLoading();
    }
    console.log('加载聊天记录完成');

    return {
      success: foundData,
      messages,
      emotionAnalysis,
      fromCache: false
    };
  } catch (err) {
    console.error('加载聊天记录失败:', err);
    if (options.showLoading) {
      wx.hideLoading();
    }

    return {
      success: false,
      messages: [],
      emotionAnalysis: {
        type: 'neutral',
        intensity: 0.5,
        suggestions: []
      },
      error: err.message || '加载聊天记录失败'
    };
  }
}

// 构建消息历史
function buildMessageHistory(options = {}) {
  try {
    const { currentMessage, messages = [], currentRole } = options;
    const history = [];

    // 添加系统角色提示词
    if (currentRole) {
      const rolePrompt = generateSystemPrompt(currentRole);
      history.push({
        role: 'system',  // 使用system角色更适合于提示词
        content: rolePrompt
      });
    }

    // 添加最近对话历史，最多10条
    const recentMessages = messages.slice(-10);
    recentMessages.forEach(msg => {
      // 确保消息类型正确映射到AI角色
      let role = 'user';
      if (msg.type === 'bot' || msg.type === 'assistant' || msg.type === 'other') {
        role = 'assistant';
      }

      // 确保消息内容存在
      const content = msg.content || '';

      if (content.trim()) {
        history.push({ role, content });
      }
    });

    // 添加当前消息
    if (currentMessage && currentMessage.trim()) {
      history.push({
        role: 'user',
        content: currentMessage
      });
    }

    return history;
  } catch (err) {
    console.error('构建消息历史失败:', err);
    // 返回一个基本的历史数组，只包含当前消息
    return [
      {
        role: 'user',
        content: options.currentMessage || ''
      }
    ];
  }
}

// 生成系统提示词
function generateSystemPrompt(role) {
  return `根据我的角色信息调整对话风格：
我是${role.role_name}，作为${role.relationship}与你对话。
我的特点是：${role.role_desc || '无特殊说明'}
我的性格风格是：${role.style || '自然友好'}
我的说话风格是：${role.speaking_style || '自然友好'}
我的背景故事是：${role.background || '无特殊背景'}
我需要避免的话题是：${role.taboo || '无特殊禁忌'}

请在保持心情树洞AI智能体的基础定位下，根据以上角色信息调整对话风格。`;
}

// 保存用户消息
async function saveUserMessage(options = {}) {
  try {
    const { message, messages = [], userInfo, currentRole } = options;
    
    // 验证消息
    if (!message || typeof message !== 'string' || message.trim() === '') {
      console.warn('消息内容为空');
      return { success: false, messages };
    }

    // 添加到本地消息列表
    const userMessage = {
      type: 'user',
      content: message,
      timestamp: Date.now(),
      userInfo: userInfo
    };

    const updatedMessages = [...messages, userMessage];

    // 更新本地缓存
    try {
      const cacheKey = `chatHistory_${currentRole ? currentRole._id : 'default'}`;
      wx.setStorageSync(cacheKey, updatedMessages);
      wx.setStorageSync(`${cacheKey}_time`, Date.now());
      console.log('用户消息已更新到本地缓存');
    } catch (cacheErr) {
      console.error('更新本地缓存失败:', cacheErr);
    }

    return { success: true, messages: updatedMessages };
  } catch (err) {
    console.error('保存用户消息失败:', err);
    // 即使保存失败也返回原始消息列表
    return { success: false, messages: options.messages || [], error: err.message };
  }
}

// 调用AI服务
async function callAIService(options = {}) {
  try {
    const { message, history, botId, temperature = 0.8, maxTokens = 2000 } = options;
    
    // 先检查是否有扩展API
    if (wx.cloud.extend && wx.cloud.extend.AI && wx.cloud.extend.AI.bot) {
      return await wx.cloud.extend.AI.bot.sendMessage({
        botId: botId,
        msg: message,
        history: history,
        config: {
          temperature: temperature,
          maxTokens: maxTokens
        }
      });
    } else {
      // 如果没有扩展API，则使用普通云函数
      const { result } = await wx.cloud.callFunction({
        name: 'chatWithAI',
        data: {
          message,
          history,
          roleInfo: options.roleInfo,
          botId: botId,
          temperature: temperature,
          maxTokens: maxTokens
        }
      });

      return result;
    }
  } catch (err) {
    console.error('调用AI服务失败:', err);

    // 如果调用失败，返回一个默认响应
    return {
      content: '抱歉，我现在无法回应。请稍后再试。',
      success: false,
      error: err.message || '调用AI服务失败'
    };
  }
}

// 处理AI响应
async function handleAIResponse(options = {}) {
  try {
    const { content, messages = [], currentRole } = options;
    
    // 验证内容
    if (!content || typeof content !== 'string') {
      console.error('无效的AI响应内容:', content);
      return { success: false, messages };
    }

    // 创建机器人消息对象
    const botMessage = {
      type: 'bot',
      content: content,
      timestamp: Date.now(),
      roleInfo: currentRole
    };

    // 更新消息列表
    const updatedMessages = [...messages, botMessage];

    // 更新本地缓存
    try {
      const cacheKey = `chatHistory_${currentRole ? currentRole._id : 'default'}`;
      wx.setStorageSync(cacheKey, updatedMessages);
      wx.setStorageSync(`${cacheKey}_time`, Date.now());
      console.log('消息已更新到本地缓存');
    } catch (cacheErr) {
      console.error('更新本地缓存失败:', cacheErr);
    }

    return { success: true, messages: updatedMessages };
  } catch (err) {
    console.error('处理AI响应失败:', err);
    return { success: false, messages: options.messages || [], error: err.message };
  }
}

// 保存聊天记录到数据库
async function saveChat(options = {}) {
  try {
    const { messages = [], currentRole, userInfo, showUI = false } = options;
    
    // 如果没有消息或没有角色信息，则不保存
    if (!messages.length || !currentRole || !userInfo) {
      console.log('没有可保存的聊天记录');
      return { success: false, chatId: null };
    }

    // 记录开始保存的时间，用于计算耗时
    const startTime = Date.now();
    console.log(`开始保存聊天记录: 角色=${currentRole.role_name}, 消息数=${messages.length}`);

    // 如果需要显示界面，则显示保存中提示
    if (showUI) {
      wx.showLoading({
        title: '正在保存...',
        mask: true
      });
    }

    // 准备要保存的聊天数据
    const chatData = {
      roleId: currentRole._id,
      roleName: currentRole.role_name || '',
      userId: userInfo.userId,
      openId: userInfo.openId || '',
      userInfo: {
        userId: userInfo.userId,
        nickName: userInfo.nickName || '',
        avatarUrl: userInfo.avatarUrl || ''
      },
      title: `与${currentRole.role_name}的对话`,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content || '',
      emotionAnalysis: options.emotionAnalysis || {
        type: 'neutral',
        intensity: 0.5,
        suggestions: []
      },
      isArchived: false,
      isPinned: false,
      tags: []
    };

    // 打印要保存的消息数量
    console.log(`准备保存 ${messages.length} 条消息到数据库`);

    // 使用云函数保存聊天记录，避免权限问题
    console.log('调用云函数 chat...');
    const callResult = await wx.cloud.callFunction({
      name: 'chat',
      data: {
        action: 'save',
        chatData,
        messages: messages
      }
    }).catch(err => {
      console.error('调用云函数失败:', err);
      throw err;
    });

    console.log('云函数调用结果:', callResult);

    if (!callResult || !callResult.result) {
      throw new Error('云函数返回结果为空');
    }

    const { result } = callResult;

    if (!result.success) {
      throw new Error(result.error || '保存失败');
    }

    // 计算保存耗时
    const endTime = Date.now();
    console.log(`保存成功! 耗时: ${endTime - startTime}ms, 返回的chatId: ${result.chatId}`);

    // 更新用户对话次数统计
    // 注意: 主要的更新逻辑已经移到了云函数中
    // 这里保留一个备份机制，以防云函数更新失败
    if (result.isNewChat) {
      try {
        // 只有新对话才增加对话次数
        console.log('客户端备份: 更新用户对话次数统计');
        // 延迟2秒执行，给云函数足够的时间先完成更新
        setTimeout(() => {
          // 先获取最新的用户统计数据
          wx.cloud.callFunction({
            name: 'user',
            data: {
              action: 'getStats',
              userId: userInfo.userId
            }
          }).then(statsResult => {
            // 检查对话次数是否已经更新
            const stats = statsResult.result && statsResult.result.data;
            if (stats && stats.chat_count > 0) {
              console.log('云函数已成功更新对话次数，无需客户端更新');
              return;
            }

            // 如果云函数未更新成功，则由客户端更新
            updateChatCount(1).then(updateResult => {
              console.log('客户端更新对话次数结果:', updateResult);
            }).catch(err => {
              console.error('客户端更新对话次数失败:', err);
            });
          }).catch(err => {
            console.error('获取用户统计数据失败:', err);
          });
        }, 2000);
      } catch (statsErr) {
        console.error('更新用户对话次数异常:', statsErr);
        // 不影响主流程
      }
    }

    // 如果需要显示界面，则显示成功提示
    if (showUI) {
      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    }

    return { success: true, chatId: result.chatId };
  } catch (err) {
    console.error('保存聊天记录失败:', err);
    if (options.showUI) {
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
    // 返回错误信息
    return { success: false, chatId: null, error: err.message };
  }
}

module.exports = {
  loadChatHistory,
  buildMessageHistory,
  generateSystemPrompt,
  saveUserMessage,
  callAIService,
  handleAIResponse,
  saveChat
};
