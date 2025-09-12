# chats（聊天会话表）

## 表说明
存储用户与AI角色的聊天会话信息，包括会话基本信息、最后消息内容和统计信息。

## 字段结构

```javascript
{
  _id: "会话ID",                    // string, 主键，自动生成
  roleId: "角色ID",                  // string, 关联roles表
  roleName: "角色名称",              // string, 角色名称冗余字段
  openId: "用户openid",             // string, 微信用户标识
  userId: "用户ID",                 // string, 用户ID（可选，关联user_base表）
  messageCount: 0,                  // number, 消息总数
  lastMessage: "最后一条消息",        // string, 最后消息内容
  emotionAnalysis: {                // object, 情感分析结果
    type: "主要情感类型",            // string, 如：喜悦、悲伤、愤怒等
    intensity: 0.5,                  // number, 情感强度 0-1
    suggestions: ["建议1", "建议2"]  // array, 情感建议
  },
  last_message_time: "最后消息时间",  // date, 最后消息时间戳
  createTime: "创建时间",            // date, 会话创建时间
  updateTime: "更新时间"             // date, 会话更新时间
}
```

## 索引建议
- **复合索引**：openId + roleId + updateTime（降序）
- **单字段索引**：userId
- **单字段索引**：createTime

## 关联关系
- **一对多**：一个chats记录对应多个messages记录
- **多对一**：chats.roleId → roles._id
- **多对一**：chats.userId → user_base.user_id

## 使用场景
1. 聊天会话管理
2. 会话列表展示
3. 最后消息预览
4. 会话统计信息

## 数据示例
```javascript
{
  "_id": "chat_001",
  "roleId": "role_001",
  "roleName": "心理咨询师",
  "openId": "oxxxxxxxxxxxxxxxx",
  "userId": "1234567",
  "messageCount": 25,
  "lastMessage": "今天感觉怎么样？",
  "emotionAnalysis": {
    "type": "平静",
    "intensity": 0.6,
    "suggestions": ["保持积极心态"]
  },
  "last_message_time": "2025-01-01T12:00:00Z",
  "createTime": "2025-01-01T10:00:00Z",
  "updateTime": "2025-01-01T12:00:00Z"
}
```

## 注意事项
- messageCount需要实时更新
- emotionAnalysis字段由analysis云函数更新
- 建议定期清理长期不活跃的会话