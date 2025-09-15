# 反馈入库｜HTTP｜PROPOSED

- 触发来源：`Feedback_Extractor_llm_1757939613261`（结构化输出）
- 模板：`dify/主对话流/http_templates/feedbacks.create.http`

## 请求要点
- 方法：`POST /api/feedbacks`
- 认证：Bearer `{{API_KEY}}`
- 载荷字段：`feedback_type/severity/sentiment/module/summary/raw_text` 由抽取器输出字段直接映射

## 备注
- 可在后端将 feedbacks 与用户标识/会话ID关联；并聚合到看板

