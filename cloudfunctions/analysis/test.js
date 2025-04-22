/**
 * 测试智谱AI模块
 * 用于验证bigmodel.js模块的功能是否正常
 */
const bigModelModule = require('./bigmodel');

// 测试事件
const testEvent = {
  textForEmotion: "今天项目上线了，非常激动和开心！但也感觉有点累。",
  textForKeywords: "这个基于大模型的AI助手可以进行情感识别和文本摘要。",
  textsForEmbedding: [
    "探索AI的可能性",
    "感受科技的魅力",
    "创造更美好的未来"
  ],
  userMessagesForInterest: [
    "周末想去看画展，对艺术很感兴趣。",
    "最近在学习Python编程。",
    "喜欢听古典音乐放松心情。"
  ]
};

/**
 * 主测试函数
 */
async function main() {
  console.log('开始测试 bigmodel.js 模块...');
  console.log('收到的测试事件 event:', testEvent);

  // 测试情感分析功能
  console.log('\n--- 测试 analyzeEmotion ---\n');
  console.log('analyzeEmotion 输入:', testEvent.textForEmotion);
  try {
    const emotionResult = await bigModelModule.analyzeEmotion(testEvent.textForEmotion);
    console.log('analyzeEmotion 输出:', emotionResult);
  } catch (error) {
    console.log('智谱AI情感分析失败:', error);
    console.log('analyzeEmotion 输出:', {
      success: false,
      error: error.message || '情感分析失败'
    });
  }

  // 测试关键词提取功能
  console.log('\n--- 测试 extractKeywords ---\n');
  console.log('extractKeywords 输入:', testEvent.textForKeywords);
  try {
    const keywordsResult = await bigModelModule.extractKeywords(testEvent.textForKeywords);
    console.log('extractKeywords 输出:', keywordsResult);
  } catch (error) {
    console.log('智谱AI关键词提取失败:', error);
    console.log('extractKeywords 输出:', {
      success: false,
      error: error.message || '关键词提取失败'
    });
  }

  // 测试向量获取功能
  console.log('\n--- 测试 getEmbeddings ---\n');
  console.log('getEmbeddings 输入:', testEvent.textsForEmbedding);
  try {
    const embeddingsResult = await bigModelModule.getEmbeddings(testEvent.textsForEmbedding);
    console.log('getEmbeddings 输出:', embeddingsResult);
  } catch (error) {
    console.log('智谱AI向量获取失败:', error);
    console.log('getEmbeddings 输出:', {
      success: false,
      error: error.message || '向量获取失败'
    });
  }

  // 测试用户兴趣分析功能
  console.log('\n--- 测试 analyzeUserInterests ---\n');
  console.log('analyzeUserInterests 输入:', testEvent.userMessagesForInterest);
  try {
    const interestsResult = await bigModelModule.analyzeUserInterests(testEvent.userMessagesForInterest);
    console.log('analyzeUserInterests 输出:', interestsResult);
  } catch (error) {
    console.log('智谱AI用户兴趣分析失败:', error);
    console.log('analyzeUserInterests 输出:', {
      success: false,
      error: error.message || '用户兴趣分析失败'
    });
  }

  console.log('\n测试结束.');
}

// 执行测试
main().catch(error => {
  console.error('测试过程中发生错误:', error);
});

// 导出测试函数
exports.main = async (event) => {
  try {
    await main();
    return {
      success: true,
      message: 'bigmodel.js 模块测试执行完毕，请检查云函数运行日志获取详细结果。'
    };
  } catch (error) {
    console.error('测试执行失败:', error);
    return {
      success: false,
      error: error.message || '测试执行失败'
    };
  }
};
