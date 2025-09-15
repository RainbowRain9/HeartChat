# 心语精灵｜新增节点与HTTP模板（按方案）

本页汇总新增节点（PROPOSED）及对应 HTTP 模板，便于在 Dify 中创建与连接。

## 新增 LLM 节点（PROPOSED）
- 危机引导与安全提示_llm_PROPOSED
  - 触发：risk_level =4 或 (3 ∧ now ∧ possible)
  - 下游：直接回复；并行 人工转交_HTTP_PROPOSED
- 加强建议与回访计划_llm_PROPOSED
  - 触发：risk_level = 3（非紧迫）
  - 下游：行为任务创建_HTTP_PROPOSED → 直接回复
- 安抚与自助资源_llm_PROPOSED
  - 触发：risk_level ∈ [1,2]
  - 下游：行为任务创建_HTTP_PROPOSED → 直接回复
- 反馈话术生成_llm_PROPOSED
  - 触发：Feedback_Extractor 结构化结果
  - 下游：直接回复、反馈入库_HTTP_PROPOSED

## HTTP 模板（PROPOSED）
- 行为任务批量创建：`dify/主对话流/http_templates/behavior_tasks.bulk.http`
  - 将 `汇总、总结与建议生成_llm(1757929910659).structured_output.actionable_suggestions` 转换为任务
- 风险信号写入：`dify/主对话流/http_templates/risk_signals.create.http`
  - 将 `风险评估_llm(1757936891962).structured_output` 写入 `risk_signals`
- 反馈入库：`dify/主对话流/http_templates/feedbacks.create.http`
  - 将 `Feedback_Extractor_llm(1757939613261).structured_output` 写入 `feedbacks`

## 接线建议（YAML）
- 在 `条件分支 2_if-else_1757937309894` 上新增 4 条出口：
  - 4 或 (3∧now∧possible) → 危机引导与安全提示_llm_PROPOSED → 直接回复
  - 4 或 (3∧now∧possible) → 人工转交_HTTP_PROPOSED（并行）
  - 3 → 加强建议与回访计划_llm_PROPOSED → 行为任务创建_HTTP_PROPOSED → 直接回复
  - 1~2 → 安抚与自助资源_llm_PROPOSED → 行为任务创建_HTTP_PROPOSED → 直接回复
  - 0 → 回流至 `汇总、总结与建议生成_llm_1757929910659`
- 在 `Feedback_Extractor_llm_1757939613261` 下游新增：
  - 反馈话术生成_llm_PROPOSED → 直接回复
  - 反馈入库_HTTP_PROPOSED（并行）
- 在 `汇总、总结与建议生成_llm_1757929910659` 下游新增：
  - 行为任务创建_HTTP_PROPOSED（根据 actionable_suggestions 批量写入）

## 变量与字段对齐
- behavior_tasks 字段参考：`doc/开发文档/database/behavior_tasks.md`
- risk_signals 字段参考：`doc/开发文档/database/risk_signals.md`

## 注意
- HTTP 模板中的 `{{API_BASE}}/{{API_KEY}}/{{USER_ID}}/...` 为占位符，请结合部署环境与 Dify 变量配置；
- 安全类节点必须避免输出自伤/他伤方法细节；
- 建议在 Dify 中开启相关 LLM 的 Structured Output 以便 if-else 精确路由。

