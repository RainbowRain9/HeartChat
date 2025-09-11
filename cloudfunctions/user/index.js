// user 云函数 index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 导入模块
// 使用新版本的用户画像处理模块，基于智谱AI实现
const userPerception = require('./userPerception_new');
// 导入用户兴趣处理模块
const userInterests = require('./userInterests');
// 导入创建索引模块
const createIndexes = require('./createIndexes');

// 子功能：获取用户信息
async function getInfo(event) {
  const wxContext = cloud.getWXContext();
  const { OPENID } = wxContext;

  const { userId } = event;

  try {
    // 获取统一用户信息
    const userResult = await db.collection('users')
      .where({ user_id: userId })
      .get();

    if (!userResult.data || userResult.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      };
    }

    // 构建完整的用户信息
    const userData = userResult.data[0];
    
    const user = {
      userId: userData.user_id,
      username: userData.username,
      avatarUrl: userData.avatar_url,
      userType: userData.user_type,
      status: userData.status,
      gender: userData.profile?.gender,
      age: userData.profile?.age,
      country: userData.profile?.country,
      province: userData.profile?.province,
      city: userData.profile?.city,
      bio: userData.profile?.bio,
      stats: userData.stats,
      config: userData.config
    };

    return {
      success: true,
      data: {
        user
      }
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return {
      success: false,
      error: error
    };
  }
}

// 子功能：更新用户资料
async function updateProfile(event, context) {
  const wxContext = cloud.getWXContext();
  const { OPENID } = wxContext;

  const {
    userId,
    username,
    avatarUrl,
    gender,
    age,
    country,
    province,
    city,
    bio,
    settings,
    config
  } = event;

  try {
    console.log('开始更新用户信息:', {
      userId: userId,
      username: username,
      avatarUrl: avatarUrl,
      gender: gender,
      age: age,
      bio: bio,
      settings: settings,
      config: config
    });
    
    // 构建更新数据
    const updateData = {
      username: username,
      avatar_url: avatarUrl,
      updated_at: db.serverDate(),
      
      // 更新 profile 对象
      'profile.gender': gender,
      'profile.age': age,
      'profile.country': country,
      'profile.province': province,
      'profile.city': city,
      'profile.bio': bio,
      
      // 更新 config 对象 - 优先使用 config 对象，兼容 settings 对象
      'config.dark_mode': config?.dark_mode || settings?.darkMode,
      'config.notification_enabled': config?.notification_enabled !== undefined ? config?.notification_enabled : settings?.notificationEnabled,
      'config.language': config?.language || settings?.language
    };

    // 统一更新用户信息
    const updateResult = await db.collection('users').where({
      user_id: userId
    }).update({
      data: updateData
    });
    
    console.log('用户信息更新结果:', updateResult);

    // 获取更新后的用户信息
    const updatedUser = await db.collection('users')
      .where({ user_id: userId })
      .get();

    // 返回更新后的完整用户信息
    return {
      success: true,
      data: {
        updateResult,
        updatedUser: {
          userId: userId,
          username: username,
          avatarUrl: avatarUrl,
          gender: gender,
          age: age,
          country: country,
          province: province,
          city: city,
          bio: bio,
          userType: updatedUser.data[0]?.user_type || 1,
          status: updatedUser.data[0]?.status || 1,
          stats: updatedUser.data[0]?.stats || null,
          config: updatedUser.data[0]?.config || null
        }
      }
    };
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return {
      success: false,
      error: error
    };
  }
}

// 子功能：获取用户统计
async function getStats(event, context) {
  const { OPENID } = cloud.getWXContext();

  try {
    // 获取请求参数
    const { userId } = event;

    // 构建查询条件
    const query = {};

    // 如果提供了userId，添加到查询条件
    if (userId) {
      query.user_id = userId;
      console.log('使用userId查询:', userId);
    } else {
      // 如果没有提供userId，使用openid
      query.openid = OPENID;
      console.log('使用openId查询:', OPENID);
    }

    console.log('查询条件:', query);

    // 查询用户信息（包含统计数据）
    const result = await db.collection('users')
      .where(query)
      .get();

    console.log('查询结果:', result.data.length > 0 ? '找到数据' : '未找到数据');

    if (result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0].stats
      };
    } else {
      return {
        success: false,
        error: '未找到用户统计数据'
      };
    }
  } catch (error) {
    console.error('获取用户统计数据失败:', error);
    return {
      success: false,
      error: error.message || error
    };
  }
}

// 子功能：更新用户统计
async function updateStats(event, context) {
  const wxContext = cloud.getWXContext();
  const { OPENID } = wxContext;

  const { userId, statsType, value } = event;

  try {
    console.log(`更新用户统计数据: userId=${userId}, statsType=${statsType}, value=${value}`);

    // 获取用户信息
    const userResult = await db.collection('users')
      .where({ user_id: userId })
      .get();

    if (!userResult.data || userResult.data.length === 0) {
      console.error('用户不存在');
      return {
        success: false,
        error: '用户不存在'
      };
    }

    const user = userResult.data[0];
    const userStats = user.stats;
    const userDocId = user._id;

    // 根据统计类型更新不同的字段
    const updateData = {
      updated_at: db.serverDate()
    };

    switch (statsType) {
      case 'chatCount':
        // 更新对话次数
        updateData['stats.chat_count'] = _.inc(value);
        break;
      case 'solvedCount':
        // 更新解决问题次数
        updateData['stats.solved_count'] = _.inc(value);
        break;
      case 'rating':
        // 更新评分
        // 计算新的平均评分
        const currentRating = userStats.rating_avg || 0;
        const currentCount = userStats.rating_count || 0;
        const newRating = (currentRating * currentCount + value) / (currentCount + 1);

        updateData['stats.rating_avg'] = parseFloat(newRating.toFixed(2));
        updateData['stats.rating_count'] = _.inc(1);
        break;
      case 'activeDay':
        // 更新活跃天数
        // 检查上次活跃时间是否是今天
        const lastActive = userStats.last_active ? new Date(userStats.last_active) : null;
        const today = new Date();
        const isToday = lastActive &&
          lastActive.getFullYear() === today.getFullYear() &&
          lastActive.getMonth() === today.getMonth() &&
          lastActive.getDate() === today.getDate();

        updateData['stats.last_active'] = db.serverDate();
        if (!isToday) {
          updateData['stats.active_days'] = _.inc(1);
        }
        break;
      default:
        console.error('未知的统计类型:', statsType);
        return {
          success: false,
          error: '未知的统计类型'
        };
    }

    // 更新用户统计信息
    await db.collection('users').doc(userDocId).update({
      data: updateData
    });

    // 获取更新后的用户统计信息
    const updatedUserResult = await db.collection('users')
      .doc(userDocId)
      .get();

    return {
      success: true,
      data: {
        stats: updatedUserResult.data.stats
      }
    };
  } catch (error) {
    console.error('更新用户统计失败:', error);
    return {
      success: false,
      error: error
    };
  }
}

/**
 * 获取用户报告列表
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function getReportList(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;

    // 获取参数
    const { limit = 10, skip = 0 } = event;

    // 初始化数据库
    const db = cloud.database();

    // 查询用户报告列表
    const reports = await db.collection('userReports')
      .where({ userId })
      .orderBy('date', 'desc')
      .skip(skip)
      .limit(limit)
      .get();

    // 获取总数
    const countResult = await db.collection('userReports')
      .where({ userId })
      .count();

    return {
      success: true,
      reports: reports.data,
      total: countResult.total
    };
  } catch (error) {
    console.error('获取用户报告列表失败:', error);
    return {
      success: false,
      error: error.message || '获取用户报告列表失败'
    };
  }
}

/**
 * 标记报告为已读
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function markReportAsRead(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();

    // 获取参数
    const { reportId } = event;

    if (!reportId) {
      return {
        success: false,
        error: '缺少报告ID'
      };
    }

    // 初始化数据库
    const db = cloud.database();

    // 查询报告是否存在且属于当前用户
    const report = await db.collection('userReports')
      .doc(reportId)
      .get();

    if (!report.data || report.data.userId !== wxContext.OPENID) {
      return {
        success: false,
        error: '报告不存在或无权限访问'
      };
    }

    // 更新报告为已读
    await db.collection('userReports')
      .doc(reportId)
      .update({
        data: {
          isRead: true
        }
      });

    return {
      success: true
    };
  } catch (error) {
    console.error('标记报告为已读失败:', error);
    return {
      success: false,
      error: error.message || '标记报告为已读失败'
    };
  }
}

/**
 * 获取用户兴趣数据
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function getUserInterests(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;

    // 使用用户兴趣模块获取数据
    const result = await userInterests.getUserInterests(userId);

    return result;
  } catch (error) {
    console.error('获取用户兴趣数据失败:', error);
    return {
      success: false,
      error: error.message || '获取用户兴趣数据失败'
    };
  }
}

/**
 * 获取用户配置
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function getUserConfig(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;

    console.log(`获取用户配置, 用户ID: ${userId}`);

    // 查询用户配置
    const userResult = await db.collection('users')
      .where({ user_id: userId })
      .get();

    if (!userResult.data || userResult.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      };
    }

    const userData = userResult.data[0];
    const config = userData.config || {};

    console.log('用户配置数据:', config);

    return {
      success: true,
      data: {
        dark_mode: config.dark_mode || false,
        notification_enabled: config.notification_enabled !== false, // 默认为true
        language: config.language || 'zh_CN'
      }
    };
  } catch (error) {
    console.error('获取用户配置失败:', error);
    return {
      success: false,
      error: error.message || '获取用户配置失败'
    };
  }
}

/**
 * 获取用户画像
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function getUserPerception(event) {
  // 默认的用户画像数据，当API调用失败时使用
  const defaultPerceptionData = {
    interests: ['阅读', '音乐', '旅行', '学习'],
    personalityTraits: [
      { trait: '创造力', score: 0.65 },
      { trait: '责任感', score: 0.8 },
      { trait: '同理心', score: 0.7 },
      { trait: '社交性', score: 0.5 },
      { trait: '耐心', score: 0.6 }
    ],
    personalitySummary: '你是一个具有较强责任感和同理心的人，在创造力和耐心方面也有不错的表现。你善于理解他人的情感，并且能够认真完成自己的任务。',
    emotionPatterns: {
      emotionPercentages: {
        '平静': 40,
        '快乐': 30,
        '焦虑': 15,
        '压力': 15
      },
      emotionTrends: { trend: '情绪波动' },
      dominantEmotions: [
        { emotion: '平静', percentage: 40 },
        { emotion: '快乐', percentage: 30 }
      ]
    }
  };

  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;

    console.log(`开始获取用户画像, 用户ID: ${userId}, 使用智谱AI增强版`);

    try {
      // 获取用户画像数据
      const perceptionData = await userPerception.getUserPerception(userId);

      console.log('用户画像数据获取成功');

      // 检查数据是否完整
      if (perceptionData && perceptionData.personalityTraits && perceptionData.personalityTraits.length > 0) {
        return {
          success: true,
          data: perceptionData
        };
      } else {
        console.warn('用户画像数据不完整，使用默认数据');
        return {
          success: true,
          data: defaultPerceptionData,
          message: '使用默认数据'
        };
      }
    } catch (apiError) {
      console.error('调用用户画像 API 失败:', apiError);
      return {
        success: true,
        data: defaultPerceptionData,
        message: '调用API失败，使用默认数据'
      };
    }
  } catch (error) {
    console.error('获取用户画像失败:', error);

    // 即使出错也返回默认数据，确保前端能正常显示
    return {
      success: true,
      data: defaultPerceptionData,
      error: error.message || '获取用户画像失败'
    };
  }
}

/**
 * 更新用户兴趣关键词
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function updateUserInterest(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;
    const { keyword, weightDelta, autoClassify = true } = event;

    // 使用用户兴趣模块更新关键词
    const result = await userInterests.updateUserInterest(userId, keyword, weightDelta, autoClassify);

    return result;
  } catch (error) {
    console.error('更新用户兴趣关键词失败:', error);
    return {
      success: false,
      error: error.message || '更新用户兴趣关键词失败'
    };
  }
}

/**
 * 批量更新用户兴趣关键词
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function batchUpdateUserInterests(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;
    const { keywords, autoClassify = true, categoryStats, categoriesArray } = event;

    console.log('批量更新用户兴趣关键词，参数:', {
      userId,
      keywordsCount: keywords ? keywords.length : 0,
      autoClassify,
      hasCategoryStats: !!categoryStats,
      hasCategoriesArray: !!categoriesArray
    });

    // 使用用户兴趣模块批量更新关键词
    const result = await userInterests.batchUpdateUserInterests(
      userId,
      keywords,
      autoClassify,
      categoryStats,
      categoriesArray
    );

    return result;
  } catch (error) {
    console.error('批量更新用户兴趣关键词失败:', error);
    return {
      success: false,
      error: error.message || '批量更新用户兴趣关键词失败'
    };
  }
}

/**
 * 删除用户兴趣关键词
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function deleteUserInterest(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;
    const { keyword } = event;

    // 使用用户兴趣模块删除关键词
    const result = await userInterests.deleteUserInterest(userId, keyword);

    return result;
  } catch (error) {
    console.error('删除用户兴趣关键词失败:', error);
    return {
      success: false,
      error: error.message || '删除用户兴趣关键词失败'
    };
  }
}

/**
 * 更新关键词分类
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function updateKeywordCategory(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;
    const { keyword, category } = event;

    // 使用用户兴趣模块更新关键词分类
    const result = await userInterests.updateKeywordCategory(userId, keyword, category);

    return result;
  } catch (error) {
    console.error('更新关键词分类失败:', error);
    return {
      success: false,
      error: error.message || '更新关键词分类失败'
    };
  }
}

/**
 * 批量更新关键词分类
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function batchUpdateKeywordCategories(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;
    const { categorizations } = event;

    // 使用用户兴趣模块批量更新关键词分类
    const result = await userInterests.batchUpdateKeywordCategories(userId, categorizations);

    return result;
  } catch (error) {
    console.error('批量更新关键词分类失败:', error);
    return {
      success: false,
      error: error.message || '批量更新关键词分类失败'
    };
  }
}

/**
 * 更新关键词情感分数
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function updateKeywordEmotionScore(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const userId = event.userId || wxContext.OPENID;
    const { keyword, emotionScore } = event;

    // 使用用户兴趣模块更新关键词情感分数
    const result = await userInterests.updateKeywordEmotionScore(userId, keyword, emotionScore);

    return result;
  } catch (error) {
    console.error('更新关键词情感分数失败:', error);
    return {
      success: false,
      error: error.message || '更新关键词情感分数失败'
    };
  }
}

/**
 * 创建数据库索引
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function createDatabaseIndexes(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();

    // 检查是否为管理员
    // 注意：在实际应用中，应该有更完善的权限检查机制
    const isAdmin = event.isAdmin === true;

    if (!isAdmin) {
      return {
        success: false,
        error: '权限不足'
      };
    }

    // 创建索引
    const { collection } = event;
    let result;

    if (collection === 'userInterests') {
      result = await createIndexes.createUserInterestsIndexes();
    } else if (collection === 'roles') {
      result = await createIndexes.createRolesIndexes();
    } else if (collection === 'emotionRecords') {
      result = await createIndexes.createEmotionRecordsIndexes();
    } else {
      // 创建所有索引
      result = await createIndexes.createAllIndexes();
    }

    return result;
  } catch (error) {
    console.error('创建数据库索引失败:', error);
    return {
      success: false,
      error: error.message || '创建数据库索引失败'
    };
  }
}

// 主函数入口
exports.main = async (event, context) => {
  const { action } = event;

  switch (action) {
    case 'getInfo':
      return await getInfo(event);
    case 'updateProfile':
      return await updateProfile(event, context);
    case 'getStats':
      return await getStats(event, context);
    case 'updateStats':
      return await updateStats(event, context);
    case 'getReportList':
      return await getReportList(event);
    case 'markReportAsRead':
      return await markReportAsRead(event);
    case 'getUserInterests':
      return await getUserInterests(event);
    case 'updateUserInterest':
      return await updateUserInterest(event);
    case 'batchUpdateUserInterests':
      return await batchUpdateUserInterests(event);
    case 'deleteUserInterest':
      return await deleteUserInterest(event);
    case 'updateKeywordCategory':
      return await updateKeywordCategory(event);
    case 'batchUpdateKeywordCategories':
      return await batchUpdateKeywordCategories(event);
    case 'updateKeywordEmotionScore':
      return await updateKeywordEmotionScore(event);
    case 'getUserConfig':
      return await getUserConfig(event);
    case 'getUserPerception':
      return await getUserPerception(event);
    case 'createDatabaseIndexes':
      return await createDatabaseIndexes(event);
    default:
      return {
        success: false,
        error: '未知的操作类型'
      };
  }
};

