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
  if (recorderManager) return;

  recorderManager = wx.getRecorderManager();

  // 监听录音开始事件
  recorderManager.onStart(() => {
    if (isDev) console.log('录音开始');
    isRecording = true;
    recognitionResult = ''; // 重置识别结果
  });

  // 监听录音结束事件
  recorderManager.onStop((res) => {
    if (isDev) console.log('录音结束', res);
    isRecording = false;

    // 发送结束帧
    if (socketTask && socketTask.readyState === 1) {
      sendEndFrame();
    }
  });

  // 监听录音错误事件
  recorderManager.onError((err) => {
    console.error('录音错误', err);
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
      sendAudioFrame(res.frameBuffer);
    }
  });
}

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

  // 创建新连接
  socketTask = wx.connectSocket({
    url: url,
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

  // 监听消息事件
  socketTask.onMessage((res) => {
    handleRecognitionResult(res.data);
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

      // 回调中间结果
      if (resultCallback) {
        resultCallback(recognitionResult);
      }

      // 如果是最终结果
      if (result.data.status === 2) {
        if (finalResultCallback) {
          finalResultCallback(recognitionResult);
        }

        // 关闭连接
        closeSocketConnection();
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
    // 保存回调函数
    resultCallback = onResult;
    errorCallback = onError;
    finalResultCallback = onFinalResult;

    // 初始化录音管理器
    initRecorderManager();

    // 获取WebSocket URL
    const url = await getWebSocketUrl();

    // 建立WebSocket连接
    connectWebSocket(url);

    // 开始录音
    recorderManager.start({
      duration: 60000, // 最长录音时间，单位ms
      sampleRate: 16000, // 采样率
      numberOfChannels: 1, // 录音通道数
      encodeBitRate: 48000, // 编码码率，必须在24000-96000之间
      format: 'pcm', // 音频格式
      frameSize: 5 // 指定帧大小，单位KB
    });
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
  if (isRecording && recorderManager) {
    recorderManager.stop();
  } else {
    closeSocketConnection();
  }
}

// 导出模块
module.exports = {
  startRecognition,
  stopRecognition
};
