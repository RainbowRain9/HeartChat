/**
 * 语音服务模块
 * 提供基于讯飞语音听写的语音识别功能
 */

// 是否为开发环境，控制日志输出
const isDev = true; // 设置为true可以开启详细日志

// 录音管理器实例
let recorderManager = null;
// WebSocket连接实例
let socketTask = null;
// 讯飞APPID
let IFLYTEK_APPID = '';
// 识别结果
let recognitionResult = '';
// 回调函数
let resultCallback = null;
let errorCallback = null;
let finalResultCallback = null;
// 录音状态
let isRecording = false;

/**
 * 初始化录音管理器
 * @private
 */
function initRecorderManager() {
  // 如果已经初始化过，直接返回
  if (recorderManager) {
    console.log('录音管理器已初始化，直接使用');
    return recorderManager;
  }

  try {
    // 获取录音管理器
    recorderManager = wx.getRecorderManager();
    console.log('初始化录音管理器成功');

    // 监听录音开始事件
    recorderManager.onStart(() => {
      console.log('录音开始事件触发');
      isRecording = true;
      recognitionResult = ''; // 重置识别结果

      // 立即发送业务参数帧，不等待WebSocket连接成功
      if (socketTask && socketTask.readyState === 1) {
        sendBusinessParamsFrame();
      }
    });

    // 监听录音结束事件
    recorderManager.onStop((res) => {
      console.log('录音结束事件触发', res);
      isRecording = false;

      // 发送结束帧
      if (socketTask && socketTask.readyState === 1) {
        sendEndFrame();
      }
    });

    // 监听录音错误事件
    recorderManager.onError((err) => {
      console.error('录音错误事件触发', err);
      isRecording = false;

      if (errorCallback) {
        errorCallback(err);
      }

      // 关闭WebSocket连接
      closeSocketConnection();
    });

    // 监听录音帧数据事件
    recorderManager.onFrameRecorded((res) => {
      if (!socketTask || socketTask.readyState !== 1) return;

      // 将音频数据发送到讯飞服务器
      if (res.frameBuffer && res.frameBuffer.byteLength > 0) {
        // 立即发送音频数据
        sendAudioFrame(res.frameBuffer);
      }
    });

    return recorderManager;
  } catch (err) {
    console.error('初始化录音管理器失败', err);
    throw err;
  }
}

// 提前初始化录音管理器，减少首次使用时的延迟
initRecorderManager();

/**
 * 获取讯飞WebSocket URL
 * @returns {Promise<string>} WebSocket URL
 * @private
 */
async function getWebSocketUrl() {
  try {
    const result = await wx.cloud.callFunction({
      name: 'getIflytekSttUrl'
    });

    if (result.result && result.result.success) {
      IFLYTEK_APPID = result.result.appid;
      return result.result.wssUrl;
    } else {
      throw new Error(result.result.error || '获取语音服务连接失败');
    }
  } catch (error) {
    console.error('获取WebSocket URL失败', error);
    throw error;
  }
}

/**
 * 建立WebSocket连接
 * @param {string} url WebSocket URL
 * @private
 */
function connectWebSocket(url) {
  // 关闭已有连接
  closeSocketConnection();

  // 创建新连接，使用更高优先级
  socketTask = wx.connectSocket({
    url: url,
    header: {
      'content-type': 'application/json'
    },
    tcpNoDelay: true, // 启用TCP_NODELAY，减少延迟
    perMessageDeflate: false, // 禁用消息压缩，减少处理时间
    success: () => {
      if (isDev) console.log('WebSocket连接创建成功');
    },
    fail: (err) => {
      console.error('WebSocket连接创建失败', err);
      if (errorCallback) {
        errorCallback(err);
      }
    }
  });

  // 监听连接打开事件
  socketTask.onOpen(() => {
    if (isDev) console.log('WebSocket连接已打开');
    // 发送业务参数帧
    sendBusinessParamsFrame();

    // 发送一些静音帧，帮助语音识别系统预热
    // 这样可以确保开头的内容不会被截断
    sendSilentFrames();
  });

  // 监听连接关闭事件
  socketTask.onClose(() => {
    if (isDev) console.log('WebSocket连接已关闭');
    socketTask = null;
  });

  // 监听连接错误事件
  socketTask.onError((err) => {
    console.error('WebSocket连接错误', err);
    if (errorCallback) {
      errorCallback(err);
    }
  });

  // 监听消息事件，优化处理逻辑
  socketTask.onMessage((res) => {
    // 立即处理识别结果
    if (res.data) {
      handleRecognitionResult(res.data);
    }
  });
}

/**
 * 发送业务参数帧
 * @private
 */
function sendBusinessParamsFrame() {
  if (!socketTask || socketTask.readyState !== 1) return;

  const frame = {
    common: {
      app_id: IFLYTEK_APPID
    },
    business: {
      language: 'zh_cn',
      domain: 'iat',
      accent: 'mandarin',
      vad_eos: 3000,
      dwa: 'wpgs',
      ptt: 1 // 添加标点
    },
    data: {
      status: 0,
      format: 'audio/L16;rate=16000',
      encoding: 'raw',
      audio: ''
    }
  };

  socketTask.send({
    data: JSON.stringify(frame),
    fail: (err) => {
      console.error('发送业务参数帧失败', err);
    }
  });
}

/**
 * 发送音频数据帧
 * @param {ArrayBuffer} buffer 音频数据
 * @private
 */
function sendAudioFrame(buffer) {
  if (!socketTask || socketTask.readyState !== 1) return;

  // 将ArrayBuffer转换为Base64
  const base64Audio = wx.arrayBufferToBase64(buffer);

  const frame = {
    data: {
      status: 1,
      format: 'audio/L16;rate=16000',
      encoding: 'raw',
      audio: base64Audio
    }
  };

  socketTask.send({
    data: JSON.stringify(frame),
    fail: (err) => {
      console.error('发送音频数据帧失败', err);
    }
  });
}

/**
 * 发送静音帧，帮助语音识别系统预热
 * @private
 */
function sendSilentFrames() {
  if (!socketTask || socketTask.readyState !== 1) return;

  console.log('发送静音帧预热');

  // 创建一个包含500ms静音的音频帧
  // 16000采样率 * 0.5秒 * 2字节/样本 = 16000字节
  const frameSize = 16000;
  const silentBuffer = new ArrayBuffer(frameSize);
  const silentView = new Uint8Array(silentBuffer);

  // 填充静音数据（PCM格式的静音是0）
  for (let i = 0; i < frameSize; i++) {
    silentView[i] = 0;
  }

  // 发送静音帧
  const frame = {
    data: {
      status: 1, // 1表示还有后续帧
      format: 'audio/L16;rate=16000',
      encoding: 'raw',
      audio: wx.arrayBufferToBase64(silentBuffer)
    }
  };

  socketTask.send({
    data: JSON.stringify(frame),
    fail: (err) => {
      console.error('发送静音帧失败', err);
    }
  });

  console.log('静音帧发送完成');
}

/**
 * 发送结束帧
 * @private
 */
function sendEndFrame() {
  if (!socketTask || socketTask.readyState !== 1) return;

  const frame = {
    data: {
      status: 2,
      format: 'audio/L16;rate=16000',
      encoding: 'raw',
      audio: ''
    }
  };

  socketTask.send({
    data: JSON.stringify(frame),
    fail: (err) => {
      console.error('发送结束帧失败', err);
    }
  });
}

/**
 * 处理识别结果
 * @param {string} data 识别结果数据
 * @private
 */
function handleRecognitionResult(data) {
  try {
    const result = JSON.parse(data);

    // 检查是否有错误
    if (result.code !== 0) {
      console.error('讯飞返回错误', result);
      if (errorCallback) {
        errorCallback(new Error(result.message || '语音识别失败'));
      }
      return;
    }

    // 提取识别文本
    let text = '';
    if (result.data && result.data.result && result.data.result.ws) {
      // 遍历每个词
      for (const word of result.data.result.ws) {
        // 取每个词的第一个候选结果
        if (word.cw && word.cw.length > 0) {
          text += word.cw[0].w;
        }
      }
    }

    // 根据讯飞的协议，处理不同类型的结果
    if (result.data && result.data.result) {
      if (result.data.result.pgs === 'rpl') {
        // 替换前一个结果
        recognitionResult = text;
      } else {
        // 追加结果
        recognitionResult += text;
      }

      // 立即回调中间结果，不等待
      if (resultCallback && recognitionResult) {
        resultCallback(recognitionResult);
      }

      // 如果是最终结果
      if (result.data.status === 2) {
        // 确保有最终结果再回调
        if (finalResultCallback && recognitionResult) {
          // 延迟回调最终结果，确保所有数据都已处理
          setTimeout(() => {
            finalResultCallback(recognitionResult);

            // 进一步延迟关闭连接，确保数据都已处理
            setTimeout(() => {
              closeSocketConnection();
            }, 200);
          }, 200);
        } else {
          // 延迟关闭连接
          setTimeout(() => {
            closeSocketConnection();
          }, 200);
        }
      }
    }
  } catch (error) {
    console.error('处理识别结果失败', error, data);
    if (errorCallback) {
      errorCallback(error);
    }
  }
}

/**
 * 关闭WebSocket连接
 * @private
 */
function closeSocketConnection() {
  if (socketTask) {
    try {
      socketTask.close();
    } catch (error) {
      console.error('关闭WebSocket连接失败', error);
    }
    socketTask = null;
  }
}

/**
 * 开始语音识别
 * @param {Function} onResult 识别结果回调
 * @param {Function} onError 错误回调
 * @param {Function} onFinalResult 最终结果回调
 */
async function startRecognition(onResult, onError, onFinalResult) {
  try {
    console.log('开始语音识别流程');

    // 保存回调函数
    resultCallback = onResult;
    errorCallback = onError;
    finalResultCallback = onFinalResult;

    // 重置识别结果
    recognitionResult = '';

    // 确保录音管理器已初始化
    if (!recorderManager) {
      initRecorderManager();
    }

    // 获取WebSocket URL
    const url = await getWebSocketUrl();
    console.log('获取WebSocket URL成功');

    // 建立WebSocket连接
    connectWebSocket(url);

    // 添加前置静音缓冲区
    // 在实际开始录音前，先添加一段静音，给语音识别系统预热时间
    // 这样可以确保开头的内容不会被截断
    console.log('准备开始录音');

    // 开始录音，优化参数确保捕获完整语音
    recorderManager.start({
      duration: 60000, // 最长录音时间，单位ms
      sampleRate: 16000, // 采样率
      numberOfChannels: 1, // 录音通道数
      encodeBitRate: 48000, // 编码码率，必须在24000-96000之间
      format: 'pcm', // 音频格式
      frameSize: 1, // 使用最小帧大小，提高响应速度和捕获率
      audioSource: 'auto', // 自动选择音频源
    });

    console.log('录音启动命令已发送');
  } catch (error) {
    console.error('开始语音识别失败', error);
    if (errorCallback) {
      errorCallback(error);
    }
  }
}

/**
 * 停止语音识别
 */
function stopRecognition() {
  console.log('停止语音识别函数被调用');

  if (recorderManager) {
    console.log('停止录音');

    // 直接停止录音，不再添加额外延迟
    // 组件中已经添加了足够的延迟
    recorderManager.stop();
    console.log('录音停止命令已发送');

    // 不要立即关闭连接，让识别结果回调处理关闭连接
  } else {
    console.warn('录音管理器不存在，无法停止录音');
    // 关闭WebSocket连接
    closeSocketConnection();
  }
}

// 导出模块
module.exports = {
  startRecognition,
  stopRecognition
};
