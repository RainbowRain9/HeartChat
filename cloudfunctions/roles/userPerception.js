// 用户画像模块
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

// 从对话中分析用户画像
async function analyzeUserPerception(messages, userId, roleId) {
  try {
    // 获取用户消息
    const userMessages = messages.filter(msg => msg.sender_type === 'user');
    if (userMessages.length === 0) {
      throw new Error('没有足够的用户消息进行分析');
    }

    const userText = userMessages.map(msg => msg.content).join('\n');

    // 调用智谱AI分析用户画像
    const result = await callZhipuAI({
      model: "glm-4.5-flash",
      messages: [
        {
          role: "system",
          content: "你是一个用户画像分析专家，能够从用户的对话中提取用户的兴趣、偏好、沟通风格和情感模式。"
        },
        {
          role: "user",
          content: `请分析以下用户消息，提取用户的兴趣、偏好、沟通风格和情感模式：

          ${userText}

          请以JSON格式返回结果，格式如下：
          {
            "interests": ["兴趣1", "兴趣2"],
            "preferences": ["偏好1", "偏好2"],
            "communication_style": "用户的沟通风格描述",
            "emotional_patterns": ["情感模式1", "情感模式2"]
          }

          注意：
          1. 兴趣指用户喜欢的活动、话题或领域
          2. 偏好指用户在选择或决策中表现出的倾向
          3. 沟通风格指用户表达自己的方式和语言特点
          4. 情感模式指用户表达情感的方式和情绪变化规律`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    // 解析JSON结果
    const responseContent = result.choices[0].message.content;
    let userPerception;

    try {
      userPerception = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('解析用户画像JSON失败:', parseError);
      // 尝试使用正则表达式提取JSON部分
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          userPerception = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('二次解析用户画像JSON失败:', e);
          throw new Error('无法解析AI返回的用户画像数据');
        }
      } else {
        throw new Error('无法解析AI返回的用户画像数据');
      }
    }

    return userPerception;
  } catch (error) {
    console.error('分析用户画像失败:', error);
    throw error;
  }
}

// 更新角色的用户画像
async function updateRoleUserPerception(roleId, userId, newPerception) {
  try {
    // 获取角色当前的用户画像
    const role = await db.collection('roles').doc(roleId).get();
    if (!role.data) {
      throw new Error('角色不存在');
    }

    // 获取现有用户画像
    const existingPerception = role.data.user_perception || {
      interests: [],
      preferences: [],
      communication_style: '',
      emotional_patterns: []
    };

    // 合并新旧用户画像
    const mergedPerception = await mergeUserPerception(existingPerception, newPerception);

    // 更新角色的用户画像
    await db.collection('roles').doc(roleId).update({
      data: {
        user_perception: mergedPerception,
        updateTime: db.serverDate()
      }
    });

    return mergedPerception;
  } catch (error) {
    console.error('更新角色的用户画像失败:', error);
    throw error;
  }
}

// 合并用户画像
async function mergeUserPerception(existingPerception, newPerception) {
  try {
    // 将现有和新的用户画像转换为文本
    const existingText = `
      现有兴趣: ${Array.isArray(existingPerception.interests) ? existingPerception.interests.join(', ') : '无'}
      现有偏好: ${Array.isArray(existingPerception.preferences) ? existingPerception.preferences.join(', ') : '无'}
      现有沟通风格: ${existingPerception.communication_style || '无'}
      现有情感模式: ${Array.isArray(existingPerception.emotional_patterns) ? existingPerception.emotional_patterns.join(', ') : '无'}
    `;

    const newText = `
      新兴趣: ${Array.isArray(newPerception.interests) ? newPerception.interests.join(', ') : '无'}
      新偏好: ${Array.isArray(newPerception.preferences) ? newPerception.preferences.join(', ') : '无'}
      新沟通风格: ${newPerception.communication_style || '无'}
      新情感模式: ${Array.isArray(newPerception.emotional_patterns) ? newPerception.emotional_patterns.join(', ') : '无'}
    `;

    // 调用智谱AI合并用户画像
    const result = await callZhipuAI({
      model: "glm-4.5-flash",
      messages: [
        {
          role: "system",
          content: "你是一个用户画像整合专家，能够将新旧用户画像合并为更完整的用户画像。"
        },
        {
          role: "user",
          content: `请将以下现有用户画像和新的用户画像合并为一个更完整的用户画像：

          ${existingText}

          ${newText}

          请以JSON格式返回结果，格式如下：
          {
            "interests": ["兴趣1", "兴趣2"],
            "preferences": ["偏好1", "偏好2"],
            "communication_style": "用户的沟通风格描述",
            "emotional_patterns": ["情感模式1", "情感模式2"]
          }

          合并规则：
          1. 保留所有不重复的兴趣和偏好
          2. 如果新旧信息有冲突，优先保留新信息
          3. 对于沟通风格和情感模式，进行综合描述
          4. 每个类别最多保留5个最重要的项目`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    // 解析JSON结果
    const responseContent = result.choices[0].message.content;
    let mergedPerception;

    try {
      mergedPerception = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('解析合并用户画像JSON失败:', parseError);
      // 如果解析失败，手动合并
      return {
        interests: [...new Set([...existingPerception.interests || [], ...newPerception.interests || []])].slice(0, 5),
        preferences: [...new Set([...existingPerception.preferences || [], ...newPerception.preferences || []])].slice(0, 5),
        communication_style: newPerception.communication_style || existingPerception.communication_style || '',
        emotional_patterns: [...new Set([...existingPerception.emotional_patterns || [], ...newPerception.emotional_patterns || []])].slice(0, 5)
      };
    }

    return mergedPerception;
  } catch (error) {
    console.error('合并用户画像失败:', error);
    // 如果合并失败，手动合并
    return {
      interests: [...new Set([...existingPerception.interests || [], ...newPerception.interests || []])].slice(0, 5),
      preferences: [...new Set([...existingPerception.preferences || [], ...newPerception.preferences || []])].slice(0, 5),
      communication_style: newPerception.communication_style || existingPerception.communication_style || '',
      emotional_patterns: [...new Set([...existingPerception.emotional_patterns || [], ...newPerception.emotional_patterns || []])].slice(0, 5)
    };
  }
}

// 生成用户画像摘要
async function generateUserPerceptionSummary(userPerception) {
  if (!userPerception) {
    return '';
  }

  try {
    // 构建用户画像文本
    const userPerceptionText = `
      用户兴趣: ${Array.isArray(userPerception.interests) ? userPerception.interests.join(', ') : '未知'}
      用户偏好: ${Array.isArray(userPerception.preferences) ? userPerception.preferences.join(', ') : '未知'}
      用户沟通风格: ${userPerception.communication_style || '未知'}
      用户情感模式: ${Array.isArray(userPerception.emotional_patterns) ? userPerception.emotional_patterns.join(', ') : '未知'}
    `;

    // 调用智谱AI生成用户画像摘要
    const result = await callZhipuAI({
      model: "glm-4.5-flash",
      messages: [
        {
          role: "system",
          content: "你是一个用户画像分析专家，能够将用户画像转化为自然、友好的描述。"
        },
        {
          role: "user",
          content: `请将以下用户画像转化为一段自然、友好的描述，可以在对话中自然地提及：

          ${userPerceptionText}

          要求：
          1. 描述应该自然、友好，不要像机器分析报告
          2. 长度控制在100-150字之间
          3. 可以加入一些温暖的建议或鼓励
          4. 不要使用"根据我的分析"、"我注意到"等明显的分析语言`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    // 返回生成的摘要
    return result.choices[0].message.content;
  } catch (error) {
    console.error('生成用户画像摘要失败:', error);
    return '';
  }
}

// 导出函数
module.exports = {
  analyzeUserPerception,
  updateRoleUserPerception,
  generateUserPerceptionSummary
};
