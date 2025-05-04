// app.js
import { checkLogin, saveLoginInfo, getLoginInfo, clearLoginInfo } from './utils/auth';
import * as echarts from './components/ec-canvas/echarts';
import imageService from './services/imageService';
import config from './config/index';

App({
  globalData: {
    userInfo: null,
    systemInfo: null,
    darkMode: false,
    isLoggedIn: false,
    cloudEnv: config.cloud.ENV_ID, // 从配置文件获取云环境ID
    roleList: [], // 添加角色列表
    cloudInit: false, // 云环境是否初始化
    imageService: null, // 图片服务
    config: config // 全局配置对象
  },

  onLaunch() {
    // 将 echarts 挂载到 wx 对象上，方便全局使用
    wx.echarts = echarts;

    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      this.initCloudEnvironment();
    }

    // 获取系统信息
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;

      // 优先使用本地缓存中的 darkMode 设置
      const localDarkMode = wx.getStorageSync('darkMode');
      if (localDarkMode !== undefined && localDarkMode !== null) {
        // 确保 localDarkMode 是布尔值
        const darkModeValue = typeof localDarkMode === 'boolean' ? localDarkMode : localDarkMode === 'true';
        this.globalData.darkMode = darkModeValue;
        console.log('从本地缓存读取暗黑模式设置:', darkModeValue, '原始值:', localDarkMode, '类型:', typeof localDarkMode);

        // 将布尔值存回缓存，确保类型一致
        wx.setStorageSync('darkMode', darkModeValue);

        // 根据本地缓存设置主题
        this.updateTheme(darkModeValue);
      } else {
        // 如果本地缓存中没有设置，则使用系统主题
        this.globalData.darkMode = systemInfo.theme === 'dark';
        console.log('使用系统主题设置暗黑模式:', this.globalData.darkMode);

        // 将系统主题设置存入缓存
        wx.setStorageSync('darkMode', this.globalData.darkMode);

        // 根据系统主题设置主题
        this.updateTheme(this.globalData.darkMode);
      }
    } catch (e) {
      console.error('获取系统信息失败:', e);
    }

    // 监听主题变化
    wx.onThemeChange && wx.onThemeChange((result) => {
      // 检查本地缓存中是否有手动设置的暗黑模式
      const localDarkMode = wx.getStorageSync('darkMode');
      if (localDarkMode !== undefined && localDarkMode !== null) {
        // 如果有手动设置，则不响应系统主题变化
        console.log('存在手动设置的暗黑模式，不响应系统主题变化');
        return;
      }

      // 如果没有手动设置，则响应系统主题变化
      const darkModeValue = result.theme === 'dark';
      this.globalData.darkMode = darkModeValue;
      console.log('系统主题变化，更新暗黑模式为:', darkModeValue);

      // 将系统主题设置存入缓存
      wx.setStorageSync('darkMode', darkModeValue);

      // 更新主题
      this.updateTheme(darkModeValue);
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
        this.saveOpenIdToStorage(result.data.userInfo);

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
          this.saveOpenIdToStorage(userInfo);
        }
      }

      return isLoggedIn;
    } catch (error) {
      console.error('Check login status failed:', error);
      return false;
    }
  },

  /**
   * 将用户的openId保存到本地缓存
   * @param {Object} userInfo - 用户信息对象
   */
  saveOpenIdToStorage(userInfo) {
    try {
      if (userInfo && userInfo.stats && userInfo.stats.openid) {
        wx.setStorageSync('openId', userInfo.stats.openid);
        console.log('存储openId到本地缓存:', userInfo.stats.openid);
      } else {
        console.warn('用户信息中没有openId，无法保存到本地缓存');
      }
    } catch (error) {
      console.error('保存openId到本地缓存失败:', error);
    }
  },

  /**
   * 初始化云环境
   * @returns {boolean} 初始化是否成功
   */
  initCloudEnvironment() {
    try {
      // 检查是否已经初始化
      if (!wx.cloud.inited) {
        wx.cloud.init({
          env: this.globalData.cloudEnv,
          traceUser: true,
        });
      }
      this.globalData.cloudInit = true;
      console.log('云环境初始化成功:', this.globalData.cloudEnv);

      // 初始化图片服务
      this.globalData.imageService = imageService;
      imageService.initImageService();
      return true;
    } catch (error) {
      console.error('云环境初始化失败:', error);
      // 尝试使用动态环境ID
      try {
        wx.cloud.init({
          env: wx.cloud.DYNAMIC_CURRENT_ENV,
          traceUser: true,
        });
        this.globalData.cloudInit = true;
        console.log('使用动态环境ID初始化云环境成功');

        // 初始化图片服务
        this.globalData.imageService = imageService;
        imageService.initImageService();
        return true;
      } catch (retryError) {
        console.error('使用动态环境ID初始化云环境失败:', retryError);
        return false;
      }
    }
  },

  /**
   * 更新主题设置
   * @param {boolean} isDarkMode - 是否为暗黑模式
   */
  updateTheme(isDarkMode) {
    try {
      // 更新全局状态
      this.globalData.darkMode = isDarkMode;

      // 尝试更新当前页面的主题
      this.updateCurrentPageTheme(isDarkMode);

      // 设置TabBar样式
      this.updateTabBarStyle(isDarkMode);
    } catch (error) {
      console.error('更新主题设置失败:', error);
    }
  },

  /**
   * 更新当前页面的主题
   * @param {boolean} isDarkMode - 是否为暗黑模式
   */
  updateCurrentPageTheme(isDarkMode) {
    try {
      // 获取当前页面
      const pages = getCurrentPages();
      if (pages.length === 0) {
        console.log('当前没有页面，不更新页面主题');
        return;
      }

      // 遍历所有页面，更新主题
      pages.forEach(page => {
        if (page && page.setData) {
          page.setData({ darkMode: isDarkMode });
          console.log(`更新页面 ${page.route} 的主题为:`, isDarkMode ? '暗黑模式' : '亮色模式');
        }
      });
    } catch (error) {
      console.error('更新当前页面主题失败:', error);
    }
  },

  /**
   * 更新TabBar样式
   * @param {boolean} isDarkMode - 是否为暗黑模式
   */
  updateTabBarStyle(isDarkMode) {
    try {
      // 获取当前页面路径
      const pages = getCurrentPages();
      if (pages.length === 0) {
        console.log('当前没有页面，不设置TabBar样式');
        return;
      }

      const currentPage = pages[pages.length - 1];
      const currentRoute = currentPage.route;

      // 检查当前页面是否是TabBar页面
      const tabBarPages = this.globalData.config.theme.TAB_BAR_PAGES;
      const isTabBarPage = tabBarPages.some(page => currentRoute === page);

      if (!isTabBarPage) {
        console.log('当前页面不是TabBar页面，不设置TabBar样式:', currentRoute);
        return;
      }

      // 设置TabBar样式
      wx.setTabBarStyle({
        color: isDarkMode ? '#8a9aa9' : '#6c757d',
        selectedColor: isDarkMode ? '#4dabf7' : '#007bff',
        backgroundColor: isDarkMode ? '#1a1d20' : '#ffffff',
        borderStyle: isDarkMode ? 'black' : 'white',
        success: () => {
          console.log('设置TabBar样式成功，暗黑模式:', isDarkMode);
        },
        fail: (error) => {
          console.error('设置TabBar样式失败:', error);
        }
      });
    } catch (error) {
      console.error('更新TabBar样式失败:', error);
    }
  }
});
