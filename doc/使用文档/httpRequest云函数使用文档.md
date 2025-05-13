# httpRequest 云函数使用文档

## 概述

`httpRequest` 云函数是一个通用的HTTP请求工具，用于在云函数环境中发送HTTP请求。它主要用于调用外部API，如智谱AI接口等。由于微信小程序云函数环境中无法直接使用浏览器的`fetch`或Node.js的`http`模块，因此需要使用此云函数作为中间层来发送HTTP请求。

## 功能特点

- 支持所有HTTP方法（GET, POST, PUT, DELETE等）
- 支持自定义请求头
- 支持发送JSON或文本格式的请求体
- 支持设置请求超时时间
- 提供详细的错误信息和响应数据

## 接口说明

### 发送HTTP请求

**请求参数：**

```javascript
{
  url: "请求URL", // 必填，要请求的URL
  method: "请求方法", // 可选，默认为"GET"
  headers: { // 可选，请求头
    "Content-Type": "application/json",
    "Authorization": "Bearer your-token"
  },
  body: "请求体", // 可选，可以是字符串或对象
  timeout: 30000 // 可选，超时时间（毫秒），默认30000
}
```

**返回结果：**

成功时：
```javascript
{
  statusCode: 200, // HTTP状态码
  headers: { // 响应头
    "content-type": "application/json",
    // 其他响应头...
  },
  body: "响应内容" // 响应体，通常是字符串
}
```

失败时：
```javascript
{
  error: true,
  statusCode: 500, // 错误状态码
  message: "错误信息",
  body: "错误详情"
}
```

### 测试HTTP请求功能

**请求参数：**

```javascript
{
  action: "test"
}
```

**返回结果：**

成功时：
```javascript
{
  success: true,
  message: "httpRequest云函数调用成功",
  result: {
    // HTTP请求的结果...
  }
}
```

失败时：
```javascript
{
  success: false,
  error: "错误信息"
}
```

## 使用示例

### 发送GET请求

```javascript
try {
  const result = await wx.cloud.callFunction({
    name: 'httpRequest',
    data: {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer your-token'
      }
    }
  });
  
  if (!result.result.error) {
    const responseData = JSON.parse(result.result.body);
    console.log('请求成功:', responseData);
  } else {
    console.error('请求失败:', result.result.message);
  }
} catch (error) {
  console.error('调用云函数失败:', error);
}
```

### 发送POST请求

```javascript
try {
  const result = await wx.cloud.callFunction({
    name: 'httpRequest',
    data: {
      url: 'https://api.example.com/data',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-token'
      },
      body: JSON.stringify({
        name: '测试数据',
        value: 123
      })
    }
  });
  
  if (!result.result.error) {
    const responseData = JSON.parse(result.result.body);
    console.log('请求成功:', responseData);
  } else {
    console.error('请求失败:', result.result.message);
  }
} catch (error) {
  console.error('调用云函数失败:', error);
}
```

### 调用智谱AI接口

```javascript
try {
  const apiKey = 'your-zhipu-api-key';
  
  const result = await wx.cloud.callFunction({
    name: 'httpRequest',
    data: {
      url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [
          {
            role: 'user',
            content: '你好，请介绍一下自己。'
          }
        ],
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 2000
      })
    }
  });
  
  if (!result.result.error) {
    const responseData = JSON.parse(result.result.body);
    console.log('智谱AI回复:', responseData.choices[0].message.content);
  } else {
    console.error('调用智谱AI失败:', result.result.message);
  }
} catch (error) {
  console.error('调用云函数失败:', error);
}
```

## 部署说明

### 1. 准备工作

确保您已经安装了微信开发者工具，并且已经创建了云开发环境。

### 2. 上传云函数

1. 在微信开发者工具中，打开 HeartChat 项目
2. 在左侧文件树中，找到 `cloudfunctions/httpRequest` 目录
3. 确保目录中包含以下文件：
   - `index.js`：主函数入口
   - `test.js`：测试功能
   - `package.json`：依赖配置
4. 检查 `package.json` 文件，确保包含以下依赖：
   ```json
   {
     "dependencies": {
       "wx-server-sdk": "~2.6.3",
       "got": "^11.8.5"
     }
   }
   ```
5. 右键点击 `httpRequest` 目录，选择"上传并部署：云端安装依赖"
6. 等待部署完成，控制台会显示"上传成功"的消息

### 3. 测试云函数

1. 在微信开发者工具中，点击"云开发"按钮
2. 选择"云函数"选项卡
3. 点击 `httpRequest` 云函数
4. 选择"测试"选项卡
5. 在测试参数输入框中输入：`{"action": "test"}`
6. 点击"执行函数"按钮
7. 检查返回结果，确认云函数能够正常工作

## 注意事项

1. **安全性**：由于此云函数可以发送任意HTTP请求，应该注意控制其访问权限，避免被滥用。
2. **错误处理**：在使用此云函数时，应该始终检查返回结果中是否包含`error`字段，以确保请求成功。
3. **超时设置**：对于可能需要较长时间的请求，可以适当增加`timeout`参数的值。
4. **响应解析**：响应体通常是字符串格式，如果是JSON数据，需要使用`JSON.parse()`进行解析。
5. **依赖版本**：确保`got`库的版本兼容，建议使用`^11.8.5`版本。
6. **请求限制**：注意微信云函数的执行时间限制（默认为20秒）和内存限制（默认为256MB）。

## 常见问题

### 1. 请求超时

**问题**：发送请求时出现超时错误。

**解决方案**：
- 增加`timeout`参数的值
- 检查目标服务器的响应时间
- 考虑分批处理大量数据

### 2. 无法解析响应

**问题**：无法解析返回的响应体。

**解决方案**：
- 检查响应的`Content-Type`头
- 确保使用正确的解析方法（如JSON数据使用`JSON.parse()`）
- 检查响应体是否为有效格式

### 3. 跨域问题

**问题**：API返回跨域错误。

**解决方案**：
- 云函数环境中通常不存在跨域问题，这是云函数的优势之一
- 如果仍然遇到跨域问题，检查目标API是否有特殊的访问限制

### 4. 请求被拒绝

**问题**：请求被目标服务器拒绝。

**解决方案**：
- 检查认证信息（如API密钥、令牌等）是否正确
- 确保请求头和请求体格式符合API要求
- 查看目标API的文档，确认请求参数是否正确
