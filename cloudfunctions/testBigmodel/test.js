/**
 * 智谱AI (BigModel) 模块测试脚本
 * 用于详细测试bigmodel.js模块的各项功能
 */
const bigModelModule = require('./bigmodel');

// 测试数据集
const testData = {
  // 情感分析测试数据
  emotion: [
    { text: "今天天气真好，我感到非常开心！", description: "积极情绪" },
    { text: "这个结果让我很失望，感觉很沮丧。", description: "消极情绪" },
    { text: "我对这个问题没有特别的感觉。", description: "中性情绪" },
    { text: "这个消息太可怕了，我很担心。", description: "恐惧情绪" },
    { text: "我对这个决定感到非常愤怒！", description: "愤怒情绪" }
  ],
  
  // 关键词提取测试数据
  keywords: [
    { 
      text: "人工智能和大语言模型正在改变我们的生活和工作方式。", 
      topK: 5,
      description: "AI相关短文本"
    },
    { 
      text: "微信小程序是一种不需要下载安装即可使用的应用，它实现了应用'触手可及'的梦想，用户扫一扫或搜一下即可打开应用。", 
      topK: 8,
      description: "小程序相关长文本"
    }
  ],
  
  // 文本向量化测试数据
  embeddings: [
    {
      texts: ["人工智能", "机器学习", "深度学习"],
      description: "AI领域相关词汇"
    },
    {
      texts: ["微信小程序", "云开发", "云函数"],
      description: "微信开发相关词汇"
    }
  ],
  
  // 关键词聚类测试数据
  clustering: [
    {
      text: "人工智能技术包括机器学习、深度学习、自然语言处理、计算机视觉等多个领域。这些技术正在各行各业得到广泛应用。",
      threshold: 0.7,
      minClusterSize: 2,
      description: "AI技术领域文本"
    },
    {
      text: "微信小程序开发涉及前端开发、后端开发、云开发、数据库和API调用等多个方面。开发者需要掌握JavaScript、WXML、WXSS等技术。",
      threshold: 0.7,
      minClusterSize: 2,
      description: "小程序开发领域文本"
    }
  ],
  
  // 用户兴趣分析测试数据
  interests: [
    {
      messages: [
        "我最近在学习Python编程，感觉很有趣。",
        "周末想去看一场电影，有什么好推荐吗？",
        "我很喜欢听古典音乐，尤其是莫扎特的作品。"
      ],
      description: "多样化兴趣用户"
    },
    {
      messages: [
        "我正在学习机器学习算法。",
        "有没有推荐的深度学习框架？",
        "最近在研究自然语言处理技术。",
        "GPT模型的原理是什么？"
      ],
      description: "AI领域专注用户"
    }
  ]
};

/**
 * 测试情感分析功能
 */
async function testEmotionAnalysis() {
  console.log('\n========== 测试情感分析功能 ==========\n');
  
  for (const item of testData.emotion) {
    console.log(`测试场景: ${item.description}`);
    console.log(`输入文本: "${item.text}"`);
    
    try {
      const result = await bigModelModule.analyzeEmotion(item.text);
      console.log('测试结果:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ 测试通过');
      } else {
        console.log('❌ 测试失败:', result.error);
      }
    } catch (error) {
      console.error('❌ 测试异常:', error.message);
    }
    
    console.log('\n-----------------------------------\n');
  }
}

/**
 * 测试关键词提取功能
 */
async function testKeywordExtraction() {
  console.log('\n========== 测试关键词提取功能 ==========\n');
  
  for (const item of testData.keywords) {
    console.log(`测试场景: ${item.description}`);
    console.log(`输入文本: "${item.text}"`);
    console.log(`提取数量: ${item.topK}`);
    
    try {
      const result = await bigModelModule.extractKeywords(item.text, item.topK);
      console.log('测试结果:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ 测试通过');
      } else {
        console.log('❌ 测试失败:', result.error);
      }
    } catch (error) {
      console.error('❌ 测试异常:', error.message);
    }
    
    console.log('\n-----------------------------------\n');
  }
}

/**
 * 测试文本向量化功能
 */
async function testEmbeddings() {
  console.log('\n========== 测试文本向量化功能 ==========\n');
  
  for (const item of testData.embeddings) {
    console.log(`测试场景: ${item.description}`);
    console.log(`输入文本: ${JSON.stringify(item.texts)}`);
    
    try {
      const result = await bigModelModule.getEmbeddings(item.texts);
      
      // 为了避免日志过长，只显示向量的长度和前几个元素
      let displayResult = { ...result };
      if (result.success && result.data && result.data.vectors) {
        displayResult.data.vectors = result.data.vectors.map((vector, index) => ({
          forText: item.texts[index],
          length: vector.length,
          sample: vector.slice(0, 5) + '...'
        }));
      }
      
      console.log('测试结果:', JSON.stringify(displayResult, null, 2));
      
      if (result.success) {
        console.log('✅ 测试通过');
      } else {
        console.log('❌ 测试失败:', result.error);
      }
    } catch (error) {
      console.error('❌ 测试异常:', error.message);
    }
    
    console.log('\n-----------------------------------\n');
  }
}

/**
 * 测试关键词聚类功能
 */
async function testKeywordClustering() {
  console.log('\n========== 测试关键词聚类功能 ==========\n');
  
  for (const item of testData.clustering) {
    console.log(`测试场景: ${item.description}`);
    console.log(`输入文本: "${item.text}"`);
    console.log(`聚类阈值: ${item.threshold}, 最小簇大小: ${item.minClusterSize}`);
    
    try {
      const result = await bigModelModule.clusterKeywords(item.text, item.threshold, item.minClusterSize);
      console.log('测试结果:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ 测试通过');
      } else {
        console.log('❌ 测试失败:', result.error);
      }
    } catch (error) {
      console.error('❌ 测试异常:', error.message);
    }
    
    console.log('\n-----------------------------------\n');
  }
}

/**
 * 测试用户兴趣分析功能
 */
async function testUserInterestAnalysis() {
  console.log('\n========== 测试用户兴趣分析功能 ==========\n');
  
  for (const item of testData.interests) {
    console.log(`测试场景: ${item.description}`);
    console.log(`输入消息: ${JSON.stringify(item.messages)}`);
    
    try {
      const result = await bigModelModule.analyzeUserInterests(item.messages);
      console.log('测试结果:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ 测试通过');
      } else {
        console.log('❌ 测试失败:', result.error);
      }
    } catch (error) {
      console.error('❌ 测试异常:', error.message);
    }
    
    console.log('\n-----------------------------------\n');
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('======================================================');
  console.log('开始测试 bigmodel.js 模块的所有功能');
  console.log('======================================================\n');
  
  try {
    await testEmotionAnalysis();
    await testKeywordExtraction();
    await testEmbeddings();
    await testKeywordClustering();
    await testUserInterestAnalysis();
    
    console.log('\n======================================================');
    console.log('所有测试完成');
    console.log('======================================================');
  } catch (error) {
    console.error('\n测试过程中发生错误:', error);
  }
}

// 导出测试函数
exports.main = async (event) => {
  const { test = 'all' } = event;
  
  console.log(`开始执行测试: ${test}`);
  
  try {
    switch (test) {
      case 'emotion':
        await testEmotionAnalysis();
        break;
      case 'keywords':
        await testKeywordExtraction();
        break;
      case 'embeddings':
        await testEmbeddings();
        break;
      case 'clustering':
        await testKeywordClustering();
        break;
      case 'interests':
        await testUserInterestAnalysis();
        break;
      case 'all':
      default:
        await runAllTests();
        break;
    }
    
    return {
      success: true,
      message: `测试 ${test} 执行完毕，请检查云函数运行日志获取详细结果。`
    };
  } catch (error) {
    console.error('测试执行失败:', error);
    return {
      success: false,
      error: error.message || '未知错误'
    };
  }
};
