// packageChat/components/chat-input/index.js
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
    recordingTimer: null
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
      this.setData({
        isRecording: true,
        recordingTime: 0
      });

      // 开始录音
      const recorderManager = wx.getRecorderManager();
      recorderManager.start({
        duration: 60000, // 最长录音时间，单位ms
        sampleRate: 16000, // 采样率
        numberOfChannels: 1, // 录音通道数
        encodeBitRate: 48000, // 编码码率
        format: 'mp3' // 音频格式
      });

      // 计时器
      this.data.recordingTimer = setInterval(() => {
        this.setData({
          recordingTime: this.data.recordingTime + 1
        });
      }, 1000);

      // 监听录音结束事件
      recorderManager.onStop((res) => {
        clearInterval(this.data.recordingTimer);
        this.setData({
          isRecording: false,
          recordingTime: 0
        });

        // 发送录音文件
        this.triggerEvent('sendVoice', { tempFilePath: res.tempFilePath, duration: res.duration });
      });
    },

    /**
     * 结束录音
     */
    recordEnd: function() {
      if (!this.data.isRecording) return;

      const recorderManager = wx.getRecorderManager();
      recorderManager.stop();
    },

    /**
     * 取消录音
     */
    recordCancel: function() {
      if (!this.data.isRecording) return;

      clearInterval(this.data.recordingTimer);
      this.setData({
        isRecording: false,
        recordingTime: 0
      });

      const recorderManager = wx.getRecorderManager();
      recorderManager.stop();

      // 不触发发送事件
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
