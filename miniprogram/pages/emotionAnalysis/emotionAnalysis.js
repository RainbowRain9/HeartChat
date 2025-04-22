// pages/emotionAnalysis/emotionAnalysis.js
Page({
    /**
     * 页面的初始数据
     */
    data: {
      text: '',
      loading: false,
      emotionData: null,
      historyData: [],
      showDashboard: false,
      darkMode: false
    },
  
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
      // 如果有传入的文本，则自动填充
      if (options.text) {
        this.setData({
          text: options.text
        });
      }
    },
  
    /**
     * 输入文本变化
     */
    onInput: function (e) {
      this.setData({
        text: e.detail.value
      });
    },
  
    /**
     * 分析文本情绪
     */
    analyzeText: function () {
      const { text } = this.data;
      if (!text.trim()) return;
  
      this.setData({ loading: true });
  
      // 调用云函数进行情感分析
      wx.cloud.callFunction({
        name: 'analysis',
        data: {
          type: 'emotion',
          text: text
        }
      }).then(res => {
        console.log('情感分析结果:', res.result);
        
        if (res.result && res.result.success) {
          // 更新情感数据
          this.setData({
            emotionData: res.result.result,
            showDashboard: true,
            loading: false
          });
        } else {
          throw new Error(res.result?.error || '分析失败');
        }
      }).catch(err => {
        console.error('情感分析失败:', err);
        wx.showToast({
          title: '分析失败，请重试',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
    },
  
    /**
     * 关闭仪表盘
     */
    closeDashboard: function () {
      this.setData({
        showDashboard: false
      });
    },
  
    /**
     * 保存情感记录
     */
    saveEmotion: function () {
      wx.showToast({
        title: '已保存情感记录',
        icon: 'success'
      });
    },
  
    /**
     * 分享情感记录
     */
    shareEmotion: function () {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    },
  
    /**
     * 查看更多历史
     */
    viewMoreHistory: function () {
      wx.navigateTo({
        url: '/pages/emotionHistory/emotionHistory'
      });
    }
  })