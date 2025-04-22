/**
 * 用户统计工具类
 */
const auth = require('./auth');

/**
 * 更新用户统计数据
 * @param {string} statsType 统计类型: chatCount, solvedCount, rating, activeDay
 * @param {number} value 统计值
 * @returns {Promise<object>} 更新结果
 */
const updateUserStats = async (statsType, value = 1) => {
  try {
    // 获取用户信息
    const { userInfo } = auth.getLoginInfo()
    if (!userInfo || !userInfo.userId) {
      console.error('用户未登录或登录信息不完整')
      return { success: false, error: '用户未登录' }
    }

    // 调用云函数更新统计
    const result = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'updateStats',
        userId: userInfo.userId,
        statsType,
        value
      }
    })

    console.log('更新用户统计结果:', result)
    return result.result
  } catch (error) {
    console.error('更新用户统计失败:', error)
    return { success: false, error }
  }
}

/**
 * 更新对话次数
 * @param {number} count 增加的次数，默认为1
 */
const updateChatCount = (count = 1) => {
  return updateUserStats('chatCount', count)
}

/**
 * 更新已解决问题数
 * @param {number} count 增加的次数，默认为1
 */
const updateSolvedCount = (count = 1) => {
  return updateUserStats('solvedCount', count)
}

/**
 * 更新用户评分
 * @param {number} rating 评分，1-5
 */
const updateRating = (rating = 5) => {
  return updateUserStats('rating', rating)
}

/**
 * 更新活跃天数
 */
const updateActiveDay = () => {
  return updateUserStats('activeDay')
}

// 导出模块
module.exports = {
  updateUserStats,
  updateChatCount,
  updateSolvedCount,
  updateRating,
  updateActiveDay
}
