/**
 * 用户兴趣分析器
 * 提供关键词分类、用户兴趣分析和关注点识别功能
 */

// 导入大模型调用模块
const bigmodel = require('./bigmodel');
const keywordClassifier = require('./keywordClassifier');

// 预定义的兴趣类别
const INTEREST_CATEGORIES = [
  '学习', '工作', '娱乐', '社交', '健康', '生活', '科技', '艺术', '体育', 
  '旅游', '美食', '时尚', '金融', '宠物', '家庭', '音乐', '电影', '阅读', 
  '游戏', '心理', '自我提升', '时间管理', '压力缓解', '人际关系', '休闲活动'
];

/**
 * 分析用户兴趣和关注点
 * @param {Array} keywords 关键词数组，每个元素包含word和weight字段
 * @param {Array} emotionRecords 情绪记录数组
 * @returns {Promise<Object>} 分析结果
 */
async function analyzeUserInterests(keywords, emotionRecords = []) {
  try {
    if (!Array.isArray(keywords) || keywords.length === 0) {
      console.warn('关键词数组为空，无法分析用户兴趣');
      return {
        success: false,
        error: '关键词数组为空'
      };
    }

    console.log(`开始分析用户兴趣，关键词数量: ${keywords.length}`);

    // 1. 对关键词进行分类
    const classifiedKeywords = await classifyKeywords(keywords);
    console.log(`关键词分类完成，分类结果: ${JSON.stringify(classifiedKeywords)}`);

    // 2. 计算每个类别的权重总和
    const categoryWeights = calculateCategoryWeights(classifiedKeywords);
    console.log(`类别权重计算完成: ${JSON.stringify(categoryWeights)}`);

    // 3. 标准化类别权重为百分比
    const normalizedWeights = normalizeWeights(categoryWeights);
    console.log(`权重标准化完成: ${JSON.stringify(normalizedWeights)}`);

    // 4. 提取用户关注点
    const focusPoints = extractFocusPoints(normalizedWeights, classifiedKeywords);
    console.log(`关注点提取完成: ${JSON.stringify(focusPoints)}`);

    // 5. 结合情绪记录进行情感关联分析
    const emotionalInsights = analyzeEmotionalAssociations(classifiedKeywords, emotionRecords);
    console.log(`情感关联分析完成: ${JSON.stringify(emotionalInsights)}`);

    return {
      success: true,
      data: {
        categoryWeights: normalizedWeights,
        focusPoints: focusPoints,
        emotionalInsights: emotionalInsights,
        classifiedKeywords: classifiedKeywords
      }
    };
  } catch (error) {
    console.error('分析用户兴趣失败:', error);
    return {
      success: false,
      error: error.message || '分析用户兴趣失败'
    };
  }
}

/**
 * 对关键词进行分类
 * @param {Array} keywords 关键词数组
 * @returns {Promise<Array>} 分类后的关键词数组
 */
async function classifyKeywords(keywords) {
  try {
    // 提取关键词文本
    const keywordTexts = keywords.map(item => item.word);
    console.log(`准备分类关键词: ${JSON.stringify(keywordTexts)}`);

    // 调用关键词分类器进行批量分类
    const classifications = await keywordClassifier.batchClassifyKeywords(keywordTexts);
    console.log(`分类结果: ${JSON.stringify(classifications)}`);

    // 将分类结果与原始关键词合并
    const classifiedKeywords = keywords.map(keyword => {
      const classification = classifications.find(c => c.keyword === keyword.word);
      return {
        ...keyword,
        category: classification ? classification.category : '其他'
      };
    });

    return classifiedKeywords;
  } catch (error) {
    console.error('关键词分类失败:', error);
    // 如果分类失败，返回原始关键词，类别设为"其他"
    return keywords.map(keyword => ({
      ...keyword,
      category: '其他'
    }));
  }
}

/**
 * 计算每个类别的权重总和
 * @param {Array} classifiedKeywords 分类后的关键词数组
 * @returns {Object} 类别权重映射
 */
function calculateCategoryWeights(classifiedKeywords) {
  const categoryWeights = {};

  // 初始化所有预定义类别的权重为0
  INTEREST_CATEGORIES.forEach(category => {
    categoryWeights[category] = 0;
  });

  // 累加每个类别的权重
  classifiedKeywords.forEach(keyword => {
    const category = keyword.category;
    if (!categoryWeights[category]) {
      categoryWeights[category] = 0;
    }
    categoryWeights[category] += keyword.weight || 1;
  });

  return categoryWeights;
}

/**
 * 标准化类别权重为百分比
 * @param {Object} categoryWeights 类别权重映射
 * @returns {Array} 标准化后的类别权重数组
 */
function normalizeWeights(categoryWeights) {
  // 计算权重总和
  let totalWeight = 0;
  Object.values(categoryWeights).forEach(weight => {
    totalWeight += weight;
  });

  // 如果总权重为0，返回空数组
  if (totalWeight === 0) {
    return [];
  }

  // 标准化权重并转换为数组格式
  const normalizedWeights = Object.entries(categoryWeights)
    .filter(([_, weight]) => weight > 0) // 只保留权重大于0的类别
    .map(([category, weight]) => ({
      category,
      weight: weight,
      percentage: parseFloat(((weight / totalWeight) * 100).toFixed(1))
    }))
    .sort((a, b) => b.percentage - a.percentage); // 按百分比降序排序

  return normalizedWeights;
}

/**
 * 提取用户关注点
 * @param {Array} normalizedWeights 标准化后的类别权重数组
 * @param {Array} classifiedKeywords 分类后的关键词数组
 * @returns {Array} 用户关注点数组
 */
function extractFocusPoints(normalizedWeights, classifiedKeywords) {
  // 取权重前5的类别作为主要关注点
  const topCategories = normalizedWeights.slice(0, 5);

  // 为每个主要类别找出最具代表性的关键词
  const focusPoints = topCategories.map(category => {
    // 找出该类别下的所有关键词
    const categoryKeywords = classifiedKeywords.filter(
      keyword => keyword.category === category.category
    );

    // 按权重排序
    categoryKeywords.sort((a, b) => (b.weight || 0) - (a.weight || 0));

    // 取前3个关键词作为代表
    const representativeKeywords = categoryKeywords.slice(0, 3).map(k => k.word);

    return {
      category: category.category,
      percentage: category.percentage,
      weight: category.weight,
      keywords: representativeKeywords
    };
  });

  return focusPoints;
}

/**
 * 分析关键词与情绪的关联
 * @param {Array} classifiedKeywords 分类后的关键词数组
 * @param {Array} emotionRecords 情绪记录数组
 * @returns {Object} 情感关联分析结果
 */
function analyzeEmotionalAssociations(classifiedKeywords, emotionRecords) {
  // 如果没有情绪记录，返回空结果
  if (!Array.isArray(emotionRecords) || emotionRecords.length === 0) {
    return {
      positiveAssociations: [],
      negativeAssociations: []
    };
  }

  // 情绪极性映射
  const emotionPolarity = {
    '高兴': 1, '开心': 1, '喜悦': 1, '兴奋': 1, '满足': 1, '感激': 1, '乐观': 1,
    '悲伤': -1, '沮丧': -1, '失望': -1, '痛苦': -1, '焦虑': -1, '恐惧': -1, '愤怒': -1,
    '烦躁': -1, '厌恶': -1, '内疚': -1, '羞愧': -1, '嫉妒': -1, '孤独': -1,
    '平静': 0.5, '放松': 0.5, '满足': 0.5, '中性': 0, '混合': 0
  };

  // 关键词情感关联映射
  const keywordEmotionMap = {};

  // 遍历情绪记录，建立关键词与情绪的关联
  emotionRecords.forEach(record => {
    const emotionType = record.analysis?.type || record.analysis?.primary_emotion || 'neutral';
    const polarity = emotionPolarity[emotionType] || 0;
    const keywords = record.analysis?.keywords || [];

    // 将关键词与情绪关联
    keywords.forEach(keyword => {
      const word = typeof keyword === 'string' ? keyword : keyword.word;
      if (!keywordEmotionMap[word]) {
        keywordEmotionMap[word] = {
          positive: 0,
          negative: 0,
          count: 0
        };
      }

      keywordEmotionMap[word].count++;
      if (polarity > 0) {
        keywordEmotionMap[word].positive++;
      } else if (polarity < 0) {
        keywordEmotionMap[word].negative++;
      }
    });
  });

  // 找出与积极情绪和消极情绪最相关的关键词
  const positiveAssociations = [];
  const negativeAssociations = [];

  Object.entries(keywordEmotionMap).forEach(([word, stats]) => {
    if (stats.count >= 2) { // 至少出现2次才考虑
      const positiveRatio = stats.positive / stats.count;
      const negativeRatio = stats.negative / stats.count;

      if (positiveRatio > 0.6) {
        positiveAssociations.push({
          word,
          ratio: positiveRatio,
          count: stats.count
        });
      } else if (negativeRatio > 0.6) {
        negativeAssociations.push({
          word,
          ratio: negativeRatio,
          count: stats.count
        });
      }
    }
  });

  // 按关联强度排序
  positiveAssociations.sort((a, b) => (b.ratio * b.count) - (a.ratio * a.count));
  negativeAssociations.sort((a, b) => (b.ratio * b.count) - (a.ratio * a.count));

  return {
    positiveAssociations: positiveAssociations.slice(0, 5), // 取前5个
    negativeAssociations: negativeAssociations.slice(0, 5) // 取前5个
  };
}

// 导出模块
module.exports = {
  analyzeUserInterests,
  INTEREST_CATEGORIES
};
