// components/role-card/role-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    role: {
      type: Object,
      value: {}
    },
    selected: {
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
    defaultAvatar: '/images/avatars/default-avatar.png'
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 获取角色名称
     */
    getRoleName() {
      const role = this.properties.role;
      return role.name || role.role_name || '未命名角色';
    },

    /**
     * 获取角色描述
     */
    getRoleDescription() {
      const role = this.properties.role;
      return role.description || role.role_desc || '暂无描述';
    },

    /**
     * 获取角色分类
     */
    getRoleCategory() {
      const role = this.properties.role;
      return role.category || role.role_type || 'other';
    },

    /**
     * 获取角色头像
     */
    getRoleAvatar() {
      const role = this.properties.role;
      return role.avatar || role.avatar_url || this.data.defaultAvatar;
    },

    /**
     * 点击角色卡片
     */
    handleTap() {
      this.triggerEvent('select', { role: this.properties.role });
    },

    /**
     * 长按角色卡片
     */
    handleLongPress() {
      this.triggerEvent('longpress', { role: this.properties.role });
    },

    /**
     * 处理头像加载错误
     */
    handleAvatarError() {
      console.log('头像加载失败，使用默认头像');
      // 如果头像加载失败，使用默认头像
      const role = this.properties.role;
      if (role.avatar) {
        role.avatar = this.data.defaultAvatar;
        this.setData({ role });
      }
    }
  }
})
