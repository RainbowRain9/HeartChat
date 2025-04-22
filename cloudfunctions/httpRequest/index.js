// httpRequest 云函数
const cloud = require('wx-server-sdk');
const got = require('got');
const { testHttpRequest } = require('./test');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 发送HTTP请求
 * @param {Object} event - 请求参数
 * @param {string} event.url - 请求URL
 * @param {string} event.method - 请求方法 (GET, POST, PUT, DELETE等)
 * @param {Object} event.headers - 请求头
 * @param {string|Object} event.body - 请求体
 * @param {number} event.timeout - 超时时间(毫秒)
 * @returns {Promise<Object>} - 响应结果
 */
exports.main = async (event, context) => {
  // 如果是测试请求，调用测试函数
  if (event.action === 'test') {
    return await testHttpRequest();
  }

  const { url, method = 'GET', headers = {}, body, timeout = 30000 } = event;

  try {
    console.log(`发送HTTP请求: ${method} ${url}`);

    // 构建请求选项
    const options = {
      method: method.toUpperCase(),
      headers: headers,
      timeout: timeout
    };

    // 添加请求体
    if (body) {
      if (typeof body === 'string') {
        options.body = body;
      } else {
        options.json = body;
      }
    }

    // 发送请求
    const response = await got(url, options);

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      body: response.body
    };
  } catch (error) {
    console.error('HTTP请求失败:', error);

    return {
      error: true,
      statusCode: error.response?.statusCode || 500,
      message: error.message,
      body: error.response?.body || ''
    };
  }
};
