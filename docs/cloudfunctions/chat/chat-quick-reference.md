# HeartChat Chat 云函数快速参考指南

## 🚀 核心功能速查

### 1. 消息发送流程

```javascript
// 主入口 - 发送消息
async function sendMessage(event, context) {
  const { content, roleId } = event;
  const OPENID = cloud.getWXContext().OPENID;
  
  // 1. 验证参数
  if (!content || !roleId) {
    return { success: false, error: '参数不完整' };
  }
  
  // 2. 获取角色信息
  const roleResult = await cloud.callFunction({
    name: 'roles',
    data: { action: 'getRoleDetail', roleId }
  });
  
  // 3. 查询或创建会话
  const chatId = await getOrCreateChat(OPENID, roleId, roleResult.result.data);
  
  // 4. 获取历史消息
  const history = await getChatHistory(OPENID, roleId);
  
  // 5. 保存用户消息
  await saveUserMessage(chatId, content, roleId, OPENID);
  
  // 6. 生成AI回复
  const aiReply = await generateAIReply({
    message: content,
    history: history,
    roleInfo: roleResult.result.data,
    systemPrompt: customSystemPrompt
  });
  
  // 7. 分段处理并保存
  const segments = splitMessage(aiReply);
  await saveSegmentedMessages(chatId, segments, roleId, OPENID);
  
  return { success: true, segments };
}
```

### 2. 消息分段算法

```javascript
function splitMessage(message) {
  if (!message || typeof message !== 'string') {
    return [message];
  }
  
  // 清理Markdown语法
  const cleanMessage = message.replace(/\*\*([^*]+)\*\*/g, '$1');
  const MAX_SEGMENT_LENGTH = 120;
  
  // 检查列表结构
  const hasListOrNumbering = /\n\s*[-*]\s|\n\s*\d+\.\s/.test(cleanMessage);
  
  if (hasListOrNumbering) {
    // 列表保护分段
    let segments = cleanMessage.split(/\n\s*\n/);
    segments = segments.filter(segment => segment.trim().length > 0);
    
    // 处理过长的列表段落
    return segments.map(segment => {
      if (segment.length > MAX_SEGMENT_LENGTH) {
        return splitLongSegment(segment, MAX_SEGMENT_LENGTH);
      }
      return segment;
    }).flat();
  }
  
  // 正常分段流程
  return normalSegmentation(cleanMessage, MAX_SEGMENT_LENGTH);
}
```

### 3. 提示词优先级选择

```javascript
async function generateChatReply(userMessage, history = [], roleInfo = {}, customSystemPrompt = null) {
  let systemPrompt = '';
  
  // 优先级1: 自定义系统提示词（包含用户画像）
  if (customSystemPrompt) {
    systemPrompt = customSystemPrompt;
    console.log('使用自定义系统提示词（包含用户画像）');
  } 
  // 优先级2: 角色prompt字段
  else if (roleInfo && roleInfo.prompt) {
    systemPrompt = roleInfo.prompt;
    console.log('使用角色的prompt字段作为系统提示词');
  } 
  // 优先级3: 角色system_prompt字段
  else if (roleInfo && roleInfo.system_prompt) {
    systemPrompt = roleInfo.system_prompt;
    console.log('使用角色的system_prompt字段作为系统提示词');
  } 
  // 优先级4: 默认系统提示词
  else {
    systemPrompt = `你是一个友好、有帮助的AI助手。请以自然、友好的方式回复用户的消息。

对话风格指导：
- 使用非常简短的对话方式，尽量模仿真实手机聊天
- 每条消息不超过1-2句话，尽量保持简洁
- 将长回复拆分成多条非常短小的消息

格式要求：
- 绝对不要使用Markdown语法
- 列表项直接使用数字或文字开头`;
  }
  
  // 构建消息数组
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ];
  
  // 调用智谱AI API
  const response = await axios.post(`${API_BASE_URL}/chat/completions`, {
    model: 'glm-4.5-flash',
    messages: messages,
    temperature: 0.7
  }, {
    headers: getAuthHeaders()
  });
  
  return response.data.choices[0].message.content;
}
```

### 4. 数据库操作

```javascript
// 创建或获取聊天会话
async function getOrCreateChat(openId, roleId, roleInfo) {
  const db = cloud.database();
  const _ = db.command;
  
  // 查询现有会话
  const existingChat = await db.collection('chats')
    .where({
      openId: openId,
      roleId: roleId
    })
    .get();
  
  if (existingChat.data.length > 0) {
    return existingChat.data[0]._id;
  }
  
  // 创建新会话
  const newChat = await db.collection('chats').add({
    data: {
      openId: openId,
      roleId: roleId,
      roleName: roleInfo.name,
      messageCount: 0,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });
  
  return newChat._id;
}

// 保存分段消息
async function saveSegmentedMessages(chatId, segments, roleId, openId) {
  const db = cloud.database();
  const batchOperations = [];
  
  segments.forEach((segment, index) => {
    batchOperations.push({
      data: {
        chatId: chatId,
        roleId: roleId,
        openId: openId,
        content: segment,
        sender_type: 'ai',
        createTime: db.serverDate(),
        status: 'sent',
        isSegment: true,
        segmentIndex: index,
        totalSegments: segments.length,
        originalMessageId: `${chatId}_${Date.now()}`
      }
    });
  });
  
  // 批量保存消息
  return await db.collection('messages').add({
    data: batchOperations
  });
}
```

### 5. 错误处理模式

```javascript
// 统一错误处理
async function safeAPICall(apiFunction, errorMessage = 'API调用失败') {
  try {
    const result = await apiFunction();
    return result;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    
    // 记录错误日志
    await logError({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // 返回用户友好的错误信息
    return {
      success: false,
      error: getFriendlyErrorMessage(error)
    };
  }
}

// 获取用户友好的错误信息
function getFriendlyErrorMessage(error) {
  const errorMap = {
    'NETWORK_ERROR': '网络连接异常，请检查网络后重试',
    'API_TIMEOUT': '服务器响应超时，请稍后重试',
    'RATE_LIMIT': '请求过于频繁，请稍后再试',
    'INVALID_INPUT': '输入内容不合法，请检查后重试'
  };
  
  return errorMap[error.code] || '服务暂时不可用，请稍后重试';
}
```

## 🔧 配置参考

### 环境变量配置
```bash
# 智谱AI配置
ZHIPU_API_KEY=your_api_key_here

# 微信云开发配置
CLOUD_ENV=heartchat-prod

# 其他配置
MAX_HISTORY_LENGTH=10
MAX_SEGMENT_LENGTH=120
API_TIMEOUT=30000
```

### 数据库索引设计
```javascript
// 主要索引配置
const indexes = [
  {
    collection: 'chats',
    index: { openId: 1, roleId: 1, updateTime: -1 }
  },
  {
    collection: 'messages',
    index: { chatId: 1, createTime: 1 }
  },
  {
    collection: 'messages',
    index: { originalMessageId: 1 }
  }
];
```

## 📊 性能监控

### 关键指标监控
```javascript
// 性能监控中间件
const performanceMonitor = {
  startTimer(label) {
    this.timers = this.timers || {};
    this.timers[label] = Date.now();
  },
  
  endTimer(label) {
    const duration = Date.now() - this.timers[label];
    console.log(`[性能] ${label}: ${duration}ms`);
    
    // 记录到监控系统
    this.recordMetric(label, duration);
  },
  
  recordMetric(metric, value) {
    // 实现指标记录逻辑
    console.log(`[指标] ${metric}: ${value}`);
  }
};

// 使用示例
async function monitoredSendMessage(event) {
  performanceMonitor.startTimer('sendMessage');
  
  try {
    const result = await sendMessage(event);
    performanceMonitor.endTimer('sendMessage');
    return result;
  } catch (error) {
    performanceMonitor.endTimer('sendMessage');
    throw error;
  }
}
```

## 🛠️ 调试工具

### 日志记录
```javascript
// 结构化日志记录
class Logger {
  static info(message, meta = {}) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      meta,
      service: 'chat-function'
    }));
  }
  
  static error(message, error = null, meta = {}) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: error?.stack || error?.message,
      meta,
      service: 'chat-function'
    }));
  }
  
  static debug(message, meta = {}) {
    if (process.env.DEBUG_MODE === 'true') {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        meta,
        service: 'chat-function'
      }));
    }
  }
}
```

### 测试用例示例
```javascript
// 单元测试示例
describe('Chat Cloud Function', () => {
  describe('splitMessage', () => {
    it('应该正确分段普通文本', () => {
      const message = '第一段。第二段。第三段。';
      const segments = splitMessage(message);
      expect(segments).toHaveLength(3);
    });
    
    it('应该保护列表结构', () => {
      const message = '1. 第一项\n2. 第二项\n3. 第三项';
      const segments = splitMessage(message);
      expect(segments).toHaveLength(1);
    });
  });
  
  describe('generateChatReply', () => {
    it('应该使用正确的提示词优先级', async () => {
      const roleInfo = {
        prompt: '角色提示词',
        system_prompt: '系统提示词'
      };
      
      const result = await generateChatReply(
        '测试消息',
        [],
        roleInfo,
        null
      );
      
      expect(result).toBeDefined();
    });
  });
});
```

## 📝 常见问题解决

### 1. 消息分段异常
```javascript
// 问题：分段后消息不完整
// 解决：调整分段算法
function robustSplitMessage(message) {
  const segments = splitMessage(message);
  
  // 验证分段完整性
  const reconstructed = segments.join('');
  if (reconstructed !== message.replace(/\*\*([^*]+)\*\*/g, '$1')) {
    console.warn('消息分段可能不完整');
  }
  
  return segments;
}
```

### 2. API调用超时
```javascript
// 问题：智谱AI API调用超时
// 解决：增加重试机制
async function retryAPICall(apiCall, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. 数据库连接问题
```javascript
// 问题：数据库连接不稳定
// 解决：连接池管理
class DatabaseManager {
  constructor() {
    this.connectionPool = [];
    this.maxPoolSize = 10;
  }
  
  async getConnection() {
    if (this.connectionPool.length > 0) {
      return this.connectionPool.pop();
    }
    
    // 创建新连接
    return await this.createConnection();
  }
  
  releaseConnection(connection) {
    if (this.connectionPool.length < this.maxPoolSize) {
      this.connectionPool.push(connection);
    }
  }
}
```

---

**版本**: v1.0  
**更新时间**: 2024-01-09  
**维护团队**: HeartChat 开发团队