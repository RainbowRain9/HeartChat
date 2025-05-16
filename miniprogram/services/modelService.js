/**
 * 模型服务
 * 提供AI模型选择和管理功能
 *
 * @architecture 该模块实现了AI模型的选择和管理功能，支持在不同AI模型之间切换
 * @dependency cloudFuncCaller 云函数调用工具
 * @history 2025-05-01 初始版本
 * @history 2025-05-10 添加OpenAI模型支持
 * @history 2025-05-15 添加Crond和CloseAI模型支持，实现动态模型列表
 */

// 导入云函数调用工具
const cloudFuncCaller = require('./cloudFuncCaller');

// 是否为开发环境，控制日志输出
const isDev = true; // 设置为true可以开启详细日志

// 模型类型常量
const MODEL_TYPES = {
  ZHIPU: 'zhipu',     // 智谱AI
  GEMINI: 'gemini',   // Gemini
  OPENAI: 'openai',   // ChatGPT
  CROND: 'crond',     // ChatGPT (Crond)
  CLOSEAI: 'closeai', // DeepSeek
  CLAUDE: 'claude'    // Claude
};

// 默认模型类型
const DEFAULT_MODEL_TYPE = MODEL_TYPES.GEMINI; // 默认使用Google Gemini

// 本地缓存键
const MODEL_TYPE_KEY = 'selected_model_type';
const MODEL_LIST_KEY = 'model_list';
const MODEL_LIST_EXPIRY_KEY = 'model_list_expiry';

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
      return 'Gemini';
    case MODEL_TYPES.OPENAI:
      return 'ChatGPT';
    case MODEL_TYPES.CROND:
      return 'ChatGPT (Crond)';
    case MODEL_TYPES.CLOSEAI:
      return 'DeepSeek';
    case MODEL_TYPES.CLAUDE:
      return 'Claude';
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
        name: 'Gemini',
        models: ['gemini-2.5-flash-preview-04-17'],
        features: ['情感分析', '关键词提取', '多模态理解'],
        description: 'Gemini是一个强大的多模态AI模型，支持文本、图像等多种输入，提供高质量的对话生成和分析功能。'
      };
    case MODEL_TYPES.OPENAI:
      return {
        name: 'ChatGPT',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
        features: ['情感分析', '关键词提取', '用户画像', '高级推理'],
        description: 'ChatGPT提供业界领先的大语言模型，具有强大的理解能力和生成能力，支持多种语言和复杂任务。'
      };
    case MODEL_TYPES.CROND:
      return {
        name: 'ChatGPT (Crond)',
        models: ['gpt-4o-mini', 'deepseek-v3', 'o3-mini'],
        features: ['对话生成', '高级推理'],
        description: 'Crond API提供ChatGPT和其他大语言模型，支持高质量的对话生成和推理能力。'
      };
    case MODEL_TYPES.CLOSEAI:
      return {
        name: 'DeepSeek',
        models: ['deepseek-ai/DeepSeek-V3-0324'],
        features: ['对话生成', '中文理解'],
        description: 'DeepSeek提供先进的大语言模型，具有出色的中文理解能力和对话生成能力。'
      };
    case MODEL_TYPES.CLAUDE:
      return {
        name: 'Claude',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        features: ['对话生成', '上下文理解', '创意写作'],
        description: 'Claude是Anthropic公司开发的AI助手，擅长自然对话、创意写作和复杂推理，具有出色的上下文理解能力。'
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

/**
 * 获取模型列表
 * @param {string} modelType 模型类型
 * @param {boolean} forceRefresh 是否强制刷新
 * @returns {Promise<Array<string>>} 模型列表
 */
async function getModelList(modelType, forceRefresh = false) {
  try {
    // 验证模型类型
    if (!Object.values(MODEL_TYPES).includes(modelType)) {
      console.error('无效的模型类型:', modelType);
      return [];
    }

    // 检查缓存
    if (!forceRefresh) {
      const cachedList = wx.getStorageSync(`${MODEL_LIST_KEY}_${modelType}`);
      const expiry = wx.getStorageSync(`${MODEL_LIST_EXPIRY_KEY}_${modelType}`);

      // 如果缓存存在且未过期（24小时有效期）
      if (cachedList && expiry && Date.now() < expiry) {
        if (isDev) {
          console.log(`使用缓存的模型列表 (${modelType}):`, cachedList);
        }
        return cachedList;
      }
    }

    // 调用云函数获取模型列表
    const result = await cloudFuncCaller.callCloudFunc('chat', {
      action: 'getModelList',
      modelType: modelType
    });

    if (result && result.success && Array.isArray(result.models)) {
      // 缓存结果，24小时有效期
      wx.setStorageSync(`${MODEL_LIST_KEY}_${modelType}`, result.models);
      wx.setStorageSync(`${MODEL_LIST_EXPIRY_KEY}_${modelType}`, Date.now() + 24 * 60 * 60 * 1000);

      if (isDev) {
        console.log(`获取模型列表成功 (${modelType}):`, result.models);
      }

      return result.models;
    }

    // 如果API调用失败，返回默认配置中的模型列表
    const config = getModelConfig(modelType);
    return config.models || [];
  } catch (error) {
    console.error('获取模型列表失败:', error.message || error);

    // 出错时返回默认配置中的模型列表
    const config = getModelConfig(modelType);
    return config.models || [];
  }
}

/**
 * 获取当前选择的模型
 * @param {string} modelType 模型类型
 * @returns {string} 模型名称
 */
function getSelectedModel(modelType) {
  try {
    // 从本地缓存获取
    const modelName = wx.getStorageSync(`selected_model_${modelType}`);

    // 如果没有缓存，返回该类型的默认模型
    if (!modelName) {
      const config = getModelConfig(modelType);
      return config.models && config.models.length > 0 ? config.models[0] : '';
    }

    return modelName;
  } catch (error) {
    console.error('获取选择的模型失败:', error.message || error);

    // 出错时返回该类型的默认模型
    const config = getModelConfig(modelType);
    return config.models && config.models.length > 0 ? config.models[0] : '';
  }
}

/**
 * 设置当前选择的模型
 * @param {string} modelType 模型类型
 * @param {string} modelName 模型名称
 * @returns {boolean} 是否设置成功
 */
function setSelectedModel(modelType, modelName) {
  try {
    // 验证模型类型
    if (!Object.values(MODEL_TYPES).includes(modelType)) {
      console.error('无效的模型类型:', modelType);
      return false;
    }

    // 保存到本地缓存
    wx.setStorageSync(`selected_model_${modelType}`, modelName);

    if (isDev) {
      console.log(`设置模型成功: ${modelType} - ${modelName}`);
    }

    return true;
  } catch (error) {
    console.error('设置选择的模型失败:', error.message || error);
    return false;
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
  getModelConfig,
  getModelList,
  getSelectedModel,
  setSelectedModel
};
