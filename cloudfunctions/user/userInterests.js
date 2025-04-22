/**
 * 用户兴趣模块
 * 提供用户兴趣数据的存储和检索功能
 */

const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 获取数据库引用
const db = cloud.database();
const _ = db.command;

/**
 * 获取用户兴趣数据
 * @param {string} userId 用户ID
 * @returns {Promise<Object>} 用户兴趣数据
 */
async function getUserInterests(userId) {
  try {
    if (!userId) {
      throw new Error('用户ID不能为空');
    }

    console.log(`获取用户兴趣数据, 用户ID: ${userId}`);

    // 查询用户兴趣数据
    const result = await db.collection('userInterests')
      .where({ userId: userId })
      .get();

    console.log(`查询结果: ${result.data.length}条记录`);

    if (result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
      };
    } else {
      // 如果没有找到记录，创建一个空记录
      const newRecord = {
        userId: userId,
        keywords: [],
        categories: [],
        createTime: new Date(),
        lastUpdated: new Date()
      };

      // 插入新记录
      const addResult = await db.collection('userInterests').add({
        data: newRecord
      });

      console.log(`创建新记录成功, ID: ${addResult._id}`);

      return {
        success: true,
        data: {
          _id: addResult._id,
          ...newRecord
        }
      };
    }
  } catch (error) {
    console.error('获取用户兴趣数据失败:', error);
    return {
      success: false,
      error: error.message || '获取用户兴趣数据失败'
    };
  }
}

/**
 * 更新用户兴趣关键词
 * @param {string} userId 用户ID
 * @param {string} keyword 关键词
 * @param {number} weightDelta 权重变化值
 * @param {boolean} autoClassify 是否自动分类关键词
 * @returns {Promise<Object>} 更新结果
 */
async function updateUserInterest(userId, keyword, weightDelta = 0.1, autoClassify = true) {
  try {
    if (!userId || !keyword) {
      throw new Error('用户ID和关键词不能为空');
    }

    console.log(`更新用户兴趣关键词, 用户ID: ${userId}, 关键词: ${keyword}, 权重变化: ${weightDelta}`);

    // 查询用户兴趣数据
    const result = await db.collection('userInterests')
      .where({ userId: userId })
      .get();

    if (result.data && result.data.length > 0) {
      const record = result.data[0];
      const keywords = record.keywords || [];

      // 查找关键词
      const keywordIndex = keywords.findIndex(k => k.word === keyword);

      if (keywordIndex >= 0) {
        // 关键词存在，更新权重
        const newWeight = Math.min(Math.max(keywords[keywordIndex].weight + weightDelta, 0.1), 2.0);

        // 更新数据库
        await db.collection('userInterests').doc(record._id).update({
          data: {
            [`keywords.${keywordIndex}.weight`]: newWeight,
            [`keywords.${keywordIndex}.lastUpdated`]: new Date(),
            [`keywords.${keywordIndex}.occurrences`]: (keywords[keywordIndex].occurrences || 0) + 1,
            lastUpdated: new Date()
          }
        });

        console.log(`更新关键词权重成功, 新权重: ${newWeight}`);
      } else {
        // 关键词不存在，添加新关键词
        // 如果需要自动分类，先获取分类
        let category = '未分类';
        if (autoClassify) {
          try {
            category = await autoClassifyKeyword(keyword);
          } catch (classifyError) {
            console.error(`关键词 "${keyword}" 自动分类失败:`, classifyError);
            // 分类失败不影响主流程
          }
        }

        await db.collection('userInterests').doc(record._id).update({
          data: {
            keywords: _.push({
              word: keyword,
              weight: Math.max(1.0 + weightDelta, 0.1),
              category: category,
              source: 'chat',
              emotionScore: 0,
              firstSeen: new Date(),
              lastUpdated: new Date(),
              occurrences: 1
            }),
            lastUpdated: new Date()
          }
        });

        console.log(`添加新关键词成功: ${keyword}, 分类: ${category}`);
      }

      return {
        success: true,
        message: '更新用户兴趣关键词成功'
      };
    } else {
      // 如果没有找到记录，创建一个新记录
      // 如果需要自动分类，先获取分类
      let category = '未分类';
      if (autoClassify) {
        try {
          category = await autoClassifyKeyword(keyword);
        } catch (classifyError) {
          console.error(`关键词 "${keyword}" 自动分类失败:`, classifyError);
          // 分类失败不影响主流程
        }
      }

      const newRecord = {
        userId: userId,
        keywords: [{
          word: keyword,
          weight: Math.max(1.0 + weightDelta, 0.1),
          category: category,
          source: 'chat',
          emotionScore: 0,
          firstSeen: new Date(),
          lastUpdated: new Date(),
          occurrences: 1
        }],
        createTime: new Date(),
        lastUpdated: new Date()
      };

      // 插入新记录
      await db.collection('userInterests').add({
        data: newRecord
      });

      console.log(`创建新记录并添加关键词成功: ${keyword}, 分类: ${category}`);

      return {
        success: true,
        message: '创建用户兴趣记录并添加关键词成功'
      };
    }
  } catch (error) {
    console.error('更新用户兴趣关键词失败:', error);
    return {
      success: false,
      error: error.message || '更新用户兴趣关键词失败'
    };
  }
}

/**
 * 自动分类关键词
 * @param {string} word 关键词
 * @returns {Promise<string>} 分类结果
 */
async function autoClassifyKeyword(word) {
  try {
    // 调用分析云函数分类关键词
    const result = await cloud.callFunction({
      name: 'analysis',
      data: {
        type: 'classify_keywords',
        keywords: word,
        batch: false
      }
    });

    if (result.result && result.result.success && result.result.data && result.result.data.category) {
      return result.result.data.category;
    } else {
      console.warn(`关键词 "${word}" 自动分类失败，使用默认分类`);
      return '未分类';
    }
  } catch (error) {
    console.error(`关键词 "${word}" 自动分类异常:`, error);
    return '未分类';
  }
}

/**
 * 批量更新用户兴趣关键词
 * @param {string} userId 用户ID
 * @param {Array} keywords 关键词数组，每个元素包含word和weight字段
 * @param {boolean} autoClassify 是否自动分类关键词
 * @param {Object} categoryStats 分类统计数据，可选
 * @param {Array} categoriesArray 分类数组，可选
 * @returns {Promise<Object>} 更新结果
 */
async function batchUpdateUserInterests(userId, keywords, autoClassify = true, categoryStats = null, categoriesArray = null) {
  try {
    if (!userId || !Array.isArray(keywords) || keywords.length === 0) {
      throw new Error('用户ID和关键词数组不能为空');
    }

    console.log(`批量更新用户兴趣关键词, 用户ID: ${userId}, 关键词数量: ${keywords.length}`);

    // 如果提供了分类统计数据，输出日志
    if (categoryStats) {
      console.log('分类统计数据:', categoryStats);
    }

    // 查询用户兴趣数据
    const result = await db.collection('userInterests')
      .where({ userId: userId })
      .get();

    let recordId;
    let existingKeywords = [];
    let existingCategories = {};

    if (result.data && result.data.length > 0) {
      recordId = result.data[0]._id;
      existingKeywords = result.data[0].keywords || [];
      existingCategories = result.data[0].categories || [];

      // 如果 categories 是对象而不是数组，将其转换为数组
      if (existingCategories && !Array.isArray(existingCategories)) {
        console.log('将 categories 对象转换为数组');
        const categoriesArray = [];
        for (const [name, count] of Object.entries(existingCategories)) {
          categoriesArray.push({
            name: name,
            count: count,
            firstSeen: new Date(),
            lastUpdated: new Date()
          });
        }
        existingCategories = categoriesArray;
      }
    } else {
      // 如果没有找到记录，创建一个新记录
      const newRecord = {
        userId: userId,
        keywords: [],
        categories: [],
        createTime: new Date(),
        lastUpdated: new Date()
      };

      // 插入新记录
      const addResult = await db.collection('userInterests').add({
        data: newRecord
      });

      recordId = addResult._id;
      console.log(`创建新记录成功, ID: ${recordId}`);
    }

    // 如果需要自动分类，先收集所有新关键词
    const newKeywords = [];
    for (const keyword of keywords) {
      if (!keyword.word) continue;

      // 检查关键词是否已存在
      const existingKeyword = existingKeywords.find(k => k.word === keyword.word);
      if (!existingKeyword) {
        newKeywords.push(keyword.word);
      }
    }

    // 如果有新关键词且需要自动分类，批量分类
    let categoryMap = {};
    if (autoClassify && newKeywords.length > 0) {
      try {
        // 调用分析云函数批量分类关键词
        const classifyResult = await cloud.callFunction({
          name: 'analysis',
          data: {
            type: 'classify_keywords',
            keywords: newKeywords,
            batch: true
          }
        });

        if (classifyResult.result && classifyResult.result.success &&
            classifyResult.result.data && Array.isArray(classifyResult.result.data.classifications)) {
          // 将分类结果转换为映射
          classifyResult.result.data.classifications.forEach(item => {
            categoryMap[item.keyword] = item.category;
          });
          console.log('批量分类关键词成功:', categoryMap);
        }
      } catch (classifyError) {
        console.error('批量分类关键词失败:', classifyError);
        // 分类失败不影响主流程
      }
    }

    // 处理每个关键词
    for (const keyword of keywords) {
      if (!keyword.word) continue;

      const word = keyword.word;
      const weight = keyword.weight || 1.0;

      // 查找关键词
      const keywordIndex = existingKeywords.findIndex(k => k.word === word);

      if (keywordIndex >= 0) {
        // 关键词存在，更新权重
        const currentWeight = existingKeywords[keywordIndex].weight || 1.0;
        const newWeight = Math.min(Math.max(currentWeight + (weight - 1.0) * 0.2, 0.1), 2.0);

        // 更新数据库
        await db.collection('userInterests').doc(recordId).update({
          data: {
            [`keywords.${keywordIndex}.weight`]: newWeight,
            [`keywords.${keywordIndex}.lastUpdated`]: new Date(),
            [`keywords.${keywordIndex}.occurrences`]: (existingKeywords[keywordIndex].occurrences || 0) + 1,
            lastUpdated: new Date()
          }
        });

        console.log(`更新关键词权重成功, 关键词: ${word}, 新权重: ${newWeight}`);
      } else {
        // 关键词不存在，添加新关键词
        // 获取分类
        const category = categoryMap[word] || '未分类';

        await db.collection('userInterests').doc(recordId).update({
          data: {
            keywords: _.push({
              word: word,
              weight: weight,
              category: category,
              source: 'chat',
              emotionScore: 0,
              firstSeen: new Date(),
              lastUpdated: new Date(),
              occurrences: 1
            }),
            lastUpdated: new Date()
          }
        });

        console.log(`添加新关键词成功: ${word}, 分类: ${category}`);

        // 更新本地缓存的关键词列表
        existingKeywords.push({
          word: word,
          weight: weight,
          category: category,
          source: 'chat',
          emotionScore: 0,
          firstSeen: new Date(),
          lastUpdated: new Date(),
          occurrences: 1
        });
      }
    }

    // 更新分类数组
    let updatedCategoriesArray = [];

    // 如果提供了分类数组，优先使用它
    if (categoriesArray && Array.isArray(categoriesArray)) {
      console.log('使用提供的分类数组:', categoriesArray);

      // 合并现有分类和新分类
      updatedCategoriesArray = [...categoriesArray];

      // 如果现有分类存在，合并它们
      if (existingCategories && Array.isArray(existingCategories)) {
        for (const existingCat of existingCategories) {
          const newCat = updatedCategoriesArray.find(cat => cat.name === existingCat.name);

          if (newCat) {
            // 如果分类已存在于新数组中，更新计数
            newCat.count = (newCat.count || 0) + (existingCat.count || 0);
            newCat.firstSeen = existingCat.firstSeen || new Date();
            newCat.lastUpdated = new Date();
          } else {
            // 如果分类不存在于新数组中，添加它
            updatedCategoriesArray.push(existingCat);
          }
        }
      }
    }
    // 如果提供了分类统计，使用它来生成分类数组
    else if (categoryStats) {
      console.log('使用分类统计生成分类数组:', categoryStats);

      // 遍历分类统计，创建分类数组
      for (const [categoryName, count] of Object.entries(categoryStats)) {
        // 检查分类是否已存在
        const existingCategory = existingCategories && Array.isArray(existingCategories) ?
          existingCategories.find(cat => cat.name === categoryName) : null;

        if (existingCategory) {
          // 如果分类已存在，更新计数
          existingCategory.count = (existingCategory.count || 0) + count;
          existingCategory.lastUpdated = new Date();
          updatedCategoriesArray.push(existingCategory);
        } else {
          // 如果分类不存在，创建新分类
          updatedCategoriesArray.push({
            name: categoryName,
            count: count,
            firstSeen: new Date(),
            lastUpdated: new Date()
          });
        }
      }

      // 添加现有分类中不在新分类统计中的分类
      if (existingCategories && Array.isArray(existingCategories)) {
        for (const existingCat of existingCategories) {
          if (!updatedCategoriesArray.some(cat => cat.name === existingCat.name)) {
            updatedCategoriesArray.push(existingCat);
          }
        }
      }
    }
    // 如果既没有提供分类数组也没有提供分类统计，使用现有分类
    else if (existingCategories && Array.isArray(existingCategories)) {
      console.log('使用现有分类数组:', existingCategories);
      updatedCategoriesArray = [...existingCategories];
    }

    // 更新数据库中的分类数组
    await db.collection('userInterests').doc(recordId).update({
      data: {
        categories: updatedCategoriesArray,
        lastUpdated: new Date()
      }
    });

    console.log('更新分类数组成功:', updatedCategoriesArray);

    // 查询更新后的用户兴趣数据
    const updatedResult = await db.collection('userInterests')
      .where({ userId: userId })
      .get();

    return {
      success: true,
      message: '批量更新用户兴趣关键词成功',
      data: {
        userId: userId,
        recordId: recordId,
        updatedKeywords: keywords.map(k => k.word),
        categoryMap: categoryMap,
        currentData: updatedResult.data && updatedResult.data.length > 0 ? updatedResult.data[0] : null
      }
    };
  } catch (error) {
    console.error('批量更新用户兴趣关键词失败:', error);
    return {
      success: false,
      error: error.message || '批量更新用户兴趣关键词失败'
    };
  }
}

/**
 * 删除用户兴趣关键词
 * @param {string} userId 用户ID
 * @param {string} keyword 关键词
 * @returns {Promise<Object>} 删除结果
 */
async function deleteUserInterest(userId, keyword) {
  try {
    if (!userId || !keyword) {
      throw new Error('用户ID和关键词不能为空');
    }

    console.log(`删除用户兴趣关键词, 用户ID: ${userId}, 关键词: ${keyword}`);

    // 查询用户兴趣数据
    const result = await db.collection('userInterests')
      .where({ userId: userId })
      .get();

    if (result.data && result.data.length > 0) {
      const record = result.data[0];
      const keywords = record.keywords || [];

      // 查找关键词
      const keywordIndex = keywords.findIndex(k => k.word === keyword);

      if (keywordIndex >= 0) {
        // 关键词存在，删除关键词
        keywords.splice(keywordIndex, 1);

        // 更新数据库
        await db.collection('userInterests').doc(record._id).update({
          data: {
            keywords: keywords,
            lastUpdated: new Date()
          }
        });

        console.log(`删除关键词成功: ${keyword}`);

        return {
          success: true,
          message: '删除用户兴趣关键词成功'
        };
      } else {
        console.log(`关键词不存在: ${keyword}`);

        return {
          success: true,
          message: '关键词不存在'
        };
      }
    } else {
      console.log(`用户兴趣记录不存在, 用户ID: ${userId}`);

      return {
        success: true,
        message: '用户兴趣记录不存在'
      };
    }
  } catch (error) {
    console.error('删除用户兴趣关键词失败:', error);
    return {
      success: false,
      error: error.message || '删除用户兴趣关键词失败'
    };
  }
}

/**
 * 更新关键词分类
 * @param {string} userId 用户ID
 * @param {string} keyword 关键词
 * @param {string} category 分类
 * @returns {Promise<Object>} 更新结果
 */
async function updateKeywordCategory(userId, keyword, category) {
  try {
    if (!userId || !keyword || !category) {
      throw new Error('用户ID、关键词和分类不能为空');
    }

    console.log(`更新关键词分类, 用户ID: ${userId}, 关键词: ${keyword}, 分类: ${category}`);

    // 查询用户兴趣数据
    const result = await db.collection('userInterests')
      .where({ userId: userId })
      .get();

    if (result.data && result.data.length > 0) {
      const record = result.data[0];
      const keywords = record.keywords || [];

      // 查找关键词
      const keywordIndex = keywords.findIndex(k => k.word === keyword);

      if (keywordIndex >= 0) {
        // 关键词存在，更新分类
        await db.collection('userInterests').doc(record._id).update({
          data: {
            [`keywords.${keywordIndex}.category`]: category,
            [`keywords.${keywordIndex}.lastUpdated`]: new Date(),
            lastUpdated: new Date()
          }
        });

        console.log(`更新关键词分类成功, 关键词: ${keyword}, 分类: ${category}`);

        return {
          success: true,
          message: '更新关键词分类成功'
        };
      } else {
        console.log(`关键词不存在: ${keyword}`);

        return {
          success: false,
          error: '关键词不存在'
        };
      }
    } else {
      console.log(`用户兴趣记录不存在, 用户ID: ${userId}`);

      return {
        success: false,
        error: '用户兴趣记录不存在'
      };
    }
  } catch (error) {
    console.error('更新关键词分类失败:', error);
    return {
      success: false,
      error: error.message || '更新关键词分类失败'
    };
  }
}

/**
 * 批量更新关键词分类
 * @param {string} userId 用户ID
 * @param {Array} categorizations 分类数组，每个元素包含keyword和category字段
 * @returns {Promise<Object>} 更新结果
 */
async function batchUpdateKeywordCategories(userId, categorizations) {
  try {
    if (!userId || !Array.isArray(categorizations) || categorizations.length === 0) {
      throw new Error('用户ID和分类数组不能为空');
    }

    console.log(`批量更新关键词分类, 用户ID: ${userId}, 分类数量: ${categorizations.length}`);

    // 查询用户兴趣数据
    const result = await db.collection('userInterests')
      .where({ userId: userId })
      .get();

    if (result.data && result.data.length > 0) {
      const record = result.data[0];
      const keywords = record.keywords || [];
      let categories = record.categories || [];

      // 如果 categories 是对象而不是数组，将其转换为数组
      if (categories && !Array.isArray(categories)) {
        console.log('将 categories 对象转换为数组');
        const categoriesArray = [];
        for (const [name, count] of Object.entries(categories)) {
          categoriesArray.push({
            name: name,
            count: count,
            firstSeen: new Date(),
            lastUpdated: new Date()
          });
        }
        categories = categoriesArray;
      }

      // 创建分类统计对象
      const categoryStats = {};

      // 处理每个分类
      for (const item of categorizations) {
        if (!item.keyword || !item.category) continue;

        const keyword = item.keyword;
        const category = item.category;

        // 查找关键词
        const keywordIndex = keywords.findIndex(k => k.word === keyword);

        if (keywordIndex >= 0) {
          // 关键词存在，更新分类
          await db.collection('userInterests').doc(record._id).update({
            data: {
              [`keywords.${keywordIndex}.category`]: category,
              [`keywords.${keywordIndex}.lastUpdated`]: new Date(),
              lastUpdated: new Date()
            }
          });

          console.log(`更新关键词分类成功, 关键词: ${keyword}, 分类: ${category}`);

          // 更新分类统计
          categoryStats[category] = (categoryStats[category] || 0) + 1;
        }
      }

      // 更新分类数组
      for (const [categoryName, count] of Object.entries(categoryStats)) {
        // 查找分类是否已存在
        const existingCategoryIndex = categories.findIndex(cat => cat.name === categoryName);

        if (existingCategoryIndex >= 0) {
          // 如果分类已存在，更新计数
          categories[existingCategoryIndex].count = (categories[existingCategoryIndex].count || 0) + count;
          categories[existingCategoryIndex].lastUpdated = new Date();
        } else {
          // 如果分类不存在，创建新分类
          categories.push({
            name: categoryName,
            count: count,
            firstSeen: new Date(),
            lastUpdated: new Date()
          });
        }
      }

      // 更新分类数组
      await db.collection('userInterests').doc(record._id).update({
        data: {
          categories: categories,
          lastUpdated: new Date()
        }
      });

      console.log('更新分类数组成功:', categories);

      return {
        success: true,
        message: '批量更新关键词分类成功'
      };
    } else {
      console.log(`用户兴趣记录不存在, 用户ID: ${userId}`);

      return {
        success: false,
        error: '用户兴趣记录不存在'
      };
    }
  } catch (error) {
    console.error('批量更新关键词分类失败:', error);
    return {
      success: false,
      error: error.message || '批量更新关键词分类失败'
    };
  }
}

/**
 * 更新关键词情感分数
 * @param {string} userId 用户ID
 * @param {string} keyword 关键词
 * @param {number} emotionScore 情感分数
 * @returns {Promise<Object>} 更新结果
 */
async function updateKeywordEmotionScore(userId, keyword, emotionScore) {
  try {
    if (!userId || !keyword || typeof emotionScore !== 'number') {
      throw new Error('用户ID、关键词和情感分数不能为空');
    }

    console.log(`更新关键词情感分数, 用户ID: ${userId}, 关键词: ${keyword}, 情感分数: ${emotionScore}`);

    // 查询用户兴趣数据
    const result = await db.collection('userInterests')
      .where({ userId: userId })
      .get();

    if (result.data && result.data.length > 0) {
      const record = result.data[0];
      const keywords = record.keywords || [];

      // 查找关键词
      const keywordIndex = keywords.findIndex(k => k.word === keyword);

      if (keywordIndex >= 0) {
        // 关键词存在，更新情感分数
        const currentScore = keywords[keywordIndex].emotionScore || 0;
        const newScore = (currentScore * 0.7) + (emotionScore * 0.3); // 加权平均

        await db.collection('userInterests').doc(record._id).update({
          data: {
            [`keywords.${keywordIndex}.emotionScore`]: newScore,
            [`keywords.${keywordIndex}.lastUpdated`]: new Date(),
            lastUpdated: new Date()
          }
        });

        console.log(`更新关键词情感分数成功, 关键词: ${keyword}, 新分数: ${newScore}`);

        return {
          success: true,
          message: '更新关键词情感分数成功'
        };
      } else {
        console.log(`关键词不存在: ${keyword}`);

        return {
          success: false,
          error: '关键词不存在'
        };
      }
    } else {
      console.log(`用户兴趣记录不存在, 用户ID: ${userId}`);

      return {
        success: false,
        error: '用户兴趣记录不存在'
      };
    }
  } catch (error) {
    console.error('更新关键词情感分数失败:', error);
    return {
      success: false,
      error: error.message || '更新关键词情感分数失败'
    };
  }
}

// 导出模块
module.exports = {
  getUserInterests,
  updateUserInterest,
  batchUpdateUserInterests,
  deleteUserInterest,
  updateKeywordCategory,
  batchUpdateKeywordCategories,
  updateKeywordEmotionScore
};
