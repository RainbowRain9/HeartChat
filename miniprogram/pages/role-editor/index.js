// pages/role-editor/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isEdit: false,
    submitting: false,
    currentStep: 1,
    showPromptPreview: false,
    previewPromptText: '',
    defaultAvatar: require('../../config/index').role.DEFAULT_ROLE_AVATAR,
    statusBarHeight: 20, // 默认状态栏高度
    darkMode: false, // 暗夜模式状态

    // 表单数据
    form: {
      name: '',
      relationship: '',
      customRelationship: '',  // 自定义关系
      category: '',
      age: '',
      gender: '',
      occupation: '',
      education: '',
      hobbies: '',
      background: '',
      personality_traits: '',
      communication_style: '',
      emotional_tendency: '',
      taboo: '',
      prompt: '', // 确保初始值为空字符串
      avatar: ''
    },

    // 是否显示自定义关系输入框
    showCustomRelationship: false,

    // 关系选项
    relationshipOptions: require('../../config/index').role.RELATIONSHIP_OPTIONS,
    relationshipIndex: 0,

    // 分类选项
    categoryOptions: require('../../config/index').role.ROLE_CATEGORIES,
    categoryIndex: -1,

    // 关系与分类的映射
    relationshipToCategoryMap: require('../../config/index').role.RELATIONSHIP_TO_CATEGORY_MAP
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('角色编辑页面加载，参数:', options);

    // 获取状态栏高度和检测暗夜模式
    try {
      const systemInfo = wx.getSystemInfoSync();
      const app = getApp();

      // 检测暗夜模式
      let darkMode = false;
      if (app.globalData && app.globalData.darkMode !== undefined) {
        darkMode = app.globalData.darkMode;
      } else {
        darkMode = systemInfo.theme === 'dark';
        // 更新全局数据
        if (app.globalData) {
          app.globalData.darkMode = darkMode;
        }
      }

      this.setData({
        statusBarHeight: systemInfo.statusBarHeight,
        darkMode: darkMode
      });

      // 监听系统主题变化
      wx.onThemeChange && wx.onThemeChange((result) => {
        const isDark = result.theme === 'dark';
        this.setData({ darkMode: isDark });
        // 更新全局数据
        if (app.globalData) {
          app.globalData.darkMode = isDark;
        }
      });
    } catch (e) {
      console.error('获取系统信息失败:', e);
    }

    // 初始化云开发环境
    if (!wx.cloud) {
      wx.showToast({
        title: '请使用 2.2.3 或以上的基础库以使用云能力',
        icon: 'none'
      });
      return;
    }

    try {
      wx.cloud.init({
        env: wx.cloud.DYNAMIC_CURRENT_ENV,
        traceUser: true
      });
    } catch (e) {
      console.error('初始化云开发环境失败:', e);
    }

    // 如果是编辑模式，加载角色数据
    if (options.id) {
      console.log('检测到角色ID，进入编辑模式:', options.id);
      this.setData({ isEdit: true });
      this.loadRole(options.id);
    } else {
      console.log('未检测到角色ID，进入创建模式');
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 检查暗夜模式变化
    const app = getApp();
    if (app && app.globalData && this.data.darkMode !== app.globalData.darkMode) {
      this.setData({
        darkMode: app.globalData.darkMode
      });
    }
  },

  /**
   * 加载角色数据
   */
  async loadRole(roleId) {
    console.log('开始加载角色数据，角色ID:', roleId);

    try {
      wx.showLoading({ title: '加载中...' });

      // 调用云函数获取角色详情
      console.log('准备调用云函数获取角色详情');
      const result = await wx.cloud.callFunction({
        name: 'roles',
        data: {
          action: 'getRoleDetail',
          roleId: roleId
        }
      });

      console.log('云函数返回结果:', result);

      if (result && result.result && result.result.success && result.result.role) {
        const role = result.result.role;
        console.log('获取到角色数据:', role);

        // 判断是否是自定义关系
        let relationship = role.relationship || '';
        let customRelationship = role.customRelationship || '';
        let showCustomRelationship = false;

        // 如果关系不在预设选项中，则认为是自定义关系
        if (relationship && !this.data.relationshipOptions.includes(relationship)) {
          customRelationship = relationship;
          relationship = '其他';
          showCustomRelationship = true;
        }

        // 设置表单数据
        const formData = {
          _id: role._id,
          name: role.name || '',
          relationship: relationship,
          customRelationship: customRelationship,
          category: role.category || '',
          age: role.age || '',
          gender: role.gender || '',
          occupation: role.occupation || '',
          education: role.education || '',
          hobbies: Array.isArray(role.hobbies) ? role.hobbies.join(', ') : (role.hobbies || ''),
          background: role.background || '',
          personality_traits: Array.isArray(role.personality_traits) ? role.personality_traits.join(', ') : (role.personality_traits || ''),
          communication_style: role.communication_style || '',
          emotional_tendency: role.emotional_tendency || '',
          taboo: role.taboo || '',
          // 确保 prompt 始终是字符串类型，并且非 null 或 undefined
          prompt: (typeof role.prompt === 'string' && role.prompt !== null) ? role.prompt : '',
          avatar: role.avatar || this.data.defaultAvatar
        };

        console.log('准备设置表单数据:', formData);
        console.log('提示词类型:', typeof formData.prompt, '提示词值:', formData.prompt);

        this.setData({
          form: formData
        });

        // 设置关系索引
        const relationshipIndex = this.data.relationshipOptions.findIndex(item => item === relationship);
        if (relationshipIndex !== -1) {
          this.setData({ relationshipIndex });
          console.log('设置关系索引:', relationshipIndex);
        }

        // 设置分类索引
        if (role.category) {
          const categoryIndex = this.data.categoryOptions.findIndex(item => item.id === role.category);
          if (categoryIndex !== -1) {
            this.setData({ categoryIndex });
            console.log('设置分类索引:', categoryIndex);
          }
        }

        // 设置是否显示自定义关系输入框
        this.setData({ showCustomRelationship });
        console.log('角色数据加载完成');
      } else {
        console.error('获取角色信息失败，返回结果不符合预期:', result);
        throw new Error('获取角色信息失败');
      }

      wx.hideLoading();
    } catch (error) {
      console.error('加载角色信息失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '加载角色信息失败',
        icon: 'none',
        duration: 3000
      });

      // 尝试获取更多错误信息
      if (error.errMsg) {
        console.error('错误信息:', error.errMsg);
      }
      if (error.stack) {
        console.error('错误堆栈:', error.stack);
      }
    }
  },

  /**
   * 处理输入变化
   */
  handleInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;

    this.setData({
      [`form.${field}`]: value
    });
  },

  /**
   * 处理关系选择
   */
  handleRelationshipChange(e) {
    const index = e.detail.value;
    const relationship = this.data.relationshipOptions[index];

    this.setData({
      'form.relationship': relationship,
      relationshipIndex: index
    });

    // 判断是否需要显示自定义关系输入框
    if (relationship === '其他') {
      this.setData({
        showCustomRelationship: true,
        'form.customRelationship': ''
      });
    } else {
      this.setData({
        showCustomRelationship: false,
        'form.customRelationship': ''
      });
    }

    // 根据关系推荐分类
    const recommendedCategory = this.data.relationshipToCategoryMap[relationship];
    if (recommendedCategory) {
      const categoryIndex = this.data.categoryOptions.findIndex(item => item.id === recommendedCategory);
      if (categoryIndex >= 0) {
        this.setData({
          categoryIndex: categoryIndex,
          'form.category': recommendedCategory
        });
      }
    }
  },

  /**
   * 处理自定义关系输入
   */
  handleCustomRelationshipInput(e) {
    this.setData({
      'form.customRelationship': e.detail.value
    });
  },

  /**
   * 处理分类选择
   */
  handleCategoryChange(e) {
    const index = e.detail.value;
    const category = this.data.categoryOptions[index].id;

    this.setData({
      'form.category': category,
      categoryIndex: index
    });
  },

  /**
   * 处理性别选择
   */
  handleGenderChange(e) {
    this.setData({
      'form.gender': e.detail.value
    });
  },

  /**
   * 选择头像
   */
  chooseAvatar() {
    const app = getApp();

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        try {
          // 获取用户ID
          const userId = app.globalData.userInfo ? app.globalData.userInfo.userId : '';

          // 使用图片服务上传头像
          const fileID = await app.globalData.imageService.uploadAvatar(res.tempFilePaths[0], userId, 'role');

          // 设置头像
          this.setData({
            'form.avatar': fileID
          });

          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
        } catch (error) {
          console.error('上传头像失败:', error);
          // 错误处理已在imageService中实现
        }
      }
    });
  },

  /**
   * 下一步
   */
  nextStep() {
    // 表单验证
    if (this.data.currentStep === 1) {
      if (!this.data.form.name) {
        wx.showToast({
          title: '请输入角色名称',
          icon: 'none'
        });
        return;
      }

      if (!this.data.form.relationship) {
        wx.showToast({
          title: '请选择与您的关系',
          icon: 'none'
        });
        return;
      }

      // 如果选择了“其他”关系，验证自定义关系名称
      if (this.data.form.relationship === '其他' && !this.data.form.customRelationship) {
        wx.showToast({
          title: '请输入具体关系名称',
          icon: 'none'
        });
        return;
      }
    }

    // 切换到下一步
    if (this.data.currentStep < 3) {
      this.setData({
        currentStep: this.data.currentStep + 1
      });
    }
  },

  /**
   * 上一步
   */
  prevStep() {
    if (this.data.currentStep > 1) {
      this.setData({
        currentStep: this.data.currentStep - 1
      });
    }
  },

  /**
   * 跳转到指定步骤
   */
  goToStep(e) {
    const { step } = e.currentTarget.dataset;

    // 只允许跳转到已完成的步骤
    if (step <= this.data.currentStep) {
      this.setData({ currentStep: parseInt(step) });
    }
  },

  /**
   * 预览提示词
   */
  async previewPrompt() {
    try {
      wx.showLoading({ title: '生成提示词中...' });

      // 准备角色信息
      const roleInfo = this.prepareRoleData();

      // 如果有自定义提示词，直接使用
      if (roleInfo.prompt) {
        this.setData({
          showPromptPreview: true,
          previewPromptText: roleInfo.prompt
        });
        wx.hideLoading();
        return;
      }

      // 调用云函数生成提示词
      try {
        const result = await wx.cloud.callFunction({
          name: 'roles',
          data: {
            action: 'generatePrompt',
            roleInfo: roleInfo
          }
        });

        if (result && result.result && result.result.success) {
          this.setData({
            showPromptPreview: true,
            previewPromptText: result.result.prompt
          });
        } else {
          throw new Error('生成提示词失败');
        }
      } catch (error) {
        console.error('调用云函数生成提示词失败:', error);
        // 如果云函数调用失败，使用本地生成
        const prompt = this.generateLocalPrompt();
        this.setData({
          showPromptPreview: true,
          previewPromptText: prompt
        });
      }

      wx.hideLoading();
    } catch (error) {
      console.error('预览提示词失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '生成提示词失败',
        icon: 'none'
      });
    }
  },

  /**
   * 关闭提示词预览
   */
  closePromptPreview() {
    this.setData({
      showPromptPreview: false
    });
  },

  /**
   * 跳转到提示词编辑页面
   */
  navigateToPromptEditor() {
    // 检查是否有角色ID（编辑模式）
    if (this.data.isEdit && this.data.form._id) {
      // 跳转到提示词编辑页面，并传递角色ID和当前提示词
      wx.navigateTo({
        url: `/pages/prompt-editor/prompt-editor?roleId=${this.data.form._id}&roleName=${encodeURIComponent(this.data.form.name || '')}&prompt=${encodeURIComponent(this.data.form.prompt || '')}`,
        success: () => {
          console.log('成功跳转到提示词编辑页面');
        },
        fail: (err) => {
          console.error('跳转到提示词编辑页面失败:', err);
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
        }
      });
    } else {
      // 如果是新建角色，提示用户先保存角色
      wx.showToast({
        title: '请先保存角色后再编辑提示词',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 本地生成提示词
   */
  generateLocalPrompt() {
    const { form } = this.data;

    let prompt = `你是${form.name || '一个角色'}`;

    // 处理关系
    let displayRelationship = form.relationship;
    if (form.relationship === '其他' && form.customRelationship) {
      displayRelationship = form.customRelationship;
    }

    if (displayRelationship) {
      prompt += `，作为我的${displayRelationship}`;
    }

    // 添加分类信息
    if (form.category) {
      const categoryName = this.data.categoryOptions.find(item => item.id === form.category)?.name;
      if (categoryName) {
        prompt += `，你是一个${categoryName}类型的角色`;
      }
    }

    if (form.gender || form.age) {
      prompt += `。你是一个`;
      if (form.gender) {
        prompt += form.gender;
      }
      if (form.age) {
        prompt += `${form.age}岁`;
      }
      prompt += '的人';
    }

    if (form.occupation) {
      prompt += `。你的职业是${form.occupation}`;
    }

    if (form.personality_traits) {
      prompt += `。你的性格特点是${form.personality_traits}`;
    }

    if (form.emotional_tendency) {
      prompt += `。你的情感倾向是${form.emotional_tendency}`;
    }

    if (form.communication_style) {
      prompt += `。你的说话风格是${form.communication_style}`;
    }

    if (form.education) {
      prompt += `\n\n你的教育背景是：${form.education}`;
    }

    if (form.hobbies) {
      prompt += `\n\n你的爱好是：${form.hobbies}`;
    }

    if (form.background) {
      prompt += `\n\n你的背景故事：${form.background}`;
    }

    if (form.taboo) {
      prompt += `\n\n请避免讨论以下话题：${form.taboo}`;
    }

    prompt += '\n\n请以符合你角色设定的方式与我对话。在适当的时候，你可以安慰我或给我建议。在对话中，你应该自然地了解我的兴趣和偏好，但不要显得像在进行调查。';

    return prompt;
  },

  /**
   * 准备角色数据
   */
  prepareRoleData() {
    const { form } = this.data;

    // 处理数组字段
    const personality_traits = form.personality_traits ? form.personality_traits.split(',').map(item => item.trim()) : [];
    const hobbies = form.hobbies ? form.hobbies.split(',').map(item => item.trim()) : [];

    // 处理自定义关系
    let actualRelationship = form.relationship;
    if (form.relationship === '其他' && form.customRelationship) {
      actualRelationship = form.customRelationship;
    }

    // 如果没有设置category，根据relationship自动设置
    let category = form.category;
    if (!category && form.relationship) {
      category = this.data.relationshipToCategoryMap[form.relationship] || 'other';
    }

    // 构建角色数据
    return {
      name: form.name,
      relationship: actualRelationship,
      customRelationship: form.customRelationship,
      category: category,
      age: form.age,
      gender: form.gender,
      occupation: form.occupation,
      education: form.education,
      hobbies: hobbies,
      background: form.background,
      personality_traits: personality_traits,
      communication_style: form.communication_style,
      emotional_tendency: form.emotional_tendency,
      taboo: form.taboo,
      prompt: form.prompt,
      system_prompt: form.prompt, // 同时保存到system_prompt字段，确保聊天功能可以正确获取
      avatar: form.avatar,

      // 兼容旧字段
      role_name: form.name,
      role_type: category === 'career' ? 'work' : 'life',
      role_desc: form.background,
      style: form.personality_traits,
      speaking_style: form.communication_style
    };
  },

  /**
   * 处理提交
   */
  async handleSubmit() {
    try {
      // 表单验证
      if (!this.data.form.name) {
        wx.showToast({
          title: '请输入角色名称',
          icon: 'none'
        });
        return;
      }

      if (!this.data.form.relationship) {
        wx.showToast({
          title: '请选择与您的关系',
          icon: 'none'
        });
        return;
      }

      // 如果选择了“其他”关系，验证自定义关系名称
      if (this.data.form.relationship === '其他' && !this.data.form.customRelationship) {
        wx.showToast({
          title: '请输入具体关系名称',
          icon: 'none'
        });
        return;
      }

      this.setData({ submitting: true });

      // 准备角色数据
      const roleData = this.prepareRoleData();

      // 如果有预览的提示词，使用预览的提示词
      if (this.data.showPromptPreview && this.data.previewPromptText) {
        roleData.prompt = this.data.previewPromptText;
        roleData.system_prompt = this.data.previewPromptText; // 同时更新system_prompt字段
      }

      // 获取用户ID
      const app = getApp();
      const userId = app.globalData.userInfo ? app.globalData.userInfo.userId : '';

      if (!userId) {
        throw new Error('用户未登录');
      }

      // 调用云函数创建或更新角色
      const action = this.data.isEdit ? 'updateRole' : 'createRole';
      const params = {
        name: 'roles',
        data: {
          action: action,
          role: roleData,
          userId: userId
        }
      };

      // 如果是编辑模式，添加角色ID
      if (this.data.isEdit && this.data.form._id) {
        params.data.role._id = this.data.form._id;
      }

      const result = await wx.cloud.callFunction(params);

      if (result && result.result && result.result.success) {
        // 清除角色列表缓存，确保新创建的角色能够显示
        const app = getApp();
        const userInfo = app.globalData.userInfo;
        if (userInfo) {
          const userId = userInfo.userId || userInfo.user_id || userInfo._id || userInfo.openid;
          const cacheKey = `roles_cache_${userId}`;
          const cacheTimeKey = `roles_cache_time_${userId}`;

          try {
            wx.removeStorageSync(cacheKey);
            wx.removeStorageSync(cacheTimeKey);
            console.log('成功清除角色列表缓存');
          } catch (error) {
            console.error('清除角色列表缓存失败:', error);
          }
        }

        // 显示成功提示
        wx.showToast({
          title: this.data.isEdit ? '角色更新成功' : '角色创建成功',
          icon: 'success',
          duration: 1500
        });

        // 等待提示显示完毕后自动跳转回角色选择页面
        setTimeout(() => {
          // 跳转到 role-select 页面（现在是tab页面）
          wx.switchTab({
            url: '/pages/role-select/role-select',
            success: () => {
              console.log('成功跳转到 role-select 页面');
            },
            fail: (err) => {
              console.error('跳转到 role-select 失败:', err);
              // 如果跳转失败，尝试返回上一页
              wx.navigateBack();
            }
          });
        }, 1500); // 等待提示显示完毕
      } else {
        throw new Error(result.result?.error || '操作失败');
      }
    } catch (error) {
      console.error('提交失败:', error);

      // 处理特定错误
      let errorMessage = error.message || '操作失败';

      // 检查是否是重复名称错误
      if (error.message && (error.message.includes('duplicate key') ||
          error.message.includes('角色名称已存在'))) {
        errorMessage = `角色名称 "${this.data.form.name}" 已存在，请使用其他名称`;

        // 聚焦到名称输入框
        this.setData({
          currentStep: 1 // 返回第一步
        });

        // 稍后选中名称输入框
        setTimeout(() => {
          const nameInput = this.selectComponent('#nameInput');
          if (nameInput) {
            nameInput.focus();
          }
        }, 500);
      }

      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 取消编辑
   */
  handleCancel(e) {
    console.log('点击了取消按钮', e);

    // 显示确认对话框
    wx.showModal({
      title: '确认取消',
      content: '您确定要取消编辑吗？未保存的内容将会丢失。',
      confirmText: '确定',
      cancelText: '继续编辑',
      success: (res) => {
        if (res.confirm) {
          // 用户确认取消，直接跳转到 role-select 页面（现在是tab页面）
          wx.switchTab({
            url: '/pages/role-select/role-select',
            success: () => {
              console.log('成功跳转到 role-select 页面');
            },
            fail: (err) => {
              console.error('跳转到 role-select 失败:', err);

              // 如果跳转失败，尝试返回上一页
              wx.navigateBack({
                fail: (backErr) => {
                  console.error('返回失败:', backErr);

                  // 如果返回也失败，尝试重定向到首页
                  wx.switchTab({
                    url: '/pages/home/home',
                    fail: (switchErr) => {
                      console.error('重定向失败:', switchErr);

                      // 最后的备选方案，显示提示
                      wx.showModal({
                        title: '提示',
                        content: '无法返回，请尝试使用微信小程序自带的返回按钮',
                        showCancel: false
                      });
                    }
                  });
                }
              });
            }
          });
        }
        // 如果用户点击取消，则不做任何操作，继续编辑
      }
    });
  }
});
