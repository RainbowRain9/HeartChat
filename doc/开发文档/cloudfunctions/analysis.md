# Analysis 云函数文档

## 功能描述

Analysis云函数是一个**情感分析与关键词提取服务**，提供基于多种AI模型的文本情感分析、关键词提取、用户兴趣分析和报告生成功能。

## 文件结构

- **`index.js`** - 主入口文件，定义云函数接口和主要业务逻辑
- **`aiModelService.js`** - 统一AI模型服务，支持多平台调用
- **`aiModelService_part2.js`** - AI模型服务的第二部分（关键词提取、词向量）
- **`aiModelService_part3.js`** - AI模型服务的第三部分（聚类分析、兴趣分析）
- **`bigmodel.js`** - 智谱AI API集成模块
- **`geminiModel.js`** - Google Gemini API集成模块
- **`keywordClassifier.js`** - 关键词分类器
- **`userInterestAnalyzer.js`** - 用户兴趣分析器
- **`keywordEmotionLinker.js`** - 关键词情感关联模块
- **`keywords.js`** - HanLP关键词提取模块

## 主要流程

### 1. 情感分析流程
```
用户文本 → 参数验证 → AI模型调用 → JSON解析 → 情感分析结果 → 数据库存储（可选）
```

### 2. 关键词提取流程
```
用户文本 → 参数验证 → AI模型调用 → 关键词提取 → 权重计算 → 返回结果
```

### 3. 用户兴趣分析流程
```
关键词数组 → 分类处理 → 权重计算 → 关注点提取 → 情感关联 → 兴趣分析结果
```

### 4. 每日报告生成流程
```
用户ID → 查询情绪记录 → 情感统计分析 → AI生成报告内容 → 报告数据存储 → 返回结果
```

## 数据流向

### 输入数据
- 用户文本内容
- 历史聊天记录（用于上下文分析）
- 用户ID（用于数据存储）
- 角色ID和聊天ID（用于关联）
- AI模型类型选择

### 处理过程
1. **参数验证**：检查必要参数和格式
2. **AI模型调用**：根据选择的模型调用相应API
3. **结果解析**：解析AI返回的JSON数据
4. **数据加工**：标准化处理和权重计算
5. **关联分析**：关键词与情感关联
6. **数据存储**：将结果保存到数据库

### 输出数据
- 情感分析结果（包含多种情感指标）
- 关键词列表（带权重和分类）
- 用户兴趣分析结果
- 每日报告内容

## 涉及的数据库集合

### 1. emotionRecords（情感记录表）
```javascript
{
  _id: "记录ID",
  userId: "用户ID",
  analysis: {
    // 情感分析结果
    type: "主要情感类型",
    intensity: 0.8,
    valence: 0.5,
    arousal: 0.6,
    trend: "上升",
    primary_emotion: "主要情感",
    secondary_emotions: ["次要情感1", "次要情感2"],
    attention_level: "高",
    radar_dimensions: {
      trust: 0.7,
      openness: 0.6,
      resistance: 0.3,
      stress: 0.4,
      control: 0.8
    },
    topic_keywords: ["关键词1", "关键词2"],
    emotion_triggers: ["触发词1", "触发词2"],
    suggestions: ["建议1", "建议2"],
    summary: "情感总结"
  },
  originalText: "原始文本",
  createTime: "创建时间",
  roleId: "角色ID（可选）",
  chatId: "聊天ID（可选）"
}
```

### 2. userInterests（用户兴趣表）
```javascript
{
  _id: "记录ID",
  userId: "用户ID",
  keywords: [
    {
      word: "关键词",
      weight: 1.5,
      category: "分类",
      emotionScore: 0.6,
      lastUpdated: "更新时间"
    }
  ],
  createTime: "创建时间",
  lastUpdated: "最后更新时间"
}
```

### 3. userReports（用户报告表）
```javascript
{
  _id: "报告ID",
  userId: "用户ID",
  date: "报告日期",
  emotionSummary: "情感总结",
  insights: ["洞察1", "洞察2", "洞察3"],
  suggestions: ["建议1", "建议2", "建议3"],
  fortune: {
    good: ["宜做事项1", "宜做事项2"],
    bad: ["忌做事项1", "忌做事项2"]
  },
  encouragement: "鼓励语",
  keywords: [
    {
      word: "关键词",
      weight: 2.0
    }
  ],
  emotionalVolatility: 65,
  primaryEmotion: "主要情感",
  emotionCount: 15,
  chartData: {
    emotionDistribution: [
      {
        type: "情感类型",
        count: 5,
        percentage: "33.3"
      }
    ],
    intensityTrend: [
      {
        timestamp: "时间戳",
        intensity: 0.8,
        type: "情感类型"
      }
    ],
    focusDistribution: [
      {
        category: "分类",
        weight: 3.0,
        percentage: "25.0"
      }
    ]
  },
  focusPoints: [
    {
      category: "关注点分类",
      percentage: "35.0",
      weight: 4.0,
      keywords: ["关键词1", "关键词2", "关键词3"]
    }
  ],
  categoryWeights: [
    {
      category: "分类",
      weight: 4.0,
      percentage: "35.0"
    }
  ],
  emotionalInsights: {
    positiveAssociations: [
      {
        word: "积极关键词",
        ratio: 0.8,
        count: 5
      }
    ],
    negativeAssociations: [
      {
        word: "消极关键词",
        ratio: 0.7,
        count: 4
      }
    ]
  },
  generatedAt: "生成时间",
  isRead: false
}
```

## API接口

### 支持的操作类型
1. **emotion** - 情感分析
2. **keywords** - 关键词提取
3. **user_interests** - 用户兴趣分析
4. **daily_report** - 每日报告生成
5. **keyword_categories** - 关键词分类
6. **cluster_analysis** - 聚类分析

### 支持的AI模型
- Google Gemini (gemini-2.5-flash-preview-04-17)
- 智谱AI (glm-4-flash)
- OpenAI (gpt-3.5-turbo, gpt-4)
- Crond API、CloseAI、Grok、Claude等

## 错误处理

- API调用失败自动重试（最多3次）
- 429错误使用指数退避策略
- API不可用时降级为本地模拟数据
- 完整的错误日志记录

## 性能特性

- 并行处理情感分析和关键词提取
- 异步保存记录不阻塞主流程
- 关键词分类支持批量处理
- 多模型负载均衡