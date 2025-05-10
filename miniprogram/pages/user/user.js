// 获取应用实例
const app = getApp()
import { getLoginInfo, checkLogin } from '../../utils/auth'
import { updateActiveDay } from '../../utils/stats'
// 引入 echarts
const echarts = require('../../components/ec-canvas/echarts')
// 引入用户服务
const userService = require('../../services/userService')

// 是否为开发环境，控制日志输出
const isDev = true; // 设置为true可以开启详细日志

Page({
  // 页面的初始数据
  data: {
    loading: true,      // 加载状态
    userInfo: null,     // 用户信息
    showLogin: false,   // 是否显示登录弹窗
    needRefresh: false, // 是否需要刷新
    openId: '',         // 用户openId
    darkMode: false,    // 暗夜模式
    statusBarHeight: 20, // 状态栏高度
    navBarHeight: 44,    // 导航栏高度
    navTotalHeight: 64,  // 导航栏总高度

    // 用户统计数据
    stats: {
      chatCount: 0,     // 对话次数
      activeDay: 0,     // 活跃天数
      reportCount: 0,   // 心情报告数
    },

    // 情绪概览数据
    emotionData: require('../../config/index').user.DEFAULT_EMOTION_DATA,

    // 个性分析数据
    personalityData: require('../../config/index').user.DEFAULT_PERSONALITY_DATA,

    // 情绪饼图配置
    emotionPieEc: {
      lazyLoad: true
    },

    // 个性雷达图配置
    personalityRadarEc: {
      lazyLoad: true
    }
  },

  // 生命周期函数--监听页面加载
  onLoad() {
    // 获取系统信息，检测暗黑模式
    const systemInfo = wx.getSystemInfoSync();

    // 优先使用本地缓存中的 darkMode 设置
    const localDarkMode = wx.getStorageSync('darkMode');
    let darkMode;

    if (localDarkMode !== undefined && localDarkMode !== null) {
      // 确保 darkMode 是布尔值
      darkMode = typeof localDarkMode === 'boolean' ? localDarkMode : localDarkMode === 'true';
      if (isDev) {
        console.log('用户页面从本地缓存读取暗黑模式设置:', darkMode);
      }

      // 将布尔值存回缓存，确保类型一致
      wx.setStorageSync('darkMode', darkMode);
    } else {
      darkMode = systemInfo.theme === 'dark';
      if (isDev) {
        console.log('用户页面使用系统主题设置暗黑模式:', darkMode);
      }

      // 将系统主题设置存入缓存
      wx.setStorageSync('darkMode', darkMode);
    }

    // 获取胶囊按钮位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();

    // 计算导航栏高度，增加一点高度使其更美观
    const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + 10;

    // 计算导航栏总高度（状态栏 + 导航栏）
    const navTotalHeight = systemInfo.statusBarHeight + navBarHeight;

    // 将导航栏高度信息存入全局数据
    app.globalData.navHeight = navBarHeight;
    app.globalData.statusBarHeight = systemInfo.statusBarHeight;
    app.globalData.navTotalHeight = navTotalHeight;

    // 确保使用布尔值
    const finalDarkMode = typeof darkMode === 'boolean' ? darkMode : darkMode === 'true';

    this.setData({
      darkMode: finalDarkMode,
      statusBarHeight: systemInfo.statusBarHeight,
      navBarHeight: navBarHeight,
      navTotalHeight: navTotalHeight
    });

    this.checkLoginStatus()
  },

  // 生命周期函数--监听页面初次渲染完成
  onReady() {
    // 初始化图表
    setTimeout(() => {
      this.initEmotionPieChart()
      this.initPersonalityRadarChart()
    }, 300) // 稍微延迟初始化，确保组件已经渲染完成
  },

  // 生命周期函数--监听页面显示
  onShow() {
    if (isDev) {
      console.log('页面显示, needRefresh:', this.data.needRefresh);
    }

    // 检查暗夜模式变化
    const localDarkMode = wx.getStorageSync('darkMode');
    let shouldUpdateDarkMode = false;
    let newDarkMode = this.data.darkMode;

    if (localDarkMode !== undefined && localDarkMode !== null) {
      // 确保 localDarkMode 是布尔值
      const darkModeValue = typeof localDarkMode === 'boolean' ? localDarkMode : localDarkMode === 'true';

      // 如果有本地缓存设置，使用本地缓存设置
      shouldUpdateDarkMode = this.data.darkMode !== darkModeValue;
      if (shouldUpdateDarkMode) {
        if (isDev) {
          console.log('从本地缓存更新暗黑模式为:', darkModeValue);
        }
        newDarkMode = darkModeValue;

        // 将布尔值存回缓存，确保类型一致
        wx.setStorageSync('darkMode', darkModeValue);
      }
    } else if (this.data.darkMode !== app.globalData.darkMode) {
      // 如果没有本地缓存设置，使用全局状态
      shouldUpdateDarkMode = true;
      newDarkMode = app.globalData.darkMode;
      if (isDev) {
        console.log('从全局状态更新暗黑模式为:', newDarkMode);
      }
    }

    if (shouldUpdateDarkMode) {
      this.setData({
        darkMode: newDarkMode
      });

      // 更新TabBar样式
      if (app.updateTheme) {
        app.updateTheme(newDarkMode);
      }
    }

    // 检查是否需要刷新
    if (this.data.needRefresh) {
      if (isDev) {
        console.log('检测到需要刷新用户信息');
      }
      // 强制从服务器获取最新数据
      this.refreshUserInfo(true);
      this.setData({ needRefresh: false });
    } else {
      // 从内存刷新用户信息，确保显示最新数据
      this.refreshUserInfo(false);
    }

    // 更新用户活跃天数
    if (checkLogin()) {
      updateActiveDay().then(result => {
        if (result.success && result.data && result.data.stats) {
          // 更新统计数据
          const { userInfo } = this.data
          if (userInfo) {
            userInfo.stats = result.data.stats
            this.setData({
              userInfo,
              stats: {
                chatCount: result.data.stats.chat_count || 0,
                activeDay: result.data.stats.active_days || 0,
                reportCount: result.data.stats.daily_report_count || 0
              }
            })
          }
        }
      })

      // 获取用户总消息数
      this.getTotalMessageCount()

      // 获取用户心情报告数量
      this.getReportCount()

      // 获取用户情绪数据
      this.loadEmotionData()

      // 获取用户个性分析数据
      this.loadPersonalityData()

      // 获取用户兴趣标签
      this.loadInterestTags()
    }
  },

  /**
   * 获取用户总消息数
   */
  async getTotalMessageCount() {
    try {
      if (isDev) {
        console.log('开始获取用户总消息数...');
      }

      // 获取用户ID
      const userInfo = this.data.userInfo;
      if (!userInfo) {
        console.error('未获取到用户信息，无法获取总消息数');
        return;
      }

      // 使用userService获取用户ID和openId
      const { userId, openid: openId } = userService.getUserIdentifiers(userInfo);

      // 获取用户ID信息已足够，不需要额外的statsId

      // 直接从本地获取聊天记录数量
      await this.getLocalChatCount();

      // 调用云函数获取总消息数并更新数据库
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getTotalMessageCount',
          userId: openId || userId // 优先使用openId
        }
      });

      if (result.result && result.result.success) {
        const totalMessageCount = result.result.totalMessageCount || 0;

        // 如果云函数返回的总消息数大于0，更新页面数据
        if (totalMessageCount > 0) {
          // 更新页面数据
          this.setData({
            'stats.chatCount': totalMessageCount
          });

          // 更新用户信息中的统计数据
          if (userInfo.stats) {
            userInfo.stats.chat_count = totalMessageCount;
            this.setData({ userInfo });
          }
        }
      }
    } catch (error) {
      console.error('获取用户总消息数失败:', error);
    }
  },

  /**
   * 获取用户心情报告数量
   */
  async getReportCount() {
    try {
      if (isDev) {
        console.log('开始获取用户心情报告数量...');
      }

      // 获取用户ID
      const userInfo = this.data.userInfo;
      if (!userInfo) {
        console.error('未获取到用户信息，无法获取心情报告数量');
        return;
      }

      // 使用userService获取用户ID和openId
      const { userId, openid: openId } = userService.getUserIdentifiers(userInfo);

      // 调用云函数获取心情报告数量
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getReportCount',
          userId: openId || userId // 优先使用openId
        }
      });

      if (result.result && result.result.success) {
        const reportCount = result.result.reportCount || 0;

        // 更新页面数据
        this.setData({
          'stats.reportCount': reportCount
        });

        // 更新用户信息中的统计数据
        if (userInfo.stats) {
          userInfo.stats.daily_report_count = reportCount;
          this.setData({ userInfo });
        }
      }
    } catch (error) {
      console.error('获取用户心情报告数量失败:', error);
    }
  },

  /**
   * 从本地获取聊天记录数量
   */
  async getLocalChatCount() {
    try {
      if (isDev) {
        console.log('开始从本地获取聊天记录数量...');
      }

      // 获取用户ID
      const userInfo = this.data.userInfo;
      if (!userInfo) {
        console.error('未获取到用户信息，无法获取本地聊天记录');
        return;
      }

      // 使用userService获取openId
      const { openid: openId } = userService.getUserIdentifiers(userInfo);

      if (!openId) {
        console.error('未获取到用户openId，无法获取本地聊天记录');
        return;
      }

      // 直接从数据库获取聊天记录
      const db = wx.cloud.database();
      const _ = db.command;

      // 构建查询条件，考虑多种可能的字段名
      const query = _.or([
        { openId: openId },
        { openid: openId },
        { userId: openId },
        { userid: openId },
        { user_id: openId }
      ]);

      // 查询该用户的所有聊天记录
      const chatsResult = await db.collection('chats')
        .where(query)
        .get();

      if (chatsResult.data && chatsResult.data.length > 0) {
        // 计算总消息数
        let totalMessageCount = 0;
        chatsResult.data.forEach(chat => {
          if (chat.messageCount && typeof chat.messageCount === 'number') {
            totalMessageCount += chat.messageCount;
          } else if (chat.messages && Array.isArray(chat.messages)) {
            // 如果没有messageCount字段，但有messages数组，使用数组长度
            totalMessageCount += chat.messages.length;
          }
        });

        // 更新页面数据
        this.setData({
          'stats.chatCount': totalMessageCount
        });

        // 更新用户信息中的统计数据
        if (userInfo.stats) {
          userInfo.stats.chat_count = totalMessageCount;
          this.setData({ userInfo });

          // 尝试直接更新数据库中的user_stats表
          try {
            if (userInfo.stats._id) {
              await db.collection('user_stats').doc(userInfo.stats._id).update({
                data: {
                  chat_count: totalMessageCount,
                  updated_at: db.serverDate()
                }
              });
            }
          } catch (updateErr) {
            console.error('直接更新user_stats表失败:', updateErr);
          }
        }

        // 如果找到了聊天记录，但总消息数为0，可能是messageCount字段不存在
        if (totalMessageCount === 0) {
          // 使用聊天记录的数量作为总消息数
          const chatCount = chatsResult.data.length;

          // 更新页面数据
          this.setData({
            'stats.chatCount': chatCount
          });

          // 更新用户信息中的统计数据
          if (userInfo.stats) {
            userInfo.stats.chat_count = chatCount;
            this.setData({ userInfo });
          }
        }
      } else {
        // 如果没有找到聊天记录，但用户信息中有chat_count，使用它
        if (userInfo.stats && userInfo.stats.chat_count) {
          const chatCount = userInfo.stats.chat_count;

          // 更新页面数据
          this.setData({
            'stats.chatCount': chatCount
          });
        } else {
          // 如果什么都没有，设置为0
          this.setData({
            'stats.chatCount': 0
          });
        }
      }
    } catch (error) {
      console.error('获取本地聊天记录失败:', error);
    }
  },

  // 加载情绪数据
  async loadEmotionData() {
    try {
      if (isDev) {
        console.log('开始加载情绪概览数据...');
      }

      // 获取用户ID
      const userInfo = wx.getStorageSync('userInfo');
      const { userId, openid: openId } = userService.getUserIdentifiers(userInfo, true);

      if (!openId && !userId) {
        console.error('未获取到用户ID，无法获取情绪数据');
        return null;
      }

      // 使用openId作为userId
      const userIdentifier = openId || userId;

      // 使用emotionService获取一周内的情绪记录
      const emotionService = require('../../services/emotionService');
      const records = await emotionService.getEmotionHistory(userIdentifier, null, 20);

      if (!records || records.length === 0) {
        console.warn('未找到情绪记录，无法生成情绪概览数据');
        return null;
      }

      // 统计不同情绪类型的数量
      const emotionCounts = {};

      records.forEach(record => {
        // 获取情绪类型
        let emotionType = record.analysis?.primary_emotion || record.analysis?.type || 'neutral';
        let emotionLabel = '';

        // 尝试获取中文情绪类型
        if (record.analysis?.primary_emotion_cn) {
          emotionLabel = record.analysis.primary_emotion_cn;
        } else if (record.analysis?.type && typeof record.analysis.type === 'string' && /[\u4e00-\u9fa5]/.test(record.analysis.type)) {
          emotionLabel = record.analysis.type;
        } else {
          emotionLabel = emotionService.EmotionTypeLabels[emotionType] || '未知情绪';
        }

        // 统计数量
        emotionCounts[emotionLabel] = (emotionCounts[emotionLabel] || 0) + 1;
      });

      // 将统计结果转换为饼图数据格式
      const labels = [];
      const values = [];
      const colors = [];
      const emotionColors = emotionService.EmotionTypeColors;

      for (const [emotion, count] of Object.entries(emotionCounts)) {
        labels.push(emotion);
        values.push(count);
        colors.push(emotionColors[emotion] || '#95A5A6'); // 默认使用灰色
      }

      const emotionData = {
        labels,
        values,
        colors
      };

      // 更新数据
      this.setData({ emotionData });

      // 在非下拉刷新时更新情绪饼图
      if (!this._isRefreshing && this.emotionPieChart) {
        try {
          const option = this.getEmotionPieOption(emotionData);
          this.emotionPieChart.setOption(option);
        } catch (chartError) {
          console.error('更新情绪饼图失败:', chartError);
          // 如果更新失败，尝试重新初始化
          this.emotionPieChart = null;
          setTimeout(() => this.initEmotionPieChart(), 300);
        }
      }

      return emotionData;
    } catch (error) {
      console.error('获取情绪数据失败:', error);
      throw error;
    }
  },

  // 加载个性分析数据
  async loadPersonalityData() {
    try {
      if (isDev) {
        console.log('开始加载个性分析数据...');
      }

      // 默认个性数据，当云函数调用失败时使用
      const defaultPersonalityData = {
        labels: ['创造力', '责任感', '同理心', '社交性', '耐心'],
        values: [65, 80, 70, 50, 60],
        summary: '你是一个具有较强责任感和同理心的人，在创造力和耐心方面也有不错的表现。你善于理解他人的情感，并且能够认真完成自己的任务。'
      };

      // 获取用户ID
      const userInfo = wx.getStorageSync('userInfo');
      const { userId, openid: openId } = userService.getUserIdentifiers(userInfo, true);

      if (!openId && !userId) {
        console.error('未获取到用户ID，无法获取个性分析数据');
        // 使用默认数据
        this.setData({ personalityData: defaultPersonalityData });
        return defaultPersonalityData;
      }

      // 使用openId作为userId
      const userIdentifier = openId || userId;

      // 调用云函数获取个性分析数据
      try {
        const result = await wx.cloud.callFunction({
          name: 'user',
          data: {
            action: 'getUserPerception',
            userId: userIdentifier
          }
        });

        if (result.result && result.result.success && result.result.data) {
          const perceptionData = result.result.data;

          // 处理数据用于雷达图显示
          if (perceptionData.personalityTraits && perceptionData.personalityTraits.length > 0) {
            const personalityData = {
              labels: perceptionData.personalityTraits.map(item => item.trait),
              values: perceptionData.personalityTraits.map(item => Math.round(item.score * 100)),
              summary: perceptionData.personalitySummary || ''
            };

            // 更新数据
            this.setData({ personalityData });

            // 在非下拉刷新时更新个性雷达图
            if (!this._isRefreshing && this.personalityRadarChart) {
              try {
                const option = this.getPersonalityRadarOption(personalityData);
                this.personalityRadarChart.setOption(option);
              } catch (chartError) {
                console.error('更新个性雷达图失败:', chartError);
                // 如果更新失败，尝试重新初始化
                this.personalityRadarChart = null;
                setTimeout(() => this.initPersonalityRadarChart(), 300);
              }
            }

            return personalityData;
          } else {
            if (isDev) {
              console.warn('个性特征数据为空，使用默认数据');
            }
            this.setData({ personalityData: defaultPersonalityData });
            return defaultPersonalityData;
          }
        } else {
          if (isDev) {
            console.warn('云函数返回的个性分析数据无效');
          }
          this.setData({ personalityData: defaultPersonalityData });
          return defaultPersonalityData;
        }
      } catch (cloudError) {
        console.error('调用云函数失败:', cloudError);
        this.setData({ personalityData: defaultPersonalityData });
        return defaultPersonalityData;
      }
    } catch (error) {
      console.error('获取个性分析数据失败:', error);
      // 使用默认数据
      const defaultPersonalityData = {
        labels: ['创造力', '责任感', '同理心', '社交性', '耐心'],
        values: [65, 80, 70, 50, 60],
        summary: '你是一个具有较强责任感和同理心的人，在创造力和耐心方面也有不错的表现。你善于理解他人的情感，并且能够认真完成自己的任务。'
      };
      this.setData({ personalityData: defaultPersonalityData });
      return defaultPersonalityData;
    }
  },

  // 刷新用户信息
  async refreshUserInfo(forceRefresh = false) {
    try {
      if (isDev) {
        console.log('开始刷新用户信息, 强制刷新:', forceRefresh);
      }

      // 首先从全局状态获取用户信息
      const globalUserInfo = app.globalData.userInfo;

      // 从本地存储获取用户信息
      const { userInfo: localUserInfo } = getLoginInfo();

      // 如果是强制刷新，则从服务器获取最新数据
      if (forceRefresh) {
        this.setData({ loading: true });

        // 获取当前登录信息
        const loginInfo = getLoginInfo();
        if (!loginInfo || !loginInfo.userInfo || !loginInfo.userInfo.userId) {
          throw new Error('用户未登录或登录信息不完整');
        }

        try {
          // 使用云函数获取最新用户信息
          const result = await wx.cloud.callFunction({
            name: 'user',
            data: {
              action: 'getInfo',
              userId: loginInfo.userInfo.userId
            }
          });

          if (result.result && result.result.success) {
            // 更新用户信息
            const updatedUserInfo = {
              ...loginInfo.userInfo,
              ...result.result.data.user
            };

            // 更新全局状态
            app.globalData.userInfo = updatedUserInfo;

            // 更新本地存储
            wx.setStorageSync('loginInfo', {
              ...loginInfo,
              userInfo: updatedUserInfo
            });

            // 更新页面数据
            this.setData({
              userInfo: updatedUserInfo,
              loading: false,
              stats: {
                chatCount: updatedUserInfo.stats?.chat_count || 0,
                activeDay: updatedUserInfo.stats?.active_days || 0,
                reportCount: updatedUserInfo.stats?.daily_report_count || 0
              }
            });

            // 获取用户总消息数
            setTimeout(() => {
              this.getTotalMessageCount();
            }, 500);

            return;
          }
        } catch (cloudError) {
          console.error('云函数获取用户信息失败:', cloudError);
          // 如果云函数失败，则回退到使用数据库直接查询
        }

        // 如果云函数失败，则使用数据库直接查询
        const db = wx.cloud.database();
        const userBaseResult = await db.collection('user_base')
          .where({ user_id: loginInfo.userInfo.userId })
          .get();

        if (userBaseResult.data && userBaseResult.data.length > 0) {
          // 获取用户统计信息
          const userStatsResult = await db.collection('user_stats')
            .where({ user_id: loginInfo.userInfo.userId })
            .get();

          // 更新用户信息
          const updatedUserInfo = {
            ...loginInfo.userInfo,
            username: userBaseResult.data[0].username,
            avatarUrl: userBaseResult.data[0].avatar_url,
            stats: userStatsResult.data[0] || loginInfo.userInfo.stats
          };

          // 更新全局状态
          app.globalData.userInfo = updatedUserInfo;

          // 更新本地存储
          wx.setStorageSync('loginInfo', {
            ...loginInfo,
            userInfo: updatedUserInfo
          });

          // 更新页面数据
          this.setData({
            userInfo: updatedUserInfo,
            loading: false,
            stats: {
              chatCount: updatedUserInfo.stats?.chat_count || 0,
              activeDay: updatedUserInfo.stats?.active_days || 0,
              reportCount: updatedUserInfo.stats?.daily_report_count || 0
            }
          });

          // 获取用户总消息数和心情报告数量
          setTimeout(() => {
            this.getTotalMessageCount();
            this.getReportCount();
          }, 500);

          return;
        }
      }

      // 如果不是强制刷新或强制刷新失败，则使用全局状态或本地存储
      // 优先使用全局状态，因为它可能是最新的
      const userInfo = globalUserInfo || localUserInfo;

      if (userInfo) {
        this.setData({
          userInfo,
          loading: false,
          stats: {
            chatCount: userInfo.stats?.chat_count || 0,
            activeDay: userInfo.stats?.active_days || 0,
            reportCount: userInfo.stats?.daily_report_count || 0
          }
        });

        // 获取用户总消息数和心情报告数量
        setTimeout(() => {
          this.getTotalMessageCount();
          this.getReportCount();
        }, 500);
      } else {
        throw new Error('无法获取用户信息');
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      this.setData({ loading: false });

      // 显示错误提示
      wx.showToast({
        title: '刷新失败',
        icon: 'error'
      });
    }
  },

  // 检查登录状态
  async checkLoginStatus() {
    try {
      const { userInfo } = getLoginInfo()

      if (checkLogin()) {
        // 获取用户openId
        const openId = wx.getStorageSync('openId') || (userInfo && userInfo.stats && userInfo.stats.openid);

        this.setData({
          userInfo,
          openId,
          loading: false,
          stats: {
            chatCount: userInfo.stats?.chat_count || 0,
            activeDay: userInfo.stats?.active_days || 0,
            reportCount: userInfo.stats?.daily_report_count || 0
          }
        })

        // 获取用户总消息数和心情报告数量
        setTimeout(() => {
          this.getTotalMessageCount();
          this.getReportCount();
        }, 500);
      } else {
        this.setData({
          loading: false,
          showLogin: true
        })
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: '系统错误',
        icon: 'error'
      })
    }
  },

  // 处理登录弹窗关闭
  handleLoginClose() {
    // 如果已经登录成功，则隐藏登录弹窗
    if (app.globalData.isLoggedIn && app.globalData.userInfo) {
      this.setData({
        showLogin: false,
        userInfo: app.globalData.userInfo
      });
    } else {
      // 如果未登录，也隐藏登录弹窗
      this.setData({
        showLogin: false
      });
    }
  },

  // 处理退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 使用全局的logout方法
          if (app.logout()) {
            this.setData({
              userInfo: null
            })
            wx.showToast({
              title: '已退出登录',
              icon: 'success'
            })
          } else {
            wx.showToast({
              title: '退出失败',
              icon: 'error'
            })
          }
        }
      }
    })
  },

  // 页面相关事件处理函数--监听用户下拉动作
  async onPullDownRefresh() {
    console.log('用户下拉刷新')

    // 设置刷新标志，避免重复初始化图表
    this._isRefreshing = true

    // 显示刷新提示
    wx.showLoading({
      title: '正在刷新...',
      mask: true
    })

    try {
      // 强制刷新用户信息
      await this.refreshUserInfo(true)

      // 重置图表实例
      this.emotionPieChart = null
      this.personalityRadarChart = null

      // 刷新情绪概览、个性分析、兴趣标签数据、总消息数和心情报告数量
      // 使用Promise.allSettled而不是Promise.all，确保即使一个请求失败也不会影响其他请求
      const results = await Promise.allSettled([
        this.loadEmotionData(),
        this.loadPersonalityData(),
        this.loadInterestTags(true),
        this.getTotalMessageCount(),
        this.getReportCount()
      ])

      // 检查结果
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const dataTypes = ['情绪数据', '个性数据', '兴趣标签', '总消息数', '心情报告数量'];
          console.error(`数据加载失败 (${dataTypes[index]})`, result.reason)
        }
      })

      console.log('所有数据刷新完成')

      // 延迟重新初始化图表，确保数据已经准备好
      setTimeout(() => {
        try {
          // 重新初始化图表
          this.initEmotionPieChart()
          this.initPersonalityRadarChart()

          console.log('图表重新初始化完成')
        } catch (chartError) {
          console.error('图表初始化失败:', chartError)
        } finally {
          // 重置刷新标志
          this._isRefreshing = false
        }
      }, 800) // 增加延迟时间，确保数据已经完全准备好

      // 显示成功提示
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      })
    } catch (error) {
      console.error('刷新数据失败:', error)
      wx.showToast({
        title: '刷新失败',
        icon: 'error',
        duration: 1500
      })
    } finally {
      // 隐藏加载提示
      wx.hideLoading()

      // 停止下拉刷新动画
      wx.stopPullDownRefresh()
    }
  },

  // 处理登录成功
  handleLoginSuccess(e) {
    // 直接使用全局用户信息更新页面
    const userInfo = app.globalData.userInfo;

    if (userInfo) {
      // 获取用户openId
      const openId = wx.getStorageSync('openId') || (userInfo && userInfo.stats && userInfo.stats.openid);

      this.setData({
        userInfo,
        openId,
        loading: false,
        showLogin: false,
        stats: {
          chatCount: userInfo.stats?.chat_count || 0,
          activeDay: userInfo.stats?.active_days || 0,
          reportCount: userInfo.stats?.daily_report_count || 0
        }
      });

      // 获取用户总消息数和心情报告数量
      setTimeout(() => {
        this.getTotalMessageCount();
        this.getReportCount();
        // 加载用户兴趣标签
        this.loadInterestTags();
      }, 500);
    } else {
      // 如果全局用户信息不可用，则使用事件中的用户信息
      const { userInfo } = e.detail;
      if (userInfo) {
        // 获取用户openId
        const openId = wx.getStorageSync('openId') || (userInfo && userInfo.stats && userInfo.stats.openid);

        this.setData({
          userInfo,
          openId,
          loading: false,
          showLogin: false,
          stats: {
            chatCount: userInfo.stats?.chat_count || 0,
            activeDay: userInfo.stats?.active_days || 0,
            reportCount: userInfo.stats?.daily_report_count || 0
          }
        });

        // 获取用户总消息数和心情报告数量
        setTimeout(() => {
          this.getTotalMessageCount();
          this.getReportCount();
          // 加载用户兴趣标签
          this.loadInterestTags();
        }, 500);
      }
    }
  },

  // 导航到个人信息页面
  navigateToProfile() {
    wx.navigateTo({
      url: '/pages/user/profile/profile'
    })
  },

  // 导航到情绪历史页面
  navigateToEmotionHistory() {
    wx.navigateTo({
      url: '/packageEmotion/pages/emotion-history/emotion-history'
    })
  },

  // 导航到角色管理页面
  navigateToRoleManagement() {
    wx.navigateTo({
      url: '/pages/role-select/role-select'
    })
  },

  // 导航到设置页面
  navigateToSettings() {
    // 由于设置页面还没有实现，暂时导航到个人资料页面
    wx.navigateTo({
      url: '/pages/user/profile/profile'
    })
  },

  // 初始化情绪饼图
  initEmotionPieChart() {
    try {
      this.ecComponent = this.selectComponent('#emotionPieChart')
      if (!this.ecComponent) {
        console.error('无法获取情绪饼图组件实例')
        // 延迟重试
        setTimeout(() => this.initEmotionPieChart(), 300)
        return
      }

      this.ecComponent.init((canvas, width, height, dpr) => {
        try {
          // 初始化 echarts 实例
          const chart = echarts.init(canvas, null, {
            width: width,
            height: height,
            devicePixelRatio: dpr
          })

          // 获取饼图配置
          const option = this.getEmotionPieOption(this.data.emotionData)

          // 使用配置项设置图表
          chart.setOption(option)

          // 保存图表实例
          this.emotionPieChart = chart

          // 添加图表点击事件
          chart.on('click', (params) => {
            console.log('情绪饼图点击事件:', params)
          })

          // 返回图表实例
          return chart
        } catch (error) {
          console.error('初始化情绪饼图失败:', error)
          return null
        }
      })
    } catch (error) {
      console.error('初始化情绪饼图组件失败:', error)
    }
  },

  // 初始化个性雷达图
  initPersonalityRadarChart() {
    try {
      this.radarComponent = this.selectComponent('#personalityRadarChart')
      if (!this.radarComponent) {
        console.error('无法获取个性雷达图组件实例')
        // 延迟重试
        setTimeout(() => this.initPersonalityRadarChart(), 300)
        return
      }

      this.radarComponent.init((canvas, width, height, dpr) => {
        try {
          // 初始化 echarts 实例
          const chart = echarts.init(canvas, null, {
            width: width,
            height: height,
            devicePixelRatio: dpr
          })

          // 获取雷达图配置
          const option = this.getPersonalityRadarOption(this.data.personalityData)

          // 使用配置项设置图表
          chart.setOption(option)

          // 保存图表实例
          this.personalityRadarChart = chart

          // 添加图表点击事件
          chart.on('click', (params) => {
            console.log('个性雷达图点击事件:', params)
          })

          // 返回图表实例
          return chart
        } catch (error) {
          console.error('初始化个性雷达图失败:', error)
          return null
        }
      })
    } catch (error) {
      console.error('初始化个性雷达图组件失败:', error)
    }
  },

  // 获取情绪饼图配置
  getEmotionPieOption(emotionData) {
    // 防止空数据或异常数据
    if (!emotionData || !emotionData.labels || !emotionData.values || !emotionData.colors) {
      console.warn('情绪数据不完整，使用默认数据')
      emotionData = {
        labels: ['未知情绪'],
        values: [1],
        colors: ['#95A5A6']
      }
    }

    // 根据暗夜模式调整文字颜色
    const textColor = this.data.darkMode ? '#e2e8f0' : '#333333';

    // 准备饼图数据
    const pieData = emotionData.labels.map((label, index) => ({
      name: label,
      value: emotionData.values[index] || 0, // 防止值为空
      itemStyle: {
        color: emotionData.colors[index] || '#95A5A6' // 默认使用灰色
      }
    }))

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        textStyle: {
          color: textColor
        }
      },
      series: [{
        name: '情绪分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: this.data.darkMode ? '#2d3748' : '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center',
          color: textColor
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold',
            color: textColor
          }
        },
        labelLine: {
          show: false
        },
        data: pieData
      }]
    }
  },

  // 获取个性雷达图配置
  getPersonalityRadarOption(personalityData) {
    // 防止空数据或异常数据
    if (!personalityData || !personalityData.labels || !personalityData.values) {
      console.warn('个性数据不完整，使用默认数据')
      personalityData = {
        labels: ['创造力', '责任感', '同理心', '社交性', '耐心'],
        values: [50, 50, 50, 50, 50],
        summary: '暂无个性分析数据'
      }
    }

    // 根据暗夜模式调整颜色
    const textColor = this.data.darkMode ? '#e2e8f0' : '#333333';
    const axisLineColor = this.data.darkMode ? '#4a5568' : '#ddd';
    const splitLineColors = this.data.darkMode ?
      ['#4a5568', '#3d4654', '#343a40', '#2d3748'] :
      ['#ddd', '#ccc', '#bbb', '#aaa'];

    // 准备雷达图指示器
    const indicators = personalityData.labels.map(label => ({
      name: label,
      max: 100
    }))

    return {
      tooltip: {
        trigger: 'item',
        textStyle: {
          color: textColor
        }
      },
      radar: {
        indicator: indicators,
        radius: '65%',
        splitNumber: 4,
        axisName: {
          color: this.data.darkMode ? '#a0aec0' : '#999',
          fontSize: 10
        },
        splitLine: {
          lineStyle: {
            color: splitLineColors
          }
        },
        splitArea: {
          show: false
        },
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        }
      },
      series: [{
        name: '个性特质',
        type: 'radar',
        data: [{
          value: personalityData.values,
          name: '个性特质',
          areaStyle: {
            color: this.data.darkMode ? 'rgba(77, 171, 247, 0.2)' : 'rgba(94, 114, 228, 0.3)'
          },
          lineStyle: {
            color: this.data.darkMode ? '#4dabf7' : '#5e72e4'
          },
          itemStyle: {
            color: this.data.darkMode ? '#4dabf7' : '#5e72e4'
          }
        }]
      }]
    }
  },

  /**
   * 加载用户兴趣标签
   * @param {boolean} forceRefresh 是否强制刷新
   */
  async loadInterestTags(forceRefresh = false) {
    try {
      if (isDev) {
        console.log('开始加载用户兴趣标签...');
      }

      // 获取用户ID
      const openId = wx.getStorageSync('openId') || (this.data.userInfo && this.data.userInfo.stats && this.data.userInfo.stats.openid);

      if (!openId) {
        console.error('未获取到用户ID，无法加载兴趣标签');
        return;
      }

      // 更新openId到页面数据
      this.setData({ openId });

      // 获取兴趣标签云组件
      const tagCloud = this.selectComponent('#interestTagCloud');
      if (!tagCloud) {
        console.error('无法获取兴趣标签云组件实例');
        return;
      }

      // 加载标签
      tagCloud.loadTags(forceRefresh);

      return true;
    } catch (error) {
      console.error('加载用户兴趣标签失败:', error);
      return false;
    }
  },

  /**
   * 刷新兴趣标签
   */
  refreshInterestTags() {
    this.loadInterestTags(true);

    wx.showToast({
      title: '正在刷新标签',
      icon: 'loading',
      duration: 1000
    });
  },

  /**
   * 处理标签点击事件
   * @param {Object} e 事件对象
   */
  handleTagClick(e) {
    const { tag } = e.detail;
    if (isDev) {
      console.log('点击了标签:', tag);
    }

    // 显示标签详情
    wx.showModal({
      title: '兴趣标签',
      content: `标签: ${tag.name}\n分类: ${tag.category || '未分类'}\n权重: ${tag.value}%`,
      showCancel: false
    });
  },

  /**
   * 处理标签加载完成事件
   * @param {Object} e 事件对象
   */
  handleTagsLoaded(e) {
    const { tags } = e.detail;
    if (isDev) {
      console.log('兴趣标签加载完成, 数量:', tags.length);
    }
  },

  /**
   * 处理标签加载错误事件
   * @param {Object} e 事件对象
   */
  handleTagsError(e) {
    const { error } = e.detail;
    console.error('兴趣标签加载错误:', error);

    wx.showToast({
      title: '标签加载失败',
      icon: 'error',
      duration: 1500
    });
  }
})

