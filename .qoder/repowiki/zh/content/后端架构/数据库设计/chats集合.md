# chats集合

<cite>
**本文档引用文件**  
- [chats.md](file://doc/开发文档/database/chats.md)
- [messages.md](file://doc/开发文档/database/messages.md)
- [roles.md](file://doc/开发文档/database/roles.md)
- [user_base.md](file://doc/开发文档/database/user_base.md)
- [数据库设计方案.md](file://doc/开发文档/数据库设计方案.md)
- [HeartChat数据库结构图.md](file://doc/设计文档/流程图/HeartChat数据库结构图.md)
</cite>

## 目录
1. [简介](#简介)
2. [实体模型与字段定义](#实体模型与字段定义)
3. [在聊天系统中的作用](#在聊天系统中的作用)
4. [与roles和messages集合的关联关系](#与roles和messages集合的关联关系)
5. [基于索引的高效查询示例](#基于索引的高效查询示例)
6. [会话过期机制与数据清理策略](#会话过期机制与数据清理策略)
7. [读写权限配置](#读写权限配置)
8. [总结](#总结)

## 简介
`chats`集合是HeartChat系统中用于存储用户会话元数据的核心数据表，承载着用户与AI角色之间对话的上下文管理功能。该集合作为消息记录的父级容器，维护会话的生命周期，并通过与`messages`、`roles`等集合的关联，实现完整的聊天功能体系。本文档详细描述其数据结构、业务作用、关联关系及安全策略。

**Section sources**  
- [chats.md](file://doc/开发文档/database/chats.md#L1-L10)

## 实体模型与字段定义
`chats`集合用于存储用户与AI角色之间的会话元数据，每个文档代表一个独立的聊天会话。其核心字段包括：

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

关键字段说明：
- `_id`：会话唯一标识符，由数据库自动生成。
- `roleId`：关联`roles`集合的外键，标识当前会话所使用的AI角色。
- `openId`：微信用户的唯一标识，用于身份识别。
- `userId`：用户系统ID，关联`user_base`表，用于跨平台识别。
- `messageCount`：统计该会话下的消息总数，用于展示和性能优化。
- `lastMessage`：冗余字段，存储最后一条消息内容，提升会话列表加载效率。
- `emotionAnalysis`：嵌套对象，存储由`analysis`云函数生成的情感分析结果。
- `last_message_time`：最后消息时间，用于会话排序。
- `createTime` 和 `updateTime`：记录会话的创建与更新时间戳。

**Section sources**  
- [chats.md](file://doc/开发文档/database/chats.md#L12-L45)

## 在聊天系统中的作用
`chats`集合在聊天系统中扮演着“会话容器”的核心角色，主要功能包括：

1. **会话生命周期管理**：作为`messages`集合的父级容器，`chats`记录会话的创建、更新和归档状态，维护会话的整体上下文。
2. **会话列表展示**：通过`lastMessage`和`last_message_time`字段，支持快速渲染用户的历史会话列表，无需查询完整消息链。
3. **统计信息聚合**：`messageCount`字段提供会话活跃度指标，用于用户行为分析和界面展示。
4. **上下文构建支持**：在AI对话过程中，系统通过`roleId`和会话历史快速加载角色设定和对话背景，提升响应质量。
5. **情感分析集成**：`emotionAnalysis`字段存储每次会话的情感分析结果，为后续的情绪追踪和报告生成提供数据支持。

**Section sources**  
- [chats.md](file://doc/开发文档/database/chats.md#L47-L55)

## 与roles和messages集合的关联关系
`chats`集合通过外键与`roles`和`messages`集合建立明确的数据关联，形成完整的聊天数据模型。

```mermaid
erDiagram
roles ||--o{ chats : "使用"
chats ||--o{ messages : "包含"
```

### 与`roles`集合的关联
- **关系类型**：多对一（多个chats记录对应一个roles记录）
- **关联字段**：`chats.roleId → roles._id`
- **作用**：确定会话所使用的AI角色，加载其`prompt`、`welcome`语等配置信息。
- **冗余设计**：`chats.roleName`字段冗余存储角色名称，避免频繁关联查询，提升性能。

### 与`messages`集合的关联
- **关系类型**：一对多（一个chats记录对应多个messages记录）
- **关联字段**：`messages.chatId → chats._id`
- **作用**：`chats`作为会话的根节点，`messages`集合中的所有消息通过`chatId`归属到具体会话。
- **级联操作**：删除会话时，需同步清理其下所有`messages`记录，确保数据一致性。

**Diagram sources**  
- [HeartChat数据库结构图.md](file://doc/设计文档/流程图/HeartChat数据库结构图.md#L1-L10)  
- [chats.md](file://doc/开发文档/database/chats.md#L57-L60)  
- [messages.md](file://doc/开发文档/database/messages.md#L57-L60)

## 基于索引的高效查询示例
为支持高频查询场景，`chats`集合设计了多种索引策略，确保查询性能。

### 索引建议
- **复合索引**：`openId + roleId + updateTime`（降序）——用于快速定位用户与特定角色的最近会话。
- **单字段索引**：`userId`——支持基于系统用户ID的会话查询。
- **单字段索引**：`createTime`——用于按创建时间范围筛选会话。

### 实际查询场景
1. **查找用户与某角色的历史会话**：
   ```javascript
   db.collection('chats')
     .where({
       openId: 'oxxxxxxxxxxxxxxxx',
       roleId: 'role_001'
     })
     .orderBy('updateTime', 'desc')
     .get()
   ```
   该查询利用复合索引，可在毫秒级返回结果。

2. **获取用户所有会话并按最后活跃时间排序**：
   ```javascript
   db.collection('chats')
     .where({
       openId: 'oxxxxxxxxxxxxxxxx'
     })
     .orderBy('last_message_time', 'desc')
     .limit(20)
     .get()
   ```
   支持分页加载会话列表，提升用户体验。

**Section sources**  
- [chats.md](file://doc/开发文档/database/chats.md#L62-L67)  
- [HeartChat数据库结构图.html](file://doc/设计文档/流程图/html/HeartChat数据库结构图.html#L593-L637)

## 会话过期机制与数据清理策略
为优化存储成本和系统性能，`chats`集合实施会话过期与数据清理机制。

### 会话过期机制
- **判断标准**：以`last_message_time`为基准，超过设定阈值（如90天）的会话标记为“不活跃”。
- **状态管理**：可通过添加`status`字段或`isArchived`字段标记归档会话，减少活跃数据集大小。
- **用户感知**：前端可对过期会话进行灰显或折叠处理，提示用户可重新激活。

### 数据清理策略
1. **自动归档**：后台定时任务扫描`last_message_time`，将长期未活跃会话移至归档集合或标记`isArchived: true`。
2. **软删除机制**：删除会话时，设置`isDeleted: true`而非物理删除，保留数据恢复能力。
3. **级联清理**：删除`chats`记录时，触发云函数清理对应的`messages`记录，确保数据完整性。
4. **定期清理**：对已归档超过一年的会话执行物理删除，符合数据隐私政策。

**Section sources**  
- [chats.md](file://doc/开发文档/database/chats.md#L68)  
- [数据库设计方案.md](file://doc/开发文档/数据库设计方案.md#L82-L95)

## 读写权限配置
为保障用户数据安全，`chats`集合实施严格的读写权限控制。

### 安全规则设计
- **读权限**：用户仅可读取`openId`或`userId`与自身匹配的会话记录。
- **写权限**：用户仅可创建或更新属于自己的会话，禁止修改他人数据。
- **角色关联安全**：`roleId`字段需验证其在`roles`集合中存在且状态为启用。

### 实现方式
1. **云数据库安全规则**：在微信云开发中配置数据库安全规则，基于`openId`进行访问控制。
2. **云函数中间件**：在`chat`云函数中校验请求用户的`openId`与操作的`chat`记录是否匹配。
3. **字段级控制**：敏感字段如`emotionAnalysis`仅允许`analysis`云函数更新，前端不可写。

此机制确保用户只能访问自己的会话数据，防止越权访问。

**Section sources**  
- [chats.md](file://doc/开发文档/database/chats.md#L1-L68)  
- [user_base.md](file://doc/开发文档/database/user_base.md#L1-L76)

## 总结
`chats`集合作为HeartChat系统的核心数据表，不仅存储会话元数据，还承担着上下文管理、性能优化和安全控制等多重职责。通过合理的字段设计、索引策略和关联关系，支撑了高效的聊天功能。结合会话过期机制与严格的权限配置，确保了系统的可扩展性与数据安全性。未来可进一步优化归档策略和分析字段，提升用户体验与系统性能。