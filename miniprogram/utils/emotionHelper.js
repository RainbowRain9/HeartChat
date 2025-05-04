/**
 * emotionHelper.js - 情感分析辅助模块
 * 
 * 提供情感分析相关的功能，包括：
 * - 分析情感
 * - 保存情感记录
 * - 获取情感历史记录
 * - 根据情感匹配角色
 * - 检测情感变化并提供角色切换建议
 */

// 导入情感服务
const emotionService = require('../services/emotionService');

// 分析情感
async function analyzeEmotion(text) {
  try {
    // 使用情感分析服务
    return await emotionService.analyzeEmotion(text);
  } catch (err) {
    console.error('情感分析失败:', err);
    throw err;
  }
}

// 保存情感记录
async function saveEmotionRecord(emotionData) {
  try {
    // 使用情感分析服务保存记录
    return await emotionService.saveEmotionRecord(emotionData);
  } catch (err) {
    console.error('保存情感记录失败:', err);
    throw err;
  }
}

// 获取情感历史记录
async function getEmotionHistory(userId, roleId, limit = 10) {
  try {
    // 使用情感分析服务获取历史记录
    return await emotionService.getEmotionHistory(userId, roleId, limit);
  } catch (err) {
    console.error('获取情感历史记录失败:', err);
    return [];
  }
}

// 根据情感匹配角色
function matchRoleByEmotion(emotion, roleList) {
  return emotionService.matchRoleByEmotion(emotion, roleList);
}

// 检测情感变化并提供角色切换建议
function checkEmotionChangeAndSuggestRoleSwitch(prevEmotion, currentEmotion, roleList) {
  return emotionService.checkEmotionChangeAndSuggestRoleSwitch(prevEmotion, currentEmotion, roleList);
}

// 格式化聊天历史记录用于情感分析
function formatChatHistoryForAnalysis(chatHistory) {
  if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
    return [];
  }

  return chatHistory.map(msg => {
    return {
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content || ''
    };
  }).filter(msg => msg.content.trim() !== '');
}

// 分析用户情感并保存记录
async function analyzeAndSaveEmotion(text, options = {}) {
  try {
    // 验证文本
    if (!text || typeof text !== 'string' || text.trim() === '') {
      console.warn('情感分析文本为空');
      return null;
    }

    // 获取聊天历史记录作为上下文
    const chatHistory = options.history || [];
    const formattedHistory = formatChatHistoryForAnalysis(chatHistory);

    console.log('情感分析使用历史记录:', formattedHistory.length > 0 ? '是' : '否');

    // 调用情感分析服务，传入历史记录
    const result = await emotionService.analyzeEmotion(text, {
      history: formattedHistory,
      roleId: options.roleId || null,
      chatId: options.chatId || null
    });

    // 验证结果
    if (!result) {
      throw new Error('情感分析结果为空');
    }

    // 如果需要保存记录
    if (options.saveRecord && options.userId && options.roleId) {
      try {
        // 准备情感数据
        const emotionData = {
          userId: options.userId,
          roleId: options.roleId,
          roleName: options.roleName || '',
          analysis: result,
          messages: options.messages || [],
          createTime: new Date(),
          updateTime: new Date()
        };

        // 保存情感记录
        await saveEmotionRecord(emotionData);
        console.log('情感记录已保存');
      } catch (saveErr) {
        console.error('保存情感记录失败:', saveErr);
        // 不影响返回分析结果
      }
    }

    return result;
  } catch (err) {
    console.error('情感分析失败:', err);
    // 返回默认的情感分析结果
    return {
      type: 'neutral',
      intensity: 0.5,
      report: '无法分析您当前的情绪状态，您的情绪似乎比较平稳。',
      suggestions: ['继续保持对话']
    };
  }
}

module.exports = {
  analyzeEmotion,
  saveEmotionRecord,
  getEmotionHistory,
  matchRoleByEmotion,
  checkEmotionChangeAndSuggestRoleSwitch,
  formatChatHistoryForAnalysis,
  analyzeAndSaveEmotion
};
