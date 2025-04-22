// components/emotion-panel/emotion-panel.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 情感分析结果
    emotion: {
      type: Object,
      value: null,
      observer: function(newVal) {
        if (newVal) {
          // 计算各种属性
          const hasKeywords = !!(newVal.topic_keywords && newVal.topic_keywords.length) || !!(newVal.keywords && newVal.keywords.length);

          // 处理情感强度显示
          const intensityText = ((newVal.intensity || 0.5) * 100).toFixed(0) + '%';

          // 处理情感极性显示
          let polarityText = '中性';
          if (newVal.valence !== undefined) {
            if (newVal.valence > 0) {
              polarityText = (newVal.valence * 100).toFixed(0) + '% 正面';
            } else if (newVal.valence < 0) {
              polarityText = (newVal.valence * -100).toFixed(0) + '% 负面';
            }
          }

          // 处理情绪趋势显示
          let trendText = '未知';
          if (newVal.trend) {
            if (newVal.trend === 'rising') {
              trendText = '上升';
            } else if (newVal.trend === 'falling') {
              trendText = '下降';
            } else if (newVal.trend === 'stable') {
              trendText = '稳定';
            }
          }

          this.setData({
            hasEmotion: true,
            emotionData: newVal,
            hasKeywords: hasKeywords,
            intensityText: intensityText,
            polarityText: polarityText,
            trendText: trendText
          });
        }
      }
    },
    // 是否显示面板
    show: {
      type: Boolean,
      value: false
    },
    // 是否使用暗色主题
    darkMode: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    hasEmotion: false,
    emotionData: null,
    hasKeywords: false,
    // 情感类型标签
    emotionLabels: {
      joy: '喜悦',
      sadness: '伤感',
      anger: '愤怒',
      anxiety: '焦虑',
      neutral: '平静',
      // 新增情感类型标签
      calm: '平静',
      surprise: '惊讶',
      disgust: '厌恶',
      anticipation: '期待',
      urgency: '紧迫',
      disappointment: '失望',
      fatigue: '疲惫'
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 关闭面板
    closePanel() {
      this.triggerEvent('close');
    },

    // 切换角色
    switchRole() {
      this.triggerEvent('switchRole', { emotion: this.data.emotionData });
    },

    // 保存情感记录
    saveEmotion() {
      this.triggerEvent('save', { emotion: this.data.emotionData });
    },

    // 查看历史记录
    viewHistory() {
      this.triggerEvent('history');
    },

    // 阻止事件冒泡
    stopPropagation(e) {
      // 阻止事件冒泡
    }
  }
});
