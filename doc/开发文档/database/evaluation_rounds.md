# evaluation_rounds —— AI与专家PK评测表

## 表说明
记录标准化问卷或脱敏案例的AI与专家评分、分级与用户投票，用于效果对比与漂移监测。

## 字段结构
```javascript
{
  _id: "case_001",                  // string, 评测轮次/案例ID
  rubric_version: "rb_1.0",         // string, 评分规程版本
  case_type: "问卷|案例",             // string
  ai_score: 12,                       // number|object, 支持分维度
  ai_level: 1,                        // number, 分级1-3
  expert_score: 13,                   // number|object
  expert_level: 1,                    // number
  user_vote: "ai|expert|tie",        // enum, 用户投票
  rationale_ai: "AI的理由链摘要",
  rationale_expert: "专家理由链摘要",
  ts: "2025-01-03T10:00:00Z"
}
```

## 索引建议
- `ts` 降序
- `rubric_version`

## 使用场景
- PK结果看板、模型与专家一致性分析
- 漂移监测与规程修订依据

## 示例
```javascript
{
  _id: "case_2025_001",
  rubric_version: "rb_1.0",
  case_type: "问卷",
  ai_score: 12,
  ai_level: 1,
  expert_score: 13,
  expert_level: 1,
  user_vote: "expert",
  rationale_ai: "按REBT识别核心信念并建议微行为",
  rationale_expert: "判定轻度，建议规律作息与复诊",
  ts: "2025-01-03T10:00:00Z"
}
```

## 注意事项
- 案例需脱敏；理由链仅存要点摘要。

