interface IEmotionData {
  // 主要情绪
  primary: {
    type: string;
    score: number;
  };
  // 详细情绪分析
  details: Array<{
    type: string;
    score: number;
  }>;
  // 情绪建议
  suggestions: string[];
}

Component({
  properties: {
    // 情绪数据
    emotion: {
      type: Object,
      value: {
        primary: {
          type: '平静',
          score: 0,
        },
        details: [],
        suggestions: [],
      } as IEmotionData,
    },
    // 是否显示详细分析
    showDetails: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    // 情绪类型对应的颜色
    emotionColors: {
      '平静': '#8e9aaf',
      '快乐': '#ffd93d',
      '悲伤': '#6c757d',
      '愤怒': '#ff6b6b',
      '焦虑': '#4d96ff',
      '惊讶': '#6c5ce7',
      '恐惧': '#a8e6cf',
    },
    // 是否展开详细信息
    isExpanded: false,
  },

  methods: {
    // 切换展开状态
    toggleExpand() {
      this.setData({
        isExpanded: !this.data.isExpanded,
      });
    },

    // 查看详细分析
    viewDetails() {
      this.triggerEvent('viewDetails');
    },

    // 开始练习
    startPractice() {
      this.triggerEvent('startPractice');
    },

    // 获取情绪对应的颜色
    getEmotionColor(type: string): string {
      return this.data.emotionColors[type] || '#8e9aaf';
    },

    // 格式化情绪分数(保留2位小数)
    formatScore(score: number): string {
      return (score * 100).toFixed(2) + '%';
    },
  },
}); 