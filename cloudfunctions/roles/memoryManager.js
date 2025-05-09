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
    // 获取更多的对话内容（最多15条消息），以提供更丰富的上下文
    const recentMessages = messages.slice(-15);

    // 构建更结构化的对话文本，包括时间信息（如果有）
    const conversationText = recentMessages.map(msg => {
      // 格式化时间戳（如果存在）
      let timeInfo = '';
      if (msg.timestamp) {
        const date = new Date(msg.timestamp);
        if (!isNaN(date.getTime())) {
          timeInfo = `[${date.toLocaleString()}] `;
        }
      }

      // 构建消息文本，包括发送者和内容
      return `${timeInfo}${msg.sender_type === 'user' ? '用户' : roleInfo.name}: ${msg.content}`;
    }).join('\n\n'); // 使用双换行符分隔消息，提高可读性

    // 提取对话中可能存在的用户信息
    const userInfo = await extractUserInfoFromMessages(messages);

    // 调用智谱AI提取记忆，使用改进的提示词
    const result = await callZhipuAI({
      model: "glm-4-flash", // 使用更快的模型
      messages: [
        {
          role: "system",
          content: `你是一个高级对话记忆提取专家，能够从对话中提取重要信息作为角色的记忆。
          你的任务是识别对话中最有价值的信息，这些信息应该帮助角色(${roleInfo.name})在未来的对话中更好地理解和服务用户。
          提取的记忆应该简洁、具体、有用，并且能够帮助角色维持对话的连贯性和个性化。`
        },
        {
          role: "user",
          content: `请从以下对话中提取4-6条重要信息，这些信息应该作为角色(${roleInfo.name})的记忆被保存。

          重点关注以下类型的信息（按优先级排序）：
          1. 用户的个人信息（姓名、年龄、职业、家庭状况等）
          2. 用户的兴趣爱好、偏好和价值观
          3. 用户提到的重要经历、成就或挑战
          4. 用户的情感状态、需求和期望
          5. 用户与角色之间建立的关系动态或共识
          6. 对话中的重要决定、计划或承诺
          7. 可能在未来对话中有用的上下文信息

          已知的用户信息（如果有）：
          ${userInfo ? JSON.stringify(userInfo, null, 2) : '无'}

          对话内容：
          ${conversationText}

          请以JSON格式返回结果，格式如下：
          {
            "memories": [
              {
                "content": "记忆内容（简洁的一句话，不超过30个字）",
                "importance": 0.8,
                "category": "个人信息/兴趣爱好/情感状态/关系/计划/其他",
                "context": "记忆的上下文或来源（简短描述）"
              }
            ]
          }

          评分标准：
          - 重要性评分范围为0-1，越重要越接近1
          - 对用户长期特征的记忆（如个人信息、兴趣爱好）通常比临时状态更重要
          - 具体的信息比模糊的信息更重要
          - 用户主动分享的信息比推断出的信息更重要
          - 情感强烈的表达比中性表达更重要

          确保每条记忆都是：
          1. 准确的（直接来自对话，不要过度推断）
          2. 有用的（对未来对话有帮助）
          3. 简洁的（一句话表达清楚）
          4. 不重复的（与其他记忆内容不重叠）`
        }
      ],
      temperature: 0.2, // 降低温度以获得更一致的结果
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

    // 添加时间戳和额外元数据
    const timestamp = new Date();
    memories.forEach(memory => {
      memory.timestamp = timestamp;
      memory.created_at = timestamp.toISOString();
      memory.source = 'chat';

      // 确保重要性是有效的数值
      if (typeof memory.importance !== 'number' || isNaN(memory.importance)) {
        memory.importance = 0.5; // 默认中等重要性
      }

      // 限制重要性在0-1范围内
      memory.importance = Math.max(0, Math.min(1, memory.importance));
    });

    // 对记忆进行去重和排序
    memories = deduplicateMemories(memories);
    memories.sort((a, b) => b.importance - a.importance);

    return memories;
  } catch (error) {
    console.error('从对话中提取记忆失败:', error);
    throw error;
  }
}

// 从消息中提取用户信息
async function extractUserInfoFromMessages(messages) {
  // 如果消息少于3条，可能没有足够的信息
  if (!messages || messages.length < 3) {
    return null;
  }

  try {
    // 只考虑用户发送的消息
    const userMessages = messages.filter(msg => msg.sender_type === 'user');
    if (userMessages.length === 0) return null;

    // 合并用户消息内容
    const userContent = userMessages.map(msg => msg.content).join('\n');

    // 使用简单的规则提取可能的用户信息
    const nameMatch = userContent.match(/我叫([\u4e00-\u9fa5a-zA-Z]+)|我是([\u4e00-\u9fa5a-zA-Z]+)|我的名字是([\u4e00-\u9fa5a-zA-Z]+)/);
    const ageMatch = userContent.match(/我(\d+)岁|我今年(\d+)岁|我今年(\d+)|我(\d+)年|我(\d+)了/);
    const genderMatch = userContent.match(/我是(男生|女生|男孩|女孩|男人|女人|男的|女的)/);
    const jobMatch = userContent.match(/我是([\u4e00-\u9fa5a-zA-Z]+师|[\u4e00-\u9fa5a-zA-Z]+员|学生|老师|医生|工程师|程序员|设计师|律师|会计师|销售|经理|主管|老板|创业者|自由职业者)/);

    // 构建用户信息对象
    const userInfo = {};

    if (nameMatch) {
      userInfo.name = nameMatch[1] || nameMatch[2] || nameMatch[3];
    }

    if (ageMatch) {
      const age = parseInt(ageMatch[1] || ageMatch[2] || ageMatch[3] || ageMatch[4] || ageMatch[5]);
      if (!isNaN(age) && age > 0 && age < 120) {
        userInfo.age = age;
      }
    }

    if (genderMatch) {
      userInfo.gender = genderMatch[1];
    }

    if (jobMatch) {
      userInfo.occupation = jobMatch[1];
    }

    // 如果没有提取到任何信息，返回null
    if (Object.keys(userInfo).length === 0) {
      return null;
    }

    return userInfo;
  } catch (error) {
    console.error('提取用户信息失败:', error);
    return null;
  }
}

// 去除重复或高度相似的记忆
function deduplicateMemories(memories) {
  if (!memories || memories.length <= 1) {
    return memories;
  }

  const result = [];
  const contentSet = new Set();

  for (const memory of memories) {
    // 创建一个简化版本用于比较（去除标点和空格）
    const simplifiedContent = memory.content
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
      .toLowerCase();

    // 如果内容不重复，添加到结果中
    if (!contentSet.has(simplifiedContent)) {
      contentSet.add(simplifiedContent);
      result.push(memory);
    }
  }

  return result;
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
  // 如果记忆数量少于阈值，无需合并
  if (memories.length <= 5) {
    return memories;
  }

  try {
    // 首先尝试使用本地聚类算法对记忆进行分组
    const clusters = clusterMemoriesByCategory(memories);

    // 如果聚类成功且有多个聚类，处理每个聚类
    if (clusters && Object.keys(clusters).length > 1) {
      const mergedResults = [];

      // 对每个聚类单独处理
      for (const category in clusters) {
        const clusterMemories = clusters[category];

        // 如果聚类内记忆数量少，直接保留最重要的
        if (clusterMemories.length <= 2) {
          clusterMemories.sort((a, b) => b.importance - a.importance);
          mergedResults.push(clusterMemories[0]);
          continue;
        }

        // 对较大的聚类，使用AI合并
        const clusterMerged = await mergeCluster(clusterMemories, category);
        mergedResults.push(...clusterMerged);
      }

      // 如果合并后的结果数量合适，直接返回
      if (mergedResults.length >= 3 && mergedResults.length <= 7) {
        return mergedResults;
      }

      // 如果合并后的结果数量过多，按重要性排序并截取
      if (mergedResults.length > 7) {
        mergedResults.sort((a, b) => b.importance - a.importance);
        return mergedResults.slice(0, 7);
      }
    }

    // 如果本地聚类不理想，使用AI进行全局合并
    // 将记忆内容合并为文本，包含更多元数据
    const memoriesText = memories.map(memory => {
      const categoryInfo = memory.category ? `[${memory.category}] ` : '';
      const timeInfo = memory.timestamp ? `[${new Date(memory.timestamp).toLocaleDateString()}] ` : '';
      return `- ${categoryInfo}${timeInfo}${memory.content} (重要性: ${memory.importance.toFixed(2)})`;
    }).join('\n');

    // 调用智谱AI合并记忆，使用改进的提示词
    const result = await callZhipuAI({
      model: "glm-4-flash",
      messages: [
        {
          role: "system",
          content: `你是一个高级记忆整合专家，能够将多条相似或相关的记忆合并为更少的高质量记忆。
          你的任务是分析一组记忆，识别共同主题和重叠信息，然后创建更简洁、更全面的记忆摘要。
          合并后的记忆应该保留原始记忆中最重要的信息，同时减少冗余和重复。`
        },
        {
          role: "user",
          content: `请将以下记忆合并为4-6条更概括的高质量记忆，保留最重要和最有用的信息：

          ${memoriesText}

          合并规则：
          1. 识别相似主题的记忆并将它们组合成一条更全面的记忆
          2. 保留具体的细节和重要的事实，避免过度概括
          3. 优先保留高重要性的信息
          4. 确保不同类别的重要信息都有所保留
          5. 合并后的记忆应该简洁明了，每条不超过30个字

          请以JSON格式返回结果，格式如下：
          {
            "memories": [
              {
                "content": "合并后的记忆内容",
                "importance": 0.8,
                "category": "个人信息/兴趣爱好/情感状态/关系/计划/其他",
                "context": "这条记忆合并自哪些原始记忆（简短描述）"
              }
            ]
          }

          重要性评分范围为0-1，越重要越接近1。`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    // 解析JSON结果
    const responseContent = result.choices[0].message.content;
    let mergedMemories;

    try {
      mergedMemories = JSON.parse(responseContent).memories;
    } catch (parseError) {
      console.error('解析合并记忆JSON失败:', parseError);
      // 如果解析失败，使用本地合并算法
      return localMergeMemories(memories);
    }

    // 添加时间戳和元数据
    const timestamp = new Date();
    mergedMemories.forEach(memory => {
      memory.timestamp = timestamp;
      memory.created_at = timestamp.toISOString();
      memory.source = 'merged';

      // 确保重要性是有效的数值
      if (typeof memory.importance !== 'number' || isNaN(memory.importance)) {
        memory.importance = 0.5; // 默认中等重要性
      }

      // 限制重要性在0-1范围内
      memory.importance = Math.max(0, Math.min(1, memory.importance));
    });

    // 对合并后的记忆进行去重和排序
    const uniqueMergedMemories = deduplicateMemories(mergedMemories);
    uniqueMergedMemories.sort((a, b) => b.importance - a.importance);

    return uniqueMergedMemories;
  } catch (error) {
    console.error('合并记忆失败:', error);
    // 如果AI合并失败，使用本地合并算法
    return localMergeMemories(memories);
  }
}

// 按类别聚类记忆
function clusterMemoriesByCategory(memories) {
  if (!memories || memories.length === 0) {
    return null;
  }

  try {
    // 初始化聚类
    const clusters = {};

    // 首先按category字段分组
    memories.forEach(memory => {
      const category = memory.category || '未分类';
      if (!clusters[category]) {
        clusters[category] = [];
      }
      clusters[category].push(memory);
    });

    // 如果没有category字段或所有记忆都在同一类别，尝试使用关键词聚类
    if (Object.keys(clusters).length <= 1) {
      return clusterMemoriesByKeywords(memories);
    }

    return clusters;
  } catch (error) {
    console.error('按类别聚类记忆失败:', error);
    return null;
  }
}

// 使用关键词聚类记忆
function clusterMemoriesByKeywords(memories) {
  try {
    // 提取每条记忆的关键词
    const memoryKeywords = memories.map(memory => ({
      memory,
      keywords: extractKeywords(memory.content.toLowerCase())
    }));

    // 初始化聚类
    const clusters = {};
    let clusterCount = 0;

    // 为每条记忆找到最匹配的聚类
    memoryKeywords.forEach(({ memory, keywords }) => {
      let bestCluster = null;
      let bestScore = 0.3; // 最小相似度阈值

      // 计算与每个现有聚类的相似度
      for (const clusterId in clusters) {
        const clusterKeywords = clusters[clusterId].keywords;
        const commonKeywords = keywords.filter(word => clusterKeywords.includes(word));
        const similarity = commonKeywords.length / Math.sqrt(keywords.length * clusterKeywords.length);

        if (similarity > bestScore) {
          bestScore = similarity;
          bestCluster = clusterId;
        }
      }

      // 如果找到匹配的聚类，添加到该聚类
      if (bestCluster !== null) {
        clusters[bestCluster].memories.push(memory);
        // 更新聚类关键词（合并新记忆的关键词）
        clusters[bestCluster].keywords = [...new Set([...clusters[bestCluster].keywords, ...keywords])];
      } else {
        // 否则创建新聚类
        const newClusterId = `cluster_${clusterCount++}`;
        clusters[newClusterId] = {
          memories: [memory],
          keywords: keywords
        };
      }
    });

    // 转换为期望的格式
    const result = {};
    for (const clusterId in clusters) {
      result[clusterId] = clusters[clusterId].memories;
    }

    return result;
  } catch (error) {
    console.error('按关键词聚类记忆失败:', error);
    return null;
  }
}

// 合并单个聚类的记忆
async function mergeCluster(clusterMemories, category) {
  if (clusterMemories.length <= 2) {
    return clusterMemories;
  }

  try {
    // 将聚类内记忆合并为文本
    const memoriesText = clusterMemories.map(memory =>
      `- ${memory.content} (重要性: ${memory.importance.toFixed(2)})`
    ).join('\n');

    // 调用智谱AI合并聚类内记忆
    const result = await callZhipuAI({
      model: "glm-4-flash",
      messages: [
        {
          role: "system",
          content: "你是一个记忆整合专家，能够将相似主题的多条记忆合并为更少的高质量记忆。"
        },
        {
          role: "user",
          content: `请将以下关于"${category}"主题的记忆合并为1-2条更概括的记忆，保留最重要的信息：

          ${memoriesText}

          请以JSON格式返回结果，格式如下：
          {
            "memories": [
              {
                "content": "合并后的记忆内容（简洁的一句话，不超过30个字）",
                "importance": 0.8,
                "category": "${category}"
              }
            ]
          }

          重要性评分范围为0-1，越重要越接近1。`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    // 解析JSON结果
    const responseContent = result.choices[0].message.content;
    let mergedMemories;

    try {
      mergedMemories = JSON.parse(responseContent).memories;

      // 添加时间戳和元数据
      const timestamp = new Date();
      mergedMemories.forEach(memory => {
        memory.timestamp = timestamp;
        memory.created_at = timestamp.toISOString();
        memory.source = 'merged';
        memory.context = `合并自${category}类别的${clusterMemories.length}条记忆`;
      });

      return mergedMemories;
    } catch (parseError) {
      console.error(`解析聚类"${category}"合并记忆JSON失败:`, parseError);
      // 如果解析失败，返回聚类中最重要的记忆
      clusterMemories.sort((a, b) => b.importance - a.importance);
      return [clusterMemories[0]];
    }
  } catch (error) {
    console.error(`合并聚类"${category}"记忆失败:`, error);
    // 如果合并失败，返回聚类中最重要的记忆
    clusterMemories.sort((a, b) => b.importance - a.importance);
    return [clusterMemories[0]];
  }
}

// 本地合并记忆算法（当AI合并失败时的后备方案）
function localMergeMemories(memories) {
  try {
    // 按重要性排序
    memories.sort((a, b) => b.importance - a.importance);

    // 如果有类别信息，确保每个类别都有代表
    const categories = new Set(memories.filter(m => m.category).map(m => m.category));

    // 如果有多个类别，从每个类别选择最重要的记忆
    if (categories.size >= 2) {
      const result = [];

      // 从每个类别选择最重要的记忆
      categories.forEach(category => {
        const categoryMemories = memories.filter(m => m.category === category);
        if (categoryMemories.length > 0) {
          categoryMemories.sort((a, b) => b.importance - a.importance);
          result.push(categoryMemories[0]);
        }
      });

      // 如果结果不足5条，添加剩余最重要的记忆
      if (result.length < 5) {
        const remainingMemories = memories.filter(m => !result.includes(m));
        remainingMemories.sort((a, b) => b.importance - a.importance);
        result.push(...remainingMemories.slice(0, 5 - result.length));
      }

      return result;
    }

    // 如果没有类别信息或只有一个类别，直接返回最重要的5条
    return memories.slice(0, 5);
  } catch (error) {
    console.error('本地合并记忆失败:', error);
    // 最后的后备方案：简单地返回最重要的5条
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

    // 如果记忆数量少于或等于限制数量，直接按重要性排序返回所有记忆
    if (memories.length <= limit) {
      memories.sort((a, b) => b.importance - a.importance);
      return memories;
    }

    // 如果没有当前上下文，按重要性和时间排序返回
    if (!currentContext) {
      // 创建一个组合分数，考虑重要性和时间因素
      const scoredMemories = memories.map(memory => {
        // 计算时间衰减因子（越新的记忆分数越高）
        let timeScore = 0;
        if (memory.timestamp) {
          const age = Date.now() - new Date(memory.timestamp).getTime();
          const daysSinceCreation = age / (1000 * 60 * 60 * 24);
          // 使用指数衰减函数，30天后权重减半
          timeScore = Math.exp(-daysSinceCreation / 30);
        }

        // 计算最终分数（70%重要性 + 30%时间因素）
        const finalScore = (memory.importance * 0.7) + (timeScore * 0.3);

        return {
          ...memory,
          score: finalScore
        };
      });

      // 按组合分数排序
      scoredMemories.sort((a, b) => b.score - a.score);

      // 返回前limit条记忆，移除临时评分字段
      return scoredMemories.slice(0, limit).map(({ score, ...memory }) => memory);
    }

    // 预处理：使用本地过滤减少需要评估的记忆数量
    const preFilteredMemories = prefilterMemories(memories, currentContext, Math.min(20, memories.length));

    // 如果预过滤后的记忆数量小于等于限制数量，直接返回
    if (preFilteredMemories.length <= limit) {
      return preFilteredMemories;
    }

    // 如果有当前上下文，调用智谱AI计算相关性
    const result = await callZhipuAI({
      model: "glm-4-flash",
      messages: [
        {
          role: "system",
          content: `你是一个高级记忆检索专家，能够从多条记忆中找出与当前上下文最相关的记忆。
          你的任务是分析当前对话上下文，并从记忆库中检索最相关的记忆，这些记忆应该对当前对话有帮助。
          你应该考虑语义相关性、主题匹配度、情感一致性和时间相关性等多个因素。`
        },
        {
          role: "user",
          content: `请从以下记忆中选出与当前上下文最相关的${limit}条记忆，并按相关性从高到低排序。

          当前对话上下文：
          ${currentContext}

          记忆库（按索引编号）：
          ${preFilteredMemories.map((memory, index) => {
            // 构建更丰富的记忆描述，包括类别和时间信息
            let timeInfo = '';
            if (memory.timestamp) {
              const date = new Date(memory.timestamp);
              if (!isNaN(date.getTime())) {
                timeInfo = `[${date.toLocaleDateString()}] `;
              }
            }

            let categoryInfo = memory.category ? `[${memory.category}] ` : '';

            return `${index+1}. ${timeInfo}${categoryInfo}${memory.content} (重要性: ${memory.importance.toFixed(2)})`;
          }).join('\n')}

          评估标准：
          1. 语义相关性：记忆内容与当前对话主题的相关程度
          2. 信息价值：记忆能为当前对话提供的有用信息量
          3. 时间相关性：最近的记忆可能更相关，但如果旧记忆内容高度相关则优先考虑
          4. 情感一致性：记忆与当前对话情感基调的匹配度

          请以JSON格式返回结果，格式如下：
          {
            "relevant_memories": [
              {
                "index": 1,
                "relevance": 0.9,
                "reason": "简短说明为什么这条记忆相关（不超过15个字）"
              }
            ]
          }

          相关性评分范围为0-1，越相关越接近1。只返回索引、相关性评分和简短理由，不需要返回记忆内容。`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    // 解析JSON结果
    const responseContent = result.choices[0].message.content;
    let relevantIndices;

    try {
      relevantIndices = JSON.parse(responseContent).relevant_memories;
    } catch (parseError) {
      console.error('解析相关记忆JSON失败:', parseError);
      // 如果解析失败，返回预过滤的记忆
      return preFilteredMemories.slice(0, limit);
    }

    // 获取相关记忆
    const relevantMemories = relevantIndices
      .map(item => ({
        ...preFilteredMemories[item.index - 1],
        relevance: item.relevance,
        reason: item.reason || null
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    // 缓存检索结果（可选，用于性能优化）
    cacheRetrievalResult(roleId, currentContext, relevantMemories);

    return relevantMemories;
  } catch (error) {
    console.error('获取相关记忆失败:', error);

    // 如果AI调用失败，使用本地过滤算法
    try {
      const role = await db.collection('roles').doc(roleId).get();
      if (!role.data || !role.data.memories) {
        return [];
      }

      const memories = role.data.memories;
      return prefilterMemories(memories, currentContext, limit);
    } catch (fallbackError) {
      console.error('本地过滤记忆也失败:', fallbackError);

      // 最后的后备方案：按重要性返回
      const role = await db.collection('roles').doc(roleId).get();
      if (!role.data || !role.data.memories) {
        return [];
      }

      const memories = role.data.memories;
      memories.sort((a, b) => b.importance - a.importance);
      return memories.slice(0, limit);
    }
  }
}

// 本地预过滤记忆
function prefilterMemories(memories, context, limit) {
  if (!context || !memories || memories.length === 0) {
    return [];
  }

  try {
    // 将上下文转换为小写并分词（简单实现）
    const contextWords = extractKeywords(context.toLowerCase());

    // 为每条记忆计算一个简单的相关性分数
    const scoredMemories = memories.map(memory => {
      // 提取记忆内容的关键词
      const memoryWords = extractKeywords(memory.content.toLowerCase());

      // 计算关键词匹配数
      const matchCount = memoryWords.filter(word => contextWords.includes(word)).length;

      // 计算基于关键词的相关性分数
      let keywordScore = 0;
      if (memoryWords.length > 0) {
        keywordScore = matchCount / Math.sqrt(memoryWords.length);
      }

      // 考虑记忆的重要性
      const importanceScore = memory.importance || 0.5;

      // 考虑时间因素（如果有）
      let recencyScore = 0.5; // 默认中等时间分数
      if (memory.timestamp) {
        const age = Date.now() - new Date(memory.timestamp).getTime();
        const daysSinceCreation = age / (1000 * 60 * 60 * 24);
        // 使用指数衰减函数，30天后权重减半
        recencyScore = Math.exp(-daysSinceCreation / 30);
      }

      // 计算最终分数（50%关键词匹配 + 30%重要性 + 20%时间因素）
      const finalScore = (keywordScore * 0.5) + (importanceScore * 0.3) + (recencyScore * 0.2);

      return {
        ...memory,
        score: finalScore
      };
    });

    // 按分数排序
    scoredMemories.sort((a, b) => b.score - a.score);

    // 返回前limit条记忆，移除临时评分字段
    return scoredMemories.slice(0, limit).map(({ score, ...memory }) => memory);
  } catch (error) {
    console.error('预过滤记忆失败:', error);
    // 如果预过滤失败，按重要性返回
    memories.sort((a, b) => b.importance - a.importance);
    return memories.slice(0, limit);
  }
}

// 提取文本中的关键词（简单实现）
function extractKeywords(text) {
  if (!text) return [];

  // 中文停用词
  const stopWords = ['的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都',
                    '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会',
                    '着', '没有', '看', '好', '自己', '这', '那', '这个', '那个', '这样',
                    '那样', '以', '以及', '以后', '可以', '可能', '而', '但是', '但', '吧'];

  // 简单分词（按空格和标点符号分割）
  const words = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
                   .split(/\s+/)
                   .filter(word => word.length > 0 && !stopWords.includes(word));

  return [...new Set(words)]; // 去重
}

// 缓存检索结果（可选，用于性能优化）
function cacheRetrievalResult(roleId, context, memories) {
  // 这里可以实现缓存逻辑，例如将结果存储在内存或数据库中
  // 为了简化，这里只是一个占位函数
  return;
}

// 导出函数
module.exports = {
  extractMemoriesFromChat,
  updateRoleMemories,
  getRelevantMemories,
  mergeMemories,
  // 导出辅助函数，以便其他模块可以使用
  deduplicateMemories,
  extractKeywords
};
