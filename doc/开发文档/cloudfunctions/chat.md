# Chat 云函数文档

## 功能描述

Chat云函数是一个**聊天服务模块**，提供用户与AI角色的实时对话服务，支持多种AI模型（智谱AI、Google Gemini、OpenAI等）和智能消息分段功能。

## 文件结构

- **`index.js`** - 主入口文件，定义云函数接口和聊天业务逻辑
- **`aiModelService.js`** - 统一AI模型服务，支持多平台调用
- **`bigmodel.js`** - 智谱AI API集成模块
- **`geminiModel.js`** - Google Gemini API集成模块
- **`package.json`** - 依赖配置

## 主要流程

### 1. 发送消息流程
```
用户消息 → 参数验证 → 获取角色信息 → 查询/创建聊天会话 → 获取历史消息 → 保存用户消息 → 生成AI回复 → 分段处理 → 保存分段消息 → 更新统计数据
```

### 2. 获取聊天历史流程
```
请求参数 → 构建查询条件 → 查询chats集合 → 查询messages集合 → 数据整合 → 返回结果
```

### 3. AI回复生成流程
```
用户消息 + 历史记录 → AI模型调用 → JSON解析 → 情感分析（可选） → 消息分段 → 返回结果
```

### 4. 消息分段处理流程
```
完整AI回复 → 清理Markdown标记 → 按自然段落分割 → 按句子分割 → 按次要标点分割 → 合并短段落 → 生成分段数组
```

## 数据流向

### 输入数据
- 用户消息内容
- 角色ID和聊天ID
- AI模型类型选择
- 对话记忆长度
- 自定义系统提示词
- 模型参数（温度、最大token等）

### 处理过程
1. **参数验证**：检查必要参数和格式
2. **会话管理**：查询或创建聊天会话
3. **历史获取**：获取指定长度的历史消息
4. **消息保存**：保存用户消息到数据库
5. **AI调用**：调用选择的AI模型生成回复
6. **消息分段**：将长消息智能分段
7. **批量保存**：保存所有分段消息
8. **统计更新**：更新用户和角色统计数据

### 输出数据
- 聊天会话信息
- 用户消息记录
- 分段AI回复数组
- 情感分析结果（可选）
- 使用统计信息

## 涉及的数据库集合

### 1. chats（聊天会话表）
```javascript
{
  _id: "会话ID",
  roleId: "角色ID",
  roleName: "角色名称",
  openId: "用户openid",
  userId: "用户ID（可选）",
  messageCount: 0,
  lastMessage: "最后一条消息",
  emotionAnalysis: {
    type: "主要情感类型",
    intensity: 0.5,
    suggestions: []
  },
  last_message_time: "最后消息时间",
  createTime: "创建时间",
  updateTime: "更新时间"
}
```

### 2. messages（消息表）
```javascript
{
  _id: "消息ID",
  chatId: "聊天会话ID",
  roleId: "角色ID",
  openId: "用户openid",
  content: "消息内容",
  sender_type: "user|ai",
  createTime: "创建时间",
  timestamp: "时间戳",
  status: "发送状态",
  
  // 分段消息相关字段
  isSegment: false,
  segmentIndex: 0,
  totalSegments: 1,
  originalMessageId: "原始消息ID"
}
```

### 3. user_stats（用户统计表）
```javascript
{
  _id: "统计ID",
  openid: "用户openid",
  user_id: "用户ID（可选）",
  chat_count: 0,
  total_messages: 0,
  user_messages: 0,
  ai_messages: 0,
  emotion_records_count: 0,
  favorite_roles: [
    {
      role_id: "角色ID",
      usage_count: 0,
      last_used: "最后使用时间"
    }
  ],
  created_at: "创建时间",
  updated_at: "更新时间"
}
```

### 4. roles（角色表）
```javascript
{
  _id: "角色ID",
  name: "角色名称",
  description: "角色描述",
  prompt: "角色提示词",
  avatar: "角色头像",
  category: "角色分类",
  tags: ["标签1", "标签2"],
  is_public: true,
  usage_count: 0,
  created_by: "创建者",
  created_at: "创建时间",
  updated_at: "更新时间"
}
```

## API接口

### 支持的操作类型
1. **sendMessage** - 发送消息并获取AI回复
2. **getChatHistory** - 获取聊天历史记录
3. **saveChatHistory** - 保存聊天记录
4. **deleteMessage** - 删除指定消息
5. **clearChatHistory** - 清空聊天记录
6. **checkChatExists** - 检查聊天会话是否存在
7. **testConnection** - 测试AI模型连接
8. **getModelList** - 获取可用模型列表
9. **checkApiKeyStatus** - 检查API密钥状态

### 支持的AI模型
- 智谱AI (glm-4-flash, glm-4)
- Google Gemini (gemini-2.5-flash-preview-04-17)
- Whimsy AI (gemini-2.5-pro-preview-05-06, gemini-2.5-flash-preview-04-17-non-thinking)
- 其他兼容OpenAI API的模型

## 关键特性

### 智能消息分段
- 按自然段落分割
- 按句子和标点符号分割
- 保持列表完整性
- 合并短段落避免过度分段
- 最大段落长度150字符

### 多模型支持
- 统一的AI模型接口
- 支持多种AI平台
- 可配置模型参数
- 自动降级处理

### 用户画像集成
- 支持自定义系统提示词
- 包含用户画像信息的个性化回复
- 上下文记忆功能

### 统计数据管理
- 自动更新用户使用统计
- 角色使用次数统计
- 消息数量统计
- 情感记录统计

## 错误处理

- API调用失败自动重试
- 参数验证和错误提示
- 权限检查和所有权验证
- 详细的错误日志记录
- 优雅的降级处理

## 性能优化

- 异步消息处理
- 批量数据库操作
- 历史消息限制
- 智能缓存策略
- 并发请求处理