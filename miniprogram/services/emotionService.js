/**
 * 情感分析服务
 * 提供情感分析相关功能
 */

// 是否为开发环境，控制日志输出
const isDev = false; // 设置为true可以开启详细日志

// 情感类型枚举
const EmotionTypes = {
  JOY: '喜悦',
  SADNESS: '伤感',
  ANGER: '愤怒',
  ANXIETY: '焦虑',
  NEUTRAL: '平静'
};

// 情感类型中文标签
const EmotionTypeLabels = {
  // 中文情感类型直接使用
  '喜悦': '喜悦',
  '伤感': '伤感',
  '愤怒': '愤怒',
  '焦虑': '焦虑',
  '平静': '平静',
  '惊讶': '惊讶',
  '厌恶': '厌恶',
  '期待': '期待',
  '紧迫': '紧迫',
  '失望': '失望',
  '疲惫': '疲惫',

  // 兼容英文情感类型
  joy: '喜悦',
  sadness: '伤感',
  anger: '愤怒',
  anxiety: '焦虑',
  neutral: '平静',
  calm: '平静',
  surprise: '惊讶',
  disgust: '厌恶',
  anticipation: '期待',
  urgency: '紧迫',
  disappointment: '失望',
  fatigue: '疲惫'
};

// 情感类型颜色
const EmotionTypeColors = {
  // 中文情感类型颜色映射 - 使用更丰富的色彩
  '喜悦': '#10B981',    // 绿色
  '开心': '#10B981',    // 绿色
  '快乐': '#34D399',    // 浅绿色
  '兴奋': '#059669',    // 深绿色
  '满足': '#8B5CF6',    // 紫色
  '幸福': '#047857',    // 深绿色
  '伤感': '#60A5FA',    // 蓝色
  '悲伤': '#3B82F6',    // 深蓝色
  '难过': '#6366F1',    // 靛蓝色
  '忧伤': '#818CF8',    // 浅紫色
  '愤怒': '#EF4444',    // 红色
  '生气': '#F87171',    // 浅红色
  '愤怨': '#DC2626',    // 深红色
  '愤愤': '#B91C1C',    // 更深红色
  '焦虑': '#F59E0B',    // 黄色
  '担忧': '#FBBF24',    // 浅黄色
  '紧张': '#D97706',    // 深黄色
  '恐惧': '#92400E',    // 棕色
  '平静': '#64748B',    // 蓝灰色
  '平稳': '#94A3B8',    // 浅蓝灰色
  '平和': '#475569',    // 深蓝灰色
  '安宁': '#334155',    // 更深蓝灰色
  '惊讶': '#EC4899',    // 粉色
  '惊奇': '#DB2777',    // 深粉色
  '惊喜': '#F472B6',    // 浅粉色
  '惊恐': '#9D174D',    // 更深粉色
  '厌恶': '#F97316',    // 橙色
  '厌倦': '#FB923C',    // 浅橙色
  '厌怕': '#C2410C',    // 深橙色
  '厌烦': '#9A3412',    // 更深橙色
  '期待': '#14B8A6',    // 青绿色
  '盼望': '#0D9488',    // 深青绿色
  '向往': '#2DD4BF',    // 浅青绿色
  '憧憬': '#0F766E',    // 更深青绿色
  '紧迫': '#BE123C',    // 深红色
  '紧急': '#E11D48',    // 中红色
  '紧张': '#F43F5E',    // 浅红色
  '紧张不安': '#9F1239', // 更深红色
  '失望': '#6B7280',    // 灰色
  '失落': '#9CA3AF',    // 浅灰色
  '失望透顶': '#4B5563', // 深灰色
  '失落感': '#374151',    // 更深灰色
  '疲惫': '#8B5CF6',    // 紫色
  '疲惫不堂': '#7C3AED', // 深紫色
  '疲乏': '#A78BFA', // 浅紫色
  '疲惫不堪': '#4C1D95', // 更深紫色
  '中性': '#9CA3AF',    // 灰色
  '未知': '#6B7280',    // 灰色
  '好奇': '#06B6D4',    // 浅青色
  '好奇心': '#0891B2', // 青色
  '好奇心切': '#0E7490', // 深青色
  '关心': '#8B5CF6',    // 紫色
  '关切': '#7C3AED',    // 深紫色
  '关怀': '#6D28D9',    // 更深紫色
  '感激': '#F59E0B',    // 黄色
  '感恩': '#D97706',    // 深黄色
  '感激不尽': '#B45309', // 更深黄色

  // 兼容英文情感类型颜色映射
  joy: '#10B981',         // 绿色
  happiness: '#34D399',   // 浅绿色
  excited: '#059669',     // 深绿色
  content: '#047857',     // 更深绿色
  sadness: '#60A5FA',     // 蓝色
  grief: '#3B82F6',       // 深蓝色
  melancholy: '#6366F1',  // 靛蓝色
  sorrow: '#818CF8',      // 浅紫色
  anger: '#EF4444',       // 红色
  rage: '#DC2626',        // 深红色
  fury: '#B91C1C',        // 更深红色
  irritation: '#F87171',  // 浅红色
  anxiety: '#F59E0B',     // 黄色
  worry: '#FBBF24',       // 浅黄色
  tension: '#D97706',     // 深黄色
  fear: '#92400E',        // 棕色
  neutral: '#64748B',     // 蓝灰色
  calm: '#94A3B8',        // 浅蓝灰色
  peaceful: '#475569',    // 深蓝灰色
  serene: '#334155',      // 更深蓝灰色
  surprise: '#EC4899',    // 粉色
  amazement: '#DB2777',   // 深粉色
  astonishment: '#F472B6',// 浅粉色
  shock: '#9D174D',       // 更深粉色
  disgust: '#F97316',     // 橙色
  dislike: '#FB923C',     // 浅橙色
  aversion: '#C2410C',    // 深橙色
  revulsion: '#9A3412',   // 更深橙色
  anticipation: '#14B8A6',// 青绿色
  expectation: '#0D9488', // 深青绿色
  hope: '#2DD4BF',        // 浅青绿色
  longing: '#0F766E',     // 更深青绿色
  urgency: '#BE123C',     // 深红色
  pressing: '#E11D48',    // 中红色
  urgent: '#F43F5E',      // 浅红色
  critical: '#9F1239',    // 更深红色
  disappointment: '#6B7280', // 灰色
  letdown: '#9CA3AF',     // 浅灰色
  disillusionment: '#4B5563', // 深灰色
  regret: '#374151',      // 更深灰色
  fatigue: '#8B5CF6',     // 紫色
  exhaustion: '#7C3AED',  // 深紫色
  tiredness: '#A78BFA',   // 浅紫色
  weariness: '#4C1D95',   // 更深紫色
  trust: '#0EA5E9',       // 浅蓝色
  confidence: '#0284C7',  // 中蓝色
  faith: '#0369A1',       // 深蓝色
  admiration: '#0C4A6E',  // 更深蓝色
  curious: '#06B6D4',     // 浅青色
  inquisitive: '#0891B2', // 青色
  wonder: '#0E7490',      // 深青色
  caring: '#8B5CF6',      // 紫色
  concerned: '#7C3AED',   // 深紫色
  compassionate: '#6D28D9', // 更深紫色
  grateful: '#F59E0B',    // 黄色
  thankful: '#D97706',    // 深黄色
  appreciative: '#B45309' // 更深黄色
};

/**
 * 分析文本情感
 * @param {string} text 待分析文本
 * @param {Object} options 附加选项
 * @param {boolean} options.saveRecord 是否保存记录
 * @param {string} options.roleId 角色ID
 * @param {string} options.chatId 对话ID
 * @param {Array} options.history 历史消息记录
 * @param {boolean} options.extractKeywords 是否提取关键词
 * @param {boolean} options.linkKeywords 是否关联关键词与情感
 * @returns {Promise<object>} 情感分析结果
 */
async function analyzeEmotion(text, options = {}) {
  try {
    // 验证参数
    if (!text || typeof text !== 'string' || text.trim() === '') {
      if (isDev) {
        console.warn('情感分析文本为空');
      }
      return createDefaultResult();
    }

    // 构建调用参数
    const callParams = {
      text: text, // 确保文本参数正确传递
      saveRecord: options.saveRecord || false,
      extractKeywords: options.extractKeywords !== false, // 默认为true
      linkKeywords: options.linkKeywords !== false // 默认为true
    };

    // 添加可选参数
    if (options.roleId) callParams.roleId = options.roleId;
    if (options.chatId) callParams.chatId = options.chatId;

    // 添加历史消息记录
    if (Array.isArray(options.history) && options.history.length > 0) {
      callParams.history = options.history;
    }

    if (isDev) {
      console.log('发送到云函数的参数:', callParams);
    }

    // 调用 analysis 云函数
    const result = await wx.cloud.callFunction({
      name: 'analysis',
      data: {
        type: 'emotion',
        ...callParams
      }
    });

    // 验证结果
    if (!result || !result.result) {
      console.error('情感分析云函数返回错误: 无效的响应');
      return createDefaultResult();
    }

    // 即使云函数返回错误，也尝试提取有用的数据
    if (!result.result.success) {
      console.error('情感分析云函数返回错误:', result.result.error || '未知错误');

      // 如果有数据，就使用这些数据
      if (result.result.data) {
        if (isDev) {
          console.log('尝试使用云函数返回的部分数据');
        }
        return {
          success: true,
          data: result.result.data
        };
      }

      // 如果没有数据，就使用默认数据
      return createDefaultResult();
    }

    if (isDev) {
      console.log('使用 analysis 云函数分析成功');
    }

    // 返回分析结果和记录ID（如果有）
    const analysisResult = result.result.result || result.result.data || {};

    // 如果有关键词，将关键词添加到结果中
    const keywords = result.result.keywords || [];

    // 构建完整的结果对象
    const finalResult = {
      success: true,
      data: {
        ...analysisResult,
        recordId: result.result.recordId || null,
        keywords: keywords,
        timestamp: new Date().getTime() // 添加时间戳
      }
    };

    // 保存最新的情绪分析结果到本地缓存
    try {
      wx.setStorageSync('latestEmotionAnalysis', finalResult);
      if (isDev) {
        console.log('已将最新情绪分析结果保存到本地缓存');
      }
    } catch (e) {
      console.error('保存情绪分析结果到本地缓存失败:', e.message || e);
    }

    return finalResult;
  } catch (error) {
    console.error('情感分析调用失败:', error.message || error);
    return createDefaultResult();
  }
}

/**
 * 创建默认的情感分析结果
 * @returns {object} 默认情感分析结果
 */
function createDefaultResult() {
  const defaultData = {
    type: EmotionTypes.NEUTRAL,
    intensity: 0.5,
    valence: 0.0,
    arousal: 0.5,
    trend: 'unknown',
    attention_level: 'medium',
    radar_dimensions: {
      trust: 0.5,
      openness: 0.5,
      resistance: 0.5,
      stress: 0.5,
      control: 0.5
    },
    topic_keywords: [],
    emotion_triggers: [],
    suggestions: ['继续保持对话'],
    summary: '无法分析您当前的情绪状态，您的情绪似乎比较平稳。',
    recordId: null,
    // 兼容旧版字段
    primary_emotion: EmotionTypes.NEUTRAL,
    secondary_emotions: [],
    keywords: [],
    report: '无法分析您当前的情绪状态，您的情绪似乎比较平稳。'
  };

  return {
    success: false,
    error: '情绪分析失败',
    data: defaultData
  };
}

/**
 * 保存情感分析记录到数据库
 * @param {object} emotionData 情感数据
 * @returns {Promise<string>} 记录ID
 */
async function saveEmotionRecord(emotionData) {
  try {
    const db = wx.cloud.database();
    const result = await db.collection('emotionRecords').add({
      data: {
        userId: emotionData.userId,
        roleId: emotionData.roleId,
        roleName: emotionData.roleName,
        chatId: emotionData.chatId,
        messageId: emotionData.messageId,
        analysis: emotionData.analysis,
        createTime: db.serverDate()
      }
    });
    return result._id;
  } catch (error) {
    console.error('保存情感记录失败:', error.message || error);
    throw error;
  }
}

/**
 * 获取情感历史记录
 * @param {string} userId 用户ID
 * @param {string} roleId 角色ID (可选)
 * @param {number} limit 限制数量
 * @returns {Promise<Array>} 情感历史记录
 */
async function getEmotionHistory(userId, roleId = null, limit = 10) {
  if (isDev) {
    console.log('开始获取情感历史记录, 参数:', { userId, roleId, limit });
  }

  if (!userId) {
    console.error('获取情感历史记录失败: 用户ID不能为空');
    return [];
  }

  try {
    // 检查云环境初始化
    if (!wx.cloud) {
      console.error('获取情感历史记录失败: 云环境未初始化');
      return [];
    }

    // 尝试使用云函数查询
    if (isDev) {
      console.log('尝试使用云函数查询情绪历史记录');
    }

    // 初始化云环境（如果需要）
    if (!wx.cloud.inited) {
      try {
        wx.cloud.init({
          env: 'rainbowrain-2gt3j8hda726e4fe', // 使用您的实际环境ID
          traceUser: true
        });
        if (isDev) {
          console.log('云环境初始化成功');
        }
      } catch (initError) {
        console.error('云环境初始化失败:', initError.message || initError);
      }
    }

    let result;
    try {
      result = await wx.cloud.callFunction({
        name: 'getEmotionRecords',
        data: {
          userId: userId,
          roleId: roleId,
          limit: limit
        }
      });

      if (isDev) {
        console.log('云函数返回结果成功');
      }
    } catch (cloudError) {
      console.error('调用云函数失败:', cloudError.message || cloudError);
      // 不抛出错误，而是让代码继续执行到备用方案
      result = { result: { success: false, error: cloudError } };
    }

    if (result && result.result && result.result.success) {
      const records = result.result.data || [];
      if (isDev) {
        console.log('云函数获取情绪历史记录成功, 数量:', records.length);
      }

      // 处理返回的数据，确保字段格式一致
      const processedData = records.map(record => {
        // 处理 analysis 字段
        if (record.analysis) {
          // 确保有 primary_emotion 字段
          if (!record.analysis.primary_emotion && record.analysis.type) {
            record.analysis.primary_emotion = record.analysis.type;
          }

          // 确保有 topic_keywords 字段
          if (!record.analysis.topic_keywords && record.analysis.keywords) {
            record.analysis.topic_keywords = record.analysis.keywords;
          }
        }

        return record;
      });

      return processedData;
    } else {
      if (isDev) {
        console.error('云函数返回错误:', result && result.result ? result.result.error : '未知错误');
        console.log('尝试直接使用数据库查询作为备用方案');
      }

      const db = wx.cloud.database();

      // 尝试使用字符串查询
      let dbResult;
      try {
        // 构建字符串查询条件
        let whereStr = `userId=="${userId}"`;
        if (roleId) {
          whereStr += ` && roleId=="${roleId}"`;
        }

        if (isDev) {
          console.log('字符串查询条件:', whereStr);
        }

        // 查询记录
        dbResult = await db.collection('emotionRecords')
          .where(whereStr)
          .orderBy('createTime', 'desc')
          .limit(limit)
          .get();

        if (isDev && dbResult && dbResult.data) {
          console.log('字符串查询结果数量:', dbResult.data.length);
        }
      } catch (stringQueryError) {
        console.error('字符串查询失败:', stringQueryError.message || stringQueryError);

        // 如果字符串查询失败，尝试使用对象查询
        try {
          const query = { userId: userId };
          if (roleId) {
            query.roleId = roleId;
          }

          if (isDev) {
            console.log('对象查询条件:', query);
          }

          dbResult = await db.collection('emotionRecords')
            .where(query)
            .orderBy('createTime', 'desc')
            .limit(limit)
            .get();

          if (isDev && dbResult && dbResult.data) {
            console.log('对象查询结果数量:', dbResult.data.length);
          }
        } catch (objectQueryError) {
          console.error('对象查询失败:', objectQueryError.message || objectQueryError);

          // 如果两种查询都失败，返回空数组
          return [];
        }
      }

      // 检查dbResult是否定义
      if (!dbResult || !dbResult.data) {
        console.error('查询结果为空');
        return [];
      }

      if (isDev) {
        console.log('备用查询获取情感历史记录成功, 数量:', dbResult.data.length);
      }

      // 处理返回的数据，确保字段格式一致
      const processedData = dbResult.data.map(record => {
        // 处理 analysis 字段
        if (record.analysis) {
          // 确保有 primary_emotion 字段
          if (!record.analysis.primary_emotion && record.analysis.type) {
            record.analysis.primary_emotion = record.analysis.type;
          }

          // 确保有 topic_keywords 字段
          if (!record.analysis.topic_keywords && record.analysis.keywords) {
            record.analysis.topic_keywords = record.analysis.keywords;
          }
        }

        return record;
      });

      return processedData;
    }
  } catch (error) {
    console.error('获取情感历史记录失败:', error.message || error);

    // 返回空数组
    if (isDev) {
      console.log('没有找到情绪历史记录');
    }
    return [];
  }
}



/**
 * 根据情感类型匹配推荐角色
 * @param {object} emotion 情感分析结果
 * @param {Array} roleList 角色列表
 * @returns {object|null} 推荐角色
 */
function matchRoleByEmotion(emotion, roleList) {
  if (!emotion || !roleList || roleList.length === 0) {
    return null;
  }

  // 情感类型与角色特性的匹配规则
  const matchRules = {
    joy: ['开朗', '活泼', '幽默', '乐观'],
    sadness: ['温柔', '体贴', '同理心', '安慰'],
    anger: ['冷静', '理性', '平和', '客观'],
    anxiety: ['稳重', '可靠', '安抚', '支持'],
    neutral: ['平衡', '中立', '客观', '全面'],
    // 添加新的情感类型映射
    calm: ['平静', '安宁', '平和', '舒适'],
    surprise: ['好奇', '活力', '创新', '灵活'],
    disgust: ['直接', '坦率', '批判性', '分析'],
    anticipation: ['积极', '前瞻', '规划', '鼓励'],
    urgency: ['高效', '果断', '行动导向', '解决问题'],
    disappointment: ['理解', '支持', '鼓励', '积极'],
    fatigue: ['放松', '舒缓', '耐心', '关怀'],
    // 添加新增的情绪类型映射
    curious: ['好奇', '探索', '创新', '学习'],
    caring: ['关心', '体贴', '理解', '关怀'],
    grateful: ['感恩', '感谢', '欢喜', '欣赏']
  };

  // 获取当前情感类型的匹配特性
  // 适配新的情感分析结果格式，优先使用primary_emotion字段
  const emotionType = emotion.primary_emotion || emotion.type || 'neutral';
  const matchTraits = matchRules[emotionType] || matchRules.neutral;

  // 为每个角色计算匹配分数
  const scoredRoles = roleList.map(role => {
    // 提取角色特性关键词
    const roleTraits = [
      role.role_name || '',
      role.role_desc || '',
      role.speaking_style || '',
      role.style || ''
    ].join(' ').toLowerCase();

    // 计算匹配分数
    let score = 0;
    matchTraits.forEach(trait => {
      if (roleTraits.includes(trait.toLowerCase())) {
        score += 1;
      }
    });

    // 根据情感强度调整分数
    const intensity = emotion.intensity || 0.5;
    if (intensity > 0.7) {
      score *= 1.5; // 情感强烈时，更倾向于匹配
    }

    return {
      role,
      score
    };
  });

  // 按分数排序
  scoredRoles.sort((a, b) => b.score - a.score);

  // 返回得分最高的角色，如果所有角色得分为0，则随机返回一个
  return scoredRoles[0].score > 0 ? scoredRoles[0].role :
    roleList[Math.floor(Math.random() * roleList.length)];
}

/**
 * 检测情感变化并提供角色切换建议
 * @param {object} prevEmotion 之前的情感
 * @param {object} currentEmotion 当前情感
 * @param {Array} roleList 角色列表
 * @returns {object} 切换建议
 */
function checkEmotionChangeAndSuggestRoleSwitch(prevEmotion, currentEmotion, roleList) {
  if (!prevEmotion || !currentEmotion || !roleList || roleList.length === 0) {
    return { shouldSwitch: false };
  }

  // 计算情感变化幅度
  const prevType = prevEmotion.primary_emotion || prevEmotion.type || 'neutral';
  const currentType = currentEmotion.primary_emotion || currentEmotion.type || 'neutral';
  const typeChanged = prevType !== currentType;

  // 获取情感强度，处理可能的空值
  const prevIntensity = prevEmotion.intensity || 0.5;
  const currentIntensity = currentEmotion.intensity || 0.5;
  const intensityChange = Math.abs(prevIntensity - currentIntensity);

  // 判断是否需要切换角色
  if (typeChanged || intensityChange > 0.3) {
    const suggestedRole = matchRoleByEmotion(currentEmotion, roleList);
    return {
      shouldSwitch: true,
      suggestedRole: suggestedRole,
      reason: typeChanged ? '情绪类型发生变化' : '情绪强度变化显著'
    };
  }

  return { shouldSwitch: false };
}

/**
 * 格式化聊天历史记录为情感分析所需的格式
 * @param {Array} chatHistory 聊天历史记录
 * @param {number} maxItems 最大条目数
 * @returns {Array} 格式化后的历史记录
 */
function formatChatHistoryForAnalysis(chatHistory, maxItems = 5) {
  if (!Array.isArray(chatHistory) || chatHistory.length === 0) {
    return [];
  }

  // 获取最近的消息
  const recentMessages = chatHistory.slice(-maxItems);

  // 转换为情感分析所需的格式
  return recentMessages.map(msg => {
    return {
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.content || ''
    };
  });
}

/**
 * 计算情绪波动指数
 * 根据情绪记录计算用户的情绪波动指数
 * @param {Array} records 情绪记录数组
 * @returns {Number} 情绪波动指数（0-100）
 */
function calculateEmotionalVolatility(records) {
  if (!records || records.length < 2) {
    return 0; // 记录不足，无法计算波动指数
  }

  // 标准差计算
  const intensities = records.map(record => {
    // 尝试从不同字段获取情绪强度
    return record.analysis?.intensity ||
      record.analysis?.arousal ||
      (record.analysis?.radar_dimensions?.intensity) || 0.5;
  });

  const mean = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
  const squareDiffs = intensities.map(val => Math.pow(val - mean, 2));
  const stdDev = Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length);

  // 标准差归一化到0-1范围（假设最大标准差为0.5）
  const normalizedStdDev = Math.min(stdDev / 0.5, 1);

  // 情绪类型变化
  const typeChanges = countEmotionTypeChanges(records);

  // 情绪类型多样性
  const typeDiversity = calculateEmotionTypeDiversity(records);

  // 时间加权
  const timeWeightedChanges = calculateTimeWeightedChanges(records);

  // 综合波动指数 (0-100)
  const volatility = (normalizedStdDev * 40) + (typeChanges * 30) + (typeDiversity * 20) + (timeWeightedChanges * 10);

  return Math.min(Math.round(volatility), 100);
}

/**
 * 计算情绪类型变化次数
 * @param {Array} records 情绪记录数组
 * @returns {Number} 归一化的情绪类型变化频率（0-1）
 */
function countEmotionTypeChanges(records) {
  if (!records || records.length < 2) return 0;

  let changes = 0;
  let prevType = getEmotionType(records[0]);

  for (let i = 1; i < records.length; i++) {
    const currentType = getEmotionType(records[i]);
    if (currentType !== prevType) {
      changes++;
      prevType = currentType;
    }
  }

  // 归一化：变化次数除以可能的最大变化次数（记录数-1）
  return Math.min(changes / (records.length - 1), 1);
}

/**
 * 计算情绪类型多样性
 * @param {Array} records 情绪记录数组
 * @returns {Number} 归一化的情绪类型多样性（0-1）
 */
function calculateEmotionTypeDiversity(records) {
  if (!records || records.length === 0) return 0;

  // 统计各情绪类型出现次数
  const typeCounts = {};
  records.forEach(record => {
    const type = getEmotionType(record);
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  // 计算香农熵作为多样性指标
  const typeCount = Object.keys(typeCounts).length;

  // 简单方法：使用类型数量除以最大可能类型数（假设为8）
  return Math.min(typeCount / 8, 1);
}

/**
 * 计算时间加权变化
 * @param {Array} records 情绪记录数组
 * @returns {Number} 归一化的时间加权变化（0-1）
 */
function calculateTimeWeightedChanges(records) {
  if (!records || records.length < 2) return 0;

  // 按时间排序
  const sortedRecords = [...records].sort((a, b) => {
    const timeA = new Date(a.createTime || a.timestamp || 0);
    const timeB = new Date(b.createTime || b.timestamp || 0);
    return timeA - timeB;
  });

  let weightedChanges = 0;
  let totalWeight = 0;

  for (let i = 1; i < sortedRecords.length; i++) {
    const prevRecord = sortedRecords[i - 1];
    const currRecord = sortedRecords[i];

    // 计算时间差（小时）
    const prevTime = new Date(prevRecord.createTime || prevRecord.timestamp || 0);
    const currTime = new Date(currRecord.createTime || currRecord.timestamp || 0);
    const hoursDiff = Math.max(1, (currTime - prevTime) / (1000 * 60 * 60));

    // 时间权重：时间间隔越短，权重越大
    const timeWeight = 1 / Math.sqrt(hoursDiff);

    // 情绪变化
    const prevType = getEmotionType(prevRecord);
    const currType = getEmotionType(currRecord);
    const typeChanged = prevType !== currType ? 1 : 0;

    // 情绪强度变化
    const prevIntensity = prevRecord.analysis?.intensity || 0.5;
    const currIntensity = currRecord.analysis?.intensity || 0.5;
    const intensityChange = Math.abs(currIntensity - prevIntensity);

    // 加权变化
    weightedChanges += (typeChanged * 0.7 + intensityChange * 0.3) * timeWeight;
    totalWeight += timeWeight;
  }

  // 归一化
  return totalWeight > 0 ? Math.min(weightedChanges / totalWeight, 1) : 0;
}

/**
 * 获取情绪类型
 * @param {Object} record 情绪记录
 * @returns {String} 情绪类型
 */
function getEmotionType(record) {
  // 尝试从不同字段获取情绪类型
  return record.analysis?.primary_emotion ||
    record.analysis?.type ||
    record.type ||
    'neutral';
}

/**
 * 获取情绪波动级别
 * @param {Number} volatilityIndex 情绪波动指数
 * @returns {String} 波动级别描述
 */
function getVolatilityLevel(volatilityIndex) {
  if (volatilityIndex <= 20) return '非常稳定';
  if (volatilityIndex <= 40) return '稳定';
  if (volatilityIndex <= 60) return '中等';
  if (volatilityIndex <= 80) return '波动';
  return '剧烈波动';
}

/**
 * 计算情绪波动变化百分比
 * @param {Number} current 当前波动指数
 * @param {Number} previous 上一时段波动指数
 * @returns {Number} 变化百分比
 */
function calculateVolatilityChangePercent(current, previous) {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * 分析情绪波动原因
 * @param {Array} currentRecords 当前时段情绪记录
 * @param {Array} previousRecords 上一时段情绪记录
 * @returns {String} 波动原因描述
 */
function analyzeVolatilityReason(currentRecords, previousRecords) {
  if (!currentRecords || currentRecords.length === 0) {
    return '数据不足，无法分析波动原因';
  }

  // 获取主导情绪
  const emotionCounts = {};
  currentRecords.forEach(record => {
    const type = getEmotionType(record);
    emotionCounts[type] = (emotionCounts[type] || 0) + 1;
  });

  // 找出出现次数最多的情绪
  let dominantEmotion = 'neutral';
  let maxCount = 0;

  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = emotion;
    }
  }

  // 情绪类型映射表（英文到中文）
  const emotionTypeMap = {
    'joy': '喜悦',
    'sadness': '伤感',
    'anger': '愤怒',
    'anxiety': '焦虑',
    'neutral': '平静',
    'tired': '疲惫',
    'surprise': '惊讶',
    'calm': '平静',
    'happy': '开心',
    'sad': '难过',
    'angry': '生气',
    'fear': '恐惧',
    'disgust': '厌恶',
    'anticipation': '期待',
    'trust': '信任',
    'curious': '好奇',
    'caring': '关心',
    'grateful': '感激',
    'inquisitive': '好奇心',
    'concerned': '关切',
    'compassionate': '关怀',
    'thankful': '感恩',
    'appreciative': '感激不尽'
  };

  // 获取中文情绪名称
  const dominantEmotionCN = emotionTypeMap[dominantEmotion] || dominantEmotion;

  // 计算情绪强度平均值
  const intensities = currentRecords.map(record =>
    record.analysis?.intensity || record.analysis?.arousal || 0.5
  );
  const avgIntensity = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;

  // 情绪强度描述
  let intensityDesc = '';
  if (avgIntensity < 0.3) intensityDesc = '较低';
  else if (avgIntensity < 0.6) intensityDesc = '中等';
  else intensityDesc = '较高';

  // 情绪变化频率
  const changeRate = countEmotionTypeChanges(currentRecords);
  let changeDesc = '';
  if (changeRate < 0.3) changeDesc = '较少';
  else if (changeRate < 0.6) changeDesc = '适中';
  else changeDesc = '频繁';

  // 生成波动原因描述
  let reason = `这可能与你最近${dominantEmotionCN}情绪为主，情绪强度${intensityDesc}，且情绪变化${changeDesc}有关`;

  // 如果有上一时段数据，进行对比分析
  if (previousRecords && previousRecords.length > 0) {
    const prevDominantEmotion = getMainEmotionType(previousRecords);
    const prevDominantEmotionCN = emotionTypeMap[prevDominantEmotion] || prevDominantEmotion;

    if (dominantEmotion !== prevDominantEmotion) {
      reason += `。相比之前的${prevDominantEmotionCN}情绪，情绪类型发生了变化`;
    }
  }

  return reason;
}

/**
 * 获取主要情绪类型
 * @param {Array} records 情绪记录数组
 * @returns {String} 主要情绪类型
 */
function getMainEmotionType(records) {
  if (!records || records.length === 0) return 'neutral';

  const emotionCounts = {};
  records.forEach(record => {
    const type = getEmotionType(record);
    emotionCounts[type] = (emotionCounts[type] || 0) + 1;
  });

  let mainType = 'neutral';
  let maxCount = 0;

  for (const [type, count] of Object.entries(emotionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mainType = type;
    }
  }

  return mainType;
}

/**
 * 按时间段分组情绪记录
 * @param {Array} records 情绪记录数组
 * @returns {Object} 分组后的记录
 */
function groupRecordsByTimeRange(records) {
  if (!records || records.length === 0) {
    return {
      currentWeek: [],
      lastWeek: [],
      twoWeeksAgo: []
    };
  }

  // 获取当前时间
  const now = new Date();

  // 计算时间范围
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgoDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

  // 分组
  const currentWeek = [];
  const lastWeek = [];
  const twoWeeksAgoRecords = [];

  records.forEach(record => {
    // 获取记录时间
    let recordTime;

    if (record.createTime) {
      // 处理不同的时间格式
      if (typeof record.createTime === 'object' && record.createTime.$date) {
        recordTime = new Date(record.createTime.$date);
      } else {
        recordTime = new Date(record.createTime);
      }
    } else if (record.timestamp) {
      recordTime = new Date(record.timestamp);
    } else {
      // 如果没有时间字段，跳过该记录
      return;
    }

    // 分组
    if (recordTime >= oneWeekAgo) {
      currentWeek.push(record);
    } else if (recordTime >= twoWeeksAgoDate) {
      lastWeek.push(record);
    } else if (recordTime >= threeWeeksAgo) {
      twoWeeksAgoRecords.push(record);
    }
  });

  return {
    currentWeek,
    lastWeek,
    twoWeeksAgo: twoWeeksAgoRecords
  };
}

/**
 * 计算并返回情绪波动指数数据
 * @param {Array} records 情绪记录数组
 * @returns {Object} 情绪波动指数数据
 */
function getEmotionalVolatilityData(records) {
  // 按时间段分组
  const groupedRecords = groupRecordsByTimeRange(records);

  // 计算各时间段的波动指数
  const currentVolatility = calculateEmotionalVolatility(groupedRecords.currentWeek);
  const lastVolatility = calculateEmotionalVolatility(groupedRecords.lastWeek);
  const twoWeeksAgoVolatility = calculateEmotionalVolatility(groupedRecords.twoWeeksAgo);

  // 计算变化百分比
  const changePercent = calculateVolatilityChangePercent(currentVolatility, lastVolatility);

  // 获取波动级别
  const volatilityLevel = getVolatilityLevel(currentVolatility);

  // 分析波动原因
  const volatilityReason = analyzeVolatilityReason(groupedRecords.currentWeek, groupedRecords.lastWeek);

  // 返回结果
  return {
    volatilityIndex: {
      current: currentVolatility,
      previous: lastVolatility,
      twoWeeksAgo: twoWeeksAgoVolatility,
      changePercent: changePercent
    },
    volatilityLevel: volatilityLevel,
    volatilityReason: volatilityReason,
    chartData: [
      {
        value: twoWeeksAgoVolatility,
        label: '上上周'
      },
      {
        value: lastVolatility,
        label: '上周'
      },
      {
        value: currentVolatility,
        label: '本周'
      }
    ]
  };
}


/**
 * 获取关键词情感统计
 * @param {string} userId 用户ID
 * @returns {Promise<Object>} 关键词情感统计数据
 */
async function getKeywordEmotionStats(userId) {
  try {
    if (!userId) {
      console.warn('获取关键词情感统计失败: 用户ID不能为空');
      return { positive: [], negative: [], neutral: [] };
    }

    // 调用云函数获取关键词情感统计
    const result = await wx.cloud.callFunction({
      name: 'analysis',
      data: {
        type: 'get_keyword_emotion_stats',
        userId: userId
      }
    });

    if (result && result.result && result.result.success && result.result.data) {
      console.log('获取关键词情感统计成功:', result.result.data);
      return result.result.data;
    } else {
      console.warn('获取关键词情感统计失败:', result?.result?.error || '未知错误');
      return { positive: [], negative: [], neutral: [] };
    }
  } catch (error) {
    console.error('获取关键词情感统计异常:', error);
    return { positive: [], negative: [], neutral: [] };
  }
}

/**
 * 关联关键词与情感
 * @param {string} userId 用户ID
 * @param {Array} keywords 关键词数组
 * @param {Object} emotionResult 情感分析结果
 * @returns {Promise<boolean>} 是否关联成功
 */
async function linkKeywordsToEmotion(userId, keywords, emotionResult) {
  try {
    if (!userId || !Array.isArray(keywords) || keywords.length === 0 || !emotionResult) {
      console.warn('关联关键词与情感失败: 参数不完整');
      return false;
    }

    // 调用云函数关联关键词与情感
    const result = await wx.cloud.callFunction({
      name: 'analysis',
      data: {
        type: 'link_keywords_emotion',
        userId: userId,
        keywords: keywords,
        emotionResult: emotionResult
      }
    });

    if (result && result.result && result.result.success) {
      console.log('关联关键词与情感成功');
      return true;
    } else {
      console.warn('关联关键词与情感失败:', result?.result?.error || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('关联关键词与情感异常:', error);
    return false;
  }
}

/**
 * 获取最新的情绪分析结果
 * @returns {Object|null} 最新的情绪分析结果，如果没有则返回null
 */
function getLatestEmotionAnalysis() {
  try {
    // 从本地缓存中获取最新的情绪分析结果
    const cachedResult = wx.getStorageSync('latestEmotionAnalysis');

    // 检查缓存是否存在且有效
    if (cachedResult && cachedResult.success && cachedResult.data) {
      // 检查缓存是否过期（24小时）
      const now = new Date().getTime();
      const cacheTime = cachedResult.data.timestamp || 0;
      const cacheAge = now - cacheTime;

      // 如果缓存不超过24小时，则返回缓存的结果
      if (cacheAge < 24 * 60 * 60 * 1000) {
        console.log('使用缓存的情绪分析结果，缓存时间：', new Date(cacheTime).toLocaleString());
        return cachedResult;
      } else {
        console.log('缓存的情绪分析结果已过期');
      }
    } else {
      console.log('本地缓存中没有有效的情绪分析结果');
    }

    return null;
  } catch (error) {
    console.error('获取缓存的情绪分析结果失败:', error);
    return null;
  }
}

// 创建服务对象
const emotionService = {
  EmotionTypes,
  EmotionTypeLabels,
  EmotionTypeColors,
  analyzeEmotion,
  saveEmotionRecord,
  getEmotionHistory,
  matchRoleByEmotion,
  checkEmotionChangeAndSuggestRoleSwitch,
  formatChatHistoryForAnalysis,
  // 情绪波动指数相关函数
  calculateEmotionalVolatility,
  getVolatilityLevel,
  analyzeVolatilityReason,
  getEmotionalVolatilityData,
  // 关键词情感相关函数
  getKeywordEmotionStats,
  linkKeywordsToEmotion,
  // 缓存相关函数
  getLatestEmotionAnalysis
};

// 导出服务对象
module.exports = emotionService;


