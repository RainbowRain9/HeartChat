// 云函数入口文件
const cloud = require('wx-server-sdk')

// 使用明确的云环境ID
// 注意：请将下面的环境ID替换为您的实际环境ID
cloud.init({ env: 'cloud1-9gpfk3ie94d8630a' })

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取微信上下文
    const wxContext = cloud.getWXContext()
    console.log('微信上下文:', wxContext)

    // 获取参数
    const { userId, roleId, limit = 20 } = event
    console.log('云函数查询参数:', { userId, roleId, limit })

    // 检查参数
    if (!userId) {
      console.error('缺少必要参数: userId')
      return {
        success: false,
        error: '缺少必要参数: userId',
        openid: wxContext.OPENID,
      }
    }

    // 构建查询条件
    let whereStr = ''
    if (userId) {
      whereStr = `userId=="${userId}"`
    }
    if (roleId) {
      whereStr += whereStr ? ` && roleId=="${roleId}"` : `roleId=="${roleId}"`
    }

    console.log('字符串查询条件:', whereStr)

    // 尝试使用字符串查询
    try {
      // 查询记录
      const result = await db.collection('emotionRecords')
        .where(whereStr)
        .orderBy('createTime', 'desc')
        .limit(limit)
        .get()

      console.log('查询结果数量:', result.data.length)

      return {
        success: true,
        data: result.data,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      }
    } catch (queryError) {
      console.error('字符串查询失败:', queryError)

      // 尝试使用对象查询
      try {
        const query = {}
        if (userId) {
          query.userId = userId
        }
        if (roleId) {
          query.roleId = roleId
        }

        console.log('对象查询条件:', query)

        const result2 = await db.collection('emotionRecords')
          .where(query)
          .orderBy('createTime', 'desc')
          .limit(limit)
          .get()

        console.log('对象查询结果数量:', result2.data.length)

        return {
          success: true,
          data: result2.data,
          openid: wxContext.OPENID,
          appid: wxContext.APPID,
          unionid: wxContext.UNIONID,
        }
      } catch (objectQueryError) {
        console.error('对象查询失败:', objectQueryError)
        return {
          success: false,
          error: {
            stringQueryError: queryError.message || queryError.toString(),
            objectQueryError: objectQueryError.message || objectQueryError.toString()
          },
          openid: wxContext.OPENID,
          appid: wxContext.APPID,
          unionid: wxContext.UNIONID,
        }
      }
    }
  } catch (error) {
    console.error('云函数执行失败:', error)
    return {
      success: false,
      error: error.message || error.toString(),
      stack: error.stack
    }
  }
}
