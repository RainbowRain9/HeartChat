# HeartChat UserPerception 模块使用文档

## 一、概述

`userPerception` 模块是 HeartChat 应用中负责用户画像生成和处理的核心组件，位于 `cloudfunctions/user/userPerception.js`。该模块基于用户的情绪记录和兴趣数据，生成用户的个性特征分析和个性总结，为用户中心页面的个性分析模块提供数据支持。

## 二、功能说明

### 1. 获取用户画像 (getUserPerception)

**功能**：基于用户的情绪记录和兴趣数据，生成用户的个性特征分析和个性总结。

**使用场景**：
- 用户中心页面的个性分析卡片
- 个人资料页面的个性特征展示
- 用户画像数据分析

**调用方式**：
通过 `user` 云函数调用：
```javascript
const result = await wx.cloud.callFunction({
  name: 'user',
  data: {
    action: 'getUserPerception',
    userId: userInfo.userId // 可选，默认使用当前登录用户
  }
});
```

**返回数据**：
```javascript
{
  success: true,
  data: {
    interests: ["科技", "阅读", "音乐", "旅行"], // 用户兴趣标签
    personalityTraits: [                       // 个性特征数据
      { trait: "责任感", score: 0.85 },
      { trait: "完美主义", score: 0.80 },
      { trait: "同理心", score: 0.70 },
      { trait: "创造力", score: 0.65 },
      { trait: "社交性", score: 0.50 },
      { trait: "冒险精神", score: 0.40 },
      { trait: "耐心", score: 0.60 }
    ],
    personalitySummary: "根据你的对话内容和情绪反应，我们分析出你是一个责任感强、追求完美的人，同时也具有同理心和创造力。", // 个性总结
    emotionPatterns: {                         // 情绪模式数据
      emotionPercentages: {                    // 情绪百分比
        "快乐": 25,
        "平静": 20,
        "焦虑": 15,
        "压力": 40
      },
      emotionTrends: {                         // 情绪趋势
        trend: "消极下降"
      },
      dominantEmotions: [                      // 主导情绪
        { emotion: "压力", percentage: 40 },
        { emotion: "快乐", percentage: 25 }
      ]
    }
  }
}
```

## 三、实现原理

### 1. 用户画像生成流程

1. **数据收集**：
   - 从 `user_interests` 集合获取用户兴趣数据
   - 从 `emotionRecords` 集合获取用户情绪记录

2. **情绪模式分析**：
   - 统计各情绪类型出现频率
   - 计算情绪百分比分布
   - 分析情绪变化趋势
   - 确定主导情绪

3. **个性特征生成**：
   - 基于预设的基础特征模板
   - 根据用户兴趣调整特征分数
   - 根据情绪模式调整特征分数
   - 确保分数在0-1范围内

4. **个性总结生成**：
   - 提取得分最高的三个特征
   - 生成自然语言的个性描述

### 2. 个性特征与兴趣/情绪的关联规则

#### 兴趣对个性特征的影响：

| 兴趣类别 | 影响的特征 | 分数调整 |
|---------|----------|---------|
| 艺术/音乐/绘画/创作 | 创造力 | +0.1 |
| 旅行/探险/户外 | 冒险精神 | +0.1 |
| 阅读/学习/科学 | 责任感 | +0.05 |
| 社交/派对/聚会 | 社交性 | +0.1 |

#### 情绪对个性特征的影响：

| 情绪类型 | 影响的特征 | 分数调整 |
|---------|----------|---------|
| 焦虑 | 完美主义 | +0.05 |
| 平静 | 耐心 | +0.05 |
| 快乐 | 社交性 | +0.05 |
| 同情 | 同理心 | +0.1 |

## 四、使用示例

### 1. 在用户中心页面获取并展示用户画像

```javascript
// pages/user/user.js
Page({
  data: {
    personalityData: {
      labels: [],
      values: [],
      summary: ''
    }
  },
  
  onShow() {
    this.loadPersonalityData();
  },
  
  async loadPersonalityData() {
    try {
      const { userInfo } = this.data;
      if (!userInfo || !userInfo.userId) return;
      
      // 调用云函数获取个性分析数据
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getUserPerception',
          userId: userInfo.userId
        }
      });
      
      if (result.result && result.result.success) {
        const perceptionData = result.result.data;
        
        // 处理数据用于雷达图显示
        const personalityData = {
          labels: perceptionData.personalityTraits.map(item => item.trait),
          values: perceptionData.personalityTraits.map(item => item.score * 100),
          summary: perceptionData.personalitySummary
        };
        
        this.setData({ personalityData });
        
        // 初始化个性雷达图
        this.initPersonalityChart(personalityData);
      }
    } catch (error) {
      console.error('获取个性分析数据失败:', error);
    }
  },
  
  initPersonalityChart(personalityData) {
    // 使用 ECharts 或其他图表库初始化雷达图
    // ...
  }
});
```

### 2. 在个人资料页面展示用户兴趣标签

```javascript
// pages/user/profile/index.js
Page({
  data: {
    interests: [],
    personalityTraits: []
  },
  
  onLoad() {
    this.loadUserPerception();
  },
  
  async loadUserPerception() {
    try {
      const { userInfo } = getApp().globalData;
      if (!userInfo || !userInfo.userId) return;
      
      // 调用云函数获取用户画像
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getUserPerception',
          userId: userInfo.userId
        }
      });
      
      if (result.result && result.result.success) {
        const { interests, personalityTraits } = result.result.data;
        this.setData({ 
          interests,
          personalityTraits
        });
      }
    } catch (error) {
      console.error('获取用户画像失败:', error);
    }
  }
});
```

## 五、数据依赖

### 1. 数据库集合

| 集合名称 | 用途 | 关键字段 |
|---------|------|---------|
| `user_interests` | 存储用户兴趣数据 | `user_id`, `interests`, `aggregated_interest_vector` |
| `emotionRecords` | 存储用户情绪记录 | `userId`, `mainEmotion`, `emotions`, `createTime` |

### 2. 数据格式

#### user_interests 集合：
```javascript
{
  _id: "string",                // 系统自动生成的唯一ID
  user_id: "string",            // 用户ID
  interests: [                  // 兴趣标签数组
    { tag: "科技", score: 0.8 },
    { tag: "阅读", score: 0.7 }
  ],
  aggregated_interest_vector: [0.8, 0.7, 0.5, ...], // 用户聚合兴趣向量
  created_at: Date,             // 创建时间
  updated_at: Date              // 更新时间
}
```

#### emotionRecords 集合：
```javascript
{
  _id: "string",                // 系统自动生成的唯一ID
  userId: "string",             // 用户ID
  mainEmotion: "string",        // 主要情绪
  emotions: [                   // 情绪数组
    { emotion: "快乐", score: 0.8 },
    { emotion: "期待", score: 0.3 }
  ],
  createTime: Date              // 创建时间
}
```

## 六、注意事项

1. **数据依赖**：`userPerception` 模块依赖于 `user_interests` 和 `emotionRecords` 集合中的数据，这些数据分别由用户兴趣分析和情感分析功能生成。

2. **数据量限制**：为避免处理过多数据，情绪记录查询默认限制为最近20条记录。

3. **默认值处理**：如果用户没有兴趣数据或情绪记录，模块会使用默认值生成基础的个性特征。

4. **分数规范化**：所有特征分数都会被规范化到0-1范围内，前端展示时可以乘以100转换为百分比。

5. **更新频率**：用户画像数据不需要实时更新，建议在用户查看个人中心页面时才进行计算。

## 七、错误处理

常见错误及处理方法：

| 错误情况 | 错误信息 | 处理方法 |
|---------|---------|---------|
| 查询失败 | "获取用户画像失败" | 检查网络连接和用户ID是否正确 |
| 无数据 | 返回默认值 | 显示基础个性特征，不影响用户体验 |
| 处理异常 | 具体错误信息 | 记录日志并返回默认数据 |

## 八、与其他模块的关系

1. **与 `roles\userPerception.js` 的区别**：
   - `user\userPerception.js` 基于已有的情绪记录和兴趣数据生成用户画像，主要用于用户中心页面展示。
   - `roles\userPerception.js` 通过智谱AI分析用户对话内容，提取用户特征，主要用于角色对话中理解用户。

2. **与 `emotion` 云函数的关系**：
   - `userPerception` 模块使用 `emotionRecords` 集合中的数据，这些数据也被 `emotion` 云函数用于情绪概览和历史分析。
   - 两者处理相同的数据源，但用于不同的目的。

## 九、未来优化方向

1. **算法优化**：改进个性特征生成算法，提高分析准确性
2. **数据整合**：整合更多用户行为数据，如使用频率、角色偏好等
3. **实时更新**：支持用户画像的增量更新，减少计算开销
4. **个性化建议**：基于用户画像提供个性化的使用建议和内容推荐
5. **与AI集成**：结合大语言模型，生成更自然、更个性化的用户画像描述
