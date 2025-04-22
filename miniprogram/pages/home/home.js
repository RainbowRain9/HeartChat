// pages/home/home.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    darkMode: false,
    recentChats: [],
    loading: true,
    statusBarHeight: 20, // 状态栏高度，默认值
    navBarHeight: 44, // 导航栏高度，默认值
    menuButtonInfo: null // 胶囊按钮信息
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('首页加载，用户信息：', app.globalData.userInfo);
    // 获取系统信息和导航栏高度
    this.getSystemInfo();

    // 获取用户信息
    this.setData({
      userInfo: app.globalData.userInfo,
      darkMode: app.globalData.darkMode
    });

    // 延迟加载最近对话，确保用户信息已加载
    setTimeout(() => {
      this.loadRecentChats();
    }, 500);
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

      // 将导航高度信息存入全局数据
      app.globalData.navHeight = navBarHeight;
      app.globalData.statusBarHeight = systemInfo.statusBarHeight;
      app.globalData.navTotalHeight = navTotalHeight;

      console.log('系统信息:', systemInfo);
      console.log('胶囊按钮信息:', menuButtonInfo);
      console.log('导航栏高度:', navBarHeight);
      console.log('导航栏总高度:', navTotalHeight);
    } catch (e) {
      console.error('获取系统信息失败:', e);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 检查主题变化
    if (this.data.darkMode !== app.globalData.darkMode) {
      this.setData({
        darkMode: app.globalData.darkMode
      });
    }

    // 检查用户信息变化
    if (app.globalData.userInfo && (!this.data.userInfo || this.data.userInfo._id !== app.globalData.userInfo._id)) {
      this.setData({
        userInfo: app.globalData.userInfo
      });
    }

    // 刷新最近对话
    this.loadRecentChats();
  },

  /**
   * 加载最近对话
   */
  loadRecentChats: function () {
    this.setData({ loading: true });

    // 获取用户ID
    const userInfo = app.globalData.userInfo;
    console.log('加载最近对话，用户信息：', userInfo);

    if (!userInfo) {
      console.log('用户未登录，无法加载最近对话');
      this.setData({ loading: false });
      return;
    }

    // 优先使用userId，其次是_id，最后是openid
    const userId = userInfo.userId || userInfo.user_id || userInfo._id || userInfo.openid;

    if (!userId) {
      console.log('无法获取用户ID，用户信息：', userInfo);
      this.setData({ loading: false });
      return;
    }

    console.log('使用用户ID加载最近对话：', userId);

    // 直接从数据库查询最近对话
    const db = wx.cloud.database();
    const _ = db.command;
    db.collection('chats')
      .where(_.or([
        { user_id: userId },
        { userId: userId },
        { _openid: userInfo.openid }
      ]))
      .orderBy('last_message_time', 'desc')
      .limit(3)
      .get()
      .then(res => {
        const chats = res.data || [];

        // 处理时间显示和角色ID
        const processedChats = chats.map(chat => {
          // 格式化时间 - 优先使用updateTime，其次是last_message_time
          const messageTime = chat.updateTime ? new Date(chat.updateTime) :
                            chat.last_message_time ? new Date(chat.last_message_time) : new Date();

          // 确保时间是有效的Date对象
          const validTime = isNaN(messageTime.getTime()) ? new Date() : messageTime;

          const now = new Date();
          const diffMs = now - validTime;
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          let timeText = '';
          if (diffDays === 0) {
            // 今天，显示具体时间
            const hours = validTime.getHours();
            const minutes = validTime.getMinutes();
            timeText = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
          } else if (diffDays === 1) {
            timeText = '昨天';
          } else if (diffDays < 7) {
            timeText = `${diffDays}天前`;
          } else {
            // 超过7天，显示具体日期
            timeText = `${validTime.getMonth() + 1}-${validTime.getDate()}`;
          }

          // 调试信息
          console.log('聊天记录时间信息:', {
            chatId: chat._id,
            updateTime: chat.updateTime,
            last_message_time: chat.last_message_time,
            calculatedTime: validTime,
            timeText: timeText
          });

          // 确保有roleId字段，兼容不同的字段名称
          const roleId = chat.role_id || chat.roleId;

          // 如果没有roleId，尝试从其他字段提取
          if (!roleId && chat.role) {
            if (typeof chat.role === 'string') {
              // 如果role是字符串ID
              chat.role_id = chat.role;
            } else if (chat.role._id) {
              // 如果role是对象
              chat.role_id = chat.role._id;
            }
          }

          return {
            ...chat,
            time_text: timeText
          };
        });

        // 过滤掉没有roleId的聊天
        const filteredChats = processedChats.filter(chat => chat.role_id || chat.roleId);

        console.log('处理后的聊天数据:', filteredChats);

        this.setData({
          recentChats: filteredChats,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取最近对话失败:', err);
        this.setData({ loading: false });
      });
  },

  /**
   * 跳转到心情树洞（现为role-select tab页）
   */
  navigateToEmotionVault: function () {
    // 使用switchTab方法跳转到tab页面
    wx.switchTab({
      url: '/pages/role-select/role-select',
      success: function() {
        console.log('成功跳转到角色选择页面');
      },
      fail: function(err) {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 跳转到情绪分析
   */
  navigateToEmotionAnalysis: function () {
    wx.navigateTo({
      url: '/pages/emotionAnalysis/emotionAnalysis'
    });
  },

  /**
   * 跳转到情绪历史页面
   */
  navigateToEmotionHistory: function () {
    wx.navigateTo({
      url: '/packageEmotion/pages/emotion-history/emotion-history'
    });
  },

  /**
   * 跳转到关键词测试
   */
  navigateToKeywordTest: function () {
    wx.navigateTo({
      url: '/pages/keywordTest/keywordTest'
    });
  },

  /**
   * 跳转到每日报告
   */
  navigateToDailyReport: function () {
    wx.navigateTo({
      url: '/packageEmotion/pages/daily-report/daily-report'
    });
  },

  /**
   * 跳转到聊天页面
   */
  navigateToChat: function (e) {
    const { chatId, roleId } = e.currentTarget.dataset;
    console.log('跳转到聊天页面，参数：', chatId, roleId);

    if (!roleId) {
      wx.showToast({
        title: '角色ID不能为空',
        icon: 'none'
      });
      return;
    }

    // 构建跳转参数
    let url = '/packageChat/pages/chat/chat?roleId=' + roleId;

    // 如果有chatId，添加到URL
    if (chatId) {
      url += `&chatId=${chatId}`;
    }

    console.log('跳转到新聊天页面:', url);

    // 跳转到聊天页面
    wx.navigateTo({
      url: url,
      fail: function(err) {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 跳转到用户资料
   */
  navigateToProfile: function () {
    wx.navigateTo({
      url: '/pages/user/profile/index'
    });
  }
});
