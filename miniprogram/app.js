// app.js
import { checkLogin, saveLoginInfo, getLoginInfo, clearLoginInfo } from './utils/auth';
import * as echarts from './components/ec-canvas/echarts';
import imageService from './services/imageService';

App({
  globalData: {
    userInfo: null,
    systemInfo: null,
    darkMode: false,
    isLoggedIn: false,
    cloudEnv: 'rainbowrain-2gt3j8hda726e4fe', // 添加云环境ID
    roleList: [], // 添加角色列表
    cloudInit: false, // 云环境是否初始化
    imageService: null // 图片服务
  },

  onLaunch() {
    // 将 echarts 挂载到 wx 对象上，方便全局使用
    wx.echarts = echarts;

    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.cloudEnv,
        traceUser: true,
      });
      this.globalData.cloudInit = true;

      // 初始化图片服务
      this.globalData.imageService = imageService;
      imageService.initImageService();
    }

    // 获取系统信息
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
      this.globalData.darkMode = systemInfo.theme === 'dark';
    } catch (e) {
      console.error('获取系统信息失败:', e);
    }

    // 监听主题变化
    wx.onThemeChange && wx.onThemeChange((result) => {
      this.globalData.darkMode = result.theme === 'dark';
    });

    // 检查登录状态
    this.checkLoginStatus();
  },

  onShow() {
    // 检查更新
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate(function(res) {
      if (res.hasUpdate) {
        updateManager.onUpdateReady(function() {
          wx.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用？',
            success: function(res) {
              if (res.confirm) {
                updateManager.applyUpdate();
              }
            }
          });
        });
      }
    });
  },

  // 全局登录方法
  async login(userInfo) {
    try {
      // 获取登录凭证
      const { code } = await wx.login();

      // 调用登录云函数
      const { result } = await wx.cloud.callFunction({
        name: 'login',
        data: {
          code,
          userInfo
        }
      });

      if (!result.success) {
        throw new Error(result.error || '登录失败');
      }

      // 保存登录信息并更新全局状态
      const loginData = {
        token: result.data.token,
        userInfo: result.data.userInfo
      };

      if(saveLoginInfo(loginData)) {
        this.globalData.isLoggedIn = true;
        this.globalData.userInfo = result.data.userInfo;

        // 将openid存储到本地缓存中，便于其他页面使用
        if (result.data.userInfo && result.data.userInfo.stats && result.data.userInfo.stats.openid) {
          wx.setStorageSync('openId', result.data.userInfo.stats.openid);
          console.log('存储openId到本地缓存:', result.data.userInfo.stats.openid);
        }

        return true;
      }
      throw new Error('保存登录信息失败');

    } catch (error) {
      console.error('Login failed:', error);
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
      return false;
    }
  },

  // 全局登出方法
  logout() {
    try {
      if (clearLoginInfo()) {
        this.globalData.isLoggedIn = false;
        this.globalData.userInfo = null;
        return true;
      } else {
        throw new Error('清除登录信息失败');
      }
    } catch (e) {
      console.error('清除登录信息失败:', e);
      return false;
    }
  },

  // 检查登录状态
  async checkLoginStatus() {
    try {
      const isLoggedIn = checkLogin();
      this.globalData.isLoggedIn = isLoggedIn;

      if (isLoggedIn) {
        const { userInfo } = getLoginInfo();
        if (userInfo) {
          this.globalData.userInfo = userInfo;

          // 将openid存储到本地缓存中，便于其他页面使用
          if (userInfo.stats && userInfo.stats.openid) {
            wx.setStorageSync('openId', userInfo.stats.openid);
            console.log('检查登录状态时存储openId到本地缓存:', userInfo.stats.openid);
          }
        }
      }

      return isLoggedIn;
    } catch (error) {
      console.error('Check login status failed:', error);
      return false;
    }
  }
});
