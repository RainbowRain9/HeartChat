// pages/prompt-editor/prompt-editor.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    roleId: '',
    roleName: '',
    prompt: '',
    isEdit: false,
    statusBarHeight: 20, // 默认状态栏高度
    submitting: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('提示词编辑页面加载，参数:', options);

    // 获取状态栏高度
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight
      });
    } catch (e) {
      console.error('获取状态栏高度失败:', e);
    }

    // 检查是否有角色ID和提示词
    if (options.roleId) {
      this.setData({
        roleId: options.roleId,
        roleName: options.roleName ? decodeURIComponent(options.roleName) : '未命名角色',
        isEdit: true
      });

      // 如果有提示词，直接设置
      if (options.prompt) {
        this.setData({ prompt: decodeURIComponent(options.prompt) });
      } else {
        // 否则从云函数获取角色详情
        this.loadRolePrompt(options.roleId);
      }
    } else {
      wx.showToast({
        title: '缺少角色ID',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 加载角色提示词
   */
  async loadRolePrompt(roleId) {
    try {
      wx.showLoading({ title: '加载中...' });

      // 调用云函数获取角色详情
      const result = await wx.cloud.callFunction({
        name: 'roles',
        data: {
          action: 'getRoleDetail',
          roleId: roleId
        }
      });

      if (result && result.result && result.result.success && result.result.role) {
        const role = result.result.role;
        console.log('获取到角色数据:', role);

        this.setData({
          prompt: role.prompt || '',
          roleName: role.name || '未命名角色'
        });
      } else {
        throw new Error('获取角色信息失败');
      }

      wx.hideLoading();
    } catch (error) {
      console.error('加载角色提示词失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '加载提示词失败',
        icon: 'none'
      });
    }
  },

  /**
   * 处理提示词输入
   */
  handlePromptInput(e) {
    this.setData({
      prompt: e.detail.value
    });
  },

  /**
   * 生成提示词
   */
  async generatePrompt() {
    try {
      wx.showLoading({ title: '生成提示词中...' });

      // 调用云函数获取角色详情
      const result = await wx.cloud.callFunction({
        name: 'roles',
        data: {
          action: 'getRoleDetail',
          roleId: this.data.roleId
        }
      });

      if (result && result.result && result.result.success && result.result.role) {
        const role = result.result.role;

        // 调用云函数生成提示词
        const promptResult = await wx.cloud.callFunction({
          name: 'roles',
          data: {
            action: 'generatePrompt',
            roleInfo: role
          }
        });

        if (promptResult && promptResult.result && promptResult.result.success) {
          this.setData({
            prompt: promptResult.result.prompt
          });
        } else {
          throw new Error('生成提示词失败');
        }
      } else {
        throw new Error('获取角色信息失败');
      }

      wx.hideLoading();
    } catch (error) {
      console.error('生成提示词失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '生成提示词失败',
        icon: 'none'
      });
    }
  },

  /**
   * 保存提示词
   */
  async savePrompt() {
    try {
      if (this.data.submitting) return;
      this.setData({ submitting: true });

      wx.showLoading({ title: '保存中...' });

      // 获取用户ID
      const app = getApp();
      const userId = app.globalData.userInfo ? app.globalData.userInfo.userId : '';

      if (!userId) {
        throw new Error('用户未登录，请先登录');
      }

      console.log('当前用户ID:', userId);

      // 调用云函数更新角色提示词
      const result = await wx.cloud.callFunction({
        name: 'roles',
        data: {
          action: 'updateRole',
          roleId: this.data.roleId,
          userId: userId,  // 添加用户ID
          role: {
            prompt: this.data.prompt
          }
        }
      });

      if (result && result.result && result.result.success) {
        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });

        // 返回上一页
        setTimeout(() => {
          // 返回上一页并传递更新后的提示词
          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2]; // 上一个页面

          // 如果上一页是角色编辑页面，更新其提示词
          if (prevPage && prevPage.route.includes('role-editor')) {
            prevPage.setData({
              'form.prompt': this.data.prompt
            });
          }

          wx.navigateBack();
        }, 1500);
      } else {
        throw new Error(result.result?.error || '保存失败');
      }
    } catch (error) {
      console.error('保存提示词失败:', error);
      wx.hideLoading();
      // 显示更详细的错误信息
      const errorMsg = error.message || '保存失败';
      console.error('保存提示词失败:', errorMsg);

      wx.showToast({
        title: errorMsg.length > 20 ? errorMsg.substring(0, 20) + '...' : errorMsg,
        icon: 'none',
        duration: 3000
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 返回上一页
   */
  handleBack() {
    // 如果有未保存的修改，提示用户
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2]; // 上一个页面

    // 如果上一页是角色编辑页面，检查提示词是否有修改
    if (prevPage && prevPage.route.includes('role-editor')) {
      const originalPrompt = prevPage.data.form.prompt || '';
      if (this.data.prompt !== originalPrompt) {
        wx.showModal({
          title: '提示',
          content: '您有未保存的修改，确定要返回吗？',
          success: (res) => {
            if (res.confirm) {
              wx.navigateBack();
            }
          }
        });
        return;
      }
    }

    wx.navigateBack();
  },

  /**
   * 清空提示词
   */
  clearPrompt() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空当前提示词吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ prompt: '' });
        }
      }
    });
  }
});
