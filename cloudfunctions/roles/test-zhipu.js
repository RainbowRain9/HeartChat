// 测试智谱AI接口调用
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 测试智谱AI接口调用
 * 此函数用于测试roles云函数是否能成功调用智谱AI接口
 */
async function testZhipuAI() {
  try {
    // 从环境变量获取API密钥
    const apiKey = process.env.ZHIPU_API_KEY || '';
    if (!apiKey) {
      console.error('未设置ZHIPU_API_KEY环境变量');
      return {
        success: false,
        error: '智谱AI API密钥未配置'
      };
    }
    
    console.log('开始测试智谱AI接口调用');
    
    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    // 构建请求体
    const body = JSON.stringify({
      model: 'glm-4-flash',
      messages: [
        {
          role: 'user',
          content: '你好，这是一条测试消息。'
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });
    
    console.log('调用httpRequest云函数');
    
    // 发送请求
    const response = await cloud.callFunction({
      name: 'httpRequest',
      data: {
        url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        method: 'POST',
        headers: headers,
        body: body
      }
    });
    
    console.log('httpRequest云函数调用结果:', response);
    
    // 检查响应是否有错误
    if (response.result.error) {
      console.error('智谱AI返回错误:', response.result);
      return {
        success: false,
        error: `智谱AI调用失败: ${response.result.message || '未知错误'}`
      };
    }
    
    // 解析响应
    const result = JSON.parse(response.result.body);
    
    // 检查智谱AI响应是否有错误
    if (result.error) {
      console.error('智谱AI API返回错误:', result.error);
      return {
        success: false,
        error: `智谱AI API错误: ${result.error.message || result.error.type || '未知错误'}`
      };
    }
    
    // 提取AI回复
    const aiReply = result.choices[0].message.content;
    
    return {
      success: true,
      message: '智谱AI接口调用成功',
      reply: aiReply
    };
  } catch (error) {
    console.error('测试智谱AI接口调用失败:', error);
    return {
      success: false,
      error: error.message || '测试智谱AI接口调用失败'
    };
  }
}

// 导出测试函数
module.exports = {
  testZhipuAI
};
