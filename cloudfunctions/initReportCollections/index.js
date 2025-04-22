// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  try {
    // 检查用户权限（可选，如果需要限制只有管理员可以初始化）
    // const { data: adminUser } = await db.collection('users').where({
    //   openid: OPENID,
    //   user_type: 3 // 管理员类型
    // }).get()
    
    // if (adminUser.length === 0) {
    //   return {
    //     success: false,
    //     error: '权限不足'
    //   }
    // }

    // 创建 userReports 集合
    try {
      await db.createCollection('userReports')
      console.log('创建 userReports 集合成功')
    } catch (error) {
      // 忽略"集合已存在"错误
      if (error.errCode !== -501001) {
        throw error
      }
      console.log('userReports 集合已存在')
    }

    // 创建 userInterests 集合
    try {
      await db.createCollection('userInterests')
      console.log('创建 userInterests 集合成功')
    } catch (error) {
      // 忽略"集合已存在"错误
      if (error.errCode !== -501001) {
        throw error
      }
      console.log('userInterests 集合已存在')
    }

    // 创建索引
    try {
      // userReports 索引
      await db.collection('userReports').createIndexes([
        {
          name: 'userId_date',
          unique: true,
          keys: {
            userId: 1,
            date: 1
          }
        },
        {
          name: 'userId_createTime',
          keys: {
            userId: 1,
            generatedAt: -1
          }
        }
      ])
      console.log('创建 userReports 索引成功')

      // userInterests 索引
      await db.collection('userInterests').createIndexes([
        {
          name: 'userId',
          unique: true,
          keys: {
            userId: 1
          }
        },
        {
          name: 'userId_lastUpdated',
          keys: {
            userId: 1,
            lastUpdated: -1
          }
        }
      ])
      console.log('创建 userInterests 索引成功')
    } catch (error) {
      console.error('创建索引失败:', error)
      // 索引创建失败不影响集合创建
    }

    return {
      success: true,
      message: '初始化报告相关集合成功'
    }
  } catch (error) {
    console.error('初始化报告相关集合失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
