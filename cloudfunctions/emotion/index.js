// emotion 云函数 index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

/**
 * 获取情绪概览
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function getEmotionOverview(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;
    
    // 获取最近一周的情绪记录
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const emotionRecords = await db.collection('emotionRecords')
      .where({
        userId: userId,
        createTime: _.gte(oneWeekAgo)
      })
      .orderBy('createTime', 'desc')
      .get();
    
    // 处理情绪数据
    const emotionData = processEmotionData(emotionRecords.data || []);
    
    return {
      success: true,
      data: emotionData
    };
  } catch (error) {
    console.error('获取情绪概览失败:', error);
    return {
      success: false,
      error: error.message || '获取情绪概览失败'
    };
  }
}

/**
 * 处理情绪数据
 * @param {Array} records 情绪记录
 * @returns {Object} 处理后的情绪数据
 */
function processEmotionData(records) {
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
  
  // 转换为数组格式
  const emotionArray = Object.entries(emotionCounts).map(([emotion, count]) => ({
    emotion,
    count,
    percentage: totalRecords > 0 ? (count / totalRecords) * 100 : 0
  }));
  
  // 按出现次数排序
  emotionArray.sort((a, b) => b.count - a.count);
  
  // 提取标签、数值和颜色
  const labels = emotionArray.map(item => item.emotion);
  const values = emotionArray.map(item => item.count);
  
  // 情绪对应的颜色
  const colorMap = {
    '疲惫': '#ffc107',
    '压力': '#f56565',
    '担忧': '#4299e1',
    '焦虑': '#ed64a6',
    '平静': '#48bb78',
    '满足': '#9f7aea',
    '快乐': '#38b2ac',
    '愤怒': '#e53e3e',
    '悲伤': '#718096',
    '期待': '#ecc94b',
    '惊讶': '#667eea',
    '恐惧': '#805ad5',
    '未知': '#a0aec0'
  };
  
  const colors = labels.map(label => colorMap[label] || '#a0aec0');
  
  // 获取主要情绪和次要情绪
  const mainEmotion = emotionArray.length > 0 ? emotionArray[0].emotion : '未知';
  const secondEmotion = emotionArray.length > 1 ? emotionArray[1].emotion : null;
  
  return {
    labels,
    values,
    colors,
    mainEmotion,
    secondEmotion,
    emotionArray
  };
}

/**
 * 获取情绪历史
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function getEmotionHistory(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;
    
    // 获取参数
    const { days = 30, limit = 100 } = event;
    
    // 获取指定天数前的日期
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // 查询情绪记录
    const emotionRecords = await db.collection('emotionRecords')
      .where({
        userId: userId,
        createTime: _.gte(startDate)
      })
      .orderBy('createTime', 'asc')
      .limit(limit)
      .get();
    
    // 处理情绪历史数据
    const historyData = processEmotionHistory(emotionRecords.data || []);
    
    return {
      success: true,
      data: historyData
    };
  } catch (error) {
    console.error('获取情绪历史失败:', error);
    return {
      success: false,
      error: error.message || '获取情绪历史失败'
    };
  }
}

/**
 * 处理情绪历史数据
 * @param {Array} records 情绪记录
 * @returns {Object} 处理后的情绪历史数据
 */
function processEmotionHistory(records) {
  // 按日期分组
  const dateGroups = {};
  
  records.forEach(record => {
    const date = new Date(record.createTime);
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    
    if (!dateGroups[dateStr]) {
      dateGroups[dateStr] = [];
    }
    
    dateGroups[dateStr].push(record);
  });
  
  // 处理每日情绪数据
  const dailyData = Object.entries(dateGroups).map(([date, dayRecords]) => {
    // 计算当日主要情绪
    const emotionCounts = {};
    
    dayRecords.forEach(record => {
      const mainEmotion = record.mainEmotion || '未知';
      emotionCounts[mainEmotion] = (emotionCounts[mainEmotion] || 0) + 1;
    });
    
    // 找出出现次数最多的情绪
    let maxCount = 0;
    let mainEmotion = '未知';
    
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mainEmotion = emotion;
      }
    });
    
    // 计算情绪值 (简单映射到 -100 到 100 的范围)
    const emotionValueMap = {
      '快乐': 100,
      '满足': 80,
      '平静': 60,
      '期待': 40,
      '惊讶': 20,
      '未知': 0,
      '担忧': -20,
      '疲惫': -40,
      '焦虑': -60,
      '悲伤': -80,
      '压力': -90,
      '愤怒': -95,
      '恐惧': -100
    };
    
    const emotionValue = emotionValueMap[mainEmotion] || 0;
    
    return {
      date,
      mainEmotion,
      emotionValue,
      recordCount: dayRecords.length
    };
  });
  
  // 按日期排序
  dailyData.sort((a, b) => a.date.localeCompare(b.date));
  
  // 提取图表数据
  const dates = dailyData.map(item => item.date);
  const values = dailyData.map(item => item.emotionValue);
  const emotions = dailyData.map(item => item.mainEmotion);
  
  return {
    dailyData,
    chartData: {
      dates,
      values,
      emotions
    }
  };
}

// 主函数入口
exports.main = async (event, context) => {
  const { action } = event;
  
  switch (action) {
    case 'getEmotionOverview':
      return await getEmotionOverview(event);
    case 'getEmotionHistory':
      return await getEmotionHistory(event);
    default:
      return {
        success: false,
        error: '未知的操作类型'
      };
  }
};
