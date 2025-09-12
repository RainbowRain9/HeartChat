# userInterests（用户兴趣表）

## 表说明
存储用户的兴趣关键词和分类信息，支持动态权重计算和兴趣分析，用于个性化推荐和内容匹配。

## 字段结构

```javascript
{
  _id: "记录ID",                    // string, 主键，自动生成
  userId: "用户ID",                  // string, 关联user_base表
  keywords: [                       // array, 关键词列表
    {
      word: "关键词",                // string, 关键词内容
      weight: 1.5,                   // number, 权重值
      category: "分类",              // string, 兴趣分类
      emotionScore: 0.6,            // number, 情感关联度 0-1
      lastUpdated: "更新时间"         // date, 最后更新时间
    }
  ],
  interests: [                      // array, 兴趣分类列表
    {
      category: "兴趣分类",          // string, 兴趣分类名称
      weight: 3.0,                  // number, 分类权重
      keywords: ["关键词1", "关键词2"] // array, 包含的关键词
    }
  ],
  createTime: "创建时间",            // date, 记录创建时间
  lastUpdated: "最后更新时间"        // date, 最后更新时间
}
```

## 索引建议
- **唯一索引**：userId
- **复合索引**：keywords.category + keywords.weight
- **复合索引**：lastUpdated
- **复合索引**：interests.category + interests.weight

## 关联关系
- **多对一**：userInterests.userId → user_base.user_id

## 使用场景
1. 个性化推荐
2. 内容匹配
3. 用户画像分析
4. 兴趣趋势追踪

## 数据示例
```javascript
{
  "_id": "interests_001",
  "userId": "1234567",
  "keywords": [
    {
      "word": "心理学",
      "weight": 2.5,
      "category": "学术",
      "emotionScore": 0.8,
      "lastUpdated": "2025-01-01T12:00:00Z"
    },
    {
      "word": "音乐",
      "weight": 2.0,
      "category": "娱乐",
      "emotionScore": 0.9,
      "lastUpdated": "2025-01-01T11:30:00Z"
    },
    {
      "word": "编程",
      "weight": 1.8,
      "category": "技术",
      "emotionScore": 0.7,
      "lastUpdated": "2025-01-01T10:00:00Z"
    }
  ],
  "interests": [
    {
      "category": "学术",
      "weight": 4.5,
      "keywords": ["心理学", "哲学", "文学"]
    },
    {
      "category": "娱乐",
      "weight": 3.8,
      "keywords": ["音乐", "电影", "阅读"]
    },
    {
      "category": "技术",
      "weight": 3.2,
      "keywords": ["编程", "人工智能", "数据科学"]
    }
  ],
  "createTime": "2025-01-01T10:00:00Z",
  "lastUpdated": "2025-01-01T12:00:00Z"
}
```

## 兴趣分类建议
- **学术**：心理学、哲学、文学、历史等
- **技术**：编程、人工智能、数据科学等
- **娱乐**：音乐、电影、游戏、阅读等
- **生活**：美食、旅行、运动、健康等
- **职业**：职业发展、技能提升、创业等
- **情感**：人际关系、情感管理、心理健康等

## 权重计算规则
1. **基础权重**：关键词出现频率
2. **情感加权**：emotionalScore影响权重
3. **时间衰减**：最近的关键词权重更高
4. **分类聚合**：同分类关键词权重叠加

## 更新机制
1. 从用户消息中提取关键词
2. 计算关键词权重和情感关联
3. 聚合到兴趣分类
4. 定期清理低权重关键词

## 注意事项
- 每个用户只有一个兴趣记录
- 关键词数量建议控制在100个以内
- 权重值需要定期重新计算
- 兴趣分类需要标准化处理