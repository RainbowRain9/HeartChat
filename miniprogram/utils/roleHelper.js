/**
 * roleHelper.js - 角色管理辅助模块
 * 
 * 提供角色管理相关的功能，包括：
 * - 获取角色列表
 * - 获取角色详情
 * - 更新角色配置
 * - 获取推荐角色
 * - 获取最近使用的角色
 */

// 导入数据库辅助模块
const dbHelper = require('./dbHelper');

// 获取角色列表
async function getRoleList(options = {}) {
  try {
    console.log('开始获取角色列表...');
    const { userId, showLoading = false, useCache = true } = options;

    // 如果需要显示加载状态
    if (showLoading) {
      wx.showLoading({
        title: '加载角色...',
        mask: false
      });
    }

    // 尝试从本地缓存获取角色列表
    const cacheKey = 'roleList';
    const cachedRoles = wx.getStorageSync(cacheKey);
    const cacheTime = wx.getStorageSync(`${cacheKey}_time`) || 0;
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5分钟缓存过期时间

    // 如果有缓存且未过期，且允许使用缓存，直接使用缓存数据
    if (useCache && cachedRoles && (now - cacheTime) < cacheExpiry) {
      console.log('使用本地缓存的角色列表，角色数量:', cachedRoles.length);
      
      if (showLoading) {
        wx.hideLoading();
      }

      // 如果有用户ID，获取角色使用统计
      if (userId) {
        try {
          // 获取所有角色ID
          const roleIds = cachedRoles.map(role => role._id);
          
          // 获取角色使用统计
          const stats = await dbHelper.getRoleUsageStats(roleIds, userId);
          
          // 更新角色使用次数
          const updatedRoles = cachedRoles.map(role => {
            return {
              ...role,
              useCount: stats[role._id] || 0
            };
          });
          
          // 更新本地缓存
          wx.setStorageSync(cacheKey, updatedRoles);
          wx.setStorageSync(`${cacheKey}_time`, now);
          
          return updatedRoles;
        } catch (statsErr) {
          console.error('获取角色使用统计失败:', statsErr);
          // 如果获取统计失败，仍然返回缓存的角色列表
          return cachedRoles;
        }
      }
      
      return cachedRoles;
    }

    // 如果没有缓存或缓存已过期，从云函数获取数据
    console.log('本地缓存不存在或已过期，从云函数获取数据...');

    // 调用云函数获取角色列表
    const { result } = await wx.cloud.callFunction({
      name: 'role',
      data: {
        action: 'list'
      }
    });

    if (!result || !result.success) {
      throw new Error(result?.error || '获取角色列表失败');
    }

    const roles = result.data || [];
    console.log(`从云函数获取到 ${roles.length} 个角色`);

    // 如果有用户ID，获取角色使用统计
    if (userId && roles.length > 0) {
      try {
        // 获取所有角色ID
        const roleIds = roles.map(role => role._id);
        
        // 获取角色使用统计
        const stats = await dbHelper.getRoleUsageStats(roleIds, userId);
        
        // 更新角色使用次数
        roles.forEach(role => {
          role.useCount = stats[role._id] || 0;
        });
      } catch (statsErr) {
        console.error('获取角色使用统计失败:', statsErr);
        // 不影响返回角色列表
      }
    }

    // 保存到本地缓存
    wx.setStorageSync(cacheKey, roles);
    wx.setStorageSync(`${cacheKey}_time`, now);
    console.log('角色列表已保存到本地缓存');

    if (showLoading) {
      wx.hideLoading();
    }

    return roles;
  } catch (err) {
    console.error('获取角色列表失败:', err);
    if (options.showLoading) {
      wx.hideLoading();
    }
    
    // 如果获取失败，尝试返回缓存数据
    const cachedRoles = wx.getStorageSync('roleList') || [];
    return cachedRoles;
  }
}

// 获取角色详情
async function getRoleDetail(roleId) {
  try {
    if (!roleId) {
      throw new Error('角色ID不能为空');
    }

    // 尝试从本地缓存获取角色列表
    const cachedRoles = wx.getStorageSync('roleList') || [];
    
    // 在缓存中查找角色
    const cachedRole = cachedRoles.find(role => role._id === roleId);
    if (cachedRole) {
      console.log('从本地缓存获取角色详情:', cachedRole.role_name);
      return cachedRole;
    }

    // 如果缓存中没有，从云函数获取
    console.log('本地缓存中没有找到角色，从云函数获取...');
    const { result } = await wx.cloud.callFunction({
      name: 'role',
      data: {
        action: 'get',
        roleId
      }
    });

    if (!result || !result.success) {
      throw new Error(result?.error || '获取角色详情失败');
    }

    const role = result.data;
    if (!role) {
      throw new Error('未找到角色');
    }

    console.log('从云函数获取到角色详情:', role.role_name);
    return role;
  } catch (err) {
    console.error('获取角色详情失败:', err);
    throw err;
  }
}

// 更新角色配置
function updateAgentConfig(role, agentUI) {
  try {
    if (!role) {
      console.warn('角色信息为空，无法更新配置');
      return false;
    }

    if (!agentUI) {
      console.warn('agent-ui 组件实例不存在，无法更新配置');
      return false;
    }

    console.log('更新角色配置:', {
      roleName: role.role_name,
      relationship: role.relationship
    });

    // 构建系统提示词
    const systemPrompt = `根据我的角色信息调整对话风格：
我是${role.role_name}，作为${role.relationship}与你对话。
我的特点是：${role.role_desc || '无特殊说明'}
我的性格风格是：${role.style || '自然友好'}
我的说话风格是：${role.speaking_style || '自然友好'}
我的背景故事是：${role.background || '无特殊背景'}
我需要避免的话题是：${role.taboo || '无特殊禁忌'}

请在保持心情树洞AI智能体的基础定位下，根据以上角色信息调整对话风格。`;

    // 更新 agent-ui 组件配置
    agentUI.setConfig({
      botName: role.role_name,
      botAvatar: role.avatar_url || '/images/default_avatar.png',
      systemPrompt: systemPrompt,
      prompt: systemPrompt, // 兼容旧版本
      temperature: role.temperature || 0.8,
      maxTokens: role.max_tokens || 2000,
      botId: role.bot_id || 'glm-4'
    });

    console.log('角色配置已更新');
    return true;
  } catch (err) {
    console.error('更新角色配置失败:', err);
    return false;
  }
}

// 获取推荐角色
async function getRecommendedRoles(options = {}) {
  try {
    const { userId, limit = 2, useCache = true } = options;
    
    if (!userId) {
      console.warn('用户ID为空，无法获取推荐角色');
      return [];
    }

    // 尝试从本地缓存获取推荐角色
    const cacheKey = `recommendedRoles_${userId}`;
    const cachedRoles = wx.getStorageSync(cacheKey);
    const cacheTime = wx.getStorageSync(`${cacheKey}_time`) || 0;
    const now = Date.now();
    const cacheExpiry = 30 * 60 * 1000; // 30分钟缓存过期时间

    // 如果有缓存且未过期，且允许使用缓存，直接使用缓存数据
    if (useCache && cachedRoles && (now - cacheTime) < cacheExpiry) {
      console.log('使用本地缓存的推荐角色，角色数量:', cachedRoles.length);
      return cachedRoles;
    }

    // 获取所有角色
    const allRoles = await getRoleList({ userId, useCache });
    if (!allRoles || allRoles.length === 0) {
      console.warn('没有可用的角色');
      return [];
    }

    // 根据使用次数排序
    const sortedRoles = [...allRoles].sort((a, b) => {
      return (b.useCount || 0) - (a.useCount || 0);
    });

    // 获取前N个角色
    const recommendedRoles = sortedRoles.slice(0, limit);
    console.log(`根据使用次数推荐了 ${recommendedRoles.length} 个角色`);

    // 保存到本地缓存
    wx.setStorageSync(cacheKey, recommendedRoles);
    wx.setStorageSync(`${cacheKey}_time`, now);

    return recommendedRoles;
  } catch (err) {
    console.error('获取推荐角色失败:', err);
    return [];
  }
}

// 获取最近使用的角色
async function getRecentlyUsedRoles(options = {}) {
  try {
    const { userId, limit = 3, useCache = true } = options;
    
    if (!userId) {
      console.warn('用户ID为空，无法获取最近使用的角色');
      return [];
    }

    // 尝试从本地缓存获取最近使用的角色
    const cacheKey = `recentRoles_${userId}`;
    const cachedRoles = wx.getStorageSync(cacheKey);
    const cacheTime = wx.getStorageSync(`${cacheKey}_time`) || 0;
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5分钟缓存过期时间

    // 如果有缓存且未过期，且允许使用缓存，直接使用缓存数据
    if (useCache && cachedRoles && (now - cacheTime) < cacheExpiry) {
      console.log('使用本地缓存的最近使用角色，角色数量:', cachedRoles.length);
      return cachedRoles;
    }

    // 调用云函数获取最近使用的角色
    console.log('从云函数获取最近使用的角色...');
    const { result } = await wx.cloud.callFunction({
      name: 'role',
      data: {
        action: 'getRecentlyUsed',
        userId,
        limit
      }
    });

    if (!result || !result.success) {
      throw new Error(result?.error || '获取最近使用的角色失败');
    }

    const recentRoles = result.data || [];
    console.log(`从云函数获取到 ${recentRoles.length} 个最近使用的角色`);

    // 保存到本地缓存
    wx.setStorageSync(cacheKey, recentRoles);
    wx.setStorageSync(`${cacheKey}_time`, now);

    return recentRoles;
  } catch (err) {
    console.error('获取最近使用的角色失败:', err);
    
    // 如果获取失败，尝试返回缓存数据
    const cachedRoles = wx.getStorageSync(`recentRoles_${options.userId}`) || [];
    return cachedRoles;
  }
}

module.exports = {
  getRoleList,
  getRoleDetail,
  updateAgentConfig,
  getRecommendedRoles,
  getRecentlyUsedRoles
};
