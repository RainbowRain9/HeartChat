# HeartChat 微信小程序代码审查清单

## 应用层 (Application Layer)

### 页面 (Pages)
- [x] miniprogram/pages/user/index.js
- [x] miniprogram/pages/user/index.json
- [x] miniprogram/pages/user/index.wxml
- [x] miniprogram/pages/user/index.wxss
- [x] miniprogram/pages/chat/index.ts
- [x] miniprogram/pages/chat/index.json
- [x] miniprogram/pages/chat/index.wxml
- [x] miniprogram/pages/chat/index.wxss
- [x] miniprogram/pages/emotionVault/emotionVault.js
- [x] miniprogram/pages/emotionVault/emotionVault.json
- [x] miniprogram/pages/emotionVault/emotionVault.wxml
- [x] miniprogram/pages/emotionVault/emotionVault.wxss
- [x] miniprogram/pages/emotionAnswer/index.js
- [x] miniprogram/pages/emotionAnswer/index.json
- [x] miniprogram/pages/emotionAnswer/index.wxml
- [x] miniprogram/pages/emotionAnswer/index.wxss
- [x] miniprogram/pages/user/role/index.js
- [x] miniprogram/pages/user/role/index.json
- [x] miniprogram/pages/user/role/index.wxml
- [x] miniprogram/pages/user/role/index.wxss
- [x] miniprogram/pages/user/role/edit/index.js
- [x] miniprogram/pages/user/role/edit/index.json
- [x] miniprogram/pages/user/role/edit/index.wxml
- [x] miniprogram/pages/user/role/edit/index.wxss
- [x] miniprogram/pages/agreement/privacy.wxml
- [x] miniprogram/pages/agreement/service.wxml

### 子包页面 (Subpackage Pages)
- [x] miniprogram/packageA/pages/emotion/analysis.js
- [x] miniprogram/packageA/pages/emotion/analysis.json
- [x] miniprogram/packageA/pages/emotion/analysis.wxml
- [x] miniprogram/packageA/pages/emotion/analysis.wxss
- [x] miniprogram/packageA/pages/emotion/practice.ts
- [x] miniprogram/packageA/pages/emotion/practice.json
- [x] miniprogram/packageA/pages/emotion/practice.wxml
- [x] miniprogram/packageA/pages/emotion/practice.wxss

### 组件 (Components)
- [x] miniprogram/components/chat-bubble/index.ts
- [x] miniprogram/components/chat-bubble/index.json
- [x] miniprogram/components/chat-bubble/index.wxml
- [x] miniprogram/components/chat-bubble/index.wxss
- [x] miniprogram/components/chat-input/index.ts
- [x] miniprogram/components/chat-input/index.json
- [x] miniprogram/components/chat-input/index.wxml
- [x] miniprogram/components/chat-input/index.wxss
- [x] miniprogram/components/emotion-card/index.ts
- [x] miniprogram/components/emotion-card/index.json
- [x] miniprogram/components/emotion-card/index.wxml
- [x] miniprogram/components/emotion-card/index.wxss
- [x] miniprogram/components/login/index.ts
- [x] miniprogram/components/login/index.json
- [x] miniprogram/components/login/index.wxml
- [x] miniprogram/components/login/index.wxss
- [x] miniprogram/components/practice-card/index.ts
- [x] miniprogram/components/practice-card/index.json
- [x] miniprogram/components/practice-card/index.wxml
- [x] miniprogram/components/practice-card/index.wxss
- [x] miniprogram/components/role-card/index.ts
- [x] miniprogram/components/role-card/index.json
- [x] miniprogram/components/role-card/index.wxml
- [x] miniprogram/components/role-card/index.wxss
- [x] miniprogram/pages/emotionVault/agent-ui/index.js
- [x] miniprogram/pages/emotionVault/agent-ui/index.wxml
- [x] miniprogram/pages/emotionVault/agent-ui/index.wxss
- [x] miniprogram/pages/emotionVault/agent-ui/wd-markdown/index.js
- [x] miniprogram/pages/emotionVault/agent-ui/collapse/index.js
- [x] miniprogram/pages/emotionVault/agent-ui/chatFile/index.js

### 应用入口 (App Entry)
- [x] miniprogram/app.js
- [x] miniprogram/app.json
- [x] miniprogram/app.wxss
- [x] miniprogram/sitemap.json
- [x] miniprogram/theme.json

## 领域层 (Domain Layer)

### 模型 (Models)
- [x] miniprogram/models/chat.ts
- [x] miniprogram/models/role.ts
- [x] miniprogram/mock/chat-data.ts

### 类型定义 (Type Definitions)
- [x] miniprogram/typings/chat.d.ts
- [x] miniprogram/typings/emotion.d.ts
- [x] miniprogram/typings/index.d.ts
- [x] miniprogram/typings/wx/index.d.ts
- [x] cloudfunctions/chat/typings/chat.d.ts

## 基础设施层 (Infrastructure Layer)

### 工具函数 (Utils)
- [ ] miniprogram/utils/app.ts
- [ ] miniprogram/utils/auth.js
- [ ] miniprogram/utils/crypto.ts
- [ ] miniprogram/utils/format.ts
- [ ] miniprogram/utils/request.ts
- [ ] miniprogram/utils/storage.ts
- [ ] miniprogram/utils/validate.ts
- [ ] utils/auth.ts
- [ ] utils/crypto.ts
- [ ] utils/request.js

### 服务 (Services)
- [ ] miniprogram/services/emotion-analysis.ts

### 配置文件 (Configuration)
- [ ] .eslintrc.js
- [ ] .prettierrc.js
- [ ] babel.config.js
- [ ] jest.config.js
- [ ] jest.setup.js
- [ ] tsconfig.json
- [ ] project.config.json
- [ ] project.private.config.json
- [ ] package.json

## 数据库层 (Database Layer)

### 云函数 (Cloud Functions)
- [ ] cloudfunctions/analysis/index.ts
- [ ] cloudfunctions/chat/index.js
- [ ] cloudfunctions/chat/config.json
- [ ] cloudfunctions/chatbot/index.js
- [ ] cloudfunctions/chatbot/config.json
- [ ] cloudfunctions/initDatabase/index.js
- [ ] cloudfunctions/login/index.js
- [ ] cloudfunctions/login/index.ts
- [ ] cloudfunctions/migrateRoles/index.js
- [ ] cloudfunctions/quickstartFunctions/index.js
- [ ] cloudfunctions/quickstartFunctions/getOpenId.js
- [ ] cloudfunctions/quickstartFunctions/getMiniProgramCode.js
- [ ] cloudfunctions/quickstartFunctions/createCollection.js
- [ ] cloudfunctions/quickstartFunctions/selectRecord.js
- [ ] cloudfunctions/quickstartFunctions/updateRecord.js
- [ ] cloudfunctions/quickstartFunctions/sumRecord.js

## 控制器层 (Controller Layer)

### 事件处理 (Event Handlers)
- [ ] miniprogram/__tests__/app.test.ts
- [ ] scripts/generate-icons.ts

## 文档 (Documentation)

### 项目文档
- [ ] README.md
- [ ] todo.md
- [ ] docs/后端/database_design.md
- [ ] docs/后端/数据库设计.md
- [ ] docs/接入AI/ai使用文档.md
- [ ] docs/接入AI/创建 Agent.md
- [ ] docs/接入AI/小程序接入云开发 AI 能力指引.md
- [ ] docs/接入AI/小程序接口调用.md
- [ ] docs/页面设计/对话视图.md
- [ ] docs/页面设计/心情树洞.md
- [ ] docs/页面设计/情感分析视图.md
- [ ] docs/页面设计/我的.md
- [ ] docs/页面设计/聊天.md
- [ ] docs/页面设计/角色库系统设计.md
- [ ] docs/创新式双视图布局.md
- [ ] docs/图标库.md
- [ ] docs/输入的逻辑流程.md
- [ ] docs/逻辑实现图.md
