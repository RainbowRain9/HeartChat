// pages/test-gemini/test-gemini.js
/**
 * Gemini API测试页面
 * 用于测试Gemini API的连接和功能
 */

// 获取应用实例
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    darkMode: false,
    testing: false,
    testResult: null,
    errorMessage: '',
    modelType: 'gemini', // 默认使用Gemini模型
    modelTypes: ['gemini', 'zhipu'],
    modelDisplayNames: {
      'gemini': 'Google Gemini',
      'zhipu': '智谱AI',
      'openai': 'OpenAI',
      'crond': 'OpenAI (Crond)',
      'closeai': 'DeepSeek AI'
    },
    testMessage: '你好，这是一个测试消息。',
    cloudInit: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 从全局获取暗黑模式设置
    this.setData({
      darkMode: app.globalData.darkMode,
      cloudInit: app.globalData.cloudInit
    });

    // 如果云环境未初始化，尝试初始化
    if (!this.data.cloudInit) {
      this.initCloud();
    }
  },

  /**
   * 初始化云环境
   */
  initCloud() {
    try {
      // 检查是否已经初始化
      if (!wx.cloud) {
        console.error('请使用 2.2.3 或以上的基础库以使用云能力');
        this.setData({
          errorMessage: '请使用 2.2.3 或以上的基础库以使用云能力'
        });
        return;
      }

      if (!wx.cloud.inited) {
        wx.cloud.init({
          env: app.globalData.cloudEnv || wx.cloud.DYNAMIC_CURRENT_ENV,
          traceUser: true,
        });
      }

      this.setData({
        cloudInit: true,
        errorMessage: ''
      });

      console.log('云环境初始化成功');
    } catch (error) {
      console.error('云环境初始化失败:', error);
      this.setData({
        errorMessage: '云环境初始化失败: ' + (error.message || error)
      });
    }
  },

  /**
   * 选择模型类型
   */
  onModelTypeChange(e) {
    this.setData({
      modelType: e.detail.value
    });
  },

  /**
   * 输入测试消息
   */
  onTestMessageInput(e) {
    this.setData({
      testMessage: e.detail.value
    });
  },

  /**
   * 测试Gemini API连接
   */
  testConnection() {
    // 检查云环境是否初始化
    if (!this.data.cloudInit) {
      this.initCloud();
      if (!this.data.cloudInit) {
        wx.showToast({
          title: '云环境未初始化',
          icon: 'none'
        });
        return;
      }
    }

    this.setData({
      testing: true,
      testResult: null,
      errorMessage: ''
    });

    // 调用云函数测试连接
    wx.cloud.callFunction({
      name: 'chat',
      data: {
        action: 'testConnection',
        modelType: this.data.modelType
      }
    })
    .then(res => {
      console.log('测试结果:', res);

      if (res.result && res.result.success) {
        this.setData({
          testResult: {
            success: true,
            message: res.result.message || `${this.data.modelType}模型连接测试成功`,
            reply: res.result.reply || '测试成功'
          }
        });
      } else {
        // 显示详细的错误信息
        let errorMessage = '测试失败';
        if (res.result && res.result.error) {
          errorMessage = res.result.error;
          // 如果错误信息是对象，转换为字符串
          if (typeof errorMessage === 'object') {
            try {
              errorMessage = JSON.stringify(errorMessage);
            } catch (e) {
              errorMessage = '无法解析的错误对象';
            }
          }
        }

        this.setData({
          testResult: {
            success: false,
            message: errorMessage
          }
        });
      }
    })
    .catch(err => {
      console.error('测试连接失败:', err);
      this.setData({
        testResult: {
          success: false,
          message: err.message || '测试连接失败'
        }
      });
    })
    .finally(() => {
      this.setData({
        testing: false
      });
    });
  },

  /**
   * 测试发送消息
   */
  testSendMessage() {
    // 检查云环境是否初始化
    if (!this.data.cloudInit) {
      this.initCloud();
      if (!this.data.cloudInit) {
        wx.showToast({
          title: '云环境未初始化',
          icon: 'none'
        });
        return;
      }
    }

    // 检查测试消息是否为空
    if (!this.data.testMessage.trim()) {
      wx.showToast({
        title: '请输入测试消息',
        icon: 'none'
      });
      return;
    }

    this.setData({
      testing: true,
      testResult: null,
      errorMessage: ''
    });

    // 调用云函数发送消息
    wx.cloud.callFunction({
      name: 'chat',
      data: {
        action: 'reply', // 使用reply操作，而不是generateAIReply
        message: this.data.testMessage,
        history: [],
        roleInfo: {
          prompt: '你是一个友好的AI助手，能够提供有用的信息和支持。'
        },
        includeEmotionAnalysis: false,
        modelType: this.data.modelType
      }
    })
    .then(res => {
      console.log('发送消息结果:', res);

      if (res.result && res.result.success) {
        this.setData({
          testResult: {
            success: true,
            message: '消息发送成功',
            reply: res.result.content || '测试成功'
          }
        });
      } else {
        // 显示详细的错误信息
        let errorMessage = '消息发送失败';
        if (res.result && res.result.error) {
          errorMessage = res.result.error;
          // 如果错误信息是对象，转换为字符串
          if (typeof errorMessage === 'object') {
            try {
              errorMessage = JSON.stringify(errorMessage);
            } catch (e) {
              errorMessage = '无法解析的错误对象';
            }
          }
        }

        this.setData({
          testResult: {
            success: false,
            message: errorMessage
          }
        });
      }
    })
    .catch(err => {
      console.error('发送消息失败:', err);
      this.setData({
        testResult: {
          success: false,
          message: err.message || '发送消息失败'
        }
      });
    })
    .finally(() => {
      this.setData({
        testing: false
      });
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  }
});
