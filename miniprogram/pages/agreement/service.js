// pages/agreement/service.js
Page({
  data: {
    statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20,
    navBarHeight: 44,
    lastUpdated: '2024年3月10日'
  },

  onLoad: function (options) {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '服务协议'
    });

    // 检查是否从欢迎页面跳转而来
    if (options && options.from === 'welcome') {
      this.setData({
        showBackButton: false
      });
    } else {
      this.setData({
        showBackButton: true
      });
    }
  },

  onReady: function() {
    // 页面渲染完成
  },

  onShow: function() {
    // 页面显示
  },

  onHide: function() {
    // 页面隐藏
  },

  onUnload: function() {
    // 页面卸载
  },

  // 返回上一页
  navigateBack: function() {
    wx.navigateBack({
      delta: 1
    });
  }
})
