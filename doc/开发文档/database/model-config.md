# AI模型配置数据库设计

## 概述
为了实现AI模型配置的动态管理，设计了三个核心数据库集合来存储和管理AI模型的相关信息。

## 数据库集合

### 1. modelPlatforms（模型平台表）

#### 表说明
存储AI模型提供商的基础信息，包括API地址、认证方式等平台级配置。

#### 字段结构
```javascript
{
  _id: "平台ID",                    // string, 主键，使用platformKey
  platformKey: "平台键名",          // string, 唯一标识符，如ZHIPU、GEMINI等
  name: "平台名称",                 // string, 显示名称
  baseUrl: "API基础地址",            // string, API服务的基础URL
  apiKeyEnv: "API密钥环境变量名",    // string, 环境变量名
  authType: "认证类型",              // string, Bearer/api-key等
  status: 1,                       // number, 状态：1启用/0禁用
  priority: 1,                     // number, 优先级，数字越小优先级越高
  description: "平台描述",          // string, 平台功能描述
  createTime: "创建时间",            // date, 记录创建时间
  updateTime: "更新时间"             // date, 记录更新时间
}
```

#### 索引设计
- **唯一索引**: platformKey（确保平台键名唯一）
- **普通索引**: status（用于状态筛选）
- **普通索引**: priority（用于优先级排序）

### 2. modelConfigs（模型配置表）

#### 表说明
存储具体的AI模型配置信息，包括模型能力、定价、限制等详细信息。

#### 字段结构
```javascript
{
  _id: "配置ID",                    // string, 主键，自动生成
  platformKey: "平台键名",          // string, 关联到modelPlatforms.platformKey
  modelId: "模型ID",               // string, 模型在平台中的唯一标识
  name: "模型名称",                 // string, 显示名称
  description: "模型描述",          // string, 模型功能描述
  capabilities: ["能力列表"],       // array, 支持的能力：chat、reasoning、coding、analysis、multimodal
  maxTokens: 128000,               // number, 最大支持token数
  isDefault: false,                // boolean, 是否为平台默认模型
  status: 1,                       // number, 状态：1启用/0禁用
  priority: 1,                     // number, 在平台内的优先级
  pricing: {                       // object, 定价信息
    input: 0.0005,                 // number, 输入token单价（元/1k tokens）
    output: 0.0015                 // number, 输出token单价（元/1k tokens）
  },
  createTime: "创建时间",            // date, 记录创建时间
  updateTime: "更新时间"             // date, 记录更新时间
}
```

#### 索引设计
- **复合唯一索引**: platformKey + modelId（确保同一平台下模型ID唯一）
- **普通索引**: status（用于状态筛选）
- **普通索引**: capabilities（用于能力筛选）

### 3. modelUsageStats（模型使用统计表）

#### 表说明
记录模型的使用情况和性能统计数据，用于监控和优化。

#### 字段结构
```javascript
{
  _id: "统计ID",                    // string, 主键，自动生成
  platformKey: "平台键名",          // string, 使用的平台
  modelId: "模型ID",               // string, 使用的模型
  userId: "用户ID",                 // string, 使用用户
  usageCount: 100,                 // number, 使用次数
  totalTokens: 50000,              // number, 总token使用量
  totalCost: 25.5,                 // number, 总成本（元）
  successCount: 95,                // number, 成功调用次数
  errorCount: 5,                   // number, 失败调用次数
  avgResponseTime: 1500,           // number, 平均响应时间（毫秒）
  lastUsedTime: "最后使用时间",     // date, 最后一次使用时间
  createTime: "创建时间",            // date, 统计记录创建时间
  updateTime: "更新时间"             // date, 统计记录更新时间
}
```

#### 索引设计
- **复合索引**: platformKey + modelId + userId（用于查询特定用户的模型使用情况）
- **普通索引**: lastUsedTime（用于时间范围查询）
- **普通索引**: userId（用于用户级别统计）

## 关联关系

### 主要关系
- **一对多**: modelPlatforms._id → modelConfigs.platformKey
- **一对多**: modelConfigs.(platformKey+modelId) → modelUsageStats.(platformKey+modelId)
- **一对多**: users._id → modelUsageStats.userId

### 数据流向
```
用户请求 → 模型选择 → API调用 → 结果返回 → 统计更新
```

## 使用场景

### 1. 动态模型配置
- 支持运行时添加/修改模型配置
- 无需重启云函数即可生效
- 支持A/B测试不同模型

### 2. 智能模型选择
- 根据用户需求自动选择合适的模型
- 考虑成本、性能、能力等因素
- 支持用户偏好设置

### 3. 使用监控
- 实时监控模型使用情况
- 成本控制和预警
- 性能分析和优化

### 4. 运维管理
- 模型状态管理
- 错误率监控
- 用户行为分析

## 云函数接口

### modelConfig云函数
提供模型配置的CRUD操作和统计功能：

#### 主要接口
- `getPlatforms`: 获取平台列表
- `getConfigs`: 获取模型配置列表
- `getRecommendedModels`: 获取推荐模型
- `createConfig`: 创建模型配置
- `updateConfig`: 更新模型配置
- `deleteConfig`: 删除模型配置
- `updateUsage`: 更新使用统计
- `getUsageStats`: 获取使用统计

## 性能优化

### 缓存策略
- 模型配置缓存5分钟
- 使用内存缓存减少数据库查询
- 支持手动刷新缓存

### 查询优化
- 合理使用索引
- 避免全表扫描
- 分页查询大数据集

### 并发处理
- 支持并发请求
- 防止缓存击穿
- 降级处理机制

## 安全考虑

### 数据安全
- API密钥存储在环境变量中
- 数据库操作权限控制
- 敏感信息加密存储

### 访问控制
- 基于角色的访问控制
- API调用频率限制
- 异常行为监控

## 扩展性

### 水平扩展
- 支持多实例部署
- 负载均衡
- 数据库分片

### 功能扩展
- 支持更多AI平台
- 模型版本管理
- 自定义模型配置

## 维护建议

### 定期维护
- 清理过期统计数据
- 更新模型配置信息
- 监控系统性能

### 备份策略
- 定期数据库备份
- 配置信息版本控制
- 灾难恢复方案