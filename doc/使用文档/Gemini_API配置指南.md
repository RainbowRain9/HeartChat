# Gemini API 配置指南

## 1. 概述

本文档详细说明了如何在HeartChat微信小程序中配置和使用Google Gemini API。HeartChat已经集成了Gemini API，可以用于聊天、情感分析和关键词提取等功能。

## 2. 云函数配置

### 2.1 上传并部署云函数

1. 打开微信开发者工具，加载HeartChat项目
2. 右键点击`cloudfunctions/chat`文件夹，选择"上传并部署：云端安装依赖"
3. 等待部署完成
4. 右键点击`cloudfunctions/analysis`文件夹，选择"上传并部署：云端安装依赖"
5. 等待部署完成

### 2.2 配置环境变量

在微信云开发控制台中配置Gemini API密钥：

1. 打开微信开发者工具，点击"云开发"按钮
2. 进入云开发控制台，选择"云函数"
3. 找到`chat`云函数，点击"配置"
4. 在"环境变量"部分，添加以下环境变量：
   - 键：`GEMINI_API_KEY`
   - 值：您的Gemini API密钥
5. 保存配置
6. 对`analysis`云函数重复相同步骤

## 3. 测试Gemini API连接

HeartChat提供了一个测试页面，用于测试Gemini API的连接和功能：

1. 在首页点击"Gemini测试"功能卡片
2. 在测试页面中，确保选择"Google Gemini"模型
3. 点击"测试连接"按钮，检查连接是否成功
4. 如果连接成功，会显示成功消息和API返回的回复
5. 如果连接失败，会显示错误消息

## 4. 使用Gemini API

HeartChat已经默认使用Gemini API进行聊天、情感分析和关键词提取等功能。您无需进行额外的配置即可使用这些功能。

### 4.1 聊天功能

在聊天界面中，系统会自动使用Gemini API生成回复。如果您想明确指定使用Gemini模型，可以在代码中设置`modelType: 'gemini'`参数。

### 4.2 情感分析

情感分析功能也会默认使用Gemini API。系统会分析用户的情感状态，并提供情感洞察和建议。

### 4.3 关键词提取

关键词提取功能同样默认使用Gemini API。系统会从用户的对话内容中提取关键词，用于构建用户兴趣和性格特征画像。

## 5. 配置参数说明

Gemini API的配置参数已经在代码中设置好，您可以根据需要进行调整：

### 5.1 API基础URL

```javascript
const API_BASE_URL = 'https://apiv2.aliyahzombie.top';
```

### 5.2 API端点

```javascript
const url = `${API_BASE_URL}/v1beta/models/${model}:generateContent?key=${API_KEY}`;
```

### 5.3 模型ID

```javascript
const GEMINI_PRO = 'gemini-2.5-flash-preview-04-17';
const GEMINI_FLASH = 'gemini-2.5-flash-preview-04-17';
```

### 5.4 温度参数

温度参数控制输出的随机性，值越高，输出越随机：

- 聊天功能：0.7（适中，使回复更自然）
- 情感分析：0.3（较低，使分析结果更确定）
- 关键词提取：0.2（较低，使提取结果更确定）

## 6. 故障排除

如果您在使用Gemini API时遇到问题，可以尝试以下解决方案：

### 6.1 连接失败

- 检查API密钥是否正确配置
- 检查网络连接是否正常
- 检查API基础URL是否正确
- 确保API端点为`/v1beta/models/${model}:generateContent`
- 检查请求体格式是否正确

### 6.2 请求过多错误 (429)

如果遇到"Request failed with status code 429"错误，表示请求过多，API服务器进行了限流。解决方法：

- 减少短时间内的请求频率
- 实现指数退避重试机制（已在代码中实现）
- 考虑使用多个API密钥轮换使用
- 联系API提供商增加配额

### 6.3 返回空结果

- 检查请求参数是否正确
- 检查模型ID是否正确
- 尝试调整温度参数

### 6.4 云函数超时

- 检查云函数超时时间设置，可能需要增加超时时间
- 优化请求参数，减少处理时间

## 7. 功能说明

### 7.1 情感分析功能

Gemini API的情感分析功能通过`analyzeEmotion`函数实现，支持以下功能：

- 分析用户文本中的情感类型和强度
- 识别主要情感和次要情感
- 计算情感的愉悦度和激动水平
- 分析情感变化趋势
- 提取与情感相关的关键词
- 提供基于情感分析的建议

示例调用：
```javascript
const result = await wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'emotion',
    text: '用户文本内容',
    modelType: 'gemini',
    saveRecord: true
  }
});
```

### 7.2 关键词提取功能

Gemini API的关键词提取功能通过`extractKeywords`函数实现，支持以下功能：

- 从文本中提取重要关键词
- 计算关键词的权重
- 对关键词进行排序
- 限制返回的关键词数量

示例调用：
```javascript
const result = await wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'keywords',
    text: '用户文本内容',
    modelType: 'gemini',
    topK: 10
  }
});
```

### 7.3 关键词聚类功能

Gemini API的关键词聚类功能通过`clusterKeywords`函数实现，支持以下功能：

- 将语义相近的关键词聚类
- 识别每个簇的中心词或主题
- 计算簇的大小
- 设置聚类阈值和最小簇大小

示例调用：
```javascript
const result = await wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'cluster',
    text: '用户文本内容',
    modelType: 'gemini',
    threshold: 0.7,
    minClusterSize: 2
  }
});
```

### 7.4 用户兴趣分析功能

Gemini API的用户兴趣分析功能通过`analyzeUserInterests`函数实现，支持以下功能：

- 分析用户历史消息，提取兴趣领域
- 计算每个兴趣领域的置信度
- 提取与兴趣相关的关键词
- 生成用户兴趣的简短总结

示例调用：
```javascript
const result = await wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'user_interests',
    messages: ['消息1', '消息2', '消息3'],
    modelType: 'gemini'
  }
});
```

### 7.5 报告生成功能

Gemini API的报告生成功能通过`generateReportContent`函数实现，支持以下功能：

- 根据用户提供的文本生成每日心情报告
- 包含情感总结、洞察、建议、今日运势和鼓励语
- 支持自定义提示词

示例调用：
```javascript
const result = await wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'daily_report',
    prompt: '根据以下情感记录生成每日报告：...',
    modelType: 'gemini'
  }
});
```

## 8. 更新日志

- 2025-05-01: 初始版本，集成Gemini API基础功能
- 2025-05-02: 添加模型切换功能，支持在智谱AI和Gemini之间切换
- 2025-05-03: 优化Gemini API的错误处理和重试机制
- 2025-05-04: 修改默认模型类型为Gemini，设置API基础URL为https://apiv2.aliyahzombie.top，使用模型ID为gemini-2.5-flash-preview-04-17
- 2025-05-05: 修复API请求URL和请求体格式，确保正确调用API端点/v1beta/models/:generateContent
- 2025-05-06: 添加指数退避重试机制，解决429请求过多错误
- 2025-05-07: 优化提示词设计，参考智谱AI的提示词格式
- 2025-05-08: 增强情感分析功能，支持更详细的情感维度分析
- 2025-05-09: 添加关键词聚类、用户兴趣分析和报告生成等功能
- 2025-05-10: 实现与智谱AI模块相同的接口和返回格式，确保兼容性
- 2025-05-11: 优化JSON解析逻辑，提高解析成功率
- 2025-05-12: 添加对历史消息的处理支持，提高对话连贯性
- 2025-05-13: 优化消息格式转换，适配Gemini API的请求格式
- 2025-05-14: 实现系统提示词的转换，解决Gemini不支持system角色的问题
