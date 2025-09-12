# emotionRecords（情感记录表）

## 表说明
存储用户的情感分析记录，包含详细的情感类型、强度、维度分析以及相关的关键词和触发因素。

## 字段结构

```javascript
{
  _id: "记录ID",                    // string, 主键，自动生成
  userId: "用户ID",                  // string, 关联user_base表
  analysis: {                       // object, 情感分析结果
    // 基础情感信息
    type: "主要情感类型",            // string, 如：喜悦、悲伤、愤怒等
    intensity: 0.8,                  // number, 情感强度 0-1
    valence: 0.5,                    // number, 情感效价 -1到1
    arousal: 0.6,                    // number, 情感唤醒度 0-1
    trend: "上升",                   // string, 情感趋势：上升/下降/稳定
    
    // 详细情感分析
    primary_emotion: "主要情感",      // string, 主要情感类型
    secondary_emotions: ["次要情感1", "次要情感2"], // array, 次要情感列表
    attention_level: "高",           // string, 注意力水平：高/中/低
    
    // 雷达图维度
    radar_dimensions: {              // object, 情感维度雷达图
      trust: 0.7,                   // number, 信任度 0-1
      openness: 0.6,                // number, 开放度 0-1
      resistance: 0.3,              // number, 抵抗度 0-1
      stress: 0.4,                  // number, 压力度 0-1
      control: 0.8                  // number, 控制度 0-1
    },
    
    // 关键词和触发因素
    topic_keywords: ["关键词1", "关键词2"],       // array, 话题关键词
    emotion_triggers: ["触发词1", "触发词2"],   // array, 情感触发词
    suggestions: ["建议1", "建议2"],              // array, 改善建议
    summary: "情感总结"                            // string, 情感状态总结
  },
  originalText: "原始文本",          // string, 原始分析文本
  createTime: "创建时间",            // date, 记录创建时间
  roleId: "角色ID",                  // string, 关联角色（可选）
  chatId: "聊天ID"                   // string, 关联聊天会话（可选）
}
```

## 索引建议
- **复合索引**：userId + createTime（降序）
- **单字段索引**：analysis.type
- **复合索引**：roleId + createTime
- **复合索引**：chatId + createTime

## 关联关系
- **多对一**：emotionRecords.userId → user_base.user_id
- **多对一**：emotionRecords.roleId → roles._id
- **多对一**：emotionRecords.chatId → chats._id

## 使用场景
1. 情感历史追踪
2. 情感统计分析
3. 个性化报告生成
4. 心理健康监控

## 数据示例
```javascript
{
  "_id": "emotion_001",
  "userId": "1234567",
  "analysis": {
    "type": "喜悦",
    "intensity": 0.8,
    "valence": 0.9,
    "arousal": 0.7,
    "trend": "上升",
    "primary_emotion": "喜悦",
    "secondary_emotions": ["兴奋", "满足"],
    "attention_level": "高",
    "radar_dimensions": {
      "trust": 0.8,
      "openness": 0.7,
      "resistance": 0.2,
      "stress": 0.3,
      "control": 0.9
    },
    "topic_keywords": ["成功", "庆祝", "快乐"],
    "emotion_triggers": ["好消息", "成就"],
    "suggestions": ["继续保持积极心态", "分享喜悦给朋友"],
    "summary": "用户当前情绪非常积极，表现出明显的喜悦和兴奋"
  },
  "originalText": "今天我收到了工作上的好消息，感觉特别开心！",
  "createTime": "2025-01-01T12:00:00Z",
  "roleId": "role_001",
  "chatId": "chat_001"
}
```

## 情感类型枚举
**积极情感**：喜悦、满足、平静、期待、惊讶
**消极情感**：担忧、疲惫、焦虑、悲伤、压力、愤怒、恐惧
**中性情感**：平静、未知

## 维度说明
- **trust**：信任度 - 对他人的信任程度
- **openness**：开放度 - 接受新事物的程度
- **resistance**：抵抗度 - 对变化的抵抗程度
- **stress**：压力度 - 感受到的压力程度
- **control**：控制度 - 对局面的控制感

## 注意事项
- 情感分析由analysis云函数自动生成
- 建议定期归档历史记录以提高查询性能
- 情感数据涉及用户隐私，需要严格保护