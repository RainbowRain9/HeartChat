/**
 * dbHelper.js - 数据库操作辅助模块
 * 
 * 提供数据库操作相关的功能，包括：
 * - 初始化数据库集合
 * - 保存聊天记录
 * - 获取角色使用统计
 * - 记录角色使用
 * - 更新角色使用时长
 */

// 初始化数据库集合
async function initCollections() {
  try {
    const db = wx.cloud.database();
    const collections = ['chats', 'roleUsage'];

    for (const name of collections) {
      try {
        await db.createCollection(name);
        console.log(`创建${name}集合成功`);
      } catch (error) {
        if (error.errCode !== -501001) { // 忽略"集合已存在"错误
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('初始化集合失败:', error);
    throw error;
  }
}

// 保存聊天记录
async function saveChat(roleId, roleName, messages, emotionAnalysis, userInfo) {
  try {
    const db = wx.cloud.database();
    return await db.collection('chats').add({
      data: {
        roleId,
        role_name: roleName,
        messages,
        emotionAnalysis,
        createTime: db.serverDate(),
        userInfo: {
          userId: userInfo.userId,
          nickName: userInfo.nickName
        }
      }
    });
  } catch (err) {
    console.error('保存聊天记录失败:', err);
    if (err.errCode === -502005) {
      await initCollections();
    }
    throw err;
  }
}

// 获取角色使用统计
async function getRoleUsageStats(roleIds, userId) {
  try {
    console.log('开始获取角色使用统计，基于历史消息数量...');
    const stats = {};

    // 初始化所有角色的使用次数为0
    roleIds.forEach(roleId => {
      stats[roleId] = 0;
    });

    try {
      // 使用云函数获取每个角色的历史消息数量
      console.log('调用云函数获取历史消息统计...');
      const { result } = await wx.cloud.callFunction({
        name: 'role',
        data: {
          action: 'getMessageStats',
          roleIds: roleIds,
          userId: userId
        }
      });

      if (result && result.success && result.stats) {
        console.log('获取到角色消息统计:', result.stats);
        // 更新统计数据
        Object.keys(result.stats).forEach(roleId => {
          stats[roleId] = result.stats[roleId];
        });
      } else {
        console.log('云函数未返回有效的统计数据，尝试使用本地查询...');
        // 如果云函数失败，尝试使用本地查询
        await getLocalRoleMessageStats(roleIds, userId, stats);
      }
    } catch (cloudErr) {
      console.error('调用云函数获取角色消息统计失败:', cloudErr);
      // 如果云函数调用失败，尝试使用本地查询
      await getLocalRoleMessageStats(roleIds, userId, stats);
    }

    console.log('最终角色使用统计结果:', stats);
    return stats;
  } catch (error) {
    console.error('获取角色使用统计失败:', error);
    return {};
  }
}

// 本地获取角色消息统计
async function getLocalRoleMessageStats(roleIds, userId, stats) {
  try {
    console.log('开始本地查询角色消息统计...');
    const db = wx.cloud.database();

    // 查询 chats 集合中的消息数量
    for (const roleId of roleIds) {
      try {
        // 查询该角色的聊天记录
        const { data: chats } = await db.collection('chats')
          .where({
            roleId: roleId,
            userId: userId
          })
          .get()
          .catch(err => {
            console.error(`查询角色 ${roleId} 的聊天记录失败:`, err);
            return { data: [] };
          });

        if (chats && chats.length > 0) {
          // 计算该角色的总消息数量
          let messageCount = 0;
          chats.forEach(chat => {
            // 如果有 messageCount 字段，使用它
            if (chat.messageCount) {
              messageCount += chat.messageCount;
            }
            // 如果有 messages 数组，使用其长度
            else if (chat.messages && Array.isArray(chat.messages)) {
              messageCount += chat.messages.length;
            }
          });

          // 更新统计数据
          stats[roleId] = messageCount;
          console.log(`角色 ${roleId} 的消息数量: ${messageCount}`);
        } else {
          console.log(`角色 ${roleId} 没有聊天记录`);
        }

        // 如果没有在 chats 集合中找到消息，尝试从 messages 集合中查询
        if (!stats[roleId] || stats[roleId] === 0) {
          console.log(`尝试从 messages 集合中查询角色 ${roleId} 的消息数量...`);
          const { data: messages } = await db.collection('messages')
            .where({
              roleId: roleId,
              userId: userId
            })
            .count()
            .catch(err => {
              console.error(`查询角色 ${roleId} 的消息数量失败:`, err);
              return { total: 0 };
            });

          if (messages && messages.total > 0) {
            stats[roleId] = messages.total;
            console.log(`从 messages 集合中找到角色 ${roleId} 的消息数量: ${messages.total}`);
          } else {
            console.log(`角色 ${roleId} 在 messages 集合中也没有消息`);
          }
        }
      } catch (err) {
        console.error(`获取角色 ${roleId} 的消息统计失败:`, err);
      }
    }
  } catch (error) {
    console.error('本地获取角色消息统计失败:', error);
  }
}

// 记录角色使用
async function recordRoleUsage(roleId, userId) {
  try {
    const db = wx.cloud.database();
    return await db.collection('roleUsage').add({
      data: {
        roleId,
        userId,
        useTime: db.serverDate(),
        sessionDuration: 0
      }
    });
  } catch (err) {
    console.error('记录角色使用失败:', err);
    throw err;
  }
}

// 更新角色使用时长
async function updateRoleUsage(roleId, userId) {
  try {
    const db = wx.cloud.database();
    const command = db.command;

    const { data } = await db.collection('roleUsage')
      .where({
        roleId: roleId,
        userId: userId
      })
      .orderBy('useTime', 'desc')
      .limit(1)
      .get();

    if (data && data.length > 0) {
      const usage = data[0];
      const duration = Date.now() - usage.useTime.getTime();

      await db.collection('roleUsage').doc(usage._id).update({
        data: {
          sessionDuration: duration,
          useCount: command.inc(1), // 增加使用次数
          lastUseTime: db.serverDate() // 更新最后使用时间
        }
      });
      return usage._id;
    } else {
      // 创建新记录
      const result = await db.collection('roleUsage').add({
        data: {
          roleId: roleId,
          userId: userId,
          useCount: 1,
          useTime: db.serverDate(),
          lastUseTime: db.serverDate(),
          sessionDuration: 0,
          createTime: db.serverDate()
        }
      });
      return result._id;
    }
  } catch (err) {
    console.error('更新角色使用时长失败:', err);
    // 不抛出异常，避免影响用户体验
    return null;
  }
}

module.exports = {
  initCollections,
  saveChat,
  getRoleUsageStats,
  getLocalRoleMessageStats,
  recordRoleUsage,
  updateRoleUsage
};
