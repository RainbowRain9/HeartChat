# GetEmotionRecords 云函数文档

## 功能描述

GetEmotionRecords云函数是一个**情绪记录查询服务**，提供根据用户ID和角色ID查询情绪记录的功能，支持字符串查询和对象查询两种方式。

## 文件结构

- **`index.js`** - 主入口文件，实现情绪记录查询逻辑

## 主要流程

### 1. 情绪记录查询流程
```
接收请求 → 参数验证 → 构建查询条件 → 尝试字符串查询 → 失败时尝试对象查询 → 结果排序和限制 → 返回查询结果
```

## 数据流向

### 输入数据
- `userId` - 用户ID（必需）
- `roleId` - 角色ID（可选）
- `limit` - 查询数量限制（可选，默认20条）

### 处理过程
1. **参数验证**：检查必需参数userId是否存在
2. **查询条件构建**：
   - 字符串查询：构建where字符串条件
   - 对象查询：构建查询对象条件
3. **查询执行**：
   - 优先尝试字符串查询
   - 失败时降级为对象查询
4. **结果处理**：
   - 按创建时间降序排序
   - 限制返回记录数量
5. **错误处理**：
   - 记录详细的错误信息
   - 提供两种查询方式的错误详情

### 输出数据
- 操作成功状态
- 情绪记录数据数组
- 微信上下文信息（openid、appid、unionid）
- 错误信息（如果有）

## 涉及的数据库集合

### emotionRecords（情绪记录表）
```javascript
{
  _id: "记录ID",
  userId: "用户ID",
  roleId: "角色ID（可选）",
  createTime: "创建时间",
  
  // 情感分析相关字段
  analysis: {
    type: "情感类型",
    intensity: 0.8,
    valence: 0.5,
    arousal: 0.6,
    trend: "上升",
    primary_emotion: "主要情感",
    secondary_emotions: ["次要情感1", "次要情感2"],
    attention_level: "高",
    radar_dimensions: {
      trust: 0.7,
      openness: 0.6,
      resistance: 0.3,
      stress: 0.4,
      control: 0.8
    },
    topic_keywords: ["关键词1", "关键词2"],
    emotion_triggers: ["触发词1", "触发词2"],
    suggestions: ["建议1", "建议2"],
    summary: "情感总结"
  },
  originalText: "原始文本"
}
```

## API接口

### 请求格式
```javascript
{
  userId: "用户ID", // 必需
  roleId: "角色ID", // 可选
  limit: 20 // 可选，默认20条
}
```

### 响应格式（成功）
```javascript
{
  success: true,
  data: [
    {
      _id: "记录ID",
      userId: "用户ID",
      roleId: "角色ID",
      analysis: {
        // 情感分析数据
      },
      originalText: "原始文本",
      createTime: "创建时间"
    }
  ],
  openid: "用户openid",
  appid: "小程序appid",
  unionid: "用户unionid"
}
```

### 响应格式（失败）
```javascript
{
  success: false,
  error: "错误信息",
  // 或者包含详细错误信息
  error: {
    stringQueryError: "字符串查询错误",
    objectQueryError: "对象查询错误"
  },
  openid: "用户openid",
  appid: "小程序appid",
  unionid: "用户unionid"
}
```

## 查询方式

### 1. 字符串查询
使用字符串形式的where条件，格式：`userId=="用户ID" && roleId=="角色ID"`

### 2. 对象查询
使用对象形式的查询条件，格式：
```javascript
{
  userId: "用户ID",
  roleId: "角色ID"
}
```

## 错误处理

### 参数验证错误
- 缺少必要参数userId
- 返回明确的错误信息

### 查询错误
- 字符串查询失败时自动降级到对象查询
- 记录两种查询方式的错误详情
- 不影响用户获取错误信息

### 系统错误
- 捕获所有异常
- 返回详细的错误信息和堆栈

## 性能优化

- 限制查询结果数量（默认20条）
- 按时间降序排序，优先返回最新记录
- 降级查询机制提高成功率
- 避免查询过多数据

## 使用场景

1. **用户情绪历史**：查询指定用户的情绪记录
2. **角色情绪分析**：查询用户与特定角色的情绪交互
3. **数据展示**：为前端提供情绪数据支持
4. **统计分析**：获取情绪分析原始数据

## 注意事项

- 优先使用字符串查询，失败时降级到对象查询，以提高兼容性。
- 返回的`createTime`是数据库服务器时间格式，前端展示时可能需要转换。
- 调用此函数需要保证小程序端已正确初始化，且数据库`emotionRecords`集合存在并设置了正确的读权限。