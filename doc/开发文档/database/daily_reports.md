# daily_reports —— 每日智能用户报表

## 表说明
面向本人或已授权的辅导岗位展示的日报，汇总情绪、风险、任务依从性与下一步建议。

## 字段结构
```javascript
{
  _id: "dr_2025-01-03_u_42",        // string, 复合Key
  user_hash: "uh_abc",              // string
  date: "2025-01-03",               // string (YYYY-MM-DD)
  mood_summary: {                     // object
    avg_mood: 0.62,
    avg_stress: 0.35,
    trend: "up"
  },
  risk_summary: {                     // object
    max_level: 2,
    signals: [{type: "负向情绪上升", score: 0.71}]
  },
  tasks_summary: {                    // object
    issued: 3,
    completed: 2,
    adherence: 0.67
  },
  next_best_actions: ["睡前5分钟呼吸练习","明早整理桌面10分钟"],
  created_at: "2025-01-03T23:59:00Z"
}
```

## 索引建议
- 组合索引：`user_hash + date`

## 关系
- 汇总自 `checkins`、`risk_signals`、`behavior_tasks`、`task_events`

## 使用场景
- 个人日报卡片
- 授权辅导岗的关注名单/群组日报

## 示例
```javascript
{
  _id: "dr_2025-01-03_u_42",
  user_hash: "uh_abc",
  date: "2025-01-03",
  mood_summary: { avg_mood: 0.62, avg_stress: 0.35, trend: "up" },
  risk_summary: { max_level: 2, signals: [{ type: "负向情绪上升", score: 0.71 }] },
  tasks_summary: { issued: 3, completed: 2, adherence: 0.67 },
  next_best_actions: ["睡前5分钟呼吸练习","明早整理桌面10分钟"],
  created_at: "2025-01-03T23:59:00Z"
}
```

## 注意事项
- 日报生成应支持补写/重算；敏感字段遵循最小化可见。

