// 个人资料页面
const app = getApp();

Page({
  data: {
    statusBarHeight: 20, // 默认状态栏高度
    loading: true, // 加载状态
    darkMode: false, // 暗黑模式状态
    
    // 用户信息
    userId: '',
    userInfo: {
      nickName: '',
      avatarUrl: '',
      gender: '',
      age: '',
      bio: ''
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
    interestTags: []
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
      const app = getApp();
      
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
  loadUserData: function () {
    // 模拟加载数据
    setTimeout(() => {
      // 从本地缓存或全局数据获取用户信息
      const userInfo = wx.getStorageSync('userInfo') || {};
      const userId = wx.getStorageSync('openId') || '';
      
      // 获取兴趣标签
      this.fetchInterestTags(userId);
      
      // 获取性格分析
      this.fetchPersonalityAnalysis(userId);
      
      // 设置性别索引
      let genderIndex = 0;
      if (userInfo.gender) {
        genderIndex = this.data.genderOptions.findIndex(item => item === userInfo.gender);
        genderIndex = genderIndex >= 0 ? genderIndex : 0;
      }
      
      // 设置年龄索引
      let ageIndex = 17;
      if (userInfo.age) {
        ageIndex = this.data.ageOptions.findIndex(item => item === parseInt(userInfo.age));
        ageIndex = ageIndex >= 0 ? ageIndex : 17;
      }
      
      this.setData({
        loading: false,
        userId: userId,
        userInfo: userInfo,
        genderIndex: genderIndex,
        ageIndex: ageIndex,
        bioLength: userInfo.bio ? userInfo.bio.length : 0
      });
    }, 1000);
  },

  /**
   * 获取兴趣标签
   */
  fetchInterestTags: function (userId) {
    if (!userId) return;
    
    // 这里应该调用云函数或API获取用户兴趣标签
    // 模拟数据
    const mockTags = ['旅行', '摄影', '美食', '电影', '音乐', '阅读', '科技'];
    
    this.setData({
      interestTags: mockTags
    });
  },

  /**
   * 获取性格分析
   */
  fetchPersonalityAnalysis: function (userId) {
    if (!userId) return;
    
    // 这里应该调用云函数或API获取用户性格分析
    // 模拟数据
    const mockSummary = '您的性格特点是开朗、乐观，善于与人沟通。在面对挑战时，您表现出较强的适应能力和解决问题的能力。您对新事物充满好奇心，喜欢探索和学习。';
    
    this.setData({
      personalitySummary: mockSummary
    });
  },

  /**
   * 选择头像
   */
  chooseAvatar: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        // 更新头像
        const userInfo = this.data.userInfo;
        userInfo.avatarUrl = tempFilePath;
        
        this.setData({
          userInfo: userInfo
        });
        
        // 这里应该上传头像到服务器
        // 示例代码省略...
      }
    });
  },

  /**
   * 处理昵称输入
   */
  handleNicknameInput: function (e) {
    const userInfo = this.data.userInfo;
    userInfo.nickName = e.detail.value;
    
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
    
    const userInfo = this.data.userInfo;
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
    
    const userInfo = this.data.userInfo;
    userInfo.age = age;
    
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
    const userInfo = this.data.userInfo;
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
      success: (res) => {
        if (res.confirm) {
          // 这里应该调用云函数或API清除聊天记录
          wx.showToast({
            title: '聊天记录已清除',
            icon: 'success'
          });
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
  saveProfile: function () {
    const userInfo = this.data.userInfo;
    
    // 验证昵称
    if (!userInfo.nickName || userInfo.nickName.trim() === '') {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载中
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    // 模拟保存数据
    setTimeout(() => {
      // 保存到本地缓存
      wx.setStorageSync('userInfo', userInfo);
      
      // 这里应该调用云函数或API保存用户信息
      // 示例代码省略...
      
      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    }, 1500);
  },

  /**
   * 返回上一页
   */
  handleBack: function () {
    wx.navigateBack();
  }
});
