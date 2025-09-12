# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HeartChat 是一款基于微信小程序云开发的 AI 情感陪伴与情商提升应用。用户可以通过与可定制的 AI 角色进行对话，在安全私密的环境中倾诉心事、整理思绪，并通过实时情感分析获得反馈。

## 技术架构

### 前端技术栈
- **框架**: 微信小程序原生框架 (JavaScript)
- **组件化**: 组件化开发模式
- **图表库**: ECharts 用于数据可视化
- **UI组件**: Vant Weapp 组件库
- **样式**: WXSS + SASS

### 后端技术栈
- **云服务**: 微信云开发
  - 云函数 (Node.js)
  - 云数据库 (MongoDB 风格)
  - 云存储
  - 云调用
- **AI服务**: 多模型支持
  - 智谱AI (GLM-4-Flash)
  - Google Gemini
  - OpenAI (GPT系列)
  - CloseAI (DeepSeek)
  - Crond API

## 项目结构

```
HeartChat/
├── miniprogram/           # 小程序前端代码
│   ├── pages/            # 主包页面
│   ├── packageChat/      # 聊天分包
│   ├── packageEmotion/   # 情感分析分包
│   ├── components/       # 公共组件
│   ├── services/         # 业务服务封装
│   └── utils/           # 工具函数
├── cloudfunctions/       # 云函数
│   ├── chat/            # 聊天相关
│   ├── analysis/        # 情感分析
│   ├── roles/           # 角色管理
│   ├── user/            # 用户管理
│   └── generateDailyReports/  # 每日报告生成
└── doc/                 # 文档目录
```

## 开发环境配置

### 必需工具
- 微信开发者工具
- Node.js (建议 v16+)
- npm 或 yarn

### 环境设置
1. 安装依赖: `npm install`
2. 配置微信开发者工具，导入项目
3. 在云开发控制台配置环境变量

## 常用开发命令

### 代码质量
```bash
# 运行 ESLint 检查
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix

# 格式化代码
npm run format

# 清理 npm 包缓存
npm run clean
```

### 测试
```bash
# 运行测试
npm test
```

### 开发环境
```bash
# 启动开发环境
npm run dev
# 或
npm start
```

### 构建生产版本
```bash
# 构建生产版本
npm run build
```

## 开发规范

### 代码风格
- 使用 ESLint 和 Prettier 保持代码风格一致
- 遵循 JavaScript 标准规范
- 使用驼峰命名法 (camelCase)
- 文件名使用连字符 (kebab-case)

### 注释规范
- 文件头部添加描述注释
- 函数使用 JSDoc 风格注释
- 复杂逻辑添加行内注释

### Git 提交规范
提交信息格式: `[类型] 简短描述`
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

## 核心功能模块

### 1. 用户系统
- 微信登录集成
- 用户信息管理
- 用户画像分析
- 个性化设置

### 2. 角色系统
- 预设角色库
- 自定义角色创建
- 角色管理 API
- 角色记忆机制

### 3. 聊天系统
- 多模型 AI 对话
- 实时情感分析
- 消息分段输出
- 聊天记录管理
- 语音输入支持

### 4. 情感分析
- 实时情绪识别
- 关键词提取
- 情感趋势分析
- 每日情绪报告

## 数据库设计

主要集合:
- `users`: 用户信息
- `roles`: 角色信息
- `chats`: 聊天会话
- `messages`: 消息详情
- `emotionRecords`: 情感分析记录
- `userReports`: 用户每日报告
- `userInterests`: 用户兴趣

## 分包加载策略

项目采用分包加载优化性能:
- **主包**: 核心页面和组件
- **chatPackage**: 聊天相关功能
- **emotionPackage**: 情感分析功能

## 性能优化

- 本地缓存机制
- 图片资源优化
- 懒加载策略
- 分包加载
- 键盘弹出优化

## 暗夜模式

应用支持暗夜模式:
- 使用微信小程序原生暗夜模式
- 主题配置在 `theme.json`
- 所有页面和组件都支持暗夜模式

## 部署说明

### 云函数部署
1. 在微信开发者工具中上传云函数
2. 配置云函数环境变量 (API keys 等)
3. 设置定时触发器 (每日报告生成)

### 小程序发布
1. 在微信开发者工具中点击"上传"
2. 填写版本信息
3. 提交审核
4. 发布上线

## 注意事项

1. **API 密钥安全**: 所有 API 密钥必须存储在云函数环境变量中
2. **用户隐私**: 遵循微信小程序隐私政策和相关法规
3. **错误处理**: 所有网络请求和云函数调用都需要错误处理
4. **数据备份**: 定期备份重要数据
5. **性能监控**: 监控云函数运行状态和数据库性能