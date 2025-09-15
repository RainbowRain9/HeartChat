# 情感分析API

<cite>
**本文档引用文件**  
- [index.js](file://cloudfunctions/analysis/index.js)
- [aiModelService.js](file://cloudfunctions/analysis/aiModelService.js)
- [emotion/index.js](file://cloudfunctions/emotion/index.js)
- [analysis.md](file://doc/开发文档/cloudfunctions/analysis.md)
- [emotion云函数使用文档.md](file://doc/使用文档/emotion云函数使用文档.md)
</cite>

## 目录
1. [简介](#简介)
2. [核心API接口](#核心api接口)
3. [analysis云函数详解](#analysis云函数详解)
4. [emotion云函数详解](#emotion云函数详解)
5. [AI模型服务编排](#ai模型服务编排)
6. [调用示例与响应样本](#调用示例与响应样本)
7. [算法准确性与性能特征](#算法准确性与性能特征)
8. [开发者调用优化建议](#开发者调用优化建议)
9. [错误处理与调试](#错误处理与调试)

## 简介

情感分析API是HeartChat系统的核心AI功能模块，旨在通过先进的AI模型对用户输入的文本进行多维度情感解析。该系统由两个主要云函数构成：`analysis` 和 `emotion`，分别负责原始文本的情感分析与关键词提取，以及用户情绪数据的统计与可视化。

`analysis` 云函数作为主分析引擎，利用智谱AI、Google Gemini等多模型协同工作，将原始文本转化为结构化的多维度情感评分。`emotion` 云函数则作为数据聚合服务，从数据库中提取并处理历史情感记录，为前端提供情绪概览和趋势分析。

本API设计遵循微服务架构原则，实现了分析逻辑与数据查询的分离，确保了系统的可扩展性和高性能。通过统一的AI模型服务层，系统能够灵活切换和负载均衡多个AI平台，为开发者提供稳定可靠的情感分析能力。

## 核心API接口

情感分析系统提供两个核心云函数接口，分别服务于实时分析和历史数据查询场景。

**analysis云函数** 是主分析接口，支持多种操作类型，包括情感分析、关键词提取、词向量获取、聚类分析和用户兴趣分析。它接收原始文本和上下文信息，通过AI模型进行深度分析，返回包含情绪类型、强度、关键词关联等丰富信息的JSON结构。

**emotion云函数** 是数据聚合接口，提供`getEmotionOverview`和`getEmotionHistory`两个操作。它不直接处理文本，而是从`emotionRecords`数据库集合中查询和统计已有的情感分析结果，生成用于图表展示的格式化数据。

这两个接口共同构成了一个完整的“分析-存储-展示”闭环，使得前端应用既能获取实时的情感洞察，又能追踪用户长期的情绪变化趋势。

**Section sources**
- [index.js](file://cloudfunctions/analysis/index.js#L1-L1117)
- [emotion/index.js](file://cloudfunctions/emotion/index.js#L1-L266)

## analysis云函数详解

`analysis` 云函数是情感分析系统的核心，其主要功能是接收用户输入的文本，调用AI模型进行综合分析，并返回结构化的多维度情感评分。

### 请求参数

该云函数通过`event`对象接收参数，主要参数如下：

- **`text`** (string, 必填): 待分析的原始文本内容。
- **`history`** (Array, 可选): 对话历史记录，用于提供上下文分析，格式为`{role: 'user'|'assistant', content: '文本'}`的数组。
- **`saveRecord`** (boolean, 可选): 是否将分析结果保存到数据库，默认为`false`。
- **`roleId`** 和 **`chatId`** (string, 可选): 用于关联角色和聊天会话的ID。
- **`extractKeywords`** (boolean, 可选): 是否同时提取关键词，默认为`true`。
- **`linkKeywords`** (boolean, 可选): 是否将提取的关键词与情感进行关联分析，默认为`true`。
- **`modelType`** (string, 可选): 指定使用的AI模型平台，可选值为`'zhipu'`（智谱AI）或`'gemini'`（Google Gemini），默认为`'gemini'`。

### 返回结构

`analysis` 云函数的返回值是一个JSON对象，其结构如下：

```json
{
  "success": true,
  "result": {
    "type": "主要情感类型",
    "intensity": 0.8,
    "keywords": ["关键词1", "关键词2"],
    "suggestions": ["建议1", "建议2"],
    "report": "情感总结",
    "originalText": "原始文本",
    "primary_emotion": "主要情感",
    "secondary_emotions": ["次要情感1", "次要情感2"],
    "valence": 0.5,
    "arousal": 0.6,
    "trend": "上升",
    "attention_level": "高",
    "radar_dimensions": {
      "trust": 0.7,
      "openness": 0.6,
      "resistance": 0.3,
      "stress": 0.4,
      "control": 0.8
    },
    "topic_keywords": ["主题关键词1", "主题关键词2"],
    "emotion_triggers": ["情感触发词1", "情感触发词2"],
    "summary": "情感状态总结"
  },
  "recordId": "数据库记录ID",
  "keywords": ["提取的关键词"]
}
```

其中，`result`字段包含了详细的分析结果。`type`和`primary_emotion`表示主要情感类型（如“焦虑”、“喜悦”等）。`intensity`表示情感强度（0.0-1.0）。`valence`表示情感极性（-1.0到1.0，负为负面，正为正面）。`arousal`表示情感唤醒水平（0.0-1.0）。`suggestions`和`summary`提供了基于分析结果的共情回应和总结。

### 内部处理流程

`analysis` 云函数的内部处理流程如下：

1.  **参数验证**: 首先验证`text`参数的有效性。
2.  **并行处理**: 使用`Promise.all`并行调用情感分析和关键词提取，以提高效率。
3.  **AI模型调用**: 通过`aiModelService`模块调用指定的AI模型（智谱AI或Gemini）进行分析。
4.  **异步存储**: 如果`saveRecord`为`true`，则异步将分析结果保存到`emotionRecords`数据库集合中，不阻塞主流程。
5.  **关键词关联**: 如果`linkKeywords`为`true`，则异步调用`keywordEmotionLinker`模块，将提取的关键词与情感进行关联分析，并更新`userInterests`集合。
6.  **结果返回**: 将所有结果整合并返回给调用方。

此流程设计确保了核心分析功能的高效性，同时将耗时的数据库操作异步化，避免了对响应时间的影响。

**Section sources**
- [index.js](file://cloudfunctions/analysis/index.js#L1-L1117)
- [analysis.md](file://doc/开发文档/cloudfunctions/analysis.md#L1-L230)

## emotion云函数详解

`emotion` 云函数是一个轻量级的数据聚合服务，专注于从数据库中查询和处理已有的情感分析记录，为前端提供用于可视化展示的格式化数据。

### 获取情绪概览 (getEmotionOverview)

此接口用于获取用户最近一周的情绪分布情况。

- **调用方式**: 通过设置`action: 'getEmotionOverview'`来调用。
- **参数**: 可选的`userId`，若不提供则使用当前登录用户的openid。
- **返回结构**:
  ```json
  {
    "success": true,
    "data": {
      "labels": ["快乐", "平静", "焦虑"],
      "values": [5, 3, 2],
      "colors": ["#38b2ac", "#48bb78", "#ed64a6"],
      "mainEmotion": "快乐",
      "secondEmotion": "平静",
      "emotionArray": [
        { "emotion": "快乐", "count": 5, "percentage": 50.0 },
        { "emotion": "平静", "count": 3, "percentage": 30.0 }
      ]
    }
  }
  ```
  该数据可直接用于绘制情绪分布饼图或环形图。

### 获取情绪历史 (getEmotionHistory)

此接口用于获取用户指定时间范围内的情绪变化趋势。

- **调用方式**: 通过设置`action: 'getEmotionHistory'`来调用。
- **参数**: 
  - `days` (number, 可选): 获取最近多少天的数据，默认30天。
  - `limit` (number, 可选): 最多返回的记录数，默认100条。
- **返回结构**:
  ```json
  {
    "success": true,
    "data": {
      "dailyData": [
        { "date": "2024-04-10", "mainEmotion": "快乐", "emotionValue": 100, "recordCount": 3 },
        { "date": "2024-04-11", "mainEmotion": "平静", "emotionValue": 60, "recordCount": 2 }
      ],
      "chartData": {
        "dates": ["2024-04-10", "2024-04-11"],
        "values": [100, 60],
        "emotions": ["快乐", "平静"]
      }
    }
  }
  ```
  `emotionValue`是根据情绪类型映射到-100到100范围内的数值，便于绘制折线图。

### 实现原理

`emotion` 云函数的实现原理如下：

1.  **数据查询**: 根据`userId`和时间范围从`emotionRecords`集合中查询记录。
2.  **数据处理**:
    - 对于`getEmotionOverview`，统计各情绪类型的出现次数，并计算次要情绪的权重（0.5）。
    - 对于`getEmotionHistory`，按日期分组记录，并确定每日的主要情绪。
3.  **数值映射**: 将情绪类型（如“快乐”、“焦虑”）根据预设的映射表转换为数值（如100, -60），形成连续的情绪趋势。
4.  **格式化输出**: 将处理后的数据组织成前端图表库（如ECharts）所需的格式。

**Section sources**
- [emotion/index.js](file://cloudfunctions/emotion/index.js#L1-L266)
- [emotion云函数使用文档.md](file://doc/使用文档/emotion云函数使用文档.md#L1-L268)

## AI模型服务编排

`analysis` 云函数的核心能力来源于其内部的`aiModelService`模块，该模块实现了对多个AI模型平台的统一调用和智能编排。

### 统一AI模型服务 (aiModelService.js)

`aiModelService.js` 是一个关键的协调者，它抽象了不同AI平台的API差异，为上层业务逻辑提供统一的调用接口。其主要功能包括：

- **多平台支持**: 通过`MODEL_PLATFORMS`常量定义了智谱AI、Google Gemini、OpenAI、Claude等多个平台的配置，包括API地址、认证方式、默认模型等。
- **统一接口**: 提供了`analyzeEmotion`、`extractKeywords`等标准化函数，无论底层使用哪个平台，上层调用方式都保持一致。
- **智能路由**: 根据`modelType`参数，自动选择并调用相应的AI平台。例如，当`modelType='gemini'`时，会调用Gemini的API；当`modelType='zhipu'`时，则调用智谱AI的API。
- **错误处理与重试**: 实现了完善的错误处理机制，对429（请求过多）等错误采用指数退避策略进行自动重试，提高了服务的稳定性。

### 内部协调逻辑

`aiModelService`模块通过以下方式协调多个模型进行综合判断：

1.  **模型选择**: 开发者或系统可以根据需求、成本、性能等因素，通过`modelType`参数指定使用哪个模型。这使得系统具备了灵活的模型切换能力。
2.  **并行处理**: 在`analysis`云函数中，情感分析和关键词提取是并行执行的。这意味着可以同时利用不同模型的优势，例如用Gemini进行情感分析，用智谱AI进行关键词提取，从而获得更全面的分析结果。
3.  **结果标准化**: 不同AI模型返回的JSON格式可能不同。`aiModelService`在解析响应后，会将结果映射到一个统一的、标准化的内部结构，确保上层应用接收到的数据格式一致。
4.  **降级与容错**: 当某个AI平台不可用时，系统可以快速切换到备用平台，保证了服务的可用性。

这种编排逻辑使得情感分析系统不仅功能强大，而且具备了高可用性和可维护性。

**Section sources**
- [aiModelService.js](file://cloudfunctions/analysis/aiModelService.js#L1-L663)
- [analysis.md](file://doc/开发文档/cloudfunctions/analysis.md#L1-L230)

## 调用示例与响应样本

### analysis云函数调用示例

```javascript
// 调用analysis云函数进行情感分析
const result = await wx.cloud.callFunction({
  name: 'analysis',
  data: {
    action: 'analyzeEmotion',
    text: '最近工作压力好大，感觉快要崩溃了，每天都好累。',
    history: [
      { role: 'user', content: '我今天感觉不太开心。' },
      { role: 'assistant', content: '听起来你最近遇到一些困难，能和我说说吗？' }
    ],
    saveRecord: true,
    modelType: 'gemini'
  }
});
```

### analysis云函数响应样本

```json
{
  "success": true,
  "result": {
    "type": "压力",
    "intensity": 0.9,
    "valence": -0.8,
    "arousal": 0.7,
    "primary_emotion": "压力",
    "secondary_emotions": ["疲惫", "焦虑"],
    "suggestions": [
      "我理解你现在的感受，工作压力确实会让人喘不过气。",
      "尝试进行5分钟的深呼吸练习，可能会帮助你稍微放松一下。",
      "和信任的朋友或同事聊聊你的困扰，分享本身就是一种释放。"
    ],
    "summary": "用户表达了强烈的工作压力和疲惫感，情绪处于高唤醒的负面状态，需要共情和支持。"
  },
  "recordId": "emr_123456789",
  "keywords": ["工作压力", "崩溃", "累"]
}
```

### emotion云函数调用示例

```javascript
// 调用emotion云函数获取情绪历史
const historyResult = await wx.cloud.callFunction({
  name: 'emotion',
  data: {
    action: 'getEmotionHistory',
    userId: 'user_123',
    days: 7
  }
});
```

### emotion云函数响应样本

```json
{
  "success": true,
  "data": {
    "dailyData": [
      { "date": "2024-05-01", "mainEmotion": "压力", "emotionValue": -90, "recordCount": 4 },
      { "date": "2024-05-02", "mainEmotion": "焦虑", "emotionValue": -60, "recordCount": 3 },
      { "date": "2024-05-03", "mainEmotion": "平静", "emotionValue": 60, "recordCount": 2 }
    ],
    "chartData": {
      "dates": ["2024-05-01", "2024-05-02", "2024-05-03"],
      "values": [-90, -60, 60],
      "emotions": ["压力", "焦虑", "平静"]
    }
  }
}
```

## 算法准确性与性能特征

### 准确性考量

情感分析的准确性主要依赖于以下几个方面：

1.  **AI模型能力**: 系统集成了Gemini、GPT-4等业界领先的大型语言模型，这些模型在情感理解方面具有强大的能力。
2.  **上下文感知**: 通过`history`参数，模型能够理解对话的上下文，避免了对孤立语句的误判。例如，一句“我恨你”在争吵语境下是愤怒，而在玩笑语境下可能并非如此。
3.  **提示词工程 (Prompt Engineering)**: `aiModelService`中精心设计的系统提示词（System Prompt）明确要求模型以JSON格式返回包含`primary_emotion`、`intensity`、`valence`等多维度指标的结果，引导模型进行更全面和结构化的分析。
4.  **多模型验证**: 系统支持切换不同模型，开发者可以通过对比不同模型的分析结果来评估其准确性。

### 性能特征

该系统在设计上充分考虑了性能优化：

- **并行处理**: `analysis`云函数中，情感分析和关键词提取是并行执行的，显著缩短了总响应时间。
- **异步操作**: 数据库存储（`saveRecord`）和关键词关联（`linkKeywords`）都是异步执行的，不会阻塞主分析流程，保证了核心API的快速响应。
- **高效查询**: `emotion`云函数使用数据库的`orderBy`和`limit`操作，避免了全表扫描，确保了历史数据查询的效率。
- **缓存友好**: `emotion`云函数的查询结果非常适合进行客户端或服务端缓存，可以有效减少对数据库的重复查询。

## 开发者调用优化建议

为了获得最佳的性能和用户体验，开发者在调用情感分析API时应遵循以下建议：

1.  **合理使用上下文**: 在调用`analysis`时，提供适量的`history`（建议最近3-5条），可以帮助AI模型更准确地理解用户情绪，但过多的历史记录会增加API调用的开销。
2.  **按需调用**: `saveRecord`和`linkKeywords`功能会触发数据库操作，仅在需要持久化数据时才启用。对于实时分析预览等场景，可以将其设为`false`以获得更快的响应。
3.  **选择合适的模型**: `gemini`模型响应速度快，适合实时交互；`zhipu`模型在中文理解上可能有优势。开发者应根据实际需求和成本进行选择。
4.  **缓存emotion数据**: `emotion`云函数的返回数据变化频率较低，建议在小程序端进行缓存（例如使用`wx.setStorageSync`），避免每次页面显示都重新调用，以提升用户体验和降低服务器负载。
5.  **错误处理**: 在调用云函数时，务必使用`try-catch`捕获异常，并为用户提供友好的错误提示，例如“情感分析服务暂时不可用，请稍后再试”。

## 错误处理与调试

系统内置了完善的错误处理机制：

- **参数验证**: 对`text`等关键参数进行严格验证，返回清晰的错误信息（如“无效的文本参数”）。
- **API调用重试**: `aiModelService`对429等网络错误实现了自动重试，提高了服务的健壮性。
- **日志记录**: 在开发环境（`isDev = true`）下，系统会输出详细的日志，包括调用的模型、请求体、响应等，便于开发者调试。

常见的错误及解决方法：
- **`情感分析服务调用失败`**: 检查网络连接，确认AI平台的API密钥配置正确。
- **`无效的文本参数`**: 确保传入的`text`是有效的非空字符串。
- **`获取情绪概览失败`**: 检查`userId`是否正确，确认`emotionRecords`集合中存在对应用户的数据。