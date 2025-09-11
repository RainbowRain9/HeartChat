// 个人资料页面
const app = getApp();
const request = require('../../../utils/request');
const DataConverter = require('../../../utils/data-converter');

Page({
  data: {
    statusBarHeight: 20, // 默认状态栏高度
    loading: true, // 加载状态
    saving: false, // 保存状态
    darkMode: false, // 暗黑模式状态
    
    // 用户信息 - 适配新的数据库结构
    userId: '',
    userInfo: {
      // 基础信息
      userId: '',
      openid: '',
      username: '',
      avatarUrl: '',
      nickName: '',
      userType: 1,
      status: 1,
      
      // 个人信息
      gender: '',
      age: '',
      bio: '',
      birthday: '',
      country: '',
      province: '',
      city: '',
      
      // 配置信息
      darkMode: false,
      notificationEnabled: true,
      language: 'zh-CN',
      theme: 'default',
      fontSize: 16,
      
      // 统计信息
      stats: {
        chatCount: 0,
        solvedCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
        activeDays: 0,
        consecutiveDays: 0,
        totalSessionTime: 0,
        lastActiveText: ''
      }
    },
    
    // 选择器数据
    genderOptions: ['男', '女', '其他'],
    genderIndex: 0,
    ageOptions: Array.from({length: 100}, (_, i) => i + 1),
    ageIndex: 17, // 默认18岁
    
    // 文本长度计数
    bioLength: 0,
    
    // 性格分析数据
    personalityTraits: [
      { name: '开朗', score: 85 },
      { name: '理性', score: 70 },
      { name: '创造力', score: 65 },
      { name: '耐心', score: 75 },
      { name: '好奇心', score: 90 }
    ],
    personalitySummary: '',
    
    // 兴趣标签
    interestTags: [],
    
    // 错误信息
    errors: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initSystemInfo();
    this.loadUserData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 检查暗黑模式变化
    if (app.globalData && this.data.darkMode !== app.globalData.darkMode) {
      this.setData({
        darkMode: app.globalData.darkMode
      });
    }
  },

  /**
   * 初始化系统信息
   */
  initSystemInfo: function () {
    try {
      const systemInfo = wx.getSystemInfoSync();
      
      // 检测暗黑模式
      let darkMode = false;
      if (app.globalData && app.globalData.darkMode !== undefined) {
        darkMode = app.globalData.darkMode;
      } else {
        darkMode = systemInfo.theme === 'dark';
        // 更新全局数据
        if (app.globalData) {
          app.globalData.darkMode = darkMode;
        }
      }
      
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight,
        darkMode: darkMode
      });
      
      // 监听系统主题变化
      wx.onThemeChange && wx.onThemeChange((result) => {
        const isDark = result.theme === 'dark';
        this.setData({ darkMode: isDark });
        // 更新全局数据
        if (app.globalData) {
          app.globalData.darkMode = isDark;
        }
      });
    } catch (e) {
      console.error('获取系统信息失败:', e);
    }
  },

  /**
   * 加载用户数据
   */
  loadUserData: async function () {
    try {
      this.setData({ loading: true });
      
      // 获取用户ID - 兼容多种存储方式
      let userId = wx.getStorageSync('userId') || wx.getStorageSync('openId') || '';
      
      // 如果本地没有用户ID，尝试从全局数据获取
      if (!userId && app.globalData && app.globalData.userInfo) {
        userId = app.globalData.userInfo.userId || app.globalData.userInfo.openId || '';
      }
      
      if (!userId) {
        console.warn('用户ID不存在，可能用户未登录');
        // 显示登录提示
        wx.showModal({
          title: '提示',
          content: '请先登录后再查看个人资料',
          showCancel: false,
          success: () => {
            // 可以跳转到登录页面
            wx.redirectTo({
              url: '/pages/user/user'
            });
          }
        });
        this.setData({ loading: false });
        return;
      }
      
      // 调用云函数获取用户信息
      console.log('正在调用云函数获取用户信息，用户ID:', userId);
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getInfo',
          userId: userId
        }
      });
      
      console.log('云函数调用结果:', result);
      
      if (result.result && result.result.success && result.result.data) {
        // 转换数据格式
        const frontendData = DataConverter.dbToFrontend(result.result.data.user);
        
        // 设置性别索引
        let genderIndex = 0;
        if (frontendData.gender) {
          genderIndex = this.data.genderOptions.findIndex(item => item === frontendData.gender);
          genderIndex = genderIndex >= 0 ? genderIndex : 0;
        }
        
        // 设置年龄索引
        let ageIndex = 17;
        if (frontendData.age) {
          ageIndex = this.data.ageOptions.findIndex(item => item === parseInt(frontendData.age));
          ageIndex = ageIndex >= 0 ? ageIndex : 17;
        }
        
        // 获取兴趣标签
        this.fetchInterestTags(userId);
        
        // 获取性格分析
        this.fetchPersonalityAnalysis(userId);
        
        this.setData({
          loading: false,
          userId: userId,
          userInfo: frontendData,
          genderIndex: genderIndex,
          ageIndex: ageIndex,
          bioLength: frontendData.bio.length,
          darkMode: frontendData.darkMode,
          errors: []
        });
        
        // 更新全局数据
        if (app.globalData) {
          app.globalData.userInfo = frontendData;
        }
        
        // 保存到本地缓存
        wx.setStorageSync('userInfo', frontendData);
        
      } else {
        throw new Error(result.result?.error || '获取用户信息失败');
      }
      
    } catch (error) {
      console.error('加载用户数据失败:', error);
      this.setData({ 
        loading: false,
        errors: [error.message || '加载用户数据失败']
      });
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  /**
   * 获取兴趣标签
   */
  fetchInterestTags: async function (userId) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'analysis',
        data: {
          action: 'getUserInterests',
          userId: userId
        }
      });
      
      if (result.result && result.result.success && result.result.data) {
        this.setData({
          interestTags: result.result.data.interests || []
        });
      }
    } catch (error) {
      console.error('获取兴趣标签失败:', error);
      // 使用默认标签
      this.setData({
        interestTags: []
      });
    }
  },

  /**
   * 获取性格分析
   */
  fetchPersonalityAnalysis: async function (userId) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'analysis',
        data: {
          action: 'getUserPersonality',
          userId: userId
        }
      });
      
      if (result.result && result.result.success && result.result.data) {
        this.setData({
          personalitySummary: result.result.data.summary || '',
          personalityTraits: result.result.data.traits || this.data.personalityTraits
        });
      }
    } catch (error) {
      console.error('获取性格分析失败:', error);
      // 使用默认分析
      this.setData({
        personalitySummary: ''
      });
    }
  },

  /**
   * 选择头像
   */
  chooseAvatar: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        try {
          // 显示上传进度
          wx.showLoading({
            title: '上传中...',
            mask: true
          });
          
          // 上传头像到云存储
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath: `avatars/${this.data.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
            filePath: tempFilePath
          });
          
          // 更新头像URL
          const userInfo = { ...this.data.userInfo };
          userInfo.avatarUrl = uploadResult.fileID;
          
          this.setData({
            userInfo: userInfo
          });
          
          wx.hideLoading();
          wx.showToast({
            title: '头像上传成功',
            icon: 'success'
          });
        } catch (error) {
          console.error('上传头像失败:', error);
          wx.hideLoading();
          wx.showToast({
            title: '上传头像失败',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 处理昵称输入
   */
  handleNicknameInput: function (e) {
    const userInfo = { ...this.data.userInfo };
    userInfo.nickName = e.detail.value;
    userInfo.username = e.detail.value; // 保持同步
    
    this.setData({
      userInfo: userInfo
    });
  },

  /**
   * 处理性别选择
   */
  handleGenderChange: function (e) {
    const index = e.detail.value;
    const gender = this.data.genderOptions[index];
    
    const userInfo = { ...this.data.userInfo };
    userInfo.gender = gender;
    
    this.setData({
      userInfo: userInfo,
      genderIndex: index
    });
  },

  /**
   * 处理年龄选择
   */
  handleAgeChange: function (e) {
    const index = e.detail.value;
    const age = this.data.ageOptions[index];
    
    const userInfo = { ...this.data.userInfo };
    userInfo.age = age.toString();
    
    this.setData({
      userInfo: userInfo,
      ageIndex: index
    });
  },

  /**
   * 处理个人简介输入
   */
  handleBioInput: function (e) {
    const bio = e.detail.value;
    const userInfo = { ...this.data.userInfo };
    userInfo.bio = bio;
    
    this.setData({
      userInfo: userInfo,
      bioLength: bio.length
    });
  },

  /**
   * 切换暗黑模式
   */
  toggleDarkMode: function () {
    const newDarkMode = !this.data.darkMode;
    
    this.setData({
      darkMode: newDarkMode
    });
    
    // 更新用户数据
    const userInfo = { ...this.data.userInfo };
    userInfo.darkMode = newDarkMode;
    this.setData({
      userInfo: userInfo
    });
    
    // 更新全局数据
    if (app.globalData) {
      app.globalData.darkMode = newDarkMode;
    }
    
    // 保存到本地存储
    wx.setStorageSync('darkMode', newDarkMode);
  },

  /**
   * 清除聊天记录
   */
  clearChatHistory: function () {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有聊天记录吗？此操作不可恢复。',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({
              title: '清除中...',
              mask: true
            });
            
            await wx.cloud.callFunction({
              name: 'chat',
              data: {
                action: 'clearHistory',
                userId: this.data.userId
              }
            });
            
            wx.hideLoading();
            wx.showToast({
              title: '聊天记录已清除',
              icon: 'success'
            });
          } catch (error) {
            console.error('清除聊天记录失败:', error);
            wx.hideLoading();
            wx.showToast({
              title: '清除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  /**
   * 显示关于我们
   */
  showAbout: function () {
    wx.navigateTo({
      url: '/pages/about/index'
    });
  },

  /**
   * 保存个人资料
   */
  saveProfile: async function () {
    if (this.data.saving) return;
    
    const userInfo = this.data.userInfo;
    const userId = this.data.userId;
    
    // 验证数据
    const validation = DataConverter.validateUserData(userInfo);
    if (!validation.isValid) {
      this.setData({
        errors: validation.errors
      });
      
      wx.showToast({
        title: validation.errors[0],
        icon: 'none'
      });
      return;
    }
    
    // 显示加载中
    this.setData({ saving: true });
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    try {
      // 转换数据格式
      const dbData = DataConverter.frontendToDb(userInfo);
      
      // 调用云函数保存用户信息
      console.log('调用云函数保存用户信息，参数:', {
        action: 'updateProfile',
        userId: userId,
        dbData: dbData,
        finalConfig: {
          ...dbData.config,
          dark_mode: this.data.darkMode
        }
      });
      
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'updateProfile',
          userId: userId,
          ...dbData,
          config: {
            ...dbData.config,
            dark_mode: this.data.darkMode
          }
        }
      });
      
      console.log('云函数返回结果:', result);
      console.log('返回结果详情:', {
        hasResult: !!result.result,
        success: result.result?.success,
        error: result.result?.error,
        data: result.result?.data
      });
      
      if (result.result && result.result.success) {
        // 更新本地缓存
        wx.setStorageSync('userInfo', userInfo);
        
        // 更新全局数据
        if (app.globalData) {
          app.globalData.userInfo = userInfo;
        }
        
        wx.hideLoading();
        this.setData({ saving: false, errors: [] });
        
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      } else {
        // 检查错误对象是否为空
        const errorObj = result.result?.error;
        let errorMessage = '保存失败';
        
        if (errorObj && typeof errorObj === 'object' && Object.keys(errorObj).length > 0) {
          // 如果错误对象有内容，尝试提取错误信息
          errorMessage = errorObj.message || errorObj.error || JSON.stringify(errorObj);
        } else if (typeof errorObj === 'string' && errorObj.trim()) {
          // 如果错误是字符串，直接使用
          errorMessage = errorObj;
        }
        
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('保存用户信息失败:', error);
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        result: error.result,
        data: error.data,
        toString: error.toString(),
        typeof: typeof error
      });
      
      wx.hideLoading();
      
      // 更安全地处理错误信息
      let errorMessage = '保存失败';
      try {
        if (error.message) {
          if (typeof error.message === 'string') {
            errorMessage = error.message;
          } else {
            errorMessage = JSON.stringify(error.message);
          }
        } else if (error.result?.error) {
          errorMessage = error.result.error;
        } else if (error.error) {
          errorMessage = error.error;
        } else {
          errorMessage = error.toString();
        }
      } catch (e) {
        console.error('处理错误信息失败:', e);
        errorMessage = '保存失败，请稍后重试';
      }
      
      this.setData({ 
        saving: false,
        errors: [errorMessage]
      });
      
      wx.showToast({
        title: errorMessage,
        icon: 'none'
      });
    }
  },

  /**
   * 返回上一页
   */
  handleBack: function () {
    wx.navigateBack();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function () {
    this.loadUserData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 分享
   */
  onShareAppMessage: function () {
    return {
      title: '我的个人资料',
      path: '/pages/user/profile/profile'
    };
  }
});