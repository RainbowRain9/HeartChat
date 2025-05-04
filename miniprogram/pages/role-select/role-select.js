// pages/role-select/role-select.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    roles: [], // 角色列表
    systemRoles: [], // 系统角色列表
    userRoles: [], // 用户角色列表
    selectedRoleId: '', // 当前选中的角色ID
    loading: true, // 是否正在加载
    darkMode: false, // 暗夜模式
    categories: [ // 角色分类
      { id: 'all', name: '全部' },
      { id: 'emotion', name: '情感支持' },
      { id: 'psychology', name: '心理咨询' },
      { id: 'life', name: '生活伙伴' },
      { id: 'career', name: '职场导师' }
    ],
    activeCategory: 'all', // 当前选中的分类
    searchValue: '', // 搜索关键词
    filteredRoles: [], // 过滤后的角色列表
    recommendedRoles: [], // 推荐角色列表
    statusBarHeight: 0, // 状态栏高度
    navBarHeight: 0, // 导航栏高度
    showRoleDetail: false, // 是否显示角色详情
    currentRole: null, // 当前查看的角色
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取系统信息设置自定义导航栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const navBarHeight = (systemInfo.platform === 'ios' ? 44 : 48);

    // 获取暗夜模式设置
    const darkMode = app.globalData.darkMode || false;

    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: navBarHeight,
      darkMode: darkMode
    });

    // 加载角色列表
    this.loadRoles();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 检查主题变化
    if (this.data.darkMode !== app.globalData.darkMode) {
      this.setData({
        darkMode: app.globalData.darkMode
      });

      // 更新TabBar样式
      if (app.updateTheme) {
        app.updateTheme(app.globalData.darkMode);
      }
    }

    // 检查是否需要强制刷新角色列表
    // 如果是从角色编辑页面返回，则强制刷新
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const prevPage = pages[pages.length - 2];

    // 判断是否从角色编辑页面返回
    const fromRoleEditor = prevPage &&
      (prevPage.route === 'pages/role-editor/index' ||
       prevPage.route === 'pages/user/role/edit/index');

    console.log('当前页面:', currentPage.route);
    console.log('上一页面:', prevPage ? prevPage.route : '无');
    console.log('是否从角色编辑页面返回:', fromRoleEditor);

    // 每次显示页面时加载角色列表，如果从角色编辑页面返回则强制刷新
    this.loadRoles(null, fromRoleEditor);
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    // 下拉刷新时强制从服务器重新加载角色列表，忽略缓存
    this.loadRoles(() => {
      wx.stopPullDownRefresh();
    }, true);
  },

  /**
   * 加载角色列表
   * @param {Function} callback - 加载完成后的回调函数
   * @param {Boolean} forceRefresh - 是否强制刷新，忽略缓存
   */
  loadRoles: function (callback, forceRefresh = false) {
    this.setData({ loading: true });

    // 获取当前用户ID
    const userInfo = app.globalData.userInfo;
    if (!userInfo) {
      console.log('用户未登录，无法加载角色列表');
      this.setData({ loading: false });
      if (callback) callback();
      return;
    }

    // 获取用户ID，优先使用userId，其次是_id，最后是openid
    const userId = userInfo.userId || userInfo.user_id || userInfo._id || userInfo.openid;
    console.log('使用用户ID加载角色列表:', userId);

    // 同时获取openid，用于调试
    const openid = userInfo.openid || userInfo.stats?.openid;
    if (openid) {
      console.log('用户openid:', openid);
    }

    // 尝试从缓存中获取角色列表
    const cacheKey = `roles_cache_${userId}`;
    const cacheTimeKey = `roles_cache_time_${userId}`;
    const currentTime = new Date().getTime();
    const cacheTime = wx.getStorageSync(cacheTimeKey) || 0;
    const cacheExpireTime = 30 * 60 * 1000; // 30分钟缓存过期时间

    // 如果缓存存在且未过期，且不强制刷新，则使用缓存
    if (!forceRefresh && currentTime - cacheTime < cacheExpireTime) {
      const cachedRoles = wx.getStorageSync(cacheKey);
      if (cachedRoles && cachedRoles.length > 0) {
        console.log('从缓存加载角色列表，角色数量:', cachedRoles.length);

        // 分离系统角色和用户角色
        const systemRoles = cachedRoles.filter(role => role.creator === 'system' || role.isSystem);
        const userRoles = cachedRoles.filter(role => role.creator !== 'system' && !role.isSystem);

        // 获取聊天记录统计，用于推荐角色 - 考虑所有角色（系统角色和用户角色）
        this.getChatsStatistics(cachedRoles, openid || userId, (rolesWithStats) => {
          // 根据消息数量排序，选择前两个作为推荐角色
          const recommendedRoles = this.getRecommendedRolesByMessageCount(rolesWithStats);

          this.setData({
            roles: cachedRoles,
            systemRoles: systemRoles,
            userRoles: userRoles,
            filteredRoles: this.filterRoles(cachedRoles, this.data.activeCategory, this.data.searchValue),
            recommendedRoles: recommendedRoles,
            loading: false
          });

          if (callback) callback();
        });
        return;
      }
    }

    // 缓存不存在或已过期，从服务器获取角色列表
    console.log('从服务器获取角色列表，参数:', {
      action: 'getRoles',
      userId: userId
    });

    wx.cloud.callFunction({
      name: 'roles',
      data: {
        action: 'getRoles',
        userId: userId
      }
    })
    .then(res => {
      console.log('从服务器获取角色列表成功:', res.result);
      let roles = res.result.data || [];

      console.log('角色总数:', roles.length);

      // 分离系统角色和用户角色
      const systemRoles = roles.filter(role => role.creator === 'system' || role.isSystem);
      const userRoles = roles.filter(role => role.creator !== 'system' && !role.isSystem);

      console.log('系统角色数量:', systemRoles.length);
      console.log('用户角色数量:', userRoles.length);

      // 获取聊天记录统计，用于推荐角色 - 考虑所有角色（系统角色和用户角色）
      this.getChatsStatistics(roles, openid || userId, (rolesWithStats) => {
        // 根据消息数量排序，选择前两个作为推荐角色
        const recommendedRoles = this.getRecommendedRolesByMessageCount(rolesWithStats);

        // 将角色列表存入缓存
        wx.setStorageSync(cacheKey, roles);
        wx.setStorageSync(cacheTimeKey, currentTime);
        console.log('角色列表已缓存，过期时间:', new Date(currentTime + cacheExpireTime));

        this.setData({
          roles: roles,
          systemRoles: systemRoles,
          userRoles: userRoles,
          filteredRoles: this.filterRoles(roles, this.data.activeCategory, this.data.searchValue),
          recommendedRoles: recommendedRoles,
          loading: false
        });

        if (callback) callback();
      });
    })
    .catch(err => {
      console.error('获取角色列表失败:', err);
      wx.showToast({
        title: '获取角色列表失败',
        icon: 'none'
      });
      this.setData({ loading: false });
      if (callback) callback();
    });
  },

  /**
   * 获取聊天记录统计，用于推荐角色
   * @param {Array} roles - 角色列表
   * @param {String} userId - 用户ID或openid
   * @param {Function} callback - 回调函数，返回带有消息统计的角色列表
   */
  getChatsStatistics: function(roles, userId, callback) {
    if (!roles || roles.length === 0) {
      console.log('角色列表为空，无法获取聊天统计');
      callback(roles);
      return;
    }

    console.log('开始获取聊天记录统计...');
    const db = wx.cloud.database();

    // 查询所有聊天记录
    db.collection('chats')
      .where({
        openId: userId // 使用openId查询
      })
      .get()
      .then(res => {
        const chats = res.data || [];
        console.log(`获取到 ${chats.length} 条聊天记录`);

        // 创建角色消息数量映射
        const roleMessageCounts = {};

        // 统计每个角色的消息数量
        chats.forEach(chat => {
          if (chat.roleId && chat.messageCount) {
            if (!roleMessageCounts[chat.roleId]) {
              roleMessageCounts[chat.roleId] = 0;
            }
            roleMessageCounts[chat.roleId] += chat.messageCount;
          }
        });

        console.log('角色消息数量统计:', roleMessageCounts);

        // 记录消息数量最多的前5个角色
        const topRoleIds = Object.entries(roleMessageCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(entry => entry[0]);

        console.log('消息数量最多的前5个角色ID:', topRoleIds);

        // 将消息数量添加到角色对象中
        const rolesWithStats = roles.map(role => {
          return {
            ...role,
            messageCount: roleMessageCounts[role._id] || 0
          };
        });

        // 检查是否有角色ID在统计中但不在角色列表中
        const missingRoleIds = Object.keys(roleMessageCounts).filter(
          roleId => !roles.some(role => role._id === roleId)
        );

        if (missingRoleIds.length > 0) {
          console.warn('以下角色ID在聊天统计中存在，但不在角色列表中:', missingRoleIds);
        }

        callback(rolesWithStats);
      })
      .catch(err => {
        console.error('获取聊天记录统计失败:', err);
        // 出错时仍然返回原始角色列表
        callback(roles);
      });
  },

  /**
   * 根据消息数量获取推荐角色
   * @param {Array} roles - 带有消息统计的角色列表
   * @returns {Array} - 推荐角色列表（最多2个）
   */
  getRecommendedRolesByMessageCount: function(roles) {
    if (!roles || roles.length === 0) {
      return [];
    }

    // 按消息数量降序排序
    const sortedRoles = [...roles].sort((a, b) => {
      return (b.messageCount || 0) - (a.messageCount || 0);
    });

    console.log('按消息数量排序后的前5个角色:', sortedRoles.slice(0, 5).map(role => ({
      id: role._id,
      name: role.name,
      messageCount: role.messageCount || 0
    })));

    // 选择前两个有消息记录的角色作为推荐角色，不区分系统角色和用户角色
    const recommendedRoles = sortedRoles
      .filter(role => role.messageCount > 0)
      .slice(0, 2);

    console.log('根据消息数量推荐的角色:', recommendedRoles.map(role => ({
      id: role._id,
      name: role.name,
      messageCount: role.messageCount || 0
    })));

    // 如果没有足够的有消息记录的角色，则使用原来的isRecommended字段补充
    if (recommendedRoles.length < 2) {
      const defaultRecommended = roles
        .filter(role => role.isRecommended && !recommendedRoles.some(r => r._id === role._id))
        .slice(0, 2 - recommendedRoles.length);

      recommendedRoles.push(...defaultRecommended);
      console.log('补充默认推荐角色后:', recommendedRoles.map(role => ({
        id: role._id,
        name: role.name,
        messageCount: role.messageCount || 0,
        isRecommended: role.isRecommended
      })));
    }

    return recommendedRoles;
  },

  /**
   * 过滤角色列表
   * @param {Array} roles - 角色列表
   * @param {String} category - 分类
   * @param {String} searchValue - 搜索关键词
   * @returns {Array} - 过滤后的角色列表
   */
  filterRoles: function (roles, category, searchValue) {
    if (!roles || !Array.isArray(roles)) {
      console.log('角色列表为空或不是数组');
      return [];
    }

    return roles.filter(role => {
      if (!role) return false;

      // 分类过滤
      let categoryMatch = category === 'all';
      if (!categoryMatch) {
        // 检查多个可能的分类字段
        const roleCategory = role.category || role.role_type;
        if (roleCategory === category) {
          categoryMatch = true;
        }
        // 特殊处理：work和career视为相同
        else if ((category === 'career' && roleCategory === 'work') ||
                 (category === 'work' && roleCategory === 'career')) {
          categoryMatch = true;
        }
      }

      // 搜索过滤
      if (!searchValue) return categoryMatch;

      const name = role.name || role.role_name || '';
      const description = role.description || role.role_desc || role.background || '';
      const relationship = role.relationship || '';
      const occupation = role.occupation || '';

      const searchLower = searchValue.toLowerCase();
      const searchMatch = name.toLowerCase().includes(searchLower) ||
                         description.toLowerCase().includes(searchLower) ||
                         relationship.toLowerCase().includes(searchLower) ||
                         occupation.toLowerCase().includes(searchLower);

      return categoryMatch && searchMatch;
    });
  },

  /**
   * 切换分类
   * @param {Object} e - 事件对象
   */
  handleCategoryChange: function (e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      activeCategory: category,
      filteredRoles: this.filterRoles(this.data.roles, category, this.data.searchValue)
    });
  },

  /**
   * 搜索角色
   * @param {Object} e - 事件对象
   */
  handleSearchInput: function (e) {
    const searchValue = e.detail.value;
    this.setData({
      searchValue: searchValue,
      filteredRoles: this.filterRoles(this.data.roles, this.data.activeCategory, searchValue)
    });
  },

  /**
   * 清空搜索
   */
  handleClearSearch: function () {
    this.setData({
      searchValue: '',
      filteredRoles: this.filterRoles(this.data.roles, this.data.activeCategory, '')
    });
  },

  /**
   * 选择角色
   * @param {Object} e - 事件对象
   */
  handleSelectRole: function (e) {
    const role = e.detail.role;

    // 如果点击的是已选中的角色，则取消选中
    if (this.data.selectedRoleId === role._id) {
      this.setData({ selectedRoleId: '' });
    } else {
      this.setData({ selectedRoleId: role._id });
    }
  },

  /**
   * 开始对话
   */
  handleStartChat: function () {
    if (!this.data.selectedRoleId) {
      wx.showToast({
        title: '请先选择一个角色',
        icon: 'none'
      });
      return;
    }

    // 跳转到聊天页面
    wx.navigateTo({
      url: '/packageChat/pages/chat/chat?roleId=' + this.data.selectedRoleId,
      success: () => {
        console.log('跳转到聊天页面成功');
        // 将选中的角色ID存入全局变量
        app.globalData.chatParams = { roleId: this.data.selectedRoleId };
      }
    });
  },

  /**
   * 创建新角色
   */
  handleCreateRole: function () {
    wx.navigateTo({
      url: '/pages/role-editor/index'
    });
  },

  /**
   * 长按角色卡片显示操作菜单
   * @param {Object} e - 事件对象
   */
  handleLongPressRole: function (e) {
    const role = e.detail.role;
    this.setData({
      currentRole: role,
      showRoleDetail: true
    });
  },

  /**
   * 查看角色详情
   * @param {String} roleId - 角色ID
   */
  viewRoleDetail: function (roleId) {
    const role = this.data.roles.find(r => r._id === roleId);

    if (!role) return;

    wx.showModal({
      title: role.name,
      content: `${role.description || '暂无描述'}\n\n背景：${role.background || '暂无'}\n\n性格：${role.personality_traits ? role.personality_traits.join(', ') : '暂无'}\n\n使用次数：${role.usage ? role.usage.usageCount : 0}`,
      showCancel: false
    });
  },

  /**
   * 编辑角色
   * @param {Object} e - 事件对象
   */
  editRole: function (e) {
    const role = e.currentTarget.dataset.role;
    console.log('编辑角色，角色数据:', role);

    if (!role || !role._id) {
      console.error('无法编辑角色，角色数据不完整');
      wx.showToast({
        title: '角色数据不完整',
        icon: 'none'
      });
      return;
    }

    // 关闭详情弹窗
    this.setData({
      showRoleDetail: false
    });

    // 跳转到角色编辑页面
    console.log('准备跳转到角色编辑页面，角色ID:', role._id);
    wx.navigateTo({
      url: `/pages/role-editor/index?id=${role._id}`,
      success: (res) => {
        console.log('跳转到角色编辑页面成功');
      },
      fail: (err) => {
        console.error('跳转到角色编辑页面失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 删除角色
   * @param {String|Object} roleIdOrEvent - 角色ID或事件对象
   */
  deleteRole: function (roleIdOrEvent) {
    let roleId;

    // 判断参数类型
    if (typeof roleIdOrEvent === 'string') {
      // 直接传入的角色ID
      roleId = roleIdOrEvent;
    } else if (roleIdOrEvent && roleIdOrEvent.currentTarget && roleIdOrEvent.currentTarget.dataset) {
      // 事件对象，从数据集中获取角色ID
      const role = roleIdOrEvent.currentTarget.dataset.role;
      if (role && role._id) {
        roleId = role._id;

        // 如果是从详情弹窗调用，关闭弹窗
        this.setData({
          showRoleDetail: false
        });
      }
    }

    if (!roleId) {
      console.error('无法删除角色，角色ID不存在');
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个角色吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          // 调用云函数删除角色
          wx.cloud.callFunction({
            name: 'roles',
            data: {
              action: 'deleteRole',
              roleId: roleId
            }
          })
          .then(res => {
            console.log('删除角色成功:', res.result);
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });

            // 删除角色后清除缓存并强制刷新角色列表
            const userInfo = app.globalData.userInfo;
            const userId = userInfo.userId || userInfo.user_id || userInfo._id || userInfo.openid;
            const cacheKey = `roles_cache_${userId}`;
            const cacheTimeKey = `roles_cache_time_${userId}`;
            wx.removeStorageSync(cacheKey);
            wx.removeStorageSync(cacheTimeKey);

            // 重新加载角色列表，强制从服务器获取
            this.loadRoles(null, true);
          })
          .catch(err => {
            console.error('删除角色失败:', err);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  // 已删除未使用的 handleBackClick 函数

  /**
   * 关闭角色详情
   */
  closeRoleDetail: function () {
    this.setData({
      showRoleDetail: false
    });
  },

  // 已删除未使用的 formatEmotionalTendency 函数

  /**
   * 选择并开始对话
   */
  handleSelectAndChat: function (e) {
    const role = e.currentTarget.dataset.role;

    // 设置选中的角色
    this.setData({
      selectedRoleId: role._id,
      showRoleDetail: false
    });

    // 开始对话
    wx.navigateTo({
      url: '/packageChat/pages/chat/chat?roleId=' + role._id,
      success: () => {
        console.log('跳转到聊天页面成功');
        // 将选中的角色ID存入全局变量
        app.globalData.chatParams = { roleId: role._id };
      }
    });
  },



  // 已删除未使用的 createTestRoles 函数
});
