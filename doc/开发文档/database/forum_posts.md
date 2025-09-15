# forum_posts —— 论坛帖子表（脱敏）

## 表说明
存储论坛发帖与评论的脱敏文本及元数据，供本地向量检索、主题模型与风险分析。

## 字段结构
```javascript
{
  _id: "post_001",                 // string, 帖子ID
  user_hash: "uh_xxx",              // string, 脱敏用户标识（不可逆/分区可换盐）
  parentId: null,                    // string|null, 若为评论则为父帖ID
  text: "今天有点丧...",             // string, 文本（已脱敏）
  media_refs: ["img://p1.jpg"],      // array<string>, 可选
  privacy_flag: "public",            // enum: public|anon|private_group
  created_at: "2025-01-01T12:00:00Z",// date
  updated_at: "2025-01-01T12:00:00Z" // date
}
```

## 索引建议
- 组合索引：`user_hash + created_at`
- 过滤索引：`parentId`、`privacy_flag`

## 关系
- 一对多：`forum_posts._id` 对其评论 `forum_posts.parentId`

## 使用场景
- 论坛ingest与向量化
- 主题聚类、热词趋势
- 风险信号输入

## 示例
```javascript
{
  _id: "post_123",
  user_hash: "uh_abc",
  parentId: null,
  text: "考试没考好，但准备先收拾桌面重启一下",
  media_refs: [],
  privacy_flag: "public",
  created_at: "2025-01-02T20:10:00Z",
  updated_at: "2025-01-02T20:10:00Z"
}
```

## 注意事项
- 入库前完成脱敏/敏感词清洗；原文与映射Key需物理分离、最小可见原则。
- 对private_group配置细粒度ACL与审计日志。

