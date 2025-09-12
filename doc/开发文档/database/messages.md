# messages（消息表）

## 表说明
存储聊天会话中的所有消息记录，支持用户消息和AI回复，包含消息分段功能和发送状态跟踪。

## 字段结构

```javascript
{
  _id: "消息ID",                    // string, 主键，自动生成
  chatId: "聊天会话ID",              // string, 关联chats表
  roleId: "角色ID",                  // string, 关联roles表
  openId: "用户openid",             // string, 微信用户标识
  content: "消息内容",               // string, 消息文本内容
  sender_type: "user|ai",           // string, 发送者类型
  createTime: "创建时间",            // date, 消息创建时间
  timestamp: "时间戳",               // date, 消息时间戳（可选）
  status: "sent|sending|failed",    // string, 消息发送状态
  
  // 分段消息相关字段
  isSegment: false,                 // boolean, 是否为分段消息
  segmentIndex: 0,                  // number, 分段索引
  totalSegments: 1,                 // number, 总分段数
  originalMessageId: "原始消息ID"   // string, 原始完整消息ID
}
```

## 索引建议
- **复合索引**：chatId + createTime（升序）
- **复合索引**：openId + createTime（降序）
- **单字段索引**：sender_type
- **复合索引**：originalMessageId + segmentIndex

## 关联关系
- **多对一**：messages.chatId → chats._id
- **多对一**：messages.roleId → roles._id
- **一对多**：一个完整消息对应多个分段消息（通过originalMessageId关联）

## 使用场景
1. 聊天历史记录
2. 消息状态跟踪
3. 分段消息管理
4. 对话上下文构建

## 数据示例
```javascript
// 完整消息
{
  "_id": "msg_001",
  "chatId": "chat_001",
  "roleId": "role_001",
  "openId": "oxxxxxxxxxxxxxxxx",
  "content": "今天感觉怎么样？",
  "sender_type": "ai",
  "createTime": "2025-01-01T12:00:00Z",
  "timestamp": "2025-01-01T12:00:00Z",
  "status": "sent",
  "isSegment": false,
  "segmentIndex": 0,
  "totalSegments": 1,
  "originalMessageId": "msg_001"
}

// 分段消息
{
  "_id": "msg_002",
  "chatId": "chat_001",
  "roleId": "role_001",
  "openId": "oxxxxxxxxxxxxxxxx",
  "content": "这是第一段消息内容",
  "sender_type": "ai",
  "createTime": "2025-01-01T12:01:00Z",
  "status": "sent",
  "isSegment": true,
  "segmentIndex": 0,
  "totalSegments": 3,
  "originalMessageId": "msg_001_full"
}
```

## 分段消息逻辑
1. 长消息自动分段（最大150字符）
2. 保持语义完整性
3. 通过originalMessageId关联分段
4. segmentIndex从0开始编号

## 注意事项
- 分段消息的originalMessageId指向第一条消息的ID
- 消息删除时需要同时删除所有相关分段消息
- 建议对历史消息进行归档处理以提高性能