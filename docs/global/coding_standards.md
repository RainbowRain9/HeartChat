# HeartChat 编码规范

## 概述

本文档定义了 HeartChat 项目的编码规范，旨在确保代码质量、可维护性和团队协作效率。所有团队成员应遵循这些规范进行开发。

## 通用规范

### 文件组织

1. 使用有意义的文件名，反映文件内容
2. 文件名使用小写字母，多个单词用连字符（-）连接
3. 每个页面或组件使用单独的目录
4. 相关文件放在同一目录下
5. 保持目录结构清晰，避免过深的嵌套

### 命名规范

1. 变量和函数使用驼峰命名法（camelCase）
2. 常量使用全大写，多个单词用下划线（_）连接
3. 类和组件使用首字母大写的驼峰命名法（PascalCase）
4. CSS 类名使用小写字母，多个单词用连字符（-）连接
5. 使用有意义的名称，避免使用缩写（除非是广泛接受的缩写）

### 代码格式

1. 使用 2 个空格进行缩进
2. 行宽不超过 100 个字符
3. 使用分号结束语句
4. 使用单引号表示字符串
5. 在运算符前后、逗号后、冒号后添加空格
6. 每个文件末尾保留一个空行

### 注释规范

1. 使用 JSDoc 风格的注释
2. 为函数、方法添加注释，说明功能、参数和返回值
3. 为复杂逻辑添加行内注释
4. 使用 TODO 注释标记待完成的工作
5. 保持注释的更新，删除过时的注释

```javascript
/**
 * 分析文本情感
 * @param {string} text - 要分析的文本内容
 * @returns {Promise<Object>} 情感分析结果
 */
async function analyzeEmotion(text) {
  // TODO: 添加错误处理
  const result = await callEmotionAPI(text);
  return result;
}
```

## JavaScript 规范

### 变量声明

1. 使用 `const` 声明不会重新赋值的变量
2. 使用 `let` 声明会重新赋值的变量
3. 避免使用 `var`
4. 一次声明一个变量
5. 变量声明尽量靠近使用位置

```javascript
// 推荐
const MAX_ITEMS = 10;
let count = 0;

// 不推荐
var items = 10;
var i, j, k;
```

### 函数规范

1. 函数应当只做一件事
2. 函数参数不应超过 3 个，如果需要更多参数，考虑使用对象
3. 使用默认参数代替条件语句
4. 使用箭头函数简化代码
5. 避免副作用，保持函数的纯粹性

```javascript
// 推荐
function getUserInfo({ id, includeDetails = false }) {
  // 实现
}

// 不推荐
function getUserInfo(id, includeDetails) {
  if (includeDetails === undefined) {
    includeDetails = false;
  }
  // 实现
}
```

### 异步处理

1. 使用 async/await 处理异步操作，避免回调地狱
2. 使用 try/catch 捕获异步操作的异常
3. 避免嵌套 Promise
4. 合理使用 Promise.all 处理并行操作
5. 避免在循环中使用 await

```javascript
// 推荐
async function fetchUserData(userId) {
  try {
    const user = await db.collection('users').doc(userId).get();
    return user;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
}

// 不推荐
function fetchUserData(userId) {
  return db.collection('users').doc(userId).get()
    .then(user => {
      return user;
    })
    .catch(error => {
      console.error('Failed to fetch user data:', error);
      throw error;
    });
}
```

### 错误处理

1. 使用 try/catch 捕获可能的异常
2. 返回统一格式的错误信息
3. 记录关键错误日志
4. 避免吞掉异常，确保异常被正确处理
5. 使用自定义错误类型区分不同类型的错误

```javascript
// 推荐
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  wx.showToast({
    title: '操作失败，请稍后重试',
    icon: 'none'
  });
  return null;
}
```

## 小程序规范

### 页面结构

1. 页面文件应包含 .js, .json, .wxml, .wxss 四个文件
2. 页面逻辑按生命周期函数、事件处理函数、业务逻辑函数组织
3. 避免在页面中直接操作 DOM
4. 使用 setData 更新数据，避免直接修改 this.data
5. 合并 setData 调用，减少更新次数

```javascript
// 推荐
Page({
  data: {
    // 初始数据
  },
  
  // 生命周期函数
  onLoad() {
    this.initData();
  },
  
  // 事件处理函数
  handleTap() {
    // 处理点击事件
  },
  
  // 业务逻辑函数
  initData() {
    // 初始化数据
  }
});
```

### 组件规范

1. 组件文件使用 index.js, index.json, index.wxml, index.wxss 命名
2. 使用 properties 定义组件属性
3. 使用 methods 定义组件方法
4. 使用 triggerEvent 触发自定义事件
5. 组件内部方法使用下划线前缀

```javascript
Component({
  properties: {
    title: {
      type: String,
      value: ''
    }
  },
  
  data: {
    // 组件内部数据
  },
  
  methods: {
    handleTap() {
      this.triggerEvent('tap', { value: this.data.value });
    },
    
    _init() {
      // 内部初始化方法
    }
  }
});
```

### WXML 规范

1. 使用语义化标签
2. 避免过度嵌套，减少标签层级
3. 使用 wx:for 和 wx:key 进行列表渲染
4. 使用 wx:if 进行条件渲染
5. 使用 block 标签包裹多个元素

```html
<!-- 推荐 -->
<view class="user-card">
  <image class="user-avatar" src="{{user.avatar}}"></image>
  <view class="user-info">
    <text class="user-name">{{user.name}}</text>
    <text class="user-role">{{user.role}}</text>
  </view>
</view>

<block wx:if="{{hasItems}}">
  <view wx:for="{{items}}" wx:key="id" class="item">
    {{item.name}}
  </view>
</block>
```

### WXSS 规范

1. 使用 BEM 命名方法组织样式
2. 避免使用 ID 选择器
3. 避免使用 !important
4. 使用 rpx 单位实现响应式布局
5. 按布局、尺寸、文本、视觉顺序组织属性

```css
/* 推荐 */
.user-card {
  display: flex;
  padding: 20rpx;
  background-color: #fff;
  border-radius: 8rpx;
}

.user-card__avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
}

.user-card__info {
  margin-left: 20rpx;
}

.user-card__name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.user-card__role {
  font-size: 24rpx;
  color: #999;
}
```

## 云函数规范

### 函数结构

1. 每个云函数应有明确的职责
2. 使用 index.js 作为入口文件
3. 将业务逻辑拆分为独立模块
4. 使用统一的错误处理和返回格式
5. 添加适当的日志记录

```javascript
// index.js
const cloud = require('wx-server-sdk');
const userService = require('./userService');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
    const { action, data } = event;
    
    switch (action) {
      case 'getUser':
        return await userService.getUser(data.userId);
      case 'updateUser':
        return await userService.updateUser(data.userId, data.userData);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error(`Error in user function: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};
```

### 数据库操作

1. 使用 async/await 处理数据库操作
2. 使用事务保证数据一致性
3. 避免大量数据的一次性查询
4. 合理使用索引提高查询效率
5. 使用批量操作提高性能

```javascript
// 推荐
async function getUserWithMessages(userId) {
  const db = cloud.database();
  const userPromise = db.collection('users').doc(userId).get();
  const messagesPromise = db.collection('messages')
    .where({ userId })
    .orderBy('createTime', 'desc')
    .limit(10)
    .get();
    
  const [userResult, messagesResult] = await Promise.all([userPromise, messagesPromise]);
  
  return {
    user: userResult.data,
    messages: messagesResult.data
  };
}
```

### 安全规范

1. 验证用户身份和权限
2. 验证所有用户输入
3. 避免在代码中硬编码敏感信息
4. 使用最小权限原则访问资源
5. 记录敏感操作日志

```javascript
// 推荐
async function updateUserProfile(userId, data, context) {
  // 验证用户身份
  const { OPENID } = cloud.getWXContext();
  if (userId !== OPENID) {
    throw new Error('Unauthorized');
  }
  
  // 验证输入
  if (!data.nickname || data.nickname.length > 20) {
    throw new Error('Invalid nickname');
  }
  
  // 执行更新
  const db = cloud.database();
  await db.collection('users').doc(userId).update({
    data: {
      nickname: data.nickname,
      updateTime: db.serverDate()
    }
  });
  
  // 记录操作日志
  await db.collection('operation_logs').add({
    data: {
      userId,
      operation: 'updateProfile',
      createTime: db.serverDate()
    }
  });
  
  return { success: true };
}
```

## 测试规范

### 单元测试

1. 为核心功能编写单元测试
2. 使用 Jest 作为测试框架
3. 使用模拟对象隔离依赖
4. 测试覆盖正常路径和异常路径
5. 保持测试简单、独立和可重复

```javascript
// 推荐
describe('formatDate', () => {
  test('formats date correctly', () => {
    const date = new Date('2023-01-01T12:00:00Z');
    expect(formatDate(date)).toBe('2023-01-01');
  });
  
  test('handles invalid date', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('invalid')).toBe('');
  });
});
```

### 云函数测试

1. 使用本地调试工具测试云函数
2. 创建测试环境进行集成测试
3. 使用模拟数据测试各种场景
4. 测试错误处理和边界情况
5. 验证返回结果格式和内容

## 版本控制规范

### 分支管理

1. 主分支（main/master）保持稳定
2. 开发分支（develop）用于集成功能
3. 功能分支（feature/*）用于开发新功能
4. 修复分支（bugfix/*）用于修复 bug
5. 发布分支（release/*）用于版本发布准备

### 提交信息

1. 使用规范的提交信息格式：`[类型] 简短描述`
2. 类型包括：feat(新功能)、fix(修复)、docs(文档)、style(格式)、refactor(重构)、test(测试)、chore(构建/工具)
3. 描述使用现在时态，简明扼要
4. 提交信息的第一行不超过 50 个字符
5. 需要时添加详细描述，与第一行之间空一行

```
[feat] 添加用户情感分析功能

- 集成百度情感分析 API
- 添加情感分析结果展示
- 优化用户体验
```

## 文档规范

1. 使用 Markdown 格式编写文档
2. 文档应包括目的、使用方法、参数说明和示例
3. 保持文档与代码同步更新
4. 使用清晰的标题层级和列表
5. 添加适当的图表和示例增强可读性

## 最佳实践

1. 遵循 DRY（Don't Repeat Yourself）原则，避免代码重复
2. 遵循 KISS（Keep It Simple, Stupid）原则，保持代码简单
3. 遵循 YAGNI（You Aren't Gonna Need It）原则，不编写不需要的功能
4. 定期进行代码审查，确保代码质量
5. 持续学习和改进，跟进最新的最佳实践
