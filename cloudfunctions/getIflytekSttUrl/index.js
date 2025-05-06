// 讯飞语音听写WebSocket URL生成云函数
const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 生成讯飞语音听写WebSocket URL
 * 基于讯飞开放平台WebAPI 2.0协议
 * 参考文档: https://www.xfyun.cn/doc/asr/voicedictation/API.html
 */
exports.main = async (event, context) => {
  try {
    // 从环境变量获取讯飞API配置
    // 实际使用时请在云开发控制台设置这些环境变量
    const APPID = process.env.IFLYTEK_APPID || '60f9a524';
    const API_SECRET = process.env.IFLYTEK_API_SECRET || 'ZDk4Yjg4NzNmZDk3NjgzZjgwNjYwYTFm';
    const API_KEY = process.env.IFLYTEK_API_KEY || '4feb62558a6751514bb884b0c9832030';

    // 检查API配置
    if (!APPID || !API_SECRET || !API_KEY) {
      console.error('缺少讯飞API配置');
      return {
        success: false,
        error: '语音服务配置错误'
      };
    }

    // 1. 获取当前UTC时间，并格式化为RFC1123格式
    const date = new Date().toUTCString();
    
    // 2. 定义请求的主机名和路径
    const host = 'iat-api.xfyun.cn';
    const requestLine = '/v2/iat';
    
    // 3. 构造待签名的字符串
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${requestLine} HTTP/1.1`;
    
    // 4. 使用HMAC-SHA256算法对待签名字符串进行加密
    const signatureSha = crypto.createHmac('sha256', API_SECRET)
      .update(signatureOrigin)
      .digest('base64');
    
    // 5. 构造authorization_origin字符串
    const authorizationOrigin = `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
    
    // 6. 将authorization_origin进行Base64编码获得最终的authorization
    const authorization = Buffer.from(authorizationOrigin).toString('base64');
    
    // 7. 拼接完整的WebSocket URL
    const wssUrl = `wss://${host}${requestLine}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
    
    // 返回成功结果
    return {
      success: true,
      wssUrl: wssUrl,
      appid: APPID
    };
  } catch (error) {
    // 记录错误日志
    console.error('生成讯飞WebSocket URL失败:', error);
    
    // 返回错误信息
    return {
      success: false,
      error: error.message || '生成语音服务连接失败'
    };
  }
};
