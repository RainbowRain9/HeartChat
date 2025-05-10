/**
 * 云函数调用工具
 * 提供统一的云函数调用接口，包含错误处理和日志记录
 */

// 是否为开发环境，控制日志输出
const isDev = true; // 设置为true可以开启详细日志

/**
 * 调用云函数
 * @param {string} name 云函数名称
 * @param {Object} data 云函数参数
 * @param {Object} options 调用选项
 * @param {boolean} options.showLoading 是否显示加载提示
 * @param {string} options.loadingText 加载提示文本
 * @param {boolean} options.showError 是否显示错误提示
 * @returns {Promise<Object>} 云函数返回结果
 */
async function callCloudFunc(name, data = {}, options = {}) {
  // 默认选项
  const defaultOptions = {
    showLoading: false,
    loadingText: '处理中...',
    showError: true
  };

  // 合并选项
  const mergedOptions = { ...defaultOptions, ...options };

  // 显示加载提示
  if (mergedOptions.showLoading) {
    wx.showLoading({
      title: mergedOptions.loadingText,
      mask: true
    });
  }

  try {
    if (isDev) {
      console.log(`调用云函数 ${name}:`, data);
    }

    // 调用云函数
    const result = await wx.cloud.callFunction({
      name,
      data
    });

    // 处理结果
    if (result && result.result) {
      if (isDev) {
        console.log(`云函数 ${name} 返回:`, result.result);
      }

      // 如果云函数返回错误
      if (result.result.error && mergedOptions.showError) {
        wx.showToast({
          title: result.result.error,
          icon: 'none',
          duration: 2000
        });
      }

      return result.result;
    } else {
      console.error(`云函数 ${name} 返回无效结果`);

      if (mergedOptions.showError) {
        wx.showToast({
          title: '服务调用失败',
          icon: 'none',
          duration: 2000
        });
      }

      return { success: false, error: '无效的云函数返回结果' };
    }
  } catch (error) {
    console.error(`云函数 ${name} 调用异常:`, error.message || error);

    if (mergedOptions.showError) {
      wx.showToast({
        title: error.message || '服务调用异常',
        icon: 'none',
        duration: 2000
      });
    }

    return { success: false, error: error.message || '云函数调用异常' };
  } finally {
    // 隐藏加载提示
    if (mergedOptions.showLoading) {
      wx.hideLoading();
    }
  }
}

/**
 * 批量调用云函数
 * @param {Array} calls 云函数调用数组，每个元素包含name和data字段
 * @param {Object} options 调用选项
 * @returns {Promise<Array>} 云函数返回结果数组
 */
async function batchCallCloudFunc(calls, options = {}) {
  if (!Array.isArray(calls) || calls.length === 0) {
    return [];
  }

  // 默认选项
  const defaultOptions = {
    showLoading: false,
    loadingText: '批量处理中...',
    showError: true,
    parallel: true // 是否并行调用
  };

  // 合并选项
  const mergedOptions = { ...defaultOptions, ...options };

  // 显示加载提示
  if (mergedOptions.showLoading) {
    wx.showLoading({
      title: mergedOptions.loadingText,
      mask: true
    });
  }

  try {
    if (isDev) {
      console.log(`批量调用云函数:`, calls);
    }

    let results;

    // 并行或串行调用
    if (mergedOptions.parallel) {
      // 并行调用
      const promises = calls.map(call =>
        callCloudFunc(call.name, call.data, { ...mergedOptions, showLoading: false, showError: false })
      );
      results = await Promise.all(promises);
    } else {
      // 串行调用
      results = [];
      for (const call of calls) {
        const result = await callCloudFunc(call.name, call.data, { ...mergedOptions, showLoading: false, showError: false });
        results.push(result);
      }
    }

    if (isDev) {
      console.log(`批量云函数调用完成:`, results);
    }
    return results;
  } catch (error) {
    console.error(`批量云函数调用异常:`, error.message || error);

    if (mergedOptions.showError) {
      wx.showToast({
        title: error.message || '批量服务调用异常',
        icon: 'none',
        duration: 2000
      });
    }

    return [];
  } finally {
    // 隐藏加载提示
    if (mergedOptions.showLoading) {
      wx.hideLoading();
    }
  }
}

// 导出模块
module.exports = {
  callCloudFunc,
  batchCallCloudFunc
};
