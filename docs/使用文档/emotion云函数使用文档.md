# HeartChat Emotion 云函数使用文档

## 一、概述

`emotion` 云函数负责处理与用户情绪数据相关的查询和统计功能，主要用于获取用户的情绪概览和情绪历史数据，为用户中心页面和情绪历史页面提供数据支持。

## 二、功能说明

### 1. 获取情绪概览 (getEmotionOverview)

**功能**：获取用户最近一周的情绪分布概览，包括主要情绪类型、情绪分布比例等。

**使用场景**：
- 用户中心页面的情绪概览卡片
- 情绪分析页面的情绪分布图表

**调用方式**：
```javascript
const result = await wx.cloud.callFunction({
  name: 'emotion',
  data: {
    action: 'getEmotionOverview',
    userId: userInfo.userId // 可选，默认使用当前登录用户
  }
});
```

**返回数据**：
```javascript
{
  success: true,
  data: {
    labels: ["快乐", "平静", "焦虑", "压力"], // 情绪类型标签
    values: [5, 3, 2, 1],                   // 对应的数量
    colors: ["#38b2ac", "#48bb78", "#ed64a6", "#f56565"], // 对应的颜色
    mainEmotion: "快乐",                    // 主要情绪
    secondEmotion: "平静",                  // 次要情绪
    emotionArray: [                         // 详细情绪数据
      { emotion: "快乐", count: 5, percentage: 45.5 },
      { emotion: "平静", count: 3, percentage: 27.3 },
      // ...
    ]
  }
}
```

### 2. 获取情绪历史 (getEmotionHistory)

**功能**：获取用户指定时间范围内的情绪变化历史，按日期分组，用于生成情绪趋势图。

**使用场景**：
- 情绪历史页面的情绪趋势图
- 情绪分析页面的情绪变化曲线

**调用方式**：
```javascript
const result = await wx.cloud.callFunction({
  name: 'emotion',
  data: {
    action: 'getEmotionHistory',
    userId: userInfo.userId, // 可选，默认使用当前登录用户
    days: 30,                // 可选，获取最近多少天的数据，默认30天
    limit: 100               // 可选，最多返回多少条记录，默认100条
  }
});
```

**返回数据**：
```javascript
{
  success: true,
  data: {
    dailyData: [
      {
        date: "2024-04-10",
        mainEmotion: "快乐",
        emotionValue: 100,    // 情绪值，范围-100到100
        recordCount: 3        // 当日记录数量
      },
      // ...更多日期数据
    ],
    chartData: {
      dates: ["2024-04-10", "2024-04-11", "2024-04-12"], // 日期数组
      values: [100, 60, -40],                           // 情绪值数组
      emotions: ["快乐", "平静", "焦虑"]                  // 情绪类型数组
    }
  }
}
```

## 三、实现原理

### 1. 情绪概览处理流程

1. 查询用户最近一周的情绪记录
2. 统计各情绪类型出现次数
3. 处理次要情绪，给予较低权重
4. 计算情绪分布百分比
5. 确定主要情绪和次要情绪
6. 生成情绪颜色映射
7. 返回格式化的情绪概览数据

### 2. 情绪历史处理流程

1. 查询用户指定时间范围内的情绪记录
2. 按日期分组情绪记录
3. 计算每日主要情绪
4. 将情绪类型映射到情绪值（-100到100的范围）
5. 生成日期、情绪值和情绪类型数组
6. 返回格式化的情绪历史数据

### 3. 情绪值映射表

情绪类型映射到数值范围（-100到100）：

| 情绪类型 | 情绪值 |
|---------|-------|
| 快乐 | 100 |
| 满足 | 80 |
| 平静 | 60 |
| 期待 | 40 |
| 惊讶 | 20 |
| 未知 | 0 |
| 担忧 | -20 |
| 疲惫 | -40 |
| 焦虑 | -60 |
| 悲伤 | -80 |
| 压力 | -90 |
| 愤怒 | -95 |
| 恐惧 | -100 |

## 四、使用示例

### 1. 在用户中心页面获取情绪概览

```javascript
// pages/user/user.js
Page({
  data: {
    emotionData: {
      labels: [],
      values: [],
      colors: [],
      mainEmotion: '',
      secondEmotion: ''
    }
  },
  
  onShow() {
    this.loadEmotionData();
  },
  
  async loadEmotionData() {
    try {
      const { userInfo } = this.data;
      if (!userInfo || !userInfo.userId) return;
      
      // 调用云函数获取情绪数据
      const result = await wx.cloud.callFunction({
        name: 'emotion',
        data: {
          action: 'getEmotionOverview',
          userId: userInfo.userId
        }
      });
      
      if (result.result && result.result.success) {
        const emotionData = result.result.data;
        this.setData({ emotionData });
        
        // 初始化情绪饼图
        this.initEmotionChart(emotionData);
      }
    } catch (error) {
      console.error('获取情绪数据失败:', error);
    }
  },
  
  initEmotionChart(emotionData) {
    // 使用 ECharts 或其他图表库初始化饼图
    // ...
  }
});
```

### 2. 在情绪历史页面获取情绪趋势

```javascript
// packageEmotion/pages/emotion-history/emotion-history.js
Page({
  data: {
    historyData: {
      dailyData: [],
      chartData: {
        dates: [],
        values: [],
        emotions: []
      }
    }
  },
  
  onLoad() {
    this.loadEmotionHistory();
  },
  
  async loadEmotionHistory() {
    try {
      const { userInfo } = getApp().globalData;
      if (!userInfo || !userInfo.userId) return;
      
      // 调用云函数获取情绪历史
      const result = await wx.cloud.callFunction({
        name: 'emotion',
        data: {
          action: 'getEmotionHistory',
          userId: userInfo.userId,
          days: 30
        }
      });
      
      if (result.result && result.result.success) {
        const historyData = result.result.data;
        this.setData({ historyData });
        
        // 初始化情绪趋势图
        this.initEmotionTrendChart(historyData.chartData);
      }
    } catch (error) {
      console.error('获取情绪历史失败:', error);
    }
  },
  
  initEmotionTrendChart(chartData) {
    // 使用 ECharts 或其他图表库初始化趋势图
    // ...
  }
});
```

## 五、注意事项

1. **数据依赖**：`emotion` 云函数依赖于 `emotionRecords` 集合中的数据，这些数据由 `analysis` 云函数在情感分析时生成。

2. **数据量限制**：为避免返回过多数据，`getEmotionHistory` 函数默认限制为最多返回100条记录，可通过 `limit` 参数调整。

3. **日期处理**：情绪历史数据按日期分组，每个日期只保留一个主要情绪，代表当日的整体情绪状态。

4. **空数据处理**：如果查询结果为空（如用户没有情绪记录），函数会返回空数组，前端需要处理这种情况。

5. **性能考虑**：对于活跃用户，情绪记录可能较多，建议在高频调用场景下考虑结果缓存。

## 六、错误处理

常见错误及处理方法：

| 错误情况 | 错误信息 | 处理方法 |
|---------|---------|---------|
| 查询失败 | "获取情绪概览失败" | 检查网络连接和用户ID是否正确 |
| 无数据 | 返回空数组 | 显示默认状态或提示用户暂无数据 |
| 参数错误 | "无效的用户ID" | 确保传入了正确的userId参数 |

## 七、未来优化方向

1. **缓存机制**：添加结果缓存，减少数据库查询次数
2. **数据聚合**：使用数据库聚合操作，提高查询效率
3. **情绪分析增强**：结合用户画像，提供更个性化的情绪分析
4. **实时更新**：支持WebSocket实时推送情绪数据更新
