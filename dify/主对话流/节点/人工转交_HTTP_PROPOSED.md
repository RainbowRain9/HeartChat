# 人工转交｜HTTP｜PROPOSED

- 触发来源：`风险评估_llm_1757936891962` 分支条件 `risk_level = 4` 或 `(risk_level = 3 ∧ timeframe = now ∧ means_access = possible)`
- 目标：将高危信号写入 `risk_signals` 并推送到人工值班通道（由后端网关转发）
- 模板：`dify/主对话流/http_templates/risk_signals.create.http`

## 请求要点
- 方法：`POST /api/risk_signals`
- 认证：Bearer `{{API_KEY}}`
- 载荷字段：
  - `user_hash`: 脱敏用户
  - `risk_type`: 取自 `intent_type`
  - `level`: 取自 `risk_level`
  - `evidence.snippets`: 本轮 `sys.query`
  - `evidence.summary`: 风险摘要

## 变量对齐
- `{{USER_HASH}}`：建议由后端统一注入；如无可使用会话哈希
- `{{RISK_SCORE}}`：规则映射（示例：4→0.95, 3→0.8, 1-2→0.5, 0→0）

