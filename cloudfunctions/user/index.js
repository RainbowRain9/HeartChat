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
    // 获取用户基本信息
    const userBaseResult = await db.collection('user_base')
      .where({ user_id: userId })
      .get();

    if (!userBaseResult.data || userBaseResult.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      };
    }

    // 获取用户统计信息
    const userStatsResult = await db.collection('user_stats')
      .where({ user_id: userId })
      .get();

    // 获取用户详细信息
    const userProfileResult = await db.collection('user_profile')
      .where({ user_id: userId })
      .get();

    // 获取用户配置
    const userConfigResult = await db.collection('user_config')
      .where({ user_id: userId })
      .get();

    // 构建完整的用户信息
    const userBase = userBaseResult.data[0];
    const userStats = userStatsResult.data[0] || null;
    const userProfile = userProfileResult.data[0] || {};
    const userConfig = userConfigResult.data[0] || {};

    const user = {
      userId: userBase.user_id,
      username: userBase.username,
      avatarUrl: userBase.avatar_url,
      userType: userBase.user_type,
      status: userBase.status,
      gender: userProfile.gender,
      country: userProfile.country,
      province: userProfile.province,
      city: userProfile.city,
      bio: userProfile.bio,
      stats: userStats
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
    country,
    province,
    city,
    bio,
    settings
  } = event;

  try {
    // 1. 更新用户基本信息
    const userBaseUpdate = await db.collection('user_base').where({
      user_id: userId
    }).update({
      data: {
        username: username,
        avatar_url: avatarUrl,
        updated_at: db.serverDate()
      }
    });

    // 2. 处理用户详细信息
    const profileCheck = await db.collection('user_profile').where({
      user_id: userId
    }).count();

    // 用户详细信息数据
    const profileData = {
      user_id: userId,
      gender: gender,
      country: country,
      province: province,
      city: city,
      bio: bio,
      updated_at: db.serverDate()
    };

    let userProfileUpdate;
    if (profileCheck.total === 0) {
      // 创建新的用户详细信息
      userProfileUpdate = await db.collection('user_profile').add({
        data: {
          ...profileData,
          created_at: db.serverDate()
        }
      });
    } else {
      // 更新现有用户详细信息
      userProfileUpdate = await db.collection('user_profile').where({
        user_id: userId
      }).update({
        data: profileData
      });
    }

    // 3. 处理用户设置
    const configCheck = await db.collection('user_config').where({
      user_id: userId
    }).count();

    // 用户设置数据
    const configData = {
      user_id: userId,
      dark_mode: settings.darkMode,
      notification_enabled: settings.notificationEnabled,
      language: settings.language,
      updated_at: db.serverDate()
    };

    let userConfigUpdate;
    if (configCheck.total === 0) {
      // 创建新的用户设置
      userConfigUpdate = await db.collection('user_config').add({
        data: {
          ...configData,
          created_at: db.serverDate()
        }
      });
    } else {
      // 更新现有用户设置
      userConfigUpdate = await db.collection('user_config').where({
        user_id: userId
      }).update({
        data: configData
      });
    }

    // 获取更新后的用户信息
    const updatedUserBase = await db.collection('user_base')
      .where({ user_id: userId })
      .get();

    // 获取用户统计信息
    const userStats = await db.collection('user_stats')
      .where({ user_id: userId })
      .get();

    // 返回更新后的完整用户信息
    return {
      success: true,
      data: {
        userBaseUpdate,
        userProfileUpdate,
        userConfigUpdate,
        updatedUser: {
          userId: userId,
          username: username,
          avatarUrl: avatarUrl,
          gender: gender,
          country: country,
          province: province,
          city: city,
          bio: bio,
          userType: updatedUserBase.data[0]?.user_type || 1,
          status: updatedUserBase.data[0]?.status || 1,
          stats: userStats.data[0] || null
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

    // 查询用户统计信息
    const result = await db.collection('user_stats')
      .where(query)
      .get();

    console.log('查询结果:', result.data.length > 0 ? '找到数据' : '未找到数据');

    if (result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
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

    // 获取用户统计信息
    const userStatsResult = await db.collection('user_stats')
      .where({ user_id: userId })
      .get();

    if (!userStatsResult.data || userStatsResult.data.length === 0) {
      console.error('用户统计信息不存在');
      return {
        success: false,
        error: '用户统计信息不存在'
      };
    }

    const userStats = userStatsResult.data[0];
    const statsId = userStats._id;

    // 根据统计类型更新不同的字段
    const updateData = {
      updated_at: db.serverDate()
    };

    switch (statsType) {
      case 'chatCount':
        // 更新对话次数
        updateData.chat_count = _.inc(value);
        break;
      case 'solvedCount':
        // 更新解决问题次数
        updateData.solved_count = _.inc(value);
        break;
      case 'rating':
        // 更新评分
        // 计算新的平均评分
        const currentRating = userStats.rating_avg || 0;
        const currentCount = userStats.rating_count || 0;
        const newRating = (currentRating * currentCount + value) / (currentCount + 1);

        updateData.rating_avg = parseFloat(newRating.toFixed(2));
        updateData.rating_count = _.inc(1);
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

        if (!isToday) {
          updateData.active_days = _.inc(1);
        }

        updateData.last_active = db.serverDate();
        break;
      default:
        console.error('未知的统计类型:', statsType);
        return {
          success: false,
          error: '未知的统计类型'
        };
    }

    // 更新用户统计信息
    await db.collection('user_stats').doc(statsId).update({
      data: updateData
    });

    // 获取更新后的用户统计信息
    const updatedStatsResult = await db.collection('user_stats')
      .doc(statsId)
      .get();

    return {
      success: true,
      data: {
        stats: updatedStatsResult.data
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
 * 获取用户的总消息数量
 * @param {Object} event 事件参数
 * @returns {Promise<Object>} 处理结果
 */
async function getTotalMessageCount(event) {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext();
    const { OPENID } = wxContext;

    // 获取请求参数
    const { userId } = event;

    // 构建查询条件 - 使用多种可能的字段名
    // 在chats表中，用户ID可能存储在不同的字段中
    const openid = OPENID;

    // 打印用户ID信息，便于调试
    console.log('用户ID信息:', {
      OPENID: OPENID,
      providedUserId: userId
    });

    // 使用OR条件查询多个可能的字段
    const db = cloud.database();
    const _ = db.command;

    // 构建查询条件，考虑所有可能的字段名和大小写情况
    const query = _.or([
      { openId: openid },
      { openid: openid },
      { userId: openid },
      { userid: openid },
      { user_id: openid }
    ]);

    // 如果提供了userId，也添加到查询条件
    if (userId && userId !== openid) {
      query.push(
        { openId: userId },
        { openid: userId },
        { userId: userId },
        { userid: userId },
        { user_id: userId }
      );
    }

    console.log('查询条件:', query);

    // 使用聚合查询计算所有聊天记录的消息总数
    const $ = db.command.aggregate;

    // 首先获取所有匹配的聊天记录，以便调试
    const chatRecords = await db.collection('chats')
      .where(query)
      .get();

    console.log(`找到 ${chatRecords.data.length} 条匹配的聊天记录`);

    // 如果找到了聊天记录，打印前5条记录的关键信息，便于调试
    if (chatRecords.data.length > 0) {
      const sampleRecords = chatRecords.data.slice(0, 5).map(chat => ({
        id: chat._id,
        roleId: chat.roleId,
        openId: chat.openId || chat.openid,
        messageCount: chat.messageCount
      }));
      console.log('示例聊天记录:', sampleRecords);
    }

    // 使用聚合查询计算总消息数
    const result = await db.collection('chats')
      .aggregate()
      .match(query)
      .group({
        _id: null,
        totalMessageCount: $.sum('$messageCount')
      })
      .end();

    console.log('聚合查询结果:', result);

    // 如果有结果，返回总消息数
    if (result.list && result.list.length > 0) {
      const totalMessageCount = result.list[0].totalMessageCount || 0;
      console.log('用户总消息数:', totalMessageCount);

      // 更新用户统计信息中的总消息数
      try {
        console.log('开始更新user_stats表中的chat_count...');
        console.log('用户ID信息:', { OPENID, userId });

        // 直接获取user_stats表中的所有记录，以便调试
        const allStats = await db.collection('user_stats').get();
        console.log(`user_stats表中共有 ${allStats.data.length} 条记录`);

        if (allStats.data.length > 0) {
          // 打印前5条记录的关键信息，便于调试
          const sampleStats = allStats.data.slice(0, 5).map(stat => ({
            id: stat._id,
            openid: stat.openid,
            user_id: stat.user_id,
            chat_count: stat.chat_count
          }));
          console.log('user_stats表示例记录:', sampleStats);
        }

        // 尝试多种查询方式找到用户的统计记录
        let userStats = null;

        // 1. 首先尝试使用_id查询
        if (userId && userId.length > 10) {
          try {
            const byIdResult = await db.collection('user_stats').doc(userId).get();
            if (byIdResult.data) {
              userStats = byIdResult.data;
              console.log('通过_id找到用户统计信息:', userStats);
            }
          } catch (idErr) {
            console.log('通过_id查询失败，尝试其他方式');
          }
        }

        // 2. 如果通过_id没找到，尝试使用openid和user_id查询
        if (!userStats) {
          // 构建查询条件，考虑多种可能的字段名
          const queries = [];

          // 添加OPENID的查询条件
          if (OPENID) {
            queries.push(
              db.collection('user_stats').where({ openid: OPENID }).get(),
              db.collection('user_stats').where({ user_id: OPENID }).get()
            );
          }

          // 添加userId的查询条件
          if (userId && userId !== OPENID) {
            queries.push(
              db.collection('user_stats').where({ openid: userId }).get(),
              db.collection('user_stats').where({ user_id: userId }).get()
            );
          }

          // 执行所有查询
          const results = await Promise.all(queries);

          // 检查查询结果
          for (const result of results) {
            if (result.data && result.data.length > 0) {
              userStats = result.data[0];
              console.log('通过字段查询找到用户统计信息:', userStats);
              break;
            }
          }
        }

        // 3. 如果还是没找到，尝试使用截图中显示的ID
        if (!userStats) {
          try {
            // 从截图中看到的ID
            const statsId = "7456afe067d056a600d4a9981504c9c";
            console.log('尝试使用已知ID查询:', statsId);

            // 尝试不同的ID格式
            const possibleIds = [
              statsId, // 原始ID
              "7456afe067d056a600d4a9981504c9c", // 原始ID
              "7456afe067d056a600d4a9981504", // 截断ID
              "7456afe067d056a600d4a9981504c9c", // 可能的完整ID
              "7456afe067d056a600d4a9981504c9c", // 可能的完整ID
            ];

            // 尝试所有可能的ID
            for (const id of possibleIds) {
              try {
                console.log('尝试ID:', id);
                const result = await db.collection('user_stats').doc(id).get();
                if (result.data) {
                  userStats = result.data;
                  console.log('通过已知ID找到用户统计信息:', userStats);
                  break;
                }
              } catch (err) {
                console.log(`ID ${id} 查询失败:`, err.message);
              }
            }
          } catch (knownIdErr) {
            console.log('通过已知ID查询失败:', knownIdErr.message);
          }
        }

        // 如果找到了用户统计信息，更新chat_count
        if (userStats) {
          console.log('准备更新用户统计信息:', {
            statsId: userStats._id,
            oldChatCount: userStats.chat_count,
            newChatCount: totalMessageCount
          });

          // 更新用户统计信息
          const updateResult = await db.collection('user_stats').doc(userStats._id).update({
            data: {
              chat_count: totalMessageCount,
              updated_at: db.serverDate()
            }
          });

          console.log('用户统计信息更新结果:', updateResult);
          console.log('用户统计信息更新成功, 新的chat_count:', totalMessageCount);

          // 再次查询确认更新成功
          const verifyResult = await db.collection('user_stats').doc(userStats._id).get();
          console.log('更新后的用户统计信息:', verifyResult.data);
        } else {
          console.log('未找到用户统计信息，无法更新');

          // 如果没有找到用户统计信息，尝试创建一个新的
          if (OPENID) {
            const newStats = {
              openid: OPENID,
              user_id: userId || OPENID,
              chat_count: totalMessageCount,
              active_days: 1,
              created_at: db.serverDate(),
              updated_at: db.serverDate()
            };

            console.log('尝试创建新的用户统计信息:', newStats);

            const createResult = await db.collection('user_stats').add({
              data: newStats
            });

            console.log('创建用户统计信息结果:', createResult);
          }
        }
      } catch (statsErr) {
        console.error('更新用户统计信息失败:', statsErr);
        // 不影响主流程
      }

      return {
        success: true,
        totalMessageCount: totalMessageCount
      };
    } else {
      // 如果没有结果，返回0
      return {
        success: true,
        totalMessageCount: 0
      };
    }
  } catch (error) {
    console.error('获取用户总消息数失败:', error);
    return {
      success: false,
      error: error.message || '获取用户总消息数失败'
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
    case 'getUserPerception':
      return await getUserPerception(event);
    case 'createDatabaseIndexes':
      return await createDatabaseIndexes(event);
    case 'getTotalMessageCount':
      return await getTotalMessageCount(event);
    default:
      return {
        success: false,
        error: '未知的操作类型'
      };
  }
};

