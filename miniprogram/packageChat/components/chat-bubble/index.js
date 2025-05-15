// packageChat/components/chat-bubble/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    message: {
      type: Object,
      value: {}
    },
    isSender: {
      type: Boolean,
      value: false
    },
    showTime: {
      type: Boolean,
      value: false
    },
    showEmotionTag: {
      type: Boolean,
      value: false
    },
    darkMode: {
      type: Boolean,
      value: false
    },
    bubbleStyle: {
      type: String,
      value: 'default'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    formattedTime: '',
    currentBubbleStyle: 'default' // 当前气泡样式
  },

  /**
   * 数据监听器
   */
  observers: {
    'message.timestamp': function(timestamp) {
      if (timestamp) {
        this.formatTime(timestamp);
      }
    },
    'bubbleStyle': function(newStyle) {
      if (newStyle) {
        this.setData({
          currentBubbleStyle: newStyle
        });
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 格式化时间
     * @param {number} timestamp 时间戳
     */
    formatTime(timestamp) {
      try {
        // 将timestamp转换为数字
        const ts = parseInt(timestamp);

        // 检查timestamp是否有效
        if (!ts || isNaN(ts)) {
          console.log('无效时间戳:', timestamp);
          this.setData({
            formattedTime: ''
          });
          return;
        }

        const date = new Date(ts);

        // 检查date是否有效
        if (date.toString() === 'Invalid Date') {
          console.log('无效日期:', timestamp);
          this.setData({
            formattedTime: ''
          });
          return;
        }

        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        this.setData({
          formattedTime: `${hours}:${minutes}`
        });

        console.log('格式化时间成功:', timestamp, ' -> ', `${hours}:${minutes}`);
      } catch (error) {
        console.error('格式化时间失败:', error);
        this.setData({
          formattedTime: ''
        });
      }
    },

    /**
     * 设置气泡样式
     * @param {string} style 气泡样式，可选值：default, rounded, square
     */
    setBubbleStyle(style) {
      if (style && ['default', 'rounded', 'square'].includes(style)) {
        this.setData({
          currentBubbleStyle: style
        });
      }
    },

    /**
     * 长按消息
     */
    handleLongPress() {
      wx.showActionSheet({
        itemList: ['复制', '删除'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 复制消息
            wx.setClipboardData({
              data: this.properties.message.content,
              success: () => {
                wx.showToast({
                  title: '复制成功',
                  icon: 'success'
                });
              }
            });
          } else if (res.tapIndex === 1) {
            // 删除消息
            this.triggerEvent('delete', { messageId: this.properties.message._id });
          }
        }
      });
    }
  }
})
