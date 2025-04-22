// pages/keywordTest/keywordTest.js
const keywordService = require('../../services/keywordService');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    text: '',
    keywords: [],
    loading: false
  },

  /**
   * 输入文本变化
   */
  onInput: function(e) {
    this.setData({
      text: e.detail.value
    });
  },

  /**
   * 提取关键词
   */
  extractKeywords: function() {
    const { text } = this.data;
    if (!text.trim()) {
      wx.showToast({
        title: '请输入文本',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    // 调用关键词提取服务
    keywordService.extractKeywords(text)
      .then(keywords => {
        console.log('提取到的关键词:', keywords);

        // 为每个关键词添加格式化后的权重值
        const formattedKeywords = keywords.map(item => {
          return {
            ...item,
            weightFormatted: Math.round(item.weight * 100)
          };
        });

        this.setData({
          keywords: formattedKeywords,
          loading: false
        });
      })
      .catch(err => {
        console.error('关键词提取失败:', err);
        wx.showToast({
          title: '提取失败，请重试',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
  },

  /**
   * 清空输入
   */
  clearInput: function() {
    this.setData({
      text: '',
      keywords: []
    });
  }
});
