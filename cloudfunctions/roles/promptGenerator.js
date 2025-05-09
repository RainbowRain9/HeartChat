// 提示词生成模块
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

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

// 生成基础角色提示词
async function generateBasePrompt(roleInfo) {
  try {
    // 构建角色描述
    const roleDescription = `
      角色名称：${roleInfo.name}
      与用户关系：${roleInfo.relationship || '无特定关系'}
      年龄：${roleInfo.age || '未指定'}
      性别：${roleInfo.gender || '未指定'}
      背景故事：${roleInfo.background || '无特定背景'}
      教育背景：${roleInfo.education || '未指定'}
      职业：${roleInfo.occupation || '未指定'}
      爱好：${Array.isArray(roleInfo.hobbies) ? roleInfo.hobbies.join(', ') : (roleInfo.hobbies || '无特定爱好')}
      性格特点：${Array.isArray(roleInfo.personality_traits) ? roleInfo.personality_traits.join(', ') : (roleInfo.personality_traits || '无特定性格特点')}
      说话方式：${roleInfo.communication_style || '自然的说话方式'}
      情感倾向：${roleInfo.emotional_tendency || '平衡的情感表达'}
    `;

    // 调用智谱AI生成提示词
    const result = await callZhipuAI({
      model: "glm-4",
      messages: [
        {
          role: "system",
          content: "你是一个角色提示词生成专家，能够根据用户提供的角色信息生成高质量的角色扮演提示词。"
        },
        {
          role: "user",
          content: `请根据以下角色信息生成一个详细的角色扮演提示词：

          ${roleDescription}

          提示词应包含：
          1. 角色的自我认知和身份定位
          2. 与用户的关系定位和互动方式
          3. 说话风格、语气和表达方式的具体指导
          4. 应该避免的行为和表达
          5. 如何根据角色特点回应用户的情感需求（如何安慰、鼓励或适当批评用户）
          6. 如何自然地了解用户的兴趣和偏好
          7. 对话风格指导：
             - 使用非常简短的对话方式，尽量模仿真实手机聊天
             - 每条消息不超过1-2句话，尽量保持简洁
             - 将长回复拆分成多条非常短小的消息，就像真实人类在聊天软件中发消息一样
             - 避免使用长句和复杂句式，使用简单直接的表达
             - 当需要表达复杂想法时，将内容分成多个非常简短的消息，每条消息只表达一个简单观点

          8. 格式要求：
             - 绝对不要使用Markdown语法，如双星号加粗、单星号斜体、反引号代码等
             - 不要使用标题格式如#或##
             - 列表项直接使用数字或文字开头，不要使用特殊符号如-或*
             - 当需要列举多个要点时，直接使用“1.”“2.”等编号，不要使用特殊格式
             - 尽量使用简单的纯文本格式，就像在手机聊天软件中发送消息一样

          请直接给出提示词内容，不要包含解释。提示词应该简洁有效，不超过800字。`
        }
      ],
      temperature: 0.7,
      top_p: 0.8,
      max_tokens: 2000
    });

    // 返回生成的提示词
    return result.choices[0].message.content;
  } catch (error) {
    console.error('生成基础角色提示词失败:', error);
    throw error;
  }
}

// 生成带记忆的提示词
async function generatePromptWithMemories(basePrompt, memories) {
  if (!memories || memories.length === 0) {
    return basePrompt;
  }

  try {
    // 按类别和重要性组织记忆
    const organizedMemories = organizeMemoriesByCategory(memories);

    // 构建更结构化的记忆描述
    let memoriesText = '';

    // 遍历每个类别
    for (const category in organizedMemories) {
      // 添加类别标题
      memoriesText += `【${category}】\n`;

      // 添加该类别下的记忆
      organizedMemories[category].forEach(memory => {
        // 添加记忆内容，包括上下文（如果有）
        const contextInfo = memory.context ? ` (来源: ${memory.context})` : '';
        memoriesText += `- ${memory.content}${contextInfo}\n`;
      });

      // 类别之间添加空行
      memoriesText += '\n';
    }

    // 调用智谱AI融合提示词和记忆，使用改进的提示词
    const result = await callZhipuAI({
      model: "glm-4-flash",
      messages: [
        {
          role: "system",
          content: `你是一个高级提示词优化专家，能够将角色记忆自然地融入到角色提示词中。
          你的任务是分析角色记忆，识别其中的关键信息，并将这些信息无缝地整合到角色提示词中，
          使角色能够在对话中自然地展现出对这些记忆的了解，而不是生硬地列举事实。
          记忆应该影响角色的行为、态度和回应方式，使角色表现得更加个性化和连贯。`
        },
        {
          role: "user",
          content: `我有一个角色的基础提示词和一组该角色关于用户的记忆。请将这些记忆自然地融入到提示词中，使角色能够在对话中展现出对用户的了解。

          基础提示词：
          ${basePrompt}

          角色记忆（按类别组织）：
          ${memoriesText}

          融合要求：
          1. 不要简单地在提示词末尾添加记忆列表，而是将记忆内容自然地融入到提示词的相关部分
          2. 根据记忆调整角色的行为指导，例如"当用户提到X时，你应该记得Y并做出相应回应"
          3. 保持提示词的整体风格和语调一致，不要有明显的拼接痕迹
          4. 确保所有重要记忆都被融入，但可以合并或重新表述相似的记忆
          5. 添加指导，使角色能够在适当的时机自然地提及这些记忆，而不是生硬地列举
          6. 记忆应该影响角色的个性和互动方式，使其更加个性化
          7. 保持提示词的简洁性，不要因为融入记忆而使提示词变得冗长

          请给出融合了记忆的完整提示词。不要添加额外的解释，直接给出结果。`
        }
      ],
      temperature: 0.3, // 降低温度以获得更一致的结果
      max_tokens: 2000
    });

    // 返回融合了记忆的提示词
    return result.choices[0].message.content;
  } catch (error) {
    console.error('生成带记忆的提示词失败:', error);

    // 如果AI调用失败，尝试使用本地方法融合记忆
    try {
      return localMergeMemoriesWithPrompt(basePrompt, memories);
    } catch (fallbackError) {
      console.error('本地融合记忆也失败:', fallbackError);
      // 如果本地方法也失败，返回基础提示词
      return basePrompt;
    }
  }
}

// 按类别组织记忆
function organizeMemoriesByCategory(memories) {
  // 初始化结果对象
  const result = {};

  // 遍历所有记忆
  memories.forEach(memory => {
    // 获取记忆类别，如果没有则归为"其他"
    const category = memory.category || '其他信息';

    // 如果该类别不存在，创建一个空数组
    if (!result[category]) {
      result[category] = [];
    }

    // 将记忆添加到对应类别
    result[category].push(memory);
  });

  // 对每个类别内的记忆按重要性排序
  for (const category in result) {
    result[category].sort((a, b) => b.importance - a.importance);
  }

  return result;
}

// 本地方法融合记忆和提示词（当AI调用失败时的后备方案）
function localMergeMemoriesWithPrompt(basePrompt, memories) {
  if (!memories || memories.length === 0) {
    return basePrompt;
  }

  try {
    // 按重要性排序记忆
    memories.sort((a, b) => b.importance - a.importance);

    // 构建记忆部分
    const memorySection = `

关于用户的重要信息：
${memories.map(memory => `- ${memory.content}`).join('\n')}

请在对话中自然地运用这些信息，使对话更加个性化，但不要直接列举这些事实。根据上下文适当地展示你记得用户的信息。`;

    // 将记忆部分添加到提示词末尾
    return basePrompt + memorySection;
  } catch (error) {
    console.error('本地融合记忆失败:', error);
    return basePrompt;
  }
}

// 生成带用户画像的提示词
async function generatePromptWithUserPerception(basePrompt, userPerception) {
  if (!userPerception) {
    return basePrompt;
  }

  try {
    // 构建用户画像描述
    const userPerceptionText = `
      用户兴趣: ${Array.isArray(userPerception.interests) ? userPerception.interests.join(', ') : '未知'}
      用户偏好: ${Array.isArray(userPerception.preferences) ? userPerception.preferences.join(', ') : '未知'}
      用户沟通风格: ${userPerception.communication_style || '未知'}
      用户情感模式: ${Array.isArray(userPerception.emotional_patterns) ? userPerception.emotional_patterns.join(', ') : '未知'}
    `;

    // 调用智谱AI融合提示词和用户画像
    const result = await callZhipuAI({
      model: "glm-4-flash",
      messages: [
        {
          role: "system",
          content: "你是一个提示词优化专家，能够将用户画像融入到角色提示词中。"
        },
        {
          role: "user",
          content: `我有一个角色的提示词和一些关于用户的信息。请将用户信息自然地融入到提示词中，使角色能够根据用户的兴趣、偏好和沟通风格进行互动。

          提示词：
          ${basePrompt}

          用户信息：
          ${userPerceptionText}

          请给出融合了用户信息的完整提示词。不要添加额外的解释，直接给出结果。`
        }
      ],
      temperature: 0.5,
      max_tokens: 2000
    });

    // 返回融合了用户画像的提示词
    return result.choices[0].message.content;
  } catch (error) {
    console.error('生成带用户画像的提示词失败:', error);
    // 如果失败，返回原始提示词
    return basePrompt;
  }
}

// 导出函数
module.exports = {
  generateBasePrompt,
  generatePromptWithMemories,
  generatePromptWithUserPerception
};
