// pages/emotionTest/emotionTest.js
const emotionService = require('../../services/emotionService');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    text: '',
    loading: false,
    emotion: null,
    showEmotionPanel: false,
    showEmotionHistory: false,
    darkMode: false,
    userInfo: null,
    roleList: [],
    currentRole: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取用户信息
    this.getUserInfo();
    // 获取角色列表
    this.getRoleList();
  },

  /**
   * 获取用户信息
   */
  getUserInfo: function() {
    const app = getApp();
    if (app.globalData && app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      });
    } else {
      // 监听用户信息变化
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo
        });
      };
    }
  },

  /**
   * 获取角色列表
   */
  async getRoleList() {
    try {
      const db = wx.cloud.database();
      const { data } = await db.collection('roles').get();

      this.setData({
        roleList: data,
        currentRole: data.length > 0 ? data[0] : null
      });
    } catch (error) {
      console.error('获取角色列表失败:', error);
      wx.showToast({
        title: '获取角色列表失败',
        icon: 'none'
      });
    }
  },

  /**
   * 输入文本变化
   */
  onInputChange: function(e) {
    this.setData({
      text: e.detail.value
    });
  },

  /**
   * 分析情感
   */
  async analyzeEmotion() {
    const { text } = this.data;

    if (!text || !text.trim()) {
      wx.showToast({
        title: '请输入文本',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    try {
      // 调用情感分析服务
      const emotion = await emotionService.analyzeEmotion(text, {
        roleId: this.data.currentRole ? this.data.currentRole._id : null,
        saveRecord: true
      });

      // 更新状态
      this.setData({
        emotion,
        loading: false,
        showEmotionPanel: true
      });

      // 记录已在云函数中保存
    } catch (error) {
      console.error('情感分析失败:', error);
      wx.showToast({
        title: '情感分析失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  /**
   * 关闭情感面板
   */
  closeEmotionPanel() {
    this.setData({
      showEmotionPanel: false
    });
  },

  /**
   * 切换角色
   */
  async onSwitchRole(e) {
    const { emotion } = e.detail;

    if (!emotion || !this.data.roleList || this.data.roleList.length === 0) {
      return;
    }

    // 根据情感匹配推荐角色
    const suggestedRole = emotionService.matchRoleByEmotion(emotion, this.data.roleList);

    if (suggestedRole) {
      // 更新当前角色
      this.setData({
        currentRole: suggestedRole,
        showEmotionPanel: false
      });

      wx.showToast({
        title: `已切换到: ${suggestedRole.role_name}`,
        icon: 'none'
      });
    }
  },

  /**
   * 保存情感记录
   */
  onSaveEmotion() {
    wx.showToast({
      title: '情感记录已保存',
      icon: 'success'
    });
    this.setData({
      showEmotionPanel: false
    });
  },

  /**
   * 查看历史记录
   */
  onViewHistory() {
    this.setData({
      showEmotionHistory: true,
      showEmotionPanel: false
    });
  },

  /**
   * 关闭历史记录
   */
  closeEmotionHistory() {
    this.setData({
      showEmotionHistory: false
    });
  },

  /**
   * 查看记录详情
   */
  onViewRecordDetail(e) {
    const { record } = e.detail;

    // 显示记录详情
    this.setData({
      emotion: record.analysis,
      showEmotionPanel: true,
      showEmotionHistory: false
    });
  },

  /**
   * 切换主题
   */
  toggleTheme() {
    this.setData({
      darkMode: !this.data.darkMode
    });
  }
});
