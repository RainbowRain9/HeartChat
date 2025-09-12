# roles（角色表）

## 表说明
存储AI角色的完整信息，包括角色基础信息、性格特点、提示词、记忆管理和用户画像等核心数据。

## 字段结构

```javascript
{
  _id: "角色ID",                    // string, 主键，自动生成
  name: "角色名称",                  // string, 角色显示名称
  avatar: "头像URL",                 // string, 角色头像图片地址
  category: "角色分类",              // string, psychology/life/career/emotion
  description: "角色描述",            // string, 角色功能描述
  personality: ["性格特点1", "性格特点2"], // array, 性格特点列表
  prompt: "角色提示词",              // string, AI对话提示词
  system_prompt: "系统提示词",       // string, 系统级提示词（与prompt同步）
  welcome: "欢迎语",                // string, 角色欢迎消息
  creator: "创建者",                // string, 'system' 或用户openid
  user_id: "用户ID",                 // string, 创建者用户ID（保留字段）
  createTime: "创建时间",            // date, 角色创建时间
  updateTime: "更新时间",            // date, 角色更新时间
  status: 1,                         // number, 状态：1启用/0禁用
  
  // 记忆管理
  memories: [                       // array, 角色记忆数组（最多50条）
    {
      content: "记忆内容",           // string, 记忆的具体内容
      importance: 0.8,               // number, 重要性评分 0-1
      category: "记忆分类",         // string, 记忆分类标签
      context: "记忆上下文",         // string, 记忆的上下文信息
      timestamp: "时间戳",           // date, 记录时间戳
      source: "chat"                  // string, 来源：chat/merged
    }
  ],
  
  // 用户画像
  user_perception: {                 // object, 用户画像信息
    interests: ["兴趣1", "兴趣2"],    // array, 用户兴趣列表
    preferences: ["偏好1", "偏好2"],  // array, 用户偏好列表
    communication_style: "沟通风格", // string, 沟通风格描述
    emotional_patterns: ["情感模式1", "情感模式2"], // array, 情感模式
    last_updated: "最后更新时间"      // date, 画像更新时间
  }
}
```

## 索引建议
- **单字段索引**：category
- **单字段索引**：creator
- **单字段索引**：status
- **复合索引**：user_id + createTime
- **文本索引**：name, description（支持搜索）

## 关联关系
- **一对多**：roles._id → chats.roleId
- **一对多**：roles._id → messages.roleId
- **一对多**：roles._id → roleUsage.roleId
- **多对一**：roles.creator → user_base.openid

## 使用场景
1. 角色管理
2. AI对话配置
3. 个性化体验
4. 记忆和画像存储

## 数据示例
```javascript
{
  "_id": "role_001",
  "name": "心理咨询师",
  "avatar": "https://example.com/avatar1.jpg",
  "category": "psychology",
  "description": "专业的心理咨询师，提供心理健康建议和情感支持",
  "personality": ["耐心", "专业", "温和", "理解"],
  "prompt": "你是一位专业的心理咨询师，具有丰富的临床经验和深厚的心理学知识...",
  "system_prompt": "你是一位专业的心理咨询师，具有丰富的临床经验和深厚的心理学知识...",
  "welcome": "你好！我是你的心理咨询师，很高兴能与你交流。请告诉我你最近的心情和想法。",
  "creator": "system",
  "user_id": "",
  "createTime": "2025-01-01T10:00:00Z",
  "updateTime": "2025-01-01T12:00:00Z",
  "status": 1,
  "memories": [
    {
      "content": "用户最近工作压力较大",
      "importance": 0.8,
      "category": "工作",
      "context": "用户提到最近项目截止日期临近",
      "timestamp": "2025-01-01T11:00:00Z",
      "source": "chat"
    }
  ],
  "user_perception": {
    "interests": ["心理健康", "职业发展"],
    "preferences": ["理性分析", "具体建议"],
    "communication_style": "直接明了",
    "emotional_patterns": ["压力时倾向寻求帮助"],
    "last_updated": "2025-01-01T12:00:00Z"
  }
}
```

## 角色分类枚举
- **psychology** - 心理咨询师
- **life** - 生活助手
- **career** - 职业顾问
- **emotion** - 情感陪伴

## 状态说明
- **1** - 启用状态，用户可以使用
- **0** - 禁用状态，用户不可见

## 记忆管理规则
- 最多保存50条记忆
- 按重要性评分排序
- 支持记忆合并和去重
- 定期清理低重要性记忆

## 注意事项
- prompt和system_prompt需要保持同步
- 系统角色（creator="system"）需要特殊保护
- 记忆数据涉及用户隐私，需要加密存储
- 用户画像数据需要定期更新