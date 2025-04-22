# roles 云函数使用文档

## 概述

`roles` 云函数是一个全面的角色管理系统，用于管理 HeartChat 小程序中的角色数据，包括角色的创建、查询、更新、删除、使用统计等基础功能，以及提示词生成、记忆管理和用户画像分析等高级功能。它支持创建高度自定义的角色，并能在对话过程中不断丰富角色人格和收集用户信息。

## 功能列表

### 基础角色管理功能

| 功能名称 | action 参数 | 说明 |
|---------|------------|------|
| 获取角色列表 | getRoles | 获取角色列表，支持分类筛选 |
| 获取角色详情 | getRoleDetail | 获取单个角色的详细信息 |
| 创建角色 | createRole | 创建新角色 |
| 更新角色 | updateRole | 更新现有角色信息 |
| 删除角色 | deleteRole | 删除角色 |
| 更新角色使用统计 | updateUsage | 更新角色的使用统计信息 |
| 获取角色消息统计 | getMessageStats | 获取角色的消息统计信息 |
| 初始化角色数据 | initialize | 初始化系统预设角色数据 |

### 提示词生成功能

| 功能名称 | action 参数 | 说明 |
|---------|------------|------|
| 生成角色提示词 | generatePrompt | 根据角色信息生成提示词，可融合记忆和用户画像 |

### 记忆管理功能

| 功能名称 | action 参数 | 说明 |
|---------|------------|------|
| 提取对话记忆 | extractMemories | 从对话中提取重要信息作为角色记忆 |
| 获取相关记忆 | getRelevantMemories | 获取与当前上下文相关的记忆 |

### 用户画像管理功能

| 功能名称 | action 参数 | 说明 |
|---------|------------|------|
| 更新用户画像 | updateUserPerception | 分析对话内容并更新用户画像 |
| 获取用户画像摘要 | getUserPerceptionSummary | 生成用户画像的自然语言摘要 |

## 数据结构

### 角色数据结构

```javascript
{
  _id: "角色ID",
  name: "角色名称",
  avatar: "头像URL",

  // 基本信息
  relationship: "与用户的关系", // 家人、情侣、老师、朋友等
  age: 25, // 年龄
  gender: "性别", // 男/女/其他

  // 详细背景
  background: "生活经历和背景故事",
  education: "教育背景",
  occupation: "职业",
  hobbies: ["爱好1", "爱好2"],

  // 性格特点
  personality_traits: ["性格特点1", "性格特点2"],
  communication_style: "说话方式", // 例如：直接、温和、幽默、严肅等
  emotional_tendency: "情感倾向", // 例如：乐观、悲观、理性、感性等
  taboo: "禁忌话题", // 不想讨论的话题

  // 兼容旧字段
  description: "角色描述",
  category: "角色分类", // emotion, psychology, life, career
  welcome: "欢迎消息",

  // AI提示词相关
  system_prompt: "系统提示词", // 生成的最终提示词
  prompt_template: "提示词模板", // 自定义提示词模板

  // 记忆与发展
  memories: [
    {
      content: "记忆内容",
      importance: 0.8, // 重要性评分（0-1）
      timestamp: Date,
      context: "记忆上下文"
    }
  ],

  // 用户画像感知
  user_perception: {
    interests: ["用户兴趣1", "用户兴趣2"],
    preferences: ["用户偏好1", "用户偏好2"],
    communication_style: "用户说话方式",
    emotional_patterns: ["用户情感模式1", "用户情感模式2"]
  },

  // 基础字段
  creator: "创建者ID", // 系统角色为"system"
  createTime: Date,
  updateTime: Date,
  status: 1 // 1:启用 0:禁用
}
```

### 角色使用统计数据结构

```javascript
{
  _id: "使用统计ID",
  roleId: "角色ID",
  userId: "用户ID",
  usageCount: 10, // 使用次数
  lastUsedTime: Date, // 最后使用时间
  createTime: Date,
  updateTime: Date
}
```

## 接口说明

### 1. 获取角色列表 (getRoles)

获取角色列表，支持分类筛选。

**请求参数：**

```javascript
{
  action: "getRoles",
  userId: "用户ID", // 可选，如果提供，会返回该用户的角色使用统计
  category: "角色分类", // 可选，如果提供，只返回该分类的角色
  limit: 20, // 可选，返回的最大数量，默认20
  skip: 0 // 可选，跳过的数量，用于分页，默认0
}
```

**返回结果：**

```javascript
{
  success: true,
  roles: [
    {
      _id: "角色ID",
      name: "角色名称",
      avatar: "头像URL",
      description: "角色描述",
      category: "角色分类",
      // 其他角色字段...
      usage: {
        usageCount: 5, // 使用次数
        lastUsedTime: "2023-04-12T12:34:56.789Z" // 最后使用时间
      }
    },
    // 更多角色...
  ],
  total: 10 // 返回的角色数量
}
```

### 2. 获取角色详情 (getRoleDetail)

获取单个角色的详细信息。

**请求参数：**

```javascript
{
  action: "getRoleDetail",
  roleId: "角色ID" // 必填，要获取的角色ID
}
```

**返回结果：**

```javascript
{
  success: true,
  role: {
    _id: "角色ID",
    name: "角色名称",
    avatar: "头像URL",
    description: "角色描述",
    category: "角色分类",
    // 其他角色字段...
  }
}
```

### 3. 创建角色 (createRole)

创建新角色。

**请求参数：**

```javascript
{
  action: "createRole",
  role: {
    name: "角色名称", // 必填
    avatar: "头像URL", // 可选
    description: "角色描述", // 可选
    category: "角色分类", // 可选
    personality: ["性格特点1", "性格特点2"], // 可选
    prompt: "给AI的提示词", // 可选
    welcome: "欢迎消息" // 可选
    // 其他角色字段...
  },
  userId: "用户ID" // 可选，创建者ID，如果不提供，使用云函数上下文中的openid
}
```

**返回结果：**

```javascript
{
  success: true,
  roleId: "新创建的角色ID"
}
```

### 4. 更新角色 (updateRole)

更新现有角色信息。

**请求参数：**

```javascript
{
  action: "updateRole",
  roleId: "角色ID", // 必填，要更新的角色ID
  role: {
    name: "角色名称", // 可选，要更新的字段
    avatar: "头像URL", // 可选，要更新的字段
    description: "角色描述", // 可选，要更新的字段
    // 其他要更新的字段...
  },
  userId: "用户ID" // 可选，更新者ID，如果不提供，使用云函数上下文中的openid
}
```

**返回结果：**

```javascript
{
  success: true
}
```

### 5. 删除角色 (deleteRole)

删除角色。

**请求参数：**

```javascript
{
  action: "deleteRole",
  roleId: "角色ID", // 必填，要删除的角色ID
  userId: "用户ID" // 可选，删除者ID，如果不提供，使用云函数上下文中的openid
}
```

**返回结果：**

```javascript
{
  success: true
}
```

### 6. 更新角色使用统计 (updateUsage)

更新角色的使用统计信息。

**请求参数：**

```javascript
{
  action: "updateUsage",
  roleId: "角色ID", // 必填，要更新统计的角色ID
  userId: "用户ID" // 必填，使用者ID
}
```

**返回结果：**

```javascript
{
  success: true,
  data: {
    usageId: "使用统计ID",
    updated: true // 如果是更新现有记录，为true；如果是创建新记录，为false
  }
}
```

### 7. 获取角色消息统计 (getMessageStats)

获取角色的消息统计信息。

**请求参数：**

```javascript
{
  action: "getMessageStats",
  roleIds: ["角色ID1", "角色ID2"], // 必填，要获取统计的角色ID列表
  userId: "用户ID" // 必填，用户ID
}
```

**返回结果：**

```javascript
{
  success: true,
  stats: {
    "角色ID1": 10, // 消息数量
    "角色ID2": 5 // 消息数量
  }
}
```

### 8. 初始化角色数据 (initialize)

初始化系统预设角色数据。

**请求参数：**

```javascript
{
  action: "initialize"
}
```

**返回结果：**

```javascript
{
  success: true,
  message: "角色数据初始化成功",
  result: [
    { _id: "角色ID1" },
    { _id: "角色ID2" },
    // 更多初始化的角色ID...
  ]
}
```

## 使用示例

### 获取角色列表

```javascript
try {
  const result = await wx.cloud.callFunction({
    name: 'roles',
    data: {
      action: 'getRoles',
      userId: app.globalData.userInfo.userId
    }
  });

  if (result && result.result && result.result.success) {
    const roles = result.result.roles;
    console.log('获取到的角色列表:', roles);
  } else {
    throw new Error('获取角色列表失败');
  }
} catch (error) {
  console.error('调用云函数失败:', error);
}
```

### 获取角色详情

```javascript
try {
  const result = await wx.cloud.callFunction({
    name: 'roles',
    data: {
      action: 'getRoleDetail',
      roleId: 'your-role-id'
    }
  });

  if (result && result.result && result.result.success) {
    const role = result.result.role;
    console.log('获取到的角色详情:', role);
  } else {
    throw new Error('获取角色详情失败');
  }
} catch (error) {
  console.error('调用云函数失败:', error);
}
```

### 创建角色

```javascript
try {
  const newRole = {
    name: '新角色名称',
    avatar: 'cloud://your-env-id.avatars/new-role.png',
    description: '新角色描述',
    category: 'life',
    prompt: '角色提示词',
    welcome: '欢迎消息'
  };

  const result = await wx.cloud.callFunction({
    name: 'roles',
    data: {
      action: 'createRole',
      role: newRole,
      userId: app.globalData.userInfo.userId
    }
  });

  if (result && result.result && result.result.success) {
    console.log('创建角色成功, ID:', result.result.roleId);
  } else {
    throw new Error('创建角色失败');
  }
} catch (error) {
  console.error('调用云函数失败:', error);
}
```

### 9. 生成角色提示词 (generatePrompt)

生成角色提示词，可融合记忆和用户画像。

**请求参数：**

```javascript
{
  action: "generatePrompt",
  roleId: "角色ID", // 可选，如果提供，会获取该角色的信息
  roleInfo: { /* 角色信息 */ }, // 可选，如果提供，直接使用这些信息生成提示词
  currentContext: "当前对话内容", // 可选，如果提供，会获取相关记忆
  updatePrompt: true // 可选，是否更新角色的系统提示词
}
```

**返回结果：**

```javascript
{
  success: true,
  prompt: "生成的提示词"
}
```

### 10. 提取对话记忆 (extractMemories)

从对话中提取重要信息作为角色记忆。

**请求参数：**

```javascript
{
  action: "extractMemories",
  roleId: "角色ID", // 必填，角色ID
  messages: [ // 必填，对话消息
    { sender_type: "user", content: "用户消息" },
    { sender_type: "role", content: "角色回复" }
  ]
}
```

**返回结果：**

```javascript
{
  success: true,
  memories: [
    {
      content: "记忆内容",
      importance: 0.8,
      timestamp: "2023-04-12T12:34:56.789Z",
      context: "记忆上下文"
    }
  ],
  totalMemories: 10 // 角色记忆总数
}
```

### 11. 获取相关记忆 (getRelevantMemories)

获取与当前上下文相关的记忆。

**请求参数：**

```javascript
{
  action: "getRelevantMemories",
  roleId: "角色ID", // 必填，角色ID
  currentContext: "当前对话内容", // 可选，如果提供，会获取与当前上下文相关的记忆
  limit: 5 // 可选，返回的记忆数量，默认5
}
```

**返回结果：**

```javascript
{
  success: true,
  memories: [
    {
      content: "记忆内容",
      importance: 0.8,
      timestamp: "2023-04-12T12:34:56.789Z",
      context: "记忆上下文",
      relevance: 0.9 // 与当前上下文的相关性
    }
  ]
}
```

### 12. 更新用户画像 (updateUserPerception)

分析对话内容并更新用户画像。

**请求参数：**

```javascript
{
  action: "updateUserPerception",
  roleId: "角色ID", // 必填，角色ID
  userId: "用户ID", // 必填，用户ID
  messages: [ // 必填，对话消息
    { sender_type: "user", content: "用户消息" },
    { sender_type: "role", content: "角色回复" }
  ]
}
```

**返回结果：**

```javascript
{
  success: true,
  userPerception: {
    interests: ["用户兴趣1", "用户兴趣2"],
    preferences: ["用户偏好1", "用户偏好2"],
    communication_style: "用户说话方式",
    emotional_patterns: ["用户情感模式1", "用户情感模式2"]
  }
}
```

### 13. 获取用户画像摘要 (getUserPerceptionSummary)

生成用户画像的自然语言摘要。

**请求参数：**

```javascript
{
  action: "getUserPerceptionSummary",
  roleId: "角色ID" // 必填，角色ID
}
```

**返回结果：**

```javascript
{
  success: true,
  summary: "用户画像摘要文本"
}
```

## 使用示例

### 获取角色列表

```javascript
try {
  const result = await wx.cloud.callFunction({
    name: 'roles',
    data: {
      action: 'getRoles',
      userId: app.globalData.userInfo.userId
    }
  });

  if (result && result.result && result.result.success) {
    const roles = result.result.roles;
    console.log('获取到的角色列表:', roles);
  } else {
    throw new Error('获取角色列表失败');
  }
} catch (error) {
  console.error('调用云函数失败:', error);
}
```

### 生成角色提示词

```javascript
try {
  const result = await wx.cloud.callFunction({
    name: 'roles',
    data: {
      action: 'generatePrompt',
      roleId: 'your-role-id',
      currentContext: '最近的对话内容'
    }
  });

  if (result && result.result && result.result.success) {
    const prompt = result.result.prompt;
    console.log('生成的提示词:', prompt);
  } else {
    throw new Error('生成提示词失败');
  }
} catch (error) {
  console.error('调用云函数失败:', error);
}
```

### 提取对话记忆

```javascript
try {
  const messages = [
    { sender_type: 'user', content: '我喜欢看科幻电影' },
    { sender_type: 'role', content: '科幻电影是一个很好的选择，你有喜欢的科幻电影吗？' },
    { sender_type: 'user', content: '我最喜欢星际穿越' }
  ];

  const result = await wx.cloud.callFunction({
    name: 'roles',
    data: {
      action: 'extractMemories',
      roleId: 'your-role-id',
      messages: messages
    }
  });

  if (result && result.result && result.result.success) {
    const memories = result.result.memories;
    console.log('提取的记忆:', memories);
  } else {
    throw new Error('提取记忆失败');
  }
} catch (error) {
  console.error('调用云函数失败:', error);
}
```

### 更新用户画像

```javascript
try {
  const messages = [
    { sender_type: 'user', content: '我最近工作压力很大' },
    { sender_type: 'role', content: '工作压力大是很困扰的，你平时有什么放松的方式吗？' },
    { sender_type: 'user', content: '我喜欢听音乐和看书来放松' }
  ];

  const result = await wx.cloud.callFunction({
    name: 'roles',
    data: {
      action: 'updateUserPerception',
      roleId: 'your-role-id',
      userId: app.globalData.userInfo.userId,
      messages: messages
    }
  });

  if (result && result.result && result.result.success) {
    const userPerception = result.result.userPerception;
    console.log('更新的用户画像:', userPerception);
  } else {
    throw new Error('更新用户画像失败');
  }
} catch (error) {
  console.error('调用云函数失败:', error);
}
```

## 注意事项

1. 角色的创建、更新和删除操作需要权限验证，只有角色的创建者或管理员可以执行这些操作。
2. 角色使用统计会自动更新，每次使用角色时应调用 `updateUsage` 接口。
3. 初始化角色数据接口 `initialize` 只会在角色集合为空时添加预设角色，不会覆盖现有角色。
4. 角色头像应上传到云存储，并使用云存储路径作为 `avatar` 字段的值。
5. 角色分类应使用预设的分类值：`emotion`（情感支持）、`psychology`（心理咨询）、`life`（生活伙伴）、`career`（职场导师）。
6. 记忆和用户画像功能依赖于智谱AI接口，确保 `httpRequest` 云函数已正确部署。
7. 在对话结束后应调用 `extractMemories` 和 `updateUserPerception` 接口，以便在下次对话中使用这些信息。
8. 在对话开始前应调用 `generatePrompt` 接口，生成包含记忆和用户画像的提示词。
