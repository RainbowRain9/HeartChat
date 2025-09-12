# Analysis 云函数完整流程图文档

## 📋 概述

本文档提供了 HeartChat 项目中 analysis 云函数的完整流程图，涵盖了系统架构、各个功能模块的实现流程、错误处理机制以及性能优化策略。

## 📁 文档结构

- [analysis-flowcharts.md](./analysis-flowcharts.md) - 系统整体架构和主要功能流程
- [analysis-module-flowcharts.md](./analysis-module-flowcharts.md) - 各个模块的详细实现流程

## 🏗️ 系统架构概览

### 核心模块组成
1. **index.js** - 主入口文件，负责请求路由分发
2. **bigmodel.js** - 智谱AI API调用模块
3. **userInterestAnalyzer.js** - 用户兴趣分析模块
4. **keywordClassifier.js** - 关键词分类模块
5. **keywordEmotionLinker.js** - 关键词情感关联模块

### 数据流设计
```
用户请求 → 路由分发 → 功能模块 → AI服务 → 数据处理 → 数据库存储 → 结果返回
```

## 🔄 主要功能流程

### 1. 情感分析流程
**入口**: `type: 'emotion'`
**功能**: 基于智谱AI进行多维度情感分析
**输出**: 情感类型、强度、建议等完整分析结果

**关键特性**:
- 并行执行情感分析和关键词提取
- 支持历史消息上下文
- 异步保存情感记录
- 关键词情感关联

### 2. 关键词提取流程
**入口**: `type: 'keywords'`
**功能**: 从文本中提取重要关键词及权重
**输出**: 包含word和weight的关键词数组

**关键特性**:
- 智谱AI语义理解
- 权重计算和排序
- 支持指定提取数量

### 3. 用户兴趣分析流程
**入口**: `type: 'focus_points'`
**功能**: 分析用户兴趣分布和关注点
**输出**: 分类权重、关注点列表、情感关联

**关键特性**:
- 智能关键词分类
- 权重标准化计算
- 情感关联分析
- 多维度兴趣画像

### 4. 每日报告生成流程
**入口**: `type: 'daily_report'`
**功能**: 生成用户每日心情报告
**输出**: 包含图表数据的完整报告

**关键特性**:
- 数据聚合分析
- AI生成个性化内容
- 图表数据生成
- 支持强制重新生成

## 📊 模块详细流程

### BigModel 模块
**职责**: 智谱AI API的封装和调用
**主要功能**:
- 情感分析 (`analyzeEmotion`)
- 关键词提取 (`extractKeywords`)
- 词向量获取 (`getEmbeddings`)
- 报告内容生成 (`generateReportContent`)

**降级策略**: API不可用时使用本地模拟算法

### KeywordClassifier 模块
**职责**: 关键词智能分类
**分类体系**: 26个预定义类别
**处理方式**: 
- 优先使用AI分类
- 失败时降级到规则匹配
- 包含详细的细分类别映射

### UserInterestAnalyzer 模块
**职责**: 用户兴趣分析
**分析维度**:
- 关键词分类权重
- 关注点提取
- 情感关联分析

### KeywordEmotionLinker 模块
**职责**: 关键词与情感数据关联
**核心功能**:
- 情感分数计算
- 数据库关联更新
- 情感统计分析

## 🛡️ 错误处理机制

### 统一错误处理
- 所有函数使用 try-catch 包装
- 标准化的错误日志记录
- 统一的错误返回格式

### 降级策略
- AI服务不可用时自动降级
- 本地算法作为备选方案
- 保证核心功能可用性

### 数据验证
- 输入参数类型验证
- 空值和范围检查
- 格式验证机制

## ⚡ 性能优化

### 并行处理
- 情感分析和关键词提取并行执行
- 异步操作不阻塞主流程
- Promise.all 批量处理

### 缓存机制
- 每日报告缓存避免重复生成
- 查询结果缓存
- 智能缓存失效策略

### 数据库优化
- 批量操作减少数据库调用
- 索引优化查询性能
- 合理的数据分页

## 🗄️ 数据库设计

### 主要集合
1. **emotionRecords** - 情感分析记录
2. **userInterests** - 用户兴趣数据
3. **userReports** - 用户每日报告

### 关键字段
- 情感分析结果: 包含多维度情感数据
- 关键词数据: 支持权重和分类
- 报告数据: 包含图表和AI生成内容

## 🚀 使用指南

### 调用示例

#### 1. 情感分析
```javascript
// 小程序端调用
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'emotion',
    text: '我今天感觉很开心，因为完成了重要项目',
    history: [], // 可选的历史消息
    saveRecord: true,
    extractKeywords: true,
    linkKeywords: true
  }
})
```

#### 2. 用户兴趣分析
```javascript
// 小程序端调用
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'focus_points',
    userId: 'user123', // 可选，默认当前用户
    date: '2024-01-15' // 可选，默认最近一周
  }
})
```

#### 3. 每日报告生成
```javascript
// 小程序端调用
wx.cloud.callFunction({
  name: 'analysis',
  data: {
    type: 'daily_report',
    date: new Date(), // 可选，默认今天
    forceRegenerate: false // 是否强制重新生成
  }
})
```

### 返回数据格式

#### 情感分析结果
```javascript
{
  success: true,
  result: {
    type: '开心',
    intensity: 0.8,
    primary_emotion: '开心',
    secondary_emotions: ['满足', '兴奋'],
    valence: 0.9,
    arousal: 0.7,
    keywords: ['项目', '完成', '开心'],
    suggestions: ['继续保持积极心态', '适当放松休息'],
    summary: '用户表现出强烈的积极情绪'
  },
  recordId: 'emotion_record_id',
  keywords: [...] // 提取的关键词
}
```

#### 用户兴趣分析结果
```javascript
{
  success: true,
  data: {
    categoryWeights: [
      { category: '工作', weight: 15, percentage: 45.2 },
      { category: '学习', weight: 12, percentage: 36.1 }
    ],
    focusPoints: [
      {
        category: '工作',
        percentage: 45.2,
        keywords: ['项目', '任务', '团队']
      }
    ],
    emotionalInsights: {
      positiveAssociations: [...],
      negativeAssociations: [...]
    }
  }
}
```

## 🔧 配置要求

### 环境变量
- `ZHIPU_API_KEY` - 智谱AI API密钥（必需）
- `CLOUD_ENV` - 云开发环境ID

### 数据库集合
确保以下集合存在：
- `emotionRecords`
- `userInterests` 
- `userReports`

### 索引建议
```javascript
// emotionRecords 集合索引
{
  "userId": 1,
  "createTime": -1
}

// userInterests 集合索引
{
  "userId": 1
}

// userReports 集合索引
{
  "userId": 1,
  "date": -1
}
```

## 📈 监控和维护

### 关键指标
- API调用成功率
- 平均响应时间
- 降级机制触发频率
- 数据库操作性能

### 日志监控
- 错误日志分析
- 性能日志收集
- 降级操作记录

### 定期维护
- AI模型更新适配
- 分类规则优化
- 性能调优

## 🎯 最佳实践

### 开发建议
1. **错误处理**: 始终检查返回值的 success 字段
2. **缓存利用**: 合理使用报告缓存机制
3. **性能考虑**: 批量操作优于单条操作
4. **数据验证**: 前端也要进行基本的数据验证

### 部署建议
1. **环境隔离**: 开发、测试、生产环境分离
2. **监控告警**: 设置关键指标监控
3. **备份策略**: 定期备份重要数据
4. **安全考虑**: API密钥安全存储

## 📞 技术支持

如有问题或建议，请参考：
- 项目文档：`/docs/` 目录
- 代码注释：各模块都有详细的 JSDoc 注释
- 测试用例：`/test/` 目录下的测试文件

---

*本文档版本: v1.0*  
*最后更新: 2024-01-15*  
*维护者: HeartChat 开发团队*