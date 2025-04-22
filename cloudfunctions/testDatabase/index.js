// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()

  try {
    // 测试数据库连接
    const testResults = {}

    // 测试集合访问
    const collectionsToTest = [
      'users',
      'roles',
      'chats',
      'messages',
      'emotionRecords',
      'roleUsage',
      'sys_config'
    ]

    // 测试每个集合
    for (const collection of collectionsToTest) {
      try {
        // 尝试获取文档数量
        const { total } = await db.collection(collection).count()
        testResults[collection] = {
          status: 'success',
          count: total
        }
      } catch (e) {
        testResults[collection] = {
          status: 'error',
          error: e.message || e
        }
      }
    }

    // 测试角色集合的读取
    try {
      const { data: roles } = await db.collection('roles').limit(1).get()
      testResults.rolesRead = {
        status: 'success',
        sample: roles
      }
    } catch (e) {
      testResults.rolesRead = {
        status: 'error',
        error: e.message || e
      }
    }

    // 测试服务器时间
    testResults.serverTime = db.serverDate()

    return {
      success: true,
      message: '数据库连接测试完成',
      results: testResults
    }
  } catch (error) {
    console.error('数据库测试失败:', error)
    return {
      success: false,
      error: error.message || error
    }
  }
}
