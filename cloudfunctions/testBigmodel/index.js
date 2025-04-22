/**
 * 智谱AI (BigModel) 测试云函数
 * 用于测试智谱AI API的连接和功能
 */
const cloud = require('wx-server-sdk');
const bigModelModule = require('./bigmodel');

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

/**
 * 测试情感分析功能
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 测试结果
 */
async function testEmotionAnalysis(event) {
  const { text = "今天天气真好，我感到非常开心！" } = event;
  
  console.log('测试情感分析, 输入文本:', text);
  
  try {
    const result = await bigModelModule.analyzeEmotion(text);
    console.log('情感分析结果:', result);
    return {
      success: true,
      testName: '情感分析测试',
      input: text,
      output: result
    };
  } catch (error) {
    console.error('情感分析测试失败:', error);
    return {
      success: false,
      testName: '情感分析测试',
      input: text,
      error: error.message || '未知错误'
    };
  }
}

/**
 * 测试关键词提取功能
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 测试结果
 */
async function testKeywordExtraction(event) {
  const { text = "人工智能和大语言模型正在改变我们的生活和工作方式。", topK = 5 } = event;
  
  console.log('测试关键词提取, 输入文本:', text, '提取数量:', topK);
  
  try {
    const result = await bigModelModule.extractKeywords(text, topK);
    console.log('关键词提取结果:', result);
    return {
      success: true,
      testName: '关键词提取测试',
      input: { text, topK },
      output: result
    };
  } catch (error) {
    console.error('关键词提取测试失败:', error);
    return {
      success: false,
      testName: '关键词提取测试',
      input: { text, topK },
      error: error.message || '未知错误'
    };
  }
}

/**
 * 测试文本向量化功能
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 测试结果
 */
async function testEmbeddings(event) {
  const { texts = ["人工智能", "机器学习", "深度学习"] } = event;
  
  console.log('测试文本向量化, 输入文本:', texts);
  
  try {
    const result = await bigModelModule.getEmbeddings(texts);
    console.log('文本向量化结果:', result);
    
    // 为了避免返回过大的数据，只返回向量的长度信息
    let vectorInfo = null;
    if (result.success && result.data && result.data.vectors) {
      vectorInfo = result.data.vectors.map(vector => ({
        length: vector.length,
        sample: vector.slice(0, 5) // 只返回前5个元素作为样本
      }));
    }
    
    return {
      success: true,
      testName: '文本向量化测试',
      input: texts,
      output: {
        success: result.success,
        vectorInfo: vectorInfo
      }
    };
  } catch (error) {
    console.error('文本向量化测试失败:', error);
    return {
      success: false,
      testName: '文本向量化测试',
      input: texts,
      error: error.message || '未知错误'
    };
  }
}

/**
 * 测试关键词聚类功能
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 测试结果
 */
async function testKeywordClustering(event) {
  const { 
    text = "人工智能技术包括机器学习、深度学习、自然语言处理、计算机视觉等多个领域。这些技术正在各行各业得到广泛应用。",
    threshold = 0.7,
    minClusterSize = 2
  } = event;
  
  console.log('测试关键词聚类, 输入文本:', text);
  
  try {
    const result = await bigModelModule.clusterKeywords(text, threshold, minClusterSize);
    console.log('关键词聚类结果:', result);
    return {
      success: true,
      testName: '关键词聚类测试',
      input: { text, threshold, minClusterSize },
      output: result
    };
  } catch (error) {
    console.error('关键词聚类测试失败:', error);
    return {
      success: false,
      testName: '关键词聚类测试',
      input: { text, threshold, minClusterSize },
      error: error.message || '未知错误'
    };
  }
}

/**
 * 测试用户兴趣分析功能
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 测试结果
 */
async function testUserInterestAnalysis(event) {
  const { messages = [
    "我最近在学习Python编程，感觉很有趣。",
    "周末想去看一场电影，有什么好推荐吗？",
    "我很喜欢听古典音乐，尤其是莫扎特的作品。"
  ] } = event;
  
  console.log('测试用户兴趣分析, 输入消息:', messages);
  
  try {
    const result = await bigModelModule.analyzeUserInterests(messages);
    console.log('用户兴趣分析结果:', result);
    return {
      success: true,
      testName: '用户兴趣分析测试',
      input: messages,
      output: result
    };
  } catch (error) {
    console.error('用户兴趣分析测试失败:', error);
    return {
      success: false,
      testName: '用户兴趣分析测试',
      input: messages,
      error: error.message || '未知错误'
    };
  }
}

/**
 * 运行所有测试
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 所有测试结果
 */
async function runAllTests(event) {
  console.log('开始运行所有测试...');
  
  const results = {
    emotionAnalysis: await testEmotionAnalysis(event),
    keywordExtraction: await testKeywordExtraction(event),
    embeddings: await testEmbeddings(event),
    keywordClustering: await testKeywordClustering(event),
    userInterestAnalysis: await testUserInterestAnalysis(event)
  };
  
  const allSuccess = Object.values(results).every(result => result.success);
  
  console.log('所有测试完成, 全部成功:', allSuccess);
  
  return {
    success: allSuccess,
    testName: '全部测试',
    results: results
  };
}

/**
 * 云函数入口函数
 * @param {Object} event 事件参数
 * @param {Object} context 上下文
 * @returns {Promise<Object>} 处理结果
 */
exports.main = async (event, context) => {
  const { test = 'all' } = event;
  
  console.log('testBigmodel 云函数入口, test:', test);
  
  try {
    switch (test) {
      case 'emotion':
        return await testEmotionAnalysis(event);
      case 'keywords':
        return await testKeywordExtraction(event);
      case 'embeddings':
        return await testEmbeddings(event);
      case 'clustering':
        return await testKeywordClustering(event);
      case 'interests':
        return await testUserInterestAnalysis(event);
      case 'all':
      default:
        return await runAllTests(event);
    }
  } catch (error) {
    console.error('测试执行失败:', error);
    return {
      success: false,
      error: error.message || '未知错误'
    };
  }
};
