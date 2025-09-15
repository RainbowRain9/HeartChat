# checkins —— 情绪/状态回访表

## 表说明
记录用户的短期情绪、压力自评与自由备注，可与行为任务关联，用于复盘与趋势分析。

## 字段结构
```javascript
{
  _id: "ck_001",                    // string, 回访ID
  userId: "user_001",               // string
  mood_score: 0.6,                   // number, 0-1 情绪分
  stress_score: 0.4,                 // number, 0-1 压力分
  note: "整理完桌面感觉轻松了",          // string, 备注
  ts: "2025-01-02T12:30:00Z",        // date
  related_task_id: "task_001",       // string, 可空
  channel: "app"                      // string
}
```

## 索引建议
- 组合索引：`userId + ts`
- 过滤索引：`related_task_id`

## 关系
- 可选关联：`checkins.related_task_id` → `behavior_tasks._id`

## 使用场景
- 行为任务后的T+1回访
- 趋势图：情绪/压力随时间变化
- 个性化建议排序的特征输入

## 示例
```javascript
{
  _id: "ck_42",
  userId: "u_42",
  mood_score: 0.7,
  stress_score: 0.3,
  note: "完成任务后状态更稳",
  ts: "2025-01-03T09:00:00Z",
  related_task_id: "task_987",
  channel: "app"
}
```

## 注意事项
- 记录为轻量、快捷，一键分数+可选备注，降低负担。
- 若涉及多模态（语音/图像），仅存储脱敏引用并控制权限。

