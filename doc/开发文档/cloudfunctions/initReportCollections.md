# InitReportCollections 云函数文档

## 功能描述

InitReportCollections云函数是一个**数据库集合初始化服务**，用于创建用户报告相关的数据库集合和索引，支持一键初始化报告系统所需的数据结构。

## 文件结构

- **`index.js`** - 主入口文件，实现集合创建和索引初始化逻辑

## 主要流程

### 1. 集合初始化流程
```
权限检查（可选） → 创建userReports集合 → 创建userInterests集合 → 创建数据库索引 → 返回初始化结果
```

## 数据流向

### 输入数据
- 无直接输入参数
- 从微信上下文获取用户信息

### 处理过程
1. **权限检查**（注释状态）：验证管理员权限（可选功能）
2. **集合创建**：
   - 创建userReports集合（用户报告表）
   - 创建userInterests集合（用户兴趣表）
   - 处理集合已存在的情况
3. **索引创建**：
   - 为userReports创建复合索引
   - 为userInterests创建用户唯一索引
   - 处理索引创建失败的情况
4. **结果返回**：返回初始化成功状态和相关信息

### 输出数据
- 操作成功状态
- 初始化结果消息
- 错误信息（如果有）

## 涉及的数据库集合

### 1. userReports（用户报告表）
```javascript
{
  _id: "报告ID",
  userId: "用户ID",
  date: "报告日期",
  emotionSummary: "情感总结",
  insights: ["洞察1", "洞察2", "洞察3"],
  suggestions: ["建议1", "建议2", "建议3"],
  fortune: {
    good: ["宜做事项1", "宜做事项2"],
    bad: ["忌做事项1", "忌做事项2"]
  },
  encouragement: "鼓励语",
  keywords: [
    {
      word: "关键词",
      weight: 2.0
    }
  ],
  emotionalVolatility: 65,
  primaryEmotion: "主要情感",
  emotionCount: 15,
  chartData: {
    emotionDistribution: [
      {
        type: "情感类型",
        count: 5,
        percentage: "33.3"
      }
    ],
    intensityTrend: [
      {
        timestamp: "时间戳",
        intensity: 0.8,
        type: "情感类型"
      }
    ],
    focusDistribution: [
      {
        category: "分类",
        weight: 3.0,
        percentage: "25.0"
      }
    ]
  },
  focusPoints: [
    {
      category: "关注点分类",
      percentage: "35.0",
      weight: 4.0,
      keywords: ["关键词1", "关键词2", "关键词3"]
    }
  ],
  categoryWeights: [
    {
      category: "分类",
      weight: 4.0,
      percentage: "35.0"
    }
  ],
  emotionalInsights: {
    positiveAssociations: [
      {
        word: "积极关键词",
        ratio: 0.8,
        count: 5
      }
    ],
    negativeAssociations: [
      {
        word: "消极关键词",
        ratio: 0.7,
        count: 4
      }
    ]
  },
  generatedAt: "生成时间",
  isRead: false
}
```

### 2. userInterests（用户兴趣表）
```javascript
{
  _id: "记录ID",
  userId: "用户ID",
  keywords: [
    {
      word: "关键词",
      weight: 1.5,
      category: "分类",
      emotionScore: 0.6,
      lastUpdated: "更新时间"
    }
  ],
  createTime: "创建时间",
  lastUpdated: "最后更新时间"
}
```

## 数据库索引

### userReports集合索引
1. **userId_date**（复合唯一索引）
   - 字段：userId(升序), date(升序)
   - 用途：确保用户每天只有一个报告

2. **userId_createTime**（复合索引）
   - 字段：userId(升序), generatedAt(降序)
   - 用途：按时间查询用户报告

### userInterests集合索引
1. **userId**（唯一索引）
   - 字段：userId(升序)
   - 用途：确保每个用户只有一个兴趣记录

2. **userId_lastUpdated**（复合索引）
   - 字段：userId(升序), lastUpdated(降序)
   - 用途：按更新时间查询用户兴趣

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
  message: "初始化报告相关集合成功"
}
```

### 响应格式（失败）
```javascript
{
  success: false,
  error: "初始化报告相关集合失败: 具体错误信息"
}
```

## 错误处理

### 集合创建错误
- 集合已存在（错误码-501001）会被忽略
- 其他创建错误会抛出异常

### 索引创建错误
- 索引创建失败不会影响集合创建
- 错误会被记录但不会导致整个操作失败

### 系统错误
- 数据库连接错误
- 权限不足错误
- 其他未预期的系统错误

## 使用场景

1. **系统部署**：新系统部署时初始化数据结构
2. **功能升级**：添加新功能时创建必要的集合
3. **数据迁移**：数据迁移前准备目标集合
4. **开发测试**：开发环境快速搭建数据结构

## 安全特性

- 可选的权限检查（管理员才能执行）
- 集合创建幂等性（重复执行不会出错）
- 错误隔离（单个操作失败不影响其他操作）

## 性能优化

- 预创建索引提高查询性能
- 复合索引优化常用查询
- 唯一索引确保数据一致性

## 注意事项

- 需要数据库创建集合的权限
- 集合创建是幂等操作，可以重复执行
- 索引创建可能需要较长时间
- 建议在系统部署阶段执行

## 扩展建议

1. **更多集合**：扩展支持其他业务集合
2. **默认数据**：初始化时插入默认配置数据
3. **版本控制**：记录初始化版本信息
4. **回滚功能**：支持初始化失败时的回滚操作