# HeartChat 代码审查清单

本文档列出了 HeartChat 项目中需要审查的所有代码文件，按照架构层次进行分类。

- [ ] 表示未审查
- [x] 表示已审查
- [✓] 表示已审查且已修复

## 应用层（Application Layer）

应用层包含用户界面、页面逻辑和直接与用户交互的组件。

### 主包页面

- [✓] miniprogram/app.js
- [✓] miniprogram/app.json
- [x] miniprogram/app.wxss
- [✓] miniprogram/sitemap.json
- [x] miniprogram/theme.json

### 页面（Pages）

- [x] miniprogram/pages/welcome/welcome.js
- [x] miniprogram/pages/welcome/welcome.json
- [x] miniprogram/pages/welcome/welcome.wxml
- [x] miniprogram/pages/welcome/welcome.wxss

- [✓] miniprogram/pages/home/home.js
- [x] miniprogram/pages/home/home.json
- [x] miniprogram/pages/home/home.wxml
- [x] miniprogram/pages/home/home.wxss

- [✓] miniprogram/pages/role-select/role-select.js
- [x] miniprogram/pages/role-select/role-select.json
- [✓] miniprogram/pages/role-select/role-select.wxml
- [✓] miniprogram/pages/role-select/role-select.wxss

- [✓] miniprogram/pages/user/user.js
- [x] miniprogram/pages/user/user.json
- [x] miniprogram/pages/user/user.wxml
- [x] miniprogram/pages/user/user.wxss

- [x] miniprogram/pages/user/profile/profile.js
- [x] miniprogram/pages/user/profile/profile.json
- [x] miniprogram/pages/user/profile/profile.wxml
- [x] miniprogram/pages/user/profile/profile.wxss

- [x] miniprogram/pages/keywordTest/keywordTest.js
- [x] miniprogram/pages/keywordTest/keywordTest.json
- [x] miniprogram/pages/keywordTest/keywordTest.wxml
- [x] miniprogram/pages/keywordTest/keywordTest.wxss

- [✓] miniprogram/pages/agreement/service.js
- [x] miniprogram/pages/agreement/service.json
- [✓] miniprogram/pages/agreement/service.wxml
- [✓] miniprogram/pages/agreement/service.wxss

- [✓] miniprogram/pages/agreement/privacy.js
- [x] miniprogram/pages/agreement/privacy.json
- [✓] miniprogram/pages/agreement/privacy.wxml
- [✓] miniprogram/pages/agreement/privacy.wxss

- [x] miniprogram/pages/role-editor/index.js
- [x] miniprogram/pages/role-editor/index.json
- [x] miniprogram/pages/role-editor/index.wxml
- [x] miniprogram/pages/role-editor/index.wxss

- [x] miniprogram/pages/prompt-editor/prompt-editor.js
- [x] miniprogram/pages/prompt-editor/prompt-editor.json
- [x] miniprogram/pages/prompt-editor/prompt-editor.wxml
- [x] miniprogram/pages/prompt-editor/prompt-editor.wxss

- [✓] miniprogram/pages/emotionVault/emotionVault.js
- [x] miniprogram/pages/emotionVault/emotionVault.json
- [x] miniprogram/pages/emotionVault/emotionVault.wxml
- [x] miniprogram/pages/emotionVault/emotionVault.wxss

### 分包 - 情感包（packageEmotion）

- [x] miniprogram/packageEmotion/pages/daily-report/daily-report.js
- [x] miniprogram/packageEmotion/pages/daily-report/daily-report.json
- [x] miniprogram/packageEmotion/pages/daily-report/daily-report.wxml
- [x] miniprogram/packageEmotion/pages/daily-report/daily-report.wxss

- [✓] miniprogram/packageEmotion/pages/emotion-history/emotion-history.js
- [x] miniprogram/packageEmotion/pages/emotion-history/emotion-history.json
- [x] miniprogram/packageEmotion/pages/emotion-history/emotion-history.wxml
- [x] miniprogram/packageEmotion/pages/emotion-history/emotion-history.wxss

### 分包 - 聊天包（packageChat）

- [x] miniprogram/packageChat/pages/chat/chat.js
- [x] miniprogram/packageChat/pages/chat/chat.json
- [x] miniprogram/packageChat/pages/chat/chat.wxml
- [x] miniprogram/packageChat/pages/chat/chat.wxss

- [x] miniprogram/packageChat/pages/emotion-analysis/emotion-analysis.js
- [x] miniprogram/packageChat/pages/emotion-analysis/emotion-analysis.json
- [x] miniprogram/packageChat/pages/emotion-analysis/emotion-analysis.wxml
- [x] miniprogram/packageChat/pages/emotion-analysis/emotion-analysis.wxss

### 组件（Components）

- [x] miniprogram/packageChat/components/chat-bubble/index.js
- [ ] miniprogram/components/chat-bubble/index.json
- [ ] miniprogram/components/chat-bubble/index.wxml
- [ ] miniprogram/components/chat-bubble/index.wxss

- [ ] miniprogram/components/chat-input/index.js
- [ ] miniprogram/components/chat-input/index.json
- [ ] miniprogram/components/chat-input/index.wxml
- [ ] miniprogram/components/chat-input/index.wxss

- [ ] miniprogram/components/emotion-analysis/index.js
- [ ] miniprogram/components/emotion-analysis/index.json
- [ ] miniprogram/components/emotion-analysis/index.wxml
- [ ] miniprogram/components/emotion-analysis/index.wxss

- [ ] miniprogram/components/emotion-card/index.js
- [ ] miniprogram/components/emotion-card/index.json
- [ ] miniprogram/components/emotion-card/index.wxml
- [ ] miniprogram/components/emotion-card/index.wxss

- [ ] miniprogram/components/emotion-history/index.js
- [ ] miniprogram/components/emotion-history/index.json
- [ ] miniprogram/components/emotion-history/index.wxml
- [ ] miniprogram/components/emotion-history/index.wxss

- [ ] miniprogram/components/emotion-panel/index.js
- [ ] miniprogram/components/emotion-panel/index.json
- [ ] miniprogram/components/emotion-panel/index.wxml
- [ ] miniprogram/components/emotion-panel/index.wxss

- [ ] miniprogram/components/emotion-pie/emotion-pie.js
- [ ] miniprogram/components/emotion-pie/emotion-pie.json
- [ ] miniprogram/components/emotion-pie/emotion-pie.wxml
- [ ] miniprogram/components/emotion-pie/emotion-pie.wxss

- [ ] miniprogram/components/interest-tag-cloud/index.js
- [ ] miniprogram/components/interest-tag-cloud/index.json
- [ ] miniprogram/components/interest-tag-cloud/index.wxml
- [ ] miniprogram/components/interest-tag-cloud/index.wxss

- [ ] miniprogram/components/keyword-emotion-stats/index.js
- [ ] miniprogram/components/keyword-emotion-stats/index.json
- [ ] miniprogram/components/keyword-emotion-stats/index.wxml
- [ ] miniprogram/components/keyword-emotion-stats/index.wxss

- [ ] miniprogram/components/login/index.js
- [ ] miniprogram/components/login/index.json
- [ ] miniprogram/components/login/index.wxml
- [ ] miniprogram/components/login/index.wxss

- [ ] miniprogram/components/practice-card/index.js
- [ ] miniprogram/components/practice-card/index.json
- [ ] miniprogram/components/practice-card/index.wxml
- [ ] miniprogram/components/practice-card/index.wxss

- [ ] miniprogram/components/role-card/role-card.js
- [ ] miniprogram/components/role-card/role-card.json
- [ ] miniprogram/components/role-card/role-card.wxml
- [ ] miniprogram/components/role-card/role-card.wxss

- [ ] miniprogram/components/ec-canvas/ec-canvas.js
- [ ] miniprogram/components/ec-canvas/ec-canvas.json
- [ ] miniprogram/components/ec-canvas/ec-canvas.wxml
- [ ] miniprogram/components/ec-canvas/ec-canvas.wxss
- [ ] miniprogram/components/ec-canvas/echarts.js

- [ ] miniprogram/components/emotion-dashboard/index.js
- [ ] miniprogram/components/emotion-dashboard/index.json
- [ ] miniprogram/components/emotion-dashboard/index.wxml
- [ ] miniprogram/components/emotion-dashboard/index.wxss

## 领域层（Domain Layer）

领域层包含业务逻辑、领域模型和业务规则。

### 服务（Services）

- [ ] miniprogram/services/emotionService.js
- [ ] miniprogram/services/personalityService.js
- [ ] miniprogram/services/userInterestsService.js
- [ ] miniprogram/services/keywordService.js
- [ ] miniprogram/services/cloudFuncCaller.js
- [ ] miniprogram/services/eventBus.js
- [ ] miniprogram/services/imageService.js
- [✓] miniprogram/services/userService.js

### 模型（Models）

- [ ] miniprogram/models/emotion.js
- [ ] miniprogram/models/user.js
- [ ] miniprogram/models/role.js
- [ ] miniprogram/models/chat.js
- [ ] miniprogram/models/keyword.js

## 基础设施层（Infrastructure Layer）

基础设施层包含工具函数、配置文件和与外部系统的集成。

### 工具（Utils）

- [ ] miniprogram/utils/emotionAnalyzer.js
- [✓] miniprogram/utils/emotionHelper.js
- [ ] miniprogram/utils/stats.js
- [ ] miniprogram/utils/auth.js
- [ ] miniprogram/utils/request.js
- [ ] miniprogram/utils/date.js
- [ ] miniprogram/utils/storage.js
- [ ] miniprogram/utils/formatter.js
- [ ] miniprogram/utils/keywordClassifier.js
- [✓] miniprogram/utils/dbHelper.js
- [✓] miniprogram/utils/chatHelper.js
- [✓] miniprogram/utils/roleHelper.js
- [✓] miniprogram/utils/uiHelper.js

### 配置（Config）

- [✓] miniprogram/config/index.js
- [ ] project.config.json
- [ ] tsconfig.json
- [ ] package.json
- [ ] jest.config.js

## 数据库层（Database Layer）

数据库层包含数据库操作、数据访问对象和数据模型。

### 云函数（Cloud Functions）

- [ ] cloudfunctions/analysis/index.js
- [ ] cloudfunctions/analysis/bigmodel.js
- [ ] cloudfunctions/analysis/keywordClassifier.js
- [ ] cloudfunctions/analysis/keywordEmotionLinker.js
- [ ] cloudfunctions/analysis/userInterestAnalyzer.js
- [ ] cloudfunctions/analysis/package.json

- [ ] cloudfunctions/chat/index.js
- [ ] cloudfunctions/chat/package.json

- [ ] cloudfunctions/clearDatabase/index.js
- [ ] cloudfunctions/clearDatabase/package.json

- [ ] cloudfunctions/emotion/index.js
- [ ] cloudfunctions/emotion/package.json

- [ ] cloudfunctions/generateDailyReports/index.js
- [ ] cloudfunctions/generateDailyReports/package.json

- [ ] cloudfunctions/httpRequest/index.js
- [ ] cloudfunctions/httpRequest/package.json

- [ ] cloudfunctions/initReportCollections/index.js
- [ ] cloudfunctions/initReportCollections/package.json

- [ ] cloudfunctions/login/index.js
- [ ] cloudfunctions/login/package.json

- [ ] cloudfunctions/role/index.js
- [ ] cloudfunctions/role/package.json

- [ ] cloudfunctions/roles/index.js
- [ ] cloudfunctions/roles/package.json

- [ ] cloudfunctions/testBigmodel/index.js
- [ ] cloudfunctions/testBigmodel/bigmodel.js
- [ ] cloudfunctions/testBigmodel/test.js
- [ ] cloudfunctions/testBigmodel/package.json

- [ ] cloudfunctions/user/index.js
- [ ] cloudfunctions/user/package.json

## 控制器层（Controller Layer）

控制器层包含处理用户请求、协调业务逻辑和返回响应的组件。

### 页面控制器（Page Controllers）

- [ ] miniprogram/pages/welcome/welcome.js (控制器部分)
- [ ] miniprogram/pages/home/home.js (控制器部分)
- [ ] miniprogram/pages/role-select/role-select.js (控制器部分)
- [ ] miniprogram/pages/user/user.js (控制器部分)
- [ ] miniprogram/packageChat/pages/chat/chat.js (控制器部分)
- [ ] miniprogram/packageEmotion/pages/emotion-history/emotion-history.js (控制器部分)

### 组件控制器（Component Controllers）

- [ ] miniprogram/components/chat-input/index.js (控制器部分)
- [ ] miniprogram/components/emotion-analysis/index.js (控制器部分)
- [ ] miniprogram/components/emotion-dashboard/index.js (控制器部分)

## 文档（Documentation）

- [ ] README.md
- [ ] docs/使用文档/
- [ ] docs/流程图/
- [ ] cloudfunctions/testBigmodel/README.md
- [✓] fix_plan.md
- [✓] fix_report.md

## 其他文件（Others）

- [ ] .gitignore
- [ ] .cursor/rules/project_rules.mdc
- [ ] .cursor/rules/project_overview.mdc
- [ ] .cursor/rules/cloud_functions.mdc
- [ ] analyse-data.json
