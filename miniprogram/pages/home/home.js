// pages/home/home.js
const app = getApp();
const userService = require('../../services/userService');

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
    menuButtonInfo: null, // 胶囊按钮信息
    defaultAvatar: require('../../config/index').user.DEFAULT_AVATAR // 默认头像
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
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

      // 更新TabBar样式
      if (app.updateTheme) {
        app.updateTheme(app.globalData.darkMode);
      }
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

    // 使用userService获取用户ID和openid
    const { userId, openid } = userService.getUserIdentifiers(userInfo);

    // 检查用户是否有效
    if (!userService.isValidUser(userInfo)) {
      console.log('无法获取用户ID或openid，用户信息：', userInfo);
      this.setData({ loading: false });
      return;
    }

    console.log('使用用户ID加载最近对话：', userId, '，openid:', openid);

    // 直接从数据库查询最近对话
    const db = wx.cloud.database();

    // 使用userService构建查询条件，确保只查询当前用户的聊天记录
    const query = userService.buildUserQuery(userInfo);
    console.log('使用查询条件:', query);

    console.log('最终查询条件:', query);

    // 使用数据库查询条件，直接获取当前用户的聊天记录
    // 这样可以减少数据传输量，提高查询效率
    db.collection('chats')
      .where(query) // 使用构建好的查询条件
      .orderBy('last_message_time', 'desc')
      .limit(10) // 限制返回记录数量
      .get()
      .then(async res => {
        const chats = res.data || [];
        console.log('获取到的用户聊天数据:', chats);

        // 如果没有数据，直接返回
        if (chats.length === 0) {
          this.setData({
            recentChats: [],
            loading: false
          });
          return;
        }

        // 获取角色信息映射表
        const roleInfoMap = await this.fetchRoleInfoMap(chats);

        // 处理时间显示和角色信息
        const processedChats = chats.map(chat => {
          // 格式化时间
          const timeText = this.formatChatTime(chat);

          // 处理角色信息
          const { roleId, roleName, roleAvatar } = this.processRoleInfo(chat, roleInfoMap);

          // 获取最后一条消息内容，兼容不同的字段名称
          const lastMessage = chat.lastMessage || chat.last_message || chat.last_message_content || '开始一段新的对话吧';

          return {
            ...chat,
            roleId: roleId, // 使用驼峰命名法，与数据库中的字段保持一致
            roleName: roleName, // 使用驼峰命名法，与数据库中的字段保持一致
            roleAvatar: roleAvatar, // 使用驼峰命名法，与数据库中的字段保持一致
            lastMessage: lastMessage, // 使用驼峰命名法，与数据库中的字段保持一致
            time_text: timeText
          };
        });

        // 过滤掉没有roleId的聊天
        const filteredChats = processedChats.filter(chat => chat.roleId);

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
    // 使用通用导航方法跳转到tab页面
    this.navigate('/pages/role-select/role-select', 'switchTab');
  },

  /**
   * 跳转到情绪分析
   */
  navigateToEmotionAnalysis: function () {
    // 获取用户ID
    const userInfo = app.globalData.userInfo;
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 尝试从本地缓存中获取最新的情绪分析结果
    const emotionService = require('../../services/emotionService');
    const cachedEmotionAnalysis = emotionService.getLatestEmotionAnalysis();

    // 如果有缓存的情绪分析结果，直接使用
    if (cachedEmotionAnalysis && cachedEmotionAnalysis.data) {
      console.log('使用缓存的情绪分析结果');

      // 将缓存的情绪分析结果存入全局变量，供情绪分析页面使用
      app.globalData.cachedEmotionAnalysis = cachedEmotionAnalysis;

      // 跳转到情绪分析页面，带上缓存标记
      this.navigate('/packageChat/pages/emotion-analysis/emotion-analysis?useCache=true');

      // 同时在后台查询最新数据，以便刷新缓存
      this.queryLatestEmotionDataInBackground();
      return;
    }

    // 如果没有缓存数据，则查询最近的聊天记录
    console.log('没有缓存的情绪分析结果，查询最近的聊天记录');

    // 使用userService获取用户ID和openid
    const { userId, openid } = userService.getUserIdentifiers(userInfo);

    // 检查用户是否有效
    if (!userService.isValidUser(userInfo)) {
      wx.showToast({
        title: '无法获取用户信息',
        icon: 'none'
      });
      return;
    }

    // 显示加载中提示
    wx.showLoading({
      title: '加载中...'
    });

    // 查询最近的聊天记录
    const db = wx.cloud.database();
    const query = userService.buildUserQuery(userInfo);

    db.collection('chats')
      .where(query)
      .orderBy('last_message_time', 'desc')
      .limit(1)
      .get()
      .then(res => {
        wx.hideLoading();
        const chats = res.data || [];

        if (chats.length > 0) {
          const latestChat = chats[0];
          const chatId = latestChat._id;
          const roleId = latestChat.roleId || latestChat.role_id;

          // 跳转到情绪分析页面，带上聊天ID和角色ID
          this.navigate(`/packageChat/pages/emotion-analysis/emotion-analysis?chatId=${chatId}&roleId=${roleId}`);
        } else {
          // 如果没有聊天记录，直接跳转到情绪分析页面
          this.navigate('/packageChat/pages/emotion-analysis/emotion-analysis');
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('获取最近聊天失败:', err);
        // 出错时也直接跳转到情绪分析页面
        this.navigate('/packageChat/pages/emotion-analysis/emotion-analysis');
      });
  },

  /**
   * 在后台查询最新的情绪数据，用于更新缓存
   */
  queryLatestEmotionDataInBackground: function() {
    const userInfo = app.globalData.userInfo;
    if (!userInfo) return;

    // 检查用户是否有效
    if (!userService.isValidUser(userInfo)) return;

    const db = wx.cloud.database();
    const query = userService.buildUserQuery(userInfo);

    // 查询最近的聊天记录
    db.collection('chats')
      .where(query)
      .orderBy('last_message_time', 'desc')
      .limit(1)
      .get()
      .then(res => {
        const chats = res.data || [];
        if (chats.length > 0) {
          const latestChat = chats[0];
          const chatId = latestChat._id;

          // 查询该聊天的情绪分析结果
          wx.cloud.callFunction({
            name: 'analysis',
            data: {
              type: 'chat_emotion',
              chatId: chatId
            }
          }).then(result => {
            if (result && result.result && result.result.success) {
              // 更新缓存
              const finalResult = {
                success: true,
                data: {
                  ...result.result.data || result.result.result || {},
                  timestamp: new Date().getTime()
                }
              };

              try {
                wx.setStorageSync('latestEmotionAnalysis', finalResult);
                console.log('后台更新情绪分析缓存成功');
              } catch (e) {
                console.error('后台更新情绪分析缓存失败:', e);
              }
            }
          }).catch(err => {
            console.error('后台查询情绪分析失败:', err);
          });
        }
      })
      .catch(err => {
        console.error('后台查询最近聊天失败:', err);
      });
  },

  /**
   * 通用导航方法
   * @param {string} url - 导航URL
   * @param {string} method - 导航方法，可选值：navigateTo, switchTab, redirectTo, reLaunch
   * @param {Function} successCallback - 成功回调函数
   */
  navigate: function(url, method = 'navigateTo', successCallback = null) {
    if (!url) {
      console.error('导航URL不能为空');
      return;
    }

    // 默认的成功回调
    const defaultSuccess = function() {
      console.log(`成功跳转到: ${url}`);
    };

    // 默认的失败回调
    const defaultFail = function(err) {
      console.error(`跳转失败: ${url}`, err);
      wx.showToast({
        title: '跳转失败',
        icon: 'none'
      });
    };

    // 根据method选择不同的导航方法
    switch (method) {
      case 'switchTab':
        wx.switchTab({
          url: url,
          success: successCallback || defaultSuccess,
          fail: defaultFail
        });
        break;
      case 'redirectTo':
        wx.redirectTo({
          url: url,
          success: successCallback || defaultSuccess,
          fail: defaultFail
        });
        break;
      case 'reLaunch':
        wx.reLaunch({
          url: url,
          success: successCallback || defaultSuccess,
          fail: defaultFail
        });
        break;
      case 'navigateTo':
      default:
        wx.navigateTo({
          url: url,
          success: successCallback || defaultSuccess,
          fail: defaultFail
        });
        break;
    }
  },

  /**
   * 跳转到情绪历史页面
   */
  navigateToEmotionHistory: function () {
    this.navigate('/packageEmotion/pages/emotion-history/emotion-history');
  },

  /**
   * 跳转到关键词测试
   */
  navigateToKeywordTest: function () {
    this.navigate('/pages/keywordTest/keywordTest');
  },

  /**
   * 跳转到每日报告
   */
  navigateToDailyReport: function () {
    this.navigate('/packageEmotion/pages/daily-report/daily-report');
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

    console.log('跳转到聊天页面:', url);

    // 将角色ID和聊天ID存入全局变量，确保聊天页面可以获取到正确的角色ID
    app.globalData.chatParams = { roleId: roleId, chatId: chatId };

    // 尝试从最近对话中获取角色信息
    const chat = this.data.recentChats.find(item => item._id === chatId);
    if (chat) {
      // 如果找到了对应的聊天记录，将角色信息也存入全局变量
      app.globalData.chatParams.roleName = chat.roleName;
      app.globalData.chatParams.roleAvatar = chat.roleAvatar;
      console.log('存入全局变量的角色信息:', app.globalData.chatParams);
    }

    // 跳转到聊天页面
    this.navigate(url);
  },

  /**
   * 跳转到用户资料
   */
  navigateToProfile: function () {
    this.navigate('/pages/user/profile/profile');
  },

  /**
   * 处理角色信息
   * @param {Object} chat - 聊天记录对象
   * @param {Object} roleInfoMap - 角色信息映射表
   * @returns {Object} 处理后的角色信息
   */
  processRoleInfo: function(chat, roleInfoMap) {
    // 确保有roleId字段，兼容不同的字段名称，注意大小写
    const roleId = chat.roleId || chat.role_id;

    // 获取角色信息，兼容不同的字段名称，注意大小写
    let roleName = chat.roleName || chat.role_name;
    let roleAvatar = chat.roleAvatar || chat.role_avatar;

    // 如果有角色ID且角色信息映射表中有该角色，使用映射表中的角色信息
    if (roleId && roleInfoMap[roleId]) {
      const roleInfo = roleInfoMap[roleId];
      roleName = roleName || roleInfo.name || roleInfo.role_name;
      roleAvatar = roleAvatar || roleInfo.avatar || roleInfo.avatar_url;
    }

    // 如果还是没有角色名称，使用默认值
    if (!roleName) {
      roleName = '对话角色';
    }

    // 如果还是没有角色头像，使用默认值
    if (!roleAvatar) {
      roleAvatar = require('../../config/index').user.DEFAULT_AVATAR;
    }

    return { roleId, roleName, roleAvatar };
  },

  /**
   * 格式化聊天时间
   * @param {Object} chat - 聊天记录对象
   * @returns {string} 格式化后的时间文本
   */
  formatChatTime: function(chat) {
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

    return timeText;
  },

  /**
   * 获取角色信息映射表
   * @param {Array} chats - 聊天记录数组
   * @returns {Object} 角色信息映射表
   */
  fetchRoleInfoMap: async function(chats) {
    // 角色信息映射表
    let roleInfoMap = {};

    try {
      // 获取所有角色ID，用于批量查询角色信息
      // 注意大小写，兼容roleId和role_id两种形式
      const roleIds = chats.map(chat => chat.roleId || chat.role_id).filter(id => id);
      const uniqueRoleIds = [...new Set(roleIds)];

      console.log('提取的角色ID:', uniqueRoleIds);

      // 如果有角色ID，批量获取角色信息
      if (uniqueRoleIds.length > 0) {
        // 从roles集合获取角色信息
        const db = wx.cloud.database();
        const roleResult = await db.collection('roles')
          .where({
            _id: db.command.in(uniqueRoleIds)
          })
          .get();

        // 构建角色信息映射表
        roleResult.data.forEach(role => {
          roleInfoMap[role._id] = role;
        });

        console.log('获取到的角色信息:', roleInfoMap);
      }
    } catch (error) {
      console.error('获取角色信息失败:', error);
    }

    return roleInfoMap;
  }
});
