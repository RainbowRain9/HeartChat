/**
 * uiHelper.js - 界面交互辅助模块
 * 
 * 提供界面交互相关的功能，包括：
 * - 处理触摸事件
 * - 切换视图
 * - 处理错误
 * - 检查系统主题
 * - 切换深色模式
 */

// 处理触摸事件
function handleTouchStart(e, page) {
  page.setData({
    touchStartX: e.touches[0].clientX,
    lastTouchX: e.touches[0].clientX
  });
}

// 处理触摸移动事件
function handleTouchMove(e, page) {
  const touchX = e.touches[0].clientX;
  const deltaX = touchX - page.data.lastTouchX;
  let newChatWidth = page.data.chatViewWidth;

  if (deltaX < 0 && !page.data.showAnalysis) {
    newChatWidth = Math.max(40, page.data.chatViewWidth + (deltaX / wx.getSystemInfoSync().windowWidth) * 100);
  } else if (deltaX > 0 && page.data.showAnalysis) {
    newChatWidth = Math.min(100, page.data.chatViewWidth + (deltaX / wx.getSystemInfoSync().windowWidth) * 100);
  }

  page.setData({
    chatViewWidth: newChatWidth,
    lastTouchX: touchX
  });
}

// 处理触摸结束事件
function handleTouchEnd(page) {
  const threshold = 70;

  if (page.data.chatViewWidth < threshold && !page.data.showAnalysis) {
    page.setData({
      chatViewWidth: 40,
      showAnalysis: true,
      currentView: 'analysis'
    });
  } else if (page.data.chatViewWidth >= threshold && page.data.showAnalysis) {
    page.setData({
      chatViewWidth: 100,
      showAnalysis: false,
      currentView: 'chat'
    });
  } else {
    page.setData({
      chatViewWidth: page.data.showAnalysis ? 40 : 100
    });
  }
}

// 切换分析视图
function toggleAnalysisView(page) {
  const showAnalysis = !page.data.showAnalysis;
  page.setData({
    showAnalysis,
    chatViewWidth: showAnalysis ? 40 : 100,
    currentView: showAnalysis ? 'analysis' : 'chat'
  });
}

// 错误处理
function handleError(err, type = 'normal') {
  // 记录错误日志
  console.error(`[${type}]错误:`, err);

  // 获取错误消息
  let errorMessage = '操作失败，请重试';

  // 根据错误类型定制错误消息
  if (err) {
    if (typeof err === 'string') {
      errorMessage = err;
    } else if (err.message) {
      errorMessage = err.message;
    } else if (err.errMsg) {
      errorMessage = err.errMsg;
    }

    // 处理特定类型的错误
    if (type === 'login' && errorMessage.includes('login')) {
      errorMessage = '登录失败，请重试';
    } else if (type === 'network' || errorMessage.includes('network') || errorMessage.includes('timeout')) {
      errorMessage = '网络错误，请检查网络连接';
    } else if (type === 'permission' || errorMessage.includes('permission') || errorMessage.includes('auth')) {
      errorMessage = '权限不足，请检查授权';
    } else if (type === 'database' || errorMessage.includes('database') || errorMessage.includes('collection')) {
      errorMessage = '数据库操作失败，请重试';
    }

    // 限制错误消息长度
    if (errorMessage.length > 20) {
      errorMessage = errorMessage.substring(0, 20) + '...';
    }
  }

  // 显示错误提示
  wx.showToast({
    title: errorMessage,
    icon: 'none',
    duration: 2000
  });

  // 如果是严重错误，可以考虑记录到服务器
  if (type === 'critical') {
    try {
      wx.cloud.callFunction({
        name: 'logError',
        data: {
          type,
          message: errorMessage,
          stack: err.stack || '',
          page: 'emotionVault',
          timestamp: Date.now()
        }
      }).catch(logErr => {
        console.error('错误日志上传失败:', logErr);
      });
    } catch (logErr) {
      console.error('错误日志上传失败:', logErr);
    }
  }
}

// 检查系统主题
function checkSystemTheme(page) {
  wx.getSystemInfo({
    success: (res) => {
      page.setData({
        darkMode: res.theme === 'dark'
      });
    }
  });
}

// 切换深色模式
function toggleDarkMode(page, app) {
  const darkMode = !page.data.darkMode;
  page.setData({ darkMode });

  if (app.globalData) {
    app.globalData.darkMode = darkMode;
  }

  try {
    wx.setStorageSync('darkMode', darkMode);
  } catch (e) {
    console.error('保存主题设置失败', e);
  }
}

// 显示情感分析面板
function showEmotionPanel(page) {
  page.setData({ showEmotionPanel: true });
}

// 关闭情感分析面板
function closeEmotionPanel(page) {
  page.setData({ showEmotionPanel: false });
}

// 显示角色选择器
function showRoleSelector(page) {
  page.setData({ showRoleSelector: true });
}

// 隐藏角色选择器
function hideRoleSelector(page) {
  page.setData({ showRoleSelector: false });
}

// 显示情感历史记录
function showEmotionHistory(page) {
  page.setData({
    showEmotionHistory: true,
    showEmotionPanel: false
  });
}

// 关闭情感历史记录
function closeEmotionHistory(page) {
  page.setData({
    showEmotionHistory: false
  });
}

// 检查聊天记录加载状态
function checkChatHistoryLoaded(page) {
  // 检查消息列表是否有内容
  const hasMessages = page.data.messages && page.data.messages.length > 0;

  // 检查 agent-ui 组件的聊天记录是否有内容
  let agentUIHasMessages = false;
  if (page.agentUI && page.agentUI.data && page.agentUI.data.chatRecords) {
    // 过滤掉空消息和角色提示词
    const validMessages = page.agentUI.data.chatRecords.filter(record => {
      // 过滤掉空消息
      if (!record.content || record.content.trim() === '') {
        return false;
      }

      // 过滤掉角色提示词
      if (record.role === 'user' &&
          record.content.includes('你现在扮演的角色是') &&
          (record.content.includes('请严格按照以上设定进行对话') ||
           record.content.includes('保持角色特征的一致性'))) {
        return false;
      }

      return true;
    });

    agentUIHasMessages = validMessages.length > 0;
  }

  // 返回结果
  const isLoaded = hasMessages || agentUIHasMessages;
  console.log('聊天记录加载状态检查:', {
    hasMessages,
    agentUIHasMessages,
    isLoaded
  });

  return isLoaded;
}

module.exports = {
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  toggleAnalysisView,
  handleError,
  checkSystemTheme,
  toggleDarkMode,
  showEmotionPanel,
  closeEmotionPanel,
  showRoleSelector,
  hideRoleSelector,
  showEmotionHistory,
  closeEmotionHistory,
  checkChatHistoryLoaded
};
