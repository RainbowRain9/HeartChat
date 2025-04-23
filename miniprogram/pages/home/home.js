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

    // 优先使用userId，其次是_id，最后是openid
    const userId = userInfo.userId || userInfo.user_id || userInfo._id || userInfo.openid;

    // 从用户信息中获取openid，先检查顶层，再检查stats对象
    let openid = userInfo.openid;
    if (!openid && userInfo.stats && userInfo.stats.openid) {
      openid = userInfo.stats.openid;
    }

    // 如果还是没有，尝试从本地缓存中获取
    if (!openid) {
      try {
        const cachedOpenid = wx.getStorageSync('openid');
        if (cachedOpenid) {
          openid = cachedOpenid;
        }
      } catch (e) {
        console.error('从缓存获取openid失败:', e);
      }
    }

    if (!userId && !openid) {
      console.log('无法获取用户ID或openid，用户信息：', userInfo);
      this.setData({ loading: false });
      return;
    }

    console.log('使用用户ID加载最近对话：', userId, '，openid:', openid);

    // 直接从数据库查询最近对话
    const db = wx.cloud.database();

    // 构建查询条件，确保只查询当前用户的聊天记录
    // 直接使用简单的查询条件，不使用复杂的组合查询
    let query = {};

    // 优先使用openid查询，因为这是最可靠的标识
    if (openid) {
      console.log('使用openid查询聊天记录:', openid);
      query = { openId: openid };
    }
    // 如果没有openid，则使用userId
    else if (userId) {
      console.log('使用userId查询聊天记录:', userId);
      query = { userId: userId };
    }

    console.log('最终查询条件:', query);

    // 直接获取所有聊天记录，不使用查询条件，然后在前端过滤
    // 这是一种应急方案，可以确保能看到所有聊天记录
    db.collection('chats')
      .orderBy('last_message_time', 'desc')
      .limit(10) // 增加限制数量，确保能获取到足够的记录
      .get()
      .then(async res => {
        let chats = res.data || [];
        console.log('获取到的原始聊天数据:', chats);

        // 在前端过滤当前用户的聊天记录
        if (openid) {
          chats = chats.filter(chat => chat.openId === openid);
          console.log('根据openId过滤后的聊天数据:', chats);
        } else if (userId) {
          chats = chats.filter(chat => chat.userId === userId || chat.user_id === userId);
          console.log('根据userId过滤后的聊天数据:', chats);
        }

        // 如果没有数据，直接返回
        if (chats.length === 0) {
          this.setData({
            recentChats: [],
            loading: false
          });
          return;
        }

        // 获取所有角色ID，用于批量查询角色信息
        // 注意大小写，兼容roleId和role_id两种形式
        const roleIds = chats.map(chat => chat.roleId || chat.role_id).filter(id => id);
        const uniqueRoleIds = [...new Set(roleIds)];

        console.log('提取的角色ID:', uniqueRoleIds);

        // 角色信息映射表
        let roleInfoMap = {};

        // 如果有角色ID，批量获取角色信息
        if (uniqueRoleIds.length > 0) {
          try {
            // 从roles集合获取角色信息
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
          } catch (error) {
            console.error('获取角色信息失败:', error);
          }
        }

        // 处理时间显示和角色信息
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
            roleAvatar = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';
          }

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
      wx.navigateTo({
        url: '/packageChat/pages/emotion-analysis/emotion-analysis?useCache=true',
        fail: (err) => {
          console.error('跳转失败:', err);
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
        }
      });

      // 同时在后台查询最新数据，以便刷新缓存
      this.queryLatestEmotionDataInBackground();
      return;
    }

    // 如果没有缓存数据，则查询最近的聊天记录
    console.log('没有缓存的情绪分析结果，查询最近的聊天记录');

    // 优先使用userId，其次是_id，最后是openid
    const userId = userInfo.userId || userInfo.user_id || userInfo._id || userInfo.openid;

    // 从用户信息中获取openid，先检查顶层，再检查stats对象
    let openid = userInfo.openid;
    if (!openid && userInfo.stats && userInfo.stats.openid) {
      openid = userInfo.stats.openid;
    }

    // 如果还是没有，尝试从本地缓存中获取
    if (!openid) {
      try {
        const cachedOpenid = wx.getStorageSync('openid');
        if (cachedOpenid) {
          openid = cachedOpenid;
        }
      } catch (e) {
        console.error('从缓存获取openid失败:', e);
      }
    }

    if (!userId && !openid) {
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
    let query = {};

    // 优先使用openid查询
    if (openid) {
      query = { openId: openid };
    }
    // 如果没有openid，则使用userId
    else if (userId) {
      query = { userId: userId };
    }

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
          wx.navigateTo({
            url: `/packageChat/pages/emotion-analysis/emotion-analysis?chatId=${chatId}&roleId=${roleId}`,
            fail: (err) => {
              console.error('跳转失败:', err);
              wx.showToast({
                title: '跳转失败',
                icon: 'none'
              });
            }
          });
        } else {
          // 如果没有聊天记录，直接跳转到情绪分析页面
          wx.navigateTo({
            url: '/packageChat/pages/emotion-analysis/emotion-analysis'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('获取最近聊天失败:', err);
        // 出错时也直接跳转到情绪分析页面
        wx.navigateTo({
          url: '/packageChat/pages/emotion-analysis/emotion-analysis'
        });
      });
  },

  /**
   * 在后台查询最新的情绪数据，用于更新缓存
   */
  queryLatestEmotionDataInBackground: function() {
    const userInfo = app.globalData.userInfo;
    if (!userInfo) return;

    const userId = userInfo.userId || userInfo.user_id || userInfo._id || userInfo.openid;
    let openid = userInfo.openid;
    if (!openid && userInfo.stats && userInfo.stats.openid) {
      openid = userInfo.stats.openid;
    }

    if (!userId && !openid) return;

    const db = wx.cloud.database();
    let query = openid ? { openId: openid } : { userId: userId };

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
      url: '/pages/user/profile/profile'
    });
  }
});
