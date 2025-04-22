Page({
  data: {
    title: '服务协议'
  },

  onShareAppMessage() {
    return {
      title: 'HeartChat服务协议',
      path: '/pages/agreement/service'
    };
  }
}); 