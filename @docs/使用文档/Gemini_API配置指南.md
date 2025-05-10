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

## 7. 更新日志

- 2025-05-01: 初始版本，集成Gemini API基础功能
- 2025-05-02: 添加模型切换功能，支持在智谱AI和Gemini之间切换
- 2025-05-03: 优化Gemini API的错误处理和重试机制
- 2025-05-04: 修改默认模型类型为Gemini，设置API基础URL为https://apiv2.aliyahzombie.top，使用模型ID为gemini-2.5-flash-preview-04-17
- 2025-05-05: 修复API请求URL和请求体格式，确保正确调用API端点/v1beta/models/:generateContent
- 2025-05-06: 添加指数退避重试机制，解决429请求过多错误
