/**
 * 关键词情感关联模块
 * 用于将关键词与情感分析结果关联起来
 */

const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 获取数据库引用
const db = cloud.database();
const _ = db.command;

/**
 * 关联关键词与情感
 * @param {string} userId 用户ID
 * @param {Array} keywords 关键词数组
 * @param {Object} emotionResult 情感分析结果
 * @returns {Promise<boolean>} 是否关联成功
 */
async function linkKeywordsToEmotion(userId, keywords, emotionResult) {
  try {
    if (!userId || !Array.isArray(keywords) || keywords.length === 0 || !emotionResult) {
      console.warn('关联关键词与情感失败: 参数不完整');
      return false;
    }

    console.log(`关联关键词与情感, 用户ID: ${userId}, 关键词数量: ${keywords.length}`);

    // 提取情感分数
    const emotionScore = calculateEmotionScore(emotionResult);
    console.log(`计算情感分数: ${emotionScore}`);

    // 查询用户兴趣数据
    const userInterests = await db.collection('userInterests')
      .where({ userId: userId })
      .get();

    if (userInterests.data.length === 0) {
      console.warn(`用户 ${userId} 没有兴趣数据记录`);
      return false;
    }

    const record = userInterests.data[0];
    const existingKeywords = record.keywords || [];

    // 更新每个关键词的情感分数
    let updateCount = 0;
    for (const keyword of keywords) {
      const word = typeof keyword === 'string' ? keyword : keyword.word;
      if (!word) continue;

      // 查找关键词
      const keywordIndex = existingKeywords.findIndex(k => k.word === word);
      if (keywordIndex === -1) continue;

      // 计算新的情感分数 (加权平均)
      const currentScore = existingKeywords[keywordIndex].emotionScore || 0;
      const newScore = (currentScore * 0.7) + (emotionScore * 0.3);

      // 更新数据库
      await db.collection('userInterests').doc(record._id).update({
        data: {
          [`keywords.${keywordIndex}.emotionScore`]: newScore,
          [`keywords.${keywordIndex}.lastUpdated`]: new Date()
        }
      });

      updateCount++;
    }

    console.log(`成功更新 ${updateCount} 个关键词的情感分数`);
    return updateCount > 0;
  } catch (error) {
    console.error('关联关键词与情感失败:', error);
    return false;
  }
}

/**
 * 计算情感分数
 * 将情感分析结果转换为-1到1之间的分数，负值表示负面情绪，正值表示正面情绪
 * @param {Object} emotionResult 情感分析结果
 * @returns {number} 情感分数
 */
function calculateEmotionScore(emotionResult) {
  try {
    // 如果有直接的情感分数，使用它
    if (typeof emotionResult.score === 'number') {
      return Math.max(-1, Math.min(1, emotionResult.score));
    }

    // 如果有情感类型和强度，根据类型和强度计算分数
    const type = emotionResult.type || emotionResult.primary_emotion;
    const intensity = emotionResult.intensity || 0.5;

    if (!type) return 0;

    // 情感类型映射到分数
    const emotionScores = {
      'joy': 0.8,
      'happiness': 0.9,
      'contentment': 0.7,
      'excitement': 0.8,
      'love': 0.9,
      'optimism': 0.6,
      'pride': 0.5,
      'neutral': 0,
      'confusion': -0.2,
      'boredom': -0.3,
      'sadness': -0.7,
      'anger': -0.8,
      'fear': -0.7,
      'disgust': -0.6,
      'anxiety': -0.6,
      'stress': -0.5,
      'fatigue': -0.4,
      'disappointment': -0.5,
      'embarrassment': -0.4,
      'guilt': -0.6,
      'shame': -0.7
    };

    // 获取情感类型对应的基础分数，如果没有则默认为0
    const baseScore = emotionScores[type.toLowerCase()] || 0;

    // 根据强度调整分数
    return baseScore * intensity;
  } catch (error) {
    console.error('计算情感分数失败:', error);
    return 0;
  }
}

/**
 * 获取关键词情感统计
 * @param {string} userId 用户ID
 * @returns {Promise<Object>} 情感统计结果
 */
async function getKeywordEmotionStats(userId) {
  try {
    if (!userId) {
      console.warn('获取关键词情感统计失败: 用户ID为空');
      return { positive: [], negative: [], neutral: [] };
    }

    // 查询用户兴趣数据
    const userInterests = await db.collection('userInterests')
      .where({ userId: userId })
      .get();

    if (userInterests.data.length === 0) {
      console.warn(`用户 ${userId} 没有兴趣数据记录`);
      return { positive: [], negative: [], neutral: [] };
    }

    const keywords = userInterests.data[0].keywords || [];

    // 按情感分数分类关键词
    const positive = [];
    const negative = [];
    const neutral = [];

    keywords.forEach(keyword => {
      const score = keyword.emotionScore || 0;
      const item = {
        word: keyword.word,
        score: score,
        weight: keyword.weight || 1,
        category: keyword.category || '未分类'
      };

      if (score > 0.2) {
        positive.push(item);
      } else if (score < -0.2) {
        negative.push(item);
      } else {
        neutral.push(item);
      }
    });

    // 按情感分数绝对值和权重排序
    positive.sort((a, b) => (b.score * b.weight) - (a.score * a.weight));
    negative.sort((a, b) => (Math.abs(a.score) * a.weight) - (Math.abs(b.score) * b.weight));
    neutral.sort((a, b) => b.weight - a.weight);

    return {
      positive: positive.slice(0, 10), // 取前10个
      negative: negative.slice(0, 10), // 取前10个
      neutral: neutral.slice(0, 10)    // 取前10个
    };
  } catch (error) {
    console.error('获取关键词情感统计失败:', error);
    return { positive: [], negative: [], neutral: [] };
  }
}

// 导出模块
module.exports = {
  linkKeywordsToEmotion,
  calculateEmotionScore,
  getKeywordEmotionStats
};
