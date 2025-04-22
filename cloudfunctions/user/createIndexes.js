/**
 * 创建数据库索引
 * 用于提高查询性能
 */

const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 获取数据库引用
const db = cloud.database();

/**
 * 创建用户兴趣集合索引
 */
async function createUserInterestsIndexes() {
  try {
    console.log('开始创建 userInterests 集合索引...');
    
    // 创建 userId 索引
    await db.collection('userInterests').createIndex({
      userId: 1
    }, {
      name: 'userId_idx',
      unique: true
    });
    console.log('创建 userId 索引成功');
    
    // 创建 keywords.category 索引
    await db.collection('userInterests').createIndex({
      'keywords.category': 1,
      userId: 1
    }, {
      name: 'category_userId_idx'
    });
    console.log('创建 keywords.category 索引成功');
    
    // 创建 keywords.word 索引
    await db.collection('userInterests').createIndex({
      'keywords.word': 1,
      userId: 1
    }, {
      name: 'word_userId_idx'
    });
    console.log('创建 keywords.word 索引成功');
    
    // 创建 lastUpdated 索引
    await db.collection('userInterests').createIndex({
      lastUpdated: -1,
      userId: 1
    }, {
      name: 'lastUpdated_userId_idx'
    });
    console.log('创建 lastUpdated 索引成功');
    
    return {
      success: true,
      message: '创建 userInterests 集合索引成功'
    };
  } catch (error) {
    console.error('创建 userInterests 集合索引失败:', error);
    return {
      success: false,
      error: error.message || '创建索引失败'
    };
  }
}

/**
 * 创建角色集合索引
 */
async function createRolesIndexes() {
  try {
    console.log('开始创建 roles 集合索引...');
    
    // 创建 creator 索引
    await db.collection('roles').createIndex({
      creator: 1
    }, {
      name: 'creator_idx'
    });
    console.log('创建 creator 索引成功');
    
    // 创建 category 索引
    await db.collection('roles').createIndex({
      category: 1
    }, {
      name: 'category_idx'
    });
    console.log('创建 category 索引成功');
    
    // 创建 isSystem 索引
    await db.collection('roles').createIndex({
      isSystem: 1
    }, {
      name: 'isSystem_idx'
    });
    console.log('创建 isSystem 索引成功');
    
    // 创建组合索引：isSystem + category
    await db.collection('roles').createIndex({
      isSystem: 1,
      category: 1
    }, {
      name: 'isSystem_category_idx'
    });
    console.log('创建 isSystem_category 组合索引成功');
    
    // 创建组合索引：creator + category
    await db.collection('roles').createIndex({
      creator: 1,
      category: 1
    }, {
      name: 'creator_category_idx'
    });
    console.log('创建 creator_category 组合索引成功');
    
    return {
      success: true,
      message: '创建 roles 集合索引成功'
    };
  } catch (error) {
    console.error('创建 roles 集合索引失败:', error);
    return {
      success: false,
      error: error.message || '创建索引失败'
    };
  }
}

/**
 * 创建情感记录集合索引
 */
async function createEmotionRecordsIndexes() {
  try {
    console.log('开始创建 emotionRecords 集合索引...');
    
    // 创建 userId 索引
    await db.collection('emotionRecords').createIndex({
      userId: 1,
      timestamp: -1
    }, {
      name: 'userId_timestamp_idx'
    });
    console.log('创建 userId_timestamp 索引成功');
    
    // 创建 roleId 索引
    await db.collection('emotionRecords').createIndex({
      roleId: 1,
      userId: 1,
      timestamp: -1
    }, {
      name: 'roleId_userId_timestamp_idx'
    });
    console.log('创建 roleId_userId_timestamp 索引成功');
    
    // 创建 chatId 索引
    await db.collection('emotionRecords').createIndex({
      chatId: 1,
      timestamp: -1
    }, {
      name: 'chatId_timestamp_idx'
    });
    console.log('创建 chatId_timestamp 索引成功');
    
    // 创建 primary_emotion 索引
    await db.collection('emotionRecords').createIndex({
      primary_emotion: 1,
      userId: 1,
      timestamp: -1
    }, {
      name: 'emotion_userId_timestamp_idx'
    });
    console.log('创建 emotion_userId_timestamp 索引成功');
    
    return {
      success: true,
      message: '创建 emotionRecords 集合索引成功'
    };
  } catch (error) {
    console.error('创建 emotionRecords 集合索引失败:', error);
    return {
      success: false,
      error: error.message || '创建索引失败'
    };
  }
}

/**
 * 创建所有索引
 */
async function createAllIndexes() {
  try {
    const results = await Promise.all([
      createUserInterestsIndexes(),
      createRolesIndexes(),
      createEmotionRecordsIndexes()
    ]);
    
    console.log('所有索引创建结果:', results);
    
    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('创建索引失败:', error);
    return {
      success: false,
      error: error.message || '创建索引失败'
    };
  }
}

// 导出模块
module.exports = {
  createUserInterestsIndexes,
  createRolesIndexes,
  createEmotionRecordsIndexes,
  createAllIndexes
};
