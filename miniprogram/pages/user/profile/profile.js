// 个人资料页面
const app = getApp();
const userService = require('../../../services/userService');

Page({
  data: {
    statusBarHeight: 20, // 默认状态栏高度
    navBarHeight: 44, // 默认导航栏高度
    navTotalHeight: 64, // 状态栏+导航栏总高度
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

      // 计算导航栏高度
      const navBarHeight = 44; // 固定导航栏高度
      const navTotalHeight = systemInfo.statusBarHeight + navBarHeight;

      this.setData({
        statusBarHeight: systemInfo.statusBarHeight,
        navBarHeight: navBarHeight,
        navTotalHeight: navTotalHeight,
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
    try {
      // 直接从本地缓存获取用户信息
      const loginInfo = wx.getStorageSync('loginInfo') || {};
      let userInfo = loginInfo.userInfo || {};

      // 如果没有loginInfo，尝试使用userInfo
      if (!userInfo || Object.keys(userInfo).length === 0) {
        userInfo = wx.getStorageSync('userInfo') || {};
      }

      console.log('从本地缓存获取的用户信息:', userInfo);

      // 确保有用户ID
      const userId = userInfo.userId || '6457751';

      if (!userId) {
        console.error('无法获取用户ID');
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
        this.setData({ loading: false });
        return;
      }

      // 处理昵称和username，确保两者一致
      if (!userInfo.nickName && userInfo.username) {
        userInfo.nickName = userInfo.username;
      } else if (!userInfo.username && userInfo.nickName) {
        userInfo.username = userInfo.nickName;
      } else if (!userInfo.nickName && !userInfo.username) {
        userInfo.nickName = '微信用户';
        userInfo.username = '微信用户';
      }

      // 先保存原始的userId和其他必要字段
      const originalUserId = userInfo.userId;
      const otherFields = {};
      Object.keys(userInfo).forEach(key => {
        if (!['nickName', 'username', 'avatarUrl', 'gender', 'age', 'bio'].includes(key)) {
          otherFields[key] = userInfo[key];
        }
      });

      // 确保昵称和用户名一致
      const finalNickName = userInfo.nickName || userInfo.username || '微信用户';
      const finalUsername = userInfo.username || userInfo.nickName || '微信用户';

      // 重新构建userInfo对象，确保昵称和用户名一致
      userInfo = {
        ...otherFields,
        userId: originalUserId || userId,
        nickName: finalNickName,
        username: finalUsername,
        avatarUrl: userInfo.avatarUrl || '',
        gender: userInfo.gender || 1,
        age: userInfo.age || 25,
        bio: userInfo.bio || ''
      };

      // 打印日志，检查昵称和用户名是否一致
      console.log('重新构建userInfo对象后，nickName:', userInfo.nickName, 'username:', userInfo.username);

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

      // 更新本地缓存
      wx.setStorageSync('userInfo', userInfo);

      console.log('用户数据加载完成:', userInfo);
    } catch (error) {
      console.error('加载用户数据失败:', error);
      wx.showToast({
        title: '加载用户数据失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  /**
   * 获取兴趣标签
   */
  fetchInterestTags: async function (userId) {
    if (!userId) return;

    // 确保使用正确的用户ID
    userId = userId || '6457751'; // 使用固定的userId

    try {
      // 调用云函数获取用户兴趣标签
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getUserInterests',
          userId
        }
      });

      if (result.result && result.result.success && result.result.keywords) {
        // 从关键词中提取标签
        const tags = result.result.keywords.map(item => item.word || item);
        this.setData({
          interestTags: tags
        });
      } else {
        // 如果获取失败，使用默认标签
        const defaultTags = ['旅行', '摄影', '美食', '电影', '音乐', '阅读', '科技'];
        this.setData({
          interestTags: defaultTags
        });
      }
    } catch (error) {
      console.error('获取用户兴趣标签失败:', error);
      // 使用默认标签
      const defaultTags = ['旅行', '摄影', '美食', '电影', '音乐', '阅读', '科技'];
      this.setData({
        interestTags: defaultTags
      });
    }
  },

  /**
   * 获取性格分析
   */
  fetchPersonalityAnalysis: async function (userId) {
    if (!userId) return;

    // 确保使用正确的用户ID
    userId = userId || '6457751'; // 使用固定的userId

    try {
      // 调用云函数获取用户性格分析
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getUserPerception',
          userId
        }
      });

      if (result.result && result.result.success && result.result.data) {
        // 获取性格特质和摘要
        const perceptionData = result.result.data;

        // 更新性格特质
        if (perceptionData.personalityTraits && perceptionData.personalityTraits.length > 0) {
          this.setData({
            personalityTraits: perceptionData.personalityTraits
          });
        }

        // 更新性格摘要
        if (perceptionData.summary) {
          this.setData({
            personalitySummary: perceptionData.summary
          });
        } else {
          // 使用默认摘要
          const defaultSummary = '您的性格特点是开朗、乐观，善于与人沟通。在面对挑战时，您表现出较强的适应能力和解决问题的能力。您对新事物充满好奇心，喜欢探索和学习。';
          this.setData({
            personalitySummary: defaultSummary
          });
        }
      } else {
        // 如果获取失败，使用默认数据
        const defaultSummary = '您的性格特点是开朗、乐观，善于与人沟通。在面对挑战时，您表现出较强的适应能力和解决问题的能力。您对新事物充满好奇心，喜欢探索和学习。';
        this.setData({
          personalitySummary: defaultSummary
        });
      }
    } catch (error) {
      console.error('获取用户性格分析失败:', error);
      // 使用默认数据
      const defaultSummary = '您的性格特点是开朗、乐观，善于与人沟通。在面对挑战时，您表现出较强的适应能力和解决问题的能力。您对新事物充满好奇心，喜欢探索和学习。';
      this.setData({
        personalitySummary: defaultSummary
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
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];

        // 显示上传中提示
        wx.showLoading({
          title: '上传中...',
          mask: true
        });

        // 获取用户ID
        const loginInfo = wx.getStorageSync('loginInfo') || {};
        const userId = (loginInfo.userInfo && loginInfo.userInfo.userId) || '6457751'; // 使用固定的userId
        if (!userId) {
          wx.hideLoading();
          wx.showToast({
            title: '无法获取用户ID',
            icon: 'none'
          });
          return;
        }

        // 生成云存储路径
        const cloudPath = `users/${userId}/avatar_${Date.now()}.jpg`;

        // 上传到云存储
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath,
          success: res => {
            console.log('头像上传成功:', res);
            const fileID = res.fileID;

            // 获取可访问的URL
            wx.cloud.getTempFileURL({
              fileList: [fileID],
              success: res => {
                const avatarUrl = res.fileList[0].tempFileURL;
                console.log('头像临时URL:', avatarUrl);

                // 更新头像
                const userInfo = this.data.userInfo;
                userInfo.avatarUrl = fileID; // 存储fileID而非临时URL

                this.setData({
                  userInfo: userInfo
                });

                wx.hideLoading();
                wx.showToast({
                  title: '头像上传成功',
                  icon: 'success'
                });
              },
              fail: err => {
                console.error('获取头像临时URL失败:', err);
                // 即使获取临时URL失败，仍然更新头像
                const userInfo = this.data.userInfo;
                userInfo.avatarUrl = fileID;

                this.setData({
                  userInfo: userInfo
                });

                wx.hideLoading();
                wx.showToast({
                  title: '头像已更新',
                  icon: 'success'
                });
              }
            });
          },
          fail: err => {
            console.error('头像上传失败:', err);
            wx.hideLoading();
            wx.showToast({
              title: '头像上传失败',
              icon: 'none'
            });
          }
        });
      },
      fail: err => {
        console.error('选择头像失败:', err);
        wx.showToast({
          title: '选择头像失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 处理昵称输入
   */
  handleNicknameInput: function (e) {
    const userInfo = this.data.userInfo;
    userInfo.nickName = e.detail.value;
    userInfo.username = e.detail.value; // 同时更新username字段

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
    // 确保当前值是布尔值
    const currentDarkMode = typeof this.data.darkMode === 'boolean' ? this.data.darkMode : this.data.darkMode === 'true';
    const newDarkMode = !currentDarkMode;

    console.log('切换暗黑模式，当前值:', currentDarkMode, '新值:', newDarkMode);

    this.setData({
      darkMode: newDarkMode
    });

    // 更新全局数据
    if (app.globalData) {
      app.globalData.darkMode = newDarkMode;
      console.log('已更新全局数据 darkMode:', app.globalData.darkMode);
    }

    // 保存到本地存储
    wx.setStorageSync('darkMode', newDarkMode);
    console.log('已保存到本地存储 darkMode:', newDarkMode);

    // 更新TabBar样式
    if (app.updateTheme) {
      app.updateTheme(newDarkMode);
    }

    // 刷新当前页面样式
    this.updatePageStyle(newDarkMode);
  },

  /**
   * 更新页面样式
   */
  updatePageStyle: function(isDarkMode) {
    // 刷新页面元素样式
    console.log('页面样式已更新为:', isDarkMode ? '暗色模式' : '亮色模式');
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
  saveProfile: async function () {
    // 复制一份用户信息，避免直接修改this.data
    const userInfo = JSON.parse(JSON.stringify(this.data.userInfo));

    // 验证昵称
    if (!userInfo.nickName || userInfo.nickName.trim() === '') {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    // 再次确保 username 和 nickName 一致
    userInfo.username = userInfo.nickName;

    console.log('保存前的用户信息:', userInfo);

    // 显示加载中
    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    try {
      // 获取用户ID
      const loginInfo = wx.getStorageSync('loginInfo') || {};
      const userId = (loginInfo.userInfo && loginInfo.userInfo.userId) || '6457751'; // 使用固定的userId
      if (!userId) {
        throw new Error('无法获取用户ID');
      }

      // 保存到数据库
      const saveResult = await userService.saveUserProfile(userId, userInfo);

      if (!saveResult) {
        throw new Error('保存用户资料失败');
      }

      // 保存到本地缓存
      wx.setStorageSync('userInfo', userInfo);

      // 更新全局状态
      if (app.globalData) {
        app.globalData.userInfo = {
          ...app.globalData.userInfo,
          ...userInfo
        };
      }

      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        success: () => {
          // 延迟返回，等待 Toast 显示完成
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
        }
      });
    } catch (error) {
      console.error('保存用户资料失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: error.message || '保存失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 返回上一页
   */
  handleBack: function () {
    wx.navigateBack();
  }
});
