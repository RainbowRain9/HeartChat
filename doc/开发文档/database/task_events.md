# task_events —— 任务事件流水表

## 表说明
记录任务从“下发→接受→开始→完成/跳过”的全链路事件，用于依从性漏斗、提醒策略与A/B评估。

## 字段结构
```javascript
{
  _id: "evt_001",                  // string, 事件ID
  taskId: "task_001",              // string, 对应 behavior_tasks._id
  userId: "user_001",              // string
  type: "issued",                  // enum: issued|accepted|started|completed|skipped|expired|reminded
  ts: "2025-01-01T12:00:00Z",      // date, 事件时间
  channel: "app",                  // string, 触发渠道/来源
  payload: {                        // object, 可选上下文
    reason: "到期提醒",
    evidence: "photo://task_001_ok.jpg"
  }
}
```

## 索引建议
- 组合索引：`taskId + type + ts`
- 组合索引：`userId + ts`

## 关系
- 多对一：`task_events.taskId` → `behavior_tasks._id`

## 使用场景
- 依从性统计：接受率/启动率/完成率
- 提醒效果分析：不同提醒窗口的转化
- 行为策略A/B：不同建议模版的效果对比

## 示例
```javascript
[
  { _id: "evt_1", taskId: "task_987", userId: "u_42", type: "issued", ts: "2025-01-02T20:00:00Z" },
  { _id: "evt_2", taskId: "task_987", userId: "u_42", type: "reminded", ts: "2025-01-02T23:50:00Z", payload: { window: "due-10m" } },
  { _id: "evt_3", taskId: "task_987", userId: "u_42", type: "completed", ts: "2025-01-03T08:10:00Z", payload: { evidence: "photo://..." } }
]
```

## 注意事项
- 同一时间窗避免重复提醒事件的累计；事件写入应为追加式、不可变。
- `expired` 由定时任务或窗口扫描写入，保持状态一致性。

