// pages/emotionVault/emotionVault.js

/**
 * emotionVault.js - 情感仓库页面
 *
 * 功能说明:
 * 1. 用户登录和身份验证
 * 2. 角色管理(选择、切换、使用统计)
 * 3. 聊天对话(历史记录、消息发送接收)
 * 4. 情感分析(实时分析、数据可视化)
 * 5. 数据存储(云数据库、本地缓存)
 */

const app = getApp();
const { updateChatCount } = require('../../utils/stats');
const { EmotionTypeLabels, EmotionTypeColors } = require('../../models/emotion');
const emotionService = require('../../services/emotionService');

// 数据库操作封装
const dbHelper = {
  // 初始化数据库集合
  async initCollections() {
    try {
      const db = wx.cloud.database();
      const collections = ['chats', 'roleUsage'];

      for (const name of collections) {
        try {
          await db.createCollection(name);
          console.log(`创建${name}集合成功`);
        } catch (error) {
          if (error.errCode !== -501001) { // 忽略"集合已存在"错误
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('初始化集合失败:', error);
      throw error;
    }
  },

  // 保存聊天记录
  async saveChat(roleId, roleName, messages, emotionAnalysis, userInfo) {
    try {
      const db = wx.cloud.database();
      return await db.collection('chats').add({
        data: {
          roleId,
          role_name: roleName,
          messages,
          emotionAnalysis,
          createTime: db.serverDate(),
          userInfo: {
            userId: userInfo.userId,
            nickName: userInfo.nickName
          }
        }
      });
    } catch (err) {
      console.error('保存聊天记录失败:', err);
      if (err.errCode === -502005) {
        await this.initCollections();
      }
      throw err;
    }
  },

  // 获取角色使用统计
  async getRoleUsageStats(roleIds, userId) {
    try {
      console.log('开始获取角色使用统计，基于历史消息数量...');
      const stats = {};

      // 初始化所有角色的使用次数为0
      roleIds.forEach(roleId => {
        stats[roleId] = 0;
      });

      try {
        // 使用云函数获取每个角色的历史消息数量
        console.log('调用云函数获取历史消息统计...');
        const { result } = await wx.cloud.callFunction({
          name: 'role',
          data: {
            action: 'getMessageStats',
            roleIds: roleIds,
            userId: userId
          }
        });

        if (result && result.success && result.stats) {
          console.log('获取到角色消息统计:', result.stats);
          // 更新统计数据
          Object.keys(result.stats).forEach(roleId => {
            stats[roleId] = result.stats[roleId];
          });
        } else {
          console.log('云函数未返回有效的统计数据，尝试使用本地查询...');
          // 如果云函数失败，尝试使用本地查询
          await this.getLocalRoleMessageStats(roleIds, userId, stats);
        }
      } catch (cloudErr) {
        console.error('调用云函数获取角色消息统计失败:', cloudErr);
        // 如果云函数调用失败，尝试使用本地查询
        await this.getLocalRoleMessageStats(roleIds, userId, stats);
      }

      console.log('最终角色使用统计结果:', stats);
      return stats;
    } catch (error) {
      console.error('获取角色使用统计失败:', error);
      return {};
    }
  },

  // 本地获取角色消息统计
  async getLocalRoleMessageStats(roleIds, userId, stats) {
    try {
      console.log('开始本地查询角色消息统计...');
      const db = wx.cloud.database();

      // 查询 chats 集合中的消息数量
      for (const roleId of roleIds) {
        try {
          // 查询该角色的聊天记录
          const { data: chats } = await db.collection('chats')
            .where({
              roleId: roleId,
              userId: userId
            })
            .get()
            .catch(err => {
              console.error(`查询角色 ${roleId} 的聊天记录失败:`, err);
              return { data: [] };
            });

          if (chats && chats.length > 0) {
            // 计算该角色的总消息数量
            let messageCount = 0;
            chats.forEach(chat => {
              // 如果有 messageCount 字段，使用它
              if (chat.messageCount) {
                messageCount += chat.messageCount;
              }
              // 如果有 messages 数组，使用其长度
              else if (chat.messages && Array.isArray(chat.messages)) {
                messageCount += chat.messages.length;
              }
            });

            // 更新统计数据
            stats[roleId] = messageCount;
            console.log(`角色 ${roleId} 的消息数量: ${messageCount}`);
          } else {
            console.log(`角色 ${roleId} 没有聊天记录`);
          }

          // 如果没有在 chats 集合中找到消息，尝试从 messages 集合中查询
          if (!stats[roleId] || stats[roleId] === 0) {
            console.log(`尝试从 messages 集合中查询角色 ${roleId} 的消息数量...`);
            const { data: messages } = await db.collection('messages')
              .where({
                roleId: roleId,
                userId: userId
              })
              .count()
              .catch(err => {
                console.error(`查询角色 ${roleId} 的消息数量失败:`, err);
                return { total: 0 };
              });

            if (messages && messages.total > 0) {
              stats[roleId] = messages.total;
              console.log(`从 messages 集合中找到角色 ${roleId} 的消息数量: ${messages.total}`);
            } else {
              console.log(`角色 ${roleId} 在 messages 集合中也没有消息`);
            }
          }
        } catch (err) {
          console.error(`获取角色 ${roleId} 的消息统计失败:`, err);
        }
      }
    } catch (error) {
      console.error('本地获取角色消息统计失败:', error);
    }
  },

  // 记录角色使用
  async recordRoleUsage(roleId, userId) {
    try {
      const db = wx.cloud.database();
      return await db.collection('roleUsage').add({
        data: {
          roleId,
          userId,
          useTime: db.serverDate(),
          sessionDuration: 0
        }
      });
    } catch (err) {
      console.error('记录角色使用失败:', err);
      throw err;
    }
  },

  // 更新角色使用时长
  async updateRoleUsage(roleId, userId) {
    try {
      const db = wx.cloud.database();
      const command = db.command; // 使用command替代_

      const { data } = await db.collection('roleUsage')
        .where({
          roleId: roleId,
          userId: userId
        })
        .orderBy('useTime', 'desc')
        .limit(1)
        .get();

      if (data && data.length > 0) {
        const usage = data[0];
        const duration = Date.now() - usage.useTime.getTime();

        await db.collection('roleUsage').doc(usage._id).update({
          data: {
            sessionDuration: duration,
            useCount: command.inc(1), // 增加使用次数
            lastUseTime: db.serverDate() // 更新最后使用时间
          }
        });
        return usage._id;
      } else {
        // 创建新记录
        const result = await db.collection('roleUsage').add({
          data: {
            roleId: roleId,
            userId: userId,
            useCount: 1,
            useTime: db.serverDate(),
            lastUseTime: db.serverDate(),
            sessionDuration: 0,
            createTime: db.serverDate()
          }
        });
        return result._id;
      }
    } catch (err) {
      console.error('更新角色使用时长失败:', err);
      // 不抛出异常，避免影响用户体验
      return null;
    }
  }
};

// 情感分析相关功能封装
const emotionHelper = {
  // 分析情感
  async analyzeEmotion(text) {
    try {
      // 使用情感分析服务
      return await emotionService.analyzeEmotion(text);
    } catch (err) {
      console.error('情感分析失败:', err);
      throw err;
    }
  },

  // 保存情感记录
  async saveEmotionRecord(emotionData) {
    try {
      // 使用情感分析服务保存记录
      return await emotionService.saveEmotionRecord(emotionData);
    } catch (err) {
      console.error('保存情感记录失败:', err);
      throw err;
    }
  },

  // 获取情感历史记录
  async getEmotionHistory(userId, roleId, limit = 10) {
    try {
      // 使用情感分析服务获取历史记录
      return await emotionService.getEmotionHistory(userId, roleId, limit);
    } catch (err) {
      console.error('获取情感历史记录失败:', err);
      return [];
    }
  },

  // 根据情感匹配角色
  matchRoleByEmotion(emotion, roleList) {
    return emotionService.matchRoleByEmotion(emotion, roleList);
  },

  // 检测情感变化并提供角色切换建议
  checkEmotionChangeAndSuggestRoleSwitch(prevEmotion, currentEmotion, roleList) {
    return emotionService.checkEmotionChangeAndSuggestRoleSwitch(prevEmotion, currentEmotion, roleList);
  }
};

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户相关
    isLoggedIn: false,
    userInfo: null,
    darkMode: false,

    // 聊天相关
    chatMode: "bot",
    showBotAvatar: true,
    messages: [],

    // 角色相关
    currentRole: null,
    roleList: [],
    showRoleSelector: false,

    // 情感分析相关
    showEmotionPanel: false,
    showEmotionHistory: false,
    prevEmotionAnalysis: null,

    // Agent配置
    agentConfig: {
      botId: "bot-7f510d15",
      allowWebSearch: false,
      allowUploadFile: false,
      allowPullRefresh: false,
      prompt: '',
      welcomeMsg: '',
      roleInfo: null
    },

    // 模型配置
    modelConfig: {
      modelProvider: "deepseek",
      quickResponseModel: "deepseek-v3",
      logo: "",
      welcomeMsg: "我是deepseek-v3,很高兴见到你！",
    },

    // 情感分析相关
    emotionAnalysis: {
      type: 'neutral',
      intensity: 0.5,
      suggestions: []
    },
    // 上一次情感分析结果，用于比较情感变化
    prevEmotionAnalysis: null,

    // 情感类型标签映射
    emotionTypeLabels: EmotionTypeLabels,
    emotionTypeColors: EmotionTypeColors,

    // 视图控制
    showAnalysis: false,
    chatViewWidth: 100,
    currentView: 'chat',
    touchStartX: 0,
    lastTouchX: 0,
  },

  /**
   * 生命周期函数
   */
  onLoad: async function () {
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });

      // 检查登录状态
      const isLoggedIn = app.globalData.isLoggedIn;
      const userInfo = app.globalData.userInfo;

      // 初始化用户信息和系统设置
      this.setData({
        isLoggedIn: isLoggedIn,
        userInfo: userInfo,
        darkMode: app.globalData.darkMode || false
      });

      // 初始化云开发
      if (!wx.cloud) {
        console.error('请使用 2.2.3 或以上的基础库以使用云能力');
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: '当前微信版本过低，无法使用完整功能，请更新微信版本',
          showCancel: false
        });
        return;
      }

      // 确保云开发已初始化
      if (!wx.cloud.inited) {
        wx.cloud.init({
          env: app.globalData.cloudEnv || 'rainbowrain-2gt3j8hda726e4fe',
          traceUser: true,
        });
      }

      // 如果未登录，显示登录提示
      if (!isLoggedIn || !userInfo) {
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: '请先登录后使用完整功能',
          showCancel: false,
          success: (res) => {
            if (res.confirm) {
              wx.switchTab({
                url: '/pages/user/index'
              });
            }
          }
        });
        return;
      }

      // 加载角色数据
      console.log('开始加载角色数据...');
      await this.loadRoles();
      console.log('角色数据加载完成, 当前角色:', this.data.currentRole ? this.data.currentRole.role_name : '未设置');

      this.checkSystemTheme();

      // 初始化空消息列表
      this.setData({
        messages: [],
        emotionAnalysis: {
          type: 'neutral',
          intensity: 0.5,
          suggestions: []
        }
      });

      // 获取 agent-ui 组件实例
      this.agentUI = this.selectComponent('#agentUI');
      console.log('获取 agent-ui 组件实例:', this.agentUI ? '成功' : '失败');

      // 延迟加载历史聊天记录，先完成页面初始化
      if (this.data.currentRole) {
        console.log('页面初始化完成后将延迟加载历史聊天记录...');
        // 使用setTimeout延迟加载历史记录，先让页面完成渲染
        setTimeout(() => {
          this.loadChatHistory(false).then(() => {
            // 检查聊天记录是否成功加载
            const chatHistoryLoaded = this.checkChatHistoryLoaded();
            console.log('历史聊天记录加载完成, 加载状态:', chatHistoryLoaded ? '成功' : '未找到记录');
          }).catch(err => {
            console.error('延迟加载历史记录失败:', err);
          });
        }, 500); // 延迟500毫秒加载
      } else {
        console.log('当前没有选择角色，不加载历史聊天记录');
      }

      wx.hideLoading();
      console.log('页面初始化完成');
    } catch (err) {
      console.error('初始化失败:', err);
      this.handleError(err, 'onLoad');
      wx.hideLoading();
    }
  },

  onUnload() {
    // 保存数据
    Promise.all([
      this.saveChat(),
      this.updateRoleUsage()
    ]).catch(err => {
      this.handleError(err, 'unload');
    });
  },

  // 保存聊天记录
  async saveChat(showUI = true) {
    try {
      // 如果没有消息或没有角色信息，则不保存
      if (!this.data.messages.length || !this.data.currentRole || !this.data.userInfo) {
        console.log('没有可保存的聊天记录');
        return null;
      }

      // 记录开始保存的时间，用于计算耗时
      const startTime = Date.now();
      console.log(`开始保存聊天记录: 角色=${this.data.currentRole.role_name}, 消息数=${this.data.messages.length}`);

      // 如果需要显示界面，则显示保存中提示
      if (showUI) {
        wx.showLoading({
          title: '正在保存...',
          mask: true
        });
      }

      // 准备要保存的聊天数据
      const chatData = {
        roleId: this.data.currentRole._id,
        roleName: this.data.currentRole.role_name || '',
        userId: this.data.userInfo.userId,
        openId: this.data.userInfo.openId || '',
        userInfo: {
          userId: this.data.userInfo.userId,
          nickName: this.data.userInfo.nickName || '',
          avatarUrl: this.data.userInfo.avatarUrl || ''
        },
        title: `与${this.data.currentRole.role_name}的对话`,
        messageCount: this.data.messages.length,
        lastMessage: this.data.messages[this.data.messages.length - 1]?.content || '',
        emotionAnalysis: this.data.emotionAnalysis || {
          type: 'neutral',
          intensity: 0.5,
          suggestions: []
        },
        isArchived: false,
        isPinned: false,
        tags: []
      };

      // 打印要保存的消息数量
      console.log(`准备保存 ${this.data.messages.length} 条消息到数据库`);

      // 使用云函数保存聊天记录，避免权限问题
      console.log('调用云函数 chat...');
      const callResult = await wx.cloud.callFunction({
        name: 'chat',
        data: {
          action: 'save',
          chatData,
          messages: this.data.messages
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
                userId: this.data.userInfo.userId
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

      return result.chatId;
    } catch (err) {
      console.error('保存聊天记录失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
      // 不抛出异常，避免影响用户体验
      return null;
    }
  },

  // 更新角色使用时长
  async updateRoleUsage() {
    try {
      // 验证必要数据
      if (!this.data.currentRole || !this.data.currentRole._id || !this.data.userInfo) {
        console.log('没有角色或用户信息，无法更新使用统计');
        return;
      }

      // 尝试使用dbHelper
      if (typeof dbHelper !== 'undefined' && dbHelper.updateRoleUsage) {
        return await dbHelper.updateRoleUsage(
          this.data.currentRole._id,
          this.data.userInfo.openId || this.data.userInfo.userId
        );
      }

      // 如果dbHelper不可用，直接使用云数据库API
      const db = wx.cloud.database();
      const _ = db.command;

      // 准备用户和角色信息
      const roleId = this.data.currentRole._id;
      const userId = this.data.userInfo.openId || this.data.userInfo.userId;

      // 查询现有统计记录
      const { data } = await db.collection('roleUsage')
        .where({
          roleId,
          userId
        })
        .get()
        .catch(() => ({ data: [] }));

      // 准备使用数据
      const usageData = {
        roleId,
        userId,
        roleName: this.data.currentRole.role_name || '',
        lastUsedTime: db.serverDate(),
        updateTime: db.serverDate()
      };

      // 如果有现有记录，更新它
      if (data && data.length > 0) {
        const usageId = data[0]._id;
        await db.collection('roleUsage').doc(usageId).update({
          data: {
            usageCount: _.inc(1),  // 使用次数+1
            lastUsedTime: usageData.lastUsedTime,
            updateTime: usageData.updateTime
          }
        });
        console.log('更新角色使用统计成功');
        return usageId;
      } else {
        // 如果没有现有记录，创建新记录
        usageData.usageCount = 1;
        usageData.createTime = db.serverDate();

        const result = await db.collection('roleUsage').add({
          data: usageData
        });
        console.log('创建角色使用统计成功');
        return result._id;
      }
    } catch (err) {
      console.error('更新角色使用时长失败:', err);
      // 不抛出异常，避免影响用户体验
      return null;
    }
  },

  /**
   * 用户登录相关
   */
  async handleLogin() {
    try {
      const success = await app.login();
      if (success) {
        this.setData({
          isLoggedIn: true,
          userInfo: app.globalData.userInfo
        });
      } else {
        throw new Error('登录失败');
      }
    } catch (err) {
      console.error('登录失败:', err);
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      });
      wx.navigateBack();
    }
  },

  /**
   * 角色管理相关
   */
  // 处理角色数据,添加category字段
  preprocessRoles(roles) {
    return roles.map(role => {
      let category = 'other';
      if(['老师', '直属上级', '同事'].includes(role.relationship)) {
        category = 'work';
      } else if(['父亲', '母亲', '兄弟', '姐妹', '家人'].includes(role.relationship)) {
        category = 'family';
      } else if(['朋友', '恋人', '闺蜜'].includes(role.relationship)) {
        category = 'social';
      }
      return {...role, category};
    });
  },

  async loadRoles() {
    try {
      // 验证用户信息
      if (!this.data.userInfo || !this.data.userInfo.userId) {
        console.warn('用户未登录，无法加载角色');
        return;
      }

      // 显示加载状态
      wx.showLoading({
        title: '加载角色...',
        mask: false
      });

      // 从全局数据获取角色列表
      let roleList = app.globalData.roleList || [];

      // 如果全局数据为空,从云数据库获取
      if (roleList.length === 0) {
        try {
          const db = wx.cloud.database();
          const { data } = await db.collection('roles')
            .where({
              user_id: this.data.userInfo.userId,
              status: 1
            })
            .get();

          if (data && data.length > 0) {
            roleList = data;
            app.globalData.roleList = roleList;
          }
        } catch (dbErr) {
          console.error('从数据库加载角色失败:', dbErr);
          // 数据库加载失败时，仍然继续处理
        }
      }

      // 处理角色数据
      if (roleList.length > 0) {
        // 添加category字段
        roleList = this.preprocessRoles(roleList);

        // 使用本地存储的使用统计数据，避免额外的数据库查询
        let usageStats = wx.getStorageSync('roleUsageStats') || {};

        // 如果本地没有统计数据，或者数据过期（超过1小时），才从数据库获取
        const lastUpdateTime = wx.getStorageSync('roleUsageStatsUpdateTime') || 0;
        const now = Date.now();
        const oneHour = 60 * 60 * 1000; // 1小时的毫秒数

        if (Object.keys(usageStats).length === 0 || (now - lastUpdateTime) > oneHour) {
          try {
            console.log('本地统计数据不存在或已过期，从数据库获取...');
            usageStats = await dbHelper.getRoleUsageStats(
              roleList.map(r => r._id),
              this.data.userInfo.openId || this.data.userInfo.userId
            );
            console.log('获取到的角色使用统计:', usageStats);

            // 将获取到的统计数据保存到本地
            wx.setStorageSync('roleUsageStats', usageStats);
            wx.setStorageSync('roleUsageStatsUpdateTime', now);
          } catch (statsErr) {
            console.error('获取角色使用统计失败:', statsErr);
            // 统计获取失败时，使用空对象或本地缓存
            usageStats = usageStats || {};
          }
        } else {
          console.log('使用本地缓存的角色使用统计数据');
        }

        // 合并数据
        const rolesWithUsage = roleList.map(role => ({
          ...role,
          usageCount: usageStats[role._id] || 0
        }));

        // 按使用次数排序，使用最多的角色排在前面
        rolesWithUsage.sort((a, b) => b.usageCount - a.usageCount);

        // 更新状态
        this.setData({
          roleList: rolesWithUsage,
          currentRole: rolesWithUsage[0]
        });

        // 更新Agent配置
        if (rolesWithUsage[0]) {
          this.updateAgentConfig(rolesWithUsage[0]);
        }
      } else {
        // 加载默认角色
        this.loadDefaultRoles();
      }

      wx.hideLoading();
    } catch (error) {
      console.error('加载角色列表失败:', error);
      this.handleError(error, 'loadRoles');
      wx.hideLoading();
    }
  },

  // 加载默认角色
  loadDefaultRoles() {
    const defaultRoles = [
      {
        _id: 'default-1',
        role_name: '知心朋友',
        relationship: '朋友',
        avatar_url: '/assets/images/roles/friend.png',
        usageCount: 0,
        role_desc: '理解你、支持你的知心朋友',
        style: '温暖友善',
        speaking_style: '平等、支持的语气',
        background: '与你同龄，有着相似的兴趣和经历'
      },
      {
        _id: 'default-2',
        role_name: '理解的父母',
        relationship: '父母',
        avatar_url: '/assets/images/roles/parent.png',
        usageCount: 0,
        role_desc: '永远支持你的父母形象',
        style: '慈爱包容',
        speaking_style: '温和、有耐心的语气',
        background: '有丰富的人生经验，愿意无条件支持你'
      },
      {
        _id: 'default-3',
        role_name: '温暖恋人',
        relationship: '恋人',
        avatar_url: '/assets/images/roles/lover.png',
        usageCount: 0,
        role_desc: '懂你、爱你的恋人形象',
        style: '浪漫体贴',
        speaking_style: '亲密、甜蜜的语气',
        background: '与你相爱多年，了解你的一切'
      }
    ];

    this.setData({
      roleList: defaultRoles,
      currentRole: defaultRoles[0]
    });

    this.updateAgentConfig(defaultRoles[0]);

    wx.showToast({
      title: '使用默认角色，可点击管理创建个人角色',
      icon: 'none',
      duration: 3000
    });
  },

  // 更新Agent配置
  updateAgentConfig(role) {
    const systemPrompt = role.system_prompt || this.generateSystemPrompt(role);

    this.setData({
      ['agentConfig.prompt']: systemPrompt,
      ['agentConfig.welcomeMsg']: `你好，我是${role.role_name}`,
      ['agentConfig.roleInfo']: role
    });
  },

  // 生成系统提示词
  generateSystemPrompt(role) {
    return `根据我的角色信息调整对话风格：
我是${role.role_name}，作为${role.relationship}与你对话。
我的特点是：${role.role_desc || '无特殊说明'}
我的性格风格是：${role.style || '自然友好'}
我的说话风格是：${role.speaking_style || '自然友好'}
我的背景故事是：${role.background || '无特殊背景'}
我需要避免的话题是：${role.taboo || '无特殊禁忌'}

请在保持心情树洞AI智能体的基础定位下，根据以上角色信息调整对话风格。`;
  },

  /**
   * 聊天相关功能
   * @param {boolean} showLoading 是否显示加载提示，默认为false
   */
  async loadChatHistory(showLoading = false) {
    try {
      console.log('开始加载聊天记录...');

      // 验证必要条件
      if (!this.data.userInfo || !this.data.userInfo.userId) {
        console.warn('用户未登录，无法加载聊天记录');
        return;
      }

      // 显示加载状态（如果需要）
      if (showLoading) {
        wx.showLoading({
          title: '加载聊天记录...',
          mask: false
        });
      }

      console.log('当前角色信息:', this.data.currentRole ? {
        _id: this.data.currentRole._id,
        role_name: this.data.currentRole.role_name,
        relationship: this.data.currentRole.relationship
      } : '未设置');

      // 尝试从本地缓存加载聊天记录
      const cacheKey = `chatHistory_${this.data.currentRole ? this.data.currentRole._id : 'default'}`;
      const cachedHistory = wx.getStorageSync(cacheKey);
      const cacheTime = wx.getStorageSync(`${cacheKey}_time`) || 0;
      const now = Date.now();
      const cacheExpiry = 5 * 60 * 1000; // 5分钟缓存过期时间

      // 如果有缓存且未过期，直接使用缓存数据
      if (cachedHistory && (now - cacheTime) < cacheExpiry) {
        console.log('使用本地缓存的聊天记录，消息数量:', cachedHistory.length);
        this.setData({
          messages: cachedHistory,
          emotionAnalysis: wx.getStorageSync(`${cacheKey}_emotion`) || {
            type: 'neutral',
            intensity: 0.5,
            suggestions: []
          }
        });

        if (showLoading) {
          wx.hideLoading();
        }

        return;
      }

      // 如果没有缓存或缓存已过期，从云函数获取数据
      console.log('本地缓存不存在或已过期，从云函数获取数据...');

      // 准备查询参数
      const query = { userId: this.data.userInfo.userId };

      // 如果有当前角色，添加角色条件
      if (this.data.currentRole && this.data.currentRole._id) {
        query.roleId = this.data.currentRole._id;
      }

      console.log('使用查询条件:', query);

      // 直接使用云函数获取数据，避免多次数据库查询
      let foundData = false;

      try {
        // 使用云函数查询聊天记录，避免权限问题
        console.log('调用云函数 chat...');
        const callParams = {
          action: 'get',
          userId: this.data.userInfo.userId,
          roleId: this.data.currentRole ? this.data.currentRole._id : null
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
            const cacheKey = `chatHistory_${this.data.currentRole ? this.data.currentRole._id : 'default'}`;
            const emotionData = lastChat.emotionAnalysis || {
              type: 'neutral',
              intensity: 0.5,
              suggestions: []
            };

            wx.setStorageSync(cacheKey, filteredMessages);
            wx.setStorageSync(`${cacheKey}_time`, Date.now());
            wx.setStorageSync(`${cacheKey}_emotion`, emotionData);

            this.setData({
              messages: filteredMessages,
              emotionAnalysis: emotionData
            });

            foundData = true;
            console.log('成功从云函数加载聊天记录并保存到本地缓存');

            // 不显示成功提示，后台静默加载
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

      // 如果没有找到数据，设置空数组
      if (!foundData) {
        console.log('未找到聊天记录，使用空数组');
        this.setData({
          messages: [],
          emotionAnalysis: {
            type: 'neutral',
            intensity: 0.5,
            suggestions: []
          }
        });

        // 不显示提示，后台静默加载
      }

      if (showLoading) {
        wx.hideLoading();
      }
      console.log('加载聊天记录完成');
    } catch (err) {
      console.error('加载聊天记录失败:', err);
      this.handleError(err, 'loadChatHistory');
      if (showLoading) {
        wx.hideLoading();
      }

      // 设置空数组作为默认值
      this.setData({
        messages: [],
        emotionAnalysis: {
          type: 'neutral',
          intensity: 0.5,
          suggestions: []
        }
      });

      // 不显示错误提示，后台静默加载
    }
  },

  // 发送消息
  sendMessage() {
    if (!this.data.inputValue.trim()) {
      return;
    }

    const userMessage = this.data.inputValue;

    // 添加用户消息
    this.addMessage({
      type: 'user',
      content: userMessage,
      timestamp: new Date().getTime()
    });

    // 清空输入框
    this.setData({
      inputValue: ''
    });

    // 滚动到底部
    this.scrollToBottom();

    // 分析用户情绪
    this.analyzeEmotion(userMessage);

    // 调用AI响应
    this.getAIResponse(userMessage);
  },

  // 发送消息前处理
  async beforeSendMessage(e) {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return false;
    }

    if (!this.data.currentRole) {
      wx.showToast({
        title: '请先选择角色',
        icon: 'none'
      });
      return false;
    }

    try {
      // 获取消息内容
      const message = e.detail.value || e.detail.message;

      // 验证消息内容
      if (!message || typeof message !== 'string' || message.trim() === '') {
        wx.showToast({
          title: '消息不能为空',
          icon: 'none'
        });
        return false;
      }

      // 构建消息历史
      const history = this.buildMessageHistory(message);

      // 保存用户消息
      await this.saveUserMessage(message);

      // 显示加载状态
      wx.showLoading({
        title: '正在思考...',
        mask: true
      });

      // 调用AI服务
      const response = await this.callAIService(message, history);

      // 隐藏加载状态
      wx.hideLoading();

      // 处理AI响应
      if (response && response.content) {
        await this.handleAIResponse(response.content);
        // 分析情感
        await this.analyzeEmotion(message);
        return true;
      } else if (response && response.error) {
        // 如果有错误信息，显示错误
        wx.showToast({
          title: response.error,
          icon: 'none'
        });
        return false;
      } else {
        // 其他未知错误
        wx.showToast({
          title: '响应失败，请重试',
          icon: 'none'
        });
        return false;
      }
    } catch (err) {
      console.error('发送消息失败:', err);
      this.handleError(err, 'beforeSendMessage');
      wx.hideLoading(); // 确保加载提示被隐藏
      return false;
    }
  },

  // 构建消息历史
  buildMessageHistory(currentMessage) {
    try {
      const history = [];

      // 添加系统角色提示词
      if (this.data.currentRole) {
        const rolePrompt = this.generateSystemPrompt(this.data.currentRole);
        history.push({
          role: 'system',  // 使用system角色更适合于提示词
          content: rolePrompt
        });
      }

      // 添加最近对话历史，最多10条
      const recentMessages = this.data.messages.slice(-10);
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
          content: currentMessage
        }
      ];
    }
  },

  // 保存用户消息
  async saveUserMessage(message) {
    try {
      // 验证消息
      if (!message || typeof message !== 'string' || message.trim() === '') {
        console.warn('消息内容为空');
        return false;
      }

      // 添加到本地消息列表
      const userMessage = {
        type: 'user',
        content: message,
        timestamp: Date.now(),
        userInfo: this.data.userInfo
      };

      const updatedMessages = [...this.data.messages, userMessage];

      this.setData({ messages: updatedMessages });

      // 更新本地缓存
      try {
        const cacheKey = `chatHistory_${this.data.currentRole ? this.data.currentRole._id : 'default'}`;
        wx.setStorageSync(cacheKey, updatedMessages);
        wx.setStorageSync(`${cacheKey}_time`, Date.now());
        console.log('用户消息已更新到本地缓存');
      } catch (cacheErr) {
        console.error('更新本地缓存失败:', cacheErr);
      }

      // 自动保存消息到数据库
      try {
        // 不显示加载状态，避免影响用户体验
        await this.saveChat(false);
        console.log('用户消息自动保存成功');
      } catch (saveErr) {
        console.error('用户消息自动保存失败:', saveErr);
        // 保存失败不影响用户体验
      }

      return true;
    } catch (err) {
      console.error('保存用户消息失败:', err);
      // 即使保存失败也不影响用户体验
      return true;
    }
  },

  // 调用AI服务
  async callAIService(message, history) {
    try {
      // 先检查是否有扩展API
      if (wx.cloud.extend && wx.cloud.extend.AI && wx.cloud.extend.AI.bot) {
        return await wx.cloud.extend.AI.bot.sendMessage({
          botId: this.data.agentConfig.botId,
          msg: message,
          history: history,
          config: {
            temperature: 0.8,
            maxTokens: 2000
          }
        });
      } else {
        // 如果没有扩展API，则使用普通云函数
        const { result } = await wx.cloud.callFunction({
          name: 'chatWithAI',
          data: {
            message,
            history,
            roleInfo: this.data.currentRole,
            botId: this.data.agentConfig.botId,
            temperature: 0.8,
            maxTokens: 2000
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
  },

  // 处理AI响应
  async handleAIResponse(content) {
    try {
      // 验证内容
      if (!content || typeof content !== 'string') {
        console.error('无效的AI响应内容:', content);
        return false;
      }

      // 创建机器人消息对象
      const botMessage = {
        type: 'bot',
        content: content,
        timestamp: Date.now(),
        roleInfo: this.data.currentRole
      };

      // 更新消息列表
      const updatedMessages = [...this.data.messages, botMessage];
      this.setData({
        messages: updatedMessages
      });

      // 更新本地缓存
      try {
        const cacheKey = `chatHistory_${this.data.currentRole ? this.data.currentRole._id : 'default'}`;
        wx.setStorageSync(cacheKey, updatedMessages);
        wx.setStorageSync(`${cacheKey}_time`, Date.now());
        console.log('消息已更新到本地缓存');
      } catch (cacheErr) {
        console.error('更新本地缓存失败:', cacheErr);
      }

      // 自动保存消息到数据库
      try {
        // 不显示加载状态，避免影响用户体验
        await this.saveChat(false);
        console.log('AI响应自动保存成功');
      } catch (saveErr) {
        console.error('AI响应自动保存失败:', saveErr);
        // 保存失败不影响用户体验
      }

      return true;
    } catch (err) {
      console.error('处理AI响应失败:', err);
      return false;
    }
  },

  /**
   * 情感分析相关
   */
  async analyzeEmotion(text) {
    try {
      // 验证文本
      if (!text || typeof text !== 'string' || text.trim() === '') {
        console.warn('情感分析文本为空');
        return false;
      }

      // 在后台进行分析，不显示加载状态
      console.log('开始后台分析情绪:', text);

      try {
        // 获取聊天历史记录作为上下文
        const chatHistory = this.data.messages.slice(-5); // 最多取最近5条消息
        const formattedHistory = emotionService.formatChatHistoryForAnalysis(chatHistory);

        console.log('情感分析使用历史记录:', formattedHistory.length > 0 ? '是' : '否');

        // 调用情感分析服务，传入历史记录
        const result = await emotionService.analyzeEmotion(text, {
          history: formattedHistory,
          roleId: this.data.currentRole ? this.data.currentRole._id : null,
          chatId: this.data.chatId || null
        });

        // 验证结果
        if (!result) {
          throw new Error('情感分析结果为空');
        }

        // 更新状态
        this.setData({
          emotionAnalysis: result
        });

        // 更新本地缓存中的情感分析结果
        try {
          const cacheKey = `chatHistory_${this.data.currentRole ? this.data.currentRole._id : 'default'}`;
          wx.setStorageSync(`${cacheKey}_emotion`, result);
          console.log('情感分析结果已更新到本地缓存');
        } catch (cacheErr) {
          console.error('更新情感分析缓存失败:', cacheErr);
        }

        // 保存当前情感分析结果
        this.setData({
          prevEmotionAnalysis: result
        });

        console.log('情感分析完成，结果已更新');
        return true;
      } catch (analyzeErr) {
        console.error('情感分析服务调用失败:', analyzeErr);

        // 使用默认的情感分析结果
        this.setData({
          emotionAnalysis: {
            type: 'neutral',
            intensity: 0.5,
            report: '无法分析您当前的情绪状态，您的情绪似乎比较平稳。',
            suggestions: ['继续保持对话']
          }
        });

        return false;
      }
    } catch (err) {
      console.error('情感分析失败:', err);
      this.handleError(err, 'analyzeEmotion');
      return false;
    }
  },

  // 保存情感记录
  async saveEmotion() {
    try {
      // 验证必要数据
      if (!this.data.userInfo || !this.data.userInfo.userId) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return false;
      }

      if (!this.data.currentRole || !this.data.currentRole._id) {
        wx.showToast({
          title: '请先选择角色',
          icon: 'none'
        });
        return false;
      }

      if (!this.data.messages || this.data.messages.length === 0) {
        wx.showToast({
          title: '没有可保存的对话',
          icon: 'none'
        });
        return false;
      }

      // 显示情感分析面板
      this.showEmotionPanel();

      // 显示加载状态
      wx.showLoading({
        title: '正在保存...',
        mask: true
      });

      // 准备情感数据
      const emotionData = {
        userId: this.data.userInfo.userId,
        roleId: this.data.currentRole._id,
        roleName: this.data.currentRole.role_name || '',
        analysis: this.data.emotionAnalysis || {
          type: 'neutral',
          intensity: 0.5,
          suggestions: []
        },
        messages: this.data.messages,
        createTime: new Date(),
        updateTime: new Date()
      };

      // 保存情感记录
      await emotionHelper.saveEmotionRecord(emotionData);

      // 隐藏加载状态并显示成功提示
      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      return true;
    } catch (err) {
      console.error('保存情感记录失败:', err);
      this.handleError(err, 'saveEmotion');
      wx.hideLoading();
      return false;
    }
  },

  /**
   * 界面交互相关
   */
  // 显示角色选择器
  showRoleSelector() {
    this.setData({ showRoleSelector: true });
  },

  // 隐藏角色选择器
  hideRoleSelector() {
    this.setData({ showRoleSelector: false });
  },

  // 处理消息变化事件
  async onMessageChange(e) {
    try {
      console.log('消息变化事件触发:', e.detail.type);

      // 获取消息记录
      const chatRecords = e.detail.chatRecords || [];
      const eventType = e.detail.type;

      // 如果是清空消息事件，则清空消息列表
      if (eventType === 'clear') {
        console.log('收到清空消息事件，清空消息列表');
        this.setData({
          messages: [],
          emotionAnalysis: {
            type: 'neutral',
            intensity: 0.5,
            suggestions: []
          }
        });
        return;
      }

      // 如果没有消息记录，直接返回
      if (!chatRecords.length) {
        console.log('没有消息记录，不更新');
        return;
      }

      // 过滤掉空白消息和角色提示词
      const filteredRecords = chatRecords.filter(record => {
        // 过滤掉空白消息
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

      // 将 agent-ui 组件的消息格式转换为我们的消息格式
      const messages = filteredRecords.map(record => ({
        type: record.role === 'user' ? 'user' : 'bot',
        content: record.content,
        timestamp: record.timestamp || Date.now(),
        userInfo: this.data.userInfo,
        roleInfo: this.data.currentRole
      }));

      // 只更新消息列表，不保存到数据库
      // 保存将在用户退出或切换角色时进行
      this.setData({ messages });
      console.log('消息列表已更新，共 ' + messages.length + ' 条消息');

      // 如果是用户发送的消息，则分析情绪
      if (eventType === 'send' && filteredRecords.length > 0) {
        // 找到最新的用户消息
        const latestUserMessage = filteredRecords.filter(record => record.role === 'user').pop();
        if (latestUserMessage && latestUserMessage.content) {
          console.log('检测到用户新消息，开始分析情绪:', latestUserMessage.content);
          // 异步分析情绪，不阻塞消息处理
          this.analyzeEmotion(latestUserMessage.content);
        }
      }
    } catch (err) {
      console.error('处理消息变化事件失败:', err);
    }
  },

  // 检查聊天记录加载状态
  checkChatHistoryLoaded() {
    // 检查消息列表是否有内容
    const hasMessages = this.data.messages && this.data.messages.length > 0;

    // 检查 agent-ui 组件的聊天记录是否有内容
    let agentUIHasMessages = false;
    if (this.agentUI && this.agentUI.data && this.agentUI.data.chatRecords) {
      // 过滤掉空消息和角色提示词
      const validMessages = this.agentUI.data.chatRecords.filter(record => {
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
  },

  // 切换角色
  async switchRole(e) {
    const roleId = e.currentTarget.dataset.id;
    const role = this.data.roleList.find(r => r._id === roleId);

    if (!role) {
      console.warn('未找到角色信息:', roleId);
      return;
    }

    console.log('开始切换角色:', {
      roleId,
      roleName: role.role_name,
      relationship: role.relationship
    });

    try {
      // 保存当前对话
      if (this.data.messages.length > 0 && this.data.currentRole) {
        console.log(`切换角色前保存当前对话: 角色=${this.data.currentRole.role_name}, 消息数=${this.data.messages.length}`);
        await this.saveChat(true);
        console.log('当前对话保存成功');
      } else {
        console.log('当前没有需要保存的对话');
      }

      // 更新角色配置
      console.log('更新角色配置...');
      this.updateAgentConfig(role);

      // 清空当前面板历史记录
      console.log('清空当前面板历史记录...');
      this.setData({
        currentRole: role,
        showBotAvatar: true,
        showRoleSelector: false,
        messages: [], // 清空消息列表
        emotionAnalysis: { // 重置情感分析
          type: 'neutral',
          intensity: 0.5,
          suggestions: []
        }
      });

      // 调用 agent-ui 组件的 clearChatRecords 方法清空聊天记录
      if (this.agentUI) {
        console.log('调用 agent-ui 组件的 clearChatRecords 方法');
        this.agentUI.clearChatRecords();
      } else {
        console.warn('agent-ui 组件实例不存在，无法清空聊天记录');
      }

      // 不显示加载提示，后台静默加载
      console.log('开始加载对话...');

      // 尝试从本地缓存加载历史对话
      const cacheKey = `chatHistory_${role._id}`;
      const cachedHistory = wx.getStorageSync(cacheKey);
      const cacheTime = wx.getStorageSync(`${cacheKey}_time`) || 0;
      const now = Date.now();
      const cacheExpiry = 5 * 60 * 1000; // 5分钟缓存过期时间

      // 如果有缓存且未过期，直接使用缓存数据
      if (cachedHistory && (now - cacheTime) < cacheExpiry) {
        console.log(`切换到新角色: ${role.role_name}, 使用本地缓存的历史对话`);
        this.setData({
          messages: cachedHistory,
          emotionAnalysis: wx.getStorageSync(`${cacheKey}_emotion`) || {
            type: 'neutral',
            intensity: 0.5,
            suggestions: []
          }
        });
      } else {
        // 如果没有缓存或缓存已过期，从云函数获取数据
        console.log(`切换到新角色: ${role.role_name}, 开始加载历史对话`);
        await this.loadChatHistory();
      }

      // 检查聊天记录是否成功加载
      const chatHistoryLoaded = this.checkChatHistoryLoaded();
      console.log('历史对话加载完成, 加载状态:', chatHistoryLoaded ? '成功' : '未找到记录');

      // 记录角色使用，但不增加使用次数，因为使用次数基于历史消息数量
      console.log('记录角色使用时间...');
      await dbHelper.recordRoleUsage(roleId, this.data.userInfo.openId || this.data.userInfo.userId);

      // 不显示成功提示，后台静默切换
      console.log(`已切换到${role.role_name}`);

      console.log('角色切换完成');

    } catch (err) {
      console.error('[switchRole]错误:', err);
      this.handleError(err, 'switchRole');
      wx.hideLoading();
    }
  },

  // 处理触摸事件
  handleTouchStart(e) {
    this.setData({
      touchStartX: e.touches[0].clientX,
      lastTouchX: e.touches[0].clientX
    });
  },

  handleTouchMove(e) {
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - this.data.lastTouchX;
    let newChatWidth = this.data.chatViewWidth;

    if (deltaX < 0 && !this.data.showAnalysis) {
      newChatWidth = Math.max(40, this.data.chatViewWidth + (deltaX / wx.getSystemInfoSync().windowWidth) * 100);
    } else if (deltaX > 0 && this.data.showAnalysis) {
      newChatWidth = Math.min(100, this.data.chatViewWidth + (deltaX / wx.getSystemInfoSync().windowWidth) * 100);
    }

    this.setData({
      chatViewWidth: newChatWidth,
      lastTouchX: touchX
    });
  },

  handleTouchEnd() {
    const threshold = 70;

    if (this.data.chatViewWidth < threshold && !this.data.showAnalysis) {
      this.setData({
        chatViewWidth: 40,
        showAnalysis: true,
        currentView: 'analysis'
      });
    } else if (this.data.chatViewWidth >= threshold && this.data.showAnalysis) {
      this.setData({
        chatViewWidth: 100,
        showAnalysis: false,
        currentView: 'chat'
      });
    } else {
      this.setData({
        chatViewWidth: this.data.showAnalysis ? 40 : 100
      });
    }
  },

  // 切换分析视图
  toggleAnalysisView() {
    const showAnalysis = !this.data.showAnalysis;
    this.setData({
      showAnalysis,
      chatViewWidth: showAnalysis ? 40 : 100,
      currentView: showAnalysis ? 'analysis' : 'chat'
    });
  },

  /**
   * 工具函数
   */
  // 错误处理
  handleError(err, type = 'normal') {
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
  },

  // 检查系统主题
  checkSystemTheme() {
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          darkMode: res.theme === 'dark'
        });
      }
    });
  },

  // 切换深色模式
  toggleDarkMode() {
    const darkMode = !this.data.darkMode;
    this.setData({ darkMode });

    if (app.globalData) {
      app.globalData.darkMode = darkMode;
    }

    try {
      wx.setStorageSync('darkMode', darkMode);
    } catch (e) {
      console.error('保存主题设置失败', e);
    }
  },

  /**
   * 分享相关
   */
  onShareAppMessage() {
    return {
      title: '分享我的心情',
      path: '/pages/emotionVault/emotionVault'
    };
  },

  onShareTimeline() {
    return {
      title: '分享我的心情'
    };
  },

  /**
   * 情感分析面板相关
   */
  // 显示情感分析面板
  showEmotionPanel() {
    this.setData({ showEmotionPanel: true });
  },

  // 关闭情感分析面板
  closeEmotionPanel() {
    this.setData({ showEmotionPanel: false });
  },

  // 保存情感记录
  saveEmotion() {
    this.onSaveEmotion();
  },

  // 保存情感记录
  async onSaveEmotion() {
    try {
      if (!this.data.emotionAnalysis || !this.data.userInfo || !this.data.currentRole) {
        wx.showToast({
          title: '无法保存情感记录',
          icon: 'none'
        });
        return;
      }

      // 构建情感数据
      const emotionData = {
        userId: this.data.userInfo.openId || this.data.userInfo._openid,
        roleId: this.data.currentRole._id,
        roleName: this.data.currentRole.role_name,
        chatId: this.data.currentChatId,
        analysis: this.data.emotionAnalysis,
        createTime: new Date()
      };

      // 保存情感记录
      await emotionHelper.saveEmotionRecord(emotionData);

      wx.showToast({
        title: '情感记录已保存',
        icon: 'success'
      });

      // 关闭情感面板
      this.closeEmotionPanel();
    } catch (err) {
      console.error('保存情感记录失败:', err);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  // 查看历史记录
  onViewHistory() {
    this.setData({
      showEmotionHistory: true,
      showEmotionPanel: false
    });
  },

  // 关闭历史记录
  closeEmotionHistory() {
    this.setData({
      showEmotionHistory: false
    });
  },

  // 查看记录详情
  onViewRecordDetail(e) {
    const { record } = e.detail;

    // 显示记录详情
    this.setData({
      emotionAnalysis: record.analysis,
      showEmotionPanel: true,
      showEmotionHistory: false
    });
  },

  /**
   * 分享情感分析结果
   */
  shareEmotion() {
    try {
      if (!this.data.emotionAnalysis) {
        wx.showToast({
          title: '没有可分享的情感分析',
          icon: 'none'
        });
        return;
      }

      // 准备分享数据
      const emotionType = this.data.emotionTypeLabels[this.data.emotionAnalysis.type] || '未知';
      const intensity = Math.round(this.data.emotionAnalysis.intensity * 100);
      const report = this.data.emotionAnalysis.report || '';
      const suggestions = this.data.emotionAnalysis.suggestions || [];

      // 构造分享文本
      let shareText = `我当前的情绪是: ${emotionType}(${intensity}%)强度\n`;

      if (report) {
        shareText += `\n${report}\n`;
      }

      if (suggestions.length > 0) {
        shareText += '\n建议:\n';
        suggestions.forEach((suggestion, index) => {
          shareText += `${index + 1}. ${suggestion}\n`;
        });
      }

      // 使用微信分享 API
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });

      // 显示分享提示
      wx.showToast({
        title: '请点击右上角分享',
        icon: 'none',
        duration: 2000
      });

      // 设置分享内容
      this.setData({
        shareContent: shareText
      });

    } catch (err) {
      console.error('分享情感失败:', err);
      wx.showToast({
        title: '分享失败',
        icon: 'none'
      });
    }
  },

  /**
   * 添加消息
   */
  addMessage(message) {
    const messages = this.data.messages;
    messages.push(message);
    this.setData({
      messages
    });
    this.scrollToBottom();
  },

  /**
   * 获取AI响应
   */
  async getAIResponse(message) {
    try {
      if (!message || typeof message !== 'string' || message.trim() === '') {
        console.warn('消息内容为空');
        return false;
      }

      // 显示加载状态
      wx.showLoading({
        title: '正在思考...',
        mask: true
      });

      // 构建消息历史
      const history = this.buildMessageHistory(message);

      // 调用AI服务
      const response = await this.callAIService(message, history);

      // 隐藏加载状态
      wx.hideLoading();

      // 处理AI响应
      if (response && response.content) {
        // 添加机器人消息
        this.addMessage({
          type: 'bot',
          content: response.content,
          timestamp: new Date().getTime(),
          roleInfo: this.data.currentRole
        });

        // 自动保存消息到数据库
        this.saveChat(false).catch(err => {
          console.error('AI响应自动保存失败:', err);
        });

        return true;
      } else if (response && response.error) {
        // 如果有错误信息，显示错误
        wx.showToast({
          title: response.error,
          icon: 'none'
        });
        return false;
      } else {
        // 其他未知错误
        wx.showToast({
          title: '响应失败，请重试',
          icon: 'none'
        });
        return false;
      }
    } catch (err) {
      console.error('获取AI响应失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '响应失败，请重试',
        icon: 'none'
      });
      return false;
    }
  },

  /**
   * 跳转到角色管理页面
   */
  goToRoleManage() {
    // 保存当前对话
    if (this.data.messages.length > 0 && this.data.currentRole) {
      this.saveChat(false).catch(err => {
        console.error('保存聊天记录失败:', err);
      });
    }

    // 隐藏角色选择器
    this.setData({ showRoleSelector: false });

    // 跳转到角色管理页面
    wx.navigateTo({
      url: '/pages/user/role/index'
    });
  }
});

