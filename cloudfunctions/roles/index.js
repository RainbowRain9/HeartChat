// roles 云函数 index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

// 子功能：获取角色列表
async function getRoles(event, context) {
  const { userId, category, limit = 50, skip = 0 } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const userIdParam = userId || openid;

  try {
    console.log(`开始获取角色列表, 传入的用户ID: ${userIdParam}, 当前用户openid: ${openid}, 分类: ${category}`);

    // 构建查询条件
    let query = {};

    // 如果指定了分类，添加到查询条件
    if (category && category !== 'all') {
      query.category = category;
    }

    // 查询条件：获取系统角色和用户自己的角色
    // 注意：这里使用openid作为查询条件，而不是userIdParam
    query = {
      $or: [
        { creator: 'system' }, // 系统角色
        { creator: openid }    // 用户自己的角色，始终使用openid
      ]
    };

    // 如果指定了分类，添加到查询条件
    if (category && category !== 'all') {
      query = {
        $and: [
          query,
          { category: category }
        ]
      };
    }

    // 查询角色列表
    const result = await db.collection('roles')
      .where(query)
      .orderBy('createTime', 'desc')
      .get();

    console.log(`查询到 ${result.data.length} 个角色`);

    // 如果有用户ID，获取用户对角色的使用统计
    let roleUsageStats = {};
    if (openid) {
      try {
        const usageResult = await db.collection('roleUsage')
          .where({ userId: openid })
          .get();

        if (usageResult.data && usageResult.data.length > 0) {
          usageResult.data.forEach(usage => {
            roleUsageStats[usage.roleId] = {
              usageCount: usage.usageCount || 0,
              lastUsedTime: usage.lastUsedTime
            };
          });
        }
      } catch (usageError) {
        console.error('获取角色使用统计失败:', usageError);
        // 失败不影响主流程
      }
    }

    // 合并角色信息和使用统计
    const roles = result.data.map(role => ({
      ...role,
      isSystem: role.creator === 'system', // 标记系统角色
      usage: roleUsageStats[role._id] || { usageCount: 0 }
    }));

    return {
      success: true,
      data: roles,
      total: result.data.length
    };
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return {
      success: false,
      error: error.message || '获取角色列表失败'
    };
  }
}

// 子功能：获取角色详情
async function getRoleDetail(event, context) {
  const { roleId } = event;

  // 验证参数
  if (!roleId) {
    return {
      success: false,
      error: '角色ID无效'
    };
  }

  try {
    console.log(`开始获取角色详情, 角色ID: ${roleId}`);

    // 查询角色详情
    const result = await db.collection('roles')
      .doc(roleId)
      .get();

    if (!result.data) {
      return {
        success: false,
        error: '角色不存在'
      };
    }

    return {
      success: true,
      role: result.data
    };
  } catch (error) {
    console.error('获取角色详情失败:', error);
    return {
      success: false,
      error: error.message || '获取角色详情失败'
    };
  }
}

// 子功能：创建角色
async function createRole(event, context) {
  const { role } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const userId = event.userId || openid;

  // 验证参数
  if (!role || !role.name) {
    return {
      success: false,
      error: '角色信息不完整'
    };
  }

  try {
    console.log(`开始创建角色, 角色名称: ${role.name}, 传入的用户ID: ${userId}, 当前用户openid: ${openid}`);

    // 检查角色名称是否已存在
    const existingRole = await db.collection('roles')
      .where({
        name: role.name,
        creator: openid // 使用openid作为创建者标识
      })
      .get();

    if (existingRole.data && existingRole.data.length > 0) {
      return {
        success: false,
        error: `角色名称 "${role.name}" 已存在，请使用其他名称`,
        code: 'DUPLICATE_NAME'
      };
    }

    // 准备角色数据
    const roleData = {
      ...role,
      creator: openid, // 始终使用openid作为创建者标识，确保与查询条件一致
      user_id: userId, // 保留用户ID信息，但不用于查询
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      status: 1 // 1:启用 0:禁用
    };

    // 确保prompt和system_prompt字段保持一致
    if (roleData.prompt && !roleData.system_prompt) {
      roleData.system_prompt = roleData.prompt;
      console.log('自动同步prompt到system_prompt字段');
    } else if (roleData.system_prompt && !roleData.prompt) {
      roleData.prompt = roleData.system_prompt;
      console.log('自动同步system_prompt到prompt字段');
    }

    // 创建角色
    const result = await db.collection('roles').add({
      data: roleData
    });

    console.log('角色创建成功, ID:', result._id);

    return {
      success: true,
      roleId: result._id
    };
  } catch (error) {
    console.error('创建角色失败:', error);

    // 检查是否是唯一索引冲突错误
    if (error.message && error.message.includes('duplicate key')) {
      return {
        success: false,
        error: `角色名称已存在，请使用其他名称`,
        code: 'DUPLICATE_NAME'
      };
    }

    return {
      success: false,
      error: error.message || '创建角色失败'
    };
  }
}

// 子功能：更新角色
async function updateRole(event, context) {
  const { roleId, role } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const userId = event.userId || openid;

  // 验证参数
  if (!roleId || !role) {
    return {
      success: false,
      error: '参数无效'
    };
  }

  try {
    console.log(`开始更新角色, 角色ID: ${roleId}, 传入的用户ID: ${userId}, 当前用户openid: ${openid}`);

    // 检查角色是否存在
    const existingRole = await db.collection('roles')
      .doc(roleId)
      .get()
      .catch(() => ({ data: null }));

    if (!existingRole.data) {
      return {
        success: false,
        error: '角色不存在'
      };
    }

    // 检查权限（只有创建者或管理员可以更新）
    // 注意：这里使用openid作为权限检查条件，而不是userIdParam
    if (existingRole.data.creator !== openid && openid !== 'admin') {
      console.log(`权限检查失败: 角色创建者=${existingRole.data.creator}, 当前用户openid=${openid}`);
      return {
        success: false,
        error: '没有权限更新此角色'
      };
    }

    // 准备更新数据
    const updateData = {
      ...role,
      updateTime: db.serverDate()
    };

    // 确保prompt和system_prompt字段保持一致
    if (updateData.prompt && !updateData.system_prompt) {
      updateData.system_prompt = updateData.prompt;
      console.log('自动同步prompt到system_prompt字段');
    } else if (updateData.system_prompt && !updateData.prompt) {
      updateData.prompt = updateData.system_prompt;
      console.log('自动同步system_prompt到prompt字段');
    }

    // 删除不可更新的字段
    delete updateData._id;
    delete updateData.creator;
    delete updateData.createTime;

    // 更新角色
    await db.collection('roles')
      .doc(roleId)
      .update({
        data: updateData
      });

    console.log('角色更新成功');

    return {
      success: true
    };
  } catch (error) {
    console.error('更新角色失败:', error);
    return {
      success: false,
      error: error.message || '更新角色失败'
    };
  }
}

// 子功能：删除角色
async function deleteRole(event, context) {
  const { roleId } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const userId = event.userId || openid;

  // 验证参数
  if (!roleId) {
    return {
      success: false,
      error: '角色ID无效'
    };
  }

  try {
    console.log(`开始删除角色, 角色ID: ${roleId}, 传入的用户ID: ${userId}, 当前用户openid: ${openid}`);

    // 检查角色是否存在
    const existingRole = await db.collection('roles')
      .doc(roleId)
      .get()
      .catch(() => ({ data: null }));

    if (!existingRole.data) {
      return {
        success: false,
        error: '角色不存在'
      };
    }

    // 检查权限（只有创建者或管理员可以删除）
    // 注意：这里使用openid作为权限检查条件，而不是userIdParam
    if (existingRole.data.creator !== openid && openid !== 'admin') {
      console.log(`权限检查失败: 角色创建者=${existingRole.data.creator}, 当前用户openid=${openid}`);
      return {
        success: false,
        error: '没有权限删除此角色'
      };
    }

    // 删除角色
    await db.collection('roles')
      .doc(roleId)
      .remove();

    console.log('角色删除成功');

    // 删除相关的聊天记录（可选）
    // 这里可以添加删除相关聊天记录的代码

    return {
      success: true
    };
  } catch (error) {
    console.error('删除角色失败:', error);
    return {
      success: false,
      error: error.message || '删除角色失败'
    };
  }
}

// 子功能：更新角色使用统计
async function updateRoleUsage(event, context) {
  const { roleId, userId } = event;
  const wxContext = cloud.getWXContext();

  // 验证参数
  if (!roleId || !userId) {
    return {
      success: false,
      error: '参数无效'
    };
  }

  try {
    console.log(`开始更新角色使用统计, 角色ID: ${roleId}, 用户ID: ${userId}`);

    // 查询现有统计记录
    const { data } = await db.collection('roleUsage')
      .where({
        roleId,
        userId
      })
      .get()
      .catch(() => ({ data: [] }));

    // 准备使用数据
    const usageData = {
      roleId,
      userId,
      lastUsedTime: db.serverDate(),
      updateTime: db.serverDate()
    };

    // 如果有现有记录，更新它
    if (data && data.length > 0) {
      const usageId = data[0]._id;
      await db.collection('roleUsage').doc(usageId).update({
        data: {
          usageCount: _.inc(1),  // 使用次数+1
          lastUsedTime: usageData.lastUsedTime,
          updateTime: usageData.updateTime
        }
      });
      console.log('更新角色使用统计成功');

      return {
        success: true,
        data: {
          usageId,
          updated: true
        }
      };
    } else {
      // 如果没有现有记录，创建新记录
      usageData.usageCount = 1;
      usageData.createTime = db.serverDate();

      const result = await db.collection('roleUsage').add({
        data: usageData
      });
      console.log('创建角色使用统计成功');

      return {
        success: true,
        data: {
          usageId: result._id,
          created: true
        }
      };
    }
  } catch (error) {
    console.error('更新角色使用统计失败:', error);
    return {
      success: false,
      error: error.message || '更新角色使用统计失败'
    };
  }
}

// 子功能：获取角色消息统计
async function getRoleMessageStats(event, context) {
  const { roleIds, userId } = event;
  const wxContext = cloud.getWXContext();

  // 验证参数
  if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
    return {
      success: false,
      error: '角色ID列表无效'
    };
  }

  if (!userId) {
    return {
      success: false,
      error: '用户ID无效'
    };
  }

  try {
    console.log(`开始获取角色消息统计，角色数量: ${roleIds.length}`);
    const stats = {};

    // 初始化所有角色的消息数量为0
    roleIds.forEach(roleId => {
      stats[roleId] = 0;
    });

    // 查询 chats 集合中的消息数量
    const chatsResult = await db.collection('chats')
      .aggregate()
      .match({
        roleId: _.in(roleIds),
        userId: userId
      })
      .group({
        _id: '$roleId',
        messageCount: $.sum($.ifNull('$messageCount', 0))
      })
      .end();

    if (chatsResult && chatsResult.list) {
      console.log(`从 chats 集合获取到 ${chatsResult.list.length} 条统计记录`);
      chatsResult.list.forEach(item => {
        stats[item._id] = item.messageCount;
      });
    }

    // 对于没有 messageCount 字段的记录，尝试查询 messages 集合
    const messagesResult = await db.collection('messages')
      .aggregate()
      .match({
        roleId: _.in(roleIds),
        userId: userId
      })
      .group({
        _id: '$roleId',
        count: $.sum(1)
      })
      .end();

    if (messagesResult && messagesResult.list) {
      console.log(`从 messages 集合获取到 ${messagesResult.list.length} 条统计记录`);
      messagesResult.list.forEach(item => {
        // 如果 chats 集合中没有该角色的消息数量，或者 messages 集合中的数量更多，则使用 messages 集合中的数量
        if (!stats[item._id] || stats[item._id] < item.count) {
          stats[item._id] = item.count;
        }
      });
    }

    console.log('最终角色消息统计结果:', stats);

    return {
      success: true,
      stats: stats
    };
  } catch (error) {
    console.error('获取角色消息统计失败:', error);
    return {
      success: false,
      error: error.message || '获取角色消息统计失败'
    };
  }
}

// 引入各个功能模块
const { initRoles } = require('./init-roles');
const promptGenerator = require('./promptGenerator');
const memoryManager = require('./memoryManager');
const userPerception = require('./userPerception');
const { testZhipuAI } = require('./test-zhipu');

// 子功能：初始化角色数据
async function initializeRoles(event, context) {
  try {
    const result = await initRoles();
    return {
      success: true,
      message: '角色数据初始化成功',
      result
    };
  } catch (error) {
    console.error('初始化角色数据失败:', error);
    return {
      success: false,
      error: error.message || '初始化角色数据失败'
    };
  }
}

// 子功能：生成角色提示词
async function generateRolePrompt(event, context) {
  const { roleId, roleInfo, currentContext } = event;

  try {
    console.log(`开始生成角色提示词, 角色ID: ${roleId}`);

    // 获取角色信息
    let role = roleInfo;
    if (roleId && !roleInfo) {
      const result = await db.collection('roles').doc(roleId).get();
      if (!result.data) {
        throw new Error('角色不存在');
      }
      role = result.data;
    }

    if (!role) {
      throw new Error('角色信息不能为空');
    }

    // 生成基础提示词
    // 优先使用prompt字段，其次是system_prompt字段
    let prompt = role.prompt || role.system_prompt;
    if (!prompt) {
      prompt = await promptGenerator.generateBasePrompt(role);
    }

    // 如果有当前上下文，获取相关记忆
    if (currentContext && roleId) {
      const relevantMemories = await memoryManager.getRelevantMemories(roleId, currentContext, 3);
      if (relevantMemories && relevantMemories.length > 0) {
        prompt = await promptGenerator.generatePromptWithMemories(prompt, relevantMemories);
      }
    }

    // 如果有用户画像，将用户画像融入提示词
    if (role.user_perception) {
      prompt = await promptGenerator.generatePromptWithUserPerception(prompt, role.user_perception);
    }

    // 更新角色的系统提示词
    if (roleId && (!role.system_prompt || event.updatePrompt)) {
      await db.collection('roles').doc(roleId).update({
        data: {
          system_prompt: prompt,
          prompt: prompt, // 同时更新prompt字段，确保两个字段保持一致
          updateTime: db.serverDate()
        }
      });
    }

    return {
      success: true,
      prompt: prompt
    };
  } catch (error) {
    console.error('生成角色提示词失败:', error);
    return {
      success: false,
      error: error.message || '生成角色提示词失败'
    };
  }
}

// 子功能：从对话中提取记忆
async function extractChatMemories(event, context) {
  const { roleId, messages } = event;

  try {
    console.log(`开始从对话中提取记忆, 角色ID: ${roleId}`);

    // 获取角色信息
    const role = await db.collection('roles').doc(roleId).get();
    if (!role.data) {
      throw new Error('角色不存在');
    }

    // 从对话中提取记忆
    const memories = await memoryManager.extractMemoriesFromChat(messages, role.data);

    // 更新角色记忆
    const updatedMemories = await memoryManager.updateRoleMemories(roleId, memories);

    return {
      success: true,
      memories: memories,
      totalMemories: updatedMemories.length
    };
  } catch (error) {
    console.error('从对话中提取记忆失败:', error);
    return {
      success: false,
      error: error.message || '从对话中提取记忆失败'
    };
  }
}

// 子功能：分析并更新用户画像
async function updateUserPerceptionFromChat(event, context) {
  const { roleId, userId, messages } = event;

  try {
    console.log(`开始分析并更新用户画像, 角色ID: ${roleId}, 用户ID: ${userId}`);

    // 分析用户画像
    const newPerception = await userPerception.analyzeUserPerception(messages, userId, roleId);

    // 更新角色的用户画像
    const updatedPerception = await userPerception.updateRoleUserPerception(roleId, userId, newPerception);

    return {
      success: true,
      userPerception: updatedPerception
    };
  } catch (error) {
    console.error('分析并更新用户画像失败:', error);
    return {
      success: false,
      error: error.message || '分析并更新用户画像失败'
    };
  }
}

// 子功能：生成用户画像摘要
async function generateUserPerceptionSummary(event, context) {
  const { roleId } = event;

  try {
    console.log(`开始生成用户画像摘要, 角色ID: ${roleId}`);

    // 获取角色信息
    const role = await db.collection('roles').doc(roleId).get();
    if (!role.data) {
      throw new Error('角色不存在');
    }

    // 生成用户画像摘要
    const summary = await userPerception.generateUserPerceptionSummary(role.data.user_perception);

    return {
      success: true,
      summary: summary
    };
  } catch (error) {
    console.error('生成用户画像摘要失败:', error);
    return {
      success: false,
      error: error.message || '生成用户画像摘要失败'
    };
  }
}

// 主函数入口
exports.main = async (event, context) => {
  const { action } = event;

  console.log('roles 云函数入口, action:', action);

  switch (action) {
    // 基础角色管理功能
    case 'getRoles':
      return await getRoles(event, context);
    case 'getRoleDetail':
      return await getRoleDetail(event, context);
    case 'createRole':
      return await createRole(event, context);
    case 'updateRole':
      return await updateRole(event, context);
    case 'deleteRole':
      return await deleteRole(event, context);
    case 'updateUsage':
      return await updateRoleUsage(event, context);
    case 'getMessageStats':
      return await getRoleMessageStats(event, context);
    case 'initialize':
      return await initializeRoles(event, context);

    // 角色提示词生成功能
    case 'generatePrompt':
      return await generateRolePrompt(event, context);

    // 角色记忆管理功能
    case 'extractMemories':
      return await extractChatMemories(event, context);
    case 'getRelevantMemories':
      return await memoryManager.getRelevantMemories(event.roleId, event.currentContext, event.limit);

    // 用户画像管理功能
    case 'updateUserPerception':
      return await updateUserPerceptionFromChat(event, context);
    case 'getUserPerceptionSummary':
      return await generateUserPerceptionSummary(event, context);

    // 测试功能
    case 'testZhipuAI':
      return await testZhipuAI();

    default:
      return { success: false, error: '未知操作' };
  }
};

