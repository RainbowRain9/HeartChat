# HeartChat ECharts 组件使用指南

## 1. 概述

HeartChat 微信小程序使用 ECharts 组件来实现各种数据可视化需求，包括情绪波动图、雷达图和历史对比图等。本文档将详细介绍如何在 HeartChat 项目中正确使用 ECharts 组件，以及如何避免常见问题。

## 2. 组件结构

HeartChat 中的 ECharts 实现基于官方的微信小程序 ECharts 组件，位于 `components/ec-canvas/` 目录下，主要包含以下文件：

- `ec-canvas.js`：组件的主要逻辑实现
- `ec-canvas.wxml`：组件的模板文件
- `ec-canvas.wxss`：组件的样式文件
- `echarts.js`：ECharts 核心库文件
- `wx-canvas.js`：微信小程序 Canvas 适配器

## 3. 基本使用方法

### 3.1 引入组件

在需要使用 ECharts 的页面或组件的 JSON 配置文件中引入 ec-canvas 组件：

```json
{
  "usingComponents": {
    "ec-canvas": "../../components/ec-canvas/ec-canvas"
  }
}
```

### 3.2 在 WXML 中使用组件

在 WXML 文件中添加 ec-canvas 组件：

```html
<view class="chart-container">
  <ec-canvas id="myChart" canvas-id="myCanvas" ec="{{ ec }}"></ec-canvas>
</view>
```

### 3.3 在 WXSS 中设置样式

确保为图表容器设置合适的样式：

```css
.chart-container {
  position: relative;
  width: 100%;
  height: 300px;
  margin-bottom: 20rpx;
  background-color: #FFFFFF;
  border-radius: 8rpx;
  overflow: hidden;
}

ec-canvas {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
}
```

### 3.4 在 JS 中初始化图表

在页面或组件的 JS 文件中初始化 ECharts：

```javascript
// 引入 echarts
const echarts = require('../../components/ec-canvas/echarts');

Page({
  data: {
    ec: {
      lazyLoad: true // 延迟加载
    }
  },
  
  onReady: function() {
    // 获取组件实例
    this.ecComponent = this.selectComponent('#myChart');
    this.initChart(); // 初始化图表
  },
  
  initChart: function() {
    this.ecComponent.init((canvas, width, height, dpr) => {
      // 初始化 echarts 实例
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
      });
      
      // 设置图表配置项
      const option = {
        // 这里是 ECharts 配置项
        title: {
          text: '示例图表',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          data: [820, 932, 901, 934, 1290, 1330, 1320],
          type: 'line'
        }]
      };
      
      // 使用配置项设置图表
      chart.setOption(option);
      
      // 返回 chart 实例
      return chart;
    });
  }
});
```

## 4. 高级使用技巧

### 4.1 处理图表随页面滚动问题

在 HeartChat 项目中，我们发现图表可能会随着页面滚动而移动位置。为解决这个问题，我们采用了以下策略：

1. **使用合适的容器样式**：

```css
.chart-container {
  position: relative;
  width: 100%;
  height: 250px;
  margin-bottom: 20rpx;
  background-color: #FFFFFF;
  border-radius: 8rpx;
  overflow: hidden;
}

ec-canvas {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
}
```

2. **在滚动时调整图表大小**：

```javascript
// 监听页面滚动事件
onPageScroll: function() {
  if (this.chart) {
    this.chart.resize();
  }
},

// 组件滚动事件
onScroll: function() {
  if (this.chart) {
    this.chart.resize();
  }
}
```

3. **使用延时初始化**：

```javascript
initChart: function() {
  // 使用延时确保组件已经完全渲染
  setTimeout(() => {
    this.ecComponent.init((canvas, width, height, dpr) => {
      // 初始化代码...
    });
  }, 100);
}
```

### 4.2 自适应不同屏幕尺寸

为了使图表在不同屏幕尺寸上都能正常显示，建议：

1. 使用百分比设置容器宽度
2. 根据屏幕尺寸动态调整图表配置

```javascript
onReady: function() {
  // 获取系统信息
  const systemInfo = wx.getSystemInfoSync();
  const screenWidth = systemInfo.windowWidth;
  
  // 根据屏幕宽度调整字体大小
  const fontSize = screenWidth < 375 ? 10 : 12;
  
  this.setData({
    fontSize: fontSize
  });
  
  this.initChart();
}
```

### 4.3 处理暗黑模式

HeartChat 支持暗黑模式，在使用 ECharts 时需要适配不同的主题：

```javascript
initChart: function() {
  const isDarkMode = this.data.darkMode;
  
  this.ecComponent.init((canvas, width, height, dpr) => {
    const chart = echarts.init(canvas, null, {
      width: width,
      height: height,
      devicePixelRatio: dpr
    });
    
    const option = {
      // 基本配置...
      
      // 根据暗黑模式调整颜色
      textStyle: {
        color: isDarkMode ? '#E6E1E5' : '#111827'
      },
      axisLine: {
        lineStyle: {
          color: isDarkMode ? '#4B5563' : '#999'
        }
      }
      // 其他配置...
    };
    
    chart.setOption(option);
    return chart;
  });
}
```

## 5. 常见图表类型实现

### 5.1 情绪波动折线图

```javascript
getEmotionChartOption: function() {
  return {
    title: {
      text: '情绪波动',
      left: 'center',
      top: 0,
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}%'
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
      data: ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '现在'],
      axisLine: {
        lineStyle: {
          color: '#999'
        }
      },
      axisLabel: {
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [{
      name: '情绪强度',
      type: 'line',
      smooth: true,
      data: [50, 60, 55, 70, 65, 75, 80],
      itemStyle: {
        color: '#10B981'
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
            color: 'rgba(16, 185, 129, 0.3)'
          }, {
            offset: 1,
            color: 'rgba(16, 185, 129, 0.1)'
          }]
        }
      }
    }]
  };
}
```

### 5.2 情绪维度雷达图

```javascript
getRadarChartOption: function() {
  return {
    title: {
      text: '情绪维度',
      left: 'center',
      top: 0,
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'item'
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
        fontSize: 10
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [80, 70, 60, 30, 50],
        name: '情绪维度',
        areaStyle: {
          color: 'rgba(16, 185, 129, 0.3)'
        },
        lineStyle: {
          color: '#10B981'
        },
        itemStyle: {
          color: '#10B981'
        }
      }]
    }]
  };
}
```

### 5.3 情绪历史对比柱状图

```javascript
getHistoryChartOption: function() {
  return {
    title: {
      text: '情绪历史对比',
      left: 'center',
      top: 0,
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal'
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
      }
    },
    legend: {
      data: ['积极', '压力', '能量'],
      bottom: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: {
        fontSize: 10
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
      data: ['一周前', '三天前', '昨天', '今天'],
      axisLine: {
        lineStyle: {
          color: '#999'
        }
      },
      axisLabel: {
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '积极',
        type: 'bar',
        data: [60, 65, 70, 75],
        itemStyle: {
          color: '#10B981'
        }
      },
      {
        name: '压力',
        type: 'bar',
        data: [70, 65, 60, 50],
        itemStyle: {
          color: '#F59E0B'
        }
      },
      {
        name: '能量',
        type: 'bar',
        data: [50, 55, 60, 65],
        itemStyle: {
          color: '#60A5FA'
        }
      }
    ]
  };
}
```

## 6. 常见问题与解决方案

### 6.1 图表不显示或显示异常

**问题**：图表容器显示但图表内容不显示，或显示不完整。

**解决方案**：
1. 确保容器有明确的宽高设置
2. 检查 ECharts 初始化代码是否正确
3. 使用 `setTimeout` 延迟初始化
4. 确保数据格式正确

### 6.2 图表随页面滚动而移动

**问题**：当页面滚动时，图表位置发生偏移或变形。

**解决方案**：
1. 使用 `position: relative` 而非 `absolute`
2. 在滚动事件中调用 `chart.resize()`
3. 为容器添加 `overflow: hidden`
4. 使用 `!important` 确保样式优先级

### 6.3 图表在不同设备上显示不一致

**问题**：图表在不同尺寸的设备上显示效果差异大。

**解决方案**：
1. 使用响应式设计，根据屏幕尺寸调整图表配置
2. 动态计算字体大小和间距
3. 使用百分比而非固定像素值设置尺寸

### 6.4 图表加载缓慢

**问题**：图表加载时间过长，影响用户体验。

**解决方案**：
1. 减少数据点数量
2. 优化图表配置，移除不必要的组件
3. 使用 `lazyLoad: true` 延迟加载
4. 考虑使用骨架屏或加载动画

## 7. 性能优化建议

1. **减少重绘**：避免频繁调用 `setOption` 和 `resize`
2. **数据简化**：对大量数据进行抽样或聚合
3. **按需加载**：使用 `lazyLoad: true` 延迟加载图表
4. **缓存实例**：保存 chart 实例，避免重复创建
5. **合理设置动画**：在性能敏感场景可以关闭动画

## 8. 参考资源

- [ECharts 官方文档](https://echarts.apache.org/handbook/zh/)
- [微信小程序 ECharts 项目](https://github.com/ecomfe/echarts-for-weixin)
- [ECharts 配置项手册](https://echarts.apache.org/zh/option.html)
- [ECharts 示例](https://echarts.apache.org/examples/zh/)

---

*本文档最后更新于：2023年12月15日*
