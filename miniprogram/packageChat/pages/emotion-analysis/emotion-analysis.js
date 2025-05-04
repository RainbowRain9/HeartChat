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
    loading: true,
    darkMode: false,  // 暗黑模式状态
    historyData: [],  // 历史情绪数据
    statusBarHeight: 20, // 状态栏高度，默认值
    navBarHeight: 44,    // 导航栏高度，默认值
    menuButtonInfo: null, // 胶囊按钮信息
    navTotalHeight: 64,   // 导航栏总高度，默认值
    refreshing: false,    // 是否正在刷新
    lastRefreshTime: 0    // 上次刷新时间戳
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const app = getApp();
    const userInfo = app.globalData.userInfo || {};

    // 获取暗黑模式设置
    const darkMode = wx.getStorageSync('darkMode') || false;

    this.setData({
      userId: userInfo.userId || '',
      darkMode: darkMode
    });

    // 延迟获取系统信息，避免页面加载时间过长
    wx.nextTick(() => {
      this.getSystemInfo();
    });

    // 检查是否使用缓存数据
    if (options.useCache === 'true' || options.useCache === true) {
      console.log('使用缓存的情绪分析结果');

      // 从全局变量中获取缓存的情绪分析结果
      const cachedEmotionAnalysis = app.globalData.cachedEmotionAnalysis;

      if (cachedEmotionAnalysis && cachedEmotionAnalysis.data) {
        this.setData({
          emotionAnalysis: cachedEmotionAnalysis.data,
          loading: false
        });

        // 延迟加载历史情绪数据，避免页面加载时间过长
        setTimeout(() => {
          this.loadHistoryEmotionData();
        }, 500);
        return;
      } else {
        console.warn('全局变量中没有缓存的情绪分析结果，尝试从本地缓存中获取');

        // 如果全局变量中没有，尝试从本地缓存中获取
        try {
          const localCachedResult = wx.getStorageSync('latestEmotionAnalysis');
          if (localCachedResult && localCachedResult.data) {
            this.setData({
              emotionAnalysis: localCachedResult.data,
              loading: false
            });

            // 延迟加载历史情绪数据，避免页面加载时间过长
            setTimeout(() => {
              this.loadHistoryEmotionData();
            }, 500);
            return;
          }
        } catch (e) {
          console.error('从本地缓存获取情绪分析结果失败:', e);
        }
      }
    }

    // 如果没有缓存数据或者不使用缓存，则根据参数加载数据
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
    } else if (!options.useCache) { // 只有当不是使用缓存时才显示错误
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } else {
      // 如果没有任何参数，但使用缓存，则显示空状态
      this.setData({
        loading: false
      });
    }

    // 延迟加载历史情绪数据，避免页面加载时间过长
    setTimeout(() => {
      this.loadHistoryEmotionData();
    }, 500);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查暗黑模式设置是否发生变化
    const darkMode = wx.getStorageSync('darkMode') || false;
    if (this.data.darkMode !== darkMode) {
      this.setData({ darkMode });
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
          loading: false,
          refreshing: false
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
      this.setData({
        loading: false,
        refreshing: false
      });
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

      console.log('聊天情绪分析结果:', result);

      if (result && result.result && result.result.success) {
        // 处理返回结果，兼容两种不同的返回结构
        let emotionData;
        if (result.result.data) {
          // 直接返回了data字段
          emotionData = result.result.data;
        } else if (result.result.result) {
          // 返回了result字段
          emotionData = result.result.result;
        } else {
          // 其他情况，使用整个result.result
          emotionData = result.result;
        }

        this.setData({
          emotionAnalysis: emotionData,
          loading: false,
          refreshing: false
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
      this.setData({
        loading: false,
        refreshing: false
      });
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
          loading: false,
          refreshing: false
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
      this.setData({
        loading: false,
        refreshing: false
      });
    }
  },

  // 移除自定义返回按钮相关代码

  /**
   * 加载历史情绪数据
   */
  async loadHistoryEmotionData() {
    try {
      const userId = this.data.userId;
      if (!userId) {
        this.setData({ refreshing: false });
        return;
      }

      // 先尝试从本地缓存获取历史数据
      try {
        const cachedHistoryData = wx.getStorageSync('emotionHistoryData_' + userId);
        if (cachedHistoryData && Array.isArray(cachedHistoryData) && cachedHistoryData.length > 0) {
          // 检查缓存时间是否在24小时内
          const cacheTime = wx.getStorageSync('emotionHistoryDataTime_' + userId) || 0;
          const now = Date.now();
          const cacheAge = now - cacheTime;

          // 如果缓存不超过24小时，直接使用缓存数据
          if (cacheAge < 24 * 60 * 60 * 1000) {
            console.log('使用缓存的历史情绪数据');
            this.setData({
              historyData: cachedHistoryData,
              refreshing: false
            });
            return;
          }
        }
      } catch (cacheError) {
        console.error('读取缓存历史情绪数据失败:', cacheError);
      }

      // 如果没有缓存或缓存过期，从数据库获取
      console.log('从数据库获取历史情绪数据');

      // 从数据库中获取近7天的情绪记录
      const db = wx.cloud.database();
      const _ = db.command;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await db.collection('emotionRecords')
        .where({
          userId: userId,
          createTime: _.gte(sevenDaysAgo)
        })
        .orderBy('createTime', 'asc')
        .limit(20) // 限制返回数量，避免数据过多
        .get();

      if (result && result.data) {
        // 更新页面数据
        this.setData({
          historyData: result.data,
          refreshing: false
        });

        // 缓存数据
        try {
          wx.setStorageSync('emotionHistoryData_' + userId, result.data);
          wx.setStorageSync('emotionHistoryDataTime_' + userId, Date.now());
          console.log('历史情绪数据已缓存');
        } catch (storageError) {
          console.error('缓存历史情绪数据失败:', storageError);
        }
      } else {
        this.setData({ refreshing: false });
      }
    } catch (error) {
      console.error('加载历史情绪数据失败:', error);
      this.setData({ refreshing: false });
    }
  },

  /**
   * 切换暗黑模式
   */
  toggleDarkMode() {
    const newDarkMode = !this.data.darkMode;
    this.setData({ darkMode: newDarkMode });
    wx.setStorageSync('darkMode', newDarkMode);
  },

  /**
   * 获取系统信息和导航栏高度
   */
  getSystemInfo: function() {
    try {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      // 获取胶囊按钮位置信息
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();

      // 计算导航栏高度，增加一点高度使其更美观
      const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + 10;
      // 计算导航栏总高度（状态栏 + 导航栏）
      const navTotalHeight = systemInfo.statusBarHeight + navBarHeight;

      this.setData({
        statusBarHeight: systemInfo.statusBarHeight,
        navBarHeight: navBarHeight,
        navTotalHeight: navTotalHeight,
        menuButtonInfo: menuButtonInfo
      });

      console.log('系统信息:', systemInfo);
      console.log('胶囊按钮信息:', menuButtonInfo);
      console.log('导航栏高度:', navBarHeight);
      console.log('导航栏总高度:', navTotalHeight);
    } catch (e) {
      console.error('获取系统信息失败:', e);
    }
  },

  /**
   * 返回上一页
   */
  navigateBack: function() {
    wx.navigateBack({
      fail: function() {
        wx.switchTab({
          url: '/pages/home/home'
        });
      }
    });
  },

  /**
   * 分享情绪分析结果
   */
  shareEmotionAnalysis: function() {
    // 调用微信分享接口
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  /**
   * 导出情绪分析结果
   */
  exportEmotionAnalysis: function() {
    if (!this.data.emotionAnalysis) {
      wx.showToast({
        title: '暂无数据可导出',
        icon: 'none'
      });
      return;
    }

    // 生成导出数据
    const exportData = this.generateExportData();

    // 将数据保存到副本
    wx.setClipboardData({
      data: exportData,
      success: () => {
        wx.showToast({
          title: '已复制到副本',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '导出失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 生成导出数据
   */
  generateExportData: function() {
    const emotion = this.data.emotionAnalysis;
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const timeStr = `${date.getHours()}:${date.getMinutes()}`;

    // 情绪类型映射
    const emotionMap = {
      'joy': '喜悦',
      'happy': '开心',
      'calm': '平静',
      'stable': '平稳',
      'anxiety': '焦虑',
      'anxious': '担忧',
      'anger': '愤怒',
      'angry': '生气',
      'sadness': '悲伤',
      'sad': '伤感',
      'sorrow': '忧伤',
      'fatigue': '疲惫',
      'surprise': '惊讶',
      'anticipation': '期待',
      'disgust': '厌恶',
      'disappointment': '失望',
      'urgency': '急切',
      'neutral': '中性'
    };

    // 主要情绪
    const primaryEmotion = emotion.type || emotion.primary_emotion || 'neutral';
    const emotionName = emotionMap[primaryEmotion] || primaryEmotion;

    // 生成导出文本
    let exportText = `【心语精灵情绪分析报告】\n`;
    exportText += `日期：${dateStr} ${timeStr}\n\n`;
    exportText += `主要情绪：${emotionName}\n`;
    exportText += `情绪强度：${Math.round(emotion.intensity * 100)}%\n`;
    exportText += `愉悦度：${Math.round(emotion.valence * 100)}%\n`;
    exportText += `激活度：${Math.round(emotion.arousal * 100)}%\n\n`;

    // 添加情绪维度
    if (emotion.radar_dimensions) {
      exportText += `情绪维度：\n`;
      const dimensions = emotion.radar_dimensions;
      exportText += `- 信任度：${Math.round(dimensions.trust || 0)}%\n`;
      exportText += `- 开放度：${Math.round(dimensions.openness || 0)}%\n`;
      exportText += `- 控制感：${Math.round(dimensions.control || 0)}%\n`;
      exportText += `- 抗拒度：${Math.round(dimensions.resistance || 0)}%\n`;
      exportText += `- 压力水平：${Math.round(dimensions.stress || 0)}%\n\n`;
    }

    // 添加关键词
    if (emotion.keywords && emotion.keywords.length > 0) {
      exportText += `关键词：`;
      emotion.keywords.forEach((keyword, index) => {
        const word = typeof keyword === 'string' ? keyword : keyword.word;
        exportText += word;
        if (index < emotion.keywords.length - 1) {
          exportText += '、';
        }
      });
      exportText += '\n\n';
    }

    // 添加建议
    if (emotion.suggestions && emotion.suggestions.length > 0) {
      exportText += `建议：\n`;
      emotion.suggestions.forEach((suggestion, index) => {
        exportText += `${index + 1}. ${suggestion}\n`;
      });
    }

    return exportText;
  },

  /**
   * 刷新数据
   */
  onRefresh: function() {
    // 防止频繁刷新，设置3秒内不能再次刷新
    const now = Date.now();
    if (now - this.data.lastRefreshTime < 3000) {
      this.setData({ refreshing: false });
      return;
    }

    this.setData({
      refreshing: true,
      lastRefreshTime: now
    });

    // 根据当前页面的参数重新加载数据
    if (this.data.messageId) {
      this.loadEmotionAnalysis(this.data.messageId);
    } else if (this.data.chatId) {
      this.loadChatEmotionAnalysis(this.data.chatId);
    } else if (this.data.recordId) {
      this.loadEmotionRecordAnalysis(this.data.recordId);
    } else {
      this.setData({ refreshing: false });
    }

    // 重新加载历史情绪数据
    this.loadHistoryEmotionData();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    const app = getApp();
    const userInfo = app.globalData.userInfo || {};
    const username = userInfo.username || userInfo.nickname || '用户';

    // 根据情绪分析结果生成分享标题
    let title = `${username}的情绪分析`;
    if (this.data.emotionAnalysis && this.data.emotionAnalysis.type) {
      const emotionType = this.data.emotionAnalysis.type;
      const emotionMap = {
        'joy': '喜悦',
        'happy': '开心',
        'calm': '平静',
        'stable': '平稳',
        'anxiety': '焦虑',
        'anxious': '担忧',
        'anger': '愤怒',
        'angry': '生气',
        'sadness': '悲伤',
        'sad': '伤感',
        'sorrow': '忧伤',
        'fatigue': '疲惫',
        'surprise': '惊讶',
        'anticipation': '期待',
        'disgust': '厌恶',
        'disappointment': '失望',
        'urgency': '急切',
        'neutral': '中性'
      };
      const emotionName = emotionMap[emotionType] || emotionType;
      title = `${username}的情绪分析: ${emotionName}`;
    }

    return {
      title: title,
      path: '/pages/home/home',
      imageUrl: '/images/share-emotion.png' // 需要在项目中添加这个图片
    };
  },

  /**
   * 用户点击右上角分享到朋友圈
   */
  onShareTimeline: function() {
    const app = getApp();
    const userInfo = app.globalData.userInfo || {};
    const username = userInfo.username || userInfo.nickname || '用户';

    // 根据情绪分析结果生成分享标题
    let title = `${username}的情绪分析`;
    if (this.data.emotionAnalysis && this.data.emotionAnalysis.type) {
      const emotionType = this.data.emotionAnalysis.type;
      const emotionMap = {
        'joy': '喜悦',
        'happy': '开心',
        'calm': '平静',
        'stable': '平稳',
        'anxiety': '焦虑',
        'anxious': '担忧',
        'anger': '愤怒',
        'angry': '生气',
        'sadness': '悲伤',
        'sad': '伤感',
        'sorrow': '忧伤',
        'fatigue': '疲惫',
        'surprise': '惊讶',
        'anticipation': '期待',
        'disgust': '厌恶',
        'disappointment': '失望',
        'urgency': '急切',
        'neutral': '中性'
      };
      const emotionName = emotionMap[emotionType] || emotionType;
      title = `${username}的情绪分析显示主要情绪是: ${emotionName}`;
    }

    return {
      title: title,
      query: 'from=timeline',
      imageUrl: '/images/share-emotion.png' // 需要在项目中添加这个图片
    };
  }
})
