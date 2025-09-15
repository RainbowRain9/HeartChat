# 讯飞语音听写（IFlytek STT）API集成

<cite>
**本文档引用文件**  
- [getIflytekSttUrl/index.js](file://cloudfunctions/getIflytekSttUrl/index.js)
- [voiceService.js](file://miniprogram/services/voiceService.js)
- [讯飞语音api文档.md](file://doc/参考文档/讯飞语音api文档.md)
- [iat-ws-node.js](file://doc/参考文档/iat_ws_nodejs_demo/iat-ws-node.js)
- [getIflytekSttUrl.md](file://doc/开发文档/cloudfunctions/getIflytekSttUrl.md)
- [HeartChat 语音输入功能 (讯飞语音听写) 开发文档.md](file://doc/开发文档/HeartChat 语音输入功能 (讯飞语音听写) 开发文档.md)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概览](#架构概览)
5. [详细组件分析](#详细组件分析)
6. [依赖分析](#依赖分析)
7. [性能考量](#性能考量)
8. [故障排查指南](#故障排查指南)
9. [结论](#结论)

## 简介
本文档详细说明了在 HeartChat 项目中集成讯飞语音听写（Speech-to-Text）API 的完整流程。重点阐述了后端 `getIflytekSttUrl` 云函数如何生成带签名的临时 WebSocket URL，以及前端 `voiceService.js` 如何调用该 URL 并处理实时转写结果。文档涵盖音频格式支持、采样率要求、分片上传机制、错误处理策略、调试建议、性能优化技巧及弱网容错方案，并结合情感倾诉场景说明实际使用流程。

## 项目结构
HeartChat 项目的语音识别功能主要由后端云函数和前端服务模块协同实现。后端负责安全生成带签名的连接 URL，前端负责音频采集、WebSocket 通信和结果处理。

```mermaid
graph TB
subgraph "后端 (云函数)"
GetIflytekSttUrl[getIflytekSttUrl<br>生成签名URL]
Env[环境变量<br>APPID, API Key, Secret]
end
subgraph "前端 (小程序)"
VoiceService[voiceService.js<br>语音服务]
Recorder[录音管理器]
WebSocket[WebSocket连接]
end
subgraph "第三方服务"
IFlytek[讯飞语音听写API]
end
Env --> GetIflytekSttUrl
GetIflytekSttUrl --> |返回wssUrl| VoiceService
VoiceService --> Recorder
VoiceService --> WebSocket
WebSocket --> IFlytek
IFlytek --> WebSocket
WebSocket --> VoiceService
```

**Diagram sources**
- [getIflytekSttUrl/index.js](file://cloudfunctions/getIflytekSttUrl/index.js#L1-L70)
- [voiceService.js](file://miniprogram/services/voiceService.js#L1-L486)

**Section sources**
- [getIflytekSttUrl/index.js](file://cloudfunctions/getIflytekSttUrl/index.js#L1-L70)
- [voiceService.js](file://miniprogram/services/voiceService.js#L1-L486)

## 核心组件
本系统的核心组件包括后端的 `getIflytekSttUrl` 云函数和前端的 `voiceService.js` 模块。云函数负责实现讯飞 API 的签名算法，生成安全的 WebSocket 连接地址，避免敏感信息在前端暴露。前端服务则封装了录音、连接、数据分片上传和实时结果处理的完整逻辑。

**Section sources**
- [getIflytekSttUrl/index.js](file://cloudfunctions/getIflytekSttUrl/index.js#L1-L70)
- [voiceService.js](file://miniprogram/services/voiceService.js#L1-L486)

## 架构概览
系统采用前后端分离的架构。前端通过调用云函数获取临时连接凭证，然后直接与讯飞的 WebSocket 服务建立连接进行实时语音转写。这种设计确保了 API 密钥的安全性，同时利用 WebSocket 实现了低延迟的流式识别。

```mermaid
sequenceDiagram
participant 前端 as 前端 (voiceService)
participant 云函数 as 云函数 (getIflytekSttUrl)
participant 讯飞 as 讯飞API
前端->>云函数 : 调用云函数
云函数->>云函数 : 读取环境变量(APPID, API Key, Secret)
云函数->>云函数 : 生成RFC1123时间戳
云函数->>云函数 : 构造签名字符串
云函数->>云函数 : HMAC-SHA256加密
云函数->>云函数 : Base64编码生成authorization
云函数->>前端 : 返回带签名的wssUrl
前端->>前端 : 初始化录音管理器
前端->>讯飞 : 使用wssUrl建立WebSocket连接
讯飞-->>前端 : 连接成功
前端->>讯飞 : 发送业务参数帧(含APPID)
前端->>讯飞 : 分片发送音频数据帧
讯飞->>前端 : 实时返回中间识别结果
前端->>讯飞 : 发送结束帧
讯飞->>前端 : 返回最终识别结果
前端->>前端 : 关闭连接并返回文本
```

**Diagram sources**
- [getIflytekSttUrl/index.js](file://cloudfunctions/getIflytekSttUrl/index.js#L1-L70)
- [voiceService.js](file://miniprogram/services/voiceService.js#L1-L486)

## 详细组件分析

### getIflytekSttUrl 云函数分析
该云函数是整个语音识别流程的安全核心，负责生成符合讯飞 WebAPI 2.0 协议的鉴权 URL。

```mermaid
flowchart TD
Start([开始]) --> GetConfig["从环境变量获取<br>APPID, API_SECRET, API_KEY"]
GetConfig --> CheckConfig{"配置完整?"}
CheckConfig --> |否| ReturnError["返回错误: 配置错误"]
CheckConfig --> |是| GetDate["获取当前UTC时间<br>(RFC1123格式)"]
GetDate --> BuildString["构造签名原文:<br>host + date + request-line"]
BuildString --> Sign["HMAC-SHA256加密<br>生成signature"]
Sign --> BuildAuth["构造authorization_origin字符串"]
BuildAuth --> Encode["Base64编码<br>获得authorization"]
Encode --> BuildURL["拼接完整wssUrl:<br>wss://host/path?authorization=..."]
BuildURL --> ReturnSuccess["返回成功结果<br>(wssUrl, appid)"]
ReturnError --> End([结束])
ReturnSuccess --> End
```

**Diagram sources**
- [getIflytekSttUrl/index.js](file://cloudfunctions/getIflytekSttUrl/index.js#L1-L70)

**Section sources**
- [getIflytekSttUrl/index.js](file://cloudfunctions/getIflytekSttUrl/index.js#L1-L70)

### voiceService.js 前端服务分析
该模块封装了前端语音识别的完整生命周期，从启动识别到结果处理。

```mermaid
classDiagram
class voiceService {
+startRecognition(onResult, onError, onFinalResult)
+stopRecognition()
-initRecorderManager()
-getWebSocketUrl()
-connectWebSocket(url)
-sendBusinessParamsFrame()
-sendAudioFrame(buffer)
-sendEndFrame()
-handleRecognitionResult(data)
-closeSocketConnection()
}
class recorderManager {
+start(options)
+stop()
+onStart(callback)
+onStop(callback)
+onFrameRecorded(callback)
+onError(callback)
}
class socketTask {
+send(data)
+close()
+onOpen(callback)
+onClose(callback)
+onMessage(callback)
+onError(callback)
}
voiceService --> recorderManager : "使用"
voiceService --> socketTask : "使用"
```

**Diagram sources**
- [voiceService.js](file://miniprogram/services/voiceService.js#L1-L486)

**Section sources**
- [voiceService.js](file://miniprogram/services/voiceService.js#L1-L486)

## 依赖分析
系统依赖于腾讯云函数环境、微信小程序基础库和讯飞开放平台API。云函数依赖 Node.js 的 `crypto` 模块进行签名计算，前端依赖微信的 `wx.getRecorderManager` 和 `wx.connectSocket` API。

```mermaid
graph LR
A[voiceService.js] --> B[微信小程序API]
A --> C[getIflytekSttUrl云函数]
C --> D[Node.js crypto模块]
C --> E[讯飞开放平台API]
B --> F[微信客户端]
E --> G[讯飞服务器]
```

**Diagram sources**
- [getIflytekSttUrl/index.js](file://cloudfunctions/getIflytekSttUrl/index.js#L1-L70)
- [voiceService.js](file://miniprogram/services/voiceService.js#L1-L486)

**Section sources**
- [getIflytekSttUrl/index.js](file://cloudfunctions/getIflytekSttUrl/index.js#L1-L70)
- [voiceService.js](file://miniprogram/services/voiceService.js#L1-L486)

## 性能考量
- **预连接优化**：`voiceService.js` 在模块加载时即初始化 `recorderManager`，减少首次录音的延迟。
- **TCP优化**：WebSocket 连接启用 `tcpNoDelay`，减少网络延迟。
- **静音预热**：在连接建立后立即发送静音帧，帮助讯飞服务器预热，避免开头语音丢失。
- **分片策略**：使用较小的 `frameSize` 提高响应速度，确保音频数据的实时性。

## 故障排查指南
- **错误：获取语音服务连接失败**：检查云函数环境变量 `IFLYTEK_APPID`, `IFLYTEK_API_SECRET`, `IFLYTEK_API_KEY` 是否正确配置。
- **错误：WebSocket连接错误**：确认小程序后台已添加 `wss://iat-api.xfyun.cn` 到 socket 合法域名。
- **识别结果为空或错误**：确保在真机上调试，模拟器可能无法正确获取麦克风权限或返回空结果。
- **音频质量差**：检查录音参数，确保采样率为 16000 Hz，单声道，PCM 格式。

**Section sources**
- [getIflytekSttUrl/index.js](file://cloudfunctions/getIflytekSttUrl/index.js#L1-L70)
- [voiceService.js](file://miniprogram/services/voiceService.js#L1-L486)
- [讯飞语音api文档.md](file://doc/参考文档/讯飞语音api文档.md#L1-L119)

## 结论
通过 `getIflytekSttUrl` 云函数和 `voiceService.js` 的协同工作，HeartChat 成功集成了讯飞高精度的语音听写服务。该方案安全、高效，支持实时流式识别，为用户提供了流畅的语音输入体验。在情感倾诉等场景中，用户可以通过语音自然地表达情绪，系统能快速将其转化为文本，为进一步的情感分析和智能对话提供基础。