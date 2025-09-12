# user_config（用户配置表）

## 表说明
存储用户的个性化配置信息，包括界面设置、功能偏好、通知管理、隐私控制等多维度配置项。

## 字段结构

```javascript
{
  _id: "记录ID",                    // string, 主键，自动生成
  user_id: "用户ID",                 // string, 关联user_base表
  
  // 基础设置
  theme: "light",                    // string, 主题：light/dark/auto
  language: "zh-CN",                // string, 语言设置
  timezone: "Asia/Shanghai",          // string, 时区设置
  
  // 通知设置
  notification_enabled: true,        // boolean, 通知总开关
  email_notifications: true,        // boolean, 邮件通知
  push_notifications: true,         // boolean, 推送通知
  
  // 隐私设置
  privacy_settings: {               // object, 隐私控制
    profile_visible: true,           // boolean, 资料可见性
    activity_visible: true,          // boolean, 活动可见性
    show_online_status: true,        // boolean, 在线状态显示
    allow_messages: true            // boolean, 接收消息权限
  },
  
  // 聊天设置
  chat_settings: {                  // object, 聊天配置
    default_model: "gemini",        // string, 默认AI模型
    memory_length: 20,               // number, 记忆长度
    auto_save: true,                // boolean, 自动保存
    message_sound: true,             // boolean, 消息提示音
    typing_indicator: true,          // boolean, 输入指示器
    auto_translate: false,           // boolean, 自动翻译
    translation_target: "en"        // string, 翻译目标语言
  },
  
  // 报告设置
  report_settings: {                // object, 报告配置
    notification_enabled: true,      // boolean, 报告通知
    frequency: "daily",             // string, 报告频率：daily/weekly/monthly
    report_time: "20:00",            // string, 报告推送时间
    include_charts: true,            // boolean, 包含图表
    include_suggestions: true        // boolean, 包含建议
  },
  
  // 高级设置
  advanced_settings: {               // object, 高级配置
    data_collection: true,          // boolean, 数据收集
    personalized_ads: false,         // boolean, 个性化广告
    analytics_sharing: false,       // boolean, 分析数据共享
    beta_features: false             // boolean, 测试功能
  },
  
  created_at: "创建时间",            // date, 配置创建时间
  updated_at: "更新时间"             // date, 配置更新时间
}
```

## 索引建议
- **唯一索引**：user_id
- **复合索引**：theme + language
- **复合索引**：notification_enabled + updated_at
- **复合索引**：report_settings.frequency
- **复合索引**：privacy_settings.profile_visible

## 关联关系
- **一对一**：user_config.user_id → user_base.user_id

## 使用场景
1. 个性化体验
2. 功能偏好管理
3. 隐私控制
4. 通知管理

## 数据示例
```javascript
{
  "_id": "config_001",
  "user_id": "1234567",
  "theme": "light",
  "language": "zh-CN",
  "timezone": "Asia/Shanghai",
  "notification_enabled": true,
  "email_notifications": true,
  "push_notifications": true,
  "privacy_settings": {
    "profile_visible": true,
    "activity_visible": true,
    "show_online_status": true,
    "allow_messages": true
  },
  "chat_settings": {
    "default_model": "gemini",
    "memory_length": 20,
    "auto_save": true,
    "message_sound": true,
    "typing_indicator": true,
    "auto_translate": false,
    "translation_target": "en"
  },
  "report_settings": {
    "notification_enabled": true,
    "frequency": "daily",
    "report_time": "20:00",
    "include_charts": true,
    "include_suggestions": true
  },
  "advanced_settings": {
    "data_collection": true,
    "personalized_ads": false,
    "analytics_sharing": false,
    "beta_features": false
  },
  "created_at": "2025-01-01T10:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

## 配置项说明

### 主题设置
- **light**：浅色主题
- **dark**：深色主题
- **auto**：跟随系统

### 语言设置
- **zh-CN**：简体中文
- **zh-TW**：繁体中文
- **en**：英语
- **ja**：日语

### 报告频率
- **daily**：每日报告
- **weekly**：每周报告
- **monthly**：每月报告

### AI模型选项
- **gemini**：Google Gemini
- **zhipu**：智谱AI
- **openai**：OpenAI GPT

## 默认值策略
1. 新用户注册时创建默认配置
2. 系统更新时保持向后兼容
3. 新增配置项提供默认值
4. 支持配置重置功能

## 注意事项
- 配置变更需要实时生效
- 敏感配置需要权限验证
- 建议提供配置导入导出功能
- 隐私设置需要特别保护