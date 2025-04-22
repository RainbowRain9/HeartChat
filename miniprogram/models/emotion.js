/**
 * 情感分析模型
 * 定义情感分析相关的数据结构和常量
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

// 情感类型图标映射
const EmotionTypeIcons = {
  [EmotionTypes.JOY]: 'smile',
  [EmotionTypes.SADNESS]: 'frown',
  [EmotionTypes.ANGER]: 'angry',
  [EmotionTypes.ANXIETY]: 'meh',
  [EmotionTypes.NEUTRAL]: 'face-blank'
};

/**
 * 情感分析结果接口
 * @typedef {Object} EmotionAnalysisResult
 * @property {string} type - 情感类型
 * @property {number} intensity - 情感强度 (0-1)
 * @property {string[]} suggestions - 建议列表
 * @property {EmotionHistoryItem[]} [history] - 历史情感记录
 */

/**
 * 情感历史记录项接口
 * @typedef {Object} EmotionHistoryItem
 * @property {string} type - 情感类型
 * @property {number} intensity - 情感强度 (0-1)
 * @property {number} timestamp - 时间戳
 */

/**
 * 情感记录接口
 * @typedef {Object} EmotionRecord
 * @property {string} userId - 用户ID
 * @property {string} roleId - 角色ID
 * @property {string} roleName - 角色名称
 * @property {EmotionAnalysisResult} analysis - 情感分析结果
 * @property {Object[]} messages - 消息列表
 * @property {Date} createTime - 创建时间
 * @property {Date} updateTime - 更新时间
 */

/**
 * 获取情感类型的中文标签
 * @param {string} type - 情感类型
 * @returns {string} 情感类型中文标签
 */
function getEmotionLabel(type) {
  return EmotionTypeLabels[type] || '未知';
}

/**
 * 获取情感类型的颜色
 * @param {string} type - 情感类型
 * @returns {string} 情感类型颜色
 */
function getEmotionColor(type) {
  return EmotionTypeColors[type] || '#95A5A6';
}

/**
 * 获取情感类型的图标
 * @param {string} type - 情感类型
 * @returns {string} 情感类型图标
 */
function getEmotionIcon(type) {
  return EmotionTypeIcons[type] || 'face-blank';
}

/**
 * 根据情感强度获取描述
 * @param {number} intensity - 情感强度 (0-1)
 * @returns {string} 情感强度描述
 */
function getIntensityDescription(intensity) {
  if (intensity < 0.3) return '轻微';
  if (intensity < 0.6) return '中等';
  if (intensity < 0.8) return '较强';
  return '强烈';
}

/**
 * 创建默认的情感分析结果
 * @returns {EmotionAnalysisResult} 默认情感分析结果
 */
function createDefaultEmotionAnalysis() {
  return {
    type: EmotionTypes.NEUTRAL,
    intensity: 0.5,
    suggestions: ['继续保持对话']
  };
}

/**
 * 格式化情感分析结果为显示文本
 * @param {EmotionAnalysisResult} analysis - 情感分析结果
 * @returns {string} 格式化后的文本
 */
function formatEmotionAnalysis(analysis) {
  if (!analysis) return '无情感分析数据';

  const type = getEmotionLabel(analysis.type);
  const intensity = getIntensityDescription(analysis.intensity);

  return `${type}(${intensity})`;
}

// 导出模块
module.exports = {
  EmotionTypes,
  EmotionTypeLabels,
  EmotionTypeColors,
  EmotionTypeIcons,
  getEmotionLabel,
  getEmotionColor,
  getEmotionIcon,
  getIntensityDescription,
  createDefaultEmotionAnalysis,
  formatEmotionAnalysis
};
