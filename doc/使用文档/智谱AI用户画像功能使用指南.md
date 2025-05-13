# HeartChat 智谱AI用户画像功能使用指南

## 一、功能概述

HeartChat微信小程序现已集成智谱AI增强的用户画像功能，通过分析用户的对话内容、情绪记录和兴趣数据，生成更准确、更个性化的用户画像，为用户提供更精准的个性分析和推荐服务。

## 二、功能特点

1. **基于对话内容的深度分析**：使用智谱AI分析用户的历史对话内容，提取用户的兴趣、偏好、沟通风格和情感模式。
2. **多维度用户画像**：结合情绪记录和兴趣数据，构建全面的用户画像。
3. **自然友好的个性描述**：使用智谱AI生成自然、友好的个性总结，避免机械化的分析报告风格。
4. **智能降级机制**：当AI分析失败时，自动回退到基于规则的分析方法，确保功能稳定性。

## 三、使用方法

### 1. 在用户中心页面查看个性分析

用户可以在用户中心页面查看自己的个性分析结果，包括个性特征雷达图和个性总结描述。

```javascript
// pages/user/user.js
Page({
  // 加载个性分析数据
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
        const personalityData = result.result.data;
        this.setData({ personalityData });
        
        // 更新个性雷达图
        if (this.personalityRadarChart) {
          const option = this.getPersonalityRadarOption(personalityData);
          this.personalityRadarChart.setOption(option);
        }
      }
    } catch (error) {
      console.error('获取个性分析数据失败:', error);
    }
  }
});
```

### 2. 在个人资料页面查看详细个性分析

用户可以在个人资料页面查看更详细的个性分析结果，包括个性特征、兴趣爱好和情感模式。

```javascript
// pages/user/profile/index.js
Page({
  // 加载个性分析数据
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
        
        // 设置个性特征数据
        this.setData({
          personalityTraits: perceptionData.personalityTraits,
          personalitySummary: perceptionData.personalitySummary,
          interests: perceptionData.interests
        });
      }
    } catch (error) {
      console.error('获取个性分析数据失败:', error);
    }
  }
});
```

### 3. 在角色对话中使用用户画像

角色可以根据用户画像调整对话风格和内容，提供更个性化的对话体验。

```javascript
// pages/chat/chat.js
Page({
  // 获取用户画像
  async getUserPerception() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getUserPerception'
        }
      });
      
      if (result.result && result.result.success) {
        this.userPerception = result.result.data;
        
        // 将用户画像信息添加到角色系统提示中
        this.updateRoleSystemPrompt();
      }
    } catch (error) {
      console.error('获取用户画像失败:', error);
    }
  },
  
  // 更新角色系统提示
  updateRoleSystemPrompt() {
    if (!this.userPerception) return;
    
    const { personalitySummary, interests } = this.userPerception;
    const interestsStr = interests.join('、');
    
    // 将用户画像信息添加到角色系统提示中
    const userInfo = `用户个性: ${personalitySummary}\n用户兴趣: ${interestsStr}`;
    
    // 更新角色系统提示
    this.systemPrompt = `${this.originalSystemPrompt}\n\n${userInfo}`;
  }
});
```

## 四、返回数据结构

调用`getUserPerception`云函数后，返回的数据结构如下：

```javascript
{
  success: true,
  data: {
    // 用户兴趣（字符串数组）
    interests: ["阅读", "音乐", "旅行", ...],
    
    // 个性特征（对象数组）
    personalityTraits: [
      { trait: "责任感", score: 0.85 },
      { trait: "创造力", score: 0.75 },
      ...
    ],
    
    // 个性总结（字符串）
    personalitySummary: "你是一个富有创造力和责任感的人，喜欢探索新事物...",
    
    // 情绪模式数据
    emotionPatterns: {
      emotionPercentages: { ... },
      emotionTrends: { ... },
      dominantEmotions: [ ... ]
    },
    
    // AI分析结果（如果使用智谱AI分析成功）
    aiPerception: {
      interests: ["阅读", "音乐", ...],
      preferences: ["简约风格", "科技产品", ...],
      communication_style: "用户倾向于使用简洁明了的语言...",
      emotional_patterns: ["情绪稳定", "积极乐观", ...]
    }
  }
}
```

## 五、注意事项

1. **数据量要求**：
   - 智谱AI分析需要足够的用户对话数据才能生成准确的用户画像
   - 建议用户至少进行5-10次对话后再查看个性分析结果

2. **隐私保护**：
   - 用户对话内容仅用于分析用户画像，不会用于其他用途
   - 分析结果仅存储在用户自己的数据中，不会共享给其他用户

3. **分析频率**：
   - 用户画像分析是一个计算密集型任务，建议不要频繁调用
   - 建议在用户首次进入用户中心页面时进行分析，并缓存结果

4. **错误处理**：
   - 当智谱AI分析失败时，系统会自动回退到基于规则的分析方法
   - 如果遇到分析失败的情况，可以尝试增加用户对话数据后再次分析

## 六、常见问题

### 1. 为什么我的个性分析结果看起来不够准确？

个性分析的准确性取决于用户对话数据的数量和质量。如果您刚开始使用HeartChat，或者对话内容较少，分析结果可能不够准确。建议多进行一些对话，系统会随着数据的增加而提供更准确的分析结果。

### 2. 个性分析结果多久更新一次？

个性分析结果不会自动更新，而是在您查看用户中心页面或个人资料页面时重新计算。如果您想查看最新的分析结果，可以刷新页面或重新进入应用。

### 3. 我的对话内容会被保存吗？

您的对话内容会被保存在数据库中，用于分析用户画像和提供更个性化的服务。但这些数据仅用于您自己的用户画像分析，不会用于其他用途，也不会共享给其他用户。

### 4. 如何提高个性分析的准确性？

- 多进行对话，增加数据量
- 在对话中表达自己的真实想法和情感
- 尝试与不同角色进行对话，展示不同方面的个性

## 七、技术支持

如果您在使用过程中遇到任何问题，或者有任何建议和反馈，请通过以下方式联系我们：

- 在应用内的"反馈"页面提交问题
- 发送邮件至support@heartchat.com
- 在官方社区论坛发帖
