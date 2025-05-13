# geminiModel.js 功能说明文档

## 1. 概述

`geminiModel.js` 是HeartChat微信小程序中用于集成Google Gemini API的核心模块，提供了情感分析、关键词提取、关键词聚类、用户兴趣分析和报告生成等功能。该模块设计参考了`bigmodel.js`中的提示词格式和接口设计，确保了与智谱AI模块的兼容性。

## 2. 版本信息

- **当前版本**: 0.5.0
- **更新日期**: 2025-05-14
- **文件路径**: `cloudfunctions/analysis/geminiModel.js`

## 3. 功能模块

### 3.1 情感分析 (analyzeEmotion)

#### 功能描述

分析用户文本中的情感状态，识别主要情感和次要情感，计算情感强度、愉悦度和激动水平，分析情感变化趋势，提取与情感相关的关键词，并提供基于情感分析的建议。

#### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| text | string | 是 | 待分析的文本内容 |
| history | Array | 否 | 历史消息记录，用于提供上下文 |

#### 返回值

```javascript
{
  success: true,
  result: {
    // 兼容旧版字段
    type: "喜悦",                // 主要情感类型
    intensity: 0.8,              // 情感强度
    keywords: ["开心", "成功"],   // 主题关键词
    suggestions: ["建议1", "建议2"], // 建议
    report: "用户当前情绪积极...", // 情感报告
    originalText: "原始文本",     // 原始文本
    
    // 新增字段
    primary_emotion: "喜悦",     // 主要情感
    secondary_emotions: ["期待", "满足"], // 次要情感
    valence: 0.9,                // 愉悦度
    arousal: 0.7,                // 激动水平
    trend: "上升",               // 情绪变化趋势
    trend_en: "rising",          // 情绪变化趋势(英文)
    attention_level: "高",       // 注意力水平
    attention_level_en: "high",  // 注意力水平(英文)
    radar_dimensions: {          // 雷达图维度
      trust: 0.8,                // 信任度
      openness: 0.7,             // 开放度
      resistance: 0.2,           // 抗拒/防御
      stress: 0.3,               // 压力水平
      control: 0.6               // 控制感/确定性
    },
    topic_keywords: ["关键词1", "关键词2"], // 主题关键词
    emotion_triggers: ["触发词1", "触发词2"], // 情绪触发词
    summary: "用户当前情绪积极..."  // 情感总结
  }
}
```

#### 使用示例

```javascript
const geminiModel = require('./geminiModel');

// 分析单条文本
const result = await geminiModel.analyzeEmotion("今天真是太开心了，我终于完成了这个项目！");

// 带历史记录的分析
const history = [
  { role: 'user', content: '我今天考试没考好' },
  { role: 'assistant', content: '没关系，这只是一次小挫折' }
];
const resultWithHistory = await geminiModel.analyzeEmotion("不过我决定调整心态，下次一定会更好", history);
```

### 3.2 关键词提取 (extractKeywords)

#### 功能描述

从文本中提取重要关键词，计算关键词的权重，对关键词进行排序，并限制返回的关键词数量。

#### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| text | string | 是 | 待提取关键词的文本内容 |
| topK | number | 否 | 返回的关键词数量，默认为10 |

#### 返回值

```javascript
{
  success: true,
  data: {
    keywords: [
      { word: "关键词1", weight: 0.9 },
      { word: "关键词2", weight: 0.8 },
      // ...
    ]
  }
}
```

#### 使用示例

```javascript
const geminiModel = require('./geminiModel');

// 提取关键词
const result = await geminiModel.extractKeywords("人工智能正在改变我们的生活方式，从智能手机到智能家居，再到自动驾驶汽车，AI技术无处不在。", 5);
```

### 3.3 关键词聚类 (clusterKeywords)

#### 功能描述

将语义相近的关键词聚类，识别每个簇的中心词或主题，计算簇的大小，并支持设置聚类阈值和最小簇大小。

#### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| text | string | 是 | 待聚类的文本内容 |
| threshold | number | 否 | 聚类阈值，默认为0.7 |
| minClusterSize | number | 否 | 最小簇大小，默认为2 |

#### 返回值

```javascript
{
  success: true,
  data: {
    clusters: [
      {
        keywords: ["AI", "人工智能", "机器学习"],
        center: "人工智能",
        size: 3
      },
      {
        keywords: ["手机", "智能手机", "移动设备"],
        center: "智能手机",
        size: 3
      }
      // ...
    ]
  }
}
```

#### 使用示例

```javascript
const geminiModel = require('./geminiModel');

// 关键词聚类
const result = await geminiModel.clusterKeywords("人工智能正在改变我们的生活方式，从智能手机到智能家居，再到自动驾驶汽车，AI技术无处不在。", 0.7, 2);
```

### 3.4 用户兴趣分析 (analyzeUserInterests)

#### 功能描述

分析用户历史消息，提取用户可能的兴趣领域，计算每个兴趣领域的置信度，提取与兴趣相关的关键词，并生成用户兴趣的简短总结。

#### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| messages | Array<string> | 是 | 用户历史消息数组 |

#### 返回值

```javascript
{
  success: true,
  data: {
    interests: [
      {
        name: "人工智能",
        confidence: 0.9,
        keywords: ["AI", "机器学习", "深度学习"]
      },
      {
        name: "编程",
        confidence: 0.8,
        keywords: ["Python", "JavaScript", "编程语言"]
      }
      // ...
    ],
    summary: "用户对人工智能和编程领域表现出浓厚兴趣..."
  }
}
```

#### 使用示例

```javascript
const geminiModel = require('./geminiModel');

// 用户兴趣分析
const messages = [
  "我最近在学习Python编程",
  "人工智能真的很有趣，尤其是机器学习算法",
  "我希望能开发一个智能聊天机器人"
];
const result = await geminiModel.analyzeUserInterests(messages);
```

### 3.5 报告生成 (generateReportContent)

#### 功能描述

根据用户提供的文本生成每日心情报告，包含情感总结、洞察、建议、今日运势和鼓励语，支持自定义提示词。

#### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| prompt | string | 是 | 提示词，用于指导报告生成 |

#### 返回值

```javascript
{
  success: true,
  result: {
    title: "今日心情报告",
    summary: "今天你的情绪总体积极...",
    insights: ["洞察1", "洞察2"],
    suggestions: ["建议1", "建议2"],
    fortune: "今日运势不错，适合尝试新事物",
    encouragement: "记住，每一天都是新的开始！"
  }
}
```

#### 使用示例

```javascript
const geminiModel = require('./geminiModel');

// 生成报告
const prompt = "根据以下情感记录生成每日报告：用户今天情绪波动较大，上午情绪低落，下午逐渐好转，晚上表现出积极情绪。";
const result = await geminiModel.generateReportContent(prompt);
```

### 3.6 通用对话调用 (chatCompletion)

#### 功能描述

提供通用的对话调用接口，支持设置温度参数和响应格式，适用于各种对话场景。

#### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| options | Object | 是 | 调用选项 |
| options.messages | Array | 是 | 消息数组 |
| options.temperature | number | 否 | 温度参数，默认为0.7 |
| options.response_format | Object | 否 | 响应格式 |

#### 返回值

返回原始的Gemini API响应。

#### 使用示例

```javascript
const geminiModel = require('./geminiModel');

// 通用对话调用
const options = {
  messages: [
    { role: 'system', content: '你是一个友好的助手' },
    { role: 'user', content: '你好，请介绍一下自己' }
  ],
  temperature: 0.7
};
const response = await geminiModel.chatCompletion(options);
```

## 4. 工具函数

### 4.1 callGeminiAPI

#### 功能描述

底层API调用函数，负责与Gemini API进行通信，支持重试机制和错误处理。

#### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| params | Object | 是 | API调用参数 |
| retryCount | number | 否 | 重试次数，默认为3 |
| retryDelay | number | 否 | 重试延迟，默认为1000ms |

#### 返回值

返回Gemini API的原始响应。

#### 使用示例

```javascript
const geminiModel = require('./geminiModel');

// 直接调用API
const params = {
  model: geminiModel.GEMINI_PRO,
  contents: [
    {
      role: 'user',
      parts: [{ text: '你好，请介绍一下自己' }]
    }
  ],
  temperature: 0.7
};
const response = await geminiModel.callGeminiAPI(params);
```

## 5. 常量

- `GEMINI_PRO`: 默认模型ID，用于复杂任务，值为'gemini-2.5-flash-preview-04-17'
- `GEMINI_FLASH`: 快速版本模型ID，适合对话和基础分析，值为'gemini-2.5-flash-preview-04-17'

## 6. 注意事项

1. 确保已正确配置Gemini API密钥
2. 注意API调用频率限制，避免触发429错误
3. 对于长文本，可能需要增加云函数超时时间
4. 所有文本字段都使用中文返回，这对于前端显示和情感颜色分类至关重要
5. 系统提示词会被转换为用户角色，因为Gemini不支持system角色

## 7. 更新历史

- 0.5.0 (2025-05-14): 优化提示词设计，参考bigmodel.js中的提示词格式；增强情感分析功能；添加关键词聚类、用户兴趣分析和报告生成等功能；实现与智谱AI模块相同的接口和返回格式；优化JSON解析逻辑；添加对历史消息的处理支持；优化消息格式转换；实现系统提示词的转换
- 0.1.0 (2025-05-01): 初始版本，实现基本的情感分析和关键词提取功能
