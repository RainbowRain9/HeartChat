import { emotionTypes } from '../../../config';

Page({
  data: {
    loading: false,
    emotion: null,
    analysis: null,
    suggestions: [],
    history: []
  },

  onLoad() {
    this.loadEmotionHistory();
  },

  // 加载历史情绪数据
  async loadEmotionHistory() {
    try {
      this.setData({ loading: true });
      const db = wx.cloud.database();
      const messages = await db.collection('messages')
        .where({
          _openid: getApp().globalData.userInfo?.openid,
          emotion: { $exists: true }
        })
        .orderBy('createTime', 'desc')
        .limit(20)
        .get();

      const history = messages.data.map(msg => ({
        date: new Date(msg.createTime).toLocaleDateString(),
        content: msg.content,
        emotion: msg.emotion,
        emotionType: emotionTypes[msg.emotion] || 'default'
      }));

      this.setData({ history });
    } catch (err) {
      console.error('加载历史数据失败:', err);
      wx.showToast({
        title: '加载历史数据失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 分析文本情绪
  async analyzeText(e) {
    const { text } = e.detail;
    if (!text.trim()) return;

    try {
      this.setData({ loading: true });
      const { result } = await wx.cloud.callFunction({
        name: 'analysis',
        data: {
          type: 'emotion',
          text: text
        }
      });

      if (!result.success) throw new Error(result.error || '分析失败');

      this.setData({
        emotion: result.emotion,
        analysis: result.analysis,
        suggestions: result.suggestions || []
      });
    } catch (err) {
      console.error('情绪分析失败:', err);
      wx.showToast({
        title: err.message || '分析失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 查看详细分析
  viewDetail(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.history[index];

    this.setData({
      emotion: item.emotion,
      analysis: item.content,
      suggestions: item.suggestions || []
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '情绪分析 - 了解自己的情绪状态',
      path: '/packageA/pages/emotion/analysis'
    };
  }
});