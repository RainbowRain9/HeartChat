# HttpRequest 云函数文档

## 功能描述

HttpRequest云函数是一个**HTTP请求代理服务**，提供通用的HTTP请求发送功能，支持GET、POST、PUT、DELETE等多种HTTP方法，并包含测试功能验证服务可用性。

## 文件结构

- **`index.js`** - 主入口文件，实现HTTP请求发送逻辑
- **`test.js`** - 测试模块，提供HTTP请求功能测试

## 主要流程

### 1. HTTP请求流程
```
接收请求参数 → 参数验证 → 构建请求选项 → 设置请求头和请求体 → 发送HTTP请求 → 处理响应 → 返回结果
```

### 2. 测试流程
```
调用测试函数 → 发送测试请求 → 检查响应结果 → 验证功能可用性 → 返回测试结果
```

## 数据流向

### 输入数据
- `url` - 请求URL（必需）
- `method` - HTTP方法（可选，默认GET）
- `headers` - 请求头（可选，默认空对象）
- `body` - 请求体（可选）
- `timeout` - 超时时间（可选，默认30000毫秒）
- `action` - 操作类型（可选，test表示测试）

### 处理过程
1. **参数解析**：解析请求方法和相关参数
2. **选项构建**：
   - 设置HTTP方法（转换为大写）
   - 配置请求头
   - 设置超时时间
3. **请求体处理**：
   - 字符串类型：直接作为body
   - 对象类型：作为json发送
4. **请求发送**：使用got库发送HTTP请求
5. **响应处理**：
   - 成功：返回状态码、响应头和响应体
   - 失败：返回错误信息和状态码
6. **测试模式**：调用测试函数验证服务可用性

### 输出数据
- HTTP状态码
- 响应头信息
- 响应体内容
- 错误信息（如果有）
- 测试结果（测试模式）

## API接口

### 请求格式（普通请求）
```javascript
{
  url: "https://api.example.com/endpoint", // 必需
  method: "POST", // 可选，默认GET
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer token"
  }, // 可选
  body: {
    key: "value"
  }, // 可选
  timeout: 10000 // 可选，默认30000毫秒
}
```

### 请求格式（测试请求）
```javascript
{
  action: "test"
}
```

### 响应格式（成功）
```javascript
{
  statusCode: 200,
  headers: {
    "content-type": "application/json",
    "content-length": "123"
  },
  body: "响应体内容"
}
```

### 响应格式（失败）
```javascript
{
  error: true,
  statusCode: 404,
  message: "Not Found",
  body: "错误响应体"
}
```

### 响应格式（测试）
```javascript
{
  success: true,
  message: "httpRequest云函数调用成功",
  result: {
    // HTTP请求响应结果
  }
}
```

## 支持的HTTP方法

- **GET**：获取资源
- **POST**：创建资源
- **PUT**：更新资源
- **DELETE**：删除资源
- **PATCH**：部分更新
- **HEAD**：获取头信息
- **OPTIONS**：获取支持的方法

## 错误处理

### 网络错误
- 连接超时
- DNS解析失败
- 网络不可达

### HTTP错误
- 4xx客户端错误
- 5xx服务器错误
- 重定向错误

### 系统错误
- 参数验证失败
- 请求构建错误
- 响应解析错误

## 测试功能

### 测试目标
使用httpbin.org公共API测试HTTP请求功能

### 测试流程
1. 发送GET请求到httpbin.org/get
2. 验证响应状态和内容
3. 返回测试结果

## 安全特性

- 支持HTTPS请求
- 可设置自定义请求头
- 超时保护机制
- 错误信息脱敏

## 使用场景

1. **API代理**：绕过跨域限制访问外部API
2. **数据获取**：从第三方服务获取数据
3. **Webhook处理**：接收和处理Webhook通知
4. **服务集成**：与其他HTTP服务集成
5. **功能测试**：测试外部服务可用性

## 技术依赖

- **got库**：HTTP请求客户端
- **wx-server-sdk**：微信云开发SDK
- **httpbin.org**：公共测试API（测试用）

## 性能优化

- 可配置超时时间
- 支持连接复用
- 异步请求处理
- 错误恢复机制

## 注意事项

- 需要确保目标域名在微信小程序的request合法域名列表中
- 建议设置合理的超时时间
- 处理大响应体时注意内存使用
- 敏感信息不要在URL或请求头中传递