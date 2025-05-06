// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 是否为开发环境，控制日志输出
const isDev = false; // 设置为true可以开启详细日志

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取当前日期（前一天）
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    // 查询有情感记录的活跃用户
    const activeUsers = await db.collection('emotionRecords')
      .aggregate()
      .match({
        createTime: _.gte(yesterday)
      })
      .group({
        _id: '$userId',
        count: _.aggregate.count()
      })
      .match({
        count: _.gt(0) // 至少有一条情感记录
      })
      .limit(100) // 限制处理用户数量
      .end()

    if (isDev) {
      console.log(`找到 ${activeUsers.list.length} 个活跃用户`);
    }

    // 为每个用户生成报告
    const results = []
    for (const user of activeUsers.list) {
      try {
        // 调用analysis云函数生成报告
        const result = await cloud.callFunction({
          name: 'analysis',
          data: {
            type: 'daily_report',
            userId: user._id,
            date: yesterday
          }
        })

        results.push({
          userId: user._id,
          success: result.result.success,
          reportId: result.result.reportId
        })

        // 如果成功生成报告且用户开启了通知，发送订阅消息
        if (result.result.success && result.result.isNew) {
          try {
            // 查询用户通知设置
            const userInfo = await db.collection('users')
              .where({ _id: user._id })
              .field({ reportSettings: 1 })
              .get()

            if (userInfo.data.length > 0 &&
                userInfo.data[0].reportSettings &&
                userInfo.data[0].reportSettings.notificationEnabled) {
              // 发送订阅消息通知
              await sendReportNotification(user._id, result.result.reportId)
            }
          } catch (notifyError) {
            console.error(`发送通知失败 (userId: ${user._id}):`, notifyError.message || notifyError)
          }
        }
      } catch (error) {
        console.error(`为用户 ${user._id} 生成报告失败:`, error.message || error)
        results.push({
          userId: user._id,
          success: false,
          error: error.message || '生成报告失败'
        })
      }

      // 添加延迟，避免API调用过于频繁
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return {
      success: true,
      results: results,
      totalUsers: activeUsers.list.length,
      successCount: results.filter(r => r.success).length
    }
  } catch (error) {
    console.error('批量生成每日报告失败:', error.message || error)
    return {
      success: false,
      error: error.message || '批量生成每日报告失败'
    }
  }
}

/**
 * 发送报告通知
 * @param {string} userId 用户ID
 * @param {string} reportId 报告ID
 */
async function sendReportNotification(userId, reportId) {
  try {
    // 查询用户的订阅消息模板ID
    const { data: config } = await db.collection('sys_config')
      .where({ configKey: 'report_template_id' })
      .get()

    if (!config || config.length === 0) {
      if (isDev) {
        console.log('未找到订阅消息模板ID配置')
      }
      return
    }

    const templateId = config[0].configValue

    // 查询用户的openid
    const { data: user } = await db.collection('users')
      .where({ _id: userId })
      .field({ openid: 1 })
      .get()

    if (!user || user.length === 0 || !user[0].openid) {
      if (isDev) {
        console.log(`未找到用户 ${userId} 的openid`)
      }
      return
    }

    // 查询报告内容
    const { data: report } = await db.collection('userReports')
      .doc(reportId)
      .get()

    if (!report) {
      if (isDev) {
        console.log(`未找到报告 ${reportId}`)
      }
      return
    }

    // 发送订阅消息
    const result = await cloud.openapi.subscribeMessage.send({
      touser: user[0].openid,
      templateId: templateId,
      page: `pages/daily-report/daily-report?id=${reportId}`,
      data: {
        thing1: { value: '每日心情报告' },
        date2: { value: formatDate(report.date) },
        thing3: { value: truncate(report.emotionSummary, 20) },
        thing4: { value: report.primaryEmotion || '平静' },
        thing5: { value: '点击查看详情' }
      }
    })

    if (isDev) {
      console.log(`发送通知结果 (userId: ${userId}):`, result)
    }
    return result
  } catch (error) {
    console.error('发送报告通知失败:', error.message || error)
    // 不抛出异常，避免影响主流程
  }
}

/**
 * 格式化日期为YYYY-MM-DD
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 截断字符串
 * @param {string} str 原字符串
 * @param {number} length 最大长度
 * @returns {string} 截断后的字符串
 */
function truncate(str, length) {
  if (!str) return ''
  return str.length > length ? str.substring(0, length - 3) + '...' : str
}