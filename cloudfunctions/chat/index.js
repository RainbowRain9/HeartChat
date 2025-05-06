// chat 云函数 index.js
/**
 * 聊天相关功能云函数
 * 提供聊天消息发送、历史记录获取、AI回复生成等功能
 * 集成智谱AI (GLM-4-Flash) 生成回复
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 是否为开发环境，控制日志输出
const isDev = false; // 设置为true可以开启详细日志

// 导入智谱AI模块
const bigModelModule = require('./bigmodel');

/**
 * 将AI回复分段，使其更像真实聊天
 * @param {string} message AI回复的完整消息
 * @returns {Array} 分段后的消息数组
 */
function splitMessage(message) {
  if (!message || typeof message !== 'string') {
    return [message];
  }

  // 先处理Markdown语法，移除加粗等标记
  const cleanMessage = message.replace(/\*\*([^*]+)\*\*/g, '$1');

  // 定义最大段落长度
  const MAX_SEGMENT_LENGTH = 120; // 增加到120个字符，减少过度分段

  // 检查消息是否包含列表或编号内容
  const hasListOrNumbering = /\n\s*[-*]\s|\n\s*\d+\.\s/.test(cleanMessage);

  // 如果包含列表或编号，使用更保守的分段方式
  if (hasListOrNumbering) {
    // 尝试按空行分段，保持列表的完整性
    let segments = cleanMessage.split(/\n\s*\n/);
    segments = segments.filter(segment => segment.trim().length > 0);

    // 如果只有一个段落且过长，尝试在列表项之间分割
    if (segments.length === 1 && segments[0].length > MAX_SEGMENT_LENGTH * 2) {
      // 匹配列表项的开头（如"1. "或"- "）
      const listItemRegex = /\n(?=\s*(?:[-*]|\d+\.)\s)/;
      segments = segments[0].split(listItemRegex);
      segments = segments.filter(segment => segment.trim().length > 0);
    }

    return segments;
  }

  // 如果不包含列表或编号，使用正常的分段方式
  // 首先尝试按段落分割
  let segments = cleanMessage.split(/\n\s*\n/);

  // 过滤空段落
  segments = segments.filter(segment => segment.trim().length > 0);

  // 如果没有段落分隔符，尝试按换行符分割
  if (segments.length === 1 && segments[0].includes('\n')) {
    segments = segments[0].split(/\n/);
    segments = segments.filter(segment => segment.trim().length > 0);
  }

  // 如果段落仍然过长，按句子分割
  const sentenceSegments = [];
  for (const segment of segments) {
    if (segment.length > MAX_SEGMENT_LENGTH) {
      // 按句号、问号、感叹号分割
      const sentences = segment.split(/(?<=[。！？.!?])\s*/);
      sentenceSegments.push(...sentences.filter(s => s.trim().length > 0));
    } else {
      sentenceSegments.push(segment.trim());
    }
  }

  // 处理过长的句子
  const result = [];
  for (const segment of sentenceSegments) {
    if (segment.length > MAX_SEGMENT_LENGTH) {
      // 将长句子按照逗号、分号等次要标点分割
      const subSegments = segment.split(/(?<=[，；、,;])\s*/);

      // 如果分割后的子段落仍然过长，按字符数分割
      let currentSegment = '';
      for (const subSegment of subSegments) {
        if (subSegment.trim().length === 0) continue;

        if (currentSegment.length + subSegment.length > MAX_SEGMENT_LENGTH) {
          if (currentSegment.length > 0) {
            result.push(currentSegment.trim());
            currentSegment = '';
          }

          // 如果单个子段落仍然过长，按字符数强制分割
          if (subSegment.length > MAX_SEGMENT_LENGTH) {
            for (let i = 0; i < subSegment.length; i += MAX_SEGMENT_LENGTH) {
              result.push(subSegment.substr(i, MAX_SEGMENT_LENGTH).trim());
            }
          } else {
            currentSegment = subSegment;
          }
        } else {
          currentSegment += (currentSegment ? ' ' : '') + subSegment;
        }
      }

      if (currentSegment.length > 0) {
        result.push(currentSegment.trim());
      }
    } else if (segment.trim()) {
      result.push(segment.trim());
    }
  }

  // 合并过短的段落
  const finalResult = [];
  let currentSegment = '';

  for (const segment of result) {
    // 如果当前段落加上新段落仍然在限制范围内，则合并
    if (currentSegment.length + segment.length + 1 <= MAX_SEGMENT_LENGTH) {
      currentSegment += (currentSegment ? ' ' : '') + segment;
    } else {
      // 否则保存当前段落并开始新段落
      if (currentSegment.length > 0) {
        finalResult.push(currentSegment);
      }
      currentSegment = segment;
    }
  }

  // 添加最后一个段落
  if (currentSegment.length > 0) {
    finalResult.push(currentSegment);
  }

  // 如果分段后为空，则返回原始消息
  if (finalResult.length === 0) {
    return [message];
  }

  // 确保每个段落不超过最大长度
  return finalResult.map(segment => segment.length <= MAX_SEGMENT_LENGTH ?
    segment : segment.substring(0, MAX_SEGMENT_LENGTH));
}

// 子功能：保存聊天记录
async function saveChatHistory(event, context) {
  const { OPENID } = cloud.getWXContext(); // 获取用户的openid

  if (isDev) {
    console.log('执行 saveChatHistory 功能, 参数:', event);
    console.log('OPENID:', OPENID);
  }

  try {
    // 获取请求参数
    const { chatData, messages } = event;

    if (isDev) {
      console.log('接收到的数据:', {
        chatDataKeys: chatData ? Object.keys(chatData) : null,
        messagesCount: messages ? messages.length : 0
      });
    }

    // 确保chatData包含必要的字段
    if (!chatData || !chatData.roleId) {
      console.error('缺少必要的聊天数据');
      return {
        success: false,
        error: '缺少必要的聊天数据'
      };
    }

    // 添加openId字段
    chatData.openId = chatData.openId || OPENID;

    // 添加时间戳
    chatData.updateTime = db.serverDate();
    if (!chatData.createTime) {
      chatData.createTime = db.serverDate();
    }

    if (isDev) {
      console.log('处理后的chatData:', {
        roleId: chatData.roleId,
        userId: chatData.userId,
        openId: chatData.openId,
        messageCount: chatData.messageCount
      });
    }

    let chatId;

    // 检查是否已存在相同的聊天记录
    if (isDev) {
      console.log('查询现有聊天记录...');
    }
    const queryResult = await db.collection('chats')
      .where({
        roleId: chatData.roleId,
        userId: chatData.userId || '',
        openId: chatData.openId
      })
      .get()
      .catch(err => {
        console.error('查询聊天记录失败:', err.message || err);
        return { data: [] };
      });

    const { data } = queryResult;
    if (isDev) {
      console.log('查询结果:', { found: data && data.length > 0 });
    }

    if (data && data.length > 0) {
      // 更新现有聊天记录
      chatId = data[0]._id;
      if (isDev) {
        console.log('更新现有聊天记录, chatId:', chatId);
      }

      const updateData = {
        messageCount: chatData.messageCount || 0,
        lastMessage: chatData.lastMessage || '',
        emotionAnalysis: chatData.emotionAnalysis || {
          type: 'neutral',
          intensity: 0.5,
          suggestions: []
        },
        last_message_time: chatData.last_message_time || chatData.updateTime, // 添加last_message_time字段
        updateTime: chatData.updateTime
      };

      if (isDev) {
        console.log('更新数据:', updateData);
      }

      await db.collection('chats').doc(chatId).update({
        data: updateData
      }).catch(err => {
        console.error('更新聊天记录失败:', err.message || err);
        throw err;
      });

      if (isDev) {
        console.log('聊天记录更新成功');
      }
    } else {
      // 创建新的聊天记录
      if (isDev) {
        console.log('创建新的聊天记录');
      }
      const result = await db.collection('chats').add({
        data: chatData
      }).catch(err => {
        console.error('创建聊天记录失败:', err.message || err);
        throw err;
      });

      chatId = result._id;
      if (isDev) {
        console.log('新聊天记录创建成功, chatId:', chatId);
      }
    }

    // 如果提供了消息数组，保存到messages集合
    if (messages && messages.length > 0) {
      if (isDev) {
        console.log(`开始保存 ${messages.length} 条消息到messages集合...`);
      }

      // 批量添加消息
      const messagePromises = messages.map((msg, index) => {
        // 跳过已有ID的消息
        if (msg._id) {
          if (isDev) {
            console.log(`消息 ${index} 已有ID, 跳过`);
          }
          return Promise.resolve();
        }

        // 添加必要的字段
        msg.chatId = chatId;
        msg.openId = OPENID;
        msg.createTime = db.serverDate();

        // 保存消息
        return db.collection('messages').add({
          data: msg
        }).then(res => {
          if (isDev) {
            console.log(`消息 ${index} 保存成功, _id: ${res._id}`);
          }
          return res;
        }).catch(err => {
          console.error(`消息 ${index} 保存失败:`, err.message || err);
          throw err;
        });
      });

      // 等待所有消息保存完成
      await Promise.all(messagePromises);
      if (isDev) {
        console.log('所有消息保存完成');
      }
    } else {
      if (isDev) {
        console.log('没有消息需要保存');
      }
    }

    // 判断是否是新对话
    const isNewChat = !data || data.length === 0;
    if (isDev) {
      console.log('执行成功, 返回 chatId:', chatId, ', 是否新对话:', isNewChat);
    }

    // 如果是新对话，直接在云函数中更新用户统计
    if (isNewChat) {
      try {
        if (isDev) {
          console.log('在云函数中更新用户对话次数');
        }
        // 获取用户统计信息
        const userStatsResult = await db.collection('user_stats')
          .where({ user_id: chatData.userId })
          .get();

        if (userStatsResult.data && userStatsResult.data.length > 0) {
          const userStats = userStatsResult.data[0];

          // 更新对话次数
          await db.collection('user_stats').doc(userStats._id).update({
            data: {
              chat_count: _.inc(1),
              updated_at: db.serverDate()
            }
          });

          if (isDev) {
            console.log('用户对话次数更新成功');
          }
        } else {
          if (isDev) {
            console.log('未找到用户统计信息，无法更新对话次数');
          }
        }
      } catch (statsErr) {
        console.error('更新用户对话次数失败:', statsErr.message || statsErr);
        // 不影响主流程
      }
    }

    return {
      success: true,
      chatId,
      isNewChat
    };
  } catch (error) {
    console.error('保存聊天记录失败:', error.message || error);
    return {
      success: false,
      error: error.message || error
    };
  }
}

// 子功能：获取聊天记录
async function getChatHistory(event, context) {
  const { OPENID } = cloud.getWXContext(); // 获取用户的openid

  if (isDev) {
    console.log('执行 getChatHistory 功能, 参数:', event);
    console.log('OPENID:', OPENID);
  }

  try {
    // 获取请求参数
    const { userId, roleId } = event;

    // 构建查询条件
    const query = {};

    // 如果提供了userId，添加到查询条件
    if (userId) {
      query.userId = userId;
      if (isDev) {
        console.log('使用userId查询:', userId);
      }
    } else {
      // 如果没有提供userId，使用openid
      query.openId = OPENID;
      if (isDev) {
        console.log('使用openId查询:', OPENID);
      }
    }

    // 如果提供了roleId，添加到查询条件
    if (roleId) {
      query.roleId = roleId;
      if (isDev) {
        console.log('使用roleId查询:', roleId);
      }
    }

    if (isDev) {
      console.log('最终查询条件:', query);
    }

    // 查询chats集合
    let chatData = [];
    try {
      if (isDev) {
        console.log('开始查询chats集合...');
      }
      const result = await db.collection('chats')
        .where(query)
        .orderBy('updateTime', 'desc')
        .limit(1)
        .get();

      if (isDev) {
        console.log('chats查询结果:', result);
      }

      if (result.data && result.data.length > 0) {
        chatData = result.data;
        if (isDev) {
          console.log('找到聊天记录:', chatData[0]._id);
        }
      } else {
        if (isDev) {
          console.log('未找到聊天记录');
        }
      }
    } catch (chatErr) {
      console.error('查询chats集合失败:', chatErr.message || chatErr);
    }

    // 如果找到了聊天记录，但没有消息数组，尝试从messages集合获取消息
    if (chatData.length > 0 && (!chatData[0].messages || chatData[0].messages.length === 0)) {
      try {
        const chatId = chatData[0]._id;
        if (isDev) {
          console.log('开始从messages集合获取消息, chatId:', chatId);
        }

        const messagesResult = await db.collection('messages')
          .where({ chatId })
          .orderBy('timestamp', 'asc')
          .get();

        if (isDev) {
          console.log('messages查询结果:', messagesResult);
        }

        if (messagesResult.data && messagesResult.data.length > 0) {
          // 将消息添加到聊天记录中
          chatData[0].messages = messagesResult.data;
          if (isDev) {
            console.log(`找到 ${messagesResult.data.length} 条消息`);
          }
        } else {
          if (isDev) {
            console.log('未找到消息记录');
          }
        }
      } catch (msgErr) {
        console.error('查询messages集合失败:', msgErr.message || msgErr);
      }
    } else if (chatData.length > 0 && chatData[0].messages && chatData[0].messages.length > 0) {
      if (isDev) {
        console.log(`聊天记录中已包含 ${chatData[0].messages.length} 条消息`);
      }
    }

    if (isDev) {
      console.log('功能执行成功, 返回数据长度:', chatData.length);
    }

    return {
      success: true,
      data: chatData
    };
  } catch (error) {
    console.error('获取聊天记录失败:', error.message || error);
    return {
      success: false,
      error: error.message || error
    };
  }
}

// 子功能：生成AI回复
async function generateAIReply(event, context) {
  console.log('执行 generateAIReply 功能, 参数:', event);

  try {
    const { message, history, roleInfo, includeEmotionAnalysis = false, systemPrompt = null } = event;

    // 验证参数
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return {
        success: false,
        error: '无效的消息内容'
      };
    }

    if (!roleInfo || !roleInfo.prompt) {
      console.warn('角色信息或prompt缺失, 将使用默认提示词');
    }

    // 调用智谱AI生成回复
    const aiResult = await bigModelModule.generateChatReply(
      message,
      history,
      roleInfo,
      includeEmotionAnalysis,
      systemPrompt // 传递自定义系统提示词（包含用户画像）
    );

    if (!aiResult.success) {
      throw new Error(aiResult.error || 'AI回复生成失败');
    }

    // 分段处理AI回复
    const segments = splitMessage(aiResult.reply);
    console.log('分段后的AI回复:', segments);

    // 返回生成的回复
    return {
      success: true,
      content: aiResult.reply,  // 保留完整回复用于存储
      segments: segments,       // 添加分段数组
      emotionAnalysis: aiResult.emotionAnalysis,
      usage: aiResult.usage,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('生成AI回复失败:', error);
    return {
      success: false,
      error: error.message || '生成回复失败'
    };
  }
}

// 子功能：发送消息
async function sendMessage(event, context) {
  const { OPENID } = cloud.getWXContext(); // 获取用户的openid

  console.log('执行 sendMessage 功能, 参数:', event);
  console.log('OPENID:', OPENID);

  try {
    // 获取请求参数
    const { chatId, roleId, content, systemPrompt } = event;

    // 如果提供了自定义系统提示词（包含用户画像）
    if (systemPrompt) {
      console.log('收到自定义系统提示词（包含用户画像）');
    }

    // 验证参数
    if (!roleId) {
      return {
        success: false,
        error: '角色ID不能为空'
      };
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return {
        success: false,
        error: '消息内容不能为空'
      };
    }

    // 获取角色信息
    console.log('获取角色信息, roleId:', roleId);
    const roleResult = await cloud.callFunction({
      name: 'roles',
      data: {
        action: 'getRoleDetail',
        roleId: roleId
      }
    });

    if (!roleResult.result || !roleResult.result.success) {
      throw new Error('获取角色信息失败');
    }

    const roleInfo = roleResult.result.role;
    console.log('角色信息:', {
      name: roleInfo.name,
      hasPrompt: !!roleInfo.prompt
    });

    // 查询或创建聊天会话
    let currentChatId = chatId;
    let isNewChat = false;

    if (!currentChatId) {
      // 查询是否存在与该角色的聊天会话
      console.log('查询现有聊天会话...');
      const chatResult = await db.collection('chats')
        .where({
          roleId: roleId,
          openId: OPENID
        })
        .orderBy('updateTime', 'desc')
        .limit(1)
        .get();

      if (chatResult.data && chatResult.data.length > 0) {
        // 使用现有会话
        currentChatId = chatResult.data[0]._id;
        console.log('使用现有聊天会话, chatId:', currentChatId);
      } else {
        // 创建新会话
        console.log('创建新聊天会话...');
        const newChat = {
          roleId: roleId,
          roleName: roleInfo.name,
          openId: OPENID,
          messageCount: 0,
          createTime: db.serverDate(),
          last_message_time: db.serverDate(), // 添加last_message_time字段
          updateTime: db.serverDate()
        };

        const addResult = await db.collection('chats').add({
          data: newChat
        });

        currentChatId = addResult._id;
        isNewChat = true;
        console.log('新聊天会话创建成功, chatId:', currentChatId);

        // 更新用户统计
        try {
          await updateUserStats(OPENID, roleId);
        } catch (statsErr) {
          console.error('更新用户统计失败:', statsErr);
          // 不影响主流程
        }
      }
    }

    // 获取历史消息（最近10条）
    console.log('获取历史消息, chatId:', currentChatId);
    const historyResult = await db.collection('messages')
      .where({ chatId: currentChatId })
      .orderBy('createTime', 'desc')
      .limit(10)
      .get();

    // 将消息转换为智谱AI所需的格式
    const historyMessages = [];
    if (historyResult.data && historyResult.data.length > 0) {
      // 将消息按时间升序排序
      const sortedMessages = historyResult.data.sort((a, b) => {
        return new Date(a.createTime) - new Date(b.createTime);
      });

      // 转换为智谱AI格式
      sortedMessages.forEach(msg => {
        historyMessages.push({
          role: msg.sender_type === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // 保存用户消息
    console.log('保存用户消息...');
    const userMessage = {
      chatId: currentChatId,
      roleId: roleId,
      openId: OPENID,
      content: content,
      sender_type: 'user',
      createTime: db.serverDate(),
      status: 'sent'
    };

    const userMsgResult = await db.collection('messages').add({
      data: userMessage
    });

    const userMessageId = userMsgResult._id;
    console.log('用户消息保存成功, messageId:', userMessageId);

    // 更新会话信息
    await db.collection('chats').doc(currentChatId).update({
      data: {
        messageCount: _.inc(1),
        lastMessage: content,
        last_message_time: db.serverDate(), // 添加last_message_time字段
        updateTime: db.serverDate()
      }
    });

    // 生成AI回复
    console.log('生成AI回复...');
    const aiReplyResult = await generateAIReply({
      message: content,
      history: historyMessages,
      roleInfo: roleInfo,
      includeEmotionAnalysis: false,
      systemPrompt: systemPrompt // 传递自定义系统提示词（包含用户画像）
    });

    if (!aiReplyResult.success) {
      throw new Error(aiReplyResult.error || 'AI回复生成失败');
    }

    // 获取分段消息
    const segments = aiReplyResult.segments || [aiReplyResult.content];
    const aiMessages = [];

    console.log(`开始保存 ${segments.length} 条分段AI回复...`);

    // 保存每个分段消息
    let firstMessageId = null;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // 创建消息对象
      const aiMessage = {
        chatId: currentChatId,
        roleId: roleId,
        openId: OPENID,
        content: segment,
        sender_type: 'ai',
        createTime: db.serverDate(),
        status: 'sent',
        isSegment: true,           // 标记为分段消息
        segmentIndex: i,           // 分段索引
        totalSegments: segments.length, // 总分段数
        originalMessageId: firstMessageId // 关联到第一条消息
      };

      // 保存消息
      const aiMsgResult = await db.collection('messages').add({
        data: aiMessage
      });

      const aiMessageId = aiMsgResult._id;
      console.log(`分段AI回复 ${i+1}/${segments.length} 保存成功, messageId:`, aiMessageId);

      // 记录第一条消息的ID
      if (i === 0) {
        firstMessageId = aiMessageId;
        // 更新第一条消息的originalMessageId为自身
        await db.collection('messages').doc(aiMessageId).update({
          data: {
            originalMessageId: aiMessageId
          }
        });
      }

      // 获取完整的消息对象（包含_id等字段）
      const completeMessage = await db.collection('messages').doc(aiMessageId).get();
      aiMessages.push(completeMessage.data);

      // 更新会话信息
      await db.collection('chats').doc(currentChatId).update({
        data: {
          messageCount: _.inc(1),
          lastMessage: segment,
          last_message_time: db.serverDate(), // 添加last_message_time字段
          updateTime: db.serverDate()
        }
      });
    }

    // 我们已经禁用了聊天回复中的情绪分析，所以这里不再处理情绪分析结果
    // 情绪分析将由专门的云函数 @cloudfunctions\analysis/ 处理
    let emotionAnalysis = null;

    // 构建返回结果
    // 获取完整的消息对象（包含_id等字段）
    const userMessageComplete = await db.collection('messages').doc(userMessageId).get();

    // 注意：现在返回的是所有分段消息数组，而不是单个消息
    return {
      success: true,
      chatId: currentChatId,
      isNewChat: isNewChat,
      message: userMessageComplete.data,
      aiMessages: aiMessages,      // 返回所有分段消息
      emotionAnalysis: emotionAnalysis
    };
  } catch (error) {
    console.error('发送消息失败:', error);
    return {
      success: false,
      error: error.message || '发送消息失败'
    };
  }
}

// 子功能：删除消息
async function deleteMessage(event, context) {
  const { OPENID } = cloud.getWXContext();

  console.log('执行 deleteMessage 功能, 参数:', event);

  try {
    const { messageId } = event;

    if (!messageId) {
      return {
        success: false,
        error: '消息ID不能为空'
      };
    }

    // 获取消息信息
    const messageResult = await db.collection('messages').doc(messageId).get();

    if (!messageResult.data) {
      return {
        success: false,
        error: '消息不存在'
      };
    }

    const message = messageResult.data;

    // 验证消息所有权
    if (message.openId !== OPENID) {
      return {
        success: false,
        error: '无权删除该消息'
      };
    }

    // 删除消息
    await db.collection('messages').doc(messageId).remove();

    // 更新会话消息计数
    await db.collection('chats').doc(message.chatId).update({
      data: {
        messageCount: _.inc(-1),
        updateTime: db.serverDate()
      }
    });

    return {
      success: true
    };
  } catch (error) {
    console.error('删除消息失败:', error);
    return {
      success: false,
      error: error.message || '删除消息失败'
    };
  }
}

// 子功能：清空聊天记录
async function clearChatHistory(event, context) {
  const { OPENID } = cloud.getWXContext();

  console.log('执行 clearChatHistory 功能, 参数:', event);

  try {
    const { chatId } = event;

    if (!chatId) {
      return {
        success: false,
        error: '聊天ID不能为空'
      };
    }

    // 获取聊天信息
    const chatResult = await db.collection('chats').doc(chatId).get();

    if (!chatResult.data) {
      return {
        success: false,
        error: '聊天不存在'
      };
    }

    const chat = chatResult.data;

    // 验证聊天所有权
    if (chat.openId !== OPENID) {
      return {
        success: false,
        error: '无权清空该聊天记录'
      };
    }

    // 删除所有相关消息
    const deleteResult = await db.collection('messages').where({
      chatId: chatId
    }).remove();

    console.log('删除消息结果:', deleteResult);

    // 重置聊天信息
    await db.collection('chats').doc(chatId).update({
      data: {
        messageCount: 0,
        lastMessage: '',
        last_message_time: db.serverDate(), // 添加last_message_time字段
        updateTime: db.serverDate()
      }
    });

    return {
      success: true,
      deletedCount: deleteResult.stats.removed || 0
    };
  } catch (error) {
    console.error('清空聊天记录失败:', error);
    return {
      success: false,
      error: error.message || '清空聊天记录失败'
    };
  }
}

// 辅助功能：更新用户统计
async function updateUserStats(openId, roleId) {
  try {
    // 查询用户统计信息
    const userStatsResult = await db.collection('user_stats')
      .where({ openid: openId })
      .get();

    if (userStatsResult.data && userStatsResult.data.length > 0) {
      // 更新现有统计
      const userStats = userStatsResult.data[0];

      // 更新对话次数
      await db.collection('user_stats').doc(userStats._id).update({
        data: {
          chat_count: _.inc(1),
          updated_at: db.serverDate(),
          'favorite_roles': db.command.push({
            role_id: roleId,
            usage_count: 1,
            last_used: db.serverDate()
          })
        }
      });

      console.log('用户统计更新成功');
    } else {
      // 创建新的统计记录
      await db.collection('user_stats').add({
        data: {
          openid: openId,
          chat_count: 1,
          total_messages: 0,
          user_messages: 0,
          ai_messages: 0,
          emotion_records_count: 0,
          favorite_roles: [
            {
              role_id: roleId,
              usage_count: 1,
              last_used: db.serverDate()
            }
          ],
          created_at: db.serverDate(),
          updated_at: db.serverDate()
        }
      });

      console.log('用户统计创建成功');
    }

    // 更新角色使用统计
    await cloud.callFunction({
      name: 'roles',
      data: {
        action: 'updateRoleUsage',
        roleId: roleId
      }
    });

    return true;
  } catch (error) {
    console.error('更新用户统计失败:', error);
    throw error;
  }
}

// 子功能：检查聊天是否存在
async function checkChatExists(event, context) {
  const { OPENID } = cloud.getWXContext(); // 获取用户的openid

  console.log('执行 checkChatExists 功能, 参数:', event);
  console.log('OPENID:', OPENID);

  try {
    // 获取请求参数
    const { roleId } = event;

    if (!roleId) {
      return {
        success: false,
        error: '角色ID不能为空'
      };
    }

    // 查询是否存在与该角色的聊天会话
    console.log('查询现有聊天会话...');
    const chatResult = await db.collection('chats')
      .where({
        roleId: roleId,
        openId: OPENID
      })
      .orderBy('updateTime', 'desc')
      .limit(1)
      .get();

    if (chatResult.data && chatResult.data.length > 0) {
      // 存在聊天会话
      const chatId = chatResult.data[0]._id;
      console.log('找到现有聊天会话, chatId:', chatId);

      return {
        success: true,
        exists: true,
        chatId: chatId
      };
    } else {
      // 不存在聊天会话
      console.log('未找到与该角色的聊天会话');

      return {
        success: true,
        exists: false
      };
    }
  } catch (error) {
    console.error('检查聊天会话失败:', error);
    return {
      success: false,
      error: error.message || '检查聊天会话失败'
    };
  }
}

// 主函数入口
exports.main = async (event, context) => {
  const { action } = event;

  console.log('chat 云函数入口, action:', action);

  switch (action) {
    // 原有功能（兼容旧版本）
    case 'save':
      return await saveChatHistory(event, context);
    case 'get':
      return await getChatHistory(event, context);
    case 'reply':
      return await generateAIReply(event, context);

    // 新增功能
    case 'sendMessage':
      return await sendMessage(event, context);
    case 'getChatHistory':
      return await getChatHistory(event, context);
    case 'saveChatHistory':
      return await saveChatHistory(event, context);
    case 'deleteMessage':
      return await deleteMessage(event, context);
    case 'clearChatHistory':
      return await clearChatHistory(event, context);
    case 'checkChatExists':
      return await checkChatExists(event, context);

    default:
      return { success: false, error: '未知操作' };
  }
};
