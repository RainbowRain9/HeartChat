# 行为任务创建｜HTTP｜PROPOSED

- 触发来源：`汇总、总结与建议生成_llm_1757929910659` 的 `actionable_suggestions`
- 可选来源：`加强建议与回访计划_llm_PROPOSED.tasks`、`安抚与自助资源_llm_PROPOSED.resources`
- 模板：`dify/主对话流/http_templates/behavior_tasks.bulk.http`

## 请求要点
- 方法：`POST /api/behavior_tasks/bulk`
- 认证：Bearer `{{API_KEY}}`
- 载荷：多条任务 JSON 数组（见模板）

## 字段映射建议（对齐 behavior_tasks）
- `userId`：`{{USER_ID}}`（由外层注入）
- `agent`：主题 Agent 名（如“学业与考试压力”）
- `title`：来自建议文本或资源名
- `steps`：可为空或从资源/建议扩展
- `expectedMinutes`：默认 10（或由 LLM 输出覆盖）
- `status`：`issued`
- `metadata.sourceMessage`：`{{#sys.query#}}`
- `metadata.summary`：`{{#1757929910659.text#}}`

