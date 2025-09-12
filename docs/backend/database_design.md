
# 数据库设计文档

本文档详细描述了 HeartChat 项目的数据库结构、集合、字段和索引设计。

## 1. 核心集合

### 1.1. `users` - 用户信息

存储用户的基本信息、配置和统计数据。

| 字段名 | 类型 | 描述 | 备注 |
| :--- | :--- | :--- | :--- |
| `_id` | `String` | 记录唯一ID | 自动生成 |
| `user_id` | `String` | 用户唯一标识 | 主键，通常是小程序 `OPENID` |
| `username` | `String` | 用户昵称 | |
| `avatar_url` | `String` | 用户头像URL | |
| `user_type` | `Number` | 用户类型 | 1: 普通用户, 2: 付费用户, 9: 管理员 |
| `status` | `Number` | 用户状态 | 1: 正常, 2: 禁用 |
| `profile` | `Object` | 用户个人资料 | 包含 `gender`, `age`, `country`, `province`, `city`, `bio` |
| `stats` | `Object` | 用户统计数据 | 包含 `chat_count`, `solved_count`, `rating_avg`, `rating_count`, `last_active`, `active_days` |
| `config` | `Object` | 用户个性化配置 | 包含 `dark_mode`, `notification_enabled`, `language` |
| `created_at` | `Date` | 创建时间 | |
| `updated_at` | `Date` | 更新时间 | |

**索引**:

- `user_id` (唯一)

### 1.2. `userInterests` - 用户兴趣

存储通过对话分析得出的用户兴趣、关键词和分类。

| 字段名 | 类型 | 描述 | 备注 |
| :--- | :--- | :--- | :--- |
| `_id` | `String` | 记录唯一ID | 自动生成 |
| `userId` | `String` | 用户唯一标识 | 关联 `users` 集合 |
| `keywords` | `Array<Object>` | 关键词列表 | 每个对象包含 `word`, `weight`, `category`, `source`, `emotionScore`, `firstSeen`, `lastUpdated`, `occurrences` |
| `categories` | `Array<Object>` | 分类列表 | 每个对象包含 `name`, `count`, `firstSeen`, `lastUpdated` |
| `createTime` | `Date` | 创建时间 | |
| `lastUpdated` | `Date` | 最后更新时间 | |

**索引**:

- `userId` (唯一)
- `keywords.category`, `userId`
- `keywords.word`, `userId`
- `lastUpdated`, `userId`

### 1.3. `roles` - AI角色

存储系统预设和用户自定义的AI角色信息。

| 字段名 | 类型 | 描述 | 备注 |
| :--- | :--- | :--- | :--- |
| `_id` | `String` | 记录唯一ID | 自动生成 |
| `name` | `String` | 角色名称 | |
| `description` | `String` | 角色描述 | |
| `avatar` | `String` | 角色头像URL | |
| `prompt` | `String` | 角色的系统提示词 | |
| `category` | `String` | 角色分类 | |
| `tags` | `Array<String>` | 角色标签 | |
| `isSystem` | `Boolean` | 是否为系统角色 | `true` 表示系统预设 |
| `creator` | `String` | 创建者ID | 关联 `users` 集合，系统角色此字段为空 |
| `createTime` | `Date` | 创建时间 | |

**索引**:

- `creator`
- `category`
- `isSystem`
- `isSystem`, `category` (组合索引)
- `creator`, `category` (组合索引)

### 1.4. `emotionRecords` - 情绪记录

存储每次对话的情绪分析结果。

| 字段名 | 类型 | 描述 | 备注 |
| :--- | :--- | :--- | :--- |
| `_id` | `String` | 记录唯一ID | 自动生成 |
| `userId` | `String` | 用户唯一标识 | 关联 `users` 集合 |
| `chatId` | `String` | 对话ID | 关联 `chats` 集合 |
| `roleId` | `String` | 角色ID | 关联 `roles` 集合 |
| `primary_emotion` | `String` | 主要情绪 | |
| `emotions` | `Array<Object>` | 情绪列表 | 每个对象包含 `emotion` 和 `score` |
| `content` | `String` | 原始对话内容 | |
| `timestamp` | `Date` | 记录时间 | |

**索引**:

- `userId`, `timestamp`
- `roleId`, `userId`, `timestamp`
- `chatId`, `timestamp`
- `primary_emotion`, `userId`, `timestamp`

### 1.5. `messages` - 聊天记录

存储用户与AI的聊天消息。

| 字段名 | 类型 | 描述 | 备注 |
| :--- | :--- | :--- | :--- |
| `_id` | `String` | 记录唯一ID | 自动生成 |
| `chatId` | `String` | 对话ID | 标识一次完整的对话会话 |
| `userId` | `String` | 用户唯一标识 | 关联 `users` 集合 |
| `roleId` | `String` | 角色ID | 关联 `roles` 集合 |
| `sender_type` | `String` | 发送者类型 | `user` 或 `assistant` |
| `content` | `String` | 消息内容 | |
| `timestamp` | `Date` | 发送时间 | |

**索引**:

- `chatId`
- `userId`, `timestamp`

### 1.6. `userReports` - 用户报告

存储生成的每日或每周用户报告。

| 字段名 | 类型 | 描述 | 备注 |
| :--- | :--- | :--- | :--- |
| `_id` | `String` | 记录唯一ID | 自动生成 |
| `userId` | `String` | 用户唯一标识 | 关联 `users` 集合 |
| `date` | `String` | 报告日期 | 格式: `YYYY-MM-DD` |
| `type` | `String` | 报告类型 | `daily` 或 `weekly` |
| `summary` | `String` | 报告摘要 | |
| `data` | `Object` | 详细报告数据 | |
| `isRead` | `Boolean` | 是否已读 | 默认为 `false` |
| `createTime` | `Date` | 创建时间 | |

**索引**:

- `userId`, `date`
