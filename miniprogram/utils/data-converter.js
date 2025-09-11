/**
 * 数据转换工具 - 用于前端和数据库格式之间的转换
 */

const DataConverter = {
  /**
   * 数据库格式转前端格式
   * @param {Object} dbData - 数据库格式的用户数据
   * @returns {Object} 前端格式的用户数据
   */
  dbToFrontend: function(dbData) {
    if (!dbData) return {};
    
    return {
      // 基础信息
      userId: dbData.user_id || '',
      openid: dbData.openid || '',
      username: dbData.username || '',
      avatarUrl: dbData.avatar_url || '',
      nickName: dbData.username || '', // 保持兼容性
      userType: dbData.user_type || 1,
      status: dbData.status || 1,
      
      // 个人信息
      gender: this.convertNumberToGender(dbData.profile?.gender),
      age: dbData.profile?.age?.toString() || '',
      bio: dbData.profile?.bio || '',
      birthday: dbData.profile?.birthday || '',
      country: dbData.profile?.country || '',
      province: dbData.profile?.province || '',
      city: dbData.profile?.city || '',
      
      // 配置信息
      darkMode: dbData.config?.dark_mode || false,
      notificationEnabled: dbData.config?.notification_enabled || true,
      language: dbData.config?.language || 'zh-CN',
      theme: dbData.config?.theme || 'default',
      fontSize: dbData.config?.font_size || 16,
      
      // 统计信息
      stats: {
        chatCount: dbData.stats?.chat_count || 0,
        solvedCount: dbData.stats?.solved_count || 0,
        ratingAvg: dbData.stats?.rating_avg || 0,
        ratingCount: dbData.stats?.rating_count || 0,
        activeDays: dbData.stats?.active_days || 0,
        lastActive: dbData.stats?.last_active || new Date(),
        consecutiveDays: dbData.stats?.consecutive_days || 0,
        totalSessionTime: dbData.stats?.total_session_time || 0
      },
      
      // 系统时间
      createdAt: dbData.created_at || new Date(),
      updatedAt: dbData.updated_at || new Date()
    };
  },
  
  /**
   * 前端格式转数据库格式
   * @param {Object} frontendData - 前端格式的用户数据
   * @returns {Object} 数据库格式的用户数据
   */
  frontendToDb: function(frontendData) {
    if (!frontendData) return {};
    
    return {
      // 基础信息
      username: frontendData.nickName || frontendData.username || '',
      avatar_url: frontendData.avatarUrl || '',
      
      // 个人信息
      profile: {
        gender: this.convertGenderToNumber(frontendData.gender),
        age: parseInt(frontendData.age) || null,
        bio: frontendData.bio || '',
        birthday: frontendData.birthday || null,
        country: frontendData.country || '',
        province: frontendData.province || '',
        city: frontendData.city || ''
      },
      
      // 配置信息
      config: {
        dark_mode: frontendData.darkMode || false,
        notification_enabled: frontendData.notificationEnabled !== false,
        language: frontendData.language || 'zh-CN',
        theme: frontendData.theme || 'default',
        font_size: frontendData.fontSize || 16,
        reportSettings: {
          notificationEnabled: frontendData.notificationEnabled !== false
        }
      }
    };
  },
  
  /**
   * 性别字符串转数字
   * @param {string} gender - 性别字符串
   * @returns {number} 性别数字
   */
  convertGenderToNumber: function(gender) {
    if (!gender) return 0;
    const genderMap = { '男': 1, '女': 2, '其他': 0 };
    return genderMap[gender] || 0;
  },
  
  /**
   * 性别数字转字符串
   * @param {number} gender - 性别数字
   * @returns {string} 性别字符串
   */
  convertNumberToGender: function(gender) {
    if (typeof gender !== 'number') return '其他';
    const genderMap = { 1: '男', 2: '女', 0: '其他' };
    return genderMap[gender] || '其他';
  },
  
  /**
   * 验证用户数据
   * @param {Object} userData - 用户数据
   * @returns {Object} 验证结果
   */
  validateUserData: function(userData) {
    const errors = [];
    
    if (!userData.nickName || userData.nickName.trim() === '') {
      errors.push('昵称不能为空');
    }
    
    if (userData.nickName && userData.nickName.length > 20) {
      errors.push('昵称长度不能超过20个字符');
    }
    
    if (userData.bio && userData.bio.length > 200) {
      errors.push('个人简介长度不能超过200个字符');
    }
    
    if (userData.age && (isNaN(userData.age) || userData.age < 1 || userData.age > 120)) {
      errors.push('年龄必须在1-120之间');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },
  
  /**
   * 格式化统计信息
   * @param {Object} stats - 统计信息
   * @returns {Object} 格式化后的统计信息
   */
  formatStats: function(stats) {
    if (!stats) return {};
    
    return {
      chatCount: stats.chat_count || 0,
      solvedCount: stats.solved_count || 0,
      ratingAvg: (stats.rating_avg || 0).toFixed(1),
      ratingCount: stats.rating_count || 0,
      activeDays: stats.active_days || 0,
      consecutiveDays: stats.consecutive_days || 0,
      totalSessionTime: Math.round(stats.total_session_time || 0),
      lastActiveText: this.formatDate(stats.last_active)
    };
  },
  
  /**
   * 格式化日期
   * @param {Date|string} date - 日期
   * @returns {string} 格式化后的日期字符串
   */
  formatDate: function(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }
    
    // 小于1小时
    if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前';
    }
    
    // 小于1天
    if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前';
    }
    
    // 小于7天
    if (diff < 604800000) {
      return Math.floor(diff / 86400000) + '天前';
    }
    
    // 大于7天
    return d.toLocaleDateString('zh-CN');
  }
};

module.exports = DataConverter;