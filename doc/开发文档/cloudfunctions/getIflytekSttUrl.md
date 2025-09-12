# GetIflytekSttUrl 云函数文档

## 功能描述

GetIflytekSttUrl云函数是一个**讯飞语音听写服务**，用于生成讯飞语音识别WebSocket连接URL，支持基于讯飞开放平台WebAPI 2.0协议的语音转文字功能。

## 文件结构

- **`index.js`** - 主入口文件，实现讯飞语音听写URL生成逻辑

## 主要流程

### 1. WebSocket URL生成流程
```
获取API配置 → 检查配置完整性 → 生成当前UTC时间 → 构造签名字符串 → HMAC-SHA256加密 → 生成授权信息 → Base64编码 → 拼接完整URL → 返回结果
```

## 数据流向

### 输入数据
- 无直接输入参数
- 从环境变量获取API配置

### 处理过程
1. **配置获取**：从环境变量获取讯飞API配置
2. **配置验证**：检查APPID、API_SECRET、API_KEY是否完整
3. **时间生成**：获取当前UTC时间并格式化为RFC1123格式
4. **签名生成**：
   - 构造待签名字符串
   - 使用HMAC-SHA256算法加密
   - 生成authorization_origin字符串
   - Base64编码获得最终authorization
5. **URL构建**：拼接完整的WebSocket连接URL

### 输出数据
- 操作成功状态
- WebSocket连接URL
- 讯飞应用ID
- 错误信息（如果有）

## 环境变量配置

### 必需的环境变量
- **IFLYTEK_APPID** - 讯飞应用ID
- **IFLYTEK_API_SECRET** - 讯飞API密钥
- **IFLYTEK_API_KEY** - 讯飞API密钥

### 默认值（开发环境）
```javascript
APPID: '60f9a524'
API_SECRET: 'ZDk4Yjg4NzNmZDk3NjgzZjgwNjYwYTFm'
API_KEY: '4feb62558a6751514bb884b0c9832030'
```

## API接口

### 请求格式
```javascript
{
  // 无需参数
}
```

### 响应格式（成功）
```javascript
{
  success: true,
  wssUrl: "wss://iat-api.xfyun.cn/v2/iat?authorization=xxx&date=xxx&host=iat-api.xfyun.cn",
  appid: "60f9a524"
}
```

### 响应格式（失败）
```javascript
{
  success: false,
  error: "语音服务配置错误" 或 "生成语音服务连接失败"
}
```

## 讯飞API协议

### WebSocket连接信息
- **主机名**：iat-api.xfyun.cn
- **请求路径**：/v2/iat
- **协议**：WebSocket Secure (wss://)

### 签名算法
1. **签名原字符串**：
```
host: iat-api.xfyun.cn
date: [RFC1123格式时间]
GET /v2/iat HTTP/1.1
```

2. **加密算法**：HMAC-SHA256
3. **授权格式**：
```
api_key="[API_KEY]", algorithm="hmac-sha256", headers="host date request-line", signature="[签名]"
```

## 错误处理

### 配置错误
- 环境变量缺失
- 返回配置错误信息

### 系统错误
- 加密过程异常
- URL构建失败
- 返回详细的错误信息

## 使用场景

1. **语音输入**：为语音转文字功能提供连接URL
2. **实时语音识别**：支持实时语音输入转换
3. **多语言支持**：讯飞支持多种语言识别
4. **高精度识别**：提供专业级的语音识别服务

## 注意事项

- 需要在云开发控制台配置正确的环境变量
- 生产环境应该使用真实的讯飞API凭证
- WebSocket连接有时效性，建议在使用前获取
- 需要确保网络连接正常

## 技术依赖

- **crypto模块**：用于HMAC-SHA256加密
- **wx-server-sdk**：微信云开发SDK
- **讯飞开放平台**：WebAPI 2.0协议

## 安全性

- API密钥通过环境变量安全存储
- 使用HTTPS协议传输
- 签名机制确保请求合法性
- 避免在前端暴露敏感信息