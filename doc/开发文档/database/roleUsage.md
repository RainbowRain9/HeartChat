# roleUsage（角色使用统计表）

## 表说明
记录用户对各个角色的使用情况，包括使用次数、最后使用时间等统计数据，用于角色推荐和使用分析。

## 字段结构

```javascript
{
  _id: "统计记录ID",                // string, 主键，自动生成
  roleId: "角色ID",                  // string, 关联roles表
  userId: "用户ID",                  // string, 关联user_base表
  usageCount: 0,                    // number, 使用次数
  lastUsedTime: "最后使用时间",       // date, 最后使用时间
  createTime: "创建时间",            // date, 统计记录创建时间
  updateTime: "更新时间"             // date, 统计记录更新时间
}
```

## 索引建议
- **复合唯一索引**：roleId + userId
- **复合索引**：userId + usageCount（降序）
- **复合索引**：roleId + usageCount（降序）
- **复合索引**：lastUsedTime
- **复合索引**：userId + lastUsedTime

## 关联关系
- **多对一**：roleUsage.roleId → roles._id
- **多对一**：roleUsage.userId → user_base.user_id

## 使用场景
1. 角色使用统计
2. 个性化角色推荐
3. 热门角色排行
4. 用户偏好分析

## 数据示例
```javascript
{
  "_id": "usage_001",
  "roleId": "role_001",
  "userId": "1234567",
  "usageCount": 15,
  "lastUsedTime": "2025-01-01T12:00:00Z",
  "createTime": "2025-01-01T10:00:00Z",
  "updateTime": "2025-01-01T12:00:00Z"
}
```

## 更新规则
1. 用户开始使用角色时，创建或更新记录
2. 每次使用时usageCount加1
3. 更新lastUsedTime为当前时间
4. 支持批量更新使用统计

## 注意事项
- 每个用户-角色组合只有一个统计记录
- usageCount需要实时更新以保证准确性
- 建议定期清理长期未使用的记录
- 统计数据可用于角色推荐算法