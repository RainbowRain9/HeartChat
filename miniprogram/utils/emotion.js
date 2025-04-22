/**
 * 情感分析工具
 * 提供情感分析相关的功能，包括云函数调用和本地分析
 */

// 情感类型枚举
const EmotionTypes = {
  JOY: 'joy',
  SADNESS: 'sadness',
  ANGER: 'anger',
  ANXIETY: 'anxiety',
  NEUTRAL: 'neutral'
};

// 情感类型中文映射
const EmotionTypeLabels = {
  [EmotionTypes.JOY]: '喜悦',
  [EmotionTypes.SADNESS]: '伤感',
  [EmotionTypes.ANGER]: '愤怒',
  [EmotionTypes.ANXIETY]: '焦虑',
  [EmotionTypes.NEUTRAL]: '平静'
};

// 情感类型颜色映射
const EmotionTypeColors = {
  [EmotionTypes.JOY]: '#2ECC71',     // 绿色
  [EmotionTypes.SADNESS]: '#3498DB', // 蓝色
  [EmotionTypes.ANGER]: '#E74C3C',   // 红色
  [EmotionTypes.ANXIETY]: '#F1C40F', // 黄色
  [EmotionTypes.NEUTRAL]: '#95A5A6'  // 灰色
};

/**
 * 分析文本情感
 * @param {string} text 待分析文本
 * @returns {Promise<object>} 情感分析结果
 */
async function analyzeEmotion(text) {
  try {
    // 验证参数
    if (!text || typeof text !== 'string' || text.trim() === '') {
      console.warn('情感分析文本为空');
      return createDefaultResult();
    }

    // 调用云函数进行情感分析
    const result = await wx.cloud.callFunction({
      name: 'analysis',
      data: {
        type: 'emotion',
        text
      }
    });

    // 验证结果
    if (!result || !result.result || !result.result.success) {
      console.error('情感分析云函数返回错误:', result?.result?.error || '未知错误');
      return createDefaultResult();
    }

    // 处理结果
    const analysisResult = result.result.result;

    // 添加历史记录
    const history = getEmotionHistory();
    const newHistory = updateEmotionHistory(history, analysisResult);

    // 返回完整的情感分析结果
    return {
      type: analysisResult.type || EmotionTypes.NEUTRAL,
      intensity: analysisResult.intensity || 0.5,
      report: analysisResult.report || '无法生成情感报告',
      suggestions: analysisResult.suggestions || ['继续保持对话'],
      history: newHistory
    };
  } catch (err) {
    console.error('情感分析失败:', err);
    return createDefaultResult();
  }
}

/**
 * 使用本地简单算法进行情感分析（备选方案）
 * 当云函数不可用时使用
 * @param {string} text 待分析文本
 * @returns {object} 情感分析结果
 */
function analyzeEmotionLocal(text) {
  try {
    // 简单的关键词匹配
    const joyWords = ['开心', '高兴', '快乐', '喜悦', '兴奋', '愉快', '满意', '幸福', '欣喜', '欢乐'];
    const sadnessWords = ['伤心', '难过', '悲伤', '痛苦', '失落', '沮丧', '忧郁', '哀伤', '遗憾', '悲痛'];
    const angerWords = ['生气', '愤怒', '恼火', '烦躁', '暴怒', '不满', '恨', '怒火', '气愤', '恼怒'];
    const anxietyWords = ['焦虑', '担心', '紧张', '不安', '恐惧', '害怕', '忧虑', '惊慌', '惶恐', '慌张'];

    // 计算情绪得分
    const scores = {
      [EmotionTypes.JOY]: 0,
      [EmotionTypes.SADNESS]: 0,
      [EmotionTypes.ANGER]: 0,
      [EmotionTypes.ANXIETY]: 0,
      [EmotionTypes.NEUTRAL]: 0.2 // 默认有一点中性情绪
    };

    // 简单的关键词匹配
    joyWords.forEach(word => {
      if (text.includes(word)) scores[EmotionTypes.JOY] += 0.2;
    });

    sadnessWords.forEach(word => {
      if (text.includes(word)) scores[EmotionTypes.SADNESS] += 0.2;
    });

    angerWords.forEach(word => {
      if (text.includes(word)) scores[EmotionTypes.ANGER] += 0.2;
    });

    anxietyWords.forEach(word => {
      if (text.includes(word)) scores[EmotionTypes.ANXIETY] += 0.2;
    });

    // 找出得分最高的情绪
    let maxScore = 0;
    let maxType = EmotionTypes.NEUTRAL;

    for (const type in scores) {
      if (scores[type] > maxScore) {
        maxScore = scores[type];
        maxType = type;
      }
    }

    // 计算情绪强度（0-1之间）
    const intensity = Math.min(1, maxScore);

    // 生成情感报告
    const report = generateEmotionReport(maxType, intensity, text);

    // 生成建议
    const suggestions = generateSuggestions(maxType, intensity);

    // 添加历史记录
    const history = getEmotionHistory();
    const newHistory = updateEmotionHistory(history, { type: maxType, intensity });

    // 返回分析结果
    return {
      type: maxType,
      intensity: intensity,
      report: report,
      suggestions: suggestions,
      history: newHistory
    };
  } catch (error) {
    console.error('本地情感分析失败:', error);
    return createDefaultResult();
  }
}

/**
 * 生成情感报告
 * @param {string} emotionType 情绪类型
 * @param {number} intensity 情绪强度
 * @param {string} text 原始文本
 * @returns {string} 情感报告
 */
function generateEmotionReport(emotionType, intensity, text) {
  const intensityDesc = getIntensityDescription(intensity);
  const emotionLabel = getEmotionLabel(emotionType);
  
  let report = `您的情绪状态显示为${intensityDesc}的${emotionLabel}。`;
  
  switch (emotionType) {
    case EmotionTypes.JOY:
      report += '积极的情绪有助于提高生活质量和工作效率。';
      if (intensity > 0.7) {
        report += '您现在的心情非常愉快，这种状态对身心健康都很有益。';
      }
      break;
      
    case EmotionTypes.SADNESS:
      report += '感到悲伤是正常的情绪反应，允许自己感受这种情绪。';
      if (intensity > 0.7) {
        report += '如果这种情绪持续时间较长，建议寻求亲友或专业人士的支持。';
      }
      break;
      
    case EmotionTypes.ANGER:
      report += '愤怒是一种保护机制，但需要健康地表达和管理。';
      if (intensity > 0.7) {
        report += '强烈的愤怒可能影响判断，建议先冷静下来再做决定。';
      }
      break;
      
    case EmotionTypes.ANXIETY:
      report += '适度的焦虑是正常的，它可以帮助我们保持警觉。';
      if (intensity > 0.7) {
        report += '过度的焦虑可能影响日常生活，尝试一些放松技巧可能会有所帮助。';
      }
      break;
      
    default: // neutral
      report += '平静的情绪状态有助于理性思考和决策。';
  }
  
  return report;
}

/**
 * 根据情绪类型和强度生成建议
 * @param {string} emotionType 情绪类型
 * @param {number} intensity 情绪强度
 * @returns {string[]} 建议数组
 */
function generateSuggestions(emotionType, intensity) {
  const suggestions = [];
  
  switch (emotionType) {
    case EmotionTypes.JOY:
      suggestions.push('分享你的快乐，它会让你感觉更好');
      suggestions.push('记录这一刻，创建积极情绪的记忆库');
      if (intensity > 0.7) {
        suggestions.push('利用这种积极情绪，尝试一些平时不敢尝试的事情');
      }
      suggestions.push('感恩当下的美好，这会让快乐持续更久');
      break;
      
    case EmotionTypes.SADNESS:
      suggestions.push('允许自己感到悲伤，不要压抑情绪');
      suggestions.push('与亲友交流，分享你的感受');
      if (intensity > 0.7) {
        suggestions.push('如果悲伤持续较长时间，考虑寻求专业帮助');
      }
      suggestions.push('进行一些让你感到舒适的活动，如听音乐或散步');
      break;
      
    case EmotionTypes.ANGER:
      suggestions.push('深呼吸，数到10，给自己一点冷静的时间');
      suggestions.push('尝试换个角度思考问题');
      if (intensity > 0.7) {
        suggestions.push('暂时离开引起愤怒的环境，等情绪平静后再处理');
      }
      suggestions.push('通过运动或写作等方式释放情绪');
      break;
      
    case EmotionTypes.ANXIETY:
      suggestions.push('专注于当下，尝试一些简单的冥想或呼吸练习');
      suggestions.push('将担忧写下来，区分哪些是可以控制的，哪些是不可控的');
      if (intensity > 0.7) {
        suggestions.push('考虑与专业人士交流，学习更多应对焦虑的技巧');
      }
      suggestions.push('保持规律的作息和健康的生活方式');
      break;

    default: // neutral
      suggestions.push('尝试分享更多个人感受，增加交流深度');
      suggestions.push('提出开放性问题，促进对话');
      suggestions.push('关注对方的情绪变化，及时调整交流方式');
  }

  return suggestions;
}

/**
 * 创建默认的情感分析结果
 * @returns {object} 默认情感分析结果
 */
function createDefaultResult() {
  return {
    type: EmotionTypes.NEUTRAL,
    intensity: 0.5,
    report: '无法分析您当前的情绪状态，您的情绪似乎比较平稳。',
    suggestions: ['继续保持对话'],
    history: getEmotionHistory()
  };
}

/**
 * 获取情感历史记录
 * @returns {Array} 情感历史记录
 */
function getEmotionHistory() {
  try {
    const history = wx.getStorageSync('emotionHistory') || [];
    // 最多保留最近10条记录
    return Array.isArray(history) ? history.slice(-9) : [];
  } catch (err) {
    console.error('获取情感历史记录失败:', err);
    return [];
  }
}

/**
 * 更新情感历史记录
 * @param {Array} history 现有历史记录
 * @param {object} newEmotion 新的情感分析结果
 * @returns {Array} 更新后的历史记录
 */
function updateEmotionHistory(history, newEmotion) {
  try {
    // 创建新的历史记录项
    const historyItem = {
      type: newEmotion.type,
      intensity: newEmotion.intensity,
      timestamp: Date.now()
    };

    // 添加到历史记录
    const newHistory = [...history, historyItem];

    // 最多保留最近10条记录
    const limitedHistory = newHistory.slice(-10);

    // 保存到本地存储
    wx.setStorageSync('emotionHistory', limitedHistory);

    return limitedHistory;
  } catch (err) {
    console.error('更新情感历史记录失败:', err);
    return history;
  }
}

/**
 * 获取情感类型的中文标签
 * @param {string} type 情感类型
 * @returns {string} 情感类型中文标签
 */
function getEmotionLabel(type) {
  return EmotionTypeLabels[type] || '未知';
}

/**
 * 获取情感类型的颜色
 * @param {string} type 情感类型
 * @returns {string} 情感类型颜色
 */
function getEmotionColor(type) {
  return EmotionTypeColors[type] || '#95A5A6';
}

/**
 * 根据情感强度获取描述
 * @param {number} intensity 情感强度 (0-1)
 * @returns {string} 情感强度描述
 */
function getIntensityDescription(intensity) {
  if (intensity < 0.3) return '轻微';
  if (intensity < 0.6) return '中等';
  if (intensity < 0.8) return '较强';
  return '强烈';
}

module.exports = {
  analyzeEmotion,
  analyzeEmotionLocal,
  getEmotionLabel,
  getEmotionColor,
  getIntensityDescription,
  EmotionTypes,
  EmotionTypeLabels,
  EmotionTypeColors
};
