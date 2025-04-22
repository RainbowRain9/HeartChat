Page({
  data: {
    title: '隐私协议'
  },

  onShareAppMessage() {
    return {
      title: 'HeartChat隐私协议',
      path: '/pages/agreement/privacy'
    };
  }
}); 