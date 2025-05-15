# HeartChat 开发文档

## 一、项目概述

心语精灵 是一款基于微信小程序云开发的 AI 情感陪伴与情商提升应用。通过与可定制的 AI 角色进行对话，用户可以在安全私密的环境中倾诉心事、整理思绪，并通过实时情感分析获得反馈，逐步提升自我认知和人际交往能力。

### 1.1 核心价值

- **情感倾诉**：提供安全的情感表达空间
- **角色管理**：用户可以创建和管理自己的角色
- **角色互动**：通过多样化的角色满足不同情感需求
- **情绪分析**：实时分析用户情绪，提供情绪建议
- **情绪跟踪**：记录和分析情绪变化
- **每日心情报告**：基于对话分析生成个性化心情总结和运势建议
- **用户画像**：基于用户对话内容生成用户画像（兴趣、性格、价值观等）
- **用户中心**：用户可以查看自己的信息和统计数据
- **系统设置**：用户可以设置自己的偏好和通知

### 1.2 目标用户

- 需要情感倾诉的用户
- 寻求心理支持的用户
- 想要记录心情变化的用户
- 希望获得建议和指导的用户
- 关注个人情绪和兴趣发展的用户

## 二、技术架构

### 2.1 前端技术

- 微信小程序原生框架 (JavaScript)
- 组件化开发 (`components/` 目录下)
- WXS / SASS (按需使用)
- ECharts 图表库 (用于数据可视化)

### 2.2 后端技术

- 微信云开发
  - 云函数 (Node.js)
  - 云数据库 (MongoDB 风格)
  - 云存储 (用于存储用户头像等)
  - 云调用 (订阅消息等)

### 2.3 AI 服务

- **对话生成:** 多模型支持
  - 智谱AI (GLM-4-Flash)
  - Google Gemini (gemini-2.5-flash-preview-04-17)
  - OpenAI (GPT-3.5-Turbo, GPT-4, GPT-4-Turbo)
  - CloseAI (deepseek-ai/DeepSeek-V3-0324)
  - Crond API (o3-mini, o3-plus)
- **情感分析:** 智谱AI (GLM-4-Flash)
- **关键词提取:** 智谱AI (GLM-4-Flash)
- **词向量生成:** 智谱AI (Embedding-3)
- **用户画像:** 智谱AI (GLM-4-Flash) - 已增强
- **关键词分类:** 智谱AI (GLM-4-Flash) - 新增
- **关键词情感关联:** 智谱AI (GLM-4-Flash) - 新增
- **语音输入:** 微信小程序原生录音API

### 2.4 性能优化

- **分包加载:** 将小程序拆分为主包和分包，减少首次启动时间
- **本地缓存:** 使用本地缓存存储聊天记录和用户数据，减少网络请求
- **懒加载:** 延迟加载非关键资源，提高页面加载速度
- **图片优化:** 压缩图片，使用适当的图片格式，减少资源大小
- **日志优化:** 通过控制日志输出级别和优化错误处理方式，减少不必要的日志输出
- **组件复用:** 使用组件化开发，提高代码复用率和维护性

### 2.5 项目结构

```
HeartChat/
├── cloudfunctions/           # 云函数目录
│   ├── analysis/             # 情感分析云函数
│   │   ├── aiModelService.js
│   │   ├── aiModelService_part2.js
│   │   ├── aiModelService_part3.js
│   │   ├── index.js
│   │   ├── keywordClassifier.js
│   │   ├── keywordEmotionLinker.js
│   │   ├── keywords.js
│   │   ├── package.json
│   │   ├── test.js
│   │   └── userInterestAnalyzer.js
│   ├── chat/                 # 聊天相关云函数
│   │   ├── aiModelService.js
│   │   ├── index.js
│   │   └── package.json
│   ├── clearDatabase/        # 数据库清理云函数
│   │   ├── index.js
│   │   └── package.json
│   ├── emotion/              # 情感记录相关云函数 (旧版，可考虑整合或移除)
│   │   ├── index.js
│   │   └── package.json
│   ├── generateDailyReports/ # 生成每日报告云函数
│   │   ├── config.json
│   │   ├── index.js
│   │   └── package.json
│   ├── getEmotionRecords/    # 获取情感记录云函数 (可考虑整合到analysis或emotion云函数)
│   │   ├── index.js
│   │   └── package.json
│   ├── getIflytekSttUrl/     # 获取科大讯飞STT授权URL (如使用科大讯飞语音服务)
│   │   ├── index.js
│   │   └── package.json
│   ├── getRoleInfo/          # 获取角色信息云函数 (可考虑整合到roles云函数)
│   │   ├── index.js
│   │   └── package.json
│   ├── httpRequest/          # 通用HTTP请求云函数 (用于调用第三方API)
│   │   ├── index.js
│   │   ├── package.json
│   │   └── test.js
│   ├── initReportCollections/ # 初始化报告集合 (可能是一次性脚本)
│   │   ├── index.js
│   │   └── package.json
│   ├── login/                # 用户登录云函数
│   │   ├── index.js
│   │   └── package.json
│   ├── roles/                # 新版角色管理云函数
│   │   ├── index.js
│   │   ├── init-roles.js     # 角色初始化脚本
│   │   ├── memoryManager.js  # 角色记忆管理
│   │   ├── package.json
│   │   ├── promptGenerator.js # 提示词生成器
│   │   ├── test-zhipu.js     # 测试智谱AI接口
│   │   └── userPerception.js # 用户感知/画像相关
│   ├── testDatabase/         # 数据库测试云函数
│   │   ├── index.js
│   │   └── package.json
│   └── user/                 # 用户管理云函数
│       ├── createIndexes.js  # 创建数据库索引脚本
│       ├── index.js
│       ├── package.json
│       ├── userInterests.js  # 用户兴趣相关
│       └── userPerception_new.js # 新版用户感知/画像相关
│
├── miniprogram/              # 小程序前端代码
│   ├── __tests__/            # 测试目录
│   │   └── app.test.ts
│   ├── components/           # 公共组件
│   │   ├── chat-bubble/      # 聊天气泡组件
│   │   ├── chat-input/       # 聊天输入组件
│   │   ├── emotion-analysis/ # 情感分析组件
│   │   ├── emotion-card/     # 情感卡片组件
│   │   ├── emotion-dashboard/ # 情感仪表盘组件
│   │   ├── emotion-history/  # 情感历史组件
│   │   ├── emotion-panel/    # 情感面板组件
│   │   ├── emotion-pie/      # 情感饼图组件
│   │   ├── interest-tag-cloud/ # 兴趣标签云组件
│   │   ├── login/            # 登录组件
│   │   ├── model-selector/   # AI模型选择器组件
│   │   ├── role-card/        # 角色卡片组件
│   │   └── structured-role-card/ # 结构化角色卡片
│   │
│   ├── config/               # 配置文件目录
│   │   └── index.js
│   ├── images/               # 图片资源
│   │   ├── avatars/
│   │   ├── category/
│   │   │   ├── ai/
│   │   │   └── tools/
│   │   ├── functions/
│   │   │   ├── chat1/
│   │   │   └── operate/
│   │   ├── icons/
│   │   ├── navigation/
│   │   │   ├── header/
│   │   │   └── tabbar/
│   │   │       └── dark/
│   │   ├── tabbar/
│   │   │   └── dark/
│   │   └── 项目图标/
│   │
│   ├── models/               # 数据模型 (前端)
│   │
│   ├── packageChat/          # 聊天相关分包
│   │   ├── components/       # 聊天分包内部组件
│   │   │   ├── chat-bubble/
│   │   │   └── chat-input/
│   │   └── pages/
│   │       ├── chat/             # 聊天页面
│   │       └── emotion-analysis/ # 聊天内嵌的情感分析页面
│   │
│   ├── packageEmotion/       # 情感分析相关分包
│   │   └── pages/
│   │       ├── daily-report/     # 每日情绪报告页面
│   │       └── emotion-history/  # 情绪历史页面
│   │
│   ├── pages/                # 主包页面
│   │   ├── agreement/        # 协议页面 (隐私、服务条款)
│   │   ├── home/             # 首页
│   │   ├── keywordTest/      # 关键词测试页面
│   │   ├── prompt-editor/    # 提示词编辑器页面
│   │   ├── role-detail/      # 角色详情页面 (可能已整合或废弃)
│   │   ├── role-editor/      # 角色编辑页面
│   │   ├── role-select/      # 角色选择页面
│   │   ├── role-templates/   # 角色模板页面 (可能已整合或废弃)
│   │   ├── settings/         # 设置页面
│   │   │   ├── model-comparison/ # 模型对比页面
│   │   │   └── model-settings/   # 模型设置页面
│   │   ├── test-gemini/      # Gemini模型测试页面
│   │   ├── user/             # 用户中心页面
│   │   │   └── profile/      # 用户资料页面
│   │   └── welcome/          # 欢迎/引导页面
│   │
│   ├── services/             # 业务服务封装
│   │   ├── chatCacheService.js
│   │   ├── cloudFuncCaller.js
│   │   ├── emotionService.js
│   │   ├── eventBus.js
│   │   ├── focusAnalysisService.js
│   │   ├── imageService.js
│   │   ├── keywordService.js
│   │   ├── modelService.js
│   │   ├── personalityService.js
│   │   ├── reportService.js
│   │   ├── userInterestsService.js
│   │   ├── userService.js
│   │   └── voiceService.js
│   │
│   ├── styles/               # 全局样式
│   │   └── iconfont.wxss
│   ├── utils/                # 工具函数
│   │   ├── auth.js
│   │   ├── date.js
│   │   ├── emotion.js
│   │   ├── format.js
│   │   ├── imageService.js (重复, services中已有)
│   │   ├── request.js
│   │   ├── stats.js
│   │   └── storage.js
│   │
│   ├── app.js                # 小程序入口文件
│   ├── app.json              # 小程序配置文件
│   ├── app.wxss              # 小程序全局样式
│   ├── sitemap.json          # 站点地图配置
│   └── theme.json            # 主题配置文件
│
├── .eslintrc.js              # ESLint配置文件
├── .gitignore                # Git忽略文件
├── .prettierrc.js            # Prettier配置文件
├── package.json              # 项目依赖配置
├── project.config.json       # 项目配置文件
├── README.md                 # 项目说明文档
└── todo.md                   # 待办事项
```

## 三、数据库设计

### 3.1 集合设计

| 集合名称         | 用途         | 关键字段                                                               |
| ---------------- | ------------ | ---------------------------------------------------------------------- |
| `users`          | 用户信息     | openid, nickName, avatarUrl, createTime, lastLoginTime, reportSettings |
| `roles`          | 角色信息     | name, avatar, description, personality, prompt, creator                |
| `chats`          | 聊天会话信息 | roleId, userId, lastMessage, messageCount, updateTime                  |
| `messages`       | 消息详情     | chatId, content, sender, timestamp, emotionData                        |
| `emotionRecords` | 情感分析记录 | userId, chatId, type, intensity, timestamp, keywords                   |
| `roleUsage`      | 角色使用统计 | userId, roleId, usageCount, lastUsed                                   |
| `userReports`    | 用户每日报告 | userId, date, emotionSummary, keywords, interests, fortune             |
| `userInterests`  | 用户兴趣     | userId, interests{name, weight, updateTime}                            |
| `sys_config`     | 系统配置     | configKey, configValue, description                                    |

### 3.2 索引设计

为提高查询性能，需要为以下字段创建索引：

- `users`: openid (唯一索引)
- `roles`: creator, category, isSystem
- `chats`: userId, roleId
- `messages`: chatId, timestamp
- `emotionRecords`:
  - userId (用于按用户查询情绪记录)
  - createTime (用于按时间排序)
  - roleId (用于按角色筛选)
  - userId + createTime (组合索引，用于按用户查询并按时间排序)
  - userId + roleId (组合索引，用于按用户和角色筛选)
- `userReports`: userId, date

## 四、功能模块设计

### 4.1 用户系统

#### 登录流程

1. 用户点击登录按钮
2. 调用 `wx.login()` 获取 code
3. 调用 `login` 云函数，获取 openid
4. 保存用户信息到 `users` 集合
5. 返回用户信息和登录状态

#### 用户数据库设计

**1. 用户基础信息表 (user_base)**
```javascript
{
  _id: "string", // 系统自动生成的唯一ID
  user_id: "string", // 用户ID (与openid关联)
  openid: "string", // 微信OpenID
  username: "string", // 用户昵称
  avatar_url: "string", // 头像URL
  user_type: number, // 用户类型 (1普通/2企业/3管理员)
  status: number, // 账号状态 (0禁用/1启用)
  created_at: Date, // 创建时间
  updated_at: Date // 更新时间
}
```

**2. 用户详细信息表 (user_profile)**
```javascript
{
  _id: "string", // 系统自动生成的唯一ID
  user_id: "string", // 用户ID (与user_base关联)
  gender: number, // 性别 (0未知/1男/2女)
  country: "string", // 国家
  province: "string", // 省份
  city: "string", // 城市
  bio: "string", // 个人简介
  tags: Array, // 用户标签
  created_at: Date, // 创建时间
  updated_at: Date // 更新时间
}
```

**3. 用户统计信息表 (user_stats)**
```javascript
{
  _id: "string", // 系统自动生成的唯一ID
  stats_id: "string", // 统计ID
  user_id: "string", // 用户ID (与user_base关联)
  openid: "string", // 微信OpenID
  chat_count: number, // 对话次数
  solved_count: number, // 解决问题数
  rating_avg: number, // 平均评分
  active_days: number, // 活跃天数
  last_active: Date, // 最后活跃时间
  daily_report_count: number, // 每日报告数
  created_at: Date, // 创建时间
  updated_at: Date // 更新时间
}
```

**4. 用户配置表 (user_config)**
```javascript
{
  _id: "string", // 系统自动生成的唯一ID
  user_id: "string", // 用户ID (与user_base关联)
  dark_mode: boolean, // 是否启用暗黑模式
  notification_enabled: boolean, // 是否启用通知
  language: "string", // 语言设置
  created_at: Date, // 创建时间
  updated_at: Date // 更新时间
}
```

**5. 用户兴趣表 (user_interests)**
```javascript
{
  _id: "string", // 系统自动生成的唯一ID
  user_id: "string", // 用户ID (与user_base关联)
  interests: Array, // 兴趣标签数组 (Array<Object{tag: String, score: Number}>)
  aggregated_interest_vector: Array, // 用户聚合兴趣向量 (Array<Number>)
  created_at: Date, // 创建时间
  updated_at: Date // 更新时间
}
```

#### 用户中心页面

- 显示用户基本信息
- 展示用户统计数据
- 显示情绪概览和个性分析
- 提供角色管理入口
- 提供情绪历史入口
- 提供系统设置入口
- 提供退出登录功能

#### 个人资料页面

- 显示并允许编辑用户详细信息
- 显示用户性格分析和兴趣标签
- 提供头像上传功能

### 4.2 角色系统

#### 角色数据结构

```javascript
{
  _id: "角色ID",
  name: "角色名称",
  avatar: "头像URL",
  description: "角色描述",
  personality: ["性格特点1", "性格特点2"],
  prompt: "给AI的提示词",
  creator: "创建者ID", // 系统角色为"system"
  createTime: Date,
  updateTime: Date,
  status: 1 // 1:启用 0:禁用
}
```

#### 角色管理功能

- 浏览预设角色
- 创建自定义角色
- 编辑现有角色
- 设置默认角色

### 4.3 聊天系统

#### 对话流程

1. 用户发送消息
2. 前端将消息显示在对话界面
3. 调用 `chat` 云函数的 `sendMessage` 功能处理消息
4. 云函数将用户消息存储到 `messages` 集合
5. 云函数构建提示词，调用智谱AI (GLM-4-Flash) API 生成回复
6. 云函数将 AI 回复存储到 `messages` 集合
7. 云函数分析用户情绪，并将结果存储到 `emotion_records` 集合
8. 前端接收 AI 回复和情绪分析结果并显示
9. 在用户消息下方自动显示情绪分析标签
10. 更新情感分析面板

#### 聊天云函数功能

- **sendMessage**: 发送消息并获取AI回复
- **getChatHistory**: 获取聊天历史记录，支持分页加载
- **saveChatHistory**: 保存聊天记录
- **deleteMessage**: 删除指定消息
- **clearChatHistory**: 清空聊天记录
- **checkChatExists**: 检查是否存在与指定角色的历史聊天记录

#### 多模型集成

- 支持多种AI模型：
  - 智谱AI (GLM-4-Flash)：中文理解能力强，适合中文场景
  - Google Gemini (gemini-2.5-flash-preview-04-17)：多模态能力强，理解力和创造力较好
  - OpenAI (GPT-3.5-Turbo, GPT-4, GPT-4-Turbo)：通用能力强，英文表现尤其出色
  - CloseAI (deepseek-ai/DeepSeek-V3-0324)：提供DeepSeek系列模型，具有出色的中文理解能力
  - Crond API (o3-mini, o3-plus)：提供多种模型选择，性能与价格平衡
- 在聊天界面可以实时切换不同的AI模型
- 支持两级选择（模型平台和具体模型）
- 基于角色提示词和历史消息构建上下文
- 在回复中包含情绪分析结果
- 安全处理API密钥，使用云函数环境变量存储
- 统一的接口设计，确保不同模型的一致使用体验
- 模块化设计，每个模型平台有独立的处理模块

#### 聊天界面设计

- 卡片式聊天界面，符合iOS设计规范
- 支持角色切换和角色信息显示
- 消息气泡区分用户和AI，并显示时间戳
- 消息气泡使用圆角设计，并添加适当阴影增强立体感
- 消息气泡下方自动显示情绪分析标签，标签居中显示
- 输入框支持文本输入和发送，并始终保持在最上层
- 支持语音输入功能，点击语音按钮切换到语音输入模式
- 语音输入模式下显示"按住说话"按钮，支持按住录音、上滑取消、点击停止
- 语音录音界面显示波形动画和录音时间，提供视觉反馈
- 支持消息分页加载和滚动到底部
- 最后一条消息不会被输入框遮挡，确保良好的用户体验
- 集成情绪分析结果显示
- 智能欢迎语系统，根据角色关系类型生成个性化欢迎语
- 智能判断是否有历史聊天记录，有则加载历史记录，无则显示欢迎语
- 支持暗夜模式，自动跟随系统设置
- 键盘弹出优化，确保导航栏和消息内容不被遮挡
- 支持在聊天界面实时切换不同的AI模型

#### 聊天记录缓存与加载

- **本地缓存**: 将聊天记录保存到本地缓存，减少网络请求，提高加载速度
- **下拉刷新**: 通过下拉刷新获取最新消息
- **上拉加载**: 通过上拉加载更多历史消息
- **离线访问**: 即使在网络不稳定的情况下，也能查看历史聊天记录
- **自动同步**: 在网络恢复后自动同步最新消息
- **缓存管理**: 自动清理旧缓存，避免占用过多存储空间

#### 键盘弹出优化

- **键盘高度监听**: 使用 `wx.onKeyboardHeightChange` API 监听键盘高度变化
- **动态调整布局**: 根据键盘高度动态调整聊天容器高度
- **自动滚动**: 键盘弹出时自动滚动到最新消息
- **导航栏固定**: 确保导航栏始终可见，不会被键盘遮挡
- **输入框优化**: 禁用系统默认的键盘位置调整，提供更好的输入体验

### 4.4 情感分析系统

#### 情感分析流程

1. 用户发送消息后，调用 `analysis` 云函数
2. 云函数调用智谱AI (GLM-4-Flash) API进行情感分析
3. 云函数将分析结果存储到 `emotionRecords` 集合
4. 前端获取分析结果并更新情感面板
5. 前端自动在用户消息下方显示情绪分析标签
6. 显示情感类型、强度和建议

#### 关键词提取流程

1. 用户发送消息后，调用 `analysis` 云函数的关键词提取功能
2. 云函数调用智谱AI (GLM-4-Flash) API提取关键词和权重
3. 将关键词与情感分析结果关联，存储到数据库
4. 前端展示关键词云或关键词列表
5. 基于关键词聚类分析用户兴趣和关注点

#### 关键词分类流程

1. 关键词提取后，调用 `analysis` 云函数的关键词分类功能
2. 云函数调用智谱AI (GLM-4-Flash) API对关键词进行分类
3. 将分类结果存储到数据库，关联到用户兴趣记录
4. 前端根据分类结果展示不同颜色的关键词标签
5. 支持批量分类和单个分类模式

#### 关键词分类数据存储

关键词分类数据存储在 `userInterests` 集合中，包含两个主要部分：

1. **keywords 数组**：存储每个关键词的详细信息，包括关键词文本、权重、分类、情感分数等。

2. **categories 数组**：存储分类统计数据，包括分类名称、计数、首次出现时间和最后更新时间等。

每次更新关键词时，系统会同时更新这两个数组，确保数据一致性。这样设计可以快速获取用户的兴趣分类统计数据，而不需要每次都重新计算。

#### 关键词情感关联流程

1. 情感分析完成后，调用关键词情感关联功能
2. 将关键词与情感分析结果关联，计算关键词的情感分数
3. 使用加权平均算法更新关键词的情感分数，确保分数能够反映用户的最新情感倾向
4. 按情感倾向（正面、负面、中性）对关键词进行分类
5. 生成关键词情感统计数据，用于前端展示

#### 词向量生成流程

1. 调用 `analysis` 云函数的词向量功能
2. 云函数调用智谱AI (Embedding-3) API生成词向量
3. 将词向量用于聚类分析和相似度计算

#### 情感可视化

- 情感类型分布饼图
- 情感强度趋势图
- 关键词词云展示
- 兴趣主题聚类分析
- 关键词情感统计展示

#### 兴趣标签云组件

兴趣标签云组件（`components/interest-tag-cloud/`）用于展示用户的兴趣标签，支持自动加载、刷新和点击交互。

- **自动加载**：组件初始化时自动加载用户兴趣数据
- **刷新功能**：支持手动刷新标签云数据
- **点击交互**：支持点击标签查看详情
- **自定义样式**：支持自定义标签颜色和字体大小
- **分类展示**：支持按分类展示标签，不同分类使用不同颜色

#### 关键词情感统计组件

关键词情感统计组件（`components/keyword-emotion-stats/`）用于展示用户关键词的情感统计数据，帮助用户了解自己对不同话题的情感倾向。

- **情感分类**：将关键词分为正面、负面和中性三类
- **自动加载**：组件初始化时自动加载关键词情感统计数据
- **刷新功能**：支持手动刷新统计数据
- **点击交互**：支持点击关键词查看详情
- **排序功能**：根据情感分数和权重排序，突出重要关键词

#### 情绪历史页面

情绪历史页面（`packageEmotion/pages/emotion-history/`）是展示用户情绪历史记录的重要页面，包含以下功能：

- **时间范围选择**：支持一周、一个月、三个月、半年、一年等多种时间范围
- **情绪趋势图表**：直观展示不同情绪类型随时间的变化
- **情绪分布图表**：展示各种情绪类型的占比分布
- **情绪波动指数**：展示情绪波动指数，包括与上周的对比和变化原因分析
- **情绪日历**：以日历形式展示每天的主要情绪状态
- **最近情绪记录列表**：展示最近的情绪分析记录，包含角色名称、时间和情绪类型

数据获取和处理流程：

1. 页面加载时，先检查本地缓存
2. 如果缓存存在且未过期，使用缓存数据，同时在后台从数据库获取最新数据
3. 如果缓存不存在或已过期，从数据库获取数据
4. 处理数据，生成图表和列表
5. 将数据存入本地缓存，缓存过期时间为30分钟

用户交互：

1. 用户可以切换时间范围，查看不同时间段的情绪数据
2. 用户可以下拉刷新，强制从数据库获取最新数据
3. 用户可以点击最近情绪记录列表中的记录，跳转到对应的角色聊天页面或情绪分析详情页

### 4.5 每日心情报告系统

#### 报告生成流程

1. 定时触发器触发 `generateDailyReports` 云函数
2. 云函数遍历活跃用户，并调用 `analysis` 云函数的 `daily_report` 功能
3. `analysis` 云函数获取用户当日的情感记录和对话内容
4. 提取关键词并计算权重
5. 聚类关键词形成兴趣领域
6. 分析情绪变化和波动
7. 调用智谱AI (GLM-4-Flash) 生成个性化报告内容
8. 将报告保存到 `userReports` 集合
9. 更新用户兴趣数据到 `userInterests` 集合
10. 如果用户开启了通知，发送订阅消息通知

#### 报告页面设计

```
┌─────────────────────────┐
│  [日期选择] [分享按钮]  │
├─────────────────────────┤
│  今日心情总结           │
│  [情绪分布饼图]         │
│  [情绪趋势图]           │
├─────────────────────────┤
│  关注点分析             │
│  [关键词云]             │
├─────────────────────────┤
│  兴趣领域               │
│  [兴趣分布图]           │
├─────────────────────────┤
│  今日运势               │
│  宜: xxx                │
│  忌: xxx                │
│  幸运领域: xxx          │
├─────────────────────────┤
│  小建议                 │
│  1. xxx                 │
│  2. xxx                 │
├─────────────────────────┤
│  [励志语]               │
└─────────────────────────┘
```

#### 核心算法设计

##### 关键词权重计算

```javascript
// 关键词权重计算函数
function calculateKeywordWeight(keyword, context) {
  let weight = 0;

  // 词频权重 (TF-IDF)
  weight += calculateTfIdf(keyword, context) * 0.3;

  // 情感关联度
  weight += calculateEmotionalAssociation(keyword, context) * 0.25;

  // 时间衰减因子
  weight += calculateRecencyFactor(keyword, context) * 0.15;

  // 上下文重要性
  weight += calculateContextImportance(keyword, context) * 0.2;

  // 领域相关性
  weight += calculateDomainRelevance(keyword) * 0.1;

  return weight;
}
```

##### 兴趣聚类算法

```javascript
// 兴趣聚类算法
function clusterInterests(keywords) {
  // 初始化兴趣簇
  let clusters = [];

  // 第一轮：基于词向量相似度聚类
  clusters = initialClustering(keywords);

  // 第二轮：合并相似的簇
  clusters = mergeSimilarClusters(clusters);

  // 第三轮：找出每个簇的核心关键词
  clusters = identifyCoreKeywords(clusters);

  // 第四轮：根据用户历史兴趣调整
  clusters = adjustWithHistoricalInterests(clusters);

  return clusters;
}
```

##### 情绪波动计算

```javascript
// 情绪波动计算函数
function calculateEmotionalVolatility(emotionRecords) {
  // 标准差计算
  const intensities = emotionRecords.map(record => record.intensity);
  const mean = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
  const squareDiffs = intensities.map(val => Math.pow(val - mean, 2));
  const stdDev = Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length);

  // 情绪类型变化
  const typeChanges = countEmotionTypeChanges(emotionRecords);

  // 时间加权
  const timeWeightedChanges = calculateTimeWeightedChanges(emotionRecords);

  // 综合波动指数 (0-100)
  const volatility = (stdDev * 40) + (typeChanges * 30) + (timeWeightedChanges * 30);

  return Math.min(Math.round(volatility), 100);
}
```

## 五、开发规范

### 5.1 代码规范

- 采用 JavaScript 标准规范
- 使用 ESLint 进行代码检查
- 命名规范：
  - 文件名：小写字母，用连字符（-）连接，如 `emotion-panel.js`
  - 变量名：驼峰命名法，如 `userInfo`
  - 常量：全大写，用下划线连接，如 `MAX_COUNT`
  - 函数名：驼峰命名法，如 `getUserInfo`
  - 组件名：大驼峰命名法，如 `EmotionPanel`

### 5.2 注释规范

- 文件头部添加描述注释
- 函数头部添加功能描述、参数和返回值注释
- 复杂逻辑添加行内注释
- 使用 JSDoc 风格的注释

示例：
```javascript
/**
 * 分析文本情感
 * @param {string} text 待分析文本
 * @returns {Promise<object>} 情感分析结果
 */
async function analyzeEmotion(text) {
  // 函数实现...
}
```

### 5.3 Git提交规范

- 提交信息格式：`[类型] 简短描述`
- 类型包括：feat(新功能)、fix(修复)、docs(文档)、style(格式)、refactor(重构)、test(测试)、chore(构建/工具)
- 每次提交尽量只做一件事
- 保持提交频率，避免大规模提交

## 六、版本更新记录

### v1.5.2 (聊天界面多模型切换)
- feat: 在聊天界面导航栏中集成模型选择器组件，允许用户实时切换不同的AI模型。
- feat: 优化模型选择器组件样式，使其与情绪分析按钮协调一致。
- feat: 实现模型切换功能，切换后立即应用到当前对话。
- feat: 保存用户的模型选择偏好到本地缓存。
- feat: 确保与现有的云函数架构兼容。
- style: 支持暗夜模式。

### v1.5.1 (新增AI模型服务)
- feat: 统一AI模型服务，支持多种AI模型平台。
- feat: 新增模型选择器组件，支持两级选择（模型平台和具体模型）。
- feat: 新增Crond API和CloseAI模型支持。
- refactor: 重构云函数代码，减少代码冗余，提高可维护性。
- fix: 修复情感分析云函数返回错误问题。

### v1.5.0 (2025-05-10)
- feat: 新增多模型支持，包括智谱AI、Google Gemini和OpenAI。
- feat: 新增语音输入功能，支持按住说话和取消录音。
- perf: 优化聊天体验，实现更自然的消息分段输出。
- refactor: 优化角色记忆机制，提升对话连贯性。
- style: 优化情绪分析页面，支持暗黑模式。

### v1.4.3 (Gemini API 集成增强)
- refactor(gemini): 优化 `geminiModel.js` 中的提示词设计，参考 `bigmodel.js` 的提示词格式。
- feat(gemini): 增强情感分析功能，支持更详细的情感维度分析。
- feat(gemini): 添加关键词聚类、用户兴趣分析和报告生成等功能。
- refactor(gemini): 实现与智谱AI模块相同的接口和返回格式，确保兼容性。
- perf(gemini): 优化JSON解析逻辑，提高解析成功率。
- feat(gemini): 添加对历史消息的处理支持，提高对话连贯性。
- refactor(gemini): 优化消息格式转换，适配Gemini API的请求格式。
- refactor(gemini): 实现系统提示词的转换，解决Gemini不支持system角色的问题。
- refactor(gemini): 增强错误处理逻辑，提供更详细的错误信息。
- perf(gemini): 优化重试机制，实现指数退避策略。
- chore(gemini): 添加更多日志记录点，方便问题诊断。

### v1.4.2 (角色记忆机制优化)
- feat(memory): 实现对话结束时自动触发记忆提取。
- feat(memory): 实现对话达到特定长度时自动触发记忆提取（每10条消息）。
- feat(memory): 实现定期触发记忆提取（每5分钟）。
- refactor(memory): 优化记忆提取的触发条件。
- feat(memory): 添加通用的记忆提取函数，支持静默提取和显示提示。
- refactor(memory): 优化记忆提取的错误处理，增强系统稳定性。
- chore(memory): 添加记忆提取的日志记录。
- refactor(memory): 实现记忆提取的定时器管理，确保页面卸载时清除。
- perf(memory): 优化记忆提取性能，减少对用户交互影响。
- refactor(memory): 增强记忆提取的可靠性。
- perf(memory): 提高对话连贯性和个性化程度。

### v1.4.1 (语音输入功能优化)
- feat(voice): 实现上滑取消录音功能。
- feat(voice): 实现滑出按钮区域取消录音功能。
- feat(voice): 实现点击录音界面取消录音功能。
- feat(voice): 实现按ESC键取消录音功能。
- style(voice): 优化录音界面的视觉效果，添加波形动画。
- feat(voice): 添加录音时间显示。
- style(voice): 优化取消区域的视觉效果，添加动画和边框。
- style(voice): 添加明确的提示文本，告知用户可用的取消方式。
- feat(voice): 实现点击停止录音功能。
- style(voice): 优化按钮点击反馈效果。
- feat(voice): 添加震动反馈，增强交互体验。
- fix(voice): 优化录音状态管理，解决录音错误问题。

### v1.4.0 (2025-04-20)
- feat: 新增用户画像生成功能。
- feat: 新增关键词分类功能。
- feat: 新增关键词情感关联功能。
- refactor: 优化情感分析算法，提高准确性。
- refactor: 优化兴趣标签云组件，支持分类展示。

### v1.3.9 (代码优化与安全性提升)
- refactor: 从`config/index.js`中移除`DEFAULT_USER_ID`配置项。
- chore: 提高应用安全性，避免使用硬编码的测试用户ID。
- chore: 确保所有用户身份验证都使用真实的微信OpenID。

### v1.3.8 (情绪分析弹窗优化)
- fix: 修复弹窗无法上下滚动问题，调整`overflow`属性。
- style: 为iOS设备添加`-webkit-overflow-scrolling: touch`使滚动更流畅。
- refactor: 优化`emotion-dashboard`组件滚动属性。
- fix: 修复右上角关闭按钮不显示问题，明确设置`showCloseButton`。
- style: 增强关闭按钮样式，添加背景色和圆角。
- style: 为暗黑模式下的关闭按钮添加特殊样式。
- style: 增加z-index确保关闭按钮始终在最上层。
- fix: 修复`process.env.NODE_ENV`错误，使用常量替代。
- fix: 修复`requestAnimationFrame`错误，使用`wx.nextTick`替代。
- perf: 优化图表初始化和渲染性能。

### v1.3.7 (暗夜模式全面优化)
- fix(tabbar): 修复底部Tab导航栏不随本地缓存darkMode切换的问题。
- refactor(tabbar): 优化TabBar样式切换逻辑，确保在TabBar页面才调用setTabBarStyle。
- style(tabbar): 统一Tab栏在暗夜模式下的颜色和样式。
- fix(emotion-history): 修复情绪历史页面不受本地缓存darkMode控制的问题。
- refactor(daily-report): 优化每日报告页面的暗夜模式切换逻辑。
- style(charts): 确保图表在暗夜模式下正确显示。
- refactor(darkmode): 统一暗夜模式切换逻辑，优先使用本地缓存设置。

### v1.3.6 (用户体验与性能优化)
- perf(chat): 优化聊天界面响应速度，减少加载延迟。
- refactor(chat): 改进消息发送状态显示机制。
- feat(chat): 增加消息发送失败重试功能。
- perf(chat): 优化历史消息加载策略。
- feat(emotion): 新增多维度情绪分析模型。
- refactor(emotion): 优化情绪标签分类准确度。
- feat(emotion): 添加实时情绪变化追踪。
- style(emotion): 改进情绪数据可视化展示。
- perf(system): 优化应用启动速度和资源加载。
- perf(system): 改进内存管理和缓存策略。
- refactor(system): 增强网络请求错误处理。
- perf(render): 优化大数据量下的渲染性能。
- style: 优化页面布局和视觉效果。
- style: 增强用户交互反馈。
- style: 改进移动端适配。
- style: 优化夜间模式显示效果。

### v1.3.5 (用户页面与聊天功能优化)
- perf(chat): 优化聊天页面的消息加载和渲染性能。
- fix(chat): 修复消息发送后偶尔出现的重复显示问题。
- perf(chat): 改进消息列表滚动机制。
- refactor(chat): 优化输入框高度自适应功能。
- refactor(emotion): 改进情绪分析算法，提高准确度。
- style(emotion): 优化情绪标签展示效果。
- feat(emotion): 添加情绪变化趋势分析。
- refactor(db): 完善情绪数据存储结构。
- fix(system): 修复已知的崩溃和卡顿问题。
- perf(system): 优化内存使用和资源释放。
- refactor(system): 增强错误处理和异常恢复机制。
- refactor(log): 改进日志记录系统。
- docs: 更新开发文档，添加最新功能说明。
- docs: 完善API文档和使用示例。
- docs: 更新部署指南和测试文档。

### v1.3.4 (用户页面优化)
- feat(user-page): 实现用户页面下拉刷新情绪概览和个性分析数据。
- refactor(user-page): 使用情绪历史页面的一周内情绪分布数据，保持数据一致性。
- refactor(user-page): 优化个性分析数据处理，正确处理智谱AI返回的用户画像数据。
- style(user-page): 添加加载提示和成功/失败反馈。
- perf(user-page): 使用Promise.all并行加载情绪概览和个性分析数据。
- chore(user-page): 添加详细的日志记录，便于调试。
- refactor(user-page): 优化用户ID获取逻辑，使用openId作为userId。
- refactor(charts): 添加图表实例检查，若不存在则尝试重新初始化。
- refactor(charts): 优化图表数据更新逻辑。
- fix(charts): 添加错误处理机制，提高图表显示稳定性。
- docs: 更新README.md，添加用户页面下拉刷新功能说明。
- docs: 更新todo.md，记录用户页面下拉刷新功能。

### v1.3.3 (用户画像智谱AI增强)
- feat(user-profile): 使用智谱AI分析用户对话内容，提取用户兴趣、偏好、沟通风格和情感模式。
- feat(user-profile): 生成更准确、更个性化的用户画像。
- style(user-profile): 提供更自然、更友好的个性总结描述。
- refactor(user-profile): 实现智能降级机制，AI分析失败时回退到规则分析。
- refactor(user-profile): 基于AI分析结果生成更准确的个性特征。
- refactor(user-profile): 使用多维度特征映射（沟通风格、情感模式、兴趣和偏好）。
- feat(user-profile): 使用智谱AI生成更自然、更友好的个性总结。
- feat(chat): 集成用户画像数据到聊天系统提示。
- refactor(cloud-func): 优化云函数，支持自定义系统提示词。
- docs: 新增《智谱AI用户画像功能使用指南》。
- docs: 更新项目文档，记录功能增强。

### v1.3.2 (情绪波动指数优化)
- feat(emotion): 实现基于真实情绪记录的情绪波动指数计算。
- refactor(emotion): 替换原有的硬编码示例数据。
- refactor(emotion): 波动指数考虑情绪强度变化、类型多样性、极性变化和时间密度。
- style(emotion): 提供更准确的波动级别（非常稳定、稳定、中等、波动、剧烈波动）和原因分析。
- style(charts): 根据波动指数值动态设置柱状图颜色。
- refactor(charts): 支持多种数据格式的处理。

### v1.3.1 (情绪历史页面功能增强)
- feat(emotion-history): 从数据库获取真实数据，不再使用模拟数据。
- feat(emotion-history): 支持按时间范围筛选数据。
- feat(emotion-history): 支持按角色ID筛选数据。
- feat(emotion-history): 支持分页加载数据。
- perf(emotion-history): 实现数据本地缓存，提高页面加载速度（缓存30分钟）。
- perf(emotion-history): 下拉刷新时清除缓存，强制从数据库获取最新数据。
- style(emotion-history): 在情绪记录中显示对应的角色名称。
- refactor(emotion-history): 优先使用记录中的 `roleName` 或 `role_name`，否则通过 `roleId` 查询。
- feat(emotion-history): 点击情绪记录可跳转到对应的角色聊天页面或情绪分析详情页。
- feat(cloud-func): 添加云函数 `getRoleInfo` 获取角色信息。
- refactor(cloud-func): 优化 `getEmotionHistory` 云函数，支持更精确查询。

### v1.3.0 (2025-03-15)
- feat: 新增情绪历史页面，支持多种时间范围查看。
- feat: 新增情绪趋势图表和情绪分布图表。
- feat: 新增情绪波动指数和情绪日历功能。
- perf: 优化聊天记录缓存与加载机制。
- perf: 优化键盘弹出体验。

### v1.2.30 (情绪历史页面)
- feat: 新增情绪历史页面。
- feat: 实现时间范围选择功能（一周、一个月、三个月、半年、一年等）。
- feat: 实现情绪趋势图表，直观展示不同情绪类型随时间的变化。
- feat: 实现情绪分布图表，展示各种情绪类型的占比分布。
- feat: 实现情绪波动指数展示，包括与上周的对比和变化原因分析。
- feat: 实现情绪日历功能，以日历形式展示每天的主要情绪状态。
- feat: 实现最近情绪记录列表展示。
- style: 支持暗黑模式，与全局暗黑模式设置同步。
- style: 采用卡片式设计，符合iOS设计规范。
- feat: 支持下拉刷新加载最新数据。

### v1.2.29 (情绪分析逻辑优化)
- refactor(emotion): 移除聊天页面中的情绪分析数据处理逻辑。
- refactor(emotion): 统一使用专门的情绪分析组件进行处理。
- refactor(chat): 简化聊天页面的代码逻辑。
- chore(system): 提高系统的一致性和可维护性。

### v1.2.28 (修复情绪数据重复处理问题)
- fix(emotion): 修复情绪数据被重复处理的问题。
- refactor(emotion): 优化情绪数据处理逻辑，智能检测数据是否已标准化。
- refactor(emotion): 增强数据范围判断，避免重复转换导致的异常值。
- refactor(emotion): 特别优化valence值的处理。
- chore(log): 增加详细的日志记录，方便调试。

### v1.2.27 (修复情绪波动数据异常问题)
- fix(charts): 修复情绪波动图表数据异常的问题。
- refactor(emotion): 优化情绪强度和激动水平的数据处理逻辑，确保不超过100%。
- refactor(charts): 优化雷达图维度的数据处理逻辑，确保在 0-100 范围内。
- refactor(charts): 增加数据范围限制，避免图表显示异常。

### v1.2.26 (修复情绪分析显示问题)
- fix(emotion): 修复情绪维度和情绪历史对比不显示的问题。
- refactor(cloud-func): 优化情绪分析云函数的提示词，增加英文字段名支持。
- refactor(emotion): 修改情绪分析组件的数据处理逻辑，兼容中文和英文字段。
- refactor(emotion): 优化数值转换逻辑，确保图表数据正确显示。

### v1.2.25 (情绪分析逻辑完善)
- refactor(emotion): 修改情绪分析服务，支持直接使用中文情感类型。
- refactor(emotion): 更新情绪颜色和图标映射，增加中文情感类型支持。
- refactor(chat): 优化聊天页面的情绪分析处理逻辑。
- refactor(emotion): 兼容旧版英文情感类型，确保系统向后兼容。

### v1.2.24 (情绪分析提示词优化)
- refactor(cloud-func): 优化情绪分析云函数的提示词。
- refactor(emotion): 修改情绪分析结果为直接返回中文情感类型，方便前端颜色分类。
- refactor(cloud-func): 要求关键词、建议和总结必须使用中文返回。

### v1.2.23 (情绪分析逻辑优化)
- refactor(chat): 禁用聊天回复中的情绪分析功能，避免与专用情绪分析云函数重复。
- refactor(emotion): 情绪分析将完全由专用云函数 `analysis/` 处理。
- refactor(chat): 删除情绪分析相关的提示词和JSON提取代码。

### v1.2.22 (修复云函数语法错误)
- fix(cloud-func): 修复 `bigmodel.js` 和 `promptGenerator.js` 中的模板字符串语法错误。
- fix(cloud-func): 替换可能导致JavaScript解析错误的特殊字符。
- refactor(emotion): 优化情绪分析指令，与系统提示词保持一致。

### v1.2.21 (分段消息与系统提示词优化)
- fix(chat): 增强对列表和编号内容的分段识别，避免过度分段。
- refactor(chat): 增加对Markdown语法的预处理，移除加粗等标记。
- refactor(chat): 增大最大段落长度，减少过度分段。
- refactor(prompt): 修改系统提示词，避免使用Markdown语法。
- refactor(prompt): 指导使用纯文本格式，优化列表和编号内容的表达方式。
- refactor(role-prompt): 同步更新角色提示词生成模板，确保避免Markdown。

### v1.2.20 (历史对话与时间戳修复)
- fix(chat-history): 优化历史消息加载逻辑，确保分段消息正确加载。
- fix(chat-history): 优化消息排序逻辑，确保按正确时间顺序显示。
- fix(chat-history): 修复分段消息的时间戳显示问题。
- fix(timestamp): 优化第一个时间戳的显示逻辑。
- refactor(timestamp): 完善`shouldShowTimestamp`方法，增加更多判断条件。
- refactor(timestamp): 对欢迎消息和分段消息的第一段进行特殊处理。

### v1.2.19 (聊天时间戳显示优化)
- style(chat): 优化聊天界面的时间戳显示逻辑。
- style(chat): 同一时间范围内的连续对话只显示一个时间戳（间隔超5分钟显示新的）。
- style(chat): 欢迎消息始终显示时间戳。
- style(chat): 优化分段消息的时间戳显示。
- refactor(chat): 添加`shouldShowTimestamp`方法判断是否显示时间戳。
- refactor(chat): 聊天气泡组件根据消息的`showTimestamp`属性决定是否显示。

### v1.2.18 (对话简洁度优化)
- refactor(prompt): 全面优化AI回复简洁度，更接近真实手机聊天风格。
- refactor(prompt): 修改提示词生成器，强调每条消息不超过1-2句话。
- refactor(prompt): 优化默认系统提示词，强调使用非常简短对话方式。
- refactor(chat-segment): 更激进地分割消息，最大段落长度降至80字符。
- refactor(chat-segment): 优化分段算法，优先按句子分割并更激进分割长句。

### v1.2.17 (提示词生成和分段输出优化)
- refactor(prompt): 在提示词生成器中添加对话风格指导，鼓励生成更自然分段回复。
- refactor(chat-segment): 优化消息分段算法，支持多种分段策略（段落、句子、字符数）。
- perf(chat-segment): 改进消息显示的延迟计算，根据消息长度和内容复杂度动态调整。
- style(chat): 增强"正在输入..."的动画效果。

### v1.2.16 (聊天消息分段输出)
- feat(chat): 实现AI回复按自然段落或句子分段显示。
- feat(chat): 消息气泡间添加适当时间间隔，模拟真实打字节奏。
- style(chat): 优化"正在输入..."的状态提示，增强交互真实感。
- refactor(db): 实现分段消息在数据库中的正确关联和存储。
- perf(chat): 优化聊天体验，使其更加自然。
- refactor(chat-segment): 改进消息分段算法，支持多种策略。
- refactor(cache): 优化消息缓存服务，支持分段消息存储加载。
- docs: 更新项目文档，记录修改内容。

### v1.2.15 (角色选择页面暗夜模式)
- style(role-select): 为角色选择页面添加暗夜模式支持。
- style(role-select): 参考home和user页面实现，保持风格一致。
- style(role-select): 优化暗夜模式下界面元素显示（导航栏、状态栏、搜索框、分类标签、角色卡片等）。
- style(role-select): 实现暗夜模式自动切换，与全局设置同步。

### v1.2.14 (角色编辑页面生活经历文本区域扩大)
- style(role-editor): 将生活经历文本区域高度从200rpx增加到400rpx。
- style(role-editor): 提供更大空间输入角色背景故事和生活经历。

### v1.2.13 (角色编辑页面按钮位置优化)
- style(role-editor): 使所有页面的"上一步"和"下一步"按钮位置保持一致。
- style(role-editor): 统一按钮样式和宽度。
- style(role-editor): 优化按钮容器布局，确保不同步骤中保持一致高度。
- style(role-editor): 添加占位元素确保单个和多个按钮时布局一致。
- fix(role-editor): 修复不同页面按钮位置不一致的问题。
- style(role-editor): 统一按钮样式，删除不再使用的preview-button样式。

### v1.2.12 (修复角色编辑页面提示词卡片显示undefined问题 - 彻底修复)
- fix(role-editor): 彻底修复角色编辑页面提示词卡片下方显示"undefined..."的问题。
- refactor(role-editor): 全面重构提示词卡片渲染逻辑，使用block标签包裹条件渲染。
- refactor(role-editor): 对所有条件判断增加字符串长度检查。
- refactor(role-editor): 增强类型检查，确保提示词始终为字符串且非null。
- chore(log): 添加日志记录，方便跟踪提示词类型和值。
- style(role-editor): 优化卡片样式，添加overflow属性防内容溢出。
- style(role-editor): 添加text-overflow属性，文本溢出时显示省略号。

### v1.2.11 (修复角色编辑页面提示词卡片显示undefined问题)
- fix(role-editor): 修复角色编辑页面提示词卡片下方显示"undefined..."的问题。
- refactor(role-editor): 完善提示词卡片条件渲染逻辑。
- refactor(role-editor): 增强类型检查，确保提示词始终为字符串。

### v1.2.10 (修复提示词编辑页面保存失败问题)
- fix(prompt-editor): 修复提示词编辑页面保存提示词时出现"没有权限更新此角色"的问题。
- refactor(prompt-editor): 在提示词编辑页面中添加用户ID传递。
- style(prompt-editor): 增强错误处理，显示更详细错误信息。

### v1.2.9 (修复提示词编辑页面角色名称乱码问题)
- fix(prompt-editor): 修复提示词编辑页面中角色名称显示为URL编码的问题。
- refactor(prompt-editor): 在提示词编辑页面中添加对角色名称的解码处理 (decodeURIComponent)。

### v1.2.8 (角色编辑页面文本区域优化)
- style(role-editor): 缩短"说话风格"文本区域高度 (400rpx -> 120rpx)。
- style(role-editor): 缩短"生活经历"文本区域高度 (400rpx -> 200rpx)。
- style(role-editor): 为不同类型文本区域设置不同高度。

### v1.2.7 (提示词卡片化设计)
- style(role-editor): 将角色编辑页面的提示词模板改为卡片形式。
- feat(role-editor): 点击卡片可跳转到提示词编辑页面。
- style(role-editor): 添加图标字体，增强视觉效果。
- feat(role-editor): 实现提示词预览功能（前50字符）。
- style(role-editor): 添加点击动画效果。

### v1.2.6 (提示词专业编辑器)
- feat(prompt-editor): 新增专门的提示词编辑页面。
- feat(prompt-editor): 实现提示词加载、编辑和保存功能。
- style(prompt-editor): 添加提示词编写指南。
- feat(prompt-editor): 支持重新生成和清空提示词。
- feat(prompt-editor): 实现保存后自动返回角色编辑页面。
- feat(role-editor): 添加"高级编辑"按钮跳转到专业提示词编辑器。
- style(role-editor): 优化提示词模板布局和样式。

### v1.2.5 (角色编辑提示词模板优化)
- style(role-editor): 增加提示词模板文本区域高度 (200rpx -> 400rpx)。
- style(role-editor): 添加auto-height属性，允许文本区域自动增长。
- style(role-editor): 添加white-space: pre-wrap属性，保留空白符和换行。
- refactor(role-editor): 去除文本长度限制。
- style(role-editor): 优化行高和内边距，提高可读性。

### v1.2.4 (角色编辑自动跳转优化)
- style(role-editor): 修改保存成功提示方式，使用Toast替代对话框。
- feat(role-editor): 实现保存成功后自动跳转回角色选择页面。
- style(role-editor): 添加延时跳转，确保用户能看到成功提示。

### v1.2.3 (角色编辑功能修复与加载优化)
- fix(navigation): 修复角色编辑页面的跳转逻辑，使用 `wx.switchTab` 跳转回角色选择页面。
- fix(role-editor): 修复保存成功后的跳转逻辑。
- fix(role-editor): 修复取消编辑时的跳转逻辑。
- fix(cloud-init): 修复云函数初始化问题，使用 `wx.cloud.DYNAMIC_CURRENT_ENV`。
- chore(log): 增强角色数据加载的日志记录。
- style(error-handling): 优化错误处理，加载失败时显示更详细错误信息。

### v1.2.2 (首页心情树洞跳转优化)
- refactor(navigation): 使用 `wx.switchTab` 方法跳转到角色选择tab页。
- style(home): 修改"暂无最近对话"时的"开始聊天"按钮文本为"选择角色聊天"。
- style(error-handling): 新增跳转失败时的提示信息。
- docs: 新增《Tab页修改说明》文档。

### v1.2.1 (角色选择页面修复)
- fix(role-select): 修复角色显示不全问题，兼容不同数据结构。
- refactor(role-select): 优化分类过滤逻辑，增强兼容性。
- feat(role-select): 扩展搜索功能（名称、描述、关系类型）。
- refactor(role-select): 增强数据处理健壮性。

### v1.2.0 (2025-02-10)
- feat: 新增角色管理功能，支持创建和编辑自定义角色。
- feat: 新增情感分析功能，实时分析用户情绪。
- feat: 新增关键词提取功能，识别用户关注点。
- style: 优化聊天界面设计，符合iOS设计规范。
- perf: 优化分包加载，减少首次启动时间。

### v1.1.4 (用户资料页面重构)
- refactor(user-profile): 完全重构用户资料页面。
- style(user-profile): 采用 Material Design 3 规范，结合 iOS 简洁性。
- style(user-profile): 使用卡片式布局。
- style(user-profile): 优化表单交互体验，提供即时反馈。
- style(user-profile): 增强用户画像和性格分析展示。
- refactor(user-profile): 优化头像上传功能。
- style(user-profile): 改进表单验证和错误提示。
- style(user-profile): 添加数据加载状态和动画。
- style(user-profile): 支持深色模式。
- style(navigation): 使用自定义导航栏，与微信胶囊按钮齐平。

### v1.1.3 (角色创建与选择页面优化)
- style(role-editor): 优化提示词预览弹窗样式，解决内容偏右问题。
- style(navigation): 角色创建与选择页面使用自定义导航栏，与微信胶囊按钮齐平。
- refactor(role-editor): 删除右上角保存按钮，改为预览提示词后保存。
- fix(navigation): 修复角色创建页面取消按钮无法退出的问题。
- fix(navigation): 修复角色选择页面返回按钮不生效的问题。

### v1.1.2 (用户中心页面重构与用户画像功能)
- refactor(user-center): 完全重构用户中心页面。
- feat(user-center): 新增情绪概览和个性分析模块。
- style(user-center): 优化用户统计数据展示。
- style(user-center): 重新设计功能入口列表。
- feat(user-center): 添加情绪历史入口。
- feat(user-profile): 新增用户画像功能。
- feat(user-profile): 实现基于用户对话和情绪数据的个性分析。
- feat(user-profile): 添加用户兴趣标签展示。
- style(user-profile): 提供个性特征雷达图可视化。
- feat(cloud-func): 新增情绪云函数（获取情绪概览、历史）。
- refactor(cloud-func): 优化用户云函数，添加获取用户画像功能。
- refactor(db): 完善用户数据库设计，增加用户兴趣和配置表。
- docs: 更新项目文档，增加用户模块详细说明。

### v1.1.1 (角色选择与图片服务修复)
- fix(role-select): 全面修复角色选择页面的多个问题（滚动逻辑、分类显示、全部角色显示、长按操作）。
- fix(image-service): 修复 `imageService.js` 中 `TypeError: Cannot read property 'globalData' of undefined` 错误。
- refactor(image-service): 移除模块顶层 `getApp()` 调用，在函数内部调用。
- refactor(image-service): 添加对 `app` 和 `app.globalData` 的存在性检查。

### v1.1.0 (2025-01-05)
- feat: 项目初始版本，确立基本框架。
- feat: 实现基础聊天功能。
- feat: 实现用户登录和注册功能。
- feat: 引入预设角色系统。
- style: 构建基础用户界面。

### v1.0.5 (新版角色管理云函数与多项修复)
- feat(cloud-func): 新增 `roles` 云函数，替代旧版 `role` 云函数，实现完整CRUD、统计、初始化等。
- fix(role-select): 修复角色选择页面无法显示角色问题，使用新 `roles` 云函数。
- fix(chat-ui): 修复聊天界面布局问题（头部超出、安全区域适配、底部输入框样式）。
- fix(emotion-ui): 修复情绪分析界面次要情绪占位符和图标显示问题（使用内联SVG）。
- fix(echarts): 解决图表随页面滚动而移动位置的问题。
- docs(cloud-func): 新增 `roles` 云函数使用及部署说明。
- docs: 新增《情绪分析功能使用指南》、《ECharts组件使用指南》、《情绪分析云函数调用指南》。

### v1.0.4 (欢迎页面与登录流程)
- feat(welcome): 新增应用欢迎页面，展示核心功能与价值。
- feat(login): 在欢迎页面实现微信一键登录，调用云函数并缓存token/userInfo。
- feat(legal): 新增服务协议和隐私协议页面。
- style(ui): 优化页面跳转逻辑，改进登录组件交互，采用渐变背景和现代化设计。

### v1.0.3 (生产环境发布)
- chore: 完成所有测试。
- chore: 更新版本号 (app.json)。
- chore: 在微信开发者工具中选择"上传"。
- chore: 填写版本描述。
- chore: 提交审核。
- chore: 发布新版本。

### v1.0.1 (更新维护)
- chore: 定期检查云函数运行状态。
- chore: 监控数据库容量和性能。
- chore: 收集用户反馈进行迭代优化。
- chore: 定期备份重要数据。

### v1.0.0 (开始开发)
- chore: 设计项目架构。
- chore: 设计项目功能。
- chore: 设计项目UI。
- chore: 设计项目交互与动画。





