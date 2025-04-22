// pages/welcome/welcome.js
const app = getApp();
import { saveLoginInfo } from '../../utils/auth';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    agreed: false,
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查用户是否已登录
    this.checkLoginStatus();
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function () {
    // 从全局获取登录状态
    const isLoggedIn = app.globalData.isLoggedIn;

    if (isLoggedIn) {
      // 已登录，跳转到首页
      this.navigateToHome();
    }
  },

  /**
   * 处理协议勾选状态变化
   */
  handleAgreementChange: function(e) {
    this.setData({
      agreed: e.detail.value.length > 0
    });
  },

  /**
   * 处理获取用户信息
   */
  handleGetUserInfo: function(e) {
    if (e.detail.userInfo) {
      this.handleLogin(e.detail.userInfo);
    } else {
      wx.showToast({
        title: '需要您的授权才能继续使用',
        icon: 'none'
      });
    }
  },

  /**
   * 处理登录
   */
  handleLogin: async function(userInfo) {
    // 检查是否同意协议
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意服务协议',
        icon: 'none'
      });
      return;
    }

    // 防止重复点击
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      // 获取用户信息
      if (!userInfo) {
        const userProfile = await wx.getUserProfile({
          desc: '用于完善用户资料'
        });
        userInfo = userProfile.userInfo;
      }

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

      if(!saveLoginInfo(loginData)) {
        throw new Error('保存登录信息失败');
      }

      // 更新全局状态
      app.globalData.isLoggedIn = true;
      app.globalData.userInfo = result.data.userInfo;

      // 显示成功提示
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      });

      // 延迟跳转，等待提示显示
      setTimeout(() => {
        this.navigateToHome();
      }, 1500);

    } catch (error) {
      console.error('Login failed:', error);
      let errorMsg = '登录失败，请重试';

      if (error.errMsg?.includes('getUserProfile:fail')) {
        errorMsg = '需要您的授权才能继续使用';
      }

      wx.showToast({
        title: errorMsg,
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 跳转到首页
   */
  navigateToHome: function () {
    wx.switchTab({
      url: '/pages/home/home'
    });
  }
})
