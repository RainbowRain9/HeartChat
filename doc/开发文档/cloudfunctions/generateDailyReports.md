# GenerateDailyReports 云函数文档

## 功能描述

GenerateDailyReports云函数是一个**每日报告生成服务**，用于批量生成用户的每日心情报告，支持自动通知和订阅消息推送功能。

## 文件结构

- **`index.js`** - 主入口文件，实现报告生成和通知发送逻辑

## 主要流程

### 1. 每日报告生成流程
```
计算目标日期（前一天） → 查询活跃用户 → 遍历用户生成报告 → 调用analysis云函数 → 检查通知设置 → 发送订阅消息 → 记录结果 → 返回统计信息
```

### 2. 通知发送流程
```
查询模板配置 → 获取用户openid → 查询报告内容 → 构建订阅消息数据 → 调用微信API发送通知 → 记录发送结果
```

## 数据流向

### 输入数据
- 云函数触发（定时任务或手动调用）
- 系统配置参数
- 用户通知设置

### 处理过程
1. **时间计算**：确定要生成报告的日期（前一天）
2. **活跃用户查询**：从emotionRecords聚合查询有情感记录的用户
3. **批量报告生成**：
   - 为每个用户调用analysis云函数
   - 生成每日心情报告
   - 处理生成结果
4. **通知发送**：
   - 检查用户通知设置
   - 查询订阅消息模板
   - 构建通知数据
   - 发送微信订阅消息
5. **结果统计**：统计成功和失败的数量
6. **延迟控制**：避免API调用过于频繁

### 输出数据
- 操作成功状态
- 每个用户的报告生成结果
- 统计信息（总数、成功数）
- 错误信息（如果有）

## 涉及的数据库集合

### 1. emotionRecords（情感记录表）
```javascript
{
  _id: "记录ID",
  userId: "用户ID",
  createTime: "创建时间",
  // 其他情感分析相关字段...
}
```

### 2. users（用户表）
```javascript
{
  _id: "用户ID",
  openid: "微信openid",
  reportSettings: {
    notificationEnabled: true,
    // 其他报告设置...
  }
}
```

### 3. sys_config（系统配置表）
```javascript
{
  _id: "配置ID",
  configKey: "report_template_id",
  configValue: "订阅消息模板ID",
  createTime: "创建时间",
  updateTime: "更新时间"
}
```

### 4. userReports（用户报告表）
```javascript
{
  _id: "报告ID",
  userId: "用户ID",
  date: "报告日期",
  emotionSummary: "情感总结",
  primaryEmotion: "主要情感",
  // 其他报告相关字段...
}
```

## API接口

### 主要功能
- **批量报告生成**：为活跃用户生成每日心情报告
- **订阅消息通知**：向开启通知的用户发送报告提醒

### 触发方式
- **定时任务**：建议设置为每天凌晨执行
- **手动调用**：支持手动触发报告生成

### 响应格式
```javascript
{
  success: true,
  results: [
    {
      userId: "用户ID",
      success: true,
      reportId: "报告ID"
    },
    {
      userId: "用户ID",
      success: false,
      error: "错误信息"
    }
  ],
  totalUsers: 10,
  successCount: 8
}
```

## 订阅消息格式

### 消息模板数据
```javascript
{
  touser: "用户openid",
  templateId: "订阅消息模板ID",
  page: "pages/daily-report/daily-report?id=报告ID",
  data: {
    thing1: { value: '每日心情报告' },
    date2: { value: '2025-01-01' },
    thing3: { value: '今日情绪整体较为积极...' },
    thing4: { value: '平静' },
    thing5: { value: '点击查看详情' }
  }
}
```

## 配置要求

### 系统配置
- `report_template_id`：订阅消息模板ID

### 用户设置
- `reportSettings.notificationEnabled`：是否开启通知

## 错误处理

- 用户报告生成错误处理
- 通知发送失败不影响主流程
- 详细的错误日志记录
- 单个用户失败不影响其他用户处理

## 性能优化

- 限制处理用户数量（最多100个）
- 添加延迟避免API调用过于频繁
- 批量处理提高效率
- 错误隔离防止级联失败

## 辅助函数

### 日期格式化
```javascript
function formatDate(date) {
  // 将日期格式化为YYYY-MM-DD
}
```

### 字符串截断
```javascript
function truncate(str, length) {
  // 截断字符串到指定长度，添加省略号
}
```

## 使用场景

1. **定时报告生成**：每天凌晨自动生成前一天的报告
2. **手动报告补发**：手动触发特定日期的报告生成
3. **用户通知推送**：向用户推送报告生成通知
4. **数据分析统计**：收集报告生成统计数据

## 注意事项

- 需要确保analysis云函数正常运行
- 需要配置正确的订阅消息模板
- 需要用户授权订阅消息
- 注意API调用频率限制
- 建议在低峰期执行批量处理