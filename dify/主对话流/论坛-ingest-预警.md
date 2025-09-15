# 论坛 ingest 与预警（Dify 工作流实现草案）

## 目标
- 对新帖/评论进行脱敏、主题标注、向量化与风险打分；
- 合并用户纵向特征形成风险轨迹；
- 超阈值触发异常告警与人工转交流程（在用户授权范围内）。

## 触发
- 论坛产生“新帖/新评”事件。输入：`user_hash`、`text`、`media_refs`、`privacy_flag`、`post_id`。

## 节点设计（Dify）
1. 预处理（Function / HTTP）
   - 脱敏清洗（PII去除、正则+词典），写入 `forum_posts`。
2. 向量化（Knowledge / Embedding）
   - 将 `text` 转为向量，入 `forum_embeddings`（或所用向量库），并做主题标签预测（LLM/分类器）。
3. 风险打分（LLM + 规则）
   - 规则库：高危词列表、频率阈值、夜间频次、长文本困扰指标；
   - 模型：情绪强度、求助意图、自伤/他伤线索评分；
   - 生成 `risk_signals` 记录。
4. 合并特征（HTTP / Aggregator）
   - 最近 `d7` 的 `risk_signals`、`checkins`、`task_events` 聚合，得到 `level` 与 `score` 调整。
5. 分支（If-Else）
   - 若 `level >= 3` 或 `score >= 0.85`：进入“异常告警”。
   - 否则：结束。
6. 异常告警（Tool / HTTP）
   - 推送到告警通道（仅授权角色可见），内容包含：风险类型、时间窗、证据摘要（脱敏）。
7. 人工转交（Subflow）
   - 检查用户授权；若同意，发送匿名/化名资料给辅导岗位；写审计日志。

## 关键请求（示例）
- 写入帖子
```http
POST /api/forum_posts
Body: { post_id, user_hash, text, media_refs?, privacy_flag, created_at }
```
- 写入风险信号
```http
POST /api/risk_signals
Body: { user_hash, source:"论坛", risk_type, score, ts, evidence, window, level }
```
- 生成/更新日报
```http
POST /api/daily_reports/upsert
Body: { user_hash, date, mood_summary, risk_summary, tasks_summary, next_best_actions }
```

## 阈值与策略（建议）
- d1窗口：`score >= 0.85` 直接告警；`0.7-0.85` 观察+私聊关怀；
- 夜间高频帖（23:00-06:00 且 N>=3）加权+0.1；
- 连续三天负向趋势 `trend_down >= 3` 提升 `level` 到2；
- 任何自伤/他伤高危线索→立即告警并进入应急预案。

## 权限与隐私
- 默认存脱敏文本与必要摘要；原文隔离存储、单独加密与审计；
- 告警内容仅授权角色可见，字段按RBAC控制；
- 明确用户授权范围与有效期，支持撤回。

