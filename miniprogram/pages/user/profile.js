// 用户资料页面 - 重构版
const app = getApp()
import { getLoginInfo, checkLogin } from '../../utils/auth'

Page({
  // 页面的初始数据
  data: {
    // 系统信息
    statusBarHeight: 20,
    navBarHeight: 44,
    
    // 页面状态
    loading: true,
    submitting: false,
    darkMode: false,
    
    // 用户信息
    userInfo: null,

    // 性别选择器
    genderOptions: ['未知', '男', '女'],
    genderIndex: 0,

    // 地区
    region: ['', '', ''],

    // 语言选择器
    languageOptions: ['简体中文', '英文'],
    languageIndex: 0,
    languageMap: {
      'zh_CN': '简体中文',
      'en_US': '英文'
    },

    // 用户设置
    settings: {
      darkMode: false,
      notificationEnabled: true,
      language: 'zh_CN'
    },

    // 个人简介长度
    bioLength: 0,

    // 性格分析数据
    personalityTraits: [],
    personalitySummary: '',

    // 兴趣爱好
    interests: []
  },

  // 生命周期函数--监听页面加载
  onLoad() {
    this.initSystemInfo()
    this.loadUserInfo()
  },
  
  // 初始化系统信息
  initSystemInfo() {
    try {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync()
      // 获取胶囊按钮位置信息
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect()
      // 计算导航栏高度
      const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height
      
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight,
        navBarHeight: navBarHeight,
        darkMode: app.globalData.darkMode || false
      })
    } catch (e) {
      console.error('获取系统信息失败:', e)
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      if (!checkLogin()) {
        wx.navigateBack()
        return
      }

      const { userInfo } = getLoginInfo()

      if (!userInfo) {
        wx.navigateBack()
        return
      }

      // 获取用户详细信息
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getInfo',
          userId: userInfo.userId
        }
      })

      if (!result.result || !result.result.success) {
        throw new Error('获取用户信息失败')
      }

      // 合并基本信息和详细信息
      const userData = result.result.data.user
      
      // 获取用户配置
      const configResult = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getUserConfig',
          userId: userInfo.userId
        }
      })
      
      const configData = configResult.result && configResult.result.success ? 
        configResult.result.data : {}
      
      const settings = {
        darkMode: configData.dark_mode || app.globalData.darkMode || false,
        notificationEnabled: configData.notification_enabled !== false, // 默认为true
        language: configData.language || 'zh_CN'
      }

      // 设置性别索引
      const genderIndex = userData.gender !== undefined ? userData.gender : 0

      // 设置地区
      const region = [
        userData.country || '',
        userData.province || '',
        userData.city || ''
      ]

      // 设置语言索引
      const languageIndex = settings.language === 'en_US' ? 1 : 0

      // 设置个人简介长度
      const bioLength = userData.bio ? userData.bio.length : 0

      this.setData({
        userInfo: userData,
        settings,
        genderIndex,
        region,
        languageIndex,
        bioLength,
        loading: false,
        darkMode: settings.darkMode
      })

      // 获取性格分析和兴趣爱好数据
      this.loadPersonalityData()

    } catch (error) {
      console.error('加载用户信息失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
      this.setData({ loading: false })
    }
  },

  // 加载性格分析数据
  async loadPersonalityData() {
    try {
      const { userInfo } = this.data
      if (!userInfo || !userInfo.userId) return

      // 调用云函数获取用户画像数据
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getUserPerception',
          userId: userInfo.userId
        }
      })

      if (result.result && result.result.success) {
        const perceptionData = result.result.data
        
        // 设置性格特征数据
        if (perceptionData.personalityTraits && perceptionData.personalityTraits.length > 0) {
          this.setData({
            personalityTraits: perceptionData.personalityTraits,
            personalitySummary: perceptionData.personalitySummary || '',
            interests: perceptionData.interests || []
          })
        } else if (userInfo.stats && userInfo.stats.chat_count < 5) {
          // 使用userInfo.stats保持向后兼容性
          // 在新的统一users集合中，stats对象应该存在于userData.stats中
          // 如果没有足够的对话数据，显示提示
          this.setData({
            personalitySummary: '需要更多对话数据才能生成准确的性格分析。请继续使用应用，与AI进行更多交流。'
          })
        }
      }
    } catch (error) {
      console.error('加载性格分析数据失败:', error)
    }
  },

  // 返回上一页
  handleBack() {
    wx.navigateBack()
  },

  // 选择头像
  async chooseAvatar() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      // 显示上传中提示
      wx.showLoading({
        title: '上传中...',
        mask: true
      })

      // 使用图片服务上传头像
      const fileID = await app.globalData.imageService.uploadAvatar(
        res.tempFilePaths[0],
        this.data.userInfo.userId,
        'user'
      )

      // 隐藏加载提示
      wx.hideLoading()

      // 更新数据
      this.setData({
        'userInfo.avatarUrl': fileID
      })

      wx.showToast({
        title: '上传成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('上传头像失败:', error)
      wx.hideLoading()
      // 错误处理已在imageService中实现
    }
  },

  // 性别选择器变化
  handleGenderChange(e) {
    this.setData({
      genderIndex: e.detail.value,
      'userInfo.gender': parseInt(e.detail.value)
    })
  },

  // 地区选择器变化
  handleRegionChange(e) {
    this.setData({
      region: e.detail.value,
      'userInfo.country': e.detail.value[0],
      'userInfo.province': e.detail.value[1],
      'userInfo.city': e.detail.value[2]
    })
  },

  // 语言选择器变化
  handleLanguageChange(e) {
    const language = e.detail.value == 0 ? 'zh_CN' : 'en_US'
    this.setData({
      languageIndex: e.detail.value,
      'settings.language': language
    })
  },

  // 深色模式开关变化
  handleDarkModeChange(e) {
    this.setData({
      'settings.darkMode': e.detail.value,
      darkMode: e.detail.value
    })
  },

  // 通知开关变化
  handleNotificationChange(e) {
    this.setData({
      'settings.notificationEnabled': e.detail.value
    })
  },

  // 监听个人简介输入
  onBioInput(e) {
    this.setData({
      bioLength: e.detail.value.length
    })
  },

  // 提交表单
  async handleSubmit(e) {
    try {
      const formData = e.detail.value
      const { userInfo, settings } = this.data

      // 表单验证
      if (!formData.username) {
        wx.showToast({
          title: '请输入昵称',
          icon: 'none'
        })
        return
      }

      this.setData({ submitting: true })

      // 使用云函数更新用户信息
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'updateProfile',
          userId: userInfo.userId,
          username: formData.username,
          avatarUrl: userInfo.avatarUrl,
          gender: userInfo.gender,
          country: userInfo.country,
          province: userInfo.province,
          city: userInfo.city,
          bio: formData.bio,
          settings: settings
        }
      })

      if (result.result && result.result.success) {
        // 从云函数获取更新后的用户信息
        const updatedUser = result.result.data.updatedUser

        // 更新全局数据
        app.globalData.darkMode = settings.darkMode

        // 更新本地存储的用户信息
        const loginInfo = getLoginInfo()
        const updatedUserInfo = {
          ...loginInfo.userInfo,
          ...updatedUser // 使用云函数返回的最新数据
        }

        // 更新全局状态
        app.globalData.userInfo = updatedUserInfo

        // 更新本地存储
        wx.setStorageSync('loginInfo', {
          ...loginInfo,
          userInfo: updatedUserInfo
        })

        this.setData({ submitting: false })

        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })

        // 设置上一页需要刷新的标志
        const pages = getCurrentPages()
        if (pages.length > 1) {
          const prevPage = pages[pages.length - 2]
          if (prevPage && prevPage.route.includes('user')) {
            // 设置需要刷新的标志
            prevPage.setData({
              needRefresh: true
            })
          }
        }

        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        throw new Error('云函数调用失败')
      }
    } catch (error) {
      console.error('保存用户信息失败:', error)
      this.setData({ submitting: false })
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  }
})
