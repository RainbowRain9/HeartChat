// packageChat/pages/chat/chat.js
// 导入情感分析服务
const emotionService = require('../../../services/emotionService');
// 导入聊天缓存服务
const chatCacheService = require('../../../services/chatCacheService');
// 导入关键词服务
const keywordService = require('../../../services/keywordService');
// 导入用户兴趣服务
const userInterestsService = require('../../../services/userInterestsService');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    roleId: '',
    role: null,
    chatId: '',
    messages: [],
    loading: true,
    sending: false,
    loadingHistory: false,
    hasMoreHistory: true,
    showEmotionAnalysis: false,
    emotionAnalysis: null,
    statusBarHeight: 0,
    navBarHeight: 44,
    menuButtonInfo: null,
    systemInfo: null,
    refreshing: false,
    currentPage: 1,
    fromCache: false,
    pendingAiMessages: null,    // 待显示的AI消息数组
    currentAiMessageIndex: 0,   // 当前显示的AI消息索引
    darkMode: false,            // 暗夜模式状态
    keyboardHeight: 0,          // 键盘高度
    isKeyboardShow: false,      // 键盘是否显示
    manualScroll: false, // 是否手动滚动
    lastScrollTop: 0, // 上次滚动位置
    openId: '', // 用户ID
    // 默认情绪分析数据结构
    defaultEmotionData: {
      primary_emotion: 'calm',
      secondary_emotions: [],
      intensity: 0.5,
      valence: 0,
      arousal: 0.5,
      trend: 'stable',
      attention_level: 'medium',
      topic_keywords: [],
      emotion_triggers: [],
      suggestions: ['继续保持对话'],
      summary: '您的情绪状态相对平静',
      radar_dimensions: {
        trust: 0.5,
        openness: 0.5,
        resistance: 0.5,
        stress: 0.5,
        control: 0.5
      }
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取状态栏高度和胶囊按钮位置
    this.getSystemInfo();

    // 加载图片资源
    this.loadImageResources();

    // 获取用户画像数据
    this.getUserPerception();

    // 获取用户ID
    this.getUserId();

    // 获取全局暗夜模式设置
    const app = getApp();
    if (app && app.globalData) {
      this.setData({
        darkMode: app.globalData.darkMode || false
      });
    }

    // 监听键盘高度变化
    this.watchKeyboard();

    console.log('页面加载参数:', options);
    if (options.roleId) {
      this.setData({
        roleId: options.roleId
      });

      // 先加载角色信息
      this.loadRoleInfo(options.roleId).then(roleInfo => {
        if (!roleInfo) {
          console.error('加载角色信息失败');
          return;
        }

        // 检查是否有与该角色的历史聊天记录
        wx.cloud.callFunction({
          name: 'chat',
          data: {
            action: 'checkChatExists',
            roleId: options.roleId
          }
        }).then(result => {
          if (result && result.result && result.result.exists) {
            // 存在历史聊天，先尝试从缓存加载
            const chatId = result.result.chatId;
            console.log('存在历史聊天:', chatId);

            // 尝试从缓存加载最新消息
            const cachedMessages = chatCacheService.loadMessagesFromCache(chatId || `temp_${options.roleId}`);

            if (cachedMessages && cachedMessages.length > 0) {
              console.log('从缓存加载了最新消息:', cachedMessages.length);
              this.setData({
                chatId,
                messages: cachedMessages,
                loading: false,
                fromCache: true
              });
              this.scrollToBottom();

              // 后台静默加载最新消息，确保数据是最新的
              this.loadChatHistory(true);
            } else {
              // 缓存中没有数据，但存在历史聊天，从服务器加载
              this.setData({ chatId });
              this.loadChatHistory();
            }
          } else {
            // 不存在历史聊天，创建新的聊天
            console.log('不存在历史聊天，创建新的聊天');
            this.loadChatHistory();
          }
        }).catch(error => {
          console.error('检查聊天存在失败:', error);
          // 出错时仍然尝试加载聊天历史
          this.loadChatHistory();
        });
      });
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
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 保存聊天记录到云端
    this.saveChatHistory();

    // 保存聊天记录到本地缓存
    if (this.data.chatId && this.data.messages.length > 0) {
      chatCacheService.saveMessagesToCache(
        this.data.chatId,
        this.data.messages,
        true,
        null,
        this.data.role
      );
      console.log('已保存聊天记录到本地缓存');
    }

    // 移除键盘监听
    this.unwatchKeyboard();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 如果页面已经加载完成，滚动到底部
    if (!this.data.loading && this.data.messages.length > 0) {
      this.scrollToBottom();
    }

    // 检查暗夜模式变化
    const app = getApp();
    if (app && app.globalData && this.data.darkMode !== app.globalData.darkMode) {
      this.setData({
        darkMode: app.globalData.darkMode
      });
    }
  },

  /**
   * 加载角色信息
   * @param {string} roleId 角色ID，可选，如果不提供则使用this.data.roleId
   * @returns {Promise} 返回一个Promise
   */
  async loadRoleInfo(roleId) {
    try {
      const targetRoleId = roleId || this.data.roleId;

      if (!targetRoleId) {
        throw new Error('角色ID不能为空');
      }

      // 使用新的roles云函数
      const result = await wx.cloud.callFunction({
        name: 'roles',
        data: {
          action: 'getRoleDetail',
          roleId: targetRoleId
        }
      });

      if (result && result.result && result.result.success && result.result.role) {
        this.setData({
          role: result.result.role,
          roleId: targetRoleId
        });

        // 更新角色系统提示，包含用户画像信息
        // 由于现在updateRoleSystemPrompt是异步函数，需要等待它完成
        await this.updateRoleSystemPrompt();

        return result.result.role;
      } else {
        throw new Error('获取角色信息失败: ' + JSON.stringify(result.result));
      }
    } catch (error) {
      console.error('加载角色信息失败:', error);
      wx.showToast({
        title: '加载角色信息失败',
        icon: 'none'
      });
      return null;
    }
  },

  /**
   * 加载聊天历史
   * @param {boolean} silentLoad 是否静默加载（不显示加载中状态）
   */
  async loadChatHistory(silentLoad = false) {
    try {
      if (!silentLoad) {
        this.setData({ loadingHistory: true });
      }

      // 计算跳过的消息数量
      const skip = (this.data.currentPage - 1) * chatCacheService.PAGE_SIZE;

      const result = await wx.cloud.callFunction({
        name: 'chat',
        data: {
          action: 'getChatHistory',
          roleId: this.data.roleId,
          skip: skip,
          limit: chatCacheService.PAGE_SIZE
        }
      });

      if (result && result.result) {
        const { chatId, messages, hasMore } = result.result;

        // 如果有历史消息，添加到消息列表前面
        if (messages && messages.length > 0) {
          // 处理消息时间戳和显示标志
          // 首先按时间戳排序消息
          messages.sort((a, b) => {
            const aTime = parseInt(a.timestamp) || 0;
            const bTime = parseInt(b.timestamp) || 0;
            return aTime - bTime;
          });

          // 处理分段消息
          const messageMap = {};
          const segmentGroups = {};

          // 首先将所有消息按ID存入映射
          messages.forEach(msg => {
            messageMap[msg._id] = msg;

            // 如果是分段消息，按原始消息ID分组
            if (msg.isSegment && msg.originalMessageId) {
              if (!segmentGroups[msg.originalMessageId]) {
                segmentGroups[msg.originalMessageId] = [];
              }
              segmentGroups[msg.originalMessageId].push(msg);
            }
          });

          // 处理每个分段消息组，确保按分段索引排序
          Object.keys(segmentGroups).forEach(originalId => {
            segmentGroups[originalId].sort((a, b) => {
              return (a.segmentIndex || 0) - (b.segmentIndex || 0);
            });
          });

          // 处理消息时间戳和显示标志
          const processedMessages = messages.map((msg, index) => {
            // 确保消息有有效的时间戳
            if (!msg.timestamp || isNaN(msg.timestamp) || msg.timestamp === 'NaN') {
              msg.timestamp = Date.now();
              console.log('修复历史消息时间戳:', msg.timestamp);
            }

            // 添加时间戳显示标志
            msg.showTimestamp = this.shouldShowTimestamp(msg, messages[index - 1]);

            return msg;
          });

          // 如果是首次加载或刷新，替换消息列表
          if (this.data.currentPage === 1) {
            this.setData({
              chatId,
              messages: processedMessages.reverse(),
              hasMoreHistory: hasMore,
              fromCache: false
            });

            // 保存到缓存
            chatCacheService.saveMessagesToCache(
              chatId,
              processedMessages,
              true,
              null,
              this.data.role
            );
          } else {
            // 如果是加载更多，则添加到当前消息列表前面
            // 合并消息，避免重复
            const existingIds = new Set(this.data.messages.map(msg => msg._id));
            const newMessages = processedMessages.filter(msg => !existingIds.has(msg._id));

            this.setData({
              chatId,
              messages: [...newMessages.reverse(), ...this.data.messages],
              hasMoreHistory: hasMore
            });

            // 保存到缓存
            if (newMessages.length > 0) {
              chatCacheService.saveMessagesToCache(
                chatId,
                newMessages,
                false,
                this.data.currentPage,
                this.data.role
              );
            }
          }
        } else if (chatId) {
          // 如果没有历史消息但有聊天ID，说明是新的聊天
          this.setData({
            chatId,
            hasMoreHistory: false
          });
        }
      } else {
        throw new Error('获取聊天历史失败');
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error);
      if (!silentLoad) {
        wx.showToast({
          title: '加载历史失败',
          icon: 'none'
        });
      }
    } finally {
      this.setData({
        loading: false,
        loadingHistory: false,
        refreshing: false
      });

      // 只在确认没有历史消息时才显示欢迎消息
      // 判断条件：1. 消息列表为空 2. 有角色信息 3. 不是从缓存加载的
      if (this.data.messages.length === 0 && this.data.role && !this.data.fromCache) {
        // 检查是否有聊天ID，如果有则说明是新的聊天
        if (this.data.chatId) {
          console.log('新的聊天，显示欢迎消息');
          this.addWelcomeMessage();
        } else {
          console.log('没有聊天ID，不显示欢迎消息');
        }
      }

      // 滚动到底部
      this.scrollToBottom();
    }
  },

  /**
   * 添加欢迎消息
   * @param {boolean} force 是否强制显示欢迎消息，即使有历史消息
   */
  addWelcomeMessage(force = false) {
    if (!this.data.role) return;

    // 如果有历史消息且不是强制显示，则不显示欢迎消息
    if (this.data.messages.length > 0 && !force) {
      console.log('已有历史消息，不显示欢迎消息');
      return;
    }

    const currentTime = Date.now();
    console.log('欢迎消息时间戳:', currentTime);

    // 根据角色类型生成不同的欢迎语
    let welcomeContent = '';

    // 如果角色有自定义欢迎语，优先使用
    if (this.data.role.welcome && this.data.role.welcome.trim()) {
      welcomeContent = this.data.role.welcome;
    } else {
      // 根据角色关系类型生成不同的欢迎语
      const relationshipType = this.data.role.relationship_type || '';

      switch (relationshipType.toLowerCase()) {
        case 'friend':
        case '朋友':
          welcomeContent = `嘉嘉，好久不见了！最近怎么样？有什么想聊的吗？`;
          break;
        case 'family':
        case '家人':
          welcomeContent = `亲爱的，最近身体还好吗？有什么想和我分享的吗？`;
          break;
        case 'colleague':
        case '同事':
          welcomeContent = `嘉嘉，工作还顺利吗？有什么我能帮到你的吗？`;
          break;
        case 'mentor':
        case '导师':
          welcomeContent = `很高兴再次见到你。你最近的学习和思考有什么新的发现吗？`;
          break;
        case 'partner':
        case '伴侣':
          welcomeContent = `亲爱的，我好想你啊！今天想聊什么呢？`;
          break;
        case 'therapist':
        case '心理医生':
          welcomeContent = `很高兴见到你。今天感觉怎么样？有什么想要分享或讨论的吗？`;
          break;
        case 'other':
        case '其他':
        default:
          welcomeContent = `你好，很高兴与你交流。今天有什么想聊的吗？`;
          break;
      }
    }

    const welcomeMessage = {
      _id: 'welcome_' + currentTime,
      chat_id: this.data.chatId,
      sender_type: 'ai',
      content: welcomeContent,
      timestamp: currentTime,
      showTimestamp: true // 欢迎消息始终显示时间戳
    };

    // 打印消息对象以检查结构
    console.log('欢迎消息对象:', welcomeMessage);

    // 确保时间戳是数字类型
    if (typeof welcomeMessage.timestamp !== 'number') {
      welcomeMessage.timestamp = parseInt(welcomeMessage.timestamp) || currentTime;
    }

    this.setData({
      messages: [...this.data.messages, welcomeMessage]
    });

    // 滚动到底部
    this.scrollToBottom();
  },

  /**
   * 加载更多历史消息
   */
  async loadMoreHistory() {
    if (this.data.loadingHistory || !this.data.hasMoreHistory) return;

    // 显示加载状态
    this.setData({ loadingHistory: true });
    console.log('开始加载更多历史消息');

    try {
      // 先尝试从缓存加载
      const nextPage = this.data.currentPage + 1;
      const cachedMessages = chatCacheService.loadMessagesFromCache(this.data.chatId, nextPage);

      if (cachedMessages && cachedMessages.length > 0) {
        console.log(`从缓存加载第${nextPage}页消息:`, cachedMessages.length);

        // 合并消息，避免重复
        const existingIds = new Set(this.data.messages.map(msg => msg._id));
        const newMessages = cachedMessages.filter(msg => !existingIds.has(msg._id));

        if (newMessages.length > 0) {
          this.setData({
            messages: [...newMessages, ...this.data.messages],
            currentPage: nextPage,
            hasMoreHistory: newMessages.length >= chatCacheService.PAGE_SIZE, // 如果返回不足一页，认为没有更多了
            loadingHistory: false
          });
          return;
        }
      }

      // 缓存中没有数据，从服务器加载
      console.log('缓存中没有数据，从服务器加载第', nextPage, '页');

      // 调用云函数获取历史消息
      const result = await wx.cloud.callFunction({
        name: 'chat',
        data: {
          action: 'getChatHistory',
          roleId: this.data.roleId,
          skip: (nextPage - 1) * chatCacheService.PAGE_SIZE,
          limit: chatCacheService.PAGE_SIZE
        }
      });

      if (result && result.result) {
        const { chatId, messages, hasMore } = result.result;

        if (messages && messages.length > 0) {
          // 处理消息时间戳和显示标志
          // 首先按时间戳排序消息
          messages.sort((a, b) => {
            const aTime = parseInt(a.timestamp) || 0;
            const bTime = parseInt(b.timestamp) || 0;
            return aTime - bTime;
          });

          // 处理分段消息
          const messageMap = {};
          const segmentGroups = {};

          // 首先将所有消息按ID存入映射
          messages.forEach(msg => {
            messageMap[msg._id] = msg;

            // 如果是分段消息，按原始消息ID分组
            if (msg.isSegment && msg.originalMessageId) {
              if (!segmentGroups[msg.originalMessageId]) {
                segmentGroups[msg.originalMessageId] = [];
              }
              segmentGroups[msg.originalMessageId].push(msg);
            }
          });

          // 处理每个分段消息组，确保按分段索引排序
          Object.keys(segmentGroups).forEach(originalId => {
            segmentGroups[originalId].sort((a, b) => {
              return (a.segmentIndex || 0) - (b.segmentIndex || 0);
            });
          });

          // 处理消息时间戳和显示标志
          const processedMessages = messages.map((msg, index) => {
            if (!msg.timestamp || isNaN(msg.timestamp) || msg.timestamp === 'NaN') {
              msg.timestamp = Date.now();
            }

            // 添加时间戳显示标志
            msg.showTimestamp = this.shouldShowTimestamp(msg, messages[index - 1]);

            return msg;
          });

          // 合并消息，避免重复
          const existingIds = new Set(this.data.messages.map(msg => msg._id));
          const newMessages = processedMessages.filter(msg => !existingIds.has(msg._id));

          if (newMessages.length > 0) {
            this.setData({
              chatId,
              messages: [...newMessages.reverse(), ...this.data.messages],
              hasMoreHistory: hasMore,
              currentPage: nextPage
            });

            // 保存到缓存
            chatCacheService.saveMessagesToCache(
              chatId,
              newMessages,
              false,
              nextPage,
              this.data.role
            );
          } else {
            this.setData({
              hasMoreHistory: false
            });
          }
        } else {
          this.setData({
            hasMoreHistory: false
          });
        }
      }
    } catch (error) {
      console.error('加载更多历史消息失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loadingHistory: false });
    }
  },

  /**
   * 下拉刷新
   */
  async onRefresh() {
    if (this.data.refreshing) return;

    this.setData({
      refreshing: true,
      currentPage: 1 // 重置到第一页
    });

    try {
      console.log('开始下拉刷新，获取最新消息');

      // 调用云函数获取最新消息
      const result = await wx.cloud.callFunction({
        name: 'chat',
        data: {
          action: 'getChatHistory',
          roleId: this.data.roleId,
          skip: 0,
          limit: chatCacheService.PAGE_SIZE
        }
      });

      if (result && result.result) {
        const { chatId, messages, hasMore } = result.result;

        if (messages && messages.length > 0) {
          // 处理消息时间戳和显示标志
          // 首先按时间戳排序消息
          messages.sort((a, b) => {
            const aTime = parseInt(a.timestamp) || 0;
            const bTime = parseInt(b.timestamp) || 0;
            return aTime - bTime;
          });

          // 处理分段消息
          const messageMap = {};
          const segmentGroups = {};

          // 首先将所有消息按ID存入映射
          messages.forEach(msg => {
            messageMap[msg._id] = msg;

            // 如果是分段消息，按原始消息ID分组
            if (msg.isSegment && msg.originalMessageId) {
              if (!segmentGroups[msg.originalMessageId]) {
                segmentGroups[msg.originalMessageId] = [];
              }
              segmentGroups[msg.originalMessageId].push(msg);
            }
          });

          // 处理每个分段消息组，确保按分段索引排序
          Object.keys(segmentGroups).forEach(originalId => {
            segmentGroups[originalId].sort((a, b) => {
              return (a.segmentIndex || 0) - (b.segmentIndex || 0);
            });
          });

          // 处理消息时间戳和显示标志
          const processedMessages = messages.map((msg, index) => {
            if (!msg.timestamp || isNaN(msg.timestamp) || msg.timestamp === 'NaN') {
              msg.timestamp = Date.now();
            }

            // 添加时间戳显示标志
            msg.showTimestamp = this.shouldShowTimestamp(msg, messages[index - 1]);

            return msg;
          });

          this.setData({
            chatId,
            messages: processedMessages.reverse(),
            hasMoreHistory: hasMore,
            fromCache: false
          });

          // 保存到缓存
          chatCacheService.saveMessagesToCache(
            chatId,
            processedMessages,
            true,
            null,
            this.data.role
          );

          wx.showToast({
            title: '刷新成功',
            icon: 'success',
            duration: 1500
          });
        } else if (chatId) {
          // 如果没有消息但有聊天ID，说明是新的聊天
          this.setData({
            chatId,
            messages: [],
            hasMoreHistory: false
          });

          // 添加欢迎消息
          this.addWelcomeMessage();
        }
      }
    } catch (error) {
      console.error('下拉刷新失败:', error);
      wx.showToast({
        title: '刷新失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ refreshing: false });
      // 滚动到底部
      this.scrollToBottom();
    }
  },

  /**
   * 发送消息
   */
  async handleSendMessage(e) {
    const { content } = e.detail;
    if (!content.trim()) return;

    // 添加用户消息到列表
    const currentTime = Date.now();
    console.log('用户消息时间戳:', currentTime);

    const userMessage = {
      _id: 'temp_' + currentTime,
      chat_id: this.data.chatId,
      sender_type: 'user',
      content,
      timestamp: currentTime
    };

    // 判断是否显示时间戳
    const messages = this.data.messages;
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    userMessage.showTimestamp = this.shouldShowTimestamp(userMessage, lastMessage);

    console.log('用户消息对象:', userMessage);

    // 确保时间戳是数字类型
    if (typeof userMessage.timestamp !== 'number') {
      userMessage.timestamp = parseInt(userMessage.timestamp) || currentTime;
    }

    this.setData({
      messages: [...this.data.messages, userMessage],
      sending: true
    });

    // 滚动到底部
    this.scrollToBottom(0);

    try {
      // 调用云函数发送消息
      const result = await wx.cloud.callFunction({
        name: 'chat',
        data: {
          action: 'sendMessage',
          chatId: this.data.chatId,
          roleId: this.data.roleId,
          content,
          systemPrompt: this.systemPrompt // 使用包含用户画像的系统提示
        }
      });

      if (result && result.result && result.result.success) {
        // 我们已经禁用了聊天回复中的情绪分析功能
        // 不再使用云函数返回的emotionAnalysis参数
        const { chatId, message, aiMessages } = result.result;

        // 更新用户消息
        const updatedMessages = [...this.data.messages];
        const userMessageIndex = updatedMessages.findIndex(msg => msg._id === userMessage._id);

        if (userMessageIndex !== -1) {
          // 更新用户消息
          updatedMessages[userMessageIndex] = message;

          // 我们已经禁用了聊天回复中的情绪分析功能
          // 情绪分析将完全由专门的云函数 @cloudfunctions\analysis/ 处理
          // 在analyzeUserEmotion函数中处理情绪标签
        }

        // 处理AI回复消息
        if (aiMessages && aiMessages.length > 0) {
          // 处理每个AI消息
          aiMessages.forEach(msg => {
            // 处理AI回复中的JSON标记
            if (msg.content) {
              msg.content = msg.content.replace(/```json[\s\S]*?```/g, '');
              msg.content = msg.content.trim();
            }

            // 确保消息有有效的时间戳
            if (!msg.timestamp || isNaN(msg.timestamp)) {
              msg.timestamp = Date.now();
            }
          });

          // 设置初始状态，准备分段显示消息
          this.setData({
            chatId,
            messages: updatedMessages,
            sending: true,
            pendingAiMessages: aiMessages,
            currentAiMessageIndex: 0
          });

          // 开始逐个显示AI消息，模拟打字效果
          this.showNextAiMessage();
        } else {
          // 没有AI消息，直接更新状态
          this.setData({
            chatId,
            messages: updatedMessages,
            sending: false
          });
        }

        // 保存最新消息到缓存
        chatCacheService.saveMessagesToCache(
          chatId,
          updatedMessages,
          true,
          null,
          this.data.role
        );

        // 我们已经禁用了聊天回复中的情绪分析功能
        // 情绪分析将完全由专门的云函数 @cloudfunctions\analysis/ 处理
        // 手动进行情绪分析
        this.analyzeUserEmotion(content, message._id);
      } else {
        throw new Error(result?.result?.error || '发送消息失败');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      wx.showToast({
        title: '发送失败，请重试',
        icon: 'none'
      });
      this.setData({ sending: false });
    }

    // 在消息发送完成后，再次滚动到底部
    wx.nextTick(() => {
      this.scrollToBottom(100);
    });
  },

  /**
   * 分析用户情绪
   * @param {string} text 用户消息文本
   * @param {string} messageId 可选，指定要更新情绪的消息 ID
   */
  async analyzeUserEmotion(text, messageId = null) {
    try {
      // 准备历史消息作为上下文
      const history = this.data.messages.slice(-5).map(msg => ({
        role: msg.sender_type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      console.log('开始分析情绪, 文本:', text);
      console.log('历史消息:', history);

      // 并行处理情绪分析和关键词提取
      const [emotionResult, keywords] = await Promise.all([
        // 调用情绪分析服务
        emotionService.analyzeEmotion(text, {
          history: history,
          saveRecord: true,
          roleId: this.data.roleId,
          chatId: this.data.chatId
        }),
        // 提取关键词
        keywordService.extractKeywords(text, 5)
      ]);

      console.log('情绪分析结果:', emotionResult);
      console.log('关键词提取结果:', keywords);

      // 如果提取到关键词，更新用户兴趣
      if (keywords && keywords.length > 0) {
        // 获取用户ID
        // 优先使用全局用户信息中的openid
        const app = getApp();
        const userInfo = app.globalData.userInfo;
        let openId = null;

        if (userInfo) {
          // 优先使用全局用户信息中的openid
          if (userInfo.openid) {
            openId = userInfo.openid;
          } else if (userInfo.stats && userInfo.stats.openid) {
            openId = userInfo.stats.openid;
          }
        }

        // 如果全局用户信息中没有openid，尝试从本地缓存中获取
        if (!openId) {
          openId = wx.getStorageSync('openId');
        }

        console.log('尝试获取用户ID结果:', openId);
        console.log('全局用户信息:', userInfo);

        if (openId) {
          // 1. 先将关键词分类
          wx.cloud.callFunction({
            name: 'analysis',
            data: {
              type: 'classify_keywords',
              keywords: keywords.map(k => k.word),
              batch: true
            }
          }).then(classifyResult => {
            console.log('关键词分类结果:', JSON.stringify(classifyResult, null, 2));

            // 如果分类成功，将分类结果应用到关键词上
            if (classifyResult.result && classifyResult.result.success &&
              classifyResult.result.data && classifyResult.result.data.classifications) {

              const classifications = classifyResult.result.data.classifications;
              console.log('分类结果详情:', JSON.stringify(classifications, null, 2));

              const categoryMap = {};
              classifications.forEach(item => {
                categoryMap[item.keyword] = item.category;
              });

              console.log('分类映射:', JSON.stringify(categoryMap, null, 2));

              // 更新关键词对象的分类
              keywords.forEach(keyword => {
                if (categoryMap[keyword.word]) {
                  keyword.category = categoryMap[keyword.word];
                  console.log(`关键词 ${keyword.word} 分类为 ${keyword.category}`);
                } else {
                  keyword.category = '未分类';
                  console.log(`关键词 ${keyword.word} 没有分类结果，使用默认分类`);
                }
              });

              console.log('分类后的关键词数据:', JSON.stringify(keywords, null, 2));

              // 创建分类统计数据
              const categoryStats = {};
              keywords.forEach(keyword => {
                if (keyword.category) {
                  categoryStats[keyword.category] = (categoryStats[keyword.category] || 0) + 1;
                }
              });

              console.log('分类统计:', JSON.stringify(categoryStats, null, 2));

              // 创建分类数组
              const categoriesArray = Object.entries(categoryStats).map(([name, count]) => ({
                name,
                count,
                firstSeen: new Date(),
                lastUpdated: new Date()
              }));

              console.log('分类数组:', JSON.stringify(categoriesArray, null, 2));
            } else {
              console.warn('关键词分类结果格式不正确:', classifyResult);
            }

            // 2. 更新用户兴趣
            console.log('准备更新的关键词数据:', JSON.stringify(keywords, null, 2));
            userInterestsService.batchUpdateUserInterests(
              openId,
              keywords,
              true, // 自动分类
              categoryStats, // 传递分类统计
              categoriesArray // 传递分类数组
            )
              .then(result => {
                const success = result && result.success;
                console.log('更新用户兴趣' + (success ? '成功' : '失败'));
                console.log('更新用户兴趣返回结果:', result);

                // 3. 如果有情绪分析结果，关联关键词与情绪
                if (emotionResult && emotionResult.data) {
                  // 异步调用云函数关联关键词与情绪
                  const emotionData = {
                    type: 'link_keywords_emotion',
                    userId: openId,
                    keywords: keywords.map(k => k.word),
                    emotionResult: emotionResult.data
                  };
                  console.log('准备关联关键词与情绪的数据:', JSON.stringify(emotionData, null, 2));

                  wx.cloud.callFunction({
                    name: 'analysis',
                    data: emotionData
                  }).then(linkResult => {
                    console.log('关联关键词与情绪结果:', linkResult);
                    // 获取最新的用户兴趣数据以验证更新
                    userInterestsService.getUserInterests(openId, true)
                      .then(interestsData => {
                        console.log('更新后的用户兴趣数据:', interestsData);
                      })
                      .catch(err => {
                        console.error('获取用户兴趣数据异常:', err);
                      });
                  }).catch(err => {
                    console.error('关联关键词与情绪异常:', err);
                  });
                }
              })
              .catch(err => {
                console.error('更新用户兴趣异常:', err);
              });
          }).catch(err => {
            console.error('关键词分类异常:', err);

            // 即使分类失败，也继续更新用户兴趣
            userInterestsService.batchUpdateUserInterests(openId, keywords)
              .then(success => {
                console.log('更新用户兴趣' + (success ? '成功' : '失败'));
              })
              .catch(err => {
                console.error('更新用户兴趣异常:', err);
              });
          });
        } else {
          console.warn('无法获取用户ID，无法更新用户兴趣');
        }
      }

      // 处理情绪分析结果
      // 即使服务返回错误，也尝试使用数据
      if (emotionResult && emotionResult.data) {
        // 即使没有 success 标志，也尝试使用数据
        // 将原始数据保存下来，便于调试
        const rawData = emotionResult.data;
        console.log('原始情绪数据:', rawData);

        // 直接使用原始数据，不再进行处理
        // 获取主要情绪类型用于显示标签
        const primaryEmotion = rawData.primary_emotion || rawData.type || '平静';

        // 直接使用原始数据，不再进行标准化处理
        // 标准化处理将由 emotion-dashboard 组件完成
        const standardizedData = rawData;

        console.log('使用原始情绪数据，不再进行标准化处理');

        // 更新情绪分析结果
        this.setData({
          emotionAnalysis: standardizedData
        });

        // 获取情绪类型的中文标签
        const emotionLabel = emotionService.EmotionTypeLabels[primaryEmotion] || primaryEmotion;

        // 如果指定了消息 ID，则更新该消息的情绪标签
        if (messageId) {
          const updatedMessages = [...this.data.messages];
          const messageIndex = updatedMessages.findIndex(msg => msg._id === messageId);

          if (messageIndex !== -1) {
            updatedMessages[messageIndex].emotion_type = emotionLabel;

            this.setData({
              messages: updatedMessages
            });

            console.log('更新消息情绪标签:', messageId, emotionLabel);
          }
        } else {
          // 找到最后一条用户消息并更新其情绪标签
          const updatedMessages = [...this.data.messages];
          const userMessages = updatedMessages.filter(msg => msg.sender_type === 'user');

          if (userMessages.length > 0) {
            const lastUserMessage = userMessages[userMessages.length - 1];
            const messageIndex = updatedMessages.findIndex(msg => msg._id === lastUserMessage._id);

            if (messageIndex !== -1) {
              updatedMessages[messageIndex].emotion_type = emotionLabel;

              this.setData({
                messages: updatedMessages
              });

              console.log('更新最后一条用户消息情绪标签:', lastUserMessage._id, emotionLabel);
            }
          }
        }

        return standardizedData;
      } else {
        console.error('情绪分析返回错误:', emotionResult?.error || '未知错误');
        // 使用默认数据
        this.setData({
          emotionAnalysis: this.data.defaultEmotionData
        });
        return this.data.defaultEmotionData;
      }
    } catch (error) {
      console.error('情绪分析失败:', error);
      // 失败不影响主流程，使用默认数据
      this.setData({
        emotionAnalysis: this.data.defaultEmotionData
      });
      return this.data.defaultEmotionData;
    }
  },

  /**
   * 显示情绪标签
   * @param {string} emotionType 情绪类型
   */
  showEmotionTag(emotionType) {
    // 获取情绪类型的中文标签
    const emotionLabel = emotionService.EmotionTypeLabels[emotionType] || emotionType;
    console.log('检测到情绪:', emotionLabel);

    // 不再显示Toast提示，而是直接在消息下方显示情绪标签
  },

  /**
   * 显示下一条AI消息
   */
  showNextAiMessage() {
    const { pendingAiMessages, currentAiMessageIndex } = this.data;

    if (!pendingAiMessages || currentAiMessageIndex >= pendingAiMessages.length) {
      // 所有消息已显示完毕
      this.setData({
        sending: false,
        pendingAiMessages: null,
        currentAiMessageIndex: 0
      });

      // 所有消息显示完毕后，强制滚动到底部
      wx.nextTick(() => {
        this.scrollToBottom(100, true);
      });

      return;
    }

    // 获取当前要显示的消息
    const aiMessage = pendingAiMessages[currentAiMessageIndex];

    // 计算显示延迟（根据消息长度和内容复杂度）
    const messageLength = aiMessage.content ? aiMessage.content.length : 0;

    // 基础延迟：300ms + 每个字符的延迟
    let baseDelay = 300 + messageLength * 8;

    // 根据消息类型调整延迟
    // 如果消息包含问号，可能是一个问题，增加一点延迟
    if (aiMessage.content && aiMessage.content.includes('？') || aiMessage.content.includes('?')) {
      baseDelay += 200;
    }

    // 如果是很短的回复，可能是简单的回应，减少延迟
    if (messageLength < 10) {
      baseDelay = Math.max(300, baseDelay / 2);
    }

    // 如果是第一条消息，增加一点延迟，模拟思考时间
    if (currentAiMessageIndex === 0) {
      baseDelay += 500;
    }

    // 添加随机性，使延迟看起来更自然
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2的随机因子

    // 计算最终延迟，并设置上下限
    const delay = Math.min(2000, Math.max(300, Math.floor(baseDelay * randomFactor)));

    console.log(`显示第 ${currentAiMessageIndex + 1}/${pendingAiMessages.length} 条AI消息，延迟: ${delay}ms`);

    // 添加消息到列表
    setTimeout(() => {
      // 判断是否显示时间戳
      const messages = this.data.messages;
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      aiMessage.showTimestamp = this.shouldShowTimestamp(aiMessage, lastMessage);

      this.setData({
        messages: [...messages, aiMessage],
        currentAiMessageIndex: currentAiMessageIndex + 1
      });

      // 每显示一条消息就滚动到底部，确保用户能看到最新消息
      // 使用强制滚动，即使在手动滚动模式下也滚动到底部
      this.scrollToBottom(50, true);

      // 显示下一条消息
      if (currentAiMessageIndex + 1 < pendingAiMessages.length) {
        // 在消息之间添加一个短暂的延迟，模拟打字间隔
        setTimeout(() => {
          this.showNextAiMessage();
        }, 500);
      } else {
        // 所有消息已显示完毕
        this.setData({
          sending: false,
          pendingAiMessages: null,
          currentAiMessageIndex: 0
        });

        // 所有消息显示完毕后，再次强制滚动到底部
        wx.nextTick(() => {
          this.scrollToBottom(100, true);
        });
      }
    }, delay);
  },

  /**
   * 删除消息
   */
  async handleDeleteMessage(e) {
    const { messageId } = e.detail;

    try {
      const confirmed = await new Promise((resolve) => {
        wx.showModal({
          title: '确认删除',
          content: '确定要删除这条消息吗？',
          success: (res) => {
            resolve(res.confirm);
          }
        });
      });

      if (!confirmed) return;

      // 调用云函数删除消息
      await wx.cloud.callFunction({
        name: 'chat',
        data: {
          action: 'deleteMessage',
          messageId
        }
      });

      // 更新消息列表
      const updatedMessages = this.data.messages.filter(msg => msg._id !== messageId);
      this.setData({
        messages: updatedMessages
      });

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('删除消息失败:', error);
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 保存聊天历史
   */
  async saveChatHistory() {
    if (!this.data.chatId || this.data.messages.length === 0) return;

    try {
      await wx.cloud.callFunction({
        name: 'chat',
        data: {
          action: 'saveChatHistory',
          chatId: this.data.chatId
        }
      });
    } catch (error) {
      console.error('保存聊天历史失败:', error);
    }
  },

  /**
   * 清理聊天缓存
   */
  clearChatCache() {
    if (this.data.chatId) {
      chatCacheService.clearChatCache(this.data.chatId);
      wx.showToast({
        title: '缓存已清理',
        icon: 'success'
      });
    }
  },

  /**
   * 显示情绪分析
   */
  handleShowEmotionAnalysis() {
    console.log('当前情绪分析数据:', this.data.emotionAnalysis);

    if (!this.data.emotionAnalysis || this.data.emotionAnalysis === this.data.defaultEmotionData) {
      // 如果没有情绪分析数据或者是默认数据，尝试分析最后一条用户消息
      const userMessages = this.data.messages.filter(msg => msg.sender_type === 'user');
      if (userMessages.length > 0) {
        const lastUserMessage = userMessages[userMessages.length - 1];

        // 先使用默认数据显示弹窗，同时开始分析
        this.setData({
          emotionAnalysis: this.data.defaultEmotionData,
          showEmotionAnalysis: true
        });

        // 开始分析
        this.analyzeUserEmotion(lastUserMessage.content)
          .then(data => {
            // 分析完成后更新弹窗数据
            this.setData({
              emotionAnalysis: data
            });
          })
          .catch(err => {
            console.error('分析失败:', err);
          });

        wx.showToast({
          title: '正在分析情绪...',
          icon: 'loading',
          duration: 1000
        });
      } else {
        // 没有用户消息，使用默认数据
        this.setData({
          emotionAnalysis: this.data.defaultEmotionData,
          showEmotionAnalysis: true
        });
      }
      return;
    }

    // 已有情绪分析数据，直接显示
    this.setData({
      showEmotionAnalysis: true
    });
  },

  /**
   * 关闭情绪分析
   */
  handleCloseEmotionAnalysis() {
    this.setData({
      showEmotionAnalysis: false
    });
  },

  /**
   * 处理输入框获取焦点
   */
  handleInputFocus(e) {
    console.log('输入框获取焦点:', e);
    // 设置键盘显示状态
    this.setData({
      isKeyboardShow: true,
      manualScroll: false // 输入框获取焦点时重置为自动滚动
    });

    // 滚动到底部，使用多次延时滚动确保滚动到正确位置
    wx.nextTick(() => {
      // 第一次滚动，快速响应
      this.scrollToBottom(50, true);

      // 第二次滚动，等待键盘开始弹出
      setTimeout(() => {
        this.scrollToBottom(50, true);
      }, 200);

      // 第三次滚动，等待键盘完全弹出
      setTimeout(() => {
        this.scrollToBottom(50, true);
      }, 400);
    });
  },

  /**
   * 处理输入框失去焦点
   */
  handleInputBlur(e) {
    console.log('输入框失去焦点:', e);
    // 设置键盘隐藏状态
    this.setData({
      isKeyboardShow: false
    });

    // 滚动到底部，使用多次延时滚动确保滚动到正确位置
    wx.nextTick(() => {
      // 第一次滚动，快速响应
      this.scrollToBottom(50, true);

      // 第二次滚动，等待键盘开始收起
      setTimeout(() => {
        this.scrollToBottom(100, true);
      }, 200);
    });
  },

  /**
   * 查看详细情绪分析
   */
  handleViewEmotionDetail() {
    // 关闭弹窗
    this.setData({
      showEmotionAnalysis: false
    });

    // 跳转到情绪分析页面
    wx.navigateTo({
      url: `/packageChat/pages/emotion-analysis/emotion-analysis?chatId=${this.data.chatId}&roleId=${this.data.roleId}`
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 仅用于阻止事件冒泡
    return;
  },

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    try {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      // 获取胶囊按钮位置
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();

      // 计算导航栏高度 = 胶囊底部到状态栏底部的距离 + 胶囊高度 + 胶囊顶部到状态栏顶部的距离
      const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height;

      this.setData({
        statusBarHeight: systemInfo.statusBarHeight,
        navBarHeight: navBarHeight,
        menuButtonInfo: menuButtonInfo,
        systemInfo: systemInfo
      });

      console.log('胶囊位置信息:', menuButtonInfo);
      console.log('系统信息:', systemInfo);
    } catch (e) {
      console.error('获取系统信息失败:', e);
      // 设置默认值
      this.setData({
        statusBarHeight: 20,
        navBarHeight: 44
      });
    }
  },

  /**
   * 获取用户画像
   */
  async getUserPerception() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getUserPerception'
        }
      });

      if (result.result && result.result.success) {
        this.userPerception = result.result.data;
        console.log('获取用户画像成功:', this.userPerception);
      }
    } catch (error) {
      console.error('获取用户画像失败:', error);
    }
  },

  /**
   * 获取用户ID
   */
  getUserId() {
    try {
      // 优先使用全局用户信息中的openid
      const app = getApp();
      const userInfo = app.globalData.userInfo;
      let openId = null;

      if (userInfo) {
        // 优先使用全局用户信息中的openid
        if (userInfo.openid) {
          openId = userInfo.openid;
        } else if (userInfo.stats && userInfo.stats.openid) {
          openId = userInfo.stats.openid;
        }
      }

      // 如果全局用户信息中没有openid，尝试从本地缓存中获取
      if (!openId) {
        openId = wx.getStorageSync('openId');
      }

      console.log('获取用户ID:', openId);

      if (openId) {
        this.setData({ openId });
      } else {
        console.warn('无法获取用户ID');
      }

      return openId;
    } catch (error) {
      console.error('获取用户ID失败:', error);
      return null;
    }
  },

  /**
   * 更新角色系统提示
   */
  async updateRoleSystemPrompt() {
    if (!this.data.role) return;

    try {
      // 获取用户ID
      // 优先使用全局用户信息中的openid
      const app = getApp();
      const userInfo = app.globalData.userInfo;
      let openId = null;

      if (userInfo) {
        // 优先使用全局用户信息中的openid
        if (userInfo.openid) {
          openId = userInfo.openid;
        } else if (userInfo.stats && userInfo.stats.openid) {
          openId = userInfo.stats.openid;
        }
      }

      // 如果全局用户信息中没有openid，尝试从本地缓存中获取
      if (!openId) {
        openId = wx.getStorageSync('openId');
      }

      console.log('尝试获取用户ID结果:', openId);
      console.log('全局用户信息:', userInfo);

      if (!openId) {
        console.warn('无法获取用户ID，使用默认系统提示');
        // 优先使用prompt字段，其次是system_prompt字段
        this.originalSystemPrompt = this.data.role.prompt || this.data.role.system_prompt || '';
        this.systemPrompt = this.originalSystemPrompt;
        return;
      }

      // 并行获取用户画像和用户兴趣数据
      const [userPerceptionResult, userInterestsData] = await Promise.all([
        // 获取用户画像
        this.userPerception ? Promise.resolve(this.userPerception) : wx.cloud.callFunction({
          name: 'user',
          data: {
            action: 'getUserPerception'
          }
        }).then(result => result.result && result.result.success ? result.result.data : null),
        // 获取用户兴趣数据
        userInterestsService.getInterestTagCloudData(openId)
      ]);

      // 处理用户画像数据
      const userPerception = userPerceptionResult || {};
      const { personalitySummary } = userPerception;

      // 处理用户兴趣数据
      let interestsStr = '';
      if (userPerception.interests && userPerception.interests.length > 0) {
        // 优先使用用户画像中的兴趣数据
        interestsStr = userPerception.interests.join('、');
      } else if (userInterestsData && userInterestsData.length > 0) {
        // 如果用户画像中没有兴趣数据，使用兴趣标签云数据
        // 按权重排序
        userInterestsData.sort((a, b) => b.value - a.value);
        // 取前10个兴趣
        const topInterests = userInterestsData.slice(0, 10).map(item => item.name);
        interestsStr = topInterests.join('、');
      }

      // 将用户画像信息添加到角色系统提示中
      let userProfileInfo = '';
      if (personalitySummary) {
        userProfileInfo += `用户个性: ${personalitySummary}\n`;
      }
      if (interestsStr) {
        userProfileInfo += `用户兴趣: ${interestsStr}`;
      }

      // 更新角色系统提示
      // 优先使用prompt字段，其次是system_prompt字段
      this.originalSystemPrompt = this.data.role.prompt || this.data.role.system_prompt || '';
      this.systemPrompt = userProfileInfo ? `${this.originalSystemPrompt}\n\n${userProfileInfo}` : this.originalSystemPrompt;

      console.log('更新后的系统提示:', this.systemPrompt);
    } catch (error) {
      console.error('更新角色系统提示失败:', error);
      // 出错时使用原始提示
      // 优先使用prompt字段，其次是system_prompt字段
      this.originalSystemPrompt = this.data.role.prompt || this.data.role.system_prompt || '';
      this.systemPrompt = this.originalSystemPrompt;
    }
  },

  /**
   * 处理返回按钮点击
   */
  handleBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({
          url: '/pages/home/home'
        });
      }
    });
  },

  /**
   * 加载图片资源
   */
  loadImageResources() {
    // 预加载图片资源
    wx.getImageInfo({
      src: '/images/icons/emotion.png',
      fail: (err) => {
        console.error('加载图片资源失败:', err);
      }
    });

    wx.getImageInfo({
      src: '/images/icons/back.png',
      fail: (err) => {
        console.error('加载返回图标失败:', err);
      }
    });
  },

  /**
   * 判断是否显示时间戳
   * @param {Object} currentMsg 当前消息
   * @param {Object} prevMsg 前一条消息
   * @returns {boolean} 是否显示时间戳
   */
  shouldShowTimestamp(currentMsg, prevMsg) {
    // 如果没有前一条消息，显示时间戳
    if (!prevMsg) return true;

    // 如果是欢迎消息，始终显示时间戳
    if (currentMsg._id && currentMsg._id.startsWith('welcome_')) return true;

    // 如果是分段消息的第一段，显示时间戳
    if (currentMsg.isSegment && currentMsg.segmentIndex === 0) return true;

    // 如果是分段消息的非第一段，且前一条消息是同一原始消息的分段，不显示时间戳
    if (currentMsg.isSegment && currentMsg.segmentIndex > 0 &&
      prevMsg.isSegment && prevMsg.originalMessageId === currentMsg.originalMessageId) {
      return false;
    }

    // 确保两条消息都有有效的时间戳
    const currentTime = parseInt(currentMsg.timestamp) || Date.now();
    const prevTime = parseInt(prevMsg.timestamp) || Date.now();

    // 如果时间差超过5分钟，显示时间戳
    const FIVE_MINUTES = 5 * 60 * 1000; // 5分钟的毫秒数
    return Math.abs(currentTime - prevTime) > FIVE_MINUTES;
  },

  /**
   * 监听键盘高度变化
   */
  watchKeyboard() {
    // 监听键盘高度变化
    this.keyboardHeightChangeListener = wx.onKeyboardHeightChange(res => {
      const isKeyboardShow = res.height > 0;
      console.log('键盘高度变化:', res.height, '是否显示:', isKeyboardShow);

      // 设置数据
      this.setData({
        keyboardHeight: res.height,
        isKeyboardShow: isKeyboardShow,
        manualScroll: false // 键盘弹出时重置为自动滚动
      });

      // 键盘弹出或收起后，滚动到底部
      if (isKeyboardShow) {
        // 键盘弹出时，等待页面重新渲染后再滚动
        wx.nextTick(() => {
          // 使用多次延时滚动，确保滚动到底部
          setTimeout(() => {
            this.scrollToBottom(50, true); // 强制滚动到底部
          }, 100);

          // 再次滚动，确保在键盘完全显示后滚动到底部
          setTimeout(() => {
            this.scrollToBottom(50, true);
          }, 300);
        });
      } else {
        // 键盘收起时，等待页面重新渲染后再滚动
        wx.nextTick(() => {
          setTimeout(() => {
            this.scrollToBottom(100, true); // 强制滚动到底部
          }, 200);
        });
      }
    });
  },


  /**
   * 移除键盘监听
   */
  unwatchKeyboard() {
    if (this.keyboardHeightChangeListener) {
      wx.offKeyboardHeightChange(this.keyboardHeightChangeListener);
      this.keyboardHeightChangeListener = null;
    }
  },

  /**
 * 监听滚动事件
 */
  onScroll(e) {
    // 获取当前滚动位置
    const scrollTop = e.detail.scrollTop;

    // 如果向上滚动，标记为手动滚动模式
    if (scrollTop < this.data.lastScrollTop && !this.data.manualScroll) {
      this.setData({
        manualScroll: true
      });
    }

    // 更新上次滚动位置
    this.setData({
      lastScrollTop: scrollTop
    });

    // 检测是否滚动到底部，如果是则切换回自动滚动模式
    const query = wx.createSelectorQuery();
    query.select('#chat-container').boundingClientRect(rect => {
      if (rect) {
        const scrollViewHeight = rect.height;
        // 如果滚动到接近底部，切换回自动滚动
        if (scrollViewHeight - scrollTop < 100) {
          this.setData({
            manualScroll: false
          });
        }
      }
    }).exec();
  },

  /**
   * 滚动到底部
   * @param {number|Object} delayOrEvent 延迟时间或事件对象
   * @param {boolean} forceParam 是否强制滚动
   */
  scrollToBottom(delayOrEvent, forceParam) {
    // 初始化参数
    let delay = 100;
    let force = false;

    // 检查第一个参数类型
    if (typeof delayOrEvent === 'object' && delayOrEvent !== null) {
      // 如果是事件对象，则从数据集中获取force参数
      if (delayOrEvent.currentTarget && delayOrEvent.currentTarget.dataset) {
        force = delayOrEvent.currentTarget.dataset.force === 'true' || delayOrEvent.currentTarget.dataset.force === true;
        console.log('点击回到底部按钮，强制滚动:', force);
      }
    } else if (typeof delayOrEvent === 'number') {
      // 如果是数字，则作为延迟时间
      delay = delayOrEvent;
      // 如果有第二个参数，则作为强制滚动标志
      if (typeof forceParam === 'boolean') {
        force = forceParam;
      }
    }

    // 如果是从缓存加载的数据，增加延迟时间确保渲染完成
    const actualDelay = this.data.fromCache ? 300 : delay;

    // 打印调试信息
    console.log('滚动到底部函数被调用:', {
      delay,
      force,
      actualDelay,
      manualScroll: this.data.manualScroll,
      isKeyboardShow: this.data.isKeyboardShow,
      keyboardHeight: this.data.keyboardHeight
    });

    // 如果是手动滚动模式且不是强制滚动，则不执行滚动
    if (this.data.manualScroll && !force) {
      console.log('手动滚动模式且非强制滚动，不执行滚动');
      return;
    }

    // 如果是强制滚动，重置为自动滚动模式
    if (force) {
      this.setData({
        manualScroll: false
      });
    }

    // 强制滚动到底部
    setTimeout(() => {
      console.log('开始执行滚动操作');

      try {
        // 获取滚动容器
        const query = wx.createSelectorQuery();
        query.select('#chat-container').boundingClientRect().exec(res => {
          if (res && res[0]) {
            const containerHeight = res[0].height;
            console.log('滚动容器高度:', containerHeight);

            // 获取滚动元素
            const scrollView = wx.createSelectorQuery().select('#chat-container');
            scrollView.node().exec(nodeRes => {
              if (nodeRes && nodeRes[0] && nodeRes[0].node) {
                console.log('使用 scrollView 滚动到底部');
                const node = nodeRes[0].node;

                // 如果键盘弹出，考虑键盘高度
                if (this.data.isKeyboardShow && this.data.keyboardHeight > 0) {
                  // 先滚动到底部
                  node.scrollTo({
                    top: 100000, // 使用一个很大的值
                    behavior: 'smooth'
                  });

                  // 等待一段时间后再次滚动，确保滚动到正确位置
                  setTimeout(() => {
                    node.scrollTo({
                      top: 100000, // 使用一个很大的值
                      behavior: 'smooth'
                    });
                  }, 150);
                } else {
                  // 正常滚动到底部
                  node.scrollTo({
                    top: 100000, // 使用一个很大的值
                    behavior: 'smooth'
                  });
                }
              } else {
                console.log('使用 pageScrollTo 滚动到底部');
                // 如果无法获取节点，则使用页面滚动
                wx.pageScrollTo({
                  scrollTop: 100000, // 使用一个很大的值
                  duration: 300
                });
              }
            });
          } else {
            console.error('无法获取聊天容器元素');
          }
        });
      } catch (error) {
        console.error('滚动到底部时发生错误:', error);
        // 备用方法，直接使用页面滚动
        wx.pageScrollTo({
          scrollTop: 100000,
          duration: 300
        });
      }
    }, actualDelay);
  }

})
