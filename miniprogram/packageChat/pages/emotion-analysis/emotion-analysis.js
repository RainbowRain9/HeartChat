// packageChat/pages/emotion-analysis/emotion-analysis.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    messageId: '',
    chatId: '',
    recordId: '',
    userId: '',
    roleId: '',
    emotionAnalysis: null,
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const app = getApp();
    const userInfo = app.globalData.userInfo || {};

    this.setData({
      userId: userInfo.userId || ''
    });

    if (options.messageId) {
      this.setData({
        messageId: options.messageId
      });
      this.loadEmotionAnalysis(options.messageId);
    } else if (options.chatId) {
      this.setData({
        chatId: options.chatId,
        roleId: options.roleId || ''
      });
      this.loadChatEmotionAnalysis(options.chatId);
    } else if (options.recordId) {
      this.setData({
        recordId: options.recordId
      });
      this.loadEmotionRecordAnalysis(options.recordId);
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 加载单条消息的情绪分析
   */
  async loadEmotionAnalysis(messageId) {
    try {
      this.setData({ loading: true });

      const result = await wx.cloud.callFunction({
        name: 'analysis',
        data: {
          type: 'emotion',
          messageId
        }
      });

      if (result && result.result && result.result.success) {
        this.setData({
          emotionAnalysis: result.result.data,
          loading: false
        });
      } else {
        throw new Error('获取情绪分析失败');
      }
    } catch (error) {
      console.error('加载情绪分析失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  /**
   * 加载聊天的情绪分析
   */
  async loadChatEmotionAnalysis(chatId) {
    try {
      this.setData({ loading: true });

      const result = await wx.cloud.callFunction({
        name: 'analysis',
        data: {
          type: 'chat_emotion',
          chatId
        }
      });

      if (result && result.result && result.result.success) {
        this.setData({
          emotionAnalysis: result.result.data,
          loading: false
        });
      } else {
        throw new Error('获取聊天情绪分析失败');
      }
    } catch (error) {
      console.error('加载聊天情绪分析失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  /**
   * 加载情绪记录的情绪分析
   */
  async loadEmotionRecordAnalysis(recordId) {
    try {
      this.setData({ loading: true });

      const result = await wx.cloud.callFunction({
        name: 'analysis',
        data: {
          type: 'emotion_record',
          recordId
        }
      });

      if (result && result.result && result.result.success) {
        this.setData({
          emotionAnalysis: result.result.data,
          loading: false
        });
      } else {
        throw new Error('获取情绪记录分析失败');
      }
    } catch (error) {
      console.error('加载情绪记录分析失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 移除自定义返回按钮相关代码
})
