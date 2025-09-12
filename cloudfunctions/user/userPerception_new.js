// 用户画像处理模块 - 使用智谱AI优化版
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

/**
 * 调用智谱AI接口
 * @param {Object} params 请求参数
 * @returns {Promise<Object>} 智谱AI响应结果
 */
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

/**
 * 获取用户画像
 * @param {string} userId 用户ID
 * @returns {Promise<Object>} 用户画像数据
 */
async function getUserPerception(userId) {
  try {
    console.log(`开始获取用户画像, 用户ID: ${userId}`);

    // 查询用户兴趣数据
    const userInterests = await db.collection('userInterests')
      .where({ user_id: userId })
      .get();

    console.log(`获取到用户兴趣数据: ${userInterests.data.length}条`);

    // 查询用户情绪记录
    const emotionRecords = await db.collection('emotionRecords')
      .where({ userId: userId })
      .orderBy('createTime', 'desc')
      .limit(20)
      .get();

    // 查询用户对话记录
    const chatMessages = await db.collection('messages')
      .where({
        userId: userId,
        sender_type: 'user'  // 只获取用户发送的消息
      })
      .orderBy('timestamp', 'desc')
      .limit(50)  // 获取最近50条消息
      .get();

    console.log(`获取到用户对话记录: ${chatMessages.data.length}条`);

    // 处理用户兴趣数据
    let interests = [];
    let interestVector = [];

    if (userInterests.data && userInterests.data.length > 0) {
      // 处理keywords字段，如果存在
      if (userInterests.data[0].keywords && Array.isArray(userInterests.data[0].keywords)) {
        interests = userInterests.data[0].keywords.map(keyword => {
          // 如果是字符串，直接返回
          if (typeof keyword === 'string') {
            return keyword;
          }
          // 如果是对象，尝试获取关键字或标签
          else if (typeof keyword === 'object') {
            return keyword.keyword || keyword.tag || keyword.value || '';
          }
          return '';
        }).filter(keyword => keyword !== '');
      }
      // 兼容旧版数据结构
      else if (userInterests.data[0].interests && Array.isArray(userInterests.data[0].interests)) {
        interests = userInterests.data[0].interests;
      }

      console.log('处理后的用户兴趣:', interests);

      // 尝试获取兴趣向量，如果存在
      interestVector = userInterests.data[0].aggregated_interest_vector || [];
    }

    // 处理用户情绪数据
    const emotionPatterns = processEmotionRecords(emotionRecords.data || []);

    // 尝试使用智谱AI分析用户对话
    let aiPersonalityTraits = [];
    let aiPersonalitySummary = '';
    let aiUserPerception = null;

    try {
      if (chatMessages.data && chatMessages.data.length > 0) {
        // 分析用户对话内容
        aiUserPerception = await analyzeUserDialogues(chatMessages.data);
        console.log('智谱AI分析结果:', aiUserPerception);

        // 转换AI分析结果为个性特征数据
        aiPersonalityTraits = convertToPersonalityTraits(aiUserPerception);

        // 生成个性总结
        aiPersonalitySummary = await generateAIPersonalitySummary(aiUserPerception);
      }
    } catch (aiError) {
      console.error('智谱AI分析失败，将使用备选方法:', aiError);
    }

    // 如果AI分析失败，使用备选方法
    const personalityTraits = aiPersonalityTraits.length > 0 ?
      aiPersonalityTraits :
      generatePersonalityTraits(interests, emotionPatterns);

    const personalitySummary = aiPersonalitySummary ?
      aiPersonalitySummary :
      generatePersonalitySummary(personalityTraits);

    // 合并AI分析结果和传统分析结果
    const result = {
      interests: interests.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object') return item.tag || item.keyword || item.value || '';
        return '';
      }).filter(item => item !== ''),
      personalityTraits,
      personalitySummary,
      emotionPatterns
    };

    console.log('最终用户画像数据:', JSON.stringify(result));

    // 如果有AI分析结果，添加到返回数据中
    if (aiUserPerception) {
      result.aiPerception = {
        interests: aiUserPerception.interests || [],
        preferences: aiUserPerception.preferences || [],
        communication_style: aiUserPerception.communication_style || '',
        emotional_patterns: aiUserPerception.emotional_patterns || []
      };
    }

    return result;
  } catch (error) {
    console.error('获取用户画像失败:', error);
    throw error;
  }
}

/**
 * 分析用户对话内容
 * @param {Array} messages 用户消息记录
 * @returns {Promise<Object>} 用户画像分析结果
 */
async function analyzeUserDialogues(messages) {
  try {
    // 提取用户消息文本
    const userText = messages.map(msg => msg.content || '').join('\n');

    if (!userText.trim()) {
      throw new Error('没有足够的用户消息进行分析');
    }

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
    console.error('分析用户对话失败:', error);
    throw error;
  }
}

/**
 * 将AI分析结果转换为个性特征数据
 * @param {Object} aiPerception AI分析的用户画像
 * @returns {Array} 个性特征数据
 */
function convertToPersonalityTraits(aiPerception) {
  if (!aiPerception) return [];

  // 特征映射表
  const traitMappings = {
    // 沟通风格相关特征
    '直接': { trait: '直接表达', score: 0.8 },
    '委婉': { trait: '委婉表达', score: 0.8 },
    '详细': { trait: '细节关注', score: 0.7 },
    '简洁': { trait: '简洁表达', score: 0.7 },
    '正式': { trait: '正式表达', score: 0.6 },
    '非正式': { trait: '随意表达', score: 0.7 },
    '礼貌': { trait: '礼貌性', score: 0.8 },
    '幽默': { trait: '幽默感', score: 0.8 },

    // 情感模式相关特征
    '情绪稳定': { trait: '情绪稳定性', score: 0.8 },
    '情绪波动': { trait: '情绪敏感性', score: 0.7 },
    '积极': { trait: '乐观性', score: 0.8 },
    '消极': { trait: '悲观性', score: 0.7 },
    '理性': { trait: '理性思考', score: 0.8 },
    '感性': { trait: '感性思考', score: 0.8 },
    '共情': { trait: '同理心', score: 0.9 },
    '自我': { trait: '自我关注', score: 0.7 },

    // 兴趣和偏好相关特征
    '艺术': { trait: '创造力', score: 0.8 },
    '音乐': { trait: '艺术鉴赏', score: 0.7 },
    '阅读': { trait: '求知欲', score: 0.8 },
    '学习': { trait: '学习能力', score: 0.8 },
    '科技': { trait: '技术思维', score: 0.7 },
    '旅行': { trait: '冒险精神', score: 0.7 },
    '社交': { trait: '社交性', score: 0.8 },
    '独处': { trait: '独立性', score: 0.7 },
    '运动': { trait: '活力', score: 0.7 },
    '美食': { trait: '感官享受', score: 0.6 },
    '工作': { trait: '责任感', score: 0.8 },
    '家庭': { trait: '亲和力', score: 0.8 }
  };

  // 提取所有关键词
  const allKeywords = [
    ...(aiPerception.interests || []),
    ...(aiPerception.preferences || []),
    ...(aiPerception.emotional_patterns || [])
  ];

  // 提取沟通风格关键词
  const communicationStyle = aiPerception.communication_style || '';
  const communicationKeywords = Object.keys(traitMappings).filter(
    keyword => communicationStyle.includes(keyword)
  );

  // 合并所有关键词
  const allRelevantKeywords = [...allKeywords, ...communicationKeywords];

  // 映射到特征
  const traitsMap = new Map();

  allRelevantKeywords.forEach(keyword => {
    // 查找完全匹配
    if (traitMappings[keyword]) {
      const { trait, score } = traitMappings[keyword];
      if (!traitsMap.has(trait) || traitsMap.get(trait) < score) {
        traitsMap.set(trait, score);
      }
      return;
    }

    // 查找部分匹配
    for (const [key, value] of Object.entries(traitMappings)) {
      if (keyword.includes(key) || key.includes(keyword)) {
        const { trait, score } = value;
        // 部分匹配的分数略低
        const adjustedScore = score * 0.9;
        if (!traitsMap.has(trait) || traitsMap.get(trait) < adjustedScore) {
          traitsMap.set(trait, adjustedScore);
        }
        break;
      }
    }
  });

  // 添加默认特征
  const defaultTraits = [
    { trait: '责任感', score: 0.7 },
    { trait: '同理心', score: 0.7 },
    { trait: '创造力', score: 0.6 },
    { trait: '社交性', score: 0.6 },
    { trait: '冒险精神', score: 0.5 }
  ];

  defaultTraits.forEach(({ trait, score }) => {
    if (!traitsMap.has(trait)) {
      traitsMap.set(trait, score);
    }
  });

  // 转换为数组
  return Array.from(traitsMap.entries()).map(([trait, score]) => ({
    trait,
    score
  }));
}

/**
 * 使用智谱AI生成个性总结
 * @param {Object} userPerception 用户画像数据
 * @returns {Promise<string>} 个性总结
 */
async function generateAIPersonalitySummary(userPerception) {
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

/**
 * 处理情绪记录数据
 * @param {Array} records 情绪记录数据
 * @returns {Object} 处理后的情绪模式
 */
function processEmotionRecords(records) {
  // 情绪类型计数
  const emotionCounts = {};
  let totalRecords = records.length;

  // 统计各情绪类型出现次数
  records.forEach(record => {
    const mainEmotion = record.mainEmotion || '未知';
    emotionCounts[mainEmotion] = (emotionCounts[mainEmotion] || 0) + 1;

    // 处理次要情绪
    if (record.emotions && Array.isArray(record.emotions)) {
      record.emotions.forEach(emotion => {
        if (emotion.emotion && emotion.emotion !== mainEmotion) {
          emotionCounts[emotion.emotion] = (emotionCounts[emotion.emotion] || 0) + 0.5;
        }
      });
    }
  });

  // 转换为百分比
  const emotionPercentages = {};
  if (totalRecords > 0) {
    Object.keys(emotionCounts).forEach(emotion => {
      emotionPercentages[emotion] = (emotionCounts[emotion] / totalRecords) * 100;
    });
  }

  // 情绪变化趋势
  const emotionTrends = {};
  if (records.length >= 5) {
    // 分析最近5条记录的情绪变化
    const recentRecords = records.slice(0, 5);
    const emotionSequence = recentRecords.map(record => record.mainEmotion);

    // 简单趋势分析
    const positiveEmotions = ['快乐', '满足', '平静', '期待'];
    const negativeEmotions = ['焦虑', '压力', '疲惫', '担忧', '愤怒', '悲伤'];

    let positiveCount = 0;
    let negativeCount = 0;

    emotionSequence.forEach(emotion => {
      if (positiveEmotions.includes(emotion)) {
        positiveCount++;
      } else if (negativeEmotions.includes(emotion)) {
        negativeCount++;
      }
    });

    if (positiveCount > negativeCount) {
      emotionTrends.trend = '积极上升';
    } else if (positiveCount < negativeCount) {
      emotionTrends.trend = '消极下降';
    } else {
      emotionTrends.trend = '情绪波动';
    }
  } else {
    emotionTrends.trend = '数据不足';
  }

  return {
    emotionPercentages,
    emotionTrends,
    dominantEmotions: getDominantEmotions(emotionPercentages)
  };
}

/**
 * 获取主导情绪
 * @param {Object} emotionPercentages 情绪百分比
 * @returns {Array} 主导情绪列表
 */
function getDominantEmotions(emotionPercentages) {
  // 将情绪按百分比排序
  const sortedEmotions = Object.entries(emotionPercentages)
    .sort((a, b) => b[1] - a[1])
    .filter(([emotion, percentage]) => percentage > 10); // 只保留占比超过10%的情绪

  return sortedEmotions.map(([emotion, percentage]) => ({
    emotion,
    percentage
  }));
}

/**
 * 生成个性特征数据 (备选方法)
 * @param {Array} interests 用户兴趣
 * @param {Object} emotionPatterns 情绪模式
 * @returns {Array} 个性特征数据
 */
function generatePersonalityTraits(interests, emotionPatterns) {
  // 基于兴趣和情绪模式生成个性特征
  const traits = [
    { trait: '责任感', score: 0.7 },
    { trait: '完美主义', score: 0.6 },
    { trait: '同理心', score: 0.8 },
    { trait: '创造力', score: 0.65 },
    { trait: '社交性', score: 0.5 },
    { trait: '冒险精神', score: 0.4 },
    { trait: '耐心', score: 0.6 }
  ];

  // 根据兴趣调整特征分数
  interests.forEach(interest => {
    // 获取兴趣标签，兼容不同的数据结构
    let tag = '';
    if (typeof interest === 'string') {
      tag = interest;
    } else if (typeof interest === 'object') {
      tag = interest.tag || interest.keyword || interest.value || '';
    }

    if (!tag) return; // 跳过空标签

    console.log(`处理兴趣标签: ${tag}`);

    // 根据兴趣标签调整特征分数
    switch (tag.toLowerCase()) {
      case '艺术':
      case '音乐':
      case '绘画':
      case '创作':
        traits.find(t => t.trait === '创造力').score += 0.1;
        break;
      case '旅行':
      case '探险':
      case '户外':
        traits.find(t => t.trait === '冒险精神').score += 0.1;
        break;
      case '阅读':
      case '学习':
      case '科学':
        traits.find(t => t.trait === '责任感').score += 0.05;
        break;
      case '社交':
      case '派对':
      case '聚会':
        traits.find(t => t.trait === '社交性').score += 0.1;
        break;
    }
  });

  // 根据情绪模式调整特征分数
  if (emotionPatterns.dominantEmotions.length > 0) {
    emotionPatterns.dominantEmotions.forEach(({ emotion, percentage }) => {
      switch (emotion) {
        case '焦虑':
          traits.find(t => t.trait === '完美主义').score += 0.05;
          break;
        case '平静':
          traits.find(t => t.trait === '耐心').score += 0.05;
          break;
        case '快乐':
          traits.find(t => t.trait === '社交性').score += 0.05;
          break;
        case '同情':
          traits.find(t => t.trait === '同理心').score += 0.1;
          break;
      }
    });
  }

  // 确保分数在0-1范围内
  traits.forEach(trait => {
    trait.score = Math.min(Math.max(trait.score, 0), 1);
  });

  return traits;
}

/**
 * 生成个性总结 (备选方法)
 * @param {Array} traits 个性特征
 * @returns {string} 个性总结
 */
function generatePersonalitySummary(traits) {
  // 获取得分最高的三个特征
  const topTraits = [...traits]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // 生成总结文本
  return `根据你的对话内容和情绪反应，我们分析出你是一个${topTraits[0].trait}强、具有${topTraits[1].trait}的人，同时也展现出较高的${topTraits[2].trait}。`;
}

module.exports = {
  getUserPerception,
  analyzeUserDialogues,
  generateAIPersonalitySummary
};
