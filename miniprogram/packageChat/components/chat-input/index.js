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
    showRecognitionResult: false,
    isVoiceMode: false,  // 是否为语音输入模式
    isCancelling: false, // 是否正在取消录音
    waveSizes: [20, 30, 40, 30, 40, 30, 20] // 波形高度数组
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

      // 清理波形动画定时器
      if (this.waveAnimationTimer) {
        clearInterval(this.waveAnimationTimer);
      }

      // 确保语音识别已停止
      if (this.data.isRecording || this.data.isRecognizing) {
        voiceService.stopRecognition();
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
     * 切换输入模式（文本/语音）
     */
    switchInputMode: function() {
      this.setData({
        isVoiceMode: !this.data.isVoiceMode
      });
    },

    /**
     * 开始录音 - 添加按钮位置记录，用于滑出区域检测
     */
    recordStart: function(e) {
      console.log('触发录音开始');

      // 重置起始触摸位置
      this.startY = null;
      this.startX = null;

      // 记录起始触摸位置，用于判断上滑取消和滑出区域取消
      if (e && e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        this.startY = touch.clientY;
        this.startX = touch.clientX;
        console.log('记录起始位置 - X:', this.startX, 'Y:', this.startY);

        // 记录按钮位置和尺寸，用于判断是否滑出按钮区域
        this._recordButtonRect(e);
      } else {
        console.warn('无法获取起始触摸位置');
      }

      // 显示用户授权请求
      wx.authorize({
        scope: 'scope.record',
        success: () => {
          console.log('录音权限授权成功');

          // 重置取消状态
          this.setData({
            isCancelling: false
          });

          // 直接开始语音识别
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
     * 记录按钮位置和尺寸
     * @private
     */
    _recordButtonRect: function(e) {
      // 获取按钮元素
      const query = wx.createSelectorQuery().in(this);
      query.select('#voiceButton').boundingClientRect();
      query.exec((res) => {
        if (res && res[0]) {
          // 记录按钮的位置和尺寸
          this.buttonRect = res[0];
          console.log('按钮位置和尺寸:', this.buttonRect);
        } else {
          console.warn('无法获取按钮位置和尺寸');
        }
      });
    },

    /**
     * 开始波形动画
     * @private
     */
    _startWaveAnimation: function() {
      // 每200ms更新一次波形高度
      this.waveAnimationTimer = setInterval(() => {
        // 随机生成波形高度
        const newWaveSizes = this.data.waveSizes.map(() => {
          return Math.floor(Math.random() * 30) + 20; // 20-50之间的随机数
        });

        this.setData({
          waveSizes: newWaveSizes
        });
      }, 200);
    },

    /**
     * 开始语音识别
     * @private
     */
    _startVoiceRecognition: function() {
      console.log('开始语音识别函数被调用');

      // 立即开始波形动画
      this._startWaveAnimation();

      // 更新UI状态
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
      try {
        console.log('调用语音服务开始识别');
        voiceService.startRecognition(
          // 识别结果回调 - 不再更新输入框
          (text) => {
            console.log('收到识别结果:', text);
            // 只更新识别文本，不更新输入框
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
          // 识别完成回调 - 不再更新输入框
          (finalText) => {
            console.log('收到最终识别结果:', finalText);
            if (finalText) {
              // 不再更新输入框，只保存识别结果用于发送
              this.finalRecognitionResult = finalText;
              this.setData({
                // 不再显示确认框
                showRecognitionResult: false,
                isRecognizing: false
              });
            } else {
              this._resetRecordingState();
            }
          }
        );
      } catch (err) {
        console.error('启动语音识别失败', err);
        wx.showToast({
          title: '启动语音识别失败',
          icon: 'none'
        });
        this._resetRecordingState();
      }
    },

    /**
     * 结束录音 - 优化结束逻辑，确保正确处理取消状态
     */
    recordEnd: function() {
      // 如果不在录音状态，直接返回
      if (!this.data.isRecording) {
        console.log('不在录音状态，忽略结束录音');
        return;
      }

      // 停止波形动画
      if (this.waveAnimationTimer) {
        clearInterval(this.waveAnimationTimer);
      }

      clearInterval(this.data.recordingTimer);

      // 再次检查取消状态，确保最新状态
      if (this.data.isCancelling) {
        console.log('取消录音状态，执行取消');
        this._cancelRecording();
        return;
      }

      // 如果录音时间太短（小于0.5秒），可能是误触
      if (this.data.recordingTime === 0) {
        wx.showToast({
          title: '说话时间太短',
          icon: 'none'
        });
        this._resetRecordingState();
        return;
      }

      // 显示加载中，提供视觉反馈
      wx.showLoading({
        title: '识别中...',
        mask: true
      });

      // 设置状态为识别中，但不再录音
      this.setData({
        isRecording: false,
        isRecognizing: true,
        isCancelling: false // 确保取消状态被重置
      });

      // 震动反馈
      wx.vibrateShort({
        type: 'medium'
      });

      // 保存当前输入值，用于比较是否有新的识别结果
      const currentInputValue = this.data.inputValue;
      console.log('当前识别文本:', currentInputValue);

      // 停止语音识别，但增加更长的延迟
      // 这样可以确保捕获完整的语音内容，特别是开头的部分
      setTimeout(() => {
        // 再次检查是否已经取消，避免重复处理
        if (this.data.isCancelling) {
          console.log('延迟期间检测到取消状态，中止识别');
          wx.hideLoading();
          return;
        }

        voiceService.stopRecognition();

        // 进一步延长等待时间，确保能够获取完整的识别结果
        setTimeout(() => {
          wx.hideLoading();

          // 再次检查是否已经取消，避免重复处理
          if (this.data.isCancelling) {
            console.log('等待识别结果期间检测到取消状态，中止发送');
            return;
          }

          // 使用保存的最终识别结果，而不是输入框的值
          const finalResult = this.finalRecognitionResult || this.data.recognitionText;
          console.log('准备发送的识别文本:', finalResult);

          if (finalResult && finalResult.trim()) {
            // 如果有识别结果，直接发送
            this.triggerEvent('sendVoice', { content: finalResult });
            // 重置状态，确保输入框不会显示识别结果
            this._resetRecordingState();
            // 清除保存的最终识别结果
            this.finalRecognitionResult = null;
          } else {
            this._resetRecordingState();
            // 清除保存的最终识别结果
            this.finalRecognitionResult = null;
            wx.showToast({
              title: '未能识别语音',
              icon: 'none'
            });
          }
        }, 1000); // 增加等待时间到1秒，确保获取完整结果
      }, 200); // 先延迟200ms再停止录音，给系统更多时间处理
    },

    /**
     * 取消录音 - 添加滑出区域检测
     */
    recordCancel: function(e) {
      // 确保事件对象存在
      if (!e) {
        console.error('recordCancel: 事件对象为空');
        return;
      }

      // 如果不在录音状态，直接返回
      if (!this.data.isRecording) {
        console.log('不在录音状态，忽略取消');
        return;
      }

      // 获取取消阈值
      const cancelThreshold = e.currentTarget.dataset.cancelThreshold || 30;

      // 检查触摸点
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;

        // 检查是否滑出按钮区域
        if (this.buttonRect) {
          const isOutsideButton =
            currentX < this.buttonRect.left - 10 ||
            currentX > this.buttonRect.right + 10 ||
            currentY < this.buttonRect.top - 10 ||
            currentY > this.buttonRect.bottom + 10;

          if (isOutsideButton) {
            console.log('检测到滑出按钮区域，进入取消状态');

            // 如果滑出按钮区域，进入取消状态
            if (!this.data.isCancelling) {
              this.setData({
                isCancelling: true
              });

              // 震动反馈
              wx.vibrateShort({
                type: 'medium'
              });
            }

            return;
          }
        }

        // 如果没有滑出按钮区域，检查上滑取消
        // 如果没有记录起始位置，或者起始位置不合理，重新记录
        if (!this.startY || this.startY <= 0 || this.startY < currentY) {
          // 不要立即使用当前位置作为起始位置，而是使用稍微高一点的位置
          this.startY = currentY + cancelThreshold;
          console.log('重新记录起始位置Y:', this.startY, '(当前Y + 阈值)');
          return;
        }

        // 计算上滑距离
        const distance = this.startY - currentY;

        console.log('触摸移动 - 起始Y:', this.startY, '当前Y:', currentY, '上滑距离:', distance, '阈值:', cancelThreshold);

        // 判断是否达到上滑取消阈值
        const shouldCancel = distance > cancelThreshold;

        // 如果状态需要改变，才更新
        if (shouldCancel !== this.data.isCancelling) {
          console.log(shouldCancel ? '上滑达到阈值，进入取消状态' : '退出取消状态');

          this.setData({
            isCancelling: shouldCancel
          });

          // 进入取消状态时震动反馈
          if (shouldCancel) {
            wx.vibrateShort({
              type: 'medium'
            });
          }
        }
      } else if (e.type === 'touchcancel') {
        // 触摸被系统取消（如来电等），也视为取消录音
        console.log('触摸被系统取消，取消录音');
        this._cancelRecording();
      }
    },

    /**
     * 取消录音处理 - 优化取消逻辑，确保清除输入框内容
     * @private
     */
    _cancelRecording: function() {
      console.log('执行取消录音处理');

      // 停止波形动画
      if (this.waveAnimationTimer) {
        clearInterval(this.waveAnimationTimer);
      }

      clearInterval(this.data.recordingTimer);

      // 立即关闭WebSocket连接，不等待结果
      try {
        // 直接获取录音管理器并停止
        const recorderManager = wx.getRecorderManager();

        // 先停止录音
        recorderManager.stop();

        // 确保取消状态被正确设置
        this.setData({
          isCancelling: true,
          // 立即清除输入框内容，确保不会显示语音识别结果
          inputValue: ''
        });

        // 清除保存的最终识别结果
        this.finalRecognitionResult = null;

        // 延迟一下再重置状态，确保录音确实停止
        setTimeout(() => {
          // 重置状态
          this._resetRecordingState();

          // 震动反馈
          wx.vibrateShort({
            type: 'light'
          });

          wx.showToast({
            title: '已取消',
            icon: 'none'
          });
        }, 100);
      } catch (e) {
        console.error('停止录音失败', e);
        // 即使出错也要重置状态
        this._resetRecordingState();
      }
    },

    /**
     * 重置录音状态 - 确保清除输入框内容
     * @private
     */
    _resetRecordingState: function() {
      // 清除所有录音相关状态，包括输入框内容
      this.setData({
        isRecording: false,
        recordingTime: 0,
        isRecognizing: false,
        recognitionText: '',
        showRecognitionResult: false,
        isCancelling: false,
        // 确保输入框内容不会显示语音识别结果
        inputValue: ''
      });

      // 重置起始触摸位置
      this.startY = 0;

      // 清除保存的最终识别结果
      this.finalRecognitionResult = null;
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
