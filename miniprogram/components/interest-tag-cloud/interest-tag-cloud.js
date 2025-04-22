// components/interest-tag-cloud/interest-tag-cloud.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    userId: {
      type: String,
      value: ''
    },
    maxTags: {
      type: Number,
      value: 20
    },
    minFontSize: {
      type: Number,
      value: 12
    },
    maxFontSize: {
      type: Number,
      value: 24
    },
    colorMap: {
      type: Object,
      value: {
        '学习': '#4285F4', // 蓝色
        '工作': '#34A853', // 绿色
        '娱乐': '#FBBC05', // 黄色
        '社交': '#EA4335', // 红色
        '健康': '#42A5F5', // 浅蓝色
        '生活': '#66BB6A', // 浅绿色
        '未分类': '#9E9E9E'  // 灰色
      }
    },
    darkModeColorMap: {
      type: Object,
      value: {
        '学习': '#74b9ff', // 暗夜蓝色
        '工作': '#55efc4', // 暗夜绿色
        '娱乐': '#ffeaa7', // 暗夜黄色
        '社交': '#ff7675', // 暗夜红色
        '健康': '#81ecec', // 暗夜浅蓝色
        '生活': '#81ecec', // 暗夜浅绿色
        '未分类': '#a0aec0'  // 暗夜灰色
      }
    },
    showCategory: {
      type: Boolean,
      value: true
    },
    autoRefresh: {
      type: Boolean,
      value: false
    },
    darkMode: {
      type: Boolean,
      value: false
    },
    showTitle: {
      type: Boolean,
      value: true
    },
    showRefreshButton: {
      type: Boolean,
      value: true
    },
    // 是否使用分类数据而不是关键词数据
    useCategories: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    tags: [],
    loading: false,
    error: null,
    randomColors: [
      '#4285F4', // 蓝色
      '#34A853', // 绿色
      '#FBBC05', // 黄色
      '#EA4335', // 红色
      '#42A5F5', // 浅蓝色
      '#66BB6A', // 浅绿色
      '#FF9800', // 橙色
      '#9C27B0', // 紫色
      '#00BCD4', // 青色
      '#FF5722'  // 深橙色
    ],
    darkModeRandomColors: [
      '#74b9ff', // 暗夜蓝色
      '#55efc4', // 暗夜绿色
      '#ffeaa7', // 暗夜黄色
      '#ff7675', // 暗夜红色
      '#81ecec', // 暗夜浅蓝色
      '#a0b9c0', // 暗夜浅绿色
      '#ffa502', // 暗夜橙色
      '#a29bfe', // 暗夜紫色
      '#00cec9', // 暗夜青色
      '#fd79a8'  // 暗夜粉色
    ]
  },

  /**
   * 组件的生命周期
   */
  lifetimes: {
    attached() {
      // 在组件实例进入页面节点树时执行
      if (this.data.autoRefresh) {
        this.loadTags();
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 加载标签数据
     * @param {boolean} forceRefresh 是否强制刷新
     */
    async loadTags(forceRefresh = false) {
      const userId = this.data.userId;
      if (!userId) {
        this.setData({
          error: '用户ID不能为空'
        });
        return;
      }

      this.setData({
        loading: true,
        error: null
      });

      try {
        // 引入用户兴趣服务
        const userInterestsService = require('../../services/userInterestsService');

        // 获取标签云数据，传递 useCategories 参数
        const tagCloudData = await userInterestsService.getInterestTagCloudData(userId, forceRefresh, this.data.useCategories);

        if (!tagCloudData || tagCloudData.length === 0) {
          this.setData({
            tags: [],
            loading: false,
            error: '暂无兴趣数据'
          });
          return;
        }

        // 限制标签数量
        const limitedTags = tagCloudData.slice(0, this.data.maxTags);

        // 计算字体大小
        const minValue = Math.min(...limitedTags.map(tag => tag.value));
        const maxValue = Math.max(...limitedTags.map(tag => tag.value));
        const minFontSize = this.data.minFontSize;
        const maxFontSize = this.data.maxFontSize;

        const processedTags = limitedTags.map(tag => {
          // 计算字体大小
          let fontSize = minFontSize;
          if (maxValue > minValue) {
            fontSize = minFontSize + (tag.value - minValue) / (maxValue - minValue) * (maxFontSize - minFontSize);
          }

          // 获取颜色，根据暗夜模式状态选择颜色映射
          const colorMapToUse = this.data.darkMode ? this.data.darkModeColorMap : this.data.colorMap;
          let color;

          if (tag.category && tag.category !== '未分类' && colorMapToUse[tag.category]) {
            // 如果有分类且分类不是“未分类”，使用分类对应的颜色
            color = colorMapToUse[tag.category];
          } else {
            // 如果没有分类或分类是“未分类”，使用标签名称生成随机颜色
            color = this.getRandomColor(tag.name);
          }

          return {
            ...tag,
            fontSize,
            color
          };
        });

        // 随机排序，避免每次显示顺序相同
        processedTags.sort(() => Math.random() - 0.5);

        this.setData({
          tags: processedTags,
          loading: false
        });

        // 触发加载完成事件
        this.triggerEvent('loaded', { tags: processedTags });
      } catch (error) {
        console.error('加载标签失败:', error);
        this.setData({
          loading: false,
          error: '加载标签失败'
        });

        // 触发错误事件
        this.triggerEvent('error', { error });
      }
    },

    /**
     * 处理标签点击事件
     * @param {Object} e 事件对象
     */
    handleTagClick(e) {
      const tag = e.currentTarget.dataset.tag;

      // 触发标签点击事件
      this.triggerEvent('tagclick', { tag });
    },

    /**
     * 处理刷新按钮点击事件
     */
    handleRefresh() {
      this.loadTags(true);

      // 触发刷新事件
      this.triggerEvent('refresh');
    },

    /**
     * 获取随机颜色
     * @param {string} tagName 标签名称，用于生成一致的随机颜色
     * @returns {string} 颜色代码
     */
    getRandomColor(tagName) {
      // 使用标签名称的字符码之和作为随机种子
      let seed = 0;
      for (let i = 0; i < tagName.length; i++) {
        seed += tagName.charCodeAt(i);
      }

      // 选择颜色数组
      const colorArray = this.data.darkMode ? this.data.darkModeRandomColors : this.data.randomColors;

      // 使用种子选择颜色，确保同一标签始终得到相同的颜色
      const index = seed % colorArray.length;
      return colorArray[index];
    }
  }
});
