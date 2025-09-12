# HeartChat Analysis 云函数 API 使用指南

## 📋 概述

HeartChat Analysis 云函数提供完整的情感分析和用户画像能力，支持情感分析、关键词提取、用户兴趣分析等多种功能。本文档详细介绍API的使用方法、参数说明和返回格式。

## 🚀 快速开始

### 基本调用方式

```javascript
// 在微信小程序中调用分析云函数
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'emotion', // 功能类型
    text: '今天工作压力很大，感觉有些焦虑和疲惫' // 待分析文本
  }
}).then(res => {
  console.log('分析结果:', res.result);
}).catch(err => {
  console.error('调用失败:', err);
});
```

## 📊 功能列表

### 1. 情感分析 (`emotion`)

**功能说明：** 对用户输入的文本进行多维度情感分析，识别情感类型、强度、极性等。

**请求参数：**
```javascript
{
  type: 'emotion',
  text: '用户输入的文本',
  history: [ // 可选，历史消息上下文
    { role: 'user', content: '上一条用户消息' },
    { role: 'assistant', content: '上一条AI回复' }
  ],
  saveRecord: true, // 可选，是否保存分析记录，默认false
  roleId: 'role123', // 可选，角色ID
  chatId: 'chat456', // 可选，聊天会话ID
  extractKeywords: true, // 可选，是否提取关键词，默认true
  linkKeywords: true // 可选，是否关联关键词情感，默认true
}
```

**返回结果：**
```javascript
{
  success: true,
  result: {
    primary_emotion: '焦虑',        // 主要情感类型
    secondary_emotions: ['疲惫'],  // 次要情感
    intensity: 0.8,                 // 情感强度 0-1
    valence: -0.6,                  // 情感极性 -1到1
    arousal: 0.7,                  // 唤醒度 0-1
    trend: '上升',                  // 情感趋势
    trend_en: 'rising',             // 英文趋势
    attention_level: '高',         // 注意力水平
    attention_level_en: 'high',     // 英文注意力水平
    radar_dimensions: {            // 雷达图维度
      trust: 0.6,                  // 信任度
      openness: 0.7,               // 开放度
      resistance: 0.4,              // 抗拒度
      stress: 0.8,                 // 压力水平
      control: 0.3                  // 控制感
    },
    topic_keywords: ['工作', '压力'], // 主题关键词
    emotion_triggers: ['压力', '工作'], // 情感触发词
    suggestions: ['建议进行深呼吸放松'], // 建议
    summary: '用户当前感到焦虑和疲惫'  // 情感总结
  },
  keywords: [                      // 提取的关键词
    { word: '工作', weight: 0.9 },
    { word: '压力', weight: 0.8 }
  ],
  recordId: 'record123'           // 保存的记录ID
}
```

### 2. 关键词提取 (`keywords`)

**功能说明：** 从文本中提取重要关键词并计算权重。

**请求参数：**
```javascript
{
  type: 'keywords',
  text: '今天天气很好，适合出去运动和旅游',
  topK: 5 // 可选，返回关键词数量，默认10
}
```

**返回结果：**
```javascript
{
  success: true,
  data: {
    keywords: [
      { word: '天气', weight: 0.9 },
      { word: '运动', weight: 0.8 },
      { word: '旅游', weight: 0.7 }
    ]
  }
}
```

### 3. 词向量获取 (`word_vectors`)

**功能说明：** 获取文本的词向量表示。

**请求参数：**
```javascript
{
  type: 'word_vectors',
  texts: ['机器学习', '人工智能'] // 文本数组
}
```

**返回结果：**
```javascript
{
  success: true,
  data: {
    vectors: [
      [0.1, 0.2, 0.3, ...], // 1536维向量
      [0.4, 0.5, 0.6, ...]
    ],
    source: 'api' // 数据来源：api/local/local_fallback
  }
}
```

### 4. 聚类分析 (`cluster`)

**功能说明：** 对文本中的关键词进行语义聚类。

**请求参数：**
```javascript
{
  type: 'cluster',
  text: '机器学习和深度学习都是人工智能的重要分支',
  threshold: 0.7,     // 可选，相似度阈值，默认0.7
  minClusterSize: 2   // 可选，最小簇大小，默认2
}
```

**返回结果：**
```javascript
{
  success: true,
  data: {
    clusters: [
      {
        keywords: ['机器学习', '深度学习'],
        center: '人工智能技术',
        size: 2
      }
    ]
  }
}
```

### 5. 用户兴趣分析 (`user_interests`)

**功能说明：** 基于历史消息分析用户兴趣领域。

**请求参数：**
```javascript
{
  type: 'user_interests',
  messages: [
    '我喜欢学习新技术',
    '最近在研究机器学习',
    '平时喜欢看电影和运动'
  ]
}
```

**返回结果：**
```javascript
{
  success: true,
  data: {
    interests: [
      {
        name: '学习',
        confidence: 0.9,
        keywords: ['学习', '技术', '研究']
      },
      {
        name: '娱乐',
        confidence: 0.7,
        keywords: ['电影', '运动']
      }
    ],
    summary: '用户对学习新技术有浓厚兴趣，同时也喜欢娱乐活动'
  }
}
```

### 6. 关注点分析 (`focus_points`)

**功能说明：** 分析用户的关注点和兴趣分布。

**请求参数：**
```javascript
{
  type: 'focus_points',
  userId: 'user123', // 可选，用户ID
  keywords: [        // 可选，关键词数组
    { word: '工作', weight: 0.9 },
    { word: '学习', weight: 0.8 }
  ],
  emotionRecords: [ // 可选，情感记录数组
    // 情感记录数据
  ],
  date: '2024-01-15' // 可选，指定日期
}
```

**返回结果：**
```javascript
{
  success: true,
  data: {
    categoryWeights: [
      { category: '工作', weight: 0.9, percentage: 52.9 },
      { category: '学习', weight: 0.8, percentage: 47.1 }
    ],
    focusPoints: [
      {
        category: '工作',
        percentage: 52.9,
        weight: 0.9,
        keywords: ['工作', '压力']
      }
    ],
    emotionalInsights: {
      positiveAssociations: [],
      negativeAssociations: [
        { word: '压力', ratio: 0.8, count: 5 }
      ]
    }
  }
}
```

### 7. 每日报告生成 (`daily_report`)

**功能说明：** 生成用户每日心情报告。

**请求参数：**
```javascript
{
  type: 'daily_report',
  userId: 'user123',           // 可选，用户ID
  date: '2024-01-15',          // 可选，报告日期，默认今天
  forceRegenerate: false       // 可选，强制重新生成，默认false
}
```

**返回结果：**
```javascript
{
  success: true,
  reportId: 'report123',
  report: {
    userId: 'user123',
    date: '2024-01-15',
    emotionSummary: '今天您的主要情绪是焦虑，情绪波动指数为65...',
    insights: [
      '您今天的情绪相对稳定',
      '关注点主要集中在工作和生活平衡上'
    ],
    suggestions: [
      '尝试进行深呼吸放松练习',
      '与朋友交流可能会改善心情'
    ],
    fortune: {
      good: ['放松心情', '与朋友交流'],
      bad: ['过度劳累', '钻牛角尖']
    },
    encouragement: '每一天都是新的开始，相信自己能够创造更美好的明天！',
    keywords: [
      { word: '工作', weight: 5 },
      { word: '压力', weight: 4 }
    ],
    emotionalVolatility: 65,
    primaryEmotion: '焦虑',
    emotionCount: 8,
    chartData: {
      emotionDistribution: [
        { type: '焦虑', count: 5, percentage: 62.5 },
        { type: '平静', count: 3, percentage: 37.5 }
      ],
      intensityTrend: [
        { timestamp: '2024-01-15T09:00:00Z', intensity: 0.6, type: '焦虑' },
        { timestamp: '2024-01-15T14:00:00Z', intensity: 0.8, type: '焦虑' }
      ]
    }
  },
  isNew: true
}
```

### 8. 关键词分类 (`classify_keywords`)

**功能说明：** 对关键词进行智能分类。

**请求参数：**
```javascript
{
  type: 'classify_keywords',
  keywords: ['机器学习', '电影', '运动'], // 关键词数组或字符串
  batch: true // 可选，是否批量分类，默认false
}
```

**返回结果：**
```javascript
{
  success: true,
  data: {
    classifications: [
      { keyword: '机器学习', category: '学习' },
      { keyword: '电影', category: '娱乐' },
      { keyword: '运动', category: '体育' }
    ]
  }
}
```

### 9. 获取预定义分类 (`get_categories`)

**功能说明：** 获取所有预定义的分类类别。

**请求参数：**
```javascript
{
  type: 'get_categories'
}
```

**返回结果：**
```javascript
{
  success: true,
  data: {
    categories: [
      '学习', '工作', '娱乐', '社交', '健康', '生活',
      '科技', '艺术', '体育', '旅游', '美食', '时尚'
    ]
  }
}
```

### 10. 关键词情感关联 (`link_keywords_emotion`)

**功能说明：** 将关键词与情感分析结果关联。

**请求参数：**
```javascript
{
  type: 'link_keywords_emotion',
  keywords: ['工作', '压力'], // 关键词数组
  emotionResult: {           // 情感分析结果
    type: '焦虑',
    intensity: 0.8,
    valence: -0.6
  }
}
```

**返回结果：**
```javascript
{
  success: true,
  message: '关联关键词与情感成功',
  data: {
    userId: 'user123',
    keywords: ['工作', '压力'],
    emotionResult: {
      type: '焦虑',
      intensity: 0.8,
      score: -0.48
    },
    currentData: {
      // 更新后的用户兴趣数据
    }
  }
}
```

### 11. 获取关键词情感统计 (`get_keyword_emotion_stats`)

**功能说明：** 获取关键词的情感统计信息。

**请求参数：**
```javascript
{
  type: 'get_keyword_emotion_stats',
  userId: 'user123' // 可选，用户ID
}
```

**返回结果：**
```javascript
{
  success: true,
  data: {
    positive: [
      { word: '学习', score: 0.8, weight: 5, category: '学习' }
    ],
    negative: [
      { word: '压力', score: -0.6, weight: 8, category: '工作' }
    ],
    neutral: [
      { word: '日常', score: 0.1, weight: 3, category: '生活' }
    ]
  }
}
```

## 🛠️ 错误处理

### 常见错误类型

1. **参数验证错误**
```javascript
{
  success: false,
  error: '无效的文本参数'
}
```

2. **API调用失败**
```javascript
{
  success: false,
  error: '情感分析服务调用失败'
}
```

3. **数据查询失败**
```javascript
{
  success: false,
  error: '当天没有情感记录，无法生成报告'
}
```

### 错误处理建议

```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'emotion',
    text: userInput
  }
}).then(res => {
  if (res.result.success) {
    // 处理成功结果
    handleAnalysisResult(res.result);
  } else {
    // 处理错误情况
    handleError(res.result.error);
  }
}).catch(err => {
  // 处理网络或系统错误
  console.error('调用失败:', err);
  showErrorMessage('分析服务暂时不可用，请稍后再试');
});
```

## 📈 性能优化建议

### 1. 缓存策略
- 对频繁查询的用户数据使用本地缓存
- 每日报告缓存24小时避免重复生成
- 关键词分类结果缓存提高响应速度

### 2. 批量处理
- 多个关键词使用批量分类接口
- 历史消息限制数量避免过度处理
- 合理设置topK参数控制返回数据量

### 3. 异步处理
- 情感记录保存使用异步方式
- 关键词情感关联异步处理
- 不阻塞主流程的数据操作

## 🔧 配置说明

### 环境变量配置
```bash
# 智谱AI API密钥
ZHIPU_API_KEY=your_api_key_here
```

### 云开发环境
- 确保云开发环境已正确配置
- 数据库集合权限设置正确
- 云函数部署状态正常

## 📊 监控指标

### 关键监控点
- API响应时间
- 分析准确率
- 错误率统计
- 资源使用情况

### 日志记录
- 成功调用日志
- 错误异常日志
- 性能指标日志
- 用户行为日志

## 🎯 最佳实践

### 1. 参数验证
```javascript
function validateAnalysisParams(params) {
  if (!params.text || params.text.trim() === '') {
    throw new Error('文本内容不能为空');
  }
  if (params.text.length > 1000) {
    throw new Error('文本内容过长，请限制在1000字以内');
  }
}
```

### 2. 结果处理
```javascript
function processAnalysisResult(result) {
  if (!result.success) {
    return {
      error: result.error,
      suggestion: getDefaultSuggestion()
    };
  }
  
  return {
    emotion: result.result.primary_emotion,
    intensity: result.result.intensity,
    suggestions: result.result.suggestions,
    keywords: result.keywords
  };
}
```

### 3. 用户体验优化
```javascript
function showAnalysisLoading() {
  wx.showLoading({
    title: '分析中...',
    mask: true
  });
}

function hideAnalysisLoading() {
  wx.hideLoading();
}
```

---

## 📝 总结

HeartChat Analysis 云函数提供了完整的情感分析和用户画像能力。通过合理的API设计和丰富的功能模块，为用户提供了专业的情感陪伴服务。

**核心优势：**
- 🎯 **功能完整**：涵盖情感分析、关键词提取、用户画像等多个维度
- 🚀 **性能优化**：并行处理、异步操作、缓存策略
- 🛡️ **稳定可靠**：完善的错误处理和降级机制
- 📊 **数据驱动**：基于数据的用户画像和个性化服务
- 🔧 **易于集成**：标准化的API接口和详细的文档支持

通过合理使用这些API，可以为用户提供更加智能化、个性化的情感陪伴服务。