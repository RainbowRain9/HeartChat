# User 云函数文档

## 功能描述

User云函数是一个**用户管理服务**，提供用户信息的获取、更新、用户画像分析、兴趣管理等功能，支持基于智谱AI的智能化用户特征分析。

## 文件结构

- **`index.js`** - 主入口文件，实现用户管理API接口
- **`userPerception_new.js`** - 用户画像处理模块（智谱AI版）
- **`userInterests.js`** - 用户兴趣处理模块
- **`createIndexes.js`** - 数据库索引创建模块
- **`package.json`** - 项目配置文件

## 主要流程

### 1. 用户信息获取流程
```
接收请求 → 验证用户ID → 查询用户基础信息 → 查询用户统计 → 查询用户资料 → 查询用户配置 → 整合信息 → 返回完整用户数据
```

### 2. 用户画像分析流程
```
用户消息 → 智谱AI分析 → 特征提取 → 画像生成 → 数据整合 → 更新用户画像
```

### 3. 用户兴趣管理流程
```
关键词数据 → 兴趣分析 → 权重计算 → 分类处理 → 兴趣更新 → 统计同步
```

## 数据流向

### 输入数据
- 用户ID和操作类型
- 用户更新资料（用户名、头像、基本信息等）
- 用户消息内容（用于画像分析）
- 兴趣关键词数据

### 处理过程
1. **基础信息管理**：用户资料的CRUD操作
2. **画像分析**：通过智谱AI分析用户特征
3. **兴趣管理**：分析和管理用户兴趣
4. **数据整合**：统一用户数据视图
5. **统计更新**：实时更新用户统计数据

### 输出数据
- 用户完整信息
- 画像分析结果
- 兴趣统计数据
- 操作结果反馈

## 涉及的数据库集合

### 1. user_base（用户基础信息表）
```javascript
{
  _id: "记录ID",
  user_id: "用户ID（7位数字）",
  openid: "微信openid",
  username: "用户名",
  avatar_url: "头像URL",
  user_type: 1, // 1-普通用户，2-VIP用户，3-管理员
  status: 1, // 1-启用，0-禁用
  created_at: "创建时间",
  updated_at: "更新时间"
}
```

### 2. user_profile（用户资料表）
```javascript
{
  _id: "记录ID",
  user_id: "用户ID",
  gender: "性别",
  country: "国家",
  province: "省份",
  city: "城市",
  bio: "个人简介",
  birthday: "生日",
  interests: ["兴趣1", "兴趣2"],
  personality: ["性格特点1", "性格特点2"],
  created_at: "创建时间",
  updated_at: "更新时间"
}
```

### 3. user_stats（用户统计表）
```javascript
{
  _id: "记录ID",
  stats_id: "统计ID",
  user_id: "用户ID",
  openid: "微信openid",
  chat_count: 0, // 聊天次数
  solved_count: 0, // 解决问题数
  rating_avg: 0, // 平均评分
  active_days: 1, // 活跃天数
  last_active: "最后活跃时间",
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

### 4. user_config（用户配置表）
```javascript
{
  _id: "记录ID",
  user_id: "用户ID",
  theme: "主题设置",
  language: "语言设置",
  notification_enabled: true, // 通知开关
  privacy_settings: {
    profile_visible: true, // 资料可见性
    activity_visible: true // 活动可见性
  },
  chat_settings: {
    default_model: "默认模型",
    memory_length: 20, // 记忆长度
    auto_save: true // 自动保存
  },
  report_settings: {
    notification_enabled: true, // 报告通知
    frequency: "daily" // 报告频率
  },
  created_at: "创建时间",
  updated_at: "更新时间"
}
```

### 5. user_interests（用户兴趣表）
```javascript
{
  _id: "记录ID",
  user_id: "用户ID",
  keywords: [
    {
      word: "关键词",
      weight: 1.5, // 权重
      category: "分类",
      emotion_score: 0.6, // 情感评分
      last_updated: "更新时间"
    }
  ],
  interests: [
    {
      category: "兴趣分类",
      weight: 3.0, // 权重
      keywords: ["关键词1", "关键词2"]
    }
  ],
  created_at: "创建时间",
  last_updated: "最后更新时间"
}
```

## API接口

### 主要操作类型

#### 1. getInfo - 获取用户信息
```javascript
{
  action: 'getInfo',
  userId: "用户ID"
}
```

#### 2. updateProfile - 更新用户资料
```javascript
{
  action: 'updateProfile',
  userId: "用户ID",
  username: "用户名（可选）",
  avatarUrl: "头像URL（可选）",
  gender: "性别（可选）",
  country: "国家（可选）",
  province: "省份（可选）",
  city: "城市（可选）",
  bio: "个人简介（可选）"
}
```

#### 3. updateConfig - 更新用户配置
```javascript
{
  action: 'updateConfig',
  userId: "用户ID",
  config: {
    theme: "主题设置",
    language: "语言设置",
    notification_enabled: true,
    // 其他配置项...
  }
}
```

#### 4. analyzeUserPerception - 分析用户画像
```javascript
{
  action: 'analyzeUserPerception',
  userId: "用户ID",
  messages: [
    {
      role: "user",
      content: "用户消息内容"
    }
  ]
}
```

#### 5. updateUserInterests - 更新用户兴趣
```javascript
{
  action: 'updateUserInterests',
  userId: "用户ID",
  keywords: [
    {
      word: "关键词",
      weight: 1.5,
      category: "分类"
    }
  ]
}
```

### 响应格式

#### 标准成功响应
```javascript
{
  success: true,
  data: {
    // 返回的数据
  },
  message: "操作成功"
}
```

#### 用户信息响应
```javascript
{
  success: true,
  data: {
    user: {
      userId: "1234567",
      username: "用户名",
      avatarUrl: "头像URL",
      userType: 1,
      status: 1,
      gender: "性别",
      country: "国家",
      province: "省份",
      city: "城市",
      bio: "个人简介",
      stats: {
        chat_count: 10,
        solved_count: 5,
        rating_avg: 4.5,
        active_days: 7,
        // 其他统计字段...
      }
    }
  }
}
```

#### 用户画像响应
```javascript
{
  success: true,
  perception: {
    personality_traits: ["性格特点1", "性格特点2"],
    communication_style: "沟通风格",
    interests: ["兴趣1", "兴趣2"],
    emotional_patterns: ["情感模式1", "情感模式2"],
    values_and_beliefs: ["价值观1", "价值观2"],
    goals_and_aspirations: ["目标1", "目标2"]
  }
}
```

## 智能特性

### 1. AI驱动的用户画像
- 使用智谱AI分析用户消息
- 提取性格特征和沟通风格
- 识别兴趣和情感模式
- 智能化的用户特征分析

### 2. 兴趣权重管理
- 动态计算兴趣权重
- 基于使用频率的权重调整
- 兴趣分类和聚类
- 实时兴趣统计更新

### 3. 个性化配置
- 主题和语言设置
- 通知和隐私控制
- 聊天参数配置
- 报告设置管理

## 错误处理

### 参数验证错误
- 用户ID不存在
- 参数格式不正确
- 缺少必要参数

### 系统错误
- 数据库操作失败
- AI调用失败
- 权限验证失败

### 降级处理
- AI不可用时使用本地算法
- 部分功能失败不影响整体
- 详细的错误日志记录

## 性能优化

### 数据优化
- 索引优化查询性能
- 分页加载大量数据
- 缓存热门用户信息

### AI调用优化
- 智能缓存分析结果
- 批量处理用户消息
- 错误重试机制

### 数据库优化
- 复合索引支持复杂查询
- 数据分区提高访问速度
- 定期清理过期数据

## 安全特性

### 权限控制
- 用户只能操作自己的数据
- 管理员特殊权限验证
- 敏感信息访问控制

### 数据安全
- 输入数据验证和清理
- 敏感信息加密存储
- 操作日志记录

## 使用场景

1. **用户中心**：提供完整的用户信息管理
2. **个性化推荐**：基于画像和兴趣的推荐
3. **体验优化**：个性化配置提升用户体验
4. **数据分析**：用户行为和特征分析

## 扩展功能

### 1. 高级画像分析
- 深度学习模型分析
- 多维度特征提取
- 时序行为分析

### 2. 社交功能
- 用户关系管理
- 兴趣匹配推荐
- 社交行为分析

### 3. 增值服务
- VIP用户特权
- 个性化报告
- 高级分析功能

## 注意事项

- 需要配置智谱AI API密钥
- 用户画像需要定期更新维护
- 兴趣权重算法需要持续优化
- 隐私设置需要严格遵守
- 数据统计需要实时同步