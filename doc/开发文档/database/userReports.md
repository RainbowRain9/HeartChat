# userReports（用户报告表）

## 表说明
存储用户每日心情分析报告，包含情感统计、洞察分析、建议指导和图表数据等完整报告信息。

## 字段结构

```javascript
{
  _id: "报告ID",                    // string, 主键，自动生成
  userId: "用户ID",                  // string, 关联user_base表
  date: "报告日期",                  // string, 报告日期 YYYY-MM-DD
  emotionSummary: "情感总结",        // string, 整体情感状态总结
  insights: ["洞察1", "洞察2", "洞察3"], // array, 情感洞察分析
  suggestions: ["建议1", "建议2", "建议3"], // array, 改善建议
  
  // 运势分析
  fortune: {                        // object, 今日运势
    good: ["宜做事项1", "宜做事项2"], // array, 适宜做的事情
    bad: ["忌做事项1", "忌做事项2"]   // array, 不适宜做的事情
  },
  
  encouragement: "鼓励语",          // string, 鼓励性话语
  emotionalVolatility: 65,         // number, 情绪波动指数 0-100
  primaryEmotion: "主要情感",        // string, 当日主要情感
  emotionCount: 15,                // number, 情感记录数量
  
  // 关键词分析
  keywords: [                       // array, 重要关键词列表
    {
      word: "关键词",                // string, 关键词内容
      weight: 2.0                   // number, 权重值
    }
  ],
  
  // 图表数据
  chartData: {                      // object, 可视化图表数据
    emotionDistribution: [          // array, 情感分布数据
      {
        type: "情感类型",            // string, 情感类型
        count: 5,                   // number, 出现次数
        percentage: "33.3"           // string, 百分比
      }
    ],
    intensityTrend: [                // array, 情感强度趋势
      {
        timestamp: "时间戳",          // string, 时间点
        intensity: 0.8,              // number, 情感强度
        type: "情感类型"              // string, 情感类型
      }
    ],
    focusDistribution: [             // array, 关注点分布
      {
        category: "分类",            // string, 关注点分类
        weight: 3.0,                // number, 权重
        percentage: "25.0"           // string, 百分比
      }
    ]
  },
  
  // 关注点分析
  focusPoints: [                     // array, 主要关注点
    {
      category: "关注点分类",        // string, 关注点分类
      percentage: "35.0",            // string, 百分比
      weight: 4.0,                   // number, 权重
      keywords: ["关键词1", "关键词2", "关键词3"] // array, 相关关键词
    }
  ],
  
  // 分类权重
  categoryWeights: [                // array, 分类权重统计
    {
      category: "分类",              // string, 分类名称
      weight: 4.0,                  // number, 权重值
      percentage: "35.0"             // string, 百分比
    }
  ],
  
  // 情感关联分析
  emotionalInsights: {              // object, 情感洞察
    positiveAssociations: [          // array, 积极关联
      {
        word: "积极关键词",          // string, 积极词汇
        ratio: 0.8,                  // number, 关联强度 0-1
        count: 5                     // number, 出现次数
      }
    ],
    negativeAssociations: [          // array, 消极关联
      {
        word: "消极关键词",          // string, 消极词汇
        ratio: 0.7,                  // number, 关联强度 0-1
        count: 4                     // number, 出现次数
      }
    ]
  },
  
  generatedAt: "生成时间",          // date, 报告生成时间
  isRead: false                     // boolean, 是否已读
}
```

## 索引建议
- **复合唯一索引**：userId + date
- **复合索引**：userId + generatedAt（降序）
- **单字段索引**：date
- **单字段索引**：isRead
- **复合索引**：primaryEmotion + date

## 关联关系
- **多对一**：userReports.userId → user_base.user_id

## 使用场景
1. 每日报告推送
2. 情感趋势分析
3. 个性化建议
4. 数据可视化

## 数据示例
```javascript
{
  "_id": "report_001",
  "userId": "1234567",
  "date": "2025-01-01",
  "emotionSummary": "今日情绪整体较为稳定，下午时段出现短暂焦虑，但整体状态良好",
  "insights": [
    "工作压力是主要焦虑来源",
    "社交活动对情绪有积极影响",
    "需要更好的时间管理"
  ],
  "suggestions": [
    "尝试工作间隙进行深呼吸练习",
    "增加与朋友的交流时间",
    "制定合理的工作计划"
  ],
  "fortune": {
    "good": ["进行创造性工作", "与朋友聚会"],
    "bad": ["做重要决定", "处理复杂事务"]
  },
  "encouragement": "你已经做得很好了，继续保持积极的心态！",
  "emotionalVolatility": 65,
  "primaryEmotion": "平静",
  "emotionCount": 15,
  "keywords": [
    {"word": "工作", "weight": 3.5},
    {"word": "朋友", "weight": 2.8}
  ],
  "chartData": {
    "emotionDistribution": [
      {"type": "平静", "count": 8, "percentage": "53.3"},
      {"type": "焦虑", "count": 4, "percentage": "26.7"},
      {"type": "喜悦", "count": 3, "percentage": "20.0"}
    ],
    "intensityTrend": [
      {"timestamp": "09:00", "intensity": 0.6, "type": "平静"},
      {"timestamp": "14:00", "intensity": 0.8, "type": "焦虑"}
    ],
    "focusDistribution": [
      {"category": "工作", "weight": 4.2, "percentage": "45.0"},
      {"category": "社交", "weight": 3.1, "percentage": "33.0"}
    ]
  },
  "generatedAt": "2025-01-02T00:05:00Z",
  "isRead": false
}
```

## 报告生成规则
1. 每日自动生成前一天的报告
2. 基于当天的emotionRecords数据
3. AI生成洞察和建议
4. 支持手动重新生成

## 注意事项
- 每个用户每天只能有一个报告
- 报告生成需要足够的情感记录数据
- 图表数据需要标准化格式
- 建议定期归档历史报告