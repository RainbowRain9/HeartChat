// analysis 云函数 index.js
/**
 * 情感分析与关键词提取云函数
 * 基于智谱AI (BigModel) API，提供对话文本的情绪识别和关键词提取功能
 * 可以识别出当前会话者所表现出的情绪类别及其置信度
 * 针对正面和负面的情绪，还可给出参考回复话术
 * 同时支持使用智谱AI进行关键词提取、词向量获取和聚类分析
 */
const cloud = require('wx-server-sdk');
const axios = require('axios');

// 导入智谱AI模块
const bigModelModule = require('./bigmodel');
// 导入关键词分类器
const keywordClassifier = require('./keywordClassifier');
// 导入关键词情感关联模块
const keywordEmotionLinker = require('./keywordEmotionLinker');
// 导入用户兴趣分析器
const userInterestAnalyzer = require('./userInterestAnalyzer');

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 保存情感分析记录到数据库
 * @param {Object} result 情感分析结果
 * @param {string} openid 用户openid
 * @param {Object} options 附加选项，如roleId等
 * @returns {Promise<string>} 记录ID
 */
async function saveEmotionRecord(result, openid, options = {}) {
  try {
    // 构建记录数据
    const recordData = {
      userId: openid,
      analysis: result,
      originalText: result.originalText || '',
      createTime: db.serverDate(),
      ...options
    };

    // 写入数据库
    const res = await db.collection('emotionRecords').add({
      data: recordData
    });

    return res._id;
  } catch (error) {
    console.error('保存情感分析记录失败:', error);
    return null;
  }
}

/**
 * 分析文本情感 (使用智谱AI)
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function analyzeEmotion(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();

    // 获取参数
    const { text, history = [], saveRecord = false, roleId = null, chatId = null, extractKeywords = true, linkKeywords = true } = event;

    // 验证文本参数
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return {
        success: false,
        error: '无效的文本参数'
      };
    }

    // 并行处理情感分析和关键词提取
    const [emotionResponse, keywords] = await Promise.all([
      // 调用智谱AI情感分析，传入历史消息
      bigModelModule.analyzeEmotion(text, history),
      // 如果需要提取关键词，则提取
      extractKeywords ? bigModelModule.extractKeywords(text, 5) : Promise.resolve([])
    ]);

    // 检查智谱AI返回结果
    if (emotionResponse.success) {
      // 如果需要保存记录，异步保存到数据库
      let recordId = null;
      if (saveRecord) {
        try {
          recordId = await saveEmotionRecord(emotionResponse.result, wxContext.OPENID, { roleId, chatId });
        } catch (saveError) {
          console.error('保存情感记录失败:', saveError);
          // 保存失败不影响主流程
        }
      }

      // 如果需要关联关键词和情感，并且成功提取到关键词
      if (linkKeywords && extractKeywords && keywords && keywords.length > 0) {
        try {
          // 异步关联关键词和情感，不阻塞主流程
          keywordEmotionLinker.linkKeywordsToEmotion(wxContext.OPENID, keywords, emotionResponse.result)
            .then(success => {
              console.log('关联关键词和情感' + (success ? '成功' : '失败'));
            })
            .catch(error => {
              console.error('关联关键词和情感异常:', error);
            });
        } catch (linkError) {
          console.error('关联关键词和情感失败:', linkError);
          // 关联失败不影响主流程
        }
      }

      // 返回结果
      return {
        success: true,
        result: emotionResponse.result,
        recordId: recordId,
        keywords: keywords
      };
    } else {
      // 智谱AI返回错误
      return {
        success: false,
        error: emotionResponse.error || '情感分析服务返回错误'
      };
    }
  } catch (error) {
    console.error('情感分析失败:', error);

    // 返回错误信息
    return {
      success: false,
      error: error.message || '情感分析服务调用失败'
    };
  }
}

/**
 * 提取文本关键词 (使用智谱AI)
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function extractTextKeywords(event) {
  try {
    // 获取参数
    const { text, topK = 10 } = event;

    // 验证文本参数
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return {
        success: false,
        error: '无效的文本参数'
      };
    }

    // 调用智谱AI关键词提取
    const result = await bigModelModule.extractKeywords(text, topK);

    // 返回结果
    return result;
  } catch (error) {
    console.error('智谱AI关键词提取失败:', error);

    // 返回错误信息
    return {
      success: false,
      error: error.message || '关键词提取服务调用失败'
    };
  }
}

/**
 * 获取词向量 (使用智谱AI)
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function getWordVectors(event) {
  try {
    // 获取参数
    const { texts } = event;

    // 验证参数
    if (!texts) {
      return {
        success: false,
        error: '无效的文本参数'
      };
    }

    // 确保texts是数组
    const textArray = Array.isArray(texts) ? texts : [texts];

    // 验证数组不为空
    if (textArray.length === 0) {
      return {
        success: false,
        error: '文本数组为空'
      };
    }

    console.log('调用智谱AI词向量获取, 输入:', textArray);

    // 调用智谱AI词向量获取
    const result = await bigModelModule.getEmbeddings(textArray);

    console.log('智谱AI词向量获取结果:', result);

    // 返回结果
    return result;
  } catch (error) {
    console.error('获取词向量失败:', error);
    return {
      success: false,
      error: error.message || '词向量服务调用失败'
    };
  }
}

/**
 * 聚类分析 (使用智谱AI)
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function clusterKeywords(event) {
  try {
    // 获取参数
    const { text, threshold = 0.7, minClusterSize = 2 } = event;

    // 验证文本参数
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return {
        success: false,
        error: '无效的文本参数'
      };
    }

    // 调用智谱AI聚类分析
    const result = await bigModelModule.clusterKeywords(text, threshold, minClusterSize);

    // 返回结果
    return result;
  } catch (error) {
    console.error('聚类分析失败:', error);

    // 返回错误信息
    return {
      success: false,
      error: error.message || '聚类分析服务调用失败'
    };
  }
}

/**
 * 分析用户兴趣 (使用智谱AI)
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function analyzeUserInterests(event) {
  try {
    // 获取参数
    const { messages } = event;

    // 验证参数
    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        success: false,
        error: '无效的消息参数'
      };
    }

    // 调用智谱AI用户兴趣分析
    const result = await bigModelModule.analyzeUserInterests(messages);

    // 返回结果
    return result;
  } catch (error) {
    console.error('用户兴趣分析失败:', error);

    // 返回错误信息
    return {
      success: false,
      error: error.message || '用户兴趣分析服务调用失败'
    };
  }
}

/**
 * 分析用户关注点
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function analyzeFocusPoints(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();

    // 获取参数
    const { userId = wxContext.OPENID, keywords, emotionRecords = [], date } = event;

    // 验证参数
    if (!userId) {
      return {
        success: false,
        error: '用户ID不能为空'
      };
    }

    // 如果没有提供关键词，从数据库中获取
    let keywordsToAnalyze = keywords;
    if (!keywordsToAnalyze || !Array.isArray(keywordsToAnalyze) || keywordsToAnalyze.length === 0) {
      // 初始化数据库
      const db = cloud.database();
      const _ = db.command;

      // 如果指定了日期，获取该日期的情绪记录
      let queryDate = null;
      if (date) {
        queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(queryDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // 查询指定日期的情绪记录
        const records = await db.collection('emotionRecords')
          .where({
            userId: userId,
            createTime: _.gte(queryDate).and(_.lt(nextDay))
          })
          .get();

        // 提取关键词
        keywordsToAnalyze = [];
        records.data.forEach(record => {
          if (record.analysis && record.analysis.keywords) {
            record.analysis.keywords.forEach(keyword => {
              if (typeof keyword === 'string') {
                keywordsToAnalyze.push({ word: keyword, weight: 1 });
              } else if (keyword.word) {
                keywordsToAnalyze.push({
                  word: keyword.word,
                  weight: keyword.weight || 1
                });
              }
            });
          }
        });
      } else {
        // 如果没有指定日期，从用户兴趣表中获取关键词
        const userInterests = await db.collection('userInterests')
          .where({ userId: userId })
          .get();

        if (userInterests.data && userInterests.data.length > 0 && userInterests.data[0].keywords) {
          keywordsToAnalyze = userInterests.data[0].keywords.map(k => ({
            word: k.word,
            weight: k.weight || 1,
            category: k.category || '其他'
          }));
        }
      }
    }

    // 如果仍然没有关键词，返回错误
    if (!keywordsToAnalyze || keywordsToAnalyze.length === 0) {
      return {
        success: false,
        error: '没有可用的关键词数据'
      };
    }

    // 如果没有提供情绪记录，从数据库中获取
    let emotionRecordsToAnalyze = emotionRecords;
    if (!emotionRecordsToAnalyze || !Array.isArray(emotionRecordsToAnalyze) || emotionRecordsToAnalyze.length === 0) {
      // 初始化数据库
      const db = cloud.database();
      const _ = db.command;

      // 如果指定了日期，获取该日期的情绪记录
      if (queryDate) {
        // 使用上面已经查询到的记录
        emotionRecordsToAnalyze = records.data;
      } else {
        // 获取最近一周的情绪记录
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const records = await db.collection('emotionRecords')
          .where({
            userId: userId,
            createTime: _.gte(oneWeekAgo)
          })
          .limit(100) // 限制数量，避免数据过大
          .get();

        emotionRecordsToAnalyze = records.data;
      }
    }

    // 调用用户兴趣分析器
    const result = await userInterestAnalyzer.analyzeUserInterests(keywordsToAnalyze, emotionRecordsToAnalyze);

    // 返回结果
    return result;
  } catch (error) {
    console.error('分析用户关注点失败:', error);

    // 返回错误信息
    return {
      success: false,
      error: error.message || '分析用户关注点失败'
    };
  }
}

/**
 * 生成用户每日心情报告
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function generateDailyReport(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();

    // 获取参数
    const { userId = wxContext.OPENID, date = new Date(), forceRegenerate = false } = event;

    // 验证用户ID
    if (!userId) {
      return {
        success: false,
        error: '无效的用户ID'
      };
    }

    // 初始化数据库
    const db = cloud.database();
    const _ = db.command;
    const $ = db.command.aggregate;

    // 将日期转换为当天的开始时间（00:00:00）
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);

    // 计算当天的结束时间（23:59:59）
    const nextDay = new Date(reportDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setMilliseconds(-1);

    // 检查是否已经生成过报告
    const existingReport = await db.collection('userReports')
      .where({
        userId: userId,
        date: reportDate
      })
      .get();

    // 如果已经存在报告且不强制重新生成，则直接返回
    if (existingReport.data.length > 0 && !forceRegenerate) {
      return {
        success: true,
        reportId: existingReport.data[0]._id,
        report: existingReport.data[0],
        isNew: false
      };
    }

    // 查询用户当天的情感记录
    const emotionRecords = await db.collection('emotionRecords')
      .where({
        userId: userId,
        createTime: _.gte(reportDate).and(_.lt(nextDay))
      })
      .get();

    // 如果没有情感记录，返回错误
    if (emotionRecords.data.length === 0) {
      return {
        success: false,
        error: '当天没有情感记录，无法生成报告'
      };
    }

    // 提取情感数据
    const emotions = emotionRecords.data.map(record => ({
      type: record.analysis.type || record.analysis.primary_emotion || 'neutral',
      intensity: record.analysis.intensity || 0.5,
      keywords: record.analysis.keywords || [],
      timestamp: record.createTime,
      text: record.originalText || ''
    }));

    // 统计情感分布
    const emotionDistribution = {};
    emotions.forEach(emotion => {
      if (!emotionDistribution[emotion.type]) {
        emotionDistribution[emotion.type] = 0;
      }
      emotionDistribution[emotion.type]++;
    });

    // 计算主要情感类型
    let primaryEmotion = 'neutral';
    let maxCount = 0;
    Object.keys(emotionDistribution).forEach(type => {
      if (emotionDistribution[type] > maxCount) {
        maxCount = emotionDistribution[type];
        primaryEmotion = type;
      }
    });

    // 提取所有关键词并计算权重
    const keywordMap = {};
    emotions.forEach(emotion => {
      (emotion.keywords || []).forEach(keyword => {
        if (typeof keyword === 'string') {
          if (!keywordMap[keyword]) {
            keywordMap[keyword] = 0;
          }
          keywordMap[keyword]++;
        } else if (keyword.word) {
          if (!keywordMap[keyword.word]) {
            keywordMap[keyword.word] = 0;
          }
          keywordMap[keyword.word] += keyword.weight || 1;
        }
      });
    });

    // 转换为数组并排序
    const keywords = Object.keys(keywordMap).map(word => ({
      word,
      weight: keywordMap[word]
    })).sort((a, b) => b.weight - a.weight).slice(0, 20); // 取前20个关键词

    // 分析关注点
    let focusPointsResult = { success: false, data: { categoryWeights: [], focusPoints: [] } };
    try {
      // 调用关注点分析函数
      focusPointsResult = await userInterestAnalyzer.analyzeUserInterests(keywords, emotionRecords.data);
      console.log('关注点分析结果:', JSON.stringify(focusPointsResult));
    } catch (focusError) {
      console.error('关注点分析失败:', focusError);
      // 分析失败不影响主流程
    }

    // 计算情绪波动
    const intensities = emotions.map(e => e.intensity);
    const avgIntensity = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
    const intensityVariance = intensities.reduce((sum, val) => sum + Math.pow(val - avgIntensity, 2), 0) / intensities.length;
    const emotionalVolatility = Math.min(Math.round(Math.sqrt(intensityVariance) * 100), 100);

    // 准备图表数据
    const chartData = {
      emotionDistribution: Object.keys(emotionDistribution).map(type => ({
        type,
        count: emotionDistribution[type],
        percentage: (emotionDistribution[type] / emotions.length * 100).toFixed(1)
      })),
      intensityTrend: emotions.map(e => ({
        timestamp: e.timestamp,
        intensity: e.intensity,
        type: e.type
      })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    };

    // 使用智谱AI生成情感总结和建议
    const emotionTexts = emotions.map(e => e.text).filter(Boolean);
    const summaryPrompt = `
      我需要你分析以下文本中表达的情感，并生成一份简短的每日心情总结报告。
      文本内容：${emotionTexts.join(' ')}

      请以JSON格式返回以下内容：
      1. summary: 200字以内的情感总结，分析用户今天的主要情绪状态、可能的原因和变化趋势
      2. insights: 3-5条关于用户情绪模式的洞察
      3. suggestions: 3条针对用户情绪状态的建议
      4. fortune: 基于用户情绪生成的"今日运势"，包含"good"和"bad"各2项，分别表示宜做和忌做的事情
      5. encouragement: 一句鼓励的话

      确保返回的是有效的JSON格式，不要添加额外的解释或前缀。
    `;

    // 调用智谱AI生成报告内容
    const aiSummary = await bigModelModule.generateReportContent(summaryPrompt);

    // 解析AI返回的JSON
    let reportContent;
    try {
      if (aiSummary.success && aiSummary.result) {
        reportContent = aiSummary.result;
      } else {
        // 如果AI生成失败，使用默认内容
        reportContent = {
          summary: `今天您的主要情绪是${primaryEmotion}，情绪波动指数为${emotionalVolatility}。`,
          insights: ["您今天的情绪相对稳定", "关注点主要集中在工作和生活平衡上"],
          suggestions: ["尝试进行深呼吸放松练习", "与朋友交流可能会改善心情", "保持规律的作息有助于情绪稳定"],
          fortune: {
            good: ["放松心情", "与朋友交流"],
            bad: ["过度劳累", "钻牛角尖"]
          },
          encouragement: "每一天都是新的开始，相信自己能够创造更美好的明天！"
        };
      }
    } catch (parseError) {
      console.error('解析AI生成内容失败:', parseError);
      // 使用默认内容
      reportContent = {
        summary: `今天您的主要情绪是${primaryEmotion}，情绪波动指数为${emotionalVolatility}。`,
        insights: ["您今天的情绪相对稳定", "关注点主要集中在工作和生活平衡上"],
        suggestions: ["尝试进行深呼吸放松练习", "与朋友交流可能会改善心情", "保持规律的作息有助于情绪稳定"],
        fortune: {
          good: ["放松心情", "与朋友交流"],
          bad: ["过度劳累", "钻牛角尖"]
        },
        encouragement: "每一天都是新的开始，相信自己能够创造更美好的明天！"
      };
    }

    // 构建报告数据
    const reportData = {
      userId: userId,
      date: reportDate,
      emotionSummary: reportContent.summary,
      insights: reportContent.insights,
      suggestions: reportContent.suggestions,
      fortune: reportContent.fortune,
      encouragement: reportContent.encouragement,
      keywords: keywords,
      emotionalVolatility: emotionalVolatility,
      primaryEmotion: primaryEmotion,
      emotionCount: emotions.length,
      chartData: chartData,
      generatedAt: db.serverDate(),
      isRead: false
    };

    // 如果关注点分析成功，添加到报告数据中
    if (focusPointsResult.success && focusPointsResult.data) {
      // 添加关注点数据
      reportData.focusPoints = focusPointsResult.data.focusPoints || [];

      // 添加分类权重数据
      reportData.categoryWeights = focusPointsResult.data.categoryWeights || [];

      // 添加情感关联分析数据
      reportData.emotionalInsights = focusPointsResult.data.emotionalInsights || {
        positiveAssociations: [],
        negativeAssociations: []
      };

      // 更新图表数据，添加关注点分析图表
      reportData.chartData.focusDistribution = focusPointsResult.data.categoryWeights || [];
    }

    // 保存或更新报告
    let reportId;
    if (existingReport.data.length > 0) {
      // 更新现有报告
      reportId = existingReport.data[0]._id;
      await db.collection('userReports').doc(reportId).update({
        data: reportData
      });
    } else {
      // 创建新报告
      const result = await db.collection('userReports').add({
        data: reportData
      });
      reportId = result._id;
    }

    // 更新用户兴趣数据
    await updateUserInterests(userId, keywords);

    // 返回结果
    return {
      success: true,
      reportId: reportId,
      report: {
        ...reportData,
        _id: reportId
      },
      isNew: existingReport.data.length === 0
    };
  } catch (error) {
    console.error('生成每日报告失败:', error);
    return {
      success: false,
      error: error.message || '生成每日报告失败'
    };
  }
}

/**
 * 更新用户兴趣数据
 * @param {string} userId 用户ID
 * @param {Array} keywords 关键词数组
 * @returns {Promise<void>}
 */
async function updateUserInterests(userId, keywords) {
  try {
    const db = cloud.database();
    const _ = db.command;

    // 查询用户现有兴趣数据
    const userInterests = await db.collection('userInterests')
      .where({ userId: userId })
      .get();

    // 准备兴趣数据
    const now = db.serverDate();
    const interestData = {
      userId: userId,
      lastUpdated: now
    };

    // 如果已有兴趣数据，更新它
    if (userInterests.data.length > 0) {
      const existingInterest = userInterests.data[0];
      const existingKeywords = existingInterest.keywords || [];

      // 合并关键词
      const keywordMap = {};
      existingKeywords.forEach(kw => {
        keywordMap[kw.word] = kw.weight;
      });

      keywords.forEach(kw => {
        if (keywordMap[kw.word]) {
          keywordMap[kw.word] += kw.weight;
        } else {
          keywordMap[kw.word] = kw.weight;
        }
      });

      // 转换回数组并排序
      const updatedKeywords = Object.keys(keywordMap).map(word => ({
        word,
        weight: keywordMap[word],
        lastUpdated: now
      })).sort((a, b) => b.weight - a.weight);

      // 更新兴趣数据
      interestData.keywords = updatedKeywords;

      // 更新数据库
      await db.collection('userInterests').doc(existingInterest._id).update({
        data: interestData
      });
    } else {
      // 创建新的兴趣数据
      interestData.keywords = keywords.map(kw => ({
        ...kw,
        lastUpdated: now
      }));
      interestData.createTime = now;

      // 添加到数据库
      await db.collection('userInterests').add({
        data: interestData
      });
    }
  } catch (error) {
    console.error('更新用户兴趣数据失败:', error);
    // 不抛出异常，避免影响主流程
  }
}

/**
 * 分类关键词
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function classifyKeywords(event) {
  try {
    // 获取参数
    const { keywords, batch = false } = event;

    // 验证参数
    if (!keywords) {
      return {
        success: false,
        error: '关键词参数不能为空'
      };
    }

    let result;
    if (batch) {
      // 批量分类
      if (!Array.isArray(keywords)) {
        return {
          success: false,
          error: '批量分类时，关键词参数必须是数组'
        };
      }

      result = await keywordClassifier.batchClassifyKeywords(keywords);
      return {
        success: true,
        data: {
          classifications: result
        }
      };
    } else {
      // 单个关键词分类
      if (typeof keywords !== 'string') {
        return {
          success: false,
          error: '单个分类时，关键词参数必须是字符串'
        };
      }

      const category = await keywordClassifier.classifyKeyword(keywords);
      return {
        success: true,
        data: {
          keyword: keywords,
          category: category
        }
      };
    }
  } catch (error) {
    console.error('分类关键词失败:', error);
    return {
      success: false,
      error: error.message || '分类关键词失败'
    };
  }
}

/**
 * 获取预定义分类
 * @returns {Promise<Object>} 处理结果
 */
async function getPredefinedCategories() {
  try {
    const categories = keywordClassifier.getPredefinedCategories();
    return {
      success: true,
      data: {
        categories: categories
      }
    };
  } catch (error) {
    console.error('获取预定义分类失败:', error);
    return {
      success: false,
      error: error.message || '获取预定义分类失败'
    };
  }
}

/**
 * 关联关键词与情感
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function linkKeywordsToEmotion(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;
    const { keywords, emotionResult } = event;

    // 验证参数
    if (!Array.isArray(keywords) || keywords.length === 0 || !emotionResult) {
      return {
        success: false,
        error: '参数不完整'
      };
    }

    // 关联关键词与情感
    const success = await keywordEmotionLinker.linkKeywordsToEmotion(userId, keywords, emotionResult);

    // 查询更新后的用户兴趣数据
    const db = cloud.database();
    const updatedResult = await db.collection('userInterests')
      .where({ userId: userId })
      .get();

    return {
      success: success,
      message: success ? '关联关键词与情感成功' : '关联关键词与情感失败',
      data: {
        userId: userId,
        keywords: keywords,
        emotionResult: {
          type: emotionResult.type || emotionResult.primary_emotion,
          intensity: emotionResult.intensity,
          score: keywordEmotionLinker.calculateEmotionScore(emotionResult)
        },
        currentData: updatedResult.data && updatedResult.data.length > 0 ? updatedResult.data[0] : null
      }
    };
  } catch (error) {
    console.error('关联关键词与情感失败:', error);
    return {
      success: false,
      error: error.message || '关联关键词与情感失败'
    };
  }
}

/**
 * 获取关键词情感统计
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function getKeywordEmotionStats(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;

    // 获取关键词情感统计
    const stats = await keywordEmotionLinker.getKeywordEmotionStats(userId);

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('获取关键词情感统计失败:', error);
    return {
      success: false,
      error: error.message || '获取关键词情感统计失败'
    };
  }
}

/**
 * 获取聊天的情绪分析
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function getChatEmotionAnalysis(event) {
  try {
    // 获取参数
    const { chatId } = event;

    // 验证参数
    if (!chatId) {
      return {
        success: false,
        error: '聊天ID不能为空'
      };
    }

    // 从数据库中获取聊天记录
    const db = cloud.database();
    const _ = db.command;
    const messages = await db.collection('messages')
      .where({
        chatId: chatId
      })
      .orderBy('createTime', 'desc')
      .limit(20)
      .get();

    // 检查记录是否存在
    if (!messages || !messages.data || messages.data.length === 0) {
      return {
        success: false,
        error: '未找到聊天记录'
      };
    }

    // 提取所有用户消息的内容
    const userMessages = messages.data
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n');

    // 如果没有用户消息，返回错误
    if (!userMessages) {
      return {
        success: false,
        error: '未找到用户消息'
      };
    }

    // 分析用户消息的情绪
    const emotionResult = await analyzeEmotion({
      text: userMessages
    });

    return emotionResult;
  } catch (error) {
    console.error('获取聊天情绪分析失败:', error);
    return {
      success: false,
      error: error.message || '获取聊天情绪分析失败'
    };
  }
}

/**
 * 获取情绪记录分析
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function getEmotionRecordAnalysis(event) {
  try {
    // 获取参数
    const { recordId } = event;

    // 验证参数
    if (!recordId) {
      return {
        success: false,
        error: '记录ID不能为空'
      };
    }

    // 从数据库中获取情绪记录
    const db = cloud.database();
    const record = await db.collection('emotionRecords').doc(recordId).get();

    // 检查记录是否存在
    if (!record || !record.data) {
      return {
        success: false,
        error: '未找到情绪记录'
      };
    }

    // 返回情绪分析数据
    return {
      success: true,
      data: record.data.analysis
    };
  } catch (error) {
    console.error('获取情绪记录分析失败:', error);
    return {
      success: false,
      error: error.message || '获取情绪记录分析失败'
    };
  }
}

/**
 * 云函数入口
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
exports.main = async (event) => {
  const { type = 'emotion' } = event;

  console.log('analysis 云函数入口, type:', type);

  switch (type) {
    case 'emotion':
      return await analyzeEmotion(event);
    case 'keywords':
      return await extractTextKeywords(event);
    case 'word_vectors':
      return await getWordVectors(event);
    case 'cluster':
      return await clusterKeywords(event);
    case 'user_interests':
      return await analyzeUserInterests(event);
    case 'focus_points':
      return await analyzeFocusPoints(event);
    case 'daily_report':
      return await generateDailyReport(event);
    case 'classify_keywords':
      return await classifyKeywords(event);
    case 'get_categories':
      return await getPredefinedCategories();
    case 'link_keywords_emotion':
      return await linkKeywordsToEmotion(event);
    case 'get_keyword_emotion_stats':
      return await getKeywordEmotionStats(event);
    case 'emotion_record':
      return await getEmotionRecordAnalysis(event);
    case 'chat_emotion':
      return await getChatEmotionAnalysis(event);
    default:
      return {
        success: false,
        error: '未知的分析类型'
      };
  }
};
