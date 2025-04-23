// components/emotion-dashboard/emotion-dashboard.js
// 引入 echarts
const echarts = require('../../components/ec-canvas/echarts');

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
    // 情感分析结果
    emotionData: {
      type: Object,
      value: null,
      observer: function(newVal) {
        if (newVal) {
          this.processEmotionData(newVal);
        }
      }
    },
    // 历史情感数据
    historyData: {
      type: Array,
      value: []
    },
    // 是否显示
    show: {
      type: Boolean,
      value: false,
      observer: function(newVal) {
        if (newVal) {
          // 当显示组件时
          if (this.data.chartRendered) {
            // 如果图表已经渲染，只需要修复位置
            setTimeout(() => {
              this.fixChartsPosition();
            }, 500);
          } else if (this.data.emotionData) {
            // 如果图表还没有渲染，重新初始化
            setTimeout(() => {
              this.processEmotionData(this.data.emotionData);
            }, 300);
          }
        }
      }
    },
    // 暗黑模式
    darkMode: {
      type: Boolean,
      value: false
    },
    // 是否显示关闭按钮
    showCloseButton: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 处理后的情感数据
    emotion: {
      primary: '',
      secondary: [],
      intensity: 0,
      valence: 0,
      arousal: 0,
      trend: '未知',
      attention: '中',
    },
    // 雷达图数据
    radarDimensions: {
      trust: 0,
      openness: 0,
      resistance: 0,
      stress: 0,
      control: 0
    },
    // 关键词和触发词
    keywords: [],
    triggers: [],
    // 建议
    suggestions: [],
    // 总结
    summary: '',
    // 图表相关
    chartData: {
      emotion: [],
      dates: []
    },
    // ECharts配置
    emotionChartEc: {
      lazyLoad: true
    },
    radarChartEc: {
      lazyLoad: true
    },
    historyChartEc: {
      lazyLoad: true
    },
    // 情绪颜色映射
    emotionColors: {
      // 中文情感类型颜色映射
      '喜悦': '#10B981', // 绿色
      '开心': '#10B981',
      '平静': '#60A5FA', // 蓝色
      '平稳': '#60A5FA',
      '焦虑': '#F59E0B', // 黄色
      '担忧': '#F59E0B',
      '愤怒': '#EF4444', // 红色
      '生气': '#EF4444',
      '悲伤': '#6366F1', // 紫色
      '伤感': '#6366F1',
      '忧伤': '#6366F1',
      '疲惫': '#8B5CF6', // 紫罗兰
      '惊讶': '#EC4899', // 粉色
      '期待': '#14B8A6', // 青色
      '厌恶': '#7C3AED', // 深紫色
      '失望': '#9CA3AF', // 灰色
      '急切': '#F97316',  // 橙色
      '紧迫': '#F97316',  // 橙色
      '中性': '#9CA3AF', // 灰色

      // 兼容英文情感类型
      'joy': '#10B981', // 绿色
      'happy': '#10B981',
      'calm': '#60A5FA', // 蓝色
      'stable': '#60A5FA',
      'anxiety': '#F59E0B', // 黄色
      'anxious': '#F59E0B',
      'anger': '#EF4444', // 红色
      'angry': '#EF4444',
      'sadness': '#6366F1', // 紫色
      'sad': '#6366F1',
      'sorrow': '#6366F1',
      'fatigue': '#8B5CF6', // 紫罗兰
      'surprise': '#EC4899', // 粉色
      'anticipation': '#14B8A6', // 青色
      'disgust': '#7C3AED', // 深紫色
      'disappointment': '#9CA3AF', // 灰色
      'urgency': '#F97316',  // 橙色
      'neutral': '#9CA3AF' // 灰色
    },
    // 情绪图标映射
    emotionIcons: {
      // 中文情感类型图标映射
      '喜悦': 'smile',
      '开心': 'smile',
      '平静': 'meh',
      '平稳': 'meh',
      '焦虑': 'frown',
      '担忧': 'frown',
      '愤怒': 'angry',
      '生气': 'angry',
      '悲伤': 'sad-tear',
      '伤感': 'sad-tear',
      '忧伤': 'sad-tear',
      '疲惫': 'tired',
      '惊讶': 'surprise',
      '期待': 'grin-stars',
      '厌恶': 'grimace',
      '失望': 'sad',
      '急切': 'clock',
      '紧迫': 'clock',
      '中性': 'meh',

      // 兼容英文情感类型
      'joy': 'smile',
      'happy': 'smile',
      'calm': 'meh',
      'stable': 'meh',
      'anxiety': 'frown',
      'anxious': 'frown',
      'anger': 'angry',
      'angry': 'angry',
      'sadness': 'sad-tear',
      'sad': 'sad-tear',
      'sorrow': 'sad-tear',
      'fatigue': 'tired',
      'surprise': 'surprise',
      'anticipation': 'grin-stars',
      'disgust': 'grimace',
      'disappointment': 'sad',
      'urgency': 'clock',
      'neutral': 'meh'
    },
    // 英文情感类型到中文的映射
    emotionNameMap: {
      // 中文情感类型直接使用
      '喜悦': '喜悦',
      '开心': '开心',
      '平静': '平静',
      '平稳': '平稳',
      '焦虑': '焦虑',
      '担忧': '担忧',
      '愤怒': '愤怒',
      '生气': '生气',
      '悲伤': '悲伤',
      '伤感': '伤感',
      '忧伤': '忧伤',
      '疲惫': '疲惫',
      '惊讶': '惊讶',
      '期待': '期待',
      '厌恶': '厌恶',
      '失望': '失望',
      '急切': '急切',
      '紧迫': '紧迫',
      '中性': '中性',

      // 兼容英文情感类型
      'joy': '喜悦',
      'happy': '开心',
      'calm': '平静',
      'stable': '平稳',
      'anxiety': '焦虑',
      'anxious': '担忧',
      'anger': '愤怒',
      'angry': '生气',
      'sadness': '悲伤',
      'sad': '伤感',
      'sorrow': '忧伤',
      'fatigue': '疲惫',
      'surprise': '惊讶',
      'anticipation': '期待',
      'disgust': '厌恶',
      'disappointment': '失望',
      'urgency': '急切',
      'neutral': '中性'
    },
    // 图表渲染状态
    chartRendered: false
  },

  lifetimes: {
    attached: function() {
      // 在组件实例进入页面节点树时执行
    },
    ready: function() {
      // 在组件在视图层布局完成后执行
      if (this.data.emotionData) {
        this.processEmotionData(this.data.emotionData);
      }
    },
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 处理情感数据
    processEmotionData(data) {
      if (!data) return;

      // 使用常量控制是否打印调试日志
      const DEBUG_MODE = false;
      if (DEBUG_MODE) {
        console.log('处理情绪数据:', data);
        console.log('原始数据值 - intensity:', data.intensity, 'valence:', data.valence, 'arousal:', data.arousal);
      }

      // 提取主要情感数据 - 优先使用 type
      const primaryEmotion = data.type || data.primary_emotion || 'calm';

      // 使用常量控制是否打印调试日志
      if (DEBUG_MODE) {
        console.log('主要情绪类型:', primaryEmotion);
      }

      // 如果有关键词数据，将关键词分类并更新到数据库
      // 使用延迟执行，避免阻塞主线程
      if (data.topic_keywords && Array.isArray(data.topic_keywords) && data.topic_keywords.length > 0 && this.data.userId) {
        setTimeout(() => {
          this.classifyAndUpdateKeywords(data.topic_keywords);
        }, 500);
      }

      const emotion = {
        primary: this.data.emotionNameMap[primaryEmotion] || primaryEmotion,
        secondary: (data.secondary_emotions || []).map(e => this.data.emotionNameMap[e] || e),
        // 检测数据是否已经标准化（大于1表示可能已经是百分比值）
        intensity: typeof data.intensity === 'number'
          ? (data.intensity > 1 ? Math.min(data.intensity, 100) : Math.min(data.intensity * 100, 100))
          : 50, // 确保不超过100%

        // 对于valence，检测是否已经在 0-100 范围内
        valence: typeof data.valence === 'number'
          ? (data.valence > 1 ? Math.min(data.valence, 100) : (data.valence >= -1 && data.valence <= 1 ? (data.valence + 1) * 50 : Math.min(data.valence, 100)))
          : 50, // 智能处理不同范围的值

        // 对于arousal，检测是否已经在 0-100 范围内
        arousal: typeof data.arousal === 'number'
          ? (data.arousal > 1 ? Math.min(data.arousal, 100) : Math.min(data.arousal * 100, 100))
          : 50, // 确保不超过100%
        trend: data.trend_en || data.trend || 'unknown',
        attention: data.attention_level_en || data.attention_level || 'medium'
      };

      // 使用常量控制是否打印调试日志
      if (DEBUG_MODE) {
        console.log('处理后的情绪数据:', emotion);
        console.log('处理后的值 - intensity:', emotion.intensity, 'valence:', emotion.valence, 'arousal:', emotion.arousal);
      }

      // 提取雷达图维度
      let radarPercent = {};
      if (data.radar_dimensions) {
        // 处理数据，确保在 0-100 范围内，并检测是否已经标准化
        radarPercent = {
          trust: typeof data.radar_dimensions.trust === 'number'
            ? (data.radar_dimensions.trust > 1 ? Math.min(data.radar_dimensions.trust, 100) : Math.min(data.radar_dimensions.trust * 100, 100))
            : 50,
          openness: typeof data.radar_dimensions.openness === 'number'
            ? (data.radar_dimensions.openness > 1 ? Math.min(data.radar_dimensions.openness, 100) : Math.min(data.radar_dimensions.openness * 100, 100))
            : 50,
          resistance: typeof data.radar_dimensions.resistance === 'number'
            ? (data.radar_dimensions.resistance > 1 ? Math.min(data.radar_dimensions.resistance, 100) : Math.min(data.radar_dimensions.resistance * 100, 100))
            : 50,
          stress: typeof data.radar_dimensions.stress === 'number'
            ? (data.radar_dimensions.stress > 1 ? Math.min(data.radar_dimensions.stress, 100) : Math.min(data.radar_dimensions.stress * 100, 100))
            : 50,
          control: typeof data.radar_dimensions.control === 'number'
            ? (data.radar_dimensions.control > 1 ? Math.min(data.radar_dimensions.control, 100) : Math.min(data.radar_dimensions.control * 100, 100))
            : 50
        };
      } else {
        // 使用默认值
        radarPercent = {
          trust: 50,
          openness: 50,
          resistance: 50,
          stress: 50,
          control: 50
        };
      }

      // 使用常量控制是否打印调试日志
      if (DEBUG_MODE) {
        console.log('雷达图数据:', radarPercent);
        if (data.radar_dimensions) {
          console.log('原始雷达图数据:', data.radar_dimensions);
        }
      }

      // 更新数据
      this.setData({
        emotion,
        radarDimensions: radarPercent,
        keywords: data.topic_keywords || [],
        triggers: data.emotion_triggers || [],
        suggestions: data.suggestions || [],
        summary: data.summary || '无法生成情感报告'
      }, () => {
        // 数据更新后初始化图表
        this.initCharts();
      });
    },

    // 初始化图表
    initCharts() {
      try {
        // 使用延时确保组件已经完全渲染
        // 使用wx.nextTick替代requestAnimationFrame，适应小程序环境
        wx.nextTick(() => {
          // 使用Promise并行初始化图表，提高性能
          const initPromises = [];

          // 初始化情绪波动图
          this.emotionChartComponent = this.selectComponent('#emotionChart');
          if (this.emotionChartComponent) {
            initPromises.push(new Promise(resolve => {
              this.emotionChartComponent.init((canvas, width, height, dpr) => {
                const chart = echarts.init(canvas, null, {
                  width: width,
                  height: height,
                  devicePixelRatio: dpr
                });
                const option = this.getEmotionChartOption();
                chart.setOption(option);
                this.emotionChart = chart;
                resolve();
                return chart;
              });
            }));
          }

          // 初始化雷达图
          this.radarChartComponent = this.selectComponent('#radarChart');
          if (this.radarChartComponent) {
            initPromises.push(new Promise(resolve => {
              this.radarChartComponent.init((canvas, width, height, dpr) => {
                const chart = echarts.init(canvas, null, {
                  width: width,
                  height: height,
                  devicePixelRatio: dpr
                });
                const option = this.getRadarChartOption();
                chart.setOption(option);
                this.radarChart = chart;
                resolve();
                return chart;
              });
            }));
          }

          // 初始化历史对比图
          this.historyChartComponent = this.selectComponent('#historyChart');
          if (this.historyChartComponent) {
            initPromises.push(new Promise(resolve => {
              this.historyChartComponent.init((canvas, width, height, dpr) => {
                const chart = echarts.init(canvas, null, {
                  width: width,
                  height: height,
                  devicePixelRatio: dpr
                });
                const option = this.getHistoryChartOption();
                chart.setOption(option);
                this.historyChart = chart;
                resolve();
                return chart;
              });
            }));
          }

          // 等待所有图表初始化完成
          Promise.all(initPromises).then(() => {
            // 确保图表只渲染一次
            this.setData({
              chartRendered: true
            });

            // 图表初始化完成后，修复图表位置
            wx.nextTick(() => {
              this.fixChartsPosition();
            });
          });
        });
      } catch (error) {
        console.error('图表初始化失败:', error);
      }
    },

    // 获取情绪波动图配置
    getEmotionChartOption() {
      try {
        // 准备数据
        const now = new Date();
        const xAxisData = [];
        const seriesData = [];
        const darkMode = this.data.darkMode;

        // 生成过去7小时的时间标签
        for (let i = 6; i >= 0; i--) {
          const time = new Date(now.getTime() - i * 60 * 60 * 1000);
          xAxisData.push(`${time.getHours()}:00`);

          // 模拟数据，实际应从历史数据中获取
          if (i === 0) {
            seriesData.push(this.data.emotion.intensity);
          } else {
            // 生成50-80之间的随机值
            seriesData.push(Math.floor(Math.random() * 30) + 50);
          }
        }

        // 根据暗黑模式设置颜色
        const textColor = darkMode ? '#e0e0e0' : '#333';
        const lineColor = darkMode ? '#444' : '#999';
        const splitLineColor = darkMode ? '#333' : '#ddd';
        const mainColor = darkMode ? '#34D399' : '#10B981';
        const areaColorStart = darkMode ? 'rgba(52, 211, 153, 0.3)' : 'rgba(16, 185, 129, 0.3)';
        const areaColorEnd = darkMode ? 'rgba(52, 211, 153, 0.1)' : 'rgba(16, 185, 129, 0.1)';

        return {
          title: {
            text: '情绪波动',
            left: 'center',
            top: 0,
            textStyle: {
              fontSize: 14,
              fontWeight: 'normal',
              color: textColor
            }
          },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c}%',
            backgroundColor: darkMode ? 'rgba(50,50,50,0.9)' : 'rgba(255,255,255,0.9)',
            borderColor: darkMode ? '#555' : '#ddd',
            textStyle: {
              color: textColor
            }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: xAxisData,
            axisLine: {
              lineStyle: {
                color: lineColor
              }
            },
            axisLabel: {
              fontSize: 10,
              color: textColor
            }
          },
          yAxis: {
            type: 'value',
            min: 0,
            max: 100,
            axisLabel: {
              formatter: '{value}%',
              fontSize: 10,
              color: textColor
            },
            splitLine: {
              lineStyle: {
                type: 'dashed',
                color: splitLineColor
              }
            }
          },
          series: [{
            name: '情绪强度',
            type: 'line',
            smooth: true,
            data: seriesData,
            itemStyle: {
              color: mainColor
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                  offset: 0,
                  color: areaColorStart
                }, {
                  offset: 1,
                  color: areaColorEnd
                }]
              }
            }
          }]
        };
      } catch (error) {
        console.error('获取情绪波动图配置失败:', error);
        return {};
      }
    },

    // 获取雷达图配置
    getRadarChartOption() {
      try {
        const dimensions = this.data.radarDimensions;
        const darkMode = this.data.darkMode;
        const data = [
          dimensions.trust || 50,
          dimensions.openness || 50,
          dimensions.control || 50,
          dimensions.resistance || 50,
          dimensions.stress || 50
        ];

        // 根据暗黑模式设置颜色
        const textColor = darkMode ? '#e0e0e0' : '#333';
        const lineColor = darkMode ? '#444' : '#999';
        const splitLineColor = darkMode ? '#333' : '#ddd';
        const mainColor = darkMode ? '#34D399' : '#10B981';
        const areaColor = darkMode ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.3)';

        return {
          title: {
            text: '情绪维度',
            left: 'center',
            top: 0,
            textStyle: {
              fontSize: 14,
              fontWeight: 'normal',
              color: textColor
            }
          },
          tooltip: {
            trigger: 'item',
            backgroundColor: darkMode ? 'rgba(50,50,50,0.9)' : 'rgba(255,255,255,0.9)',
            borderColor: darkMode ? '#555' : '#ddd',
            textStyle: {
              color: textColor
            }
          },
          radar: {
            indicator: [
              { name: '信任度', max: 100 },
              { name: '开放度', max: 100 },
              { name: '控制感', max: 100 },
              { name: '抗拒度', max: 100 },
              { name: '压力水平', max: 100 }
            ],
            radius: '65%',
            splitNumber: 4,
            axisName: {
              fontSize: 10,
              color: textColor
            },
            splitLine: {
              lineStyle: {
                color: splitLineColor
              }
            },
            axisLine: {
              lineStyle: {
                color: lineColor
              }
            }
          },
          series: [{
            type: 'radar',
            data: [{
              value: data,
              name: '情绪维度',
              areaStyle: {
                color: areaColor
              },
              lineStyle: {
                color: mainColor
              },
              itemStyle: {
                color: mainColor
              }
            }]
          }]
        };
      } catch (error) {
        console.error('获取雷达图配置失败:', error);
        return {};
      }
    },

    // 获取历史对比图配置
    getHistoryChartOption() {
      try {
        // 准备数据
        const categories = ['一周前', '三天前', '昨天', '今天'];
        const positiveData = [60, 65, 70, this.data.emotion.valence];
        const stressData = [70, 65, 60, this.data.radarDimensions.stress];
        const energyData = [50, 55, 60, this.data.emotion.arousal];
        const darkMode = this.data.darkMode;

        // 根据暗黑模式设置颜色
        const textColor = darkMode ? '#e0e0e0' : '#333';
        const lineColor = darkMode ? '#444' : '#999';
        const splitLineColor = darkMode ? '#333' : '#ddd';
        const positiveColor = darkMode ? '#34D399' : '#10B981';
        const stressColor = darkMode ? '#FBBF24' : '#F59E0B';
        const energyColor = darkMode ? '#93C5FD' : '#60A5FA';

        return {
          title: {
            text: '情绪历史对比',
            left: 'center',
            top: 0,
            textStyle: {
              fontSize: 14,
              fontWeight: 'normal',
              color: textColor
            }
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            },
            formatter: function(params) {
              let result = `${params[0].axisValue}<br/>`;
              params.forEach(param => {
                result += `${param.marker}${param.seriesName}: ${param.value}%<br/>`;
              });
              return result;
            },
            backgroundColor: darkMode ? 'rgba(50,50,50,0.9)' : 'rgba(255,255,255,0.9)',
            borderColor: darkMode ? '#555' : '#ddd',
            textStyle: {
              color: textColor
            }
          },
          legend: {
            data: ['积极', '压力', '能量'],
            bottom: 0,
            itemWidth: 12,
            itemHeight: 8,
            textStyle: {
              fontSize: 10,
              color: textColor
            }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '15%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: categories,
            axisLine: {
              lineStyle: {
                color: lineColor
              }
            },
            axisLabel: {
              fontSize: 10,
              color: textColor
            }
          },
          yAxis: {
            type: 'value',
            min: 0,
            max: 100,
            axisLabel: {
              formatter: '{value}%',
              fontSize: 10,
              color: textColor
            },
            splitLine: {
              lineStyle: {
                type: 'dashed',
                color: splitLineColor
              }
            }
          },
          series: [
            {
              name: '积极',
              type: 'bar',
              data: positiveData,
              itemStyle: {
                color: positiveColor
              }
            },
            {
              name: '压力',
              type: 'bar',
              data: stressData,
              itemStyle: {
                color: stressColor
              }
            },
            {
              name: '能量',
              type: 'bar',
              data: energyData,
              itemStyle: {
                color: energyColor
              }
            }
          ]
        };
      } catch (error) {
        console.error('获取历史对比图配置失败:', error);
        return {};
      }
    },

    // 关闭面板
    closePanel() {
      this.triggerEvent('close');
      // 延迟重置图表，避免闪烁
      setTimeout(() => {
        this.fixChartsPosition();
      }, 500);
    },

    // 分类关键词并更新到数据库
    async classifyAndUpdateKeywords(keywords) {
      if (!keywords || keywords.length === 0 || !this.data.userId) {
        return;
      }

      try {
        // 将关键词转换为标准格式
        const processedKeywords = keywords.map(keyword => {
          // 如果关键词是字符串，转换为对象
          if (typeof keyword === 'string') {
            return {
              word: keyword,
              weight: 1.0
            };
          }
          return keyword;
        });

        // 引入用户兴趣服务
        const userInterestsService = require('../../services/userInterestsService');

        // 调用云函数分类关键词
        const result = await wx.cloud.callFunction({
          name: 'analysis',
          data: {
            type: 'classify_keywords',
            keywords: processedKeywords.map(k => typeof k === 'string' ? k : k.word),
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

          // 统计各分类的关键词数量
          const categoryStats = {};
          processedKeywords.forEach(keyword => {
            const word = typeof keyword === 'string' ? keyword : keyword.word;
            const category = categoryMap[word] || '未分类';
            categoryStats[category] = (categoryStats[category] || 0) + 1;
          });

          console.log('分类统计:', categoryStats);

          // 将分类统计转换为分类数组格式，以便于存储
          const categoriesArray = Object.entries(categoryStats).map(([categoryName, count]) => ({
            name: categoryName,
            count: count,
            firstSeen: new Date(),
            lastUpdated: new Date()
          }));

          // 将分类结果合并到关键词中
          const classifiedKeywords = processedKeywords.map(keyword => {
            const word = typeof keyword === 'string' ? keyword : keyword.word;
            const weight = typeof keyword === 'string' ? 1.0 : (keyword.weight || 1.0);

            return {
              word: word,
              weight: weight,
              category: categoryMap[word] || '未分类',
              emotionScore: 0 // 默认情绪分数
            };
          });

          console.log('分类后的关键词:', classifiedKeywords);

          // 批量更新用户兴趣，包括分类数组
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
          const defaultKeywords = processedKeywords.map(keyword => {
            const word = typeof keyword === 'string' ? keyword : keyword.word;
            const weight = typeof keyword === 'string' ? 1.0 : (keyword.weight || 1.0);

            return {
              word: word,
              weight: weight,
              category: '未分类',
              emotionScore: 0
            };
          });

          // 统计默认分类的关键词数量
          const categoryStats = {
            '未分类': defaultKeywords.length
          };

          // 将分类统计转换为分类数组格式
          const categoriesArray = [{
            name: '未分类',
            count: defaultKeywords.length,
            firstSeen: new Date(),
            lastUpdated: new Date()
          }];

          // 批量更新用户兴趣，包括分类数组
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

    // 保存情感记录
    saveEmotion() {
      this.triggerEvent('save');
    },

    // 分享情感记录
    shareEmotion() {
      this.triggerEvent('share');
    },

    // 查看更多历史
    viewMoreHistory() {
      this.triggerEvent('viewMore');
    },

    onPageScroll() {
      // 防止页面滚动时图表重绘
      if (this.data.chartRendered) {
        this.fixChartsPosition();
      }
    },

    // 组件滚动事件
    onScroll() {
      if (this.data.chartRendered) {
        this.fixChartsPosition();
      }
    },

    // 防止图表随页面滚动而移动
    fixChartsPosition() {
      try {
        // 使用延时确保图表容器已经渲染完成
        setTimeout(() => {
          if (this.emotionChart) {
            this.emotionChart.resize();
          }
          if (this.radarChart) {
            this.radarChart.resize();
          }
          if (this.historyChart) {
            this.historyChart.resize();
          }
        }, 300);
      } catch (error) {
        console.error('图表位置修复失败:', error);
      }
    }
  }
})
