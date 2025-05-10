/**
 * 模型服务
 * 提供AI模型选择和管理功能
 *
 * @architecture 该模块实现了AI模型的选择和管理功能，支持在不同AI模型之间切换
 * @dependency cloudFuncCaller 云函数调用工具
 * @history 2025-05-01 初始版本
 */

// 导入云函数调用工具
const cloudFuncCaller = require('./cloudFuncCaller');

// 是否为开发环境，控制日志输出
const isDev = true; // 设置为true可以开启详细日志

// 模型类型常量
const MODEL_TYPES = {
  ZHIPU: 'zhipu',   // 智谱AI
  GEMINI: 'gemini'  // Google Gemini
};

// 默认模型类型
const DEFAULT_MODEL_TYPE = MODEL_TYPES.GEMINI; // 默认使用Google Gemini

// 本地缓存键
const MODEL_TYPE_KEY = 'selected_model_type';

/**
 * 获取当前选择的模型类型
 * @returns {string} 模型类型
 */
function getSelectedModelType() {
  try {
    // 从本地缓存获取
    const modelType = wx.getStorageSync(MODEL_TYPE_KEY);
    return modelType || DEFAULT_MODEL_TYPE;
  } catch (error) {
    console.error('获取模型类型失败:', error.message || error);
    return DEFAULT_MODEL_TYPE;
  }
}

/**
 * 设置当前选择的模型类型
 * @param {string} modelType 模型类型
 * @returns {boolean} 是否设置成功
 */
function setSelectedModelType(modelType) {
  try {
    // 验证模型类型
    if (!Object.values(MODEL_TYPES).includes(modelType)) {
      console.error('无效的模型类型:', modelType);
      return false;
    }

    // 保存到本地缓存
    wx.setStorageSync(MODEL_TYPE_KEY, modelType);

    if (isDev) {
      console.log('设置模型类型成功:', modelType);
    }

    return true;
  } catch (error) {
    console.error('设置模型类型失败:', error.message || error);
    return false;
  }
}

/**
 * 获取所有可用的模型类型
 * @returns {Array} 模型类型数组
 */
function getAvailableModelTypes() {
  return Object.values(MODEL_TYPES);
}

/**
 * 获取模型类型的显示名称
 * @param {string} modelType 模型类型
 * @returns {string} 显示名称
 */
function getModelDisplayName(modelType) {
  switch (modelType) {
    case MODEL_TYPES.ZHIPU:
      return '智谱AI';
    case MODEL_TYPES.GEMINI:
      return 'Google Gemini';
    default:
      return '未知模型';
  }
}

/**
 * 测试模型连接
 * @param {string} modelType 模型类型
 * @returns {Promise<Object>} 测试结果
 */
async function testModelConnection(modelType) {
  try {
    // 验证模型类型
    if (!Object.values(MODEL_TYPES).includes(modelType)) {
      return {
        success: false,
        error: '无效的模型类型'
      };
    }

    // 调用云函数测试连接
    const result = await cloudFuncCaller.callCloudFunc('chat', {
      action: 'testConnection',
      modelType: modelType
    });

    return result;
  } catch (error) {
    console.error('测试模型连接失败:', error.message || error);
    return {
      success: false,
      error: error.message || '测试模型连接失败'
    };
  }
}

/**
 * 获取模型配置信息
 * @param {string} modelType 模型类型
 * @returns {Object} 模型配置信息
 */
function getModelConfig(modelType) {
  switch (modelType) {
    case MODEL_TYPES.ZHIPU:
      return {
        name: '智谱AI',
        models: ['glm-4-flash', 'glm-4'],
        features: ['情感分析', '关键词提取', '用户画像'],
        description: '智谱AI提供高质量的对话生成和情感分析功能，支持中文语境的深度理解。'
      };
    case MODEL_TYPES.GEMINI:
      return {
        name: 'Google Gemini',
        models: ['gemini-2.5-flash-preview-04-17'],
        features: ['情感分析', '关键词提取', '多模态理解'],
        description: 'Google Gemini是一个强大的多模态AI模型，支持文本、图像等多种输入，提供高质量的对话生成和分析功能。'
      };
    default:
      return {
        name: '未知模型',
        models: [],
        features: [],
        description: '未知模型类型'
      };
  }
}

// 导出模块
module.exports = {
  MODEL_TYPES,
  DEFAULT_MODEL_TYPE,
  getSelectedModelType,
  setSelectedModelType,
  getAvailableModelTypes,
  getModelDisplayName,
  testModelConnection,
  getModelConfig
};
