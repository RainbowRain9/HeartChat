# Roles 云函数文档

## 功能描述

Roles云函数是一个**智能角色管理系统**，提供角色的创建、读取、更新、删除功能，支持AI驱动的记忆管理、用户画像分析和个性化提示词生成。

## 文件结构

- **`index.js`** - 主入口文件，统一角色管理API接口
- **`memoryManager.js`** - 记忆管理模块，智能提取和管理角色记忆
- **`userPerception.js`** - 用户画像模块，分析用户特征和偏好
- **`promptGenerator.js`** - 提示词生成模块，生成个性化AI对话提示词
- **`init-roles.js`** - 角色初始化脚本，创建默认系统角色
- **`test-zhipu.js`** - 智谱AI测试模块
- **`package.json`** - 项目配置文件

## 主要流程

### 1. 角色管理流程
```
用户请求 → 参数验证 → 权限检查 → 数据库操作 → 结果返回
                                     ↓
                              创建/更新时同步prompt字段
```

### 2. 记忆管理流程
```
对话内容 → 提取用户消息 → AI分析记忆 → 解析记忆数据 → 去重排序 → 记忆数量控制 → 更新角色记忆
```

### 3. 用户画像流程
```
用户消息 → AI分析特征 → 解析画像数据 → 合并现有画像 → AI优化融合 → 更新角色画像
```

### 4. 提示词生成流程
```
角色信息 → 生成基础提示词 → 融合相关记忆 → 融合用户画像 → 更新角色提示词
```

## 数据流向

### 输入数据
- 角色基本信息（名称、描述、分类等）
- 用户ID和权限信息
- 对话消息内容
- AI分析参数

### 处理过程
1. **基础管理**：CRUD操作和权限验证
2. **AI分析**：调用智谱AI进行内容分析和生成
3. **数据整合**：记忆、画像、提示词的协同处理
4. **个性化优化**：基于用户特征的体验优化

### 输出数据
- 角色详细信息
- 记忆分析结果
- 用户画像数据
- 个性化提示词
- 统计信息

## 涉及的数据库集合

### 1. roles（角色主表）
```javascript
{
  _id: "角色ID",
  name: "角色名称",
  avatar: "头像URL",
  category: "角色分类", // psychology/life/career/emotion
  description: "角色描述",
  personality: ["性格特点1", "性格特点2"],
  prompt: "角色提示词",
  system_prompt: "系统提示词",
  welcome: "欢迎语",
  creator: "创建者", // 'system' 或用户openid
  user_id: "用户ID",
  createTime: "创建时间",
  updateTime: "更新时间",
  status: 1, // 1启用/0禁用
  memories: [
    {
      content: "记忆内容",
      importance: 0.8, // 重要性评分0-1
      category: "记忆分类",
      context: "记忆上下文",
      timestamp: "时间戳",
      source: "chat" // 来源：chat/merged
    }
  ],
  user_perception: {
    interests: ["兴趣1", "兴趣2"],
    preferences: ["偏好1", "偏好2"],
    communication_style: "沟通风格",
    emotional_patterns: ["情感模式1", "情感模式2"],
    last_updated: "最后更新时间"
  }
}
```

### 2. roleUsage（使用统计表）
```javascript
{
  _id: "统计记录ID",
  roleId: "角色ID",
  userId: "用户ID",
  usageCount: 0, // 使用次数
  lastUsedTime: "最后使用时间",
  createTime: "创建时间",
  updateTime: "更新时间"
}
```

## API接口

### 主要操作类型

#### 1. getRoles - 获取角色列表
```javascript
{
  action: 'getRoles',
  userId: "用户ID（可选）",
  category: "角色分类（可选）",
  limit: 50, // 可选，默认50
  skip: 0 // 可选，默认0
}
```

#### 2. createRole - 创建角色
```javascript
{
  action: 'createRole',
  role: {
    name: "角色名称",
    avatar: "头像URL（可选）",
    category: "分类（可选）",
    description: "描述（可选）",
    personality: ["性格特点"],
    prompt: "提示词（可选）",
    welcome: "欢迎语（可选）"
  }
}
```

#### 3. updateRole - 更新角色
```javascript
{
  action: 'updateRole',
  roleId: "角色ID",
  role: {
    // 要更新的字段
  }
}
```

#### 4. deleteRole - 删除角色
```javascript
{
  action: 'deleteRole',
  roleId: "角色ID"
}
```

#### 5. generatePrompt - 生成提示词
```javascript
{
  action: 'generatePrompt',
  roleId: "角色ID（可选）",
  roleInfo: {}, // 角色信息对象（可选）
  currentContext: "当前对话上下文（可选）",
  updatePrompt: true // 是否更新角色提示词
}
```

#### 6. extractMemories - 提取记忆
```javascript
{
  action: 'extractMemories',
  roleId: "角色ID",
  messages: [
    {
      role: "user",
      content: "用户消息"
    }
  ]
}
```

#### 7. updateUserPerception - 更新用户画像
```javascript
{
  action: 'updateUserPerception',
  roleId: "角色ID",
  userId: "用户ID",
  messages: [
    {
      role: "user",
      content: "用户消息"
    }
  ]
}
```

### 响应格式

#### 标准成功响应
```javascript
{
  success: true,
  data: {}, // 返回的数据
  total: 10, // 可选，总数
  message: "操作成功"
}
```

#### 角色列表响应
```javascript
{
  success: true,
  data: [
    {
      _id: "角色ID",
      name: "角色名称",
      // 其他角色字段...
      isSystem: false, // 是否为系统角色
      usage: {
        usageCount: 5,
        lastUsedTime: "最后使用时间"
      }
    }
  ],
  total: 10
}
```

#### 记忆提取响应
```javascript
{
  success: true,
  memories: [
    {
      content: "记忆内容",
      importance: 0.8,
      category: "记忆分类",
      context: "记忆上下文",
      timestamp: "时间戳",
      source: "chat"
    }
  ],
  totalMemories: 25
}
```

## 角色分类

### 支持的分类
- **psychology** - 心理咨询师
- **life** - 生活助手
- **career** - 职业顾问
- **emotion** - 情感陪伴

## 智能特性

### 1. 记忆管理
- 从对话中智能提取重要信息
- 记忆去重和重要性评分
- 基于上下文的相关记忆检索
- 记忆数量限制（最多50条）

### 2. 用户画像
- 分析用户兴趣和偏好
- 识别沟通风格
- 情感模式分析
- 画像的智能合并和优化

### 3. 个性化提示词
- 基础角色提示词生成
- 记忆信息自然融入
- 用户画像个性化调整
- 上下文相关的提示词优化

## 错误处理

### 参数验证错误
- 缺少必要参数
- 参数格式不正确
- 权限验证失败

### 系统错误
- 数据库操作失败
- AI调用失败
- 数据解析错误

### 降级处理
- AI不可用时使用本地算法
- 部分功能失败不影响整体流程
- 详细的错误日志记录

## 性能优化

### 数据优化
- 记忆数量限制
- 预过滤和缓存机制
- 批量数据处理

### AI调用优化
- 智能缓存减少重复调用
- 并发请求处理
- 错误重试机制

### 数据库优化
- 索引优化
- 查询优化
- 数据分页

## 安全特性

### 权限控制
- 创建者权限验证
- 系统角色保护
- 操作权限检查

### 数据安全
- 输入数据验证
- 输出数据过滤
- 错误信息安全

## 使用场景

1. **角色管理**：创建和管理AI对话角色
2. **个性化对话**：基于记忆和画像的智能对话
3. **用户分析**：深度了解用户特征和偏好
4. **内容优化**：通过AI优化对话内容质量

## 注意事项

- 需要配置智谱AI API密钥
- AI调用可能产生成本
- 记忆存储有数量限制
- 用户画像需要持续更新维护
- 系统角色需要特殊保护