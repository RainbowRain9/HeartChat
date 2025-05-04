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

// 导入辅助模块
const dbHelper = require('../../utils/dbHelper');
const emotionHelper = require('../../utils/emotionHelper');
const chatHelper = require('../../utils/chatHelper');
const roleHelper = require('../../utils/roleHelper');
const uiHelper = require('../../utils/uiHelper');
const { updateChatCount } = require('../../utils/stats');
const { EmotionTypeLabels, EmotionTypeColors } = require('../../models/emotion');
const emotionService = require('../../services/emotionService');

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

      // 检查系统主题
      uiHelper.checkSystemTheme(this);

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
            const chatHistoryLoaded = uiHelper.checkChatHistoryLoaded(this);
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
      uiHelper.handleError(err, 'onLoad');
      wx.hideLoading();
    }
  },

  onUnload() {
    // 保存数据
    Promise.all([
      this.saveChat(),
      this.updateRoleUsage()
    ]).catch(err => {
      uiHelper.handleError(err, 'unload');
    });
  },

  /**
   * 聊天相关功能
   */
  // 保存聊天记录
  async saveChat(showUI = true) {
    try {
      // 使用chatHelper模块保存聊天记录
      const result = await chatHelper.saveChat({
        messages: this.data.messages,
        currentRole: this.data.currentRole,
        userInfo: this.data.userInfo,
        emotionAnalysis: this.data.emotionAnalysis,
        showUI: showUI
      });

      return result.chatId;
    } catch (err) {
      console.error('保存聊天记录失败:', err);
      if (showUI) {
        wx.hideLoading();
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
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

      // 使用dbHelper模块更新角色使用时长
      return await dbHelper.updateRoleUsage(
        this.data.currentRole._id,
        this.data.userInfo.openId || this.data.userInfo.userId
      );
    } catch (err) {
      console.error('更新角色使用时长失败:', err);
      // 不抛出异常，避免影响用户体验
      return null;
    }
  },

  // 加载聊天历史
  async loadChatHistory(showLoading = false) {
    try {
      // 使用chatHelper模块加载聊天历史
      const result = await chatHelper.loadChatHistory({
        userInfo: this.data.userInfo,
        currentRole: this.data.currentRole,
        showLoading: showLoading
      });

      if (result.success) {
        this.setData({
          messages: result.messages,
          emotionAnalysis: result.emotionAnalysis
        });
      } else {
        // 如果没有找到数据，设置空数组
        this.setData({
          messages: [],
          emotionAnalysis: {
            type: 'neutral',
            intensity: 0.5,
            suggestions: []
          }
        });
      }
    } catch (err) {
      console.error('加载聊天记录失败:', err);
      uiHelper.handleError(err, 'loadChatHistory');
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
    }
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
      const history = chatHelper.buildMessageHistory({
        currentMessage: message,
        messages: this.data.messages,
        currentRole: this.data.currentRole
      });

      // 保存用户消息
      const saveResult = await chatHelper.saveUserMessage({
        message,
        messages: this.data.messages,
        userInfo: this.data.userInfo,
        currentRole: this.data.currentRole
      });

      if (saveResult.success) {
        this.setData({ messages: saveResult.messages });
      }

      // 显示加载状态
      wx.showLoading({
        title: '正在思考...',
        mask: true
      });

      // 调用AI服务
      const response = await chatHelper.callAIService({
        message,
        history,
        botId: this.data.agentConfig.botId,
        roleInfo: this.data.currentRole
      });

      // 隐藏加载状态
      wx.hideLoading();

      // 处理AI响应
      if (response && response.content) {
        const handleResult = await chatHelper.handleAIResponse({
          content: response.content,
          messages: this.data.messages,
          currentRole: this.data.currentRole
        });

        if (handleResult.success) {
          this.setData({ messages: handleResult.messages });
        }

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
      uiHelper.handleError(err, 'beforeSendMessage');
      wx.hideLoading(); // 确保加载提示被隐藏
      return false;
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

  // 加载角色列表
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

      // 使用roleHelper模块获取角色列表
      const roleList = await roleHelper.getRoleList({
        userId: this.data.userInfo.userId,
        showLoading: false,
        useCache: true
      });

      // 处理角色数据
      if (roleList.length > 0) {
        // 添加category字段
        const processedRoles = this.preprocessRoles(roleList);

        // 更新状态
        this.setData({
          roleList: processedRoles,
          currentRole: processedRoles[0]
        });

        // 更新Agent配置
        if (processedRoles[0]) {
          roleHelper.updateAgentConfig(processedRoles[0], this.agentUI);
        }
      } else {
        // 加载默认角色
        this.loadDefaultRoles();
      }

      wx.hideLoading();
    } catch (error) {
      console.error('加载角色列表失败:', error);
      uiHelper.handleError(error, 'loadRoles');
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

    // 添加category字段
    const processedRoles = this.preprocessRoles(defaultRoles);

    this.setData({
      roleList: processedRoles,
      currentRole: processedRoles[0]
    });

    roleHelper.updateAgentConfig(processedRoles[0], this.agentUI);

    wx.showToast({
      title: '使用默认角色，可点击管理创建个人角色',
      icon: 'none',
      duration: 3000
    });
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
      roleHelper.updateAgentConfig(role, this.agentUI);

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
      const chatHistoryLoaded = uiHelper.checkChatHistoryLoaded(this);
      console.log('历史对话加载完成, 加载状态:', chatHistoryLoaded ? '成功' : '未找到记录');

      // 记录角色使用，但不增加使用次数，因为使用次数基于历史消息数量
      console.log('记录角色使用时间...');
      await dbHelper.recordRoleUsage(roleId, this.data.userInfo.openId || this.data.userInfo.userId);

      // 不显示成功提示，后台静默切换
      console.log(`已切换到${role.role_name}`);

      console.log('角色切换完成');

    } catch (err) {
      console.error('[switchRole]错误:', err);
      uiHelper.handleError(err, 'switchRole');
      wx.hideLoading();
    }
  },

  /**
   * 情感分析相关
   */
  async analyzeEmotion(text) {
    try {
      // 使用emotionHelper模块分析情感
      const result = await emotionHelper.analyzeAndSaveEmotion(text, {
        history: this.data.messages.slice(-5), // 最多取最近5条消息
        roleId: this.data.currentRole ? this.data.currentRole._id : null,
        chatId: this.data.chatId || null,
        userId: this.data.userInfo ? this.data.userInfo.userId : null,
        roleName: this.data.currentRole ? this.data.currentRole.role_name : '',
        saveRecord: false // 不自动保存记录，等用户确认后再保存
      });

      if (result) {
        // 更新状态
        this.setData({
          emotionAnalysis: result,
          prevEmotionAnalysis: this.data.emotionAnalysis // 保存上一次的情感分析结果
        });

        // 更新本地缓存中的情感分析结果
        try {
          const cacheKey = `chatHistory_${this.data.currentRole ? this.data.currentRole._id : 'default'}`;
          wx.setStorageSync(`${cacheKey}_emotion`, result);
          console.log('情感分析结果已更新到本地缓存');
        } catch (cacheErr) {
          console.error('更新情感分析缓存失败:', cacheErr);
        }

        console.log('情感分析完成，结果已更新');
        return true;
      } else {
        console.warn('情感分析返回空结果');
        return false;
      }
    } catch (err) {
      console.error('情感分析失败:', err);
      uiHelper.handleError(err, 'analyzeEmotion');
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
      uiHelper.showEmotionPanel(this);

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
      uiHelper.handleError(err, 'saveEmotion');
      wx.hideLoading();
      return false;
    }
  },

  /**
   * 界面交互相关
   */
  // 显示角色选择器
  showRoleSelector() {
    uiHelper.showRoleSelector(this);
  },

  // 隐藏角色选择器
  hideRoleSelector() {
    uiHelper.hideRoleSelector(this);
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

  // 处理触摸事件
  handleTouchStart(e) {
    uiHelper.handleTouchStart(e, this);
  },

  handleTouchMove(e) {
    uiHelper.handleTouchMove(e, this);
  },

  handleTouchEnd() {
    uiHelper.handleTouchEnd(this);
  },

  // 切换分析视图
  toggleAnalysisView() {
    uiHelper.toggleAnalysisView(this);
  },

  // 检查系统主题
  checkSystemTheme() {
    uiHelper.checkSystemTheme(this);
  },

  // 切换深色模式
  toggleDarkMode() {
    uiHelper.toggleDarkMode(this, app);
  },

  /**
   * 情感分析面板相关
   */
  // 显示情感分析面板
  showEmotionPanel() {
    uiHelper.showEmotionPanel(this);
  },

  // 关闭情感分析面板
  closeEmotionPanel() {
    uiHelper.closeEmotionPanel(this);
  },

  // 显示情感历史记录
  showEmotionHistory() {
    uiHelper.showEmotionHistory(this);
  },

  // 关闭情感历史记录
  closeEmotionHistory() {
    uiHelper.closeEmotionHistory(this);
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
