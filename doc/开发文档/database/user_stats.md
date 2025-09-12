# user_stats（用户统计表）

## 表说明
存储用户的活动统计数据，包括聊天次数、活跃天数、角色使用偏好等关键指标。

## 字段结构

```javascript
{
  _id: "记录ID",                    // string, 主键，自动生成
  stats_id: "统计ID",                // string, 统计记录唯一标识
  user_id: "用户ID",                 // string, 关联user_base表
  openid: "微信openid",             // string, 微信用户标识
  chat_count: 0,                    // number, 聊天次数总计
  solved_count: 0,                  // number, 解决问题数量
  rating_avg: 0.0,                  // number, 平均评分 0-5
  active_days: 1,                   // number, 活跃天数
  last_active: "最后活跃时间",        // date, 最后活跃时间
  total_messages: 0,                // number, 总消息数量
  user_messages: 0,                 // number, 用户消息数量
  ai_messages: 0,                   // number, AI消息数量
  emotion_records_count: 0,         // number, 情感记录数量
  
  // 角色使用偏好
  favorite_roles: [                 // array, 常用角色列表
    {
      role_id: "角色ID",             // string, 角色ID
      usage_count: 0,               // number, 使用次数
      last_used: "最后使用时间"       // date, 最后使用时间
    }
  ],
  
  created_at: "创建时间",            // date, 统计记录创建时间
  updated_at: "更新时间"             // date, 统计记录更新时间
}
```

## 索引建议
- **唯一索引**：user_id
- **单字段索引**：openid
- **复合索引**：chat_count + updated_at
- **复合索引**：active_days + updated_at
- **复合索引**：favorite_roles.role_id

## 关联关系
- **多对一**：user_stats.user_id → user_base.user_id
- **多对一**：favorite_roles.role_id → roles._id

## 使用场景
1. 用户活跃度分析
2. 功能使用统计
3. 个性化推荐
4. 用户行为分析

## 数据示例
```javascript
{
  "_id": "stats_001",
  "stats_id": "stats_1234567",
  "user_id": "1234567",
  "openid": "oxxxxxxxxxxxxxxxx",
  "chat_count": 15,
  "solved_count": 8,
  "rating_avg": 4.2,
  "active_days": 7,
  "last_active": "2025-01-01T12:00:00Z",
  "total_messages": 156,
  "user_messages": 78,
  "ai_messages": 78,
  "emotion_records_count": 23,
  "favorite_roles": [
    {
      "role_id": "role_001",
      "usage_count": 8,
      "last_used": "2025-01-01T12:00:00Z"
    },
    {
      "role_id": "role_002",
      "usage_count": 5,
      "last_used": "2024-12-30T15:30:00Z"
    }
  ],
  "created_at": "2025-01-01T10:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

## 统计指标说明

### 基础指标
- **chat_count**：用户发起的聊天会话总数
- **solved_count**：成功解决的问题数量
- **rating_avg**：用户对服务的平均评分
- **active_days**：用户活跃的天数（去重）

### 消息指标
- **total_messages**：用户发送和接收的消息总数
- **user_messages**：用户发送的消息数量
- **ai_messages**：AI回复的消息数量
- **emotion_records_count**：情感分析记录数量

### 偏好指标
- **favorite_roles**：用户常用的角色列表
- **usage_count**：每个角色的使用次数
- **last_used**：每个角色的最后使用时间

## 更新规则
1. 用户登录时更新active_days
2. 发送消息时更新相关计数
3. 聊天结束时更新chat_count
4. 评分时更新rating_avg
5. 使用角色时更新favorite_roles

## 注意事项
- active_days需要去重计算（每天只计一次）
- favorite_roles建议限制数量（如最多10个）
- 统计数据需要实时更新以保证准确性
- 历史统计数据建议定期归档