// 测试httpRequest云函数
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 测试httpRequest云函数
 * 此函数用于测试httpRequest云函数是否能正常工作
 */
async function testHttpRequest() {
  try {
    console.log('开始测试httpRequest云函数');
    
    // 发送GET请求到一个公共API
    const response = await cloud.callFunction({
      name: 'httpRequest',
      data: {
        url: 'https://httpbin.org/get',
        method: 'GET'
      }
    });
    
    console.log('httpRequest云函数调用结果:', response);
    
    // 检查响应是否有错误
    if (response.result.error) {
      console.error('httpRequest返回错误:', response.result);
      return {
        success: false,
        error: `httpRequest调用失败: ${response.result.message || '未知错误'}`
      };
    }
    
    return {
      success: true,
      message: 'httpRequest云函数调用成功',
      result: response.result
    };
  } catch (error) {
    console.error('测试httpRequest云函数失败:', error);
    return {
      success: false,
      error: error.message || '测试httpRequest云函数失败'
    };
  }
}

// 导出测试函数
module.exports = {
  testHttpRequest
};
