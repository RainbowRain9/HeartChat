# HeartChat 云函数

## 1. 项目概览

本项目是 "HeartChat - 情商提升助手" 微信小程序的后端云函数集合。它们为小程序提供了核心的业务逻辑支持，包括用户认证、AI聊天与角色互动、情感分析、用户数据管理、报告生成、语音服务集成等功能。旨在通过云端能力，为用户提供智能化、个性化的情商提升辅助服务。

## 2. 功能模块

本项目包含以下主要的云函数模块：

*   **`analysis`**:
    *   **`aiModelService.js`**: 统一的AI模型服务层。封装了对多种大语言模型平台（如智谱AI、Google Gemini、OpenAI、Claude等）的API调用，提供情感分析、关键词提取、文本嵌入向量获取、关键词聚类和用户兴趣分析等核心AI能力。
*   **`clearDatabase`**:
    *   **`index.js`**: 数据库清理工具。用于在开发和测试阶段清空指定的数据库集合，支持选择性地保留系统配置数据或强制清理所有数据。
*   **`getIflytekSttUrl`**:
    *   **`index.js`**: 讯飞语音服务URL生成器。为小程序前端安全地生成连接到讯飞语音听写服务的WebSocket URL，用于实现语音输入功能。
*   **`getRoleInfo`**:
    *   **`index.js`**: 单一角色信息获取。根据传入的角色ID从数据库中查询并返回特定AI角色的详细配置信息。
*   **`initReportCollections`**:
    *   **`index.js`**: 报告相关集合初始化。用于创建与用户每日/周期报告和用户兴趣分析相关的数据库集合（`userReports`, `userInterests`）并为这些集合建立必要的索引。
*   **`login`**:
    *   **`index.js`**: 用户认证核心。处理用户的登录和注册请求，基于微信OPENID管理用户账户，生成JWT (JSON Web Token) 用于后续API调用的身份验证，并记录用户基础统计信息和登录日志。
*   **`roles`**:
    *   **`index.js`**: 角色与AI交互中心。这是一个功能丰富的模块，管理AI角色的CRUD（创建、读取、更新、删除）、角色使用统计、动态Prompt生成、角色记忆管理（从对话中提取关键信息并应用于后续交互）、以及基于对话的用户画像构建。它深度集成了`aiModelService`来实现智能化的对话体验。
    *   包含子模块如 `init-roles.js` (初始化系统角色), `promptGenerator.js` (动态提示词生成), `memoryManager.js` (角色记忆管理), `userPerception.js` (用户画像处理), `test-zhipu.js` (AI模型测试)。
*   **`testDatabase`**:
    *   **`index.js`**: 数据库连接测试工具。用于验证云函数是否能正常连接到云开发数据库，并对常用集合进行基本的读操作测试。
*   **`user`**:
    *   **`index.js`**: 用户信息管理中心。负责处理用户相关的各种信息，包括用户基本资料、详细档案、应用设置的获取与更新；用户各项统计数据（如聊天次数、活跃天数）的获取与更新；用户报告的查询和标记已读；用户兴趣关键词的管理（增删改查、分类、情感打分）；用户画像的获取与管理；以及创建用户相关数据库集合的索引。
    *   包含子模块如 `userPerception_new.js` (新版用户画像处理), `userInterests.js` (用户兴趣管理), `createIndexes.js` (数据库索引创建)。

## 3. 技术栈

*   **运行时环境**: Node.js (具体版本根据微信云开发支持的最新稳定版，通常为 Node.js 12.x, 14.x, 16.x, 18.x 等，请参考微信官方文档)。
*   **核心SDK**:
    *   `wx-server-sdk`: 微信云开发官方服务端SDK，用于操作数据库、存储、调用其他云函数等。
*   **主要依赖库**:
    *   `axios`: 用于发送HTTP请求，主要在 `aiModelService.js` 中调用外部AI平台的API。
    *   `jsonwebtoken`: 用于在 `login` 云函数中生成和验证JWT，实现用户身份认证。
    *   `crypto`: Node.js内置加密库，例如在 `getIflytekSttUrl` 中用于生成API签名。

## 4. 部署指南

### 4.1 前提条件

1.  拥有一个微信小程序账号，并已开通云开发服务。
2.  安装最新版本的[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
3.  在微信开发者工具中导入或创建本项目。
4.  在云开发控制台创建一个云开发环境，并获取环境ID。

### 4.2 部署步骤

微信小程序的云函数主要通过微信开发者工具进行部署：

1.  **配置云环境ID**:
    *   在小程序的 `app.js` 或相关配置文件中，设置正确的云开发环境ID。推荐使用动态环境ID `cloud.DYNAMIC_CURRENT_ENV`，或在云函数初始化时指定。
    *   例如，在云函数 `cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })`。
2.  **上传并部署云函数**:
    *   在微信开发者工具中，右键点击 `cloudfunctions` 目录下的目标云函数文件夹（例如 `login`）。
    *   选择 "上传并部署：云端安装依赖"（推荐，会自动处理 `package.json` 中的依赖）。如果云函数没有外部依赖或依赖已在云端模块中，也可以选择 "上传并部署：所有文件"。
    *   开发者工具会将云函数代码上传到云开发控制台，并在云端完成部署。
    *   对于包含 `package.json` 的云函数，确保其中声明的依赖是云端支持的。
3.  **批量部署**:
    *   也可以右键点击 `cloudfunctions` 根目录，选择 "同步所有云函数列表"，然后逐个或批量上传部署。

**注意**: 本项目是微信小程序云函数，并非部署在 Google Cloud Functions (gcloud)。因此，不使用 `gcloud functions deploy` 命令。

## 5. 配置

### 5.1 云开发环境

*   **环境ID**: 在小程序端和云函数端初始化云服务时需要指定。建议在云函数中使用 `cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })` 来自动匹配当前环境。

### 5.2 环境变量 (针对 `aiModelService`)

部分云函数（尤其是 `aiModelService.js`）依赖外部AI平台的API密钥。这些密钥应通过云开发控制台的环境变量进行配置，以确保安全。

在云开发控制台 -> 指定环境 -> 云函数 -> 配置 -> 添加或修改环境变量：

*   `ZHIPU_API_KEY`: 智谱AI的API密钥。
*   `GEMINI_API_KEY`: Google Gemini的API密钥。
*   `OPENAI_API_KEY`: OpenAI的API密钥。
*   `CROND_API_KEY`: Crond API的API密钥。
*   `CLOSEAI_API_KEY`: DeepSeek (CloseAI) 的API密钥。
*   `GROK_API_KEY`: Grok API的API密钥。
*   `CLAUDE_API_KEY`: Claude API的API密钥。
*   `IFLYTEK_APPID`, `IFLYTEK_API_SECRET`, `IFLYTEK_API_KEY`: 讯飞语音服务的认证信息 (用于 `getIflytekSttUrl`)。

**配置方法**:
1.  登录微信公众平台，进入小程序的云开发控制台。
2.  选择对应的云环境。
3.  导航到 "云函数" -> "配置" 标签页。
4.  在 "环境变量" 部分，为每个需要API密钥的云函数（主要是 `analysis` 或直接在 `aiModelService.js` 中读取的全局环境变量）添加相应的键值对。

### 5.3 数据库权限

确保云函数的数据库操作权限设置合理。默认情况下，云函数拥有所有数据集合的读写权限。可以在云开发控制台 -> 数据库 -> 权限设置中调整。

## 6. 云函数调用与触发

### 6.1 通用调用方式 (小程序端)

小程序端通过 `wx.cloud.callFunction` API 调用云函数：

```javascript
wx.cloud.callFunction({
  name: 'functionName', // 云函数名称，例如 'login', 'roles', 'user'
  data: {
    action: 'actionName', // 具体操作的标识，由各云函数内部定义
    // ...其他参数
  },
  success: res => {
    console.log('云函数调用成功:', res.result);
    // 处理返回结果
  },
  fail: err => {
    console.error('云函数调用失败:', err);
    // 处理错误
  }
});
```

### 6.2 主要云函数接口示例

以下是一些主要云函数的调用示例和关键参数说明。所有云函数都期望通过 `event.action` 字段来区分具体的操作。

*   **`login`**:
    *   `action: 'login'` (隐式，因为 `login` 云函数通常只有一个主要操作)
    *   `event.userInfo`: 微信用户信息对象 (包含 `nickName`, `avatarUrl` 等)。
    *   **示例**:
        ```javascript
        wx.cloud.callFunction({
          name: 'login',
          data: {
            userInfo: { nickName: 'User', avatarUrl: 'url' }
          }
          // ...
        });
        ```

*   **`roles`**:
    *   `action: 'getRoles'`: 获取角色列表。
        *   `event.category` (可选): 角色分类。
    *   `action: 'getRoleDetail'`: 获取角色详情。
        *   `event.roleId`: 角色ID。
    *   `action: 'createRole'`: 创建角色。
        *   `event.role`: 角色信息对象。
    *   `action: 'updateRole'`: 更新角色。
        *   `event.roleId`: 角色ID。
        *   `event.role`: 要更新的角色信息。
    *   `action: 'deleteRole'`: 删除角色。
        *   `event.roleId`: 角色ID。
    *   `action: 'updateUsage'`: 更新角色使用统计。
        *   `event.roleId`: 角色ID。
        *   `event.userId`: 用户ID。
    *   `action: 'generatePrompt'`: 生成角色提示词。
        *   `event.roleId`: 角色ID。
        *   `event.currentContext` (可选): 当前对话上下文。
    *   `action: 'extractMemories'`: 从对话中提取记忆。
        *   `event.roleId`: 角色ID。
        *   `event.messages`: 对话消息列表。
    *   **示例 (`getRoles`)**:
        ```javascript
        wx.cloud.callFunction({
          name: 'roles',
          data: {
            action: 'getRoles',
            category: '热门'
          }
          // ...
        });
        ```

*   **`user`**:
    *   `action: 'getInfo'`: 获取用户信息。
        *   `event.userId`: 用户ID。
    *   `action: 'updateProfile'`: 更新用户资料。
        *   `event.userId`: 用户ID。
        *   `event.username`, `event.avatarUrl`, `event.gender`, etc.
    *   `action: 'getStats'`: 获取用户统计。
        *   `event.userId`: 用户ID。
    *   `action: 'getUserInterests'`: 获取用户兴趣。
        *   `event.userId`: 用户ID。
    *   `action: 'getUserPerception'`: 获取用户画像。
        *   `event.userId`: 用户ID。
    *   **示例 (`getInfo`)**:
        ```javascript
        wx.cloud.callFunction({
          name: 'user',
          data: {
            action: 'getInfo',
            userId: 'user123'
          }
          // ...
        });
        ```

*   **`analysis` (通过其他云函数间接调用，或直接调用进行特定分析)**:
    *   `aiModelService` 本身不是一个直接被小程序调用的云函数，而是被其他云函数（如 `roles`, `user`）引用的服务模块。如果需要独立测试其功能，可以创建一个包装云函数。
    *   其内部函数如 `analyzeEmotion` 期望 `text`, `history`, `options` (包含平台和模型) 等参数。

*   **`getIflytekSttUrl`**:
    *   无特定 `action`，直接调用。
    *   **示例**:
        ```javascript
        wx.cloud.callFunction({
          name: 'getIflytekSttUrl'
          // ...
        });
        ```

### 6.3 触发机制

所有列出的云函数主要设计为由小程序客户端通过 `wx.cloud.callFunction` **主动调用** (HTTP触发的等效形式)。
目前项目中未明确展示由其他事件（如数据库触发器、定时任务触发器）触发的云函数。如果未来添加此类触发器，需要在云开发控制台进行相应配置。

## 7. 预期行为与输出

每个云函数成功执行后，会返回一个包含 `success: true` 和 `data` (或特定字段如 `result`, `stats`, `prompt` 等) 的对象。如果失败，则返回 `success: false` 和 `error` 信息。

*   **`login`**: 返回 `{ success: true, data: { token, isNewUser, userInfo } }`。
*   **`roles`**:
    *   `getRoles`: `{ success: true, data: [roleObjects], total: number }`。
    *   `getRoleDetail`: `{ success: true, role: roleObject }`。
    *   `generatePrompt`: `{ success: true, prompt: string }`。
*   **`user`**:
    *   `getInfo`: `{ success: true, data: { user: userObject } }`。
    *   `getStats`: `{ success: true, data: statsObject }`。
*   **`getIflytekSttUrl`**: 返回 `{ success: true, wssUrl: string, appid: string }`。
*   **`aiModelService.analyzeEmotion` (间接)**: 返回包含详细情感分析结果的对象，如 `{ success: true, result: { primary_emotion, intensity, ... } }`。

具体的输出格式请参考各云函数内部的返回逻辑。

## 8. 日志与监控

### 8.1 查看日志

云函数的运行日志可以在微信云开发控制台查看：

1.  登录微信公众平台，进入小程序的云开发控制台。
2.  选择对应的云环境。
3.  导航到 "云函数" -> "日志" 标签页。
4.  选择要查看日志的云函数和时间范围。
5.  日志中会包含 `console.log`, `console.error` 的输出，以及函数的调用信息、执行结果、耗时等。

### 8.2 监控性能

云开发控制台也提供了云函数的监控功能：

1.  在云开发控制台，导航到 "云函数" -> "监控" 标签页。
2.  可以查看函数的调用次数、运行时间、错误率等指标。
3.  利用这些监控数据可以帮助分析和优化函数性能。

## 9. 本地开发与测试

微信开发者工具支持云函数的本地调试：

1.  **开启本地调试**:
    *   在微信开发者工具中，右键点击目标云函数文件夹。
    *   选择 "开启云函数本地调试"。
    *   这会在本地启动一个云函数模拟环境。
2.  **发送本地调用**:
    *   在弹出的本地调试窗口中，可以手动构造 `event` 对象（模拟小程序端的调用参数）。
    *   点击 "调用" 按钮，本地环境会执行该云函数。
    *   可以在开发者工具的控制台查看 `console.log` 输出和函数返回值。
3.  **断点调试**:
    *   可以在云函数代码中设置断点，进行单步调试。
4.  **测试特定函数**:
    *   **`testDatabase`**: 可以直接调用此云函数测试数据库连接。
        ```javascript
        // 在本地调试窗口的 event 中输入：
        {
          "action": "" // testDatabase 通常没有 action，或可省略
        }
        ```
    *   **`roles` 云函数中的 `testZhipuAI` action**:
        ```javascript
        // 在本地调试窗口的 event 中输入：
        {
          "action": "testZhipuAI"
        }
        ```
        确保已在本地调试的环境变量中配置了 `ZHIPU_API_KEY`。

**本地调试环境变量**:
在本地调试窗口，通常可以配置本次调用的环境变量，这对于测试依赖API密钥的函数（如 `aiModelService` 相关功能）非常有用。

通过以上步骤，开发者可以在本地高效地开发、测试和迭代云函数逻辑，然后再部署到云端。