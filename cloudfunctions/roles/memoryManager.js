// 记忆管理模块
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

// 调用智谱AI接口
async function callZhipuAI(params) {
  try {
    // 从环境变量获取API密钥
    const apiKey = process.env.ZHIPU_API_KEY || '';
    if (!apiKey) {
      console.error('未设置ZHIPU_API_KEY环境变量');
      throw new Error('智谱AI API密钥未配置');
    }

    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // 构建请求体
    const body = JSON.stringify({
      model: params.model || 'glm-4',
      messages: params.messages,
      temperature: params.temperature || 0.7,
      top_p: params.top_p || 0.8,
      max_tokens: params.max_tokens || 2000,
      response_format: params.response_format || { type: "text" }
    });

    console.log(`调用智谱AI接口, 模型: ${params.model || 'glm-4'}`);

    // 发送请求
    const response = await cloud.callFunction({
      name: 'httpRequest',
      data: {
        url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        method: 'POST',
        headers: headers,
        body: body
      }
    });

    // 检查响应是否有错误
    if (response.result.error) {
      console.error('智谱AI返回错误:', response.result);
      throw new Error(`智谱AI调用失败: ${response.result.message || '未知错误'}`);
    }

    // 解析响应
    const result = JSON.parse(response.result.body);

    // 检查智谱AI响应是否有错误
    if (result.error) {
      console.error('智谱AI API返回错误:', result.error);
      throw new Error(`智谱AI API错误: ${result.error.message || result.error.type || '未知错误'}`);
    }

    return result;
  } catch (error) {
    console.error('调用智谱AI接口失败:', error);
    throw error;
  }
}

// 从对话中提取记忆
async function extractMemoriesFromChat(messages, roleInfo) {
  try {
    // 获取最近的对话内容（最多10条消息）
    const recentMessages = messages.slice(-10);
    const conversationText = recentMessages.map(msg =>
      `${msg.sender_type === 'user' ? '用户' : roleInfo.name}: ${msg.content}`
    ).join('\n');

    // 调用智谱AI提取记忆
    const result = await callZhipuAI({
      model: "glm-4-flash",
      messages: [
        {
          role: "system",
          content: "你是一个对话记忆提取专家，能够从对话中提取重要信息作为角色的记忆。"
        },
        {
          role: "user",
          content: `请从以下对话中提取3-5条重要信息，这些信息应该作为角色(${roleInfo.name})的记忆被保存。
          重点关注：
          1. 用户提到的个人信息（如兴趣、经历、偏好）
          2. 用户的情感状态和需求
          3. 对话中的重要事件或决定
          4. 可能在未来对话中有用的上下文

          对话内容：
          ${conversationText}

          请以JSON格式返回结果，格式如下：
          {
            "memories": [
              {
                "content": "记忆内容（简洁的一句话）",
                "importance": 0.8,
                "context": "记忆的上下文或来源"
              }
            ]
          }

          重要性评分范围为0-1，越重要越接近1。`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    // 解析JSON结果
    const responseContent = result.choices[0].message.content;
    let memories;

    try {
      memories = JSON.parse(responseContent).memories;
    } catch (parseError) {
      console.error('解析记忆JSON失败:', parseError);
      // 尝试使用正则表达式提取JSON部分
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          memories = JSON.parse(jsonMatch[0]).memories;
        } catch (e) {
          console.error('二次解析记忆JSON失败:', e);
          throw new Error('无法解析AI返回的记忆数据');
        }
      } else {
        throw new Error('无法解析AI返回的记忆数据');
      }
    }

    // 添加时间戳
    const timestamp = new Date();
    memories.forEach(memory => {
      memory.timestamp = timestamp;
    });

    return memories;
  } catch (error) {
    console.error('从对话中提取记忆失败:', error);
    throw error;
  }
}

// 更新角色记忆
async function updateRoleMemories(roleId, newMemories) {
  try {
    // 获取角色当前记忆
    const role = await db.collection('roles').doc(roleId).get();
    if (!role.data) {
      throw new Error('角色不存在');
    }

    // 合并现有记忆和新记忆
    const existingMemories = role.data.memories || [];
    let allMemories = [...existingMemories, ...newMemories];

    // 如果记忆总数超过50条，进行记忆合并或删除
    if (allMemories.length > 50) {
      // 按重要性排序
      allMemories.sort((a, b) => b.importance - a.importance);

      // 保留前30条重要记忆
      const importantMemories = allMemories.slice(0, 30);

      // 对剩余记忆进行合并
      const remainingMemories = allMemories.slice(30);
      const mergedMemories = await mergeMemories(remainingMemories);

      // 更新记忆列表
      allMemories = [...importantMemories, ...mergedMemories];
    }

    // 更新角色记忆
    await db.collection('roles').doc(roleId).update({
      data: {
        memories: allMemories,
        updateTime: db.serverDate()
      }
    });

    return allMemories;
  } catch (error) {
    console.error('更新角色记忆失败:', error);
    throw error;
  }
}

// 合并相似记忆
async function mergeMemories(memories) {
  if (memories.length <= 5) {
    return memories;
  }

  try {
    // 将记忆内容合并为文本
    const memoriesText = memories.map(memory =>
      `- ${memory.content} (重要性: ${memory.importance})`
    ).join('\n');

    // 调用智谱AI合并记忆
    const result = await callZhipuAI({
      model: "glm-4-flash",
      messages: [
        {
          role: "system",
          content: "你是一个记忆整合专家，能够将多条相似的记忆合并为更少的高质量记忆。"
        },
        {
          role: "user",
          content: `请将以下记忆合并为3-5条更概括的记忆，保留最重要的信息：

          ${memoriesText}

          请以JSON格式返回结果，格式如下：
          {
            "memories": [
              {
                "content": "合并后的记忆内容",
                "importance": 0.8,
                "context": "记忆的上下文或来源"
              }
            ]
          }

          重要性评分范围为0-1，越重要越接近1。`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    // 解析JSON结果
    const responseContent = result.choices[0].message.content;
    let mergedMemories;

    try {
      mergedMemories = JSON.parse(responseContent).memories;
    } catch (parseError) {
      console.error('解析合并记忆JSON失败:', parseError);
      // 如果解析失败，返回原始记忆中最重要的5条
      memories.sort((a, b) => b.importance - a.importance);
      return memories.slice(0, 5);
    }

    // 添加时间戳
    const timestamp = new Date();
    mergedMemories.forEach(memory => {
      memory.timestamp = timestamp;
    });

    return mergedMemories;
  } catch (error) {
    console.error('合并记忆失败:', error);
    // 如果合并失败，返回原始记忆中最重要的5条
    memories.sort((a, b) => b.importance - a.importance);
    return memories.slice(0, 5);
  }
}

// 获取相关记忆
async function getRelevantMemories(roleId, currentContext, limit = 5) {
  try {
    // 获取角色所有记忆
    const role = await db.collection('roles').doc(roleId).get();
    if (!role.data || !role.data.memories || role.data.memories.length === 0) {
      return [];
    }

    const memories = role.data.memories;

    // 如果没有当前上下文，按重要性排序返回
    if (!currentContext) {
      memories.sort((a, b) => b.importance - a.importance);
      return memories.slice(0, limit);
    }

    // 如果有当前上下文，调用智谱AI计算相关性
    const result = await callZhipuAI({
      model: "glm-4-flash",
      messages: [
        {
          role: "system",
          content: "你是一个记忆检索专家，能够从多条记忆中找出与当前上下文最相关的记忆。"
        },
        {
          role: "user",
          content: `请从以下记忆中选出与当前上下文最相关的${limit}条记忆，并按相关性从高到低排序：

          当前上下文：
          ${currentContext}

          记忆列表：
          ${memories.map((memory, index) => `${index+1}. ${memory.content} (重要性: ${memory.importance})`).join('\n')}

          请以JSON格式返回结果，格式如下：
          {
            "relevant_memories": [
              {
                "index": 1,
                "relevance": 0.9
              }
            ]
          }

          相关性评分范围为0-1，越相关越接近1。只返回索引和相关性评分，不需要返回记忆内容。`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    // 解析JSON结果
    const responseContent = result.choices[0].message.content;
    let relevantIndices;

    try {
      relevantIndices = JSON.parse(responseContent).relevant_memories;
    } catch (parseError) {
      console.error('解析相关记忆JSON失败:', parseError);
      // 如果解析失败，按重要性返回
      memories.sort((a, b) => b.importance - a.importance);
      return memories.slice(0, limit);
    }

    // 获取相关记忆
    const relevantMemories = relevantIndices
      .map(item => ({
        ...memories[item.index - 1],
        relevance: item.relevance
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    return relevantMemories;
  } catch (error) {
    console.error('获取相关记忆失败:', error);
    // 如果失败，按重要性返回
    const role = await db.collection('roles').doc(roleId).get();
    if (!role.data || !role.data.memories) {
      return [];
    }

    const memories = role.data.memories;
    memories.sort((a, b) => b.importance - a.importance);
    return memories.slice(0, limit);
  }
}

// 导出函数
module.exports = {
  extractMemoriesFromChat,
  updateRoleMemories,
  getRelevantMemories
};
