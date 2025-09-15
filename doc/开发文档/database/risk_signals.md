# risk_signals —— 风险信号表

## 表说明
存储来自论坛、私聊、行为事件等多源的风险信号及评分，用于预警、追踪与升级决策。

## 字段结构
```javascript
{
  _id: "rs_001",                    // string, 信号ID
  user_hash: "uh_xxx",              // string, 脱敏用户
  source: "论坛",                    // enum: 论坛|私聊|任务|其他
  risk_type: "自评低落",              // string, 风险类型/标签
  score: 0.78,                       // number, 0-1 风险得分
  ts: "2025-01-02T20:10:00Z",        // date
  evidence: {                         // object, 证据摘要（脱敏）
    post_id: "post_123",
    snippets: ["想放弃复习"],
    model: "v1.2-rebt-signal"
  },
  window: "d1",                      // string, 统计窗口，如 d1/w1
  level: 2                            // number, 1-3 风险等级
}
```

## 索引建议
- 组合索引：`user_hash + ts`
- 过滤索引：`risk_type`、`level`、`window`

## 关系
- 可与 `forum_posts._id`、`behavior_tasks._id` 等通过 evidence 中的引用关联

## 使用场景
- 阈值告警、聚合看板
- 风险轨迹与趋势对比
- 人工转交的量化依据

## 示例
```javascript
{
  _id: "rs_42",
  user_hash: "uh_abc",
  source: "论坛",
  risk_type: "负向情绪上升",
  score: 0.71,
  ts: "2025-01-03T09:05:00Z",
  evidence: { post_id: "post_123", snippets: ["睡不着"] },
  window: "d1",
  level: 2
}
```

## 注意事项
- 仅保存必要证据摘要，避免还原个人身份；跨表查询需RBAC控制。
- 对模型版本与规则版本做字段追踪，便于回溯。

