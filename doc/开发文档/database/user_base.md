# user_base（用户基础信息表）

## 表说明
存储用户的基础账户信息，包括用户标识、基本信息、账户状态等核心数据。

## 字段结构

```javascript
{
  _id: "记录ID",                    // string, 主键，自动生成
  user_id: "用户ID",                // string, 7位数字用户ID，唯一标识
  openid: "微信openid",             // string, 微信用户唯一标识
  username: "用户名",                // string, 用户显示名称
  avatar_url: "头像URL",             // string, 用户头像图片地址
  user_type: 1,                     // number, 用户类型：1-普通用户，2-VIP用户，3-管理员
  status: 1,                        // number, 账户状态：1-启用，0-禁用
  created_at: "创建时间",            // date, 账户创建时间
  updated_at: "更新时间"             // date, 最后更新时间
}
```

## 索引建议
- **唯一索引**：user_id
- **唯一索引**：openid
- **单字段索引**：user_type
- **单字段索引**：status
- **复合索引**：user_type + status

## 关联关系
- **一对多**：user_base.user_id → user_profile.user_id
- **一对多**：user_base.user_id → user_stats.user_id
- **一对多**：user_base.user_id → user_config.user_id
- **一对多**：user_base.user_id → user_interests.user_id
- **一对多**：user_base.openid → chats.openId

## 使用场景
1. 用户认证
2. 基础信息管理
3. 账户状态控制
4. 用户身份识别

## 数据示例
```javascript
{
  "_id": "user_base_001",
  "user_id": "1234567",
  "openid": "oxxxxxxxxxxxxxxxx",
  "username": "张三",
  "avatar_url": "https://example.com/avatar.jpg",
  "user_type": 1,
  "status": 1,
  "created_at": "2025-01-01T10:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

## 用户类型说明
- **1** - 普通用户：基础功能权限
- **2** - VIP用户：高级功能权限
- **3** - 管理员：系统管理权限

## 状态说明
- **1** - 启用：正常使用状态
- **0** - 禁用：账户被禁用，无法使用

## 用户ID生成规则
- 长度：7位数字
- 范围：1000000-9999999
- 生成方式：时间戳 + 随机数
- 唯一性：系统内唯一

## 注意事项
- user_id和openid都是唯一标识，需要保持一致性
- 用户名和头像可以通过用户资料更新
- 账户状态变更需要同步更新相关业务数据
- 敏感操作需要验证用户状态