// packageEmotion/pages/emotion-history/emotion-history.js
const emotionService = require('../../../services/emotionService');
const echarts = require('../../../components/ec-canvas/echarts');

// 初始化情绪趋势图
function initTrendChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  });
  canvas.setChart(chart);

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].name + '<br/>';
        params.forEach(param => {
          result += `${param.marker}${param.seriesName}: ${param.value}%<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['积极情绪', '中性情绪', '消极情绪'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['4/20', '4/21', '4/22', '4/23', '4/24', '4/25', '4/26'],
      axisLine: {
        lineStyle: {
          color: '#ccc'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%'
      },
      max: 100,
      axisLine: {
        show: false
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#eee'
        }
      }
    },
    series: [
      {
        name: '积极情绪',
        type: 'line',
        stack: '总量',
        data: [65, 70, 60, 55, 45, 40, 35],
        smooth: true,
        symbol: 'emptyCircle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#5e72e4'
        },
        itemStyle: {
          color: '#5e72e4'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(94, 114, 228, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(94, 114, 228, 0.1)'
            }
          ])
        }
      },
      {
        name: '中性情绪',
        type: 'line',
        stack: '总量',
        data: [20, 15, 25, 30, 25, 30, 25],
        smooth: true,
        symbol: 'emptyCircle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#ffc107'
        },
        itemStyle: {
          color: '#ffc107'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(255, 193, 7, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(255, 193, 7, 0.1)'
            }
          ])
        }
      },
      {
        name: '消极情绪',
        type: 'line',
        stack: '总量',
        data: [15, 15, 15, 15, 30, 30, 40],
        smooth: true,
        symbol: 'emptyCircle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#f56565'
        },
        itemStyle: {
          color: '#f56565'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(245, 101, 101, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(245, 101, 101, 0.1)'
            }
          ])
        }
      }
    ]
  };

  chart.setOption(option);
  return chart;
}

// 初始化情绪分布图
function initDistributionChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  });
  canvas.setChart(chart);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['疲惫', '压力', '担忧', '焦虑', '平静', '满足', '快乐']
    },
    series: [
      {
        name: '情绪分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 25, name: '疲惫', itemStyle: { color: '#ffc107' } },
          { value: 20, name: '压力', itemStyle: { color: '#f56565' } },
          { value: 15, name: '担忧', itemStyle: { color: '#4299e1' } },
          { value: 10, name: '焦虑', itemStyle: { color: '#ed64a6' } },
          { value: 15, name: '平静', itemStyle: { color: '#48bb78' } },
          { value: 10, name: '满足', itemStyle: { color: '#9f7aea' } },
          { value: 5, name: '快乐', itemStyle: { color: '#38b2ac' } }
        ]
      }
    ]
  };

  chart.setOption(option);
  return chart;
}

// 初始化情绪波动指数图
function initVolatilityChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  });
  canvas.setChart(chart);

  // 获取页面实例
  const page = getCurrentPages()[getCurrentPages().length - 1];

  // 获取页面数据中的波动指数数据
  const volatilityIndex = page.data.volatilityIndex || {
    current: 0,
    previous: 0,
    twoWeeksAgo: 0
  };

  // 获取颜色函数
  const getColorByValue = (value) => {
    if (value <= 20) return '#48bb78'; // 非常稳定 - 绿色
    if (value <= 40) return '#68d391'; // 稳定 - 浅绿色
    if (value <= 60) return '#f6e05e'; // 中等 - 黄色
    if (value <= 80) return '#ed8936'; // 波动 - 橙色
    return '#f56565';                  // 剧烈波动 - 红色
  };

  // 准备图表数据
  const seriesData = [
    {
      value: volatilityIndex.twoWeeksAgo || 0,
      itemStyle: { color: getColorByValue(volatilityIndex.twoWeeksAgo || 0) }
    },
    {
      value: volatilityIndex.previous || 0,
      itemStyle: { color: getColorByValue(volatilityIndex.previous || 0) }
    },
    {
      value: volatilityIndex.current || 0,
      itemStyle: { color: getColorByValue(volatilityIndex.current || 0) }
    }
  ];

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: ['上上周', '上周', '本周'],
        axisTick: {
          alignWithLabel: true
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        max: 100,
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: [
      {
        name: '波动指数',
        type: 'bar',
        barWidth: '60%',
        data: seriesData,
        label: {
          show: true,
          position: 'top',
          formatter: '{c}'
        }
      }
    ]
  };

  chart.setOption(option);
  return chart;
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    darkMode: false,
    loading: true,
    hasData: false,
    timeRange: 'week', // 默认时间范围：一周
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    calendarDays: [],
    recentRecords: [],
    hasMoreRecords: false,
    volatilityIndex: {
      current: 65,
      previous: 58,
      changePercent: 12
    },
    volatilityLevel: '中等',
    volatilityReason: '这可能与近期工作压力增加有关',
    ec: {
      lazyLoad: true
    },
    statusBarHeight: 20, // 状态栏高度，默认值
    navBarHeight: 44 // 导航栏高度，默认值
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取系统信息，检测暗黑模式
    const systemInfo = wx.getSystemInfoSync();
    const darkMode = systemInfo.theme === 'dark';

    // 获取状态栏高度
    const statusBarHeight = systemInfo.statusBarHeight || 20;

    // 计算导航栏高度，根据机型调整
    let navBarHeight = 44; // 默认值
    if (systemInfo.platform === 'ios') {
      navBarHeight = 44; // iOS平台
    } else if (systemInfo.platform === 'android') {
      navBarHeight = 48; // 安卓平台
    }

    this.setData({
      darkMode,
      statusBarHeight,
      navBarHeight
    });

    // 检查用户登录状态
    const app = getApp();
    let isLoggedIn = app && app.globalData ? app.globalData.isLoggedIn : false;

    console.log('初始登录状态:', isLoggedIn);

    // 尝试从本地存储中检查登录状态
    try {
      const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');
      console.log('本地存储中token:', token ? '存在' : '不存在');
      console.log('本地存储中userInfo:', userInfo);

      if (token && userInfo) {
        // 更新全局登录状态
        if (app && app.globalData) {
          app.globalData.isLoggedIn = true;
          app.globalData.userInfo = userInfo;
          isLoggedIn = true;
          console.log('更新全局登录状态为已登录');
        }
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
    }

    // 如果仍然未登录，提示用户登录
    if (!isLoggedIn) {
      console.log('用户未登录，显示提示');
      wx.showToast({
        title: '请先登录后查看情绪历史',
        icon: 'none',
        duration: 2000
      });

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);

      return;
    }

    // 加载数据
    this.loadEmotionHistoryData().then(() => {
      // 生成日历数据
      this.generateCalendarData().catch(error => {
        console.error('生成日历数据失败:', error);
      });
    }).catch(error => {
      console.error('加载情绪历史数据失败:', error);
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // 初始化图表
    this.initCharts();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log('用户下拉刷新，强制从数据库获取最新数据');

    // 清除当前时间范围的缓存
    try {
      // 尝试从多个来源获取openId
      let userId = null;
      let openId = wx.getStorageSync('openId');

      // 如果没有，尝试从用户信息的stats对象中获取openid
      if (!openId) {
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo && userInfo.stats && userInfo.stats.openid) {
          openId = userInfo.stats.openid;
          console.log('从用户信息的stats对象中获取的openid:', openId);

          // 将openId存入本地存储，以便下次使用
          wx.setStorageSync('openId', openId);
          console.log('将openId存入本地存储:', openId);
        }
      }

      if (openId) {
        userId = openId;
        console.log('将使用openId作为缓存键的一部分:', openId);
      } else {
        console.log('未找到openId，无法清除缓存');
        // 如果没有openId，则无法清除缓存
        // 尝试从本地存储中获取token，如果有token则提示用户重新登录
        const token = wx.getStorageSync('token');
        if (token) {
          console.log('找到token，可能是openId未正确缓存');
          wx.showToast({
            title: '请重新登录后再试',
            icon: 'none',
            duration: 2000
          });
        }
      }

      if (userId) {
        const cacheKey = `emotionHistory_${userId}_${this.data.timeRange}`;
        wx.removeStorageSync(cacheKey);
        console.log('已清除缓存:', cacheKey);
      }
    } catch (error) {
      console.error('清除缓存失败:', error);
    }

    // 重新加载数据
    this.loadEmotionHistoryData().then(() => {
      wx.stopPullDownRefresh();
    }).catch(error => {
      console.error('下拉刷新加载数据失败:', error);
      wx.stopPullDownRefresh();

      wx.showToast({
        title: '刷新失败，请重试',
        icon: 'none',
        duration: 2000
      });
    });
  },

  /**
   * 切换时间范围
   */
  switchTimeRange: function (e) {
    const range = e.currentTarget.dataset.range;
    const oldRange = this.data.timeRange;

    if (range === oldRange) {
      console.log('时间范围未变化，不重新加载');
      return;
    }

    console.log(`切换时间范围：${oldRange} -> ${range}`);

    this.setData({
      timeRange: range,
      loading: true
    });

    // 尝试从缓存加载数据
    try {
      // 尝试从多个来源获取openId
      let userId = null;
      let openId = wx.getStorageSync('openId');

      // 如果没有，尝试从用户信息的stats对象中获取openid
      if (!openId) {
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo && userInfo.stats && userInfo.stats.openid) {
          openId = userInfo.stats.openid;
          console.log('从用户信息的stats对象中获取的openid:', openId);

          // 将openId存入本地存储，以便下次使用
          wx.setStorageSync('openId', openId);
          console.log('将openId存入本地存储:', openId);
        }
      }

      if (openId) {
        userId = openId;
        console.log('切换时间范围，将使用openId作为缓存键的一部分:', openId);
      } else {
        console.log('未找到openId，无法从缓存加载数据');
        // 如果没有openId，则无法从缓存加载数据
        // 尝试从本地存储中获取token，如果有token则提示用户重新登录
        const token = wx.getStorageSync('token');
        if (token) {
          console.log('找到token，可能是openId未正确缓存');
          wx.showToast({
            title: '请重新登录后再试',
            icon: 'none',
            duration: 2000
          });
        }
        return; // 如果没有openId，直接返回
      }

      if (userId) {
        const cacheKey = `emotionHistory_${userId}_${range}`;
        const cachedData = wx.getStorageSync(cacheKey);

        if (cachedData && cachedData.data && cachedData.timestamp) {
          // 检查缓存是否过期（超过30分钟）
          const now = Date.now();
          const cacheAge = now - cachedData.timestamp;
          const cacheExpiry = 30 * 60 * 1000; // 30分钟

          if (cacheAge < cacheExpiry) {
            console.log('使用缓存数据，缓存时间:', new Date(cachedData.timestamp).toLocaleString());

            // 处理缓存数据
            this.processEmotionData(cachedData.data);

            // 生成最近记录列表
            this.generateRecentRecords(cachedData.data);

            this.setData({
              hasData: true,
              loading: false,
              hasMoreRecords: cachedData.data.length >= 10
            });

            // 重新初始化图表
            this.initCharts();

            // 显示提示
            wx.showToast({
              title: '当前显示的是缓存数据',
              icon: 'none',
              duration: 1000
            });

            // 同时在后台加载最新数据
            this.loadEmotionHistoryData().catch(error => {
              console.error('后台加载最新数据失败:', error);
            });

            return;
          }
        }
      }
    } catch (error) {
      console.error('从缓存加载数据失败:', error);
    }

    // 如果没有缓存或缓存过期，从数据库加载
    this.loadEmotionHistoryData();
  },

  /**
   * 加载情绪历史数据
   */
  loadEmotionHistoryData: async function () {
    try {
      this.setData({ loading: true });

      // 获取用户ID
      let userId = null;
      let openId = null;

      // 尝试从多个来源获取openId，这是数据库中实际使用的用户标识
      try {
        // 先尝试从本地存储中获取openId
        openId = wx.getStorageSync('openId');
        console.log('从本地存储获取的openId:', openId);

        // 如果没有，尝试从用户信息的stats对象中获取openid
        if (!openId) {
          const userInfo = wx.getStorageSync('userInfo');
          if (userInfo && userInfo.stats && userInfo.stats.openid) {
            openId = userInfo.stats.openid;
            console.log('从用户信息的stats对象中获取的openid:', openId);
          }
        }

        if (openId) {
          userId = openId;
          console.log('将使用openId作为数据库查询的userId字段值:', userId);

          // 将openId存入本地存储，以便下次使用
          if (!wx.getStorageSync('openId')) {
            wx.setStorageSync('openId', openId);
            console.log('将openId存入本地存储:', openId);
          }
        }
      } catch (storageError) {
        console.error('获取openId失败:', storageError);
      }

      // 如果没有获取到openId，则无法查询数据库
      if (!userId) {
        console.error('未获取到openId，无法查询数据库');

        // 尝试从本地存储中获取token，如果有token则提示用户刷新页面
        const token = wx.getStorageSync('token');
        if (token) {
          console.log('找到token，可能是openId未正确缓存');
          wx.showToast({
            title: '请下拉刷新页面',
            icon: 'none',
            duration: 2000
          });
        }
      }

      if (!userId) {
        console.error('未获取到用户ID，请先登录');
        this.setData({
          loading: false,
          hasData: false
        });

        // 提示用户登录
        wx.showToast({
          title: '请先登录后查看情绪历史',
          icon: 'none',
          duration: 2000
        });

        return;
      }

      // 根据时间范围获取数据
      const limit = this.getRecordLimitByTimeRange();

      console.log('开始获取情绪历史记录, 用户ID:', userId, '限制数量:', limit);

      // 获取情绪历史记录
      let records = [];
      try {
        records = await emotionService.getEmotionHistory(userId, null, limit);
        console.log('获取情绪历史记录成功, 数量:', records ? records.length : 0);
      } catch (fetchError) {
        console.error('获取情绪历史记录失败:', fetchError);
        // 使用空数组继续
        records = [];
      }

      if (records && records.length > 0) {
        console.log('成功获取到情绪历史记录，数量:', records.length);

        // 将数据存入本地缓存
        try {
          const cacheKey = `emotionHistory_${userId}_${this.data.timeRange}`;
          wx.setStorageSync(cacheKey, {
            timestamp: Date.now(),
            data: records
          });
          console.log('已将情绪历史数据存入本地缓存:', cacheKey);
        } catch (cacheError) {
          console.error('存入本地缓存失败:', cacheError);
        }

        // 处理数据
        this.processEmotionData(records);

        // 生成最近记录列表 (异步)
        await this.generateRecentRecords(records);

        this.setData({
          hasData: true,
          loading: false,
          hasMoreRecords: records.length >= 10
        });

        // 重新初始化图表
        this.initCharts();
      } else {
        console.log('没有找到情绪历史记录，尝试从缓存加载');

        // 尝试从缓存加载数据
        const cachedData = this.loadFromCache(userId);

        if (cachedData && cachedData.length > 0) {
          console.log('从缓存加载到情绪历史记录，数量:', cachedData.length);

          // 处理缓存数据
          this.processEmotionData(cachedData);

          // 生成最近记录列表 (异步)
          await this.generateRecentRecords(cachedData);

          this.setData({
            hasData: true,
            loading: false,
            hasMoreRecords: false
          });

          // 重新初始化图表
          this.initCharts();

          // 显示提示
          wx.showToast({
            title: '当前显示的是缓存数据',
            icon: 'none',
            duration: 2000
          });
        } else {
          console.log('缓存中也没有数据，显示空状态');

          this.setData({
            hasData: false,
            loading: false
          });

          wx.showToast({
            title: '暂无情绪历史数据',
            icon: 'none',
            duration: 2000
          });
        }
      }
    } catch (error) {
      console.error('加载情绪历史数据失败:', error);
      this.setData({
        loading: false,
        hasData: false
      });

      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
    }
  },

  /**
   * 根据时间范围获取记录限制数
   */
  getRecordLimitByTimeRange: function () {
    const rangeMap = {
      'week': 20,
      'month': 50,
      'quarter': 100,
      'halfYear': 150,
      'year': 200
    };

    return rangeMap[this.data.timeRange] || 20;
  },

  /**
   * 从缓存加载数据
   */
  loadFromCache: function (userId) {
    try {
      // 确保有有效的用户ID（必须是openId）
      if (!userId) {
        // 尝试从本地存储中获取openId
        let openId = wx.getStorageSync('openId');

        // 如果没有，尝试从用户信息的stats对象中获取openid
        if (!openId) {
          const userInfo = wx.getStorageSync('userInfo');
          if (userInfo && userInfo.stats && userInfo.stats.openid) {
            openId = userInfo.stats.openid;
            console.log('从用户信息的stats对象中获取的openid:', openId);

            // 将openId存入本地存储，以便下次使用
            wx.setStorageSync('openId', openId);
            console.log('将openId存入本地存储:', openId);
          }
        }

        if (openId) {
          userId = openId;
          console.log('从存储中获取openId作为缓存键:', userId);
        } else {
          console.error('无法获取openId用于缓存加载');
          return null;
        }
      } else if (userId !== wx.getStorageSync('openId')) {
        // 如果传入的userId不是openId，则尝试使用openId替换
        let openId = wx.getStorageSync('openId');

        // 如果没有，尝试从用户信息的stats对象中获取openid
        if (!openId) {
          const userInfo = wx.getStorageSync('userInfo');
          if (userInfo && userInfo.stats && userInfo.stats.openid) {
            openId = userInfo.stats.openid;
            console.log('从用户信息的stats对象中获取的openid:', openId);

            // 将openId存入本地存储，以便下次使用
            wx.setStorageSync('openId', openId);
            console.log('将openId存入本地存储:', openId);
          }
        }

        if (openId) {
          console.log('传入的userId不是openId，使用openId替换:', openId);
          userId = openId;
        }
      }

      // 尝试从当前时间范围的缓存中加载
      const cacheKey = `emotionHistory_${userId}_${this.data.timeRange}`;
      const cachedData = wx.getStorageSync(cacheKey);

      if (cachedData && cachedData.data && cachedData.timestamp) {
        // 检查缓存是否过期（超过30分钟）
        const now = Date.now();
        const cacheAge = now - cachedData.timestamp;
        const cacheExpiry = 30 * 60 * 1000; // 30分钟

        if (cacheAge < cacheExpiry) {
          console.log('使用缓存数据，缓存时间:', new Date(cachedData.timestamp).toLocaleString());
          return cachedData.data;
        } else {
          console.log('缓存数据已过期，缓存时间:', new Date(cachedData.timestamp).toLocaleString());
          return null;
        }
      }

      // 如果当前时间范围没有缓存，尝试使用其他时间范围的缓存
      const timeRanges = ['week', 'month', 'quarter', 'halfYear', 'year'];
      for (const range of timeRanges) {
        if (range === this.data.timeRange) continue; // 跳过当前时间范围

        const otherCacheKey = `emotionHistory_${userId}_${range}`;
        const otherCachedData = wx.getStorageSync(otherCacheKey);

        if (otherCachedData && otherCachedData.data && otherCachedData.data.length > 0) {
          console.log(`使用${range}时间范围的缓存数据，数量:`, otherCachedData.data.length);
          return otherCachedData.data;
        }
      }

      return null;
    } catch (error) {
      console.error('从缓存加载数据失败:', error);
      return null;
    }
  },

  /**
   * 处理情绪数据
   */
  processEmotionData: function (records) {
    console.log('处理情绪数据:', records.length);

    // 使用emotionService计算情绪波动指数数据
    const volatilityData = emotionService.getEmotionalVolatilityData(records);
    console.log('情绪波动指数数据:', volatilityData);

    // 更新页面数据
    this.setData({
      volatilityIndex: volatilityData.volatilityIndex,
      volatilityLevel: volatilityData.volatilityLevel,
      volatilityReason: volatilityData.volatilityReason
    });

    // 更新图表数据
    this.updateVolatilityChart(volatilityData.chartData);

    // 处理情绪趋势数据
    // 处理情绪分布数据
    // 处理情绪日历数据
  },

  /**
   * 更新情绪波动指数图表
   */
  updateVolatilityChart: function(chartData) {
    // 获取图表组件
    const volatilityChart = this.selectComponent('#volatilityChart');
    if (!volatilityChart || !volatilityChart.chart) {
      console.log('图表组件未初始化，无法更新数据');
      return;
    }

    // 获取图表实例
    const chart = volatilityChart.chart;

    // 获取颜色函数
    const getColorByValue = (value) => {
      if (value <= 20) return '#48bb78'; // 非常稳定 - 绿色
      if (value <= 40) return '#68d391'; // 稳定 - 浅绿色
      if (value <= 60) return '#f6e05e'; // 中等 - 黄色
      if (value <= 80) return '#ed8936'; // 波动 - 橙色
      return '#f56565';                  // 剧烈波动 - 红色
    };

    // 准备图表数据
    const seriesData = [];

    // 处理不同类型的图表数据
    if (Array.isArray(chartData)) {
      // 如果是数组形式，直接处理
      chartData.forEach(item => {
        seriesData.push({
          value: item.value,
          itemStyle: { color: getColorByValue(item.value) }
        });
      });
    } else if (chartData && typeof chartData === 'object') {
      // 如果是对象形式，处理为数组
      seriesData.push({
        value: chartData.twoWeeksAgo || 0,
        itemStyle: { color: getColorByValue(chartData.twoWeeksAgo || 0) }
      });
      seriesData.push({
        value: chartData.previous || 0,
        itemStyle: { color: getColorByValue(chartData.previous || 0) }
      });
      seriesData.push({
        value: chartData.current || 0,
        itemStyle: { color: getColorByValue(chartData.current || 0) }
      });
    } else {
      // 如果数据格式不正确，使用默认值
      console.warn('图表数据格式不正确:', chartData);
      seriesData.push({ value: 0, itemStyle: { color: getColorByValue(0) } });
      seriesData.push({ value: 0, itemStyle: { color: getColorByValue(0) } });
      seriesData.push({ value: 0, itemStyle: { color: getColorByValue(0) } });
    }

    // 更新数据
    const option = {
      series: [{
        data: seriesData
      }]
    };

    chart.setOption(option);
  },

  /**
   * 获取角色信息
   * @param {string} roleId 角色ID
   * @returns {Promise<Object>} 角色信息
   */
  getRoleInfo: async function(roleId) {
    if (!roleId) return null;

    // 先尝试从本地缓存中获取
    try {
      const roleCache = wx.getStorageSync('roleCache') || {};
      if (roleCache[roleId]) {
        return roleCache[roleId];
      }
    } catch (error) {
      // 忽略错误
    }

    // 如果缓存中没有，尝试从云函数获取
    try {
      const result = await wx.cloud.callFunction({
        name: 'getRoleInfo',
        data: { roleId }
      });

      if (result && result.result && result.result.success && result.result.data) {
        // 将角色信息存入缓存
        try {
          const roleCache = wx.getStorageSync('roleCache') || {};
          roleCache[roleId] = result.result.data;
          wx.setStorageSync('roleCache', roleCache);
        } catch (cacheError) {
          // 忽略缓存错误
        }

        return result.result.data;
      }
    } catch (error) {
      // 忽略错误
    }

    return null;
  },

  /**
   * 生成最近记录列表
   */
  generateRecentRecords: async function (records) {
    // 取最近的10条记录
    const recordsToProcess = records.slice(0, 10);
    const recentRecords = [];

    // 创建角色ID到角色信息的映射
    const roleInfoMap = {};

    // 收集所有需要查询的角色ID
    const roleIdsToQuery = [];
    for (const record of recordsToProcess) {
      if (record.roleId && !roleInfoMap[record.roleId]) {
        roleIdsToQuery.push(record.roleId);
      }
    }

    // 批量查询角色信息
    if (roleIdsToQuery.length > 0) {
      try {
        // 先从缓存中获取
        const roleCache = wx.getStorageSync('roleCache') || {};

        // 对于缓存中没有的角色，从数据库查询
        const roleIdsToQueryFromDB = [];
        for (const roleId of roleIdsToQuery) {
          if (roleCache[roleId]) {
            roleInfoMap[roleId] = roleCache[roleId];
          } else {
            roleIdsToQueryFromDB.push(roleId);
          }
        }

        // 如果还有需要从数据库查询的角色
        if (roleIdsToQueryFromDB.length > 0) {
          // 使用云函数查询角色信息
          const db = wx.cloud.database();
          const _ = db.command;

          const result = await db.collection('roles')
            .where({
              _id: _.in(roleIdsToQueryFromDB)
            })
            .get();

          if (result && result.data && result.data.length > 0) {
            // 将查询结果存入映射和缓存
            for (const role of result.data) {
              roleInfoMap[role._id] = role;
              roleCache[role._id] = role;
            }

            // 更新缓存
            wx.setStorageSync('roleCache', roleCache);
          }
        }
      } catch (error) {
        // 忽略错误
      }
    }

    // 处理每条记录
    for (const record of recordsToProcess) {
      // 获取情绪类型
      let emotionType = record.analysis?.primary_emotion || record.analysis?.type || 'neutral';
      let emotionLabel = '';

      // 尝试获取中文情绪类型
      if (record.analysis?.primary_emotion_cn) {
        emotionLabel = record.analysis.primary_emotion_cn;
      } else if (record.analysis?.type && typeof record.analysis.type === 'string' && /[\u4e00-\u9fa5]/.test(record.analysis.type)) {
        // 如果 type 字段是中文，直接使用
        emotionLabel = record.analysis.type;
      } else {
        // 如果没有中文情绪类型，使用映射表
        emotionLabel = emotionService.EmotionTypeLabels[emotionType] || '未知情绪';
      }

      // 获取情绪图标和背景色
      const iconInfo = this.getEmotionIconInfo(emotionType);

      // 格式化时间
      const time = this.formatRecordTime(record.createTime);

      // 获取角色名称
      let roleName = record.roleName || record.role_name || '';

      // 如果没有角色名称，尝试从角色信息中获取
      if (!roleName && record.roleId && roleInfoMap[record.roleId]) {
        const roleInfo = roleInfoMap[record.roleId];
        roleName = roleInfo.name || roleInfo.role_name || '';
      }

      // 构建源信息文本
      let source = '对话记录';
      if (roleName) {
        source = `与 ${roleName} 的对话`;
      }

      recentRecords.push({
        id: record._id,
        emotions: [emotionLabel],
        time: time,
        source: source,
        roleName: roleName,  // 角色名称
        roleId: record.roleId || '',  // 角色ID
        chatId: record.chatId || '',  // 聊天ID
        iconBg: iconInfo.bg,
        iconName: iconInfo.icon
      });
    }

    this.setData({
      recentRecords
    });
  },

  /**
   * 获取情绪图标信息
   */
  getEmotionIconInfo: function (emotionType) {
    // 如果情绪类型为空，返回默认图标
    if (!emotionType) {
      return { icon: 'icon-neutral', bg: '#f0f0f0' };
    }

    // 尝试获取中文情绪类型
    let emotionTypeCN = '';
    if (typeof emotionType === 'object' && emotionType.analysis) {
      emotionTypeCN = emotionType.analysis.primary_emotion_cn || '';
      emotionType = emotionType.analysis.primary_emotion || 'neutral';
    }

    // 情绪类型对应的图标和背景色
    const emotionIcons = {
      // 英文情绪类型
      'joy': { icon: 'icon-smile', bg: '#e6ffec' },
      'sadness': { icon: 'icon-sad', bg: '#e6f7ff' },
      'anger': { icon: 'icon-angry', bg: '#ffece6' },
      'anxiety': { icon: 'icon-meh', bg: '#fff7e6' },
      'neutral': { icon: 'icon-neutral', bg: '#f0f0f0' },
      'tired': { icon: 'icon-tired', bg: '#f0f0f0' },
      'surprise': { icon: 'icon-surprise', bg: '#e6f7ff' },
      'calm': { icon: 'icon-neutral', bg: '#e6f7ff' },
      'happy': { icon: 'icon-smile', bg: '#e6ffec' },
      'sad': { icon: 'icon-sad', bg: '#e6f7ff' },
      'angry': { icon: 'icon-angry', bg: '#ffece6' },
      'fear': { icon: 'icon-meh', bg: '#fff7e6' },
      'disgust': { icon: 'icon-meh', bg: '#ffece6' },
      'anticipation': { icon: 'icon-smile', bg: '#fff7e6' },
      'trust': { icon: 'icon-smile', bg: '#e6ffec' },

      // 中文情绪类型
      '喜悦': { icon: 'icon-smile', bg: '#e6ffec' },
      '伤感': { icon: 'icon-sad', bg: '#e6f7ff' },
      '愤怒': { icon: 'icon-angry', bg: '#ffece6' },
      '焦虑': { icon: 'icon-meh', bg: '#fff7e6' },
      '平静': { icon: 'icon-neutral', bg: '#f0f0f0' },
      '疲惫': { icon: 'icon-tired', bg: '#f0f0f0' },
      '惊讶': { icon: 'icon-surprise', bg: '#e6f7ff' },
      '期待': { icon: 'icon-smile', bg: '#fff7e6' },
      '信任': { icon: 'icon-smile', bg: '#e6ffec' },
      '忧虑': { icon: 'icon-meh', bg: '#fff7e6' },
      '厌恶': { icon: 'icon-meh', bg: '#ffece6' },
      '恐惧': { icon: 'icon-meh', bg: '#fff7e6' },
      '开心': { icon: 'icon-smile', bg: '#e6ffec' },
      '难过': { icon: 'icon-sad', bg: '#e6f7ff' },
      '生气': { icon: 'icon-angry', bg: '#ffece6' }
    };

    // 先尝试使用中文情绪类型，如果没有再使用英文情绪类型
    if (emotionTypeCN && emotionIcons[emotionTypeCN]) {
      return emotionIcons[emotionTypeCN];
    }

    return emotionIcons[emotionType] || { icon: 'icon-neutral', bg: '#f0f0f0' };
  },

  /**
   * 格式化记录时间
   */
  formatRecordTime: function (timestamp) {
    if (!timestamp) return '未知时间';

    let recordTime;

    // 处理不同的时间格式
    if (typeof timestamp === 'object' && timestamp.$date) {
      // 如果是 MongoDB 格式的时间对象
      recordTime = new Date(timestamp.$date);
    } else if (typeof timestamp === 'string') {
      // 如果是字符串
      recordTime = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      // 如果已经是 Date 对象
      recordTime = timestamp;
    } else {
      // 其他情况，尝试直接创建 Date 对象
      try {
        recordTime = new Date(timestamp);
      } catch (error) {
        console.error('无法解析时间格式:', timestamp, error);
        return '未知时间';
      }
    }

    // 检查时间是否有效
    if (isNaN(recordTime.getTime())) {
      console.error('无效的时间对象:', recordTime);
      return '未知时间';
    }

    const now = new Date();

    // 计算时间差（毫秒）
    const diff = now - recordTime;

    // 小于24小时，显示"今天 HH:MM"
    if (diff < 24 * 60 * 60 * 1000 && recordTime.getDate() === now.getDate()) {
      const hours = recordTime.getHours().toString().padStart(2, '0');
      const minutes = recordTime.getMinutes().toString().padStart(2, '0');
      return `今天 ${hours}:${minutes}`;
    }

    // 小于48小时，显示"昨天 HH:MM"
    if (diff < 48 * 60 * 60 * 1000 &&
        recordTime.getDate() === new Date(now - 24 * 60 * 60 * 1000).getDate()) {
      const hours = recordTime.getHours().toString().padStart(2, '0');
      const minutes = recordTime.getMinutes().toString().padStart(2, '0');
      return `昨天 ${hours}:${minutes}`;
    }

    // 小于7天，显示"N天前"
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}天前`;
    }

    // 其他情况，显示完整日期
    const year = recordTime.getFullYear();
    const month = (recordTime.getMonth() + 1).toString().padStart(2, '0');
    const day = recordTime.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 生成日历数据
   */
  generateCalendarData: async function () {
    // 获取当前日期
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // 获取当月第一天是星期几
    const firstDay = new Date(year, month, 1).getDay() || 7; // 将周日(0)转换为7

    // 获取当月天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 获取上月天数
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // 生成日历数据
    const calendarDays = [];

    // 添加上月剩余天数
    for (let i = firstDay - 1; i > 0; i--) {
      calendarDays.push({
        day: daysInPrevMonth - i + 1,
        date: `${year}-${month === 0 ? 12 : month}-${daysInPrevMonth - i + 1}`,
        current: false,
        emotion: null
      });
    }

    // 获取当月的情绪数据
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    // 获取用户ID
    let userId = null;
    try {
      const openId = wx.getStorageSync('openId');
      if (openId) {
        userId = openId;
      } else {
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo && userInfo.stats && userInfo.stats.openid) {
          userId = userInfo.stats.openid;
        }
      }
    } catch (error) {
      console.error('获取用户ID失败:', error);
    }

    // 如果没有用户ID，使用随机数据
    if (!userId) {
      console.warn('未获取到用户ID，使用随机数据');
      // 添加当月天数，使用随机情绪
      for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push({
          day: i,
          date: `${year}-${month + 1}-${i}`,
          current: true,
          emotion: this.getEmotionForDay(null) // 使用随机情绪
        });
      }
    } else {
      // 从数据库获取当月的情绪记录
      try {
        const db = wx.cloud.database();
        const _ = db.command;

        const result = await db.collection('emotionRecords')
          .where({
            userId: userId,
            createTime: _.gte(monthStart).and(_.lte(monthEnd))
          })
          .orderBy('createTime', 'asc')
          .get();

        console.log('获取到当月情绪记录:', result.data.length);

        // 按日期分组情绪记录
        const emotionsByDay = {};

        result.data.forEach(record => {
          if (!record.createTime) return;

          let recordDate;
          if (typeof record.createTime === 'object' && record.createTime.$date) {
            recordDate = new Date(record.createTime.$date);
          } else {
            recordDate = new Date(record.createTime);
          }

          const day = recordDate.getDate();

          if (!emotionsByDay[day]) {
            emotionsByDay[day] = [];
          }

          // 获取情绪类型
          let emotionType = record.analysis?.primary_emotion ||
                           record.analysis?.type ||
                           'neutral';

          emotionsByDay[day].push(emotionType);
        });

        // 添加当月天数，使用实际情绪数据
        for (let i = 1; i <= daysInMonth; i++) {
          const dayEmotions = emotionsByDay[i] || [];

          calendarDays.push({
            day: i,
            date: `${year}-${month + 1}-${i}`,
            current: true,
            emotion: this.getEmotionForDay(dayEmotions)
          });
        }
      } catch (error) {
        console.error('获取情绪记录失败:', error);

        // 如果获取失败，使用随机数据
        for (let i = 1; i <= daysInMonth; i++) {
          calendarDays.push({
            day: i,
            date: `${year}-${month + 1}-${i}`,
            current: true,
            emotion: this.getEmotionForDay(null) // 使用随机情绪
          });
        }
      }
    }

    // 添加下月开始天数，补满42个格子（6行）
    const remaining = 42 - calendarDays.length;
    for (let i = 1; i <= remaining; i++) {
      calendarDays.push({
        day: i,
        date: `${year}-${month + 2 > 12 ? 1 : month + 2}-${i}`,
        current: false,
        emotion: null
      });
    }

    this.setData({
      calendarDays
    });
  },

  /**
   * 根据一天的情绪记录确定主要情绪
   * @param {Array} emotions 情绪类型数组
   * @returns {String} 主要情绪类型
   */
  getEmotionForDay: function (emotions) {
    if (!emotions || emotions.length === 0) {
      // 如果没有情绪记录，返回随机情绪或null
      if (Math.random() < 0.3) { // 30%的概率返回null，表示没有记录
        return null;
      }
      const emotions = ['positive', 'negative', 'neutral', 'calm'];
      const randomIndex = Math.floor(Math.random() * emotions.length);
      return emotions[randomIndex];
    }

    // 统计各种情绪类型的出现次数
    const emotionCounts = {};
    emotions.forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });

    // 找出出现次数最多的情绪类型
    let mainEmotion = 'neutral';
    let maxCount = 0;

    for (const [emotion, count] of Object.entries(emotionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mainEmotion = emotion;
      }
    }

    return mainEmotion;
  },

  /**
   * 初始化所有图表
   */
  initCharts: function () {
    if (!this.data.hasData) return;

    // 初始化情绪趋势图
    this.trendChart = this.selectComponent('#trendChart');
    this.trendChart && this.trendChart.init((canvas, width, height, dpr) => {
      return initTrendChart(canvas, width, height, dpr);
    });

    // 初始化情绪分布图
    this.distributionChart = this.selectComponent('#distributionChart');
    this.distributionChart && this.distributionChart.init((canvas, width, height, dpr) => {
      return initDistributionChart(canvas, width, height, dpr);
    });

    // 初始化情绪波动指数图
    this.volatilityChart = this.selectComponent('#volatilityChart');
    this.volatilityChart && this.volatilityChart.init((canvas, width, height, dpr) => {
      return initVolatilityChart(canvas, width, height, dpr);
    });
  },

  /**
   * 处理返回按钮点击
   */
  handleBack: function () {
    wx.navigateBack({
      fail: function() {
        // 如果返回失败，可能是没有上一页，跳转到首页
        wx.switchTab({
          url: '/pages/user/user'
        });
      }
    });
  },

  /**
   * 查看记录详情
   */
  viewRecordDetail: function (e) {
    const recordId = e.currentTarget.dataset.id;
    const roleId = e.currentTarget.dataset.roleId;
    const chatId = e.currentTarget.dataset.chatId;

    console.log('点击记录:', { recordId, roleId, chatId });

    if (!recordId) return;

    // 如果有角色ID，先跳转到角色页面
    if (roleId) {
      // 尝试获取角色信息
      try {
        const roleCache = wx.getStorageSync('roleCache') || {};
        const role = roleCache[roleId];

        if (role) {
          console.log('找到角色信息:', role);

          // 跳转到聊天页面
          wx.navigateTo({
            url: `/pages/chat/chat?roleId=${roleId}${chatId ? '&chatId=' + chatId : ''}`,
            success: () => {
              console.log('跳转到聊天页面成功');
            },
            fail: (error) => {
              console.error('跳转到聊天页面失败:', error);

              // 如果跳转失败，尝试跳转到情绪分析页面
              this.navigateToEmotionAnalysis(recordId);
            }
          });
          return;
        }
      } catch (error) {
        console.error('获取角色信息失败:', error);
      }
    }

    // 如果没有角色ID或跳转失败，跳转到情绪分析详情页
    this.navigateToEmotionAnalysis(recordId);
  },

  /**
   * 跳转到情绪分析页面
   */
  navigateToEmotionAnalysis: function(recordId) {
    wx.navigateTo({
      url: '/packageChat/pages/emotion-analysis/emotion-analysis?recordId=' + recordId,
      success: () => {
        console.log('跳转到情绪分析页面成功');
      },
      fail: (error) => {
        console.error('跳转到情绪分析页面失败:', error);

        // 如果跳转失败，提示用户
        wx.showToast({
          title: '无法打开详情页面',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 点击日历日期
   */
  onDayClick: function (e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;

    // 获取当前日期的情绪记录
    console.log('查看日期情绪:', date);

    // 可以跳转到该日期的情绪记录列表或详情页
    wx.navigateTo({
      url: '/packageEmotion/pages/daily-report/daily-report?date=' + date
    });
  },

  /**
   * 加载更多记录
   */
  loadMoreRecords: function () {
    // 实现加载更多记录的逻辑
    wx.showToast({
      title: '加载更多记录',
      icon: 'none'
    });
  },

  /**
   * 计算绝对值
   */
  abs: function (value) {
    return Math.abs(value);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 检查暗黑模式变化
    const systemInfo = wx.getSystemInfoSync();
    const darkMode = systemInfo.theme === 'dark';

    if (this.data.darkMode !== darkMode) {
      this.setData({ darkMode });

      // 如果图表已初始化，重新初始化以适应主题变化
      if (this.data.hasData) {
        this.initCharts();
      }
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // 页面隐藏时可以做一些清理工作
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 页面卸载时清理资源
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // 如果有更多记录，加载更多
    if (this.data.hasMoreRecords) {
      this.loadMoreRecords();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '我的情绪历史',
      path: '/packageEmotion/pages/emotion-history/emotion-history'
    };
  }
});
