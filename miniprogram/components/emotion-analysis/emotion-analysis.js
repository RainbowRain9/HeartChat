// components/emotion-analysis/emotion-analysis.js
const emotionService = require('../../services/emotionService');
const keywordService = require('../../services/keywordService');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
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
    // 当前情感分析结果
    emotion: {
      type: Object,
      value: null,
      observer: function(newVal) {
        if (newVal) {
          // 计算强度格式化值
          const intensity = newVal.intensity ? Math.round(newVal.intensity * 100) : 0;
          this.setData({
            currentEmotion: newVal,
            intensityFormatted: String(intensity)
          });
          this.initCharts();
        }
      }
    },
    // 是否显示
    show: {
      type: Boolean,
      value: false
    },
    // 暗黑模式
    darkMode: {
      type: Boolean,
      value: false,
      observer: function(newVal) {
        this.setData({
          isDarkMode: newVal
        });
        this.initCharts();
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    currentEmotion: null,
    emotionHistory: [],
    isDarkMode: false,
    intensityFormatted: '0',
    // 图表相关
    trendData: [50, 50, 50, 50, 50],
    trendLabels: ['12:00', '12:30', '13:00', '13:30', '14:00'],
    radarData: [50, 50, 50, 50, 50],
    // 关键词相关
    keywords: [],
    // 情感类型映射
    emotionTypes: {
      joy: '喜悦',
      sadness: '伤感',
      anger: '愤怒',
      anxiety: '焦虑',
      neutral: '平静',
      // 增加中文情感类型映射
      '喜悦': '喜悦',
      '伤感': '伤感',
      '愤怒': '愤怒',
      '焦虑': '焦虑',
      '平静': '平静',
      '平稳': '平静'
    },
    // 情感维度
    emotionDimensions: ['积极', '能力', '共情', '压力', '稳定']
  },

  lifetimes: {
    attached: function() {
      // 在组件实例进入页面节点树时执行
      this.loadEmotionHistory();
    },
    ready: function() {
      // 在组件在视图层布局完成后执行
      this.initCharts();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 加载情感历史记录
    async loadEmotionHistory() {
      if (!this.data.userId || !this.data.roleId) {
        return;
      }

      try {
        const history = await emotionService.getEmotionHistory(this.data.userId, this.data.roleId, 10);
        this.setData({
          emotionHistory: history
        });
        this.initCharts();
      } catch (err) {
        console.error('加载情感历史记录失败:', err);
      }
    },

    // 分析文本情感
    async analyzeText(text) {
      if (!text || typeof text !== 'string' || text.trim() === '') {
        return null;
      }

      try {
        // 调用情感分析服务
        const result = await emotionService.analyzeEmotion(text);

        if (result) {
          // 更新当前情感分析结果
          console.log('更新情感数据:', result);
          const intensity = result.intensity ? Math.round(result.intensity * 100) : 0;

          // 提取关键词
          // 如果情感分析结果中包含关键词，直接使用
          if (result.keywords && Array.isArray(result.keywords) && result.keywords.length > 0) {
            console.log('使用情感分析返回的关键词:', result.keywords);
            // 将关键词分类并更新到数据库
            this.classifyAndUpdateKeywords(result.keywords);
          } else {
            // 如果情感分析结果中不包含关键词，则从文本中提取
            this.extractKeywords(text);
          }

          this.setData({
            currentEmotion: result,
            intensityFormatted: String(intensity)
          }, () => {
            // 在数据更新后初始化图表
            this.initCharts();
          });

          return result;
        }
      } catch (err) {
        console.error('分析文本情感失败:', err);
      }

      return null;
    },

    // 提取关键词
    async extractKeywords(text) {
      if (!text || typeof text !== 'string' || text.trim() === '') {
        return;
      }

      try {
        // 调用关键词提取服务
        const keywords = await keywordService.extractKeywords(text, 10);
        console.log('提取到的关键词:', keywords);

        // 为每个关键词添加格式化后的权重值
        const formattedKeywords = keywords.map(item => {
          return {
            ...item,
            weightFormatted: Math.round(item.weight * 100)
          };
        });

        // 更新关键词数据
        this.setData({
          keywords: formattedKeywords
        });

        // 将关键词分类并更新到数据库
        this.classifyAndUpdateKeywords(keywords);
      } catch (err) {
        console.error('关键词提取失败:', err);
      }
    },

    // 分类关键词并更新到数据库
    async classifyAndUpdateKeywords(keywords) {
      if (!keywords || keywords.length === 0 || !this.data.userId) {
        return;
      }

      try {
        // 引入用户兴趣服务
        const userInterestsService = require('../../services/userInterestsService');

        // 调用云函数分类关键词
        const result = await wx.cloud.callFunction({
          name: 'analysis',
          data: {
            type: 'classify_keywords',
            keywords: keywords.map(k => k.word),
            batch: true
          }
        });

        console.log('关键词分类结果:', result);

        // 如果分类成功，将分类结果合并到关键词中
        if (result.result && result.result.success &&
            result.result.data && Array.isArray(result.result.data.classifications)) {

          // 将分类结果转换为映射
          const categoryMap = {};
          result.result.data.classifications.forEach(item => {
            categoryMap[item.keyword] = item.category;
          });

          // 将分类结果合并到关键词中
          const classifiedKeywords = keywords.map(keyword => ({
            word: keyword.word,
            weight: keyword.weight,
            category: categoryMap[keyword.word] || '未分类',
            emotionScore: 0 // 默认情绪分数
          }));

          console.log('分类后的关键词:', classifiedKeywords);

          // 创建分类统计数据
          const categoryStats = {};
          classifiedKeywords.forEach(keyword => {
            if (keyword.category) {
              categoryStats[keyword.category] = (categoryStats[keyword.category] || 0) + 1;
            }
          });

          console.log('分类统计:', categoryStats);

          // 创建分类数组
          const categoriesArray = Object.entries(categoryStats).map(([name, count]) => ({
            name,
            count,
            firstSeen: new Date(),
            lastUpdated: new Date()
          }));

          // 批量更新用户兴趣
          const updateResult = await userInterestsService.batchUpdateUserInterests(
            this.data.userId,
            classifiedKeywords,
            true, // 自动分类
            categoryStats, // 传递分类统计
            categoriesArray // 传递分类数组
          );
          console.log('更新用户兴趣结果:', updateResult);
        } else {
          // 如果分类失败，使用默认分类更新用户兴趣
          const defaultKeywords = keywords.map(keyword => ({
            word: keyword.word,
            weight: keyword.weight,
            category: '未分类',
            emotionScore: 0
          }));

          // 创建默认分类统计数据
          const categoryStats = {
            '未分类': defaultKeywords.length
          };

          // 创建分类数组
          const categoriesArray = [{
            name: '未分类',
            count: defaultKeywords.length,
            firstSeen: new Date(),
            lastUpdated: new Date()
          }];

          // 批量更新用户兴趣
          const updateResult = await userInterestsService.batchUpdateUserInterests(
            this.data.userId,
            defaultKeywords,
            true, // 自动分类
            categoryStats, // 传递分类统计
            categoriesArray // 传递分类数组
          );
          console.log('使用默认分类更新用户兴趣结果:', updateResult);
        }
      } catch (err) {
        console.error('分类关键词并更新到数据库失败:', err);
      }
    },

    // 初始化图表
    initCharts() {
      console.log('开始初始化图表');
      try {
        this.updateTrendData();
        this.updateRadarData();
      } catch (error) {
        console.error('初始化图表失败:', error);
      }
    },

    // 更新趋势图数据
    updateTrendData() {
      console.log('更新趋势图数据');
      try {
        // 准备数据
        const history = this.data.emotionHistory || [];
        const dates = [];
        const intensities = [];

        // 如果有历史数据
        if (history.length > 0) {
          history.forEach(item => {
            const date = new Date(item.createTime);
            dates.push(`${date.getHours()}:${date.getMinutes()}`);
            intensities.push(Math.round(item.analysis.intensity * 100));
          });
        } else {
          // 如果没有历史数据，使用当前时间和当前情感强度
          const now = new Date();
          const currentIntensity = this.data.currentEmotion ?
            Math.round(this.data.currentEmotion.intensity * 100) : 50;

          for (let i = 0; i < 5; i++) {
            const time = new Date(now.getTime() - i * 30 * 60 * 1000);
            dates.unshift(`${time.getHours()}:${time.getMinutes()}`);
            intensities.unshift(currentIntensity);
          }
        }

        // 更新数据
        this.setData({
          trendData: intensities,
          trendLabels: dates
        });
      } catch (error) {
        console.error('更新趋势图数据失败:', error);
      }
    },

    // 更新雷达图数据
    updateRadarData() {
      console.log('更新雷达图数据');
      try {
        // 准备数据
        const currentEmotion = this.data.currentEmotion;
        let data = [50, 50, 50, 50, 50]; // 默认值

        if (currentEmotion) {
          // 根据情感类型和强度计算各维度的值
          const intensity = currentEmotion.intensity * 100;
          const type = currentEmotion.type;

          // 根据情感类型调整各维度的值
          switch(type) {
            case 'joy':
            case '喜悦':
              data = [80, 70, 75, 30, 65];
              break;
            case 'sadness':
            case '伤感':
            case '悲伤':
              data = [30, 40, 60, 70, 45];
              break;
            case 'anger':
            case '愤怒':
              data = [60, 65, 30, 80, 35];
              break;
            case 'anxiety':
            case '焦虑':
              data = [40, 50, 45, 75, 30];
              break;
            case 'neutral':
            case '平静':
            case '平稳':
              data = [50, 50, 50, 50, 50];
              break;
          }

          // 根据强度调整
          data = data.map(value => {
            // 将值向情感强度靠拢
            return Math.round(value * 0.5 + intensity * 0.5);
          });
        }

        // 更新数据
        this.setData({
          radarData: data
        });
      } catch (error) {
        console.error('更新雷达图数据失败:', error);
      }
    },

    // 记录心情
    saveEmotion() {
      this.triggerEvent('save');
    },

    // 分享给TA
    shareEmotion() {
      this.triggerEvent('share');
    },

    // 关闭面板
    closePanel() {
      this.triggerEvent('close');
    }
  }
})
