# 云函数模板

## 基本结构

```
function-name/
├── index.js                # 入口文件
├── package.json            # 依赖配置
├── config.js               # 配置文件（可选）
├── services/               # 业务逻辑（可选）
│   └── service.js
└── utils/                  # 工具函数（可选）
    └── helper.js
```

## 入口文件 (index.js)

```javascript
// 云函数入口文件
const cloud = require('wx-server-sdk');

// 初始化云环境
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

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('Function invoked with event:', event);
  
  try {
    const { action, params } = event;
    
    // 参数验证
    if (!action) {
      throw new Error('Missing required parameter: action');
    }
    
    // 根据 action 执行不同操作
    let result;
    switch (action) {
      case 'getData':
        result = await getData(params);
        break;
      case 'createData':
        result = await createData(params);
        break;
      case 'updateData':
        result = await updateData(params);
        break;
      case 'deleteData':
        result = await deleteData(params);
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

// 获取数据
async function getData(params) {
  const { id } = params || {};
  const db = cloud.database();
  
  if (id) {
    // 获取单条数据
    const result = await db.collection('collection_name').doc(id).get();
    return result.data;
  } else {
    // 获取列表数据
    const { page = 1, pageSize = 10 } = params || {};
    const result = await db.collection('collection_name')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    return {
      list: result.data,
      page,
      pageSize,
      total: result.data.length // 注意：实际应用中应该获取总数
    };
  }
}

// 创建数据
async function createData(params) {
  if (!params) {
    throw new Error('Missing required parameter: params');
  }
  
  const db = cloud.database();
  
  // 添加创建时间
  const data = {
    ...params,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  };
  
  const result = await db.collection('collection_name').add({
    data
  });
  
  return {
    id: result._id
  };
}

// 更新数据
async function updateData(params) {
  const { id, ...data } = params || {};
  
  if (!id) {
    throw new Error('Missing required parameter: id');
  }
  
  if (Object.keys(data).length === 0) {
    throw new Error('No data to update');
  }
  
  const db = cloud.database();
  
  // 添加更新时间
  data.updateTime = db.serverDate();
  
  const result = await db.collection('collection_name').doc(id).update({
    data
  });
  
  return {
    updated: result.stats.updated > 0
  };
}

// 删除数据
async function deleteData(params) {
  const { id } = params || {};
  
  if (!id) {
    throw new Error('Missing required parameter: id');
  }
  
  const db = cloud.database();
  
  const result = await db.collection('collection_name').doc(id).remove();
  
  return {
    deleted: result.stats.removed > 0
  };
}
```

## 依赖配置 (package.json)

```json
{
  "name": "function-name",
  "version": "1.0.0",
  "description": "Function description",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "Your Name",
  "license": "ISC",
  "dependencies": {
    "wx-server-sdk": "latest"
  }
}
```

## 配置文件 (config.js)

```javascript
// 配置文件
module.exports = {
  // 集合名称
  collections: {
    main: 'collection_name',
    related: 'related_collection'
  },
  
  // 默认值
  defaults: {
    pageSize: 10,
    maxPageSize: 100
  },
  
  // 错误码
  errorCodes: {
    PARAM_ERROR: 'PARAM_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
  }
};
```

## 服务模块 (services/service.js)

```javascript
// 服务模块
const cloud = require('wx-server-sdk');
const config = require('../config');

const db = cloud.database();

// 获取用户信息
async function getUserInfo(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const result = await db.collection('users').doc(userId).get();
  
  if (!result.data) {
    throw new Error('User not found');
  }
  
  return result.data;
}

// 检查用户权限
async function checkUserPermission(userId, action) {
  const user = await getUserInfo(userId);
  
  // 检查用户权限
  // ...
  
  return true;
}

module.exports = {
  getUserInfo,
  checkUserPermission
};
```

## 工具函数 (utils/helper.js)

```javascript
// 工具函数
const cloud = require('wx-server-sdk');

// 获取当前用户ID
function getCurrentUserId() {
  const { OPENID } = cloud.getWXContext();
  
  if (!OPENID) {
    throw new Error('User not authenticated');
  }
  
  return OPENID;
}

// 格式化日期
function formatDate(date) {
  if (!date) {
    return '';
  }
  
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  if (!(date instanceof Date) || isNaN(date)) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// 生成唯一ID
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

module.exports = {
  getCurrentUserId,
  formatDate,
  generateUniqueId
};
```

## 使用说明

1. 创建云函数时，复制此模板并根据实际需求修改
2. 根据功能需求调整文件结构和代码
3. 修改集合名称、字段名称和业务逻辑
4. 添加必要的参数验证和错误处理
5. 部署云函数到云环境

## 调用示例

### 前端调用

```javascript
// 获取数据
wx.cloud.callFunction({
  name: 'function-name',
  data: {
    action: 'getData',
    params: {
      page: 1,
      pageSize: 10
    }
  }
}).then(res => {
  console.log('Data:', res.result.data);
}).catch(err => {
  console.error('Error:', err);
});

// 创建数据
wx.cloud.callFunction({
  name: 'function-name',
  data: {
    action: 'createData',
    params: {
      name: 'Test',
      description: 'Test description'
    }
  }
}).then(res => {
  console.log('Created:', res.result.data);
}).catch(err => {
  console.error('Error:', err);
});

// 更新数据
wx.cloud.callFunction({
  name: 'function-name',
  data: {
    action: 'updateData',
    params: {
      id: 'data-id',
      name: 'Updated Name'
    }
  }
}).then(res => {
  console.log('Updated:', res.result.data);
}).catch(err => {
  console.error('Error:', err);
});

// 删除数据
wx.cloud.callFunction({
  name: 'function-name',
  data: {
    action: 'deleteData',
    params: {
      id: 'data-id'
    }
  }
}).then(res => {
  console.log('Deleted:', res.result.data);
}).catch(err => {
  console.error('Error:', err);
});
```

### 云函数调用

```javascript
// 在其他云函数中调用
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

async function callOtherFunction() {
  try {
    const result = await cloud.callFunction({
      name: 'function-name',
      data: {
        action: 'getData',
        params: {
          id: 'data-id'
        }
      }
    });
    
    return result.result.data;
  } catch (error) {
    console.error('Error calling function:', error);
    throw error;
  }
}
```
