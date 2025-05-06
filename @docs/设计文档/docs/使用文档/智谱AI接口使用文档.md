# HeartChat 智谱AI接口使用文档

## 功能概述

HeartChat项目集成了智谱AI (BigModel) API，提供高质量的情感分析、关键词提取、词向量获取、聚类分析和用户兴趣分析功能。这些功能可以帮助应用识别用户情绪状态、提取对话中的关键主题，分析用户兴趣，并提供更加个性化的交互体验。

## 云函数接口说明

所有智谱AI相关功能都集成在`analysis`云函数中，通过不同的`type`参数来调用不同的功能。

### 1. 情感分析

**调用方式**：
```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'emotion',
    text: '待分析的文本内容',
    saveRecord: true,  // 可选参数，是否保存记录到数据库
    roleId: 'role123',  // 可选参数，关联的角色ID
    chatId: 'chat456'   // 可选参数，关联的聊天ID
  }
})
```

**返回数据**：
```javascript
{
  success: true,
  result: {
    type: "喜悦",           // 情感类型
    intensity: 0.85,        // 情感强度
    keywords: ["开心", "高兴", "快乐"], // 情感相关关键词
    suggestions: [          // 建议回复
      "看起来你心情不错！",
      "很高兴看到你这么开心！"
    ],
    report: "检测到明显的喜悦状态。", // 情感报告
    originalText: "今天真是太开心了，一切都很顺利！" // 原始文本
  },
  recordId: "abc123"  // 如果saveRecord为true，返回保存的记录ID
}
```

### 2. 关键词提取

**调用方式**：
```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'keywords',
    text: '待分析的文本内容',
    topK: 10  // 可选参数，返回的关键词数量，默认为10
  }
})
```

**返回数据**：
```javascript
{
  success: true,
  data: {
    keywords: [
      { word: "关键词1", weight: 0.85 },
      { word: "关键词2", weight: 0.72 },
      // ...更多关键词
    ]
  }
}
```

### 3. 获取词向量

**调用方式**：
```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'word_vectors',
    texts: ['词语1', '词语2', '词语3'] // 可以是单个字符串或字符串数组
  }
})
```

**返回数据**：
```javascript
{
  success: true,
  data: {
    vectors: [
      [0.1, 0.2, ...],  // 词语1的向量
      [0.3, 0.4, ...],  // 词语2的向量
      [0.5, 0.6, ...]   // 词语3的向量
    ]
  }
}
```

### 4. 聚类分析

**调用方式**：
```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'cluster',
    text: '待分析的长文本内容',
    threshold: 0.7,        // 可选参数，聚类阈值，默认为0.7
    minClusterSize: 2      // 可选参数，最小簇大小，默认为2
  }
})
```

**返回数据**：
```javascript
{
  success: true,
  data: {
    clusters: [
      {
        keywords: ["词语1", "词语2", "词语3"],
        center: "词语1",
        size: 3
      },
      // ...更多聚类
    ]
  }
}
```

### 5. 用户兴趣分析

**调用方式**：
```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'user_interests',
    messages: ['用户消息1', '用户消息2', '用户消息3'] // 用户历史消息数组
  }
})
```

**返回数据**：
```javascript
{
  success: true,
  data: {
    interests: [
      {
        name: "旅行",
        confidence: 0.85,
        keywords: ["旅游", "景点", "度假"]
      },
      {
        name: "美食",
        confidence: 0.72,
        keywords: ["美食", "餐厅", "料理"]
      }
      // ...更多兴趣领域
    ],
    summary: "用户对旅行和美食表现出较高的兴趣，尤其是亚洲地区的旅游和当地美食。"
  }
}
```

## 使用示例

### 示例1：分析用户消息情绪

```javascript
// 在聊天页面中分析用户消息的情绪
async function analyzeUserEmotion(userMessage) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'analysis',
      data: {
        type: 'emotion',
        text: userMessage,
        saveRecord: true
      }
    });
    
    if (result.result && result.result.success) {
      const emotion = result.result.result;
      console.log('情绪分析结果:', emotion);
      
      // 根据情绪类型和强度调整UI或回复
      if (emotion.type === '悲伤' && emotion.intensity > 0.7) {
        // 显示关怀UI或提供安慰回复
      }
      
      return emotion;
    } else {
      console.error('情绪分析失败:', result.result.error);
      return null;
    }
  } catch (error) {
    console.error('调用情绪分析云函数失败:', error);
    return null;
  }
}
```

### 示例2：提取对话关键词并生成标签云

```javascript
// 提取对话关键词并生成标签云
async function generateKeywordCloud(conversationText) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'analysis',
      data: {
        type: 'keywords',
        text: conversationText,
        topK: 20
      }
    });
    
    if (result.result && result.result.success) {
      const keywords = result.result.data.keywords;
      console.log('提取到的关键词:', keywords);
      
      // 生成标签云数据
      const tagCloudData = keywords.map(item => ({
        name: item.word,
        value: Math.round(item.weight * 100)
      }));
      
      // 使用标签云组件显示
      this.setData({
        tagCloudData: tagCloudData
      });
      
      return keywords;
    } else {
      console.error('关键词提取失败:', result.result.error);
      return [];
    }
  } catch (error) {
    console.error('调用关键词提取云函数失败:', error);
    return [];
  }
}
```

### 示例3：分析用户兴趣并提供个性化推荐

```javascript
// 分析用户历史消息，提取兴趣主题
async function analyzeUserInterests(userMessages) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'analysis',
      data: {
        type: 'user_interests',
        messages: userMessages
      }
    });
    
    if (result.result && result.result.success) {
      const interests = result.result.data.interests;
      const summary = result.result.data.summary;
      
      console.log('用户兴趣分析:', interests);
      console.log('兴趣总结:', summary);
      
      // 根据兴趣提供个性化推荐
      const topInterests = interests
        .filter(item => item.confidence > 0.6)
        .map(item => item.name);
      
      // 显示推荐内容
      this.setData({
        userInterests: topInterests,
        interestSummary: summary,
        showRecommendations: true
      });
      
      return interests;
    } else {
      console.error('兴趣分析失败:', result.result.error);
      return [];
    }
  } catch (error) {
    console.error('调用兴趣分析云函数失败:', error);
    return [];
  }
}
```

## 注意事项

1. **API密钥安全**：智谱AI API密钥存储在云函数环境变量中，请确保在部署前正确设置环境变量`ZHIPU_API_KEY`。

2. **文本长度限制**：单次请求的文本不应超过智谱AI模型的最大输入长度限制，GLM-4-Flash模型通常支持较长的输入，但仍建议控制在合理范围内。

3. **调用频率**：智谱AI API有调用频率和配额限制，建议在必要时才调用，避免频繁调用。

4. **错误处理**：所有API调用都应该进行适当的错误处理，确保应用在API调用失败时能够优雅降级。

5. **缓存策略**：对于频繁使用的分析结果，建议实现缓存机制以减少API调用次数。

6. **成本控制**：智谱AI API是付费服务，请合理控制调用频率和数据量，避免不必要的成本。

## 技术实现

HeartChat项目中的智谱AI功能基于智谱AI的GLM-4-Flash和Embedding-3模型实现，主要包含以下模块：

1. **bigmodel.js**：实现与智谱AI API的交互，包括情感分析、关键词提取、词向量获取、聚类分析和用户兴趣分析等核心功能。
2. **index.js**：云函数入口，负责接收请求并调用相应的功能模块，同时处理数据库交互。

## 更新日志

- 2025-04-16: 初始版本发布，集成智谱AI API实现情感分析和关键词提取功能
- 2025-04-16: 添加词向量获取、聚类分析和用户兴趣分析功能
