# HeartChat 云函数设计指南

## 概述

本文档提供 HeartChat 项目云函数的设计和开发指南，包括云函数结构、命名规范、错误处理、安全性和性能优化等方面的最佳实践。

## 云函数架构

HeartChat 的云函数采用模块化设计，按功能领域划分为多个云函数，每个云函数可处理相关的多个操作。

```
cloudfunctions/
├── login/                  # 用户登录相关
├── user/                   # 用户管理相关
├── role/                   # 角色管理相关
├── chat/                   # 聊天功能相关
├── analysis/               # 情感分析相关
├── report/                 # 报告生成相关
└── system/                 # 系统管理相关
```

## 云函数设计原则

1. **单一职责**：每个云函数应专注于特定的功能领域
2. **模块化**：将复杂逻辑拆分为独立模块
3. **可测试性**：设计便于单元测试的函数
4. **错误处理**：提供统一的错误处理机制
5. **安全性**：验证用户身份和权限
6. **性能优化**：优化数据库操作和计算密集型任务

## 云函数结构

每个云函数应遵循以下结构：

```
function-name/
├── index.js                # 入口文件
├── package.json            # 依赖配置
├── config.js               # 配置文件
├── services/               # 业务逻辑
│   ├── serviceA.js
│   └── serviceB.js
├── utils/                  # 工具函数
│   ├── validator.js
│   └── formatter.js
└── __test__/               # 测试文件
    ├── index.test.js
    └── services.test.js
```

### 入口文件 (index.js)

入口文件应简洁明了，主要负责：
1. 初始化云环境
2. 路由请求到对应的服务
3. 统一的错误处理
4. 返回标准格式的响应

```javascript
// index.js
const cloud = require('wx-server-sdk');
const serviceA = require('./services/serviceA');
const serviceB = require('./services/serviceB');
const { validateParams } = require('./utils/validator');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 统一响应格式
function createResponse(success, data = null, error = null) {
  return {
    success,
    data,
    error,
    timestamp: Date.now()
  };
}

// 主函数
exports.main = async (event, context) => {
  console.log('Function invoked with event:', event);
  
  try {
    const { action, params } = event;
    
    // 参数验证
    const validationError = validateParams(action, params);
    if (validationError) {
      throw new Error(`Invalid parameters: ${validationError}`);
    }
    
    // 路由到对应服务
    let result;
    switch (action) {
      case 'actionA':
        result = await serviceA.handleActionA(params, context);
        break;
      case 'actionB':
        result = await serviceB.handleActionB(params, context);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return createResponse(true, result);
  } catch (error) {
    console.error(`Error in function: ${error.message}`, error);
    return createResponse(false, null, {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
};
```

### 服务模块 (services/)

服务模块包含具体的业务逻辑：

```javascript
// services/serviceA.js
const cloud = require('wx-server-sdk');
const { checkPermission } = require('../utils/validator');

const db = cloud.database();

async function handleActionA(params, context) {
  // 权限检查
  const { OPENID } = cloud.getWXContext();
  await checkPermission(OPENID, 'actionA');
  
  // 业务逻辑
  const { id, data } = params;
  
  // 数据库操作
  const result = await db.collection('collection').doc(id).update({
    data
  });
  
  return {
    id,
    updated: result.stats.updated > 0
  };
}

module.exports = {
  handleActionA
};
```

### 工具模块 (utils/)

工具模块包含可复用的辅助函数：

```javascript
// utils/validator.js
const cloud = require('wx-server-sdk');

// 参数验证
function validateParams(action, params) {
  if (!action) {
    return 'Action is required';
  }
  
  if (!params) {
    return 'Params are required';
  }
  
  switch (action) {
    case 'actionA':
      if (!params.id) {
        return 'id is required for actionA';
      }
      break;
    // 其他操作的参数验证
  }
  
  return null;
}

// 权限检查
async function checkPermission(openid, action) {
  if (!openid) {
    throw new Error('Unauthorized: User not logged in');
  }
  
  const db = cloud.database();
  const user = await db.collection('users').doc(openid).get();
  
  if (!user.data) {
    throw new Error('Unauthorized: User not found');
  }
  
  // 根据操作类型和用户角色检查权限
  // ...
  
  return true;
}

module.exports = {
  validateParams,
  checkPermission
};
```

## 命名规范

### 云函数命名

- 使用小写字母
- 使用连字符（-）连接多个单词
- 名称应反映功能领域

例如：`user-management`, `emotion-analysis`

### 操作命名

- 使用驼峰命名法（camelCase）
- 使用动词开头，表示操作
- 名称应清晰表达操作目的

例如：`getUserProfile`, `updateRoleInfo`, `analyzeEmotion`

### 文件命名

- 使用小写字母
- 使用连字符（-）连接多个单词
- 名称应反映文件内容

例如：`user-service.js`, `emotion-analyzer.js`

## 参数处理

### 参数结构

云函数调用参数应遵循以下结构：

```javascript
{
  action: 'actionName',  // 操作名称
  params: {              // 操作参数
    param1: value1,
    param2: value2
  }
}
```

### 参数验证

- 验证必需参数是否存在
- 验证参数类型是否正确
- 验证参数值是否在有效范围内
- 提供明确的错误信息

```javascript
function validateCreateUser(params) {
  const errors = [];
  
  if (!params.nickName) {
    errors.push('nickName is required');
  } else if (typeof params.nickName !== 'string') {
    errors.push('nickName must be a string');
  } else if (params.nickName.length > 32) {
    errors.push('nickName cannot exceed 32 characters');
  }
  
  // 验证其他参数
  
  return errors.length > 0 ? errors.join('; ') : null;
}
```

## 错误处理

### 错误类型

定义常见错误类型：

```javascript
// utils/errors.js
class AppError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

class AuthorizationError extends AppError {
  constructor(message, details = null) {
    super(message, 'AUTHORIZATION_ERROR', details);
  }
}

class ResourceNotFoundError extends AppError {
  constructor(message, details = null) {
    super(message, 'RESOURCE_NOT_FOUND', details);
  }
}

class DatabaseError extends AppError {
  constructor(message, details = null) {
    super(message, 'DATABASE_ERROR', details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthorizationError,
  ResourceNotFoundError,
  DatabaseError
};
```

### 错误捕获与处理

- 使用 try/catch 捕获异常
- 转换为应用定义的错误类型
- 记录错误日志
- 返回友好的错误信息

```javascript
try {
  // 业务逻辑
} catch (error) {
  if (error instanceof ValidationError) {
    // 处理验证错误
  } else if (error instanceof AuthorizationError) {
    // 处理授权错误
  } else if (error instanceof ResourceNotFoundError) {
    // 处理资源不存在错误
  } else if (error instanceof DatabaseError) {
    // 处理数据库错误
  } else {
    // 处理未知错误
    console.error('Unexpected error:', error);
    throw new AppError('An unexpected error occurred', 'INTERNAL_ERROR');
  }
}
```

## 数据库操作

### 查询优化

- 使用索引字段进行查询
- 限制返回字段（投影）
- 分页查询大量数据
- 避免嵌套查询

```javascript
// 优化查询示例
async function getUserMessages(userId, page = 1, pageSize = 10) {
  const db = cloud.database();
  const $ = db.command.aggregate;
  
  // 使用索引字段查询
  // 限制返回字段
  // 分页查询
  const messages = await db.collection('messages')
    .where({ userId })
    .field({ content: 1, timestamp: 1, emotionType: 1 })
    .orderBy('timestamp', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get();
  
  return messages.data;
}
```

### 事务操作

使用事务确保数据一致性：

```javascript
async function transferPoints(fromUserId, toUserId, points) {
  const db = cloud.database();
  
  // 开始事务
  const transaction = await db.startTransaction();
  
  try {
    // 检查余额
    const fromUser = await transaction.collection('users').doc(fromUserId).get();
    if (fromUser.data.points < points) {
      throw new ValidationError('Insufficient points');
    }
    
    // 扣除积分
    await transaction.collection('users').doc(fromUserId).update({
      data: {
        points: db.command.inc(-points)
      }
    });
    
    // 增加积分
    await transaction.collection('users').doc(toUserId).update({
      data: {
        points: db.command.inc(points)
      }
    });
    
    // 记录交易
    await transaction.collection('point_transactions').add({
      data: {
        fromUserId,
        toUserId,
        points,
        timestamp: db.serverDate()
      }
    });
    
    // 提交事务
    await transaction.commit();
    
    return { success: true };
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    throw error;
  }
}
```

## 安全性

### 身份验证

使用微信云开发提供的身份验证机制：

```javascript
function getCurrentUser() {
  const { OPENID, APPID } = cloud.getWXContext();
  
  if (!OPENID) {
    throw new AuthorizationError('User not authenticated');
  }
  
  return { openid: OPENID, appid: APPID };
}
```

### 权限控制

实现基于角色的访问控制：

```javascript
async function checkUserPermission(userId, resource, action) {
  const db = cloud.database();
  
  // 获取用户角色
  const user = await db.collection('users').doc(userId).get();
  if (!user.data) {
    throw new ResourceNotFoundError('User not found');
  }
  
  const userRole = user.data.role || 'user';
  
  // 获取角色权限
  const permission = await db.collection('permissions')
    .where({
      role: userRole,
      resource,
      action
    })
    .get();
  
  return permission.data.length > 0;
}
```

### 数据验证

验证用户输入，防止注入攻击：

```javascript
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  // 移除危险字符
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

## 性能优化

### 并行操作

使用 Promise.all 并行处理独立操作：

```javascript
async function getUserDashboard(userId) {
  // 并行获取用户信息、消息和统计数据
  const [userInfo, messages, stats] = await Promise.all([
    getUserInfo(userId),
    getUserMessages(userId),
    getUserStats(userId)
  ]);
  
  return {
    userInfo,
    messages,
    stats
  };
}
```

### 缓存策略

使用内存缓存减少数据库访问：

```javascript
// 简单的内存缓存
const cache = {
  data: {},
  set(key, value, ttl = 60000) {
    this.data[key] = {
      value,
      expiry: Date.now() + ttl
    };
  },
  get(key) {
    const item = this.data[key];
    if (!item) return null;
    if (item.expiry < Date.now()) {
      delete this.data[key];
      return null;
    }
    return item.value;
  },
  invalidate(key) {
    delete this.data[key];
  }
};

// 使用缓存
async function getSystemConfig(key) {
  const cacheKey = `config:${key}`;
  
  // 检查缓存
  const cachedValue = cache.get(cacheKey);
  if (cachedValue) {
    return cachedValue;
  }
  
  // 从数据库获取
  const db = cloud.database();
  const config = await db.collection('sys_config')
    .where({ configKey: key })
    .get();
  
  if (config.data.length === 0) {
    return null;
  }
  
  // 存入缓存
  cache.set(cacheKey, config.data[0].configValue, 300000); // 5分钟缓存
  
  return config.data[0].configValue;
}
```

### 批量操作

使用批量操作减少请求次数：

```javascript
async function batchUpdateUserStatus(userIds, status) {
  const db = cloud.database();
  const _ = db.command;
  
  // 批量更新
  const result = await db.collection('users')
    .where({
      _id: _.in(userIds)
    })
    .update({
      data: {
        status,
        updateTime: db.serverDate()
      }
    });
  
  return result;
}
```

## 日志记录

### 日志级别

定义不同的日志级别：

```javascript
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    level,
    timestamp,
    message,
    data
  };
  
  console.log(JSON.stringify(logEntry));
  
  // 对于错误级别，可以存储到数据库
  if (level === LogLevel.ERROR) {
    storeErrorLog(logEntry);
  }
}

async function storeErrorLog(logEntry) {
  const db = cloud.database();
  await db.collection('error_logs').add({
    data: logEntry
  });
}

// 使用示例
log(LogLevel.INFO, 'User logged in', { userId: 'user123' });
log(LogLevel.ERROR, 'Failed to process payment', { error: 'Insufficient funds' });
```

### 请求日志

记录请求和响应信息：

```javascript
async function logRequest(event, context, result) {
  const db = cloud.database();
  
  // 不记录敏感信息
  const sanitizedEvent = { ...event };
  if (sanitizedEvent.params && sanitizedEvent.params.password) {
    sanitizedEvent.params.password = '******';
  }
  
  await db.collection('request_logs').add({
    data: {
      action: event.action,
      params: sanitizedEvent.params,
      userInfo: context.userInfo,
      success: result.success,
      error: result.error,
      timestamp: db.serverDate(),
      executionTime: result.executionTime
    }
  });
}
```

## 测试策略

### 单元测试

使用 Jest 进行单元测试：

```javascript
// __test__/services.test.js
const serviceA = require('../services/serviceA');
const { ValidationError } = require('../utils/errors');

// 模拟依赖
jest.mock('wx-server-sdk', () => ({
  init: jest.fn(),
  getWXContext: jest.fn().mockReturnValue({ OPENID: 'test-user' }),
  database: jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: { id: 'test-user', name: 'Test User' } }),
        update: jest.fn().mockResolvedValue({ stats: { updated: 1 } })
      })
    })
  })
}));

describe('ServiceA', () => {
  test('handleActionA should update user data', async () => {
    const params = {
      id: 'test-user',
      data: { name: 'Updated Name' }
    };
    
    const result = await serviceA.handleActionA(params);
    
    expect(result).toEqual({
      id: 'test-user',
      updated: true
    });
  });
  
  test('handleActionA should throw error for invalid id', async () => {
    const params = {
      data: { name: 'Updated Name' }
    };
    
    await expect(serviceA.handleActionA(params))
      .rejects
      .toThrow(ValidationError);
  });
});
```

### 集成测试

在测试环境中进行集成测试：

```javascript
// 集成测试示例
async function testUserFlow() {
  // 创建测试用户
  const userId = await createTestUser();
  
  // 测试获取用户信息
  const userInfo = await getUserInfo(userId);
  assert(userInfo.name === 'Test User', 'User name should match');
  
  // 测试更新用户信息
  await updateUserInfo(userId, { name: 'Updated Name' });
  const updatedUser = await getUserInfo(userId);
  assert(updatedUser.name === 'Updated Name', 'User name should be updated');
  
  // 清理测试数据
  await deleteTestUser(userId);
  
  console.log('User flow test passed');
}
```

## 部署与版本控制

### 版本管理

使用语义化版本控制：

```javascript
// package.json
{
  "name": "user-function",
  "version": "1.2.3", // 主版本.次版本.修订版本
  "description": "User management cloud function"
}
```

### 环境配置

使用环境变量区分不同环境：

```javascript
// config.js
module.exports = {
  development: {
    logLevel: 'DEBUG',
    apiTimeout: 10000
  },
  testing: {
    logLevel: 'INFO',
    apiTimeout: 8000
  },
  production: {
    logLevel: 'WARN',
    apiTimeout: 5000
  }
};

// 使用配置
const env = process.env.NODE_ENV || 'development';
const config = require('./config')[env];
```

## 最佳实践总结

1. **模块化设计**：将云函数拆分为入口、服务和工具模块
2. **统一错误处理**：定义错误类型和处理机制
3. **参数验证**：验证所有用户输入
4. **安全性**：验证用户身份和权限
5. **性能优化**：使用并行操作、缓存和批量处理
6. **日志记录**：记录关键操作和错误
7. **测试**：编写单元测试和集成测试
8. **版本控制**：使用语义化版本和环境配置

遵循这些指南，可以开发出高质量、可维护和高性能的云函数，为 HeartChat 应用提供可靠的后端服务。
