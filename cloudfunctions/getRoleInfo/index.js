// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云环境
cloud.init({ env: 'cloud1-9gpfk3ie94d8630a' }) // 使用您的实际环境ID

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { roleId } = event
  
  if (!roleId) {
    return {
      success: false,
      error: '缺少必要参数: roleId',
      openid: wxContext.OPENID,
    }
  }
  
  try {
    // 查询角色信息
    const result = await db.collection('roles')
      .where({
        _id: roleId
      })
      .get()
    
    if (result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0],
        openid: wxContext.OPENID,
      }
    } else {
      return {
        success: false,
        error: '未找到角色信息',
        openid: wxContext.OPENID,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || error.toString(),
      openid: wxContext.OPENID,
    }
  }
}
