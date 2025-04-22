// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command

  try {
    // 要清理的集合
    const collectionsToClean = event.collections || [
      'messages',
      'chats',
      'emotionRecords',
      'roleUsage'
    ]

    // 不清理的集合（保留系统数据）
    const preserveCollections = [
      'roles',
      'sys_config',
      'dict_type',
      'dict_data',
      'emotion_practices'
    ]

    // 如果指定了 force 参数，则清理所有集合
    if (event.force) {
      collectionsToClean.push(...preserveCollections)
    }

    // 清理集合
    const results = {}

    // 处理每个要清理的集合
    for (const name of collectionsToClean) {
      try {
        // 获取集合中的文档数量
        const { total } = await db.collection(name).count()

        if (total > 0) {
          // 删除集合中的所有文档
          const { stats } = await db.collection(name).where({
            _id: _.exists(true)
          }).remove()

          results[name] = {
            status: 'cleaned',
            total,
            deleted: stats.removed || 0
          }
        } else {
          results[name] = {
            status: 'empty',
            total: 0
          }
        }
      } catch (e) {
        results[name] = {
          status: 'error',
          error: e.message || e
        }
      }
    }

    // 标记保留的集合
    for (const name of preserveCollections) {
      if (!collectionsToClean.includes(name)) {
        results[name] = {
          status: 'preserved'
        }
      }
    }

    return {
      success: true,
      results
    }
  } catch (error) {
    console.error('清理数据库失败:', error)
    return {
      success: false,
      error: error.message || error
    }
  }
}
