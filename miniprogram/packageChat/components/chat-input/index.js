// packageChat/components/chat-input/index.js
// 导入语音服务
const voiceService = require('../../../services/voiceService');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    placeholder: {
      type: String,
      value: '输入消息...'
    },
    disabled: {
      type: Boolean,
      value: false
    },
    darkMode: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    inputValue: '',
    isRecording: false,
    recordingTime: 0,
    recordingTimer: null,
    isRecognizing: false,
    recognitionText: '',
    showRecognitionResult: false
  },

  /**
   * 生命周期函数
   */
  lifetimes: {
    attached: function() {
      // 在组件实例进入页面节点树时执行
    },
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
      if (this.data.recordingTimer) {
        clearInterval(this.data.recordingTimer);
      }
    }
  },

  /**
   * 组件所在页面的生命周期函数
   */
  pageLifetimes: {
    show: function() {
      // 页面被显示时执行
    },
    hide: function() {
      // 页面被隐藏时执行
    },
    resize: function(size) {
      // 页面尺寸变化时执行
      console.log('页面尺寸变化:', size);
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 输入框内容变化
     * @param {Object} e 事件对象
     */
    input: function(e) {
      this.setData({
        inputValue: e.detail.value
      });
    },

    /**
     * 发送消息
     */
    send: function() {
      const { inputValue } = this.data;
      if (!inputValue.trim()) return;

      this.triggerEvent('send', { content: inputValue });
      this.setData({
        inputValue: ''
      });
    },

    /**
     * 确认发送（回车键）
     */
    confirm: function(e) {
      this.send();
    },

    /**
     * 开始录音
     */
    recordStart: function() {
      // 显示用户授权请求
      wx.authorize({
        scope: 'scope.record',
        success: () => {
          this._startVoiceRecognition();
        },
        fail: (err) => {
          console.error('获取录音权限失败', err);
          wx.showToast({
            title: '请授权录音权限',
            icon: 'none'
          });
        }
      });
    },

    /**
     * 开始语音识别
     * @private
     */
    _startVoiceRecognition: function() {
      this.setData({
        isRecording: true,
        recordingTime: 0,
        isRecognizing: true,
        recognitionText: '',
        showRecognitionResult: false
      });

      // 计时器
      this.data.recordingTimer = setInterval(() => {
        this.setData({
          recordingTime: this.data.recordingTime + 1
        });
      }, 1000);

      // 开始语音识别
      voiceService.startRecognition(
        // 识别结果回调
        (text) => {
          this.setData({
            recognitionText: text
          });
        },
        // 错误回调
        (error) => {
          console.error('语音识别错误', error);
          wx.showToast({
            title: '语音识别失败',
            icon: 'none'
          });
          this._resetRecordingState();
        },
        // 识别完成回调
        (finalText) => {
          if (finalText) {
            this.setData({
              inputValue: finalText,
              showRecognitionResult: true,
              isRecognizing: false
            });
          } else {
            this._resetRecordingState();
          }
        }
      );
    },

    /**
     * 结束录音
     */
    recordEnd: function() {
      if (!this.data.isRecording) return;

      clearInterval(this.data.recordingTimer);

      // 停止语音识别
      voiceService.stopRecognition();

      this.setData({
        isRecording: false,
        isRecognizing: true
      });

      // 延迟一下，等待最终识别结果
      setTimeout(() => {
        if (this.data.inputValue && this.data.inputValue.trim()) {
          // 如果有识别结果，直接发送
          this.triggerEvent('sendVoice', { content: this.data.inputValue });
          this.setData({
            inputValue: '',
            isRecognizing: false
          });
        } else {
          this._resetRecordingState();
          wx.showToast({
            title: '未能识别语音',
            icon: 'none'
          });
        }
      }, 500);
    },

    /**
     * 取消录音
     */
    recordCancel: function(e) {
      if (!this.data.isRecording) return;

      // 检测是否是上滑取消
      if (e && e.touches && e.touches[0]) {
        const touch = e.touches[0];
        const startY = e.currentTarget.dataset.startY || touch.clientY;

        // 如果上滑距离超过50px，则取消录音
        if (startY - touch.clientY > 50) {
          this._cancelRecording();
        }
      } else {
        this._cancelRecording();
      }
    },

    /**
     * 取消录音处理
     * @private
     */
    _cancelRecording: function() {
      clearInterval(this.data.recordingTimer);

      // 停止语音识别
      voiceService.stopRecognition();

      this._resetRecordingState();

      wx.showToast({
        title: '已取消',
        icon: 'none'
      });
    },

    /**
     * 重置录音状态
     * @private
     */
    _resetRecordingState: function() {
      this.setData({
        isRecording: false,
        recordingTime: 0,
        isRecognizing: false,
        recognitionText: '',
        showRecognitionResult: false
      });
    },

    /**
     * 输入框获取焦点
     */
    onFocus: function(e) {
      // 触发父组件的输入框获取焦点事件
      this.triggerEvent('focus', e.detail);
    },

    /**
     * 输入框失去焦点
     */
    onBlur: function(e) {
      // 触发父组件的输入框失去焦点事件
      this.triggerEvent('blur', e.detail);
    }
  }
})
