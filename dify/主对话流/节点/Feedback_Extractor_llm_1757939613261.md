# Feedback_Extractor｜llm｜id=1757939613261

## 上游
- 问题分类器

## 下游
- （无）

## 内部信息
- 模型：langgenius/openai_api_compatible/openai_api_compatible/zai-org/GLM-4.5 (chat)
- 参数：{'temperature': 0.7}
- 上下文启用：False  selector=[] 
- 提示词（system）：
```
只抽取字段，不输出话术；raw_text 回填为 {{#sys.query#}} 便于审计。
```
- 结构化输出 Schema：
```json
additionalProperties: false
properties:
  feedback_type:
    enum:
    - bug
    - suggestion
    - praise
    - other
    type: string
  module:
    type: string
  raw_text:
    type: string
  sentiment:
    enum:
    - neg
    - neutral
    - pos
    type: string
  severity:
    enum:
    - low
    - medium
    - high
    type: string
  summary:
    type: string
required:
- feedback_type
- summary
type: object

```