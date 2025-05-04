# HeartChat 代码审查修复计划

本文档列出了根据代码审查报告需要修复的问题，并按优先级和类型进行分类。

## 优先级1：严重问题

### 1. sitemap.json 路径不匹配问题
- 修复第6行 `"page": "pages/user/index"` 为 `"page": "pages/user/user"`
- 修复第10行 `"page": "packageA/pages/emotion/analysis"` 为 `"page": "packageEmotion/pages/emotion-history/emotion-history"`
- 修复第14行或移除 `"page": "packageA/pages/emotion/practice"`，因为该路径不存在

### 2. 文件过长问题
以下文件需要重构，将功能拆分为多个模块：
- miniprogram/pages/emotionVault/emotionVault.js (2201行)
- miniprogram/pages/emotionVault/emotionVault.wxss (1905行)
- miniprogram/packageEmotion/pages/emotion-history/emotion-history.js (1692行)
- miniprogram/packageChat/pages/chat/chat.js (1911行)
- miniprogram/pages/role-editor/index.js (870行)
- miniprogram/pages/role-editor/index.wxss (699行)

### 3. 空文件问题
- miniprogram/pages/agreement/service.js
- miniprogram/pages/agreement/privacy.js

## 优先级2：代码重复问题

### 1. app.js
- 将第165-168行和第212-215行的重复代码抽取为一个单独的方法，如`saveOpenIdToStorage(userInfo)`

### 2. home.js
- 将第117-142行、第369-396行和第461-471行的获取用户ID和openid的重复逻辑抽取为一个公共函数

### 3. role-select.js
- 将第594-596行和第117-118行的获取用户ID的重复逻辑抽取为一个公共函数
- 合并第458-465行的 `handleStartChat` 函数和第645-663行的 `handleSelectAndChat` 函数

### 4. user.js
- 将第227-258行和第312-320行的获取用户ID和openId的重复逻辑抽取为一个公共函数
- 合并第1026-1081行的 `handleLoginSuccess` 函数中的重复代码

### 5. profile.js
- 将第224-261行的 `fetchInterestTags` 函数和第266-320行的 `fetchPersonalityAnalysis` 函数的共同逻辑抽取

### 6. privacy.wxss
- 将与service.wxss完全相同的样式抽取到一个公共的样式文件中，如 `agreement-common.wxss`

## 优先级3：硬编码问题

### 1. app.js
- 将第12行硬编码的云环境ID `'rainbowrain-2gt3j8hda726e4fe'` 移至配置文件
- 将第243行硬编码的TabBar页面列表移至配置对象或常量

### 2. home.js
- 将第274行硬编码的默认头像URL移至配置文件或常量

### 3. role-select.js
- 将第15-21行的角色分类移至配置文件

### 4. user.js
- 将第30-42行的情绪数据和第47-50行的个性分析数据移至配置文件或常量
- 将第597-601行和第683-687行重复定义的默认个性数据定义为一个常量

### 5. role-editor/index.js
- 将第12行硬编码的默认头像路径移至配置文件或常量
- 将第40-44行和第48-54行硬编码的关系选项和分类选项移至配置文件或从服务器获取

## 优先级4：未使用的代码

### 1. role-select.js
- 删除第618-622行的 `handleBackClick` 函数
- 删除第636-640行的 `formatEmotionalTendency` 函数
- 删除第669-701行的 `createTestRoles` 函数

### 2. role-select.wxml
- 删除第105-107行的测试按钮 `createTestRoles`
- 删除第110-116行的调试信息区域

### 3. role-select.wxss
- 删除第68-83行的 `.back-button` 和 `.back-icon` 样式
- 删除第85-90行的 `.page-title` 样式
- 删除第193-206行的 `.debug-info` 相关样式
- 删除第208-223行的 `.debug-section` 和 `.debug-button` 样式
- 删除第657-659行的 `.detail-button.chat.active` 样式

### 4. emotion-history.js
- 删除第1599-1605行的 `loadMoreRecords` 函数
- 删除第1610-1612行的 `abs` 函数
- 删除第1661-1663行的 `onHide` 函数和第1668-1670行的 `onUnload` 函数

## 优先级5：其他优化

### 1. app.js
- 简化第26-53行的云环境初始化部分的错误处理逻辑
- 优化第230-267行的 `updateTheme` 方法，使其在所有页面生效

### 2. app.json
- 统一第55-56行中的图标路径格式，移除 `navigation/` 目录
- 确保第72-75行引用的 `/pages/emotionVault/agent-ui/` 组件能被正确加载
- 确保第41-44行使用的主题变量在 `theme.json` 中定义

### 3. home.js
- 优化第166-168行的注释和第168-171行的查询条件
- 优化第177-183行的前端过滤数据逻辑，改为在数据库查询时过滤
- 统一错误处理方式，如第316-320行和第299-301行

### 4. user.js
- 将文件拆分为多个模块，如用户信息模块、图表模块、兴趣标签模块等
- 实现第1142-1144行和第1188-1190行的图表点击事件处理函数
- 实现或移除第1106-1109行注释的设置页面功能

### 5. profile.js
- 修复第3行引入的 `userService` 服务的定义
- 实现第516-519行的 `updatePageStyle` 函数
- 实现第524-539行的 `clearChatHistory` 函数的实际清除逻辑
- 确保第544-548行的 `showAbout` 函数导航到的页面存在

## 修复进度跟踪

- [x] 优先级1：严重问题
  - [x] sitemap.json 路径不匹配问题
  - [x] 空文件问题
- [x] 优先级2：代码重复问题（部分）
  - [x] app.js 中的代码重复问题
  - [x] privacy.wxss 与 service.wxss 的重复样式
  - [ ] 其他文件中的代码重复问题
- [x] 优先级3：硬编码问题（部分）
  - [x] app.js 中的硬编码问题
  - [ ] 其他文件中的硬编码问题
- [x] 优先级4：未使用的代码
  - [x] role-select.js 中的未使用函数
  - [x] role-select.wxml 中的测试按钮和调试信息区域
  - [x] role-select.wxss 中的未使用样式
  - [x] emotion-history.js 中的未使用函数
- [ ] 优先级5：其他优化
