// components/emotion-history/emotion-history.js
const emotionService = require('../../services/emotionService');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示历史记录
    show: {
      type: Boolean,
      value: false
    },
    // 用户ID
    userId: {
      type: String,
      value: ''
    },
    // 角色ID
    roleId: {
      type: String,
      value: ''
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
    loading: false,
    historyRecords: [],
    emotionLabels: emotionService.EmotionTypeLabels,
    emotionColors: emotionService.EmotionTypeColors
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 关闭历史记录
    closeHistory() {
      this.triggerEvent('close');
    },
    
    // 加载历史记录
    async loadHistory() {
      if (!this.properties.userId) {
        return;
      }
      
      this.setData({ loading: true });
      
      try {
        // 获取历史记录
        const records = await emotionService.getEmotionHistory(
          this.properties.userId,
          this.properties.roleId || null,
          20
        );
        
        // 处理记录数据
        const processedRecords = records.map(record => {
          // 格式化时间
          const createTime = new Date(record.createTime);
          const formattedTime = `${createTime.getFullYear()}-${String(createTime.getMonth() + 1).padStart(2, '0')}-${String(createTime.getDate()).padStart(2, '0')} ${String(createTime.getHours()).padStart(2, '0')}:${String(createTime.getMinutes()).padStart(2, '0')}`;
          
          return {
            ...record,
            formattedTime
          };
        });
        
        this.setData({
          historyRecords: processedRecords,
          loading: false
        });
      } catch (error) {
        console.error('加载历史记录失败:', error);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载历史记录失败',
          icon: 'none'
        });
      }
    },
    
    // 查看记录详情
    viewRecordDetail(e) {
      const { index } = e.currentTarget.dataset;
      const record = this.data.historyRecords[index];
      
      this.triggerEvent('detail', { record });
    },
    
    // 阻止事件冒泡
    stopPropagation(e) {
      // 阻止事件冒泡
    }
  },
  
  // 组件生命周期
  lifetimes: {
    attached() {
      // 组件加载时初始化
    },
    
    // 组件显示时加载历史记录
    ready() {
      if (this.properties.show) {
        this.loadHistory();
      }
    }
  },
  
  // 监听属性变化
  observers: {
    'show': function(show) {
      if (show) {
        this.loadHistory();
      }
    }
  }
});
