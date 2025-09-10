const cloud = require('wx-server-sdk');
const jwt = require('jsonwebtoken');


// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 初始化数据库
const db = cloud.database();
const usersCollection = db.collection('users');

// JWT密钥 - 64位随机字符串
const JWT_SECRET = 'hc_jwt_2024_03_11_f8e7d6c5b4a3928170615243cba98765432109876';

/**
 * 生成唯一ID
 * 使用时间戳+随机数的方式生成
 */
function generateId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return parseInt(`${timestamp}${random}`);
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { OPENID, APPID } = wxContext;
  const _ = db.command;

  try {
    const { userInfo, testOpenId } = event || {};

    console.log('Login request:', {
      event: event,
      hasUserInfo: !!userInfo,
      hasOpenID: !!OPENID,
      hasAppID: !!APPID,
      testOpenId: testOpenId,
      userInfo: userInfo ? JSON.stringify(userInfo) : null
    });

    if (!userInfo) {
      throw new Error('缺少必要参数：userInfo');
    }

    // 使用测试OpenID或真实OpenID
    const userOpenId = OPENID || testOpenId;
    
    if (!userOpenId) {
      throw new Error('无法获取用户OpenID');
    }

    const now = db.serverDate();

    function isValidUserId(userId) {
      return /^\d{7}$/.test(userId);
    }

    function generateRandomUserId() {
      const userId = Math.floor(1000000 + Math.random() * 9000000).toString();
      if (!isValidUserId(userId)) {
        throw new Error('生成的ID格式不正确');
      }
      return userId;
    }

    // 检查userId是否已存在
    async function checkUserIdExists(userId) {
      const result = await usersCollection.where({
        user_id: userId
      }).count();
      return result.total > 0;
    }

    // 获取可用的userId
    async function getAvailableUserId() {
      let userId;
      let exists = true;
      let attempts = 0;
      const MAX_ATTEMPTS = 10; // 最大尝试次数，防止无限循环

      while (exists && attempts < MAX_ATTEMPTS) {
        userId = generateRandomUserId();
        exists = await checkUserIdExists(userId);
        attempts++;
      }

      if (attempts >= MAX_ATTEMPTS) {
        throw new Error('无法生成唯一的用户ID，请稍后重试');
      }

      return userId;
    }

    // 1. 查询或创建用户基础信息
    const userBase = await usersCollection
      .where({ openid: userOpenId })
      .get();

    let userData;
    let isNewUser = false;

    if (userBase.data.length === 0) {
      isNewUser = true;
      // 生成新的唯一userId
      const userId = await getAvailableUserId();

      // 创建新用户（使用统一的数据结构）
      const newUserData = {
        user_id: userId,
        openid: userOpenId,
        username: userInfo.nickName,
        avatar_url: userInfo.avatarUrl,
        user_type: 1, // 普通用户
        status: 1, // 启用
        created_at: now,
        updated_at: now,
        
        // profile 对象
        profile: {
          gender: null,
          age: null,
          country: null,
          province: null,
          city: null,
          bio: null
        },
        
        // config 对象
        config: {
          dark_mode: false,
          notification_enabled: true,
          language: 'zh-CN',
          reportSettings: {
            notificationEnabled: true
          }
        },
        
        // stats 对象
        stats: {
          stats_id: generateId(),
          chat_count: 0,
          solved_count: 0,
          rating_avg: 0,
          rating_count: 0,
          active_days: 1,
          last_active: now
        }
      };

      const { _id } = await usersCollection.add({
        data: newUserData
      });

      userData = {
        ...newUserData,
        _id
      };
    } else {
      userData = userBase.data[0];

      // 只有当用户名为默认的"微信用户"时，才更新用户信息
      // 这样可以保留用户自定义的用户名和头像
      if (userData.username === "微信用户" || !userData.username) {
        await usersCollection.doc(userData._id).update({
          data: {
            username: userInfo.nickName,
            avatar_url: userInfo.avatarUrl,
            updated_at: now
          }
        });
      } else {
        // 只更新最后活跃时间
        await usersCollection.doc(userData._id).update({
          data: {
            updated_at: now
          }
        });
      }

      // 更新用户统计信息（在统一集合中）
      const userStats = userData.stats;
      const lastActive = userStats.last_active ? new Date(userStats.last_active) : null;
      const today = new Date();
      const isToday = lastActive &&
        lastActive.getFullYear() === today.getFullYear() &&
        lastActive.getMonth() === today.getMonth() &&
        lastActive.getDate() === today.getDate();

      console.log('检查活跃天数:', {
        lastActive: lastActive ? lastActive.toISOString() : null,
        today: today.toISOString(),
        isToday,
        currentActiveDays: userStats.active_days
      });

      // 更新用户统计信息
      await usersCollection.doc(userData._id).update({
        data: {
          'stats.last_active': now,
          // 只有不是今天才增加活跃天数
          'stats.active_days': isToday ? userStats.active_days : userStats.active_days + 1,
          updated_at: now
        }
      });
    }

    // 2. 生成 token，包含必要信息
    const token = jwt.sign(
      {
        user_id: userData.user_id,
        user_type: userData.user_type,
        status: userData.status,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7天过期
      },
      JWT_SECRET
    );

    // 3. 记录登录日志
    await db.collection('sys_log_login').add({
      data: {
        log_id: generateId(),
        user_id: userData.user_id,
        openid: userOpenId,
        status: 1, // 登录成功
        ip: event.userInfo?.clientIP,
        device: event.userInfo?.userAgent,
        created_at: now
      }
    });

    // 4. 用户统计信息已在userData中
    const userStats = userData.stats;

    return {
      success: true,
      data: {
        token,
        isNewUser,
        userInfo: {
          userId: userData.user_id,
          username: userData.username,
          avatarUrl: userData.avatar_url,
          userType: userData.user_type,
          status: userData.status,
          stats: userStats || null
        }
      }
    };

  } catch (error) {
    console.error('Login failed:', error);

    // 记录登录失败日志
    await db.collection('sys_log_login').add({
      data: {
        log_id: generateId(),
        user_id: userOpenId,
        status: 0, // 登录失败
        error: error.message,
        ip: event.userInfo?.clientIP,
        device: event.userInfo?.userAgent,
        created_at: db.serverDate()
      }
    });

    return {
      success: false,
      error: error.message || '登录失败'
    };
  }
};