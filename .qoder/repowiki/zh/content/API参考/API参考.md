# API参考

<cite>
**本文档中引用的文件**  
- [analysis/index.js](file://cloudfunctions/analysis/index.js)
- [chat/index.js](file://cloudfunctions/chat/index.js)
- [emotion/index.js](file://cloudfunctions/emotion/index.js)
- [getEmotionRecords/index.js](file://cloudfunctions/getEmotionRecords/index.js)
- [getRoleInfo/index.js](file://cloudfunctions/getRoleInfo/index.js)
- [generateDailyReports/index.js](file://cloudfunctions/generateDailyReports/index.js)
- [getIflytekSttUrl/index.js](file://cloudfunctions/getIflytekSttUrl/index.js)
- [httpRequest/index.js](file://cloudfunctions/httpRequest/index.js)
</cite>

## 目录
1. [简介](#简介)
2. [情感分析API](#情感分析api)
3. [聊天功能API](#聊天功能api)
4. [情绪概览与历史API](#情绪概览与历史api)
5. [情绪记录查询API](#情绪记录查询api)
6. [角色信息查询API](#角色信息查询api)
7. [每日报告生成API](#每日报告生成api)
8. [语音识别URL生成API](#语音识别url生成api)
9. [HTTP请求代理API](#http请求代理api)
10. [安全与性能说明](#安全与性能说明)

## 简介
本API参考文档为HeartChat项目提供完整的云函数接口说明。所有接口均通过`cloud.callFunction`方式调用，采用RESTful风格设计，返回统一的JSON格式响应。每个API均需在用户登录态下使用，系统通过微信上下文自动获取用户身份。

## 情感分析API

提供文本情绪识别、关键词提取、词向量获取、聚类分析及用户兴趣分析等功能。

### 分析文本情感
接收文本输入并返回情绪标签、强度值及建议回复。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'analyzeEmotion',
    text: '今天心情很复杂，工作压力大但和朋友聚会很开心',
    history: [],
    saveRecord: true,
    roleId: 'role_001',
    chatId: 'chat_123',
    extractKeywords: true,
    linkKeywords: true,
    modelType: 'gemini'
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | 是 | 待分析的文本内容 |
| history | array | 否 | 对话历史记录 |
| saveRecord | boolean | 否 | 是否保存分析记录，默认false |
| roleId | string | 否 | 当前对话角色ID |
| chatId | string | 否 | 当前聊天会话ID |
| extractKeywords | boolean | 否 | 是否同时提取关键词，默认true |
| linkKeywords | boolean | 否 | 是否关联关键词与情绪，默认true |
| modelType | string | 否 | 使用的AI模型类型，可选'zhipu'或'gemini'，默认'gemini' |

**响应格式**
```json
{
  "success": true,
  "result": {
    "type": "mixed",
    "intensity": 0.75,
    "primary_emotion": "压力",
    "secondary_emotions": ["快乐", "疲惫"],
    "suggestions": ["尝试深呼吸放松", "与信任的人倾诉"]
  },
  "recordId": "record_456",
  "keywords": ["工作压力", "朋友聚会", "心情复杂"]
}
```

**错误码**
- `400`: 无效的文本参数
- `500`: 情感分析服务调用失败

**Section sources**
- [analysis/index.js](file://cloudfunctions/analysis/index.js#L100-L200)

### 提取文本关键词
从输入文本中提取核心关键词。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'extractKeywords',
    text: '最近睡眠质量下降，工作压力大，但喜欢阅读和运动',
    topK: 5,
    modelType: 'zhipu'
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | 是 | 输入文本 |
| topK | number | 否 | 返回关键词数量，默认10 |
| modelType | string | 否 | AI模型类型，'zhipu'或'gemini' |

**响应格式**
```json
{
  "success": true,
  "data": {
    "keywords": [
      {"word": "睡眠质量", "weight": 0.9},
      {"word": "工作压力", "weight": 0.85},
      {"word": "阅读", "weight": 0.7}
    ]
  }
}
```

**Section sources**
- [analysis/index.js](file://cloudfunctions/analysis/index.js#L201-L250)

### 获取词向量
获取指定词语的向量表示。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'getWordVectors',
    texts: ['压力', '焦虑', '放松']
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| texts | string/array | 是 | 单个词语或词语数组 |

**响应格式**
```json
{
  "success": true,
  "data": {
    "vectors": [
      [0.1, 0.8, -0.3, ...],
      [0.2, 0.9, -0.4, ...],
      [-0.1, 0.2, 0.7, ...]
    ],
    "words": ["压力", "焦虑", "放松"]
  }
}
```

**Section sources**
- [analysis/index.js](file://cloudfunctions/analysis/index.js#L251-L300)

### 聚类分析
对关键词进行聚类分析。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'clusterKeywords',
    text: '工作压力大 睡眠不好 情绪低落 学习新技能 提升自我',
    threshold: 0.7,
    minClusterSize: 2
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | 是 | 包含关键词的文本 |
| threshold | number | 否 | 相似度阈值，默认0.7 |
| minClusterSize | number | 否 | 最小聚类大小，默认2 |

**响应格式**
```json
{
  "success": true,
  "data": {
    "clusters": [
      {
        "keywords": ["工作压力", "情绪低落"],
        "centroid": "负面情绪",
        "similarity": 0.85
      }
    ]
  }
}
```

**Section sources**
- [analysis/index.js](file://cloudfunctions/analysis/index.js#L301-L350)

### 用户兴趣分析
分析用户对话中的兴趣点。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'analyzeUserInterests',
    messages: [
      {role: 'user', content: '最近工作很忙'},
      {role: 'assistant', content: '听起来压力很大'},
      {role: 'user', content: '是的，项目截止日期快到了'}
    ]
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| messages | array | 是 | 对话消息数组，包含role和content字段 |

**响应格式**
```json
{
  "success": true,
  "data": {
    "interests": ["工作压力", "时间管理", "项目管理"],
    "categories": {
      "职业发展": 0.8,
      "心理健康": 0.6
    }
  }
}
```

**Section sources**
- [analysis/index.js](file://cloudfunctions/analysis/index.js#L351-L400)

## 聊天功能API

提供聊天消息处理、历史记录获取和AI回复生成等核心功能。

### 保存聊天记录
将聊天数据保存到数据库。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'chat',
  data: {
    action: 'saveChatHistory',
    chatData: {
      roleId: 'role_001',
      userId: 'user_123',
      messageCount: 5,
      lastMessage: '今天过得怎么样？',
      emotionAnalysis: {
        type: 'neutral',
        intensity: 0.5
      }
    },
    messages: [
      {role: 'user', content: '你好'},
      {role: 'assistant', content: '你好！有什么我可以帮助你的吗？'}
    ]
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| chatData | object | 是 | 聊天会话元数据 |
| messages | array | 否 | 消息内容数组 |

**响应格式**
```json
{
  "success": true,
  "chatId": "chat_123",
  "isNewChat": true
}
```

**Section sources**
- [chat/index.js](file://cloudfunctions/chat/index.js#L400-L500)

### 获取聊天记录
根据用户ID和角色ID获取聊天历史。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'chat',
  data: {
    action: 'getChatHistory',
    userId: 'user_123',
    roleId: 'role_001'
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 否 | 用户ID，未提供时使用openid |
| roleId | string | 否 | 角色ID，用于过滤特定角色的聊天记录 |

**响应格式**
```json
{
  "success": true,
  "data": [
    {
      "_id": "chat_123",
      "roleId": "role_001",
      "messageCount": 5,
      "updateTime": "2025-05-01T10:00:00.000Z",
      "messages": [
        { "role": "user", "content": "你好" },
        { "role": "assistant", "content": "你好！有什么我可以帮助你的吗？" }
      ]
    }
  ]
}
```

**Section sources**
- [chat/index.js](file://cloudfunctions/chat/index.js#L501-L600)

### 生成AI回复
基于用户消息和角色设定生成智能回复。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'chat',
  data: {
    action: 'generateAIReply',
    message: '最近总是睡不着，很焦虑',
    history: [
      {role: 'user', content: '我最近压力很大'},
      {role: 'assistant', content: '能具体说说是什么让你感到压力吗？'}
    ],
    roleInfo: {
      name: '心理倾听者',
      prompt: '你是一位专业的心理咨询师...'
    },
    includeEmotionAnalysis: true,
    modelType: 'gemini',
    temperature: 0.7,
    max_tokens: 2048
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | string | 是 | 用户输入的消息 |
| history | array | 否 | 对话历史 |
| roleInfo | object | 是 | 角色信息，包含name和prompt |
| includeEmotionAnalysis | boolean | 否 | 是否包含情绪分析，默认false |
| modelType | string | 否 | AI模型类型，'zhipu'或'gemini' |
| temperature | number | 否 | 生成温度，控制创造性，默认0.7 |
| max_tokens | number | 否 | 最大生成token数，默认2048 |

**响应格式**
```json
{
  "success": true,
  "content": "听起来你正在经历睡眠困扰和焦虑情绪...",
  "segments": [
    "听起来你正在经历睡眠困扰和焦虑情绪...",
    "这确实会让人感到非常疲惫和不安。"
  ],
  "emotionAnalysis": {
    "type": "焦虑",
    "intensity": 0.8
  },
  "modelType": "gemini",
  "timestamp": 1746086400000
}
```

**Section sources**
- [chat/index.js](file://cloudfunctions/chat/index.js#L601-L700)

### 发送消息
发送消息并获取AI回复的完整流程。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'chat',
  data: {
    action: 'sendMessage',
    roleId: 'role_001',
    content: '今天心情很不好',
    systemPrompt: '用户是一位25岁的职场新人...',
    modelType: 'zhipu',
    modelParams: {
      temperature: 0.8,
      maxTokens: 1024
    },
    chatMemoryLength: 20
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roleId | string | 是 | 目标角色ID |
| content | string | 是 | 消息内容 |
| systemPrompt | string | 否 | 自定义系统提示词（用户画像） |
| modelType | string | 否 | AI模型类型 |
| modelParams | object | 否 | 模型参数配置 |
| chatMemoryLength | number | 否 | 对话记忆长度，默认20 |

**响应格式**
同`生成AI回复`接口

**Section sources**
- [chat/index.js](file://cloudfunctions/chat/index.js#L701-L800)

## 情绪概览与历史API

提供情绪数据的统计分析和可视化支持。

### 获取情绪概览
获取用户近期情绪分布概览。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'emotion',
  data: {
    action: 'getEmotionOverview',
    userId: 'user_123'
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 否 | 用户ID，未提供时使用openid |

**响应格式**
```json
{
  "success": true,
  "data": {
    "labels": ["压力", "疲惫", "平静"],
    "values": [8, 5, 3],
    "colors": ["#f56565", "#ffc107", "#48bb78"],
    "mainEmotion": "压力",
    "secondEmotion": "疲惫"
  }
}
```

**Section sources**
- [emotion/index.js](file://cloudfunctions/emotion/index.js#L10-L50)

### 获取情绪历史
获取指定时间段内的情绪变化历史。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'emotion',
  data: {
    action: 'getEmotionHistory',
    days: 30,
    limit: 100
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | number | 否 | 查询天数，默认30天 |
| limit | number | 否 | 结果数量限制，默认100 |

**响应格式**
```json
{
  "success": true,
  "data": {
    "dailyData": [
      {
        "date": "2025-04-01",
        "mainEmotion": "压力",
        "emotionValue": -90,
        "recordCount": 3
      }
    ],
    "chartData": {
      "dates": ["2025-04-01", "2025-04-02"],
      "values": [-90, -60],
      "emotions": ["压力", "焦虑"]
    }
  }
}
```

**Section sources**
- [emotion/index.js](file://cloudfunctions/emotion/index.js#L51-L100)

## 情绪记录查询API

根据用户ID和角色ID查询历史情绪记录。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'getEmotionRecords',
  data: {
    userId: 'user_123',
    roleId: 'role_001',
    limit: 20
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 用户ID |
| roleId | string | 否 | 角色ID，用于过滤特定角色的记录 |
| limit | number | 否 | 返回记录数量，默认20 |

**响应格式**
```json
{
  "success": true,
  "data": [
    {
      "userId": "user_123",
      "analysis": {
        "type": "压力",
        "intensity": 0.9
      },
      "createTime": "2025-05-01T10:00:00.000Z",
      "roleId": "role_001"
    }
  ]
}
```

**Section sources**
- [getEmotionRecords/index.js](file://cloudfunctions/getEmotionRecords/index.js#L1-L50)

## 角色信息查询API

根据角色ID获取角色详细信息。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'getRoleInfo',
  data: {
    roleId: 'role_001'
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roleId | string | 是 | 角色唯一标识符 |

**响应格式**
```json
{
  "success": true,
  "data": {
    "_id": "role_001",
    "name": "心理倾听者",
    "description": "专业的心理倾听与支持",
    "prompt": "你是一位温暖的心理倾听者...",
    "avatar": "cloud://path/to/avatar.jpg",
    "category": "心理支持"
  }
}
```

**Section sources**
- [getRoleInfo/index.js](file://cloudfunctions/getRoleInfo/index.js#L1-L20)

## 每日报告生成API

批量生成用户每日心情报告。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'generateDailyReports',
  data: {}
})
```

**请求参数**
无

**响应格式**
```json
{
  "success": true,
  "results": [
    {
      "userId": "user_123",
      "success": true,
      "reportId": "report_456"
    }
  ],
  "totalUsers": 15,
  "successCount": 14
}
```

**功能说明**
- 每日凌晨自动执行
- 为昨日有情感记录的活跃用户生成报告
- 支持订阅消息通知
- 包含情绪总结、洞察、建议和运势

**Section sources**
- [generateDailyReports/index.js](file://cloudfunctions/generateDailyReports/index.js#L1-L100)

## 语音识别URL生成API

生成讯飞语音听写服务的WebSocket连接URL。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'getIflytekSttUrl',
  data: {}
})
```

**请求参数**
无

**响应格式**
```json
{
  "success": true,
  "wssUrl": "wss://iat-api.xfyun.cn/v2/iat?authorization=...",
  "appid": "60f9a524"
}
```

**安全说明**
- API密钥通过环境变量配置
- 签名基于HMAC-SHA256算法
- 使用HTTPS/WSS安全传输

**Section sources**
- [getIflytekSttUrl/index.js](file://cloudfunctions/getIflytekSttUrl/index.js#L1-L30)

## HTTP请求代理API

提供安全的HTTP请求代理服务。

**调用方法**
```javascript
wx.cloud.callFunction({
  name: 'httpRequest',
  data: {
    url: 'https://api.example.com/data',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer token123'
    },
    timeout: 5000
  }
})
```

**请求参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | 是 | 目标URL |
| method | string | 否 | HTTP方法，默认GET |
| headers | object | 否 | 请求头 |
| body | string/object | 否 | 请求体 |
| timeout | number | 否 | 超时时间(毫秒)，默认30000 |

**响应格式**
```json
{
  "statusCode": 200,
  "headers": {"content-type": "application/json"},
  "body": {"data": "example"}
}
```

**Section sources**
- [httpRequest/index.js](file://cloudfunctions/httpRequest/index.js#L1-L30)

## 安全与性能说明

### 安全要求
所有API均需在用户登录态下使用，系统通过微信云开发的`cloud.getWXContext()`自动验证用户身份。敏感操作（如数据查询）均基于用户openid进行权限控制。

### 性能限制
- **调用频率**：单个用户每分钟最多调用20次
- **请求大小**：单次请求体大小不超过1MB
- **响应时间**：95%的请求在2秒内响应
- **超时设置**：云函数执行超时时间为5秒

### 最佳实践
1. 批量操作使用`Promise.all`并行调用
2. 长文本分析前进行内容摘要
3. 频繁访问的数据使用本地缓存
4. 错误处理中包含重试机制