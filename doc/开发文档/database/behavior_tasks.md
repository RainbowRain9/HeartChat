# behavior_tasks —— 行为任务表

## 表说明
存储由智能体生成并下发给用户的“微行为任务”，用于承载从“认知→行动”的闭环起点（如：整理书桌10分钟、写下3条复盘等）。

## 字段结构
```javascript
{
  _id: "task_001",                 // string, 任务ID
  userId: "user_001",              // string, 用户ID（或openId/hash）
  agent: "学业与考试压力",           // string, 任务来源Agent名
  sceneTags: ["考试失利", "复盘"],    // array<string>, 场景/主题标签
  title: "整理桌面10分钟",            // string, 任务标题（面向用户）
  steps: ["清空桌面","分类收纳","设置学习位"], // array<string>, 步骤提示
  expectedMinutes: 10,              // number, 预计耗时
  difficulty: 1,                    // number, 1-5，难度/阻力
  nudgeLevel: 1,                    // number, 1-3，提醒强度偏好
  dueAt: "2025-01-02T12:00:00Z",   // date, 到期时间
  createAt: "2025-01-01T12:00:00Z",// date
  updateAt: "2025-01-01T12:00:00Z",// date
  status: "issued",                // enum: issued|accepted|started|completed|skipped|expired
  channel: "app",                  // string, 下发渠道：app|wx|email|sms
  metadata: {                       // object, 扩展
    rationale: "针对失败后情绪聚焦的微启动",
    nb_alternatives: ["番茄钟10分钟","复习清单3条"],
    sourceMessageId: "chat_msg_123"
  }
}
```

## 索引建议
- 组合索引：`userId + status + dueAt`
- 过滤索引：`agent`、`sceneTags`
- 时间序索引：`createAt`、`updateAt`

## 关系
- 一对多：`behavior_tasks._id` 对 `task_events.taskId`
- 可选关联：`checkins.related_task_id` 指向 `behavior_tasks._id`

## 使用场景
- 行为建议落地为任务卡
- 到期提醒、宽限期提醒
- 待办列表与完成率统计

## 示例
```javascript
{
  _id: "task_987",
  userId: "u_42",
  agent: "学业与考试压力",
  sceneTags: ["考试失利"],
  title: "整理桌面10分钟",
  steps: ["清空桌面","分类收纳","设置学习位"],
  expectedMinutes: 10,
  difficulty: 1,
  nudgeLevel: 1,
  dueAt: "2025-01-03T08:00:00Z",
  createAt: "2025-01-02T20:00:00Z",
  updateAt: "2025-01-02T20:00:00Z",
  status: "issued",
  channel: "app",
  metadata: { rationale: "微启动，降低阻力" }
}
```

## 注意事项
- 任务状态需幂等更新（避免重复提醒）；到期自动转 `expired`。
- 建议与任务解耦：同一建议可生成多个时间不同的任务实例。
- UI 以 Top3 建议/任务优先展示，减少决策负担。

