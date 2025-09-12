# user_profile（用户资料表）

## 表说明
存储用户的详细个人信息，包括基本信息、地理位置、个人简介等扩展资料，用于个性化服务和用户画像。

## 字段结构

```javascript
{
  _id: "记录ID",                    // string, 主键，自动生成
  user_id: "用户ID",                 // string, 关联user_base表
  gender: "性别",                    // string, 性别：男/女/保密
  country: "国家",                  // string, 国家
  province: "省份",                  // string, 省份
  city: "城市",                      // string, 城市
  bio: "个人简介",                   // string, 个人简介/签名
  birthday: "生日",                  // string, 生日 YYYY-MM-DD
  interests: ["兴趣1", "兴趣2"],    // array, 兴趣爱好列表
  personality: ["性格特点1", "性格特点2"], // array, 性格特点列表
  occupation: "职业",                // string, 职业信息
  education: "教育程度",             // string, 教育背景
  relationship: "情感状态",          // string, 情感状态
  created_at: "创建时间",            // date, 资料创建时间
  updated_at: "更新时间"             // date, 资料更新时间
}
```

## 索引建议
- **唯一索引**：user_id
- **单字段索引**：gender
- **单字段索引**：country
- **复合索引**：province + city
- **文本索引**：bio, interests（支持搜索）

## 关联关系
- **一对一**：user_profile.user_id → user_base.user_id

## 使用场景
1. 用户资料管理
2. 个性化服务
3. 用户画像构建
4. 地域分析

## 数据示例
```javascript
{
  "_id": "profile_001",
  "user_id": "1234567",
  "gender": "女",
  "country": "中国",
  "province": "广东省",
  "city": "深圳市",
  "bio": "热爱生活，喜欢旅行和阅读，正在探索心理学领域",
  "birthday": "1995-06-15",
  "interests": ["旅行", "阅读", "心理学", "摄影"],
  "personality": ["开朗", "细心", "好奇心强"],
  "occupation": "产品经理",
  "education": "本科",
  "relationship": "单身",
  "created_at": "2025-01-01T10:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

## 字段说明
- **gender**：支持"男"、"女"、"保密"三个选项
- **birthday**：格式为YYYY-MM-DD，用于年龄计算
- **interests**：用户自述的兴趣爱好
- **personality**：用户自述的性格特点
- **bio**：个人简介，支持emoji和特殊字符

## 更新规则
1. 用户主动更新资料时修改
2. 支持部分字段更新
3. 更新时自动记录updated_at
4. 敏感信息需要验证权限

## 注意事项
- 资料信息涉及用户隐私，需要严格保护
- 地理位置信息可用于地域化服务
- 兴趣和性格信息用于个性化推荐
- 建议提供资料完整度评分功能