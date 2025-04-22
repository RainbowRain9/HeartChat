// 移除类型导入,使用普通导入
const { DEFAULT_ROLES } = require('../../../../models/role')

Page({
  data: {
    isEdit: false,
    submitting: false,
    form: {
      role_name: '',
      role_type: 'work',
      relationship: '',
      avatar_url: '',
      style: '',
      taboo: '',
      role_desc: ''
    },
    relationTypes: {
      work: ['直属上级', '同事', '下属'],
      life: ['家人', '朋友', '恋人']
    },
    relationIndex: 0,
    speaking_style: '',
    background: '',
    prompt_template: '',
    generatedPrompt: ''
  },

  async onLoad(options) {
    try {
      // 初始化云开发环境
      if (!wx.cloud) {
        throw new Error('请使用 2.2.3 或以上的基础库以使用云能力')
      }

      wx.cloud.init({
        env: 'rainbowrain-2gt3j8hda726e4fe',
        traceUser: true
      })

      // 如果是编辑模式，加载角色数据
      if (options.id) {
        this.setData({ isEdit: true })
        await this.loadRole(options.id)
      }
    } catch (error) {
      console.error('初始化失败:', error)
      wx.showToast({
        title: '系统初始化失败',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  async loadRole(roleId) {
    try {
      // 使用roles云函数获取角色详情
      const result = await wx.cloud.callFunction({
        name: 'roles',
        data: {
          action: 'getRoleDetail',
          roleId: roleId
        }
      });

      if (result && result.result && result.result.success && result.result.role) {
        const role = result.result.role;
        this.setData({
          form: role,
          relationIndex: this.getRelationIndex(role.relationship, role.role_type),
          speaking_style: role.speaking_style || '',
          background: role.background || '',
          prompt_template: role.prompt_template || ''
        })
      } else {
        throw new Error('角色不存在')
      }
    } catch (error) {
      console.error('加载角色失败:', error)
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  getRelationIndex(relationship, roleType) {
    return this.data.relationTypes[roleType].findIndex(r => r === relationship) || 0
  },

  handleTypeChange(e) {
    const role_type = e.detail.value
    this.setData({
      'form.role_type': role_type,
      'form.relationship': '',
      relationIndex: 0
    })
  },

  handleRelationChange(e) {
    const index = e.detail.value
    const relationship = this.data.relationTypes[this.data.form.role_type][index]
    this.setData({
      relationIndex: index,
      'form.relationship': relationship
    })
  },

  async chooseAvatar() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      // 获取用户ID
      const userId = wx.getStorageSync('userInfo').userId

      // 使用图片服务上传头像
      const app = getApp()
      const fileID = await app.globalData.imageService.uploadAvatar(
        res.tempFilePaths[0],
        userId,
        'role'
      )

      // 设置头像
      this.setData({
        'form.avatar_url': fileID
      })

      wx.showToast({
        title: '上传成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('上传头像失败:', error)
      // 错误处理已在imageService中实现
    }
  },

  async handleSubmit(e) {
    const formData = e.detail.value;
    const { form, speaking_style, background } = this.data;

    // 生成提示词
    const systemPrompt = `你现在扮演的角色是 ${formData.role_name}。

角色类型：${form.role_type === 'work' ? '工作关系' : '生活关系'}
关系：${form.relationship}

性格风格：
${formData.style || '未设置'}

说话风格：
${speaking_style || '未设置'}

背景故事：
${background || '未设置'}

禁忌话题：
${formData.taboo || '未设置'}

角色描述：
${formData.role_desc || '未设置'}

请严格按照以上设定进行对话，保持角色特征的一致性。对话中要体现出角色的性格特征和说话风格。`.trim();

    // 构建提交数据
    const submitData = {
      user_id: wx.getStorageSync('userInfo').userId,
      role_name: formData.role_name.trim(),
      role_type: form.role_type || 'work',
      relationship: form.relationship,
      role_desc: formData.role_desc?.trim() || '',
      avatar_url: form.avatar_url || '',
      style: formData.style?.trim() || '',
      taboo: formData.taboo?.trim() || '',
      status: 1,
      name: formData.role_name.trim(),
      speaking_style: speaking_style,
      background: background,
      system_prompt: systemPrompt
    };

    console.log('提交的表单数据:', formData)
    console.log('当前表单状态:', form)

    // 表单验证
    if (!formData.role_name) {
      wx.showToast({
        title: '请输入角色名称',
        icon: 'none'
      })
      return
    }

    if (!form.relationship) {
      wx.showToast({
        title: '请选择关系类型',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })

    try {
      const db = wx.cloud.database()

      // 验证必填字段
      if (!submitData.user_id) {
        throw new Error('用户ID不能为空')
      }

      if (!submitData.role_name) {
        throw new Error('角色名称不能为空')
      }

      if (!submitData.relationship) {
        throw new Error('关系类型不能为空')
      }

      // 检查是否是编辑模式
      if (this.data.isEdit && form._id) {
        // 更新角色
        console.log('更新角色:', form._id)

        // 构建更新数据，包含所有可能更新的字段
        const updateData = {
          role_name: formData.role_name.trim(),
          role_type: form.role_type,
          relationship: form.relationship,
          role_desc: formData.role_desc?.trim() || '',
          style: formData.style?.trim() || '',
          taboo: formData.taboo?.trim() || '',
          name: formData.role_name.trim(),
          speaking_style: speaking_style,
          background: background,
          system_prompt: systemPrompt,
          category: form.role_type === 'work' ? 'career' : 'life', // 根据角色类型设置分类
          description: formData.role_desc?.trim() || '',
          prompt: systemPrompt,
          welcome: `你好，我是${formData.role_name.trim()}，你的${form.relationship}。`
        }

        // 如果有新的头像URL，才更新avatar_url字段
        if (form.avatar_url) {
          updateData.avatar_url = form.avatar_url
          updateData.avatar = form.avatar_url // 同时更新avatar字段
        }

        console.log('更新数据:', updateData)

        try {
          // 使用roles云函数更新角色
          const result = await wx.cloud.callFunction({
            name: 'roles',
            data: {
              action: 'updateRole',
              roleId: form._id,
              role: updateData,
              userId: wx.getStorageSync('userInfo').userId
            }
          });

          if (result && result.result && result.result.success) {
            console.log('更新成功')
          } else {
            throw new Error(result.result?.error || '更新失败')
          }
        } catch (error) {
          console.error('更新失败:', error)
          throw error
        }
      } else {
        // 创建角色
        console.log('创建新角色，提交数据:', submitData)

        // 添加新的字段，与新的roles云函数兼容
        const newRoleData = {
          ...submitData,
          category: submitData.role_type === 'work' ? 'career' : 'life', // 根据角色类型设置分类
          description: submitData.role_desc || '',
          prompt: submitData.system_prompt,
          welcome: `你好，我是${submitData.role_name}，你的${submitData.relationship}。`,
          avatar: submitData.avatar_url // 同时设置avatar字段
        };

        try {
          // 使用roles云函数创建角色
          const result = await wx.cloud.callFunction({
            name: 'roles',
            data: {
              action: 'createRole',
              role: newRoleData,
              userId: wx.getStorageSync('userInfo').userId
            }
          });

          if (result && result.result && result.result.success) {
            console.log('创建角色成功，结果:', result.result)
          } else {
            throw new Error(result.result?.error || '创建失败')
          }
        } catch (error) {
          console.error('创建角色失败，详细错误:', error)
          if (error.message && (error.message.includes('duplicate key') || error.message.includes('角色名称已存在'))) {
            throw new Error(`角色名称 "${formData.role_name}" 已存在，请使用其他名称`)
          }
          throw error
        }
      }

      // 显示成功对话框，而不是简单的toast
      wx.showModal({
        title: '操作成功',
        content: this.data.isEdit ? '角色信息已更新成功！' : `角色 "${formData.role_name}" 已创建成功！`,
        confirmText: '返回列表',
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            // 返回上一页
            wx.navigateBack()
          }
        }
      })
    } catch (error) {
      console.error('保存角色失败:', error)

      // 处理特定错误
      let errorMessage = error.message || '保存失败';
      let icon = 'error';

      // 检查是否是重复名称错误
      if (error.message && (error.message.includes('角色名称') || error.message.includes('duplicate key'))) {
        icon = 'none';
        errorMessage = error.message;
      }

      wx.showToast({
        title: errorMessage,
        icon: icon,
        duration: 3000
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  handleCancel() {
    wx.navigateBack()
  },

  /**
   * 预览生成的提示词
   */
  previewPrompt() {
    const {
      form,
      speaking_style,
      background,
      prompt_template
    } = this.data;

    let prompt = '';

    // 如果有自定义模板
    if (prompt_template) {
      prompt = prompt_template
        .replace('{{role_name}}', form.role_name)
        .replace('{{style}}', form.style || '')
        .replace('{{speaking_style}}', speaking_style)
        .replace('{{background}}', background);
    } else {
      // 使用默认模板
      prompt = `
你现在扮演的角色是 ${form.role_name}。

角色类型：${form.role_type === 'work' ? '工作关系' : '生活关系'}
关系：${form.relationship}

性格风格：
${form.style || '未设置'}

说话风格：
${speaking_style || '未设置'}

背景故事：
${background || '未设置'}

禁忌话题：
${form.taboo || '未设置'}

角色描述：
${form.role_desc || '未设置'}

请严格按照以上设定进行对话，保持角色特征的一致性。对话中要体现出角色的性格特征和说话风格。
      `.trim();
    }

    this.setData({
      generatedPrompt: prompt
    });

    wx.showModal({
      title: '预览提示词',
      content: prompt,
      showCancel: false
    });
  },

  /**
   * 输入框内容变化处理
   */
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
  }
})