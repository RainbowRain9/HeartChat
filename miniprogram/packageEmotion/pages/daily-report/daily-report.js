// packageEmotion/pages/daily-report/daily-report.js
const reportService = require('../../../services/reportService');
const { formatDate, formatTime } = require('../../../utils/date');

// 引入 echarts
const echarts = require('../../../components/ec-canvas/echarts');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    report: null,
    date: '',
    formattedDate: '',
    error: '',
    chartRendered: false,
    darkMode: false,
    statusBarHeight: 20, // 状态栏高度，默认值
    navBarHeight: 44, // 导航栏高度，默认值
    emotionColorMap: {}, // 情绪颜色映射
    keywordTags: [], // 关键词标签数据
    // 我们不再需要标准化关键词数据，因为我们使用了关键词云
    // 默认的今日运势数据，当API返回的数据不完整时使用
    defaultFortune: {
      "good": ["放松心情", "与朋友交流", "阅读书籍", "适度运动"],
      "bad": ["过度劳累", "钻牛角尖", "情绪化决策", "忽视休息"]
    },
    // 添加 ec 对象用于图表初始化
    ec: {
      lazyLoad: true
    },
    emotionColors: {
      'happy': '#FFD700',
      'sad': '#6495ED',
      'angry': '#FF6347',
      'anxious': '#9370DB',
      'neutral': '#90EE90',
      'excited': '#FF69B4',
      'tired': '#A9A9A9',
      'relaxed': '#87CEEB',
      'surprised': '#FFA500',
      'confused': '#BA55D3'
    },
    darkModeEmotionColors: {
      'happy': '#f6e05e',     // 更暗的金色
      'sad': '#63b3ed',      // 更暗的蓝色
      'angry': '#fc8181',    // 更暗的红色
      'anxious': '#b794f4',  // 更暗的紫色
      'neutral': '#68d391',  // 更暗的绿色
      'excited': '#f687b3',  // 更暗的粉色
      'tired': '#cbd5e0',    // 更暗的灰色
      'relaxed': '#76e4f7',  // 更暗的浅蓝色
      'surprised': '#fbd38d', // 更暗的橙色
      'confused': '#d6bcfa'  // 更暗的淡紫色
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取当前日期
    const today = new Date();
    const dateStr = formatDate(today);

    // 如果有传入日期参数，使用传入的日期
    let targetDate = options.date || dateStr;
    let reportId = options.id || '';

    // 获取系统信息和导航栏高度
    this.getSystemInfo();

    // 检测系统暗夜模式
    this.checkDarkMode();

    // 监听系统主题变化
    wx.onThemeChange((result) => {
      this.setData({
        darkMode: result.theme === 'dark'
      });
      // 更新全局数据
      const app = getApp();
      if (app.globalData) {
        app.globalData.darkMode = result.theme === 'dark';
      }
    });

    this.setData({
      date: targetDate,
      formattedDate: this.formatDisplayDate(targetDate)
    });

    // 加载报告数据
    if (reportId) {
      this.loadReportById(reportId);
    } else {
      this.loadReport(targetDate);
    }
  },

  /**
   * 获取系统信息和导航栏高度
   */
  getSystemInfo: function() {
    try {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      // 获取胶囊按钮位置信息
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();

      // 计算导航栏高度，增加一点高度使其更美观
      const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + 10;

      this.setData({
        statusBarHeight: systemInfo.statusBarHeight,
        navBarHeight: navBarHeight
      });

      console.log('导航栏高度:', navBarHeight);
    } catch (e) {
      console.error('获取系统信息失败:', e);
    }
  },

  /**
   * 处理返回按钮点击
   */
  handleBack: function() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({
          url: '/pages/home/home'
        });
      }
    });
  },

  /**
   * 页面渲染完成
   */
  onReady: function () {
    // 页面渲染完成后，如果有报告数据，渲染图表
    if (this.data.report && !this.data.chartRendered) {
      this.renderCharts();
    }
  },

  /**
   * 监听页面显示
   */
  onShow: function () {
    // 检测暗夜模式状态是否变化
    const app = getApp();
    if (app.globalData && app.globalData.darkMode !== undefined &&
        this.data.darkMode !== app.globalData.darkMode) {
      this.setData({
        darkMode: app.globalData.darkMode,
        // 清空颜色映射，强制重新生成颜色
        emotionColorMap: {}
      });

      // 重新渲染图表
      if (this.data.report) {
        this.renderCharts(this.data.report);
      }
    }

    // 如果图表实例已经初始化，刷新图表
    if (this.chart) {
      this.chart.resize();
    }
  },

  /**
   * 初始化图表组件
   */
  initChart: function(chartId, callback) {
    const chartComponent = this.selectComponent('#' + chartId);
    if (!chartComponent) {
      console.error(`图表组件 #${chartId} 不存在`);
      return;
    }

    chartComponent.init((canvas, width, height, dpr) => {
      // 初始化图表
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
      });

      // 设置加载动画，根据暗夜模式调整样式
      const isDarkMode = this.data.darkMode;
      chart.showLoading({
        text: '数据加载中',
        color: isDarkMode ? '#63b3ed' : '#5470c6',
        textColor: isDarkMode ? '#e2e8f0' : '#000',
        maskColor: isDarkMode ? 'rgba(45, 55, 72, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        zlevel: 0
      });

      // 调用回调函数设置图表选项
      callback(chart);

      // 隐藏加载动画
      chart.hideLoading();

      // 返回图表实例
      return chart;
    });
  },

  /**
   * 加载指定日期的报告
   */
  loadReport: async function (date, forceRegenerate = false) {
    try {
      this.setData({ loading: true, error: '' });

      const result = await reportService.getDailyReport(date, forceRegenerate);

      if (result.success) {
        // 检查报告中的今日运势数据是否完整
        const report = result.report;
        console.log('原始报告数据:', JSON.stringify(report));

        if (!report.fortune || (!report.fortune.good && !report.fortune.bad)) {
          // 如果今日运势数据不存在或不完整，使用默认数据
          console.log('今日运势数据不存在或不完整，使用默认数据');
          report.fortune = this.data.defaultFortune;
        } else {
          // 如果只缺少其中一项，补充缺失的部分
          if (!report.fortune.good || !Array.isArray(report.fortune.good) || report.fortune.good.length === 0) {
            console.log('今日运势缺少宜数据，使用默认数据');
            report.fortune.good = this.data.defaultFortune.good;
          }
          if (!report.fortune.bad || !Array.isArray(report.fortune.bad) || report.fortune.bad.length === 0) {
            console.log('今日运势缺少忌数据，使用默认数据');
            report.fortune.bad = this.data.defaultFortune.bad;
          }
        }

        console.log('处理后的报告数据:', JSON.stringify(report.fortune));

        this.setData({
          report: report,
          loading: false
        });

        // 标记报告为已读
        if (result.report._id) {
          reportService.markReportAsRead(result.report._id);
        }

        // 渲染图表
        this.renderCharts();
      } else {
        this.setData({
          loading: false,
          error: result.error || '加载报告失败'
        });
      }
    } catch (error) {
      console.error('加载报告失败:', error);
      this.setData({
        loading: false,
        error: error.message || '加载报告失败'
      });
    }
  },

  /**
   * 通过ID加载报告
   */
  loadReportById: async function (reportId) {
    try {
      this.setData({ loading: true, error: '' });

      const db = wx.cloud.database();
      const { data } = await db.collection('userReports').doc(reportId).get();

      if (data) {
        // 检查报告中的今日运势数据是否完整
        const report = data;
        console.log('通过ID加载的原始报告数据:', JSON.stringify(report));

        if (!report.fortune || (!report.fortune.good && !report.fortune.bad)) {
          // 如果今日运势数据不存在或不完整，使用默认数据
          console.log('通过ID加载: 今日运势数据不存在或不完整，使用默认数据');
          report.fortune = this.data.defaultFortune;
        } else {
          // 如果只缺少其中一项，补充缺失的部分
          if (!report.fortune.good || !Array.isArray(report.fortune.good) || report.fortune.good.length === 0) {
            console.log('通过ID加载: 今日运势缺少宜数据，使用默认数据');
            report.fortune.good = this.data.defaultFortune.good;
          }
          if (!report.fortune.bad || !Array.isArray(report.fortune.bad) || report.fortune.bad.length === 0) {
            console.log('通过ID加载: 今日运势缺少忌数据，使用默认数据');
            report.fortune.bad = this.data.defaultFortune.bad;
          }
        }

        console.log('通过ID加载: 处理后的报告数据:', JSON.stringify(report.fortune));

        this.setData({
          report: report,
          date: formatDate(new Date(report.date)),
          formattedDate: this.formatDisplayDate(formatDate(new Date(report.date))),
          loading: false
        });

        // 标记报告为已读
        reportService.markReportAsRead(reportId);

        // 渲染图表
        this.renderCharts();
      } else {
        this.setData({
          loading: false,
          error: '报告不存在'
        });
      }
    } catch (error) {
      console.error('通过ID加载报告失败:', error);
      this.setData({
        loading: false,
        error: error.message || '加载报告失败'
      });
    }
  },

  /**
   * 渲染图表
   */
  renderCharts: function () {
    if (!this.data.report || !this.data.report.chartData) {
      return;
    }

    const report = this.data.report;

    // 生成随机颜色数组
    const generateRandomColors = (count, isDarkMode) => {
      const brightColors = [
        '#FF6347', '#FFD700', '#6495ED', '#9370DB', '#90EE90',
        '#FF69B4', '#87CEEB', '#FFA500', '#BA55D3', '#20B2AA',
        '#FF7F50', '#7B68EE', '#00FA9A', '#FF1493', '#00BFFF',
        '#F4A460', '#D8BFD8', '#1E90FF', '#FF6347', '#32CD32'
      ];

      const darkColors = [
        '#fc8181', '#f6e05e', '#63b3ed', '#b794f4', '#68d391',
        '#f687b3', '#76e4f7', '#fbd38d', '#d6bcfa', '#38b2ac',
        '#fc8181', '#9f7aea', '#48bb78', '#ed64a6', '#4299e1',
        '#ed8936', '#b794f4', '#3182ce', '#fc8181', '#48bb78'
      ];

      const colors = isDarkMode ? darkColors : brightColors;
      const result = [];

      for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
      }

      return result;
    };

    // 生成随机颜色并保存到数据中
    const randomColors = generateRandomColors(report.chartData.emotionDistribution.length, this.data.darkMode);

    // 创建情绪颜色映射对象
    const emotionColorMap = {};
    report.chartData.emotionDistribution.forEach((item, index) => {
      emotionColorMap[item.type] = randomColors[index];
    });

    // 我们不再需要标准化关键词数据，因为我们使用了关键词云
    this.setData({
      emotionColorMap: emotionColorMap
    });

    // 渲染情绪分布饼图
    this.renderEmotionDistributionChart(report.chartData.emotionDistribution);

    // 渲染情绪强度趋势图
    if (report.chartData.intensityTrend && report.chartData.intensityTrend.length > 0) {
      this.renderIntensityTrendChart(report.chartData.intensityTrend);
    }

    // 渲染关键词云
    this.renderKeywordCloud(report.keywords);

    // 渲染关注点分析图
    if (report.focusPoints && report.focusPoints.length > 0) {
      this.renderFocusPointsChart(report.focusPoints);
    }

    this.setData({ chartRendered: true });
  },

  /**
   * 渲染情绪分布饼图
   */
  renderEmotionDistributionChart: function (emotionDistribution) {
    if (!emotionDistribution || emotionDistribution.length === 0) {
      return;
    }

    // 使用已生成的颜色映射
    const emotionColorMap = this.data.emotionColorMap || {};

    // 准备数据
    const pieData = emotionDistribution.map(item => ({
      name: item.type,
      value: item.count,
      percent: parseFloat(item.percentage),
      itemStyle: {
        color: emotionColorMap[item.type] || (this.data.darkMode ? '#4a5568' : '#CCCCCC')
      }
    }));

    // 使用新的 initChart 方法初始化图表
    this.initChart('emotionPieChart', (chart) => {
      // 根据暗夜模式设置图表样式
      const isDarkMode = this.data.darkMode;
      const textColor = isDarkMode ? '#e2e8f0' : '#333333';
      const tooltipBgColor = isDarkMode ? 'rgba(45, 55, 72, 0.9)' : 'rgba(255, 255, 255, 0.9)';
      const tooltipBorderColor = isDarkMode ? '#4a5568' : '#ccc';
      const tooltipTextColor = isDarkMode ? '#e2e8f0' : '#333';
      const tooltipShadow = isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
      const borderColor = isDarkMode ? '#2d3748' : '#fff';

      const option = {
        title: {
          text: '情绪分布',
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
          formatter: '{b}: {c} 次 ({d}%)',
          backgroundColor: tooltipBgColor,
          borderColor: tooltipBorderColor,
          borderWidth: 1,
          textStyle: {
            color: tooltipTextColor
          },
          extraCssText: `box-shadow: 0 0 8px ${tooltipShadow};`
        },
        legend: {
          type: 'scroll',
          orient: 'horizontal',
          bottom: 0,
          data: pieData.map(item => item.name),
          textStyle: {
            fontSize: 12,
            color: textColor
          },
          pageIconColor: textColor,
          pageIconInactiveColor: isDarkMode ? '#4a5568' : '#ccc',
          pageIconSize: 12,
          pageTextStyle: {
            fontSize: 12,
            color: textColor
          },
          selectedMode: false
        },
        series: [{
          name: '情绪分布',
          type: 'pie',
          radius: ['40%', '60%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: borderColor,
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}: {d}%',
            fontSize: 12,
            color: textColor
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 10,
            smooth: true,
            lineStyle: {
              color: isDarkMode ? 'rgba(226, 232, 240, 0.3)' : 'rgba(0, 0, 0, 0.3)'
            }
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              color: textColor
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)'
            }
          },
          data: pieData,
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: function () {
            return Math.random() * 200;
          }
        }]
      };

      chart.setOption(option);
    });
  },

  /**
   * 渲染情绪强度趋势图
   */
  renderIntensityTrendChart: function (intensityTrend) {
    if (!intensityTrend || intensityTrend.length === 0) {
      return;
    }

    // 准备数据
    const times = intensityTrend.map(item => formatTime(new Date(item.timestamp)));
    const intensities = intensityTrend.map(item => item.intensity);

    // 计算移动平均线，平滑展示趋势
    const movingAvg = [];
    const windowSize = 3; // 移动平均窗口大小

    for (let i = 0; i < intensities.length; i++) {
      let sum = 0;
      let count = 0;

      for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
        sum += intensities[j];
        count++;
      }

      movingAvg.push(sum / count);
    }

    // 使用新的 initChart 方法初始化图表
    this.initChart('intensityChart', (chart) => {
      // 根据暗夜模式设置图表样式
      const isDarkMode = this.data.darkMode;
      const textColor = isDarkMode ? '#e2e8f0' : '#333333';
      const tooltipBgColor = isDarkMode ? 'rgba(45, 55, 72, 0.9)' : 'rgba(255, 255, 255, 0.9)';
      const tooltipBorderColor = isDarkMode ? '#4a5568' : '#ccc';
      const tooltipTextColor = isDarkMode ? '#e2e8f0' : '#333';
      const axisLineColor = isDarkMode ? '#4a5568' : '#ccc';
      const splitLineColor = isDarkMode ? 'rgba(74, 85, 104, 0.3)' : 'rgba(0, 0, 0, 0.1)';

      const option = {
        title: {
          text: '情绪强度变化',
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
            type: 'cross',
            label: {
              backgroundColor: isDarkMode ? '#4a5568' : '#6a7985',
              color: textColor
            }
          },
          backgroundColor: tooltipBgColor,
          borderColor: tooltipBorderColor,
          borderWidth: 1,
          textStyle: {
            color: tooltipTextColor
          },
          formatter: function(params) {
            const time = params[0].axisValue;
            let result = `${time}<br/>`;

            params.forEach(param => {
              const marker = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>`;
              result += `${marker}${param.seriesName}: ${(param.value * 100).toFixed(0)}%<br/>`;
            });

            return result;
          }
        },
        legend: {
          data: ['实际强度', '趋势线'],
          bottom: 0,
          textStyle: {
            color: textColor
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: times,
          axisLabel: {
            interval: Math.floor(times.length / 5),
            rotate: 30,
            color: textColor
          },
          axisLine: {
            lineStyle: {
              color: axisLineColor
            }
          },
          axisTick: {
            lineStyle: {
              color: axisLineColor
            }
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 1,
          axisLabel: {
            formatter: function(value) {
              return (value * 100).toFixed(0) + '%';
            },
            color: textColor
          },
          axisLine: {
            lineStyle: {
              color: axisLineColor
            }
          },
          axisTick: {
            lineStyle: {
              color: axisLineColor
            }
          },
          splitLine: {
            lineStyle: {
              color: splitLineColor,
              type: 'dashed'
            }
          }
        },
        series: [
          {
            name: '实际强度',
            type: 'line',
            symbol: 'emptyCircle',
            symbolSize: 6,
            sampling: 'average',
            itemStyle: {
              color: isDarkMode ? '#63b3ed' : '#5470c6'
            },
            lineStyle: {
              width: 3,
              color: isDarkMode ? '#63b3ed' : '#5470c6'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: isDarkMode ? 'rgba(99, 179, 237, 0.5)' : 'rgba(84, 112, 198, 0.5)'
                },
                {
                  offset: 1,
                  color: isDarkMode ? 'rgba(99, 179, 237, 0.1)' : 'rgba(84, 112, 198, 0.1)'
                }
              ])
            },
            data: intensities
          },
          {
            name: '趋势线',
            type: 'line',
            symbol: 'none',
            smooth: true,
            lineStyle: {
              width: 2,
              type: 'dashed',
              color: isDarkMode ? '#68d391' : '#91cc75'
            },
            data: movingAvg
          }
        ],
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      };

      chart.setOption(option);
    });
  },

  /**
   * 处理关键词数据
   */
  renderKeywordCloud: function (keywords) {
    if (!keywords || keywords.length === 0) {
      return;
    }

    // 准备数据
    const keywordsToUse = keywords.slice(0, 20); // 使用前20个关键词

    // 计算权重总和，用于标准化
    let totalWeight = 0;
    keywordsToUse.forEach(item => {
      totalWeight += item.weight;
    });

    // 生成颜色列表
    const isDarkMode = this.data.darkMode;
    const colorList = isDarkMode ? [
      '#63b3ed', '#68d391', '#fbd38d', '#fc8181', '#76e4f7',
      '#4fd1c5', '#fbd38d', '#b794f4', '#f687b3', '#cbd5e0'
    ] : [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#6e7079'
    ];

    // 处理关键词数据
    const keywordTags = keywordsToUse.map((item) => {
      // 标准化权重
      const percentage = totalWeight > 0 ? (item.weight / totalWeight * 100) : 0;
      // 计算字体大小，范围从14到30
      const fontSize = Math.max(14, Math.min(30, 14 + percentage * 0.5));

      // 使用关键词名称生成一致的颜色
      let seed = 0;
      for (let i = 0; i < item.word.length; i++) {
        seed += item.word.charCodeAt(i);
      }
      const colorIndex = seed % colorList.length;
      const color = colorList[colorIndex];

      return {
        word: item.word,
        weight: item.weight,
        percentage: percentage,
        fontSize: fontSize,
        color: color
      };
    });

    // 随机排序，避免每次显示顺序相同
    keywordTags.sort(() => Math.random() - 0.5);

    // 更新到页面数据
    this.setData({
      keywordTags: keywordTags
    });
  },

  /**
   * 获取随机颜色
   */
  getRandomColor: function () {
    const colors = [
      '#6495ED', '#FF6347', '#FFD700', '#9370DB',
      '#90EE90', '#FF69B4', '#A9A9A9', '#87CEEB',
      '#FFA500', '#BA55D3'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  /**
   * 格式化显示日期
   */
  formatDisplayDate: function (dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];

    return `${year}年${month}月${day}日 星期${weekday}`;
  },

  /**
   * 渲染关注点分析图
   */
  renderFocusPointsChart: function (focusPoints) {
    if (!focusPoints || focusPoints.length === 0) {
      return;
    }

    // 准备数据
    const data = focusPoints.map(item => ({
      name: item.category,
      value: item.percentage
    }));

    // 按百分比排序
    data.sort((a, b) => b.value - a.value);

    // 生成颜色映射，为每个关注点类别分配不同的颜色
    const isDarkMode = this.data.darkMode;
    const colorPalette = isDarkMode ? [
      '#63b3ed', '#68d391', '#fbd38d', '#fc8181', '#76e4f7',
      '#4fd1c5', '#fbd38d', '#b794f4', '#f687b3', '#cbd5e0'
    ] : [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#6e7079'
    ];

    // 为每个关注点类别分配颜色
    const categoryColors = {};
    data.forEach((item, index) => {
      categoryColors[item.name] = colorPalette[index % colorPalette.length];
    });

    // 将颜色映射保存到页面数据中，供列表使用
    this.setData({
      categoryColors: categoryColors
    });

    // 使用新的 initChart 方法初始化图表
    this.initChart('focusChart', (chart) => {
      // 根据暗夜模式设置图表样式
      const textColor = isDarkMode ? '#e2e8f0' : '#333333';
      const tooltipBgColor = isDarkMode ? 'rgba(45, 55, 72, 0.9)' : 'rgba(255, 255, 255, 0.9)';
      const tooltipBorderColor = isDarkMode ? '#4a5568' : '#ccc';
      const tooltipTextColor = isDarkMode ? '#e2e8f0' : '#333';
      const axisLineColor = isDarkMode ? '#4a5568' : '#ccc';
      const splitLineColor = isDarkMode ? 'rgba(74, 85, 104, 0.3)' : 'rgba(0, 0, 0, 0.1)';

      const option = {
        title: {
          text: '关注点分析',
          left: 'center',
          top: 0,
          textStyle: {
            fontSize: 16,  // 增大标题字体
            fontWeight: 'bold',  // 加粗标题
            color: textColor
          }
        },
        color: colorPalette,
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}%',
          backgroundColor: tooltipBgColor,
          borderColor: tooltipBorderColor,
          borderWidth: 1,
          textStyle: {
            color: tooltipTextColor
          }
        },
        radar: {
          indicator: data.map(item => ({
            name: item.name,
            max: 100
          })),
          radius: '70%',  // 增大雷达图半径
          center: ['50%', '55%'],
          name: {
            textStyle: {
              color: textColor,
              fontSize: 14,  // 增大指示器文字大小
              fontWeight: 'bold',  // 加粗指示器文字
              backgroundColor: isDarkMode ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.7)',  // 添加背景色
              borderRadius: 3,  // 添加圆角
              padding: [3, 5]  // 添加内边距
            }
          },
          splitArea: {
            areaStyle: {
              color: isDarkMode ? [
                'rgba(45, 55, 72, 0.4)',  // 增强对比度
                'rgba(45, 55, 72, 0.3)',
                'rgba(45, 55, 72, 0.2)',
                'rgba(45, 55, 72, 0.1)'
              ] : [
                'rgba(250, 250, 250, 0.6)',  // 增强对比度
                'rgba(240, 240, 240, 0.6)',
                'rgba(230, 230, 230, 0.6)',
                'rgba(220, 220, 220, 0.6)'
              ]
            }
          },
          axisLine: {
            lineStyle: {
              color: axisLineColor,
              width: 2  // 增加轴线宽度
            }
          },
          splitLine: {
            lineStyle: {
              color: splitLineColor,
              width: 2  // 增加分割线宽度
            }
          }
        },
        series: [{
          name: '关注点分布',
          type: 'radar',
          data: [{
            value: data.map(item => item.value),
            name: '关注度',
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                offset: 0,
                color: isDarkMode ? 'rgba(99, 179, 237, 0.8)' : 'rgba(84, 112, 198, 0.8)'  // 增强透明度
              }, {
                offset: 1,
                color: isDarkMode ? 'rgba(99, 179, 237, 0.2)' : 'rgba(84, 112, 198, 0.2)'  // 增强透明度
              }])
            },
            lineStyle: {
              color: isDarkMode ? '#63b3ed' : '#5470c6',
              width: 3  // 增加线条宽度
            },
            itemStyle: {
              color: isDarkMode ? '#63b3ed' : '#5470c6',
              borderColor: isDarkMode ? '#fff' : '#fff',  // 添加白色边框
              borderWidth: 2,  // 设置边框宽度
              shadowBlur: 5,  // 添加阴影
              shadowColor: 'rgba(0, 0, 0, 0.3)'  // 阴影颜色
            },
            emphasis: {  // 添加鼠标悬停效果
              itemStyle: {
                borderColor: isDarkMode ? '#fff' : '#fff',
                borderWidth: 3,
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        }],
        animationDuration: 1000,
        animationEasing: 'elasticOut'  // 使用弹性动画效果
      };

      chart.setOption(option);
    });
  },

  /**
   * 日期选择器变化事件
   */
  bindDateChange: function (e) {
    const date = e.detail.value;
    this.setData({
      date: date,
      formattedDate: this.formatDisplayDate(date)
    });

    // 加载新日期的报告
    this.loadReport(date);
  },

  /**
   * 重新生成报告
   */
  regenerateReport: function () {
    this.loadReport(this.data.date, true);
  },

  /**
   * 分享报告
   */
  shareReport: function () {
    // 实现分享功能
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const reportId = this.data.report ? this.data.report._id : '';
    return {
      title: `${this.data.formattedDate}的心情报告`,
      path: `/packageEmotion/pages/daily-report/daily-report?id=${reportId}`
    };
  },

  /**
   * 页面卸载时清理资源
   */
  onUnload: function () {
    // 清理图表实例
    if (this.chart) {
      this.chart.dispose();
    }

    // 取消监听系统主题变化
    wx.offThemeChange();
  },

  /**
   * 检测系统暗夜模式
   */
  checkDarkMode: function() {
    // 获取全局数据
    const app = getApp();
    if (app.globalData && app.globalData.darkMode !== undefined) {
      this.setData({
        darkMode: app.globalData.darkMode
      });
    } else {
      // 获取系统信息
      wx.getSystemInfo({
        success: (res) => {
          const darkMode = res.theme === 'dark';
          this.setData({ darkMode });

          // 如果全局数据存在，更新全局数据
          if (app.globalData) {
            app.globalData.darkMode = darkMode;
          }
        }
      });
    }
  }
});
