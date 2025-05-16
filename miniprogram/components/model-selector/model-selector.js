/**
 * 模型选择器组件
 * 提供AI模型选择功能
 *
 * @architecture 该组件实现了AI模型的选择功能，支持在不同AI模型之间切换
 * @dependency modelService 模型服务
 * @history 2025-05-10 初始版本
 * @history 2025-05-15 添加动态模型列表支持
 */

// 导入模型服务
const modelService = require('../../services/modelService');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    darkMode: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    modelTypes: [],
    modelDisplayNames: {},
    selectedModelType: '',
    showSelector: false,
    loading: false,
    showModelList: false,
    currentModelList: [],
    selectedModel: '',
    modelDescriptions: {},
    modelFeatures: {}
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.initModelSelector();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化模型选择器
     */
    async initModelSelector() {
      try {
        // 获取所有可用的模型类型
        const modelTypes = modelService.getAvailableModelTypes();

        // 获取当前选择的模型类型
        const selectedModelType = modelService.getSelectedModelType();

        // 构建模型显示名称映射
        const modelDisplayNames = {};
        const modelDescriptions = {};
        const modelFeatures = {};
        modelTypes.forEach(type => {
          modelDisplayNames[type] = modelService.getModelDisplayName(type);

          // 获取模型描述和特性
          const config = modelService.getModelConfig(type);
          modelDescriptions[type] = config.description;
          modelFeatures[type] = config.features || [];
        });

        // 获取当前选择的模型
        const selectedModel = modelService.getSelectedModel(selectedModelType);

        // 获取当前模型类型的模型列表
        const currentModelList = await modelService.getModelList(selectedModelType);

        this.setData({
          modelTypes,
          modelDisplayNames,
          selectedModelType,
          modelDescriptions,
          modelFeatures,
          selectedModel,
          currentModelList
        });
      } catch (error) {
        console.error('初始化模型选择器失败:', error.message || error);
        wx.showToast({
          title: '初始化模型选择器失败',
          icon: 'none'
        });
      }
    },

    /**
     * 显示模型选择器
     */
    showModelSelector() {
      this.setData({
        showSelector: true
      });
    },

    /**
     * 隐藏模型选择器
     */
    hideModelSelector() {
      this.setData({
        showSelector: false
      });
    },

    /**
     * 选择模型类型
     * @param {Object} e 事件对象
     */
    async selectModelType(e) {
      const { modelType } = e.currentTarget.dataset;

      if (modelType === this.data.selectedModelType) {
        // 如果点击的是当前选择的模型类型，则显示模型列表
        this.showModelListSelector();
        return;
      }

      this.setData({
        loading: true
      });

      try {
        // 测试模型连接
        const result = await modelService.testModelConnection(modelType);

        if (result.success) {
          // 设置选择的模型类型
          modelService.setSelectedModelType(modelType);

          // 获取该类型的模型列表
          const modelList = await modelService.getModelList(modelType);

          // 获取默认选择的模型
          const selectedModel = modelService.getSelectedModel(modelType);

          this.setData({
            selectedModelType: modelType,
            currentModelList: modelList,
            selectedModel: selectedModel,
            loading: false
          });

          // 触发模型变更事件
          this.triggerEvent('modelChange', {
            modelType,
            modelName: selectedModel
          });

          wx.showToast({
            title: '模型切换成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: '模型连接测试失败',
            icon: 'none'
          });

          this.setData({
            loading: false
          });
        }
      } catch (error) {
        console.error('测试模型连接失败:', error.message || error);

        wx.showToast({
          title: '测试模型连接失败',
          icon: 'none'
        });

        this.setData({
          loading: false
        });
      } finally {
        this.hideModelSelector();
      }
    },

    /**
     * 显示模型列表选择器
     */
    showModelListSelector() {
      this.setData({
        showModelList: true
      });
    },

    /**
     * 隐藏模型列表选择器
     */
    hideModelListSelector() {
      this.setData({
        showModelList: false
      });
    },

    /**
     * 选择具体模型
     * @param {Object} e 事件对象
     */
    async selectModel(e) {
      const { modelName } = e.currentTarget.dataset;

      if (modelName === this.data.selectedModel) {
        this.hideModelListSelector();
        return;
      }

      this.setData({
        loading: true
      });

      try {
        // 设置选择的模型
        modelService.setSelectedModel(this.data.selectedModelType, modelName);

        this.setData({
          selectedModel: modelName,
          loading: false
        });

        // 触发模型变更事件
        this.triggerEvent('modelChange', {
          modelType: this.data.selectedModelType,
          modelName
        });

        wx.showToast({
          title: '模型切换成功',
          icon: 'success'
        });
      } catch (error) {
        console.error('切换模型失败:', error.message || error);

        wx.showToast({
          title: '切换模型失败',
          icon: 'none'
        });

        this.setData({
          loading: false
        });
      } finally {
        this.hideModelListSelector();
      }
    },

    /**
     * 阻止事件冒泡
     */
    stopPropagation() {
      // 仅用于阻止事件冒泡
      return;
    }
  }
});
