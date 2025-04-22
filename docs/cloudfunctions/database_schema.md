# HeartChat 云数据库模式设计

## 概述

HeartChat 使用微信云开发的云数据库（基于 MongoDB）存储应用数据。本文档详细说明数据库集合结构、字段定义和索引设计，为开发和维护提供参考。

## 集合设计

### 1. users - 用户信息

存储用户基本信息和设置。

| 字段名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| _id | String | 用户ID，与微信 openid 一致 | "oABC123XYZ" |
| nickName | String | 用户昵称 | "心语用户" |
| avatarUrl | String | 用户头像URL | "cloud://xxx.jpg" |
| gender | Number | 性别（0:未知, 1:男, 2:女） | 1 |
| createTime | Date | 创建时间 | "2023-01-01T12:00:00Z" |
| lastLoginTime | Date | 最后登录时间 | "2023-01-10T08:30:00Z" |
| reportSettings | Object | 报告设置 | { "dailyReport": true } |
| status | Number | 账号状态（0:正常, 1:禁用） | 0 |

**索引：**
- _id: 主键索引
- createTime: 用于按创建时间查询
- lastLoginTime: 用于按最后登录时间查询

### 2. roles - 角色信息

存储系统预设和用户自定义的角色信息。

| 字段名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| _id | String | 角色ID | "role123" |
| name | String | 角色名称 | "知心朋友" |
| avatar | String | 角色头像URL | "cloud://xxx.jpg" |
| description | String | 角色描述 | "一个善于倾听的朋友" |
| tags | Array | 角色标签 | ["倾听", "温暖", "理解"] |
| prompt | String | 角色提示词 | "你是一个善于倾听的朋友..." |
| creator | String | 创建者ID，系统角色为null | "oABC123XYZ" |
| isSystem | Boolean | 是否系统角色 | true |
| createTime | Date | 创建时间 | "2023-01-01T12:00:00Z" |
| updateTime | Date | 更新时间 | "2023-01-10T08:30:00Z" |
| status | Number | 状态（0:正常, 1:禁用） | 0 |

**索引：**
- _id: 主键索引
- creator: 用于查询用户创建的角色
- isSystem: 用于查询系统角色
- tags: 用于按标签查询角色

### 3. chats - 聊天会话信息

存储用户与角色之间的聊天会话信息。

| 字段名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| _id | String | 会话ID | "chat123" |
| userId | String | 用户ID | "oABC123XYZ" |
| roleId | String | 角色ID | "role123" |
| roleName | String | 角色名称（冗余） | "知心朋友" |
| createTime | Date | 创建时间 | "2023-01-01T12:00:00Z" |
| lastMessageTime | Date | 最后消息时间 | "2023-01-10T08:30:00Z" |
| messageCount | Number | 消息数量 | 42 |
| title | String | 会话标题 | "关于工作压力的对话" |
| summary | String | 会话摘要 | "讨论了工作压力和缓解方法" |
| status | Number | 状态（0:正常, 1:归档, 2:删除） | 0 |

**索引：**
- _id: 主键索引
- userId: 用于查询用户的所有会话
- roleId: 用于查询与特定角色的会话
- lastMessageTime: 用于按时间排序会话
- userId_roleId: 复合索引，用于查询用户与特定角色的会话

### 4. messages - 消息详情

存储聊天消息的详细内容。

| 字段名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| _id | String | 消息ID | "msg123" |
| chatId | String | 所属会话ID | "chat123" |
| sender | String | 发送者类型（user/ai） | "user" |
| content | String | 消息内容 | "最近工作压力很大" |
| timestamp | Date | 发送时间 | "2023-01-10T08:30:00Z" |
| emotionType | String | 情绪类型 | "anxiety" |
| emotionId | String | 关联的情绪分析ID | "emotion123" |
| status | Number | 状态（0:正常, 1:撤回, 2:删除） | 0 |

**索引：**
- _id: 主键索引
- chatId: 用于查询会话的所有消息
- timestamp: 用于按时间排序消息
- chatId_timestamp: 复合索引，用于分页查询会话消息

### 5. emotionRecords - 情感分析记录

存储用户消息的情感分析结果。

| 字段名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| _id | String | 记录ID | "emotion123" |
| userId | String | 用户ID | "oABC123XYZ" |
| messageId | String | 消息ID | "msg123" |
| chatId | String | 会话ID | "chat123" |
| emotionType | String | 情绪类型 | "anxiety" |
| emotionIntensity | Number | 情绪强度（0-1） | 0.75 |
| emotionPolarity | String | 情绪极性（positive/negative/neutral） | "negative" |
| keywords | Array | 关键词列表 | ["工作", "压力", "焦虑"] |
| timestamp | Date | 分析时间 | "2023-01-10T08:30:00Z" |
| suggestions | Array | 建议列表 | ["尝试深呼吸", "适当休息"] |
| rawResult | Object | 原始分析结果 | { ... } |

**索引：**
- _id: 主键索引
- userId: 用于查询用户的所有情感记录
- messageId: 用于查询特定消息的情感分析
- chatId: 用于查询会话的所有情感分析
- timestamp: 用于按时间排序情感记录
- userId_timestamp: 复合索引，用于分页查询用户情感记录

### 6. roleUsage - 角色使用统计

记录用户对角色的使用情况。

| 字段名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| _id | String | 记录ID | "usage123" |
| userId | String | 用户ID | "oABC123XYZ" |
| roleId | String | 角色ID | "role123" |
| usageCount | Number | 使用次数 | 15 |
| messageCount | Number | 消息数量 | 120 |
| totalDuration | Number | 总使用时长（分钟） | 45 |
| lastUsed | Date | 最后使用时间 | "2023-01-10T08:30:00Z" |
| firstUsed | Date | 首次使用时间 | "2023-01-01T12:00:00Z" |

**索引：**
- _id: 主键索引
- userId: 用于查询用户的所有角色使用记录
- roleId: 用于查询角色的所有使用记录
- userId_roleId: 复合索引，用于查询用户对特定角色的使用记录
- usageCount: 用于按使用次数排序

### 7. userReports - 用户每日报告

存储用户的每日心情报告。

| 字段名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| _id | String | 报告ID | "report123" |
| userId | String | 用户ID | "oABC123XYZ" |
| date | String | 报告日期（YYYY-MM-DD） | "2023-01-10" |
| emotionSummary | Object | 情绪摘要 | { "主要情绪": "快乐", "强度": 0.8 } |
| emotionDistribution | Object | 情绪分布 | { "快乐": 0.6, "焦虑": 0.2, ... } |
| keywords | Array | 关键词列表 | ["工作", "家庭", "休闲"] |
| interests | Array | 兴趣领域 | ["阅读", "音乐", "旅行"] |
| fortune | Object | 运势建议 | { "宜": ["户外活动"], "忌": ["熬夜"] } |
| suggestions | Array | 建议列表 | ["多休息", "保持积极心态"] |
| inspirationalQuote | String | 励志语 | "每一天都是新的开始" |
| createTime | Date | 创建时间 | "2023-01-10T23:59:59Z" |

**索引：**
- _id: 主键索引
- userId: 用于查询用户的所有报告
- date: 用于按日期查询报告
- userId_date: 复合索引，用于查询用户特定日期的报告

### 8. userInterests - 用户兴趣

记录用户的兴趣领域及其权重。

| 字段名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| _id | String | 记录ID | "interest123" |
| userId | String | 用户ID | "oABC123XYZ" |
| interests | Array | 兴趣列表 | [{ "name": "阅读", "weight": 0.8, "updateTime": "2023-01-10T08:30:00Z" }] |
| updateTime | Date | 更新时间 | "2023-01-10T08:30:00Z" |

**索引：**
- _id: 主键索引
- userId: 用于查询用户的兴趣记录
- "interests.name": 用于按兴趣名称查询

### 9. sys_config - 系统配置

存储系统配置信息。

| 字段名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| _id | String | 配置ID | "config123" |
| configKey | String | 配置键 | "dailyReportTime" |
| configValue | Mixed | 配置值 | "22:00" |
| description | String | 配置描述 | "每日报告生成时间" |
| updateTime | Date | 更新时间 | "2023-01-10T08:30:00Z" |
| status | Number | 状态（0:启用, 1:禁用） | 0 |

**索引：**
- _id: 主键索引
- configKey: 用于按配置键查询

## 数据关系

```
┌─────────┐       ┌─────────┐       ┌─────────┐
│  users  │───┐   │  roles  │       │sys_config│
└─────────┘   │   └─────────┘       └─────────┘
              │         │
              │         │
              ▼         ▼
┌─────────┐  ┌─────────┐  ┌─────────────┐
│userReports│ │  chats  │  │  roleUsage  │
└─────────┘  └─────────┘  └─────────────┘
     ▲            │              ▲
     │            │              │
     │            ▼              │
┌─────────┐  ┌─────────┐         │
│userInterests│ │ messages │─────────┘
└─────────┘  └─────────┘
                  │
                  ▼
            ┌─────────────┐
            │emotionRecords│
            └─────────────┘
```

## 数据库初始化

### 初始化步骤

1. 创建集合
2. 创建索引
3. 添加系统配置
4. 添加预设角色

### 初始化代码示例

```javascript
// 初始化数据库
async function initDatabase() {
  const db = cloud.database();
  
  // 创建集合
  const collections = ['users', 'roles', 'chats', 'messages', 
                      'emotionRecords', 'roleUsage', 'userReports', 
                      'userInterests', 'sys_config'];
  
  for (const collection of collections) {
    try {
      await db.createCollection(collection);
      console.log(`Collection ${collection} created successfully`);
    } catch (error) {
      console.log(`Collection ${collection} already exists or error:`, error);
    }
  }
  
  // 创建索引
  try {
    // users 集合索引
    await db.collection('users').createIndexes([
      { key: { createTime: 1 } },
      { key: { lastLoginTime: 1 } }
    ]);
    
    // roles 集合索引
    await db.collection('roles').createIndexes([
      { key: { creator: 1 } },
      { key: { isSystem: 1 } },
      { key: { tags: 1 } }
    ]);
    
    // 其他集合索引...
    
    console.log('Indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
  
  // 添加系统配置
  try {
    const configItems = [
      {
        configKey: 'dailyReportTime',
        configValue: '22:00',
        description: '每日报告生成时间',
        updateTime: db.serverDate(),
        status: 0
      },
      // 其他配置项...
    ];
    
    for (const item of configItems) {
      await db.collection('sys_config').add({
        data: item
      });
    }
    
    console.log('System config added successfully');
  } catch (error) {
    console.error('Error adding system config:', error);
  }
  
  // 添加预设角色
  try {
    const roles = [
      {
        name: '知心朋友',
        avatar: 'cloud://default/roles/friend.png',
        description: '一个善于倾听的朋友',
        tags: ['倾听', '温暖', '理解'],
        prompt: '你是一个善于倾听的朋友...',
        creator: null,
        isSystem: true,
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        status: 0
      },
      // 其他预设角色...
    ];
    
    for (const role of roles) {
      await db.collection('roles').add({
        data: role
      });
    }
    
    console.log('Preset roles added successfully');
  } catch (error) {
    console.error('Error adding preset roles:', error);
  }
}
```

## 数据库维护

### 备份策略

1. 每日自动备份
2. 重要更新前手动备份
3. 备份文件保留30天

### 数据清理

1. 定期清理过期的临时数据
2. 归档长期不活跃的聊天记录
3. 优化大型集合的存储

### 性能监控

1. 监控查询性能
2. 定期检查索引使用情况
3. 优化慢查询

## 数据安全

1. 严格控制数据库访问权限
2. 敏感数据加密存储
3. 定期审计数据库操作日志
4. 遵循最小权限原则

## 扩展性考虑

1. 设计支持未来功能扩展
2. 预留字段用于新特性
3. 版本控制机制便于数据库结构升级
4. 兼容性设计确保向后兼容
