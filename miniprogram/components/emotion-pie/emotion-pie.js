// components/emotion-pie/emotion-pie.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 情感分析结果
    emotion: {
      type: Object,
      value: {
        type: 'neutral',
        intensity: 0.5
      },
      observer: function(newVal) {
        this.updatePieChart(newVal);
      }
    },
    // 是否使用暗色主题
    darkMode: {
      type: Boolean,
      value: false,
      observer: function(newVal) {
        this.updateTheme(newVal);
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 情感类型颜色
    colors: {
      joy: '#2ECC71',    // 绿色
      sadness: '#3498DB', // 蓝色
      anger: '#E74C3C',   // 红色
      anxiety: '#F1C40F', // 黄色
      neutral: '#95A5A6',  // 灰色
      // 新增情感类型颜色
      calm: '#7FB3D5',    // 淡蓝色
      surprise: '#9B59B6', // 紫色
      disgust: '#E67E22',  // 橙色
      anticipation: '#1ABC9C', // 青绿色
      urgency: '#C0392B',  // 深红色
      disappointment: '#7F8C8D', // 深灰色
      fatigue: '#BDC3C7'   // 浅灰色
    },
    // 情感类型标签
    labels: {
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
    },
    // 当前主要情感
    currentEmotion: 'neutral',
    // 情感强度
    intensity: 0.5,
    // 饼图扇区角度
    sectors: {
      joy: { start: 0, end: 72 },
      sadness: { start: 72, end: 144 },
      anger: { start: 144, end: 216 },
      anxiety: { start: 216, end: 288 },
      neutral: { start: 288, end: 360 },
      // 新增情感类型扇区角度
      calm: { start: 0, end: 72 },
      surprise: { start: 72, end: 144 },
      disgust: { start: 144, end: 216 },
      anticipation: { start: 216, end: 288 },
      urgency: { start: 288, end: 360 },
      disappointment: { start: 0, end: 72 },
      fatigue: { start: 72, end: 144 }
    },
    // 高亮扇区
    highlightSector: 'neutral',
    // 是否显示饼图
    showPie: true
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 更新饼图
    updatePieChart(emotion) {
      if (!emotion) return;

      // 优先使用primary_emotion字段，兼容旧版type字段
      const type = emotion.primary_emotion || emotion.type || 'neutral';
      const intensity = emotion.intensity || 0.5;

      // 更新当前情感和强度
      this.setData({
        currentEmotion: type,
        intensity: intensity,
        highlightSector: type
      });

      // 触发更新事件
      this.triggerEvent('update', { type, intensity });
    },

    // 更新主题
    updateTheme(isDark) {
      // 根据主题调整颜色
      const colors = isDark ? {
        joy: '#26A65B',    // 深绿色
        sadness: '#2980B9', // 深蓝色
        anger: '#C0392B',   // 深红色
        anxiety: '#D4AC0D', // 深黄色
        neutral: '#7F8C8D',  // 深灰色
        // 新增情感类型颜色
        calm: '#5D8CAE',    // 深淡蓝色
        surprise: '#8E44AD', // 深紫色
        disgust: '#D35400',  // 深橙色
        anticipation: '#16A085', // 深青绿色
        urgency: '#A93226',  // 更深红色
        disappointment: '#707B7C', // 更深灰色
        fatigue: '#A6ACAF'   // 深浅灰色
      } : {
        joy: '#2ECC71',    // 绿色
        sadness: '#3498DB', // 蓝色
        anger: '#E74C3C',   // 红色
        anxiety: '#F1C40F', // 黄色
        neutral: '#95A5A6',  // 灰色
        // 新增情感类型颜色
        calm: '#7FB3D5',    // 淡蓝色
        surprise: '#9B59B6', // 紫色
        disgust: '#E67E22',  // 橙色
        anticipation: '#1ABC9C', // 青绿色
        urgency: '#C0392B',  // 深红色
        disappointment: '#7F8C8D', // 深灰色
        fatigue: '#BDC3C7'   // 浅灰色
      };

      this.setData({ colors });
    },

    // 点击情感扇区
    onSectorTap(e) {
      const { emotion } = e.currentTarget.dataset;

      // 更新高亮扇区
      this.setData({
        highlightSector: emotion
      });

      // 触发选择事件
      this.triggerEvent('select', { type: emotion });
    }
  },

  // 组件生命周期
  lifetimes: {
    attached() {
      // 组件加载时初始化饼图
      this.updatePieChart(this.properties.emotion);
      this.updateTheme(this.properties.darkMode);
    }
  }
});
