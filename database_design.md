# 情感树洞数据库设计

## 概述

本文档描述了情感树洞小程序的数据库设计。数据库使用云开发的云数据库（MongoDB），包含以下集合：

1. `users` - 用户信息
2. `roles` - 角色信息
3. `chats` - 聊天记录
4. `messages` - 消息详情
5. `emotionRecords` - 情感分析记录
6. `roleUsage` - 角色使用统计

## 集合详情

### 1. users 集合

存储用户基本信息。

```javascript
{
  _id: "string", // 系统自动生成的唯一ID
  openId: "string", // 微信用户的openId
  userId: "string", // 自定义用户ID（可选）
  nickName: "string", // 用户昵称
  avatarUrl: "string", // 用户头像URL
  gender: number, // 性别：0-未知，1-男，2-女
  country: "string", // 国家
  province: "string", // 省份
  city: "string", // 城市
  language: "string", // 语言
  isVIP: boolean, // 是否为VIP用户
  vipExpireDate: Date, // VIP过期时间
  registrationDate: Date, // 注册时间
  lastLoginDate: Date, // 最后登录时间
  settings: { // 用户设置
    darkMode: boolean, // 是否启用暗黑模式
    notificationEnabled: boolean, // 是否启用通知
    language: "string" // 语言设置
  },
  status: number, // 用户状态：0-禁用，1-正常
  createTime: Date, // 创建时间
  updateTime: Date // 更新时间
}
```

### 2. roles 集合

存储角色信息，包括系统预设角色和用户自定义角色。

```javascript
{
  _id: "string", // 系统自动生成的唯一ID
  role_name: "string", // 角色名称
  relationship: "string", // 关系类型：朋友、父母、恋人等
  avatar_url: "string", // 角色头像URL
  role_desc: "string", // 角色描述
  style: "string", // 性格风格
  speaking_style: "string", // 说话风格
  background: "string", // 背景故事
  taboo: "string", // 禁忌话题
  system_prompt: "string", // 系统提示词
  category: "string", // 分类：system-系统预设，custom-用户自定义
  user_id: "string", // 创建者ID（系统角色为null）
  isPublic: boolean, // 是否公开
  status: number, // 状态：0-禁用，1-正常
  createTime: Date, // 创建时间
  updateTime: Date // 更新时间
}
```

### 3. chats 集合

存储聊天会话信息，每个会话包含多条消息的引用。

```javascript
{
  _id: "string", // 系统自动生成的唯一ID
  roleId: "string", // 角色ID
  roleName: "string", // 角色名称（冗余存储，便于查询）
  userId: "string", // 用户ID
  openId: "string", // 用户openId
  userInfo: { // 用户信息（冗余存储部分信息）
    userId: "string",
    nickName: "string",
    avatarUrl: "string"
  },
  title: "string", // 会话标题（可自动生成或用户自定义）
  messageCount: number, // 消息数量
  lastMessage: "string", // 最后一条消息内容（预览用）
  emotionAnalysis: { // 情感分析结果
    type: "string", // 情感类型：happy, sad, angry, anxious, neutral等
    intensity: number, // 情感强度：0.0-1.0
    suggestions: ["string"] // 建议列表
  },
  isArchived: boolean, // 是否归档
  isPinned: boolean, // 是否置顶
  tags: ["string"], // 标签列表
  createTime: Date, // 创建时间
  updateTime: Date // 更新时间
}
```

### 4. messages 集合

存储聊天消息详情。

```javascript
{
  _id: "string", // 系统自动生成的唯一ID
  chatId: "string", // 所属聊天会话ID
  roleId: "string", // 角色ID
  userId: "string", // 用户ID
  type: "string", // 消息类型：user-用户消息，bot-机器人消息
  content: "string", // 消息内容
  contentType: "string", // 内容类型：text-文本，image-图片，audio-语音
  mediaUrl: "string", // 媒体文件URL（如果有）
  emotionTags: ["string"], // 情感标签
  isRead: boolean, // 是否已读
  timestamp: Date, // 消息时间戳
  createTime: Date // 创建时间
}
```

### 5. emotionRecords 集合

存储情感分析记录，用于情感趋势分析和可视化。

```javascript
{
  _id: "string", // 系统自动生成的唯一ID
  userId: "string", // 用户ID
  roleId: "string", // 角色ID
  roleName: "string", // 角色名称
  chatId: "string", // 聊天会话ID
  messageId: "string", // 触发分析的消息ID
  analysis: { // 情感分析结果
    type: "string", // 情感类型
    intensity: number, // 情感强度
    keywords: ["string"], // 关键词
    suggestions: ["string"] // 建议
  },
  userFeedback: { // 用户反馈
    isAccurate: boolean, // 分析是否准确
    userSelectedEmotion: "string", // 用户选择的情感类型
    comment: "string" // 用户评论
  },
  createTime: Date // 创建时间
}
```

### 6. roleUsage 集合

存储角色使用统计信息。

```javascript
{
  _id: "string", // 系统自动生成的唯一ID
  roleId: "string", // 角色ID
  userId: "string", // 用户ID
  useCount: number, // 使用次数
  totalDuration: number, // 总使用时长（毫秒）
  sessionCount: number, // 会话次数
  averageSessionDuration: number, // 平均会话时长
  useTime: Date, // 使用时间点
  lastUseTime: Date, // 最后使用时间
  createTime: Date, // 创建时间
  updateTime: Date // 更新时间
}
```

## 索引设计

为提高查询效率，建议创建以下索引：

1. `users` 集合：
   - `openId`: 唯一索引
   - `userId`: 唯一索引

2. `roles` 集合：
   - `user_id`: 普通索引
   - `category`: 普通索引
   - `status`: 普通索引

3. `chats` 集合：
   - `userId`: 普通索引
   - `roleId`: 普通索引
   - `userId_roleId`: 复合索引
   - `updateTime`: 普通索引（用于排序）

4. `messages` 集合：
   - `chatId`: 普通索引
   - `userId`: 普通索引
   - `roleId`: 普通索引
   - `timestamp`: 普通索引（用于排序）

5. `emotionRecords` 集合：
   - `userId`: 普通索引
   - `chatId`: 普通索引
   - `createTime`: 普通索引（用于时间序列分析）

6. `roleUsage` 集合：
   - `roleId_userId`: 复合索引
   - `lastUseTime`: 普通索引（用于排序）

## 数据关系

1. `users` 与 `roles`：一对多关系，一个用户可以创建多个自定义角色
2. `users` 与 `chats`：一对多关系，一个用户可以有多个聊天会话
3. `roles` 与 `chats`：一对多关系，一个角色可以参与多个聊天会话
4. `chats` 与 `messages`：一对多关系，一个聊天会话包含多条消息
5. `users` 与 `emotionRecords`：一对多关系，一个用户可以有多条情感记录
6. `roles` 与 `roleUsage`：一对多关系，一个角色可以有多个用户的使用记录

## 数据安全

1. 设置安全规则，确保用户只能访问自己的数据
2. 对敏感字段进行加密存储
3. 定期备份数据
4. 实现数据访问日志记录

## 数据迁移与扩展

1. 设计版本控制机制，便于未来数据结构升级
2. 考虑数据分片策略，应对数据量增长
3. 实现数据归档机制，处理历史数据

## 云函数设计

为支持数据库操作，建议实现以下云函数：

1. `login` - 用户登录与认证
2. `getRoles` - 获取角色列表
3. `createRole` - 创建自定义角色
4. `updateRole` - 更新角色信息
5. `getChats` - 获取聊天会话列表
6. `getMessages` - 获取消息列表
7. `sendMessage` - 发送消息
8. `analyzeEmotion` - 情感分析
9. `getEmotionStats` - 获取情感统计数据
10. `updateRoleUsage` - 更新角色使用统计

## 实现注意事项

1. 使用事务确保数据一致性
2. 实现数据缓存机制提高性能
3. 考虑离线数据同步策略
4. 实现数据分页加载，避免一次性加载过多数据
5. 定期清理无用数据，优化存储空间
