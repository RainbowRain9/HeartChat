const app = getApp();

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    loading: false,
    error: '',
    agreed: false
  },

  methods: {
    handleAgreementChange(e) {
      this.setData({
        agreed: e.detail.value
      });
    },

    async handleLogin() {
      if (!this.data.agreed) {
        wx.showToast({
          title: '请先同意服务协议',
          icon: 'none'
        });
        return;
      }

      if (this.data.loading) return;

      this.setData({
        loading: true,
        error: ''
      });

      try {
        // 获取用户信息
        const userProfile = await wx.getUserProfile({
          desc: '用于完善用户资料'
        });

        // 使用全局登录方法
        const loginSuccess = await app.login(userProfile.userInfo);

        if (!loginSuccess) {
          throw new Error('登录失败');
        }

        // 显示成功提示
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });

        // 触发登录成功事件
        this.triggerEvent('success', {
          userInfo: app.globalData.userInfo,
          isNewUser: false // 由于无法确定是否为新用户，默认为false
        });

        // 延迟隐藏登录组件，等待提示显示
        setTimeout(() => {
          this.triggerEvent('close');
        }, 1000);

      } catch (error) {
        console.error('Login failed:', error);
        let errorMsg = '登录失败，请重试';

        if (error.errMsg?.includes('getUserProfile:fail')) {
          errorMsg = '需要您的授权才能继续使用';
        }

        this.setData({
          error: errorMsg
        });

        wx.showToast({
          title: errorMsg,
          icon: 'none'
        });
      } finally {
        this.setData({
          loading: false
        });
      }
    }
  }
});
