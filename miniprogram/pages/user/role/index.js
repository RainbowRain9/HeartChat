Page({
    data: {
        workRoles: [],
        lifeRoles: [],
        rolePrompt: ''
    },

    onLoad() {
        this.loadRoles()
    },

    onShow() {
        // 始终刷新角色列表，确保新创建的角色能立即显示
        wx.showLoading({
            title: '加载中...',
            mask: true
        })
        this.loadRoles().then(() => {
            wx.hideLoading()
        }).catch(() => {
            wx.hideLoading()
        })
    },

    async loadRoles() {
        try {
            const db = wx.cloud.database()
            const userInfo = wx.getStorageSync('userInfo')

            if (!userInfo || !userInfo.userId) {
                throw new Error('请先登录')
            }

            const roles = await db.collection('roles')
                .where({
                    user_id: userInfo.userId,
                    status: 1
                })
                .get()

            const workRoles = []
            const lifeRoles = []

            roles.data.forEach(role => {
                if (role.role_type === 'work') {
                    workRoles.push(role)
                } else {
                    lifeRoles.push(role)
                }
            })

            this.setData({
                workRoles,
                lifeRoles
            })
        } catch (error) {
            console.error('Failed to load roles:', error)
            wx.showToast({
                title: '加载失败',
                icon: 'error'
            })
        }
    },

    onCreateRole() {
        wx.navigateTo({
            url: '/pages/user/role/edit/index'
        })
    },

    onEditRole(e) {
        const { role } = e.detail
        wx.navigateTo({
            url: `/pages/user/role/edit/index?id=${role._id}`
        })
    },

    async onDeleteRole(e) {
        const { role } = e.detail
        try {
            const db = wx.cloud.database()
            await db.collection('roles')
                .doc(role._id)
                .remove()

            wx.showToast({
                title: '删除成功',
                icon: 'success'
            })

            this.loadRoles()
        } catch (error) {
            console.error('Failed to delete role:', error)
            wx.showToast({
                title: '删除失败',
                icon: 'error'
            })
        }
    },

    onSelectRole(e) {
        const { role } = e.detail
        wx.navigateTo({
            url: `/pages/emotionAnswer/index?role_id=${role._id}`
        })
    },

    /**
     * 生成角色提示词
     * @param {Object} role 角色信息
     * @returns {string} 组合后的提示词
     */
    generateRolePrompt(role) {
        const {
            role_name,
            personality,
            speaking_style,
            background,
            prompt_template
        } = role;

        // 如果有自定义的提示词模板，优先使用模板
        if (prompt_template) {
            return prompt_template
                .replace('{{role_name}}', role_name)
                .replace('{{personality}}', JSON.stringify(personality))
                .replace('{{speaking_style}}', speaking_style)
                .replace('{{background}}', background);
        }

        // 否则使用默认模板组合提示词
        const prompt = `
  你现在扮演的角色是 ${role_name}。

  角色性格特征：
  ${JSON.stringify(personality, null, 2)}

  说话风格：
  ${speaking_style}

  背景故事：
  ${background}

  请严格按照以上设定进行对话，保持角色特征的一致性。对话中要体现出角色的性格特征和说话风格。
      `.trim();

        return prompt;
    },

    /**
     * 查看角色详情
     */
    viewRoleDetail(e) {
        const { role } = e.currentTarget.dataset;
        if (!role) return;

        // 生成角色提示词
        const rolePrompt = this.generateRolePrompt(role);

        // 更新页面数据
        this.setData({
            rolePrompt
        });

        // 可以在这里将rolePrompt传递给AI对话页面
        wx.navigateTo({
            url: `/pages/chat/index?rolePrompt=${encodeURIComponent(rolePrompt)}`
        });
    }
})