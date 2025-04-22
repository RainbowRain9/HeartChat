/**
 * 关键词提取模块 - 使用HanLP API
 * 提供文本关键词提取功能
 */
const axios = require('axios');

// HanLP API配置
const HANLP_API_URL = 'https://hanlp.hankcs.com/api';
const HANLP_AUTH = 'ODI1N0BiYnMuaGFubHAuY29tOnRRYWRzVU9xQ3JYb2Jyc04='; // 已编码的auth信息

/**
 * 从文本中提取关键词
 * @param {string} text 待分析文本
 * @param {number} topK 返回关键词数量
 * @returns {Promise<Object>} 提取结果
 */
async function extractKeywords(text, topK = 10) {
  try {
    // 验证参数
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return {
        success: false,
        error: '无效的文本参数'
      };
    }

    // 调用HanLP API
    const response = await axios.post(`${HANLP_API_URL}/extractKeywords`, {
      text: text,
      topk: topK
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${HANLP_AUTH}`
      }
    });

    // 处理响应
    if (response.status === 200) {
      // 转换结果格式
      const keywords = Array.isArray(response.data) 
        ? response.data.map(item => ({
            word: item[0],
            weight: item[1]
          }))
        : [];

      return {
        success: true,
        data: {
          keywords: keywords
        }
      };
    } else {
      return {
        success: false,
        error: `API请求失败: ${response.status}`
      };
    }
  } catch (error) {
    console.error('关键词提取失败:', error);
    return {
      success: false,
      error: error.message || '关键词提取服务调用失败'
    };
  }
}

/**
 * 获取词向量
 * @param {Array<string>} words 词语列表
 * @returns {Promise<Object>} 词向量结果
 */
async function getWordVectors(words) {
  try {
    // 验证参数
    if (!Array.isArray(words) || words.length === 0) {
      return {
        success: false,
        error: '无效的词语列表参数'
      };
    }

    // 调用HanLP API
    const response = await axios.post(`${HANLP_API_URL}/embedWord`, {
      text: words
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${HANLP_AUTH}`
      }
    });

    // 处理响应
    if (response.status === 200) {
      return {
        success: true,
        data: {
          vectors: response.data
        }
      };
    } else {
      return {
        success: false,
        error: `API请求失败: ${response.status}`
      };
    }
  } catch (error) {
    console.error('获取词向量失败:', error);
    return {
      success: false,
      error: error.message || '词向量服务调用失败'
    };
  }
}

/**
 * 聚类分析
 * @param {string} text 待分析文本
 * @param {number} threshold 聚类阈值
 * @param {number} minClusterSize 最小簇大小
 * @returns {Promise<Object>} 聚类结果
 */
async function clusterKeywords(text, threshold = 0.7, minClusterSize = 2) {
  try {
    // 先提取关键词
    const keywordsResult = await extractKeywords(text, 20);
    if (!keywordsResult.success) {
      return keywordsResult;
    }

    const keywords = keywordsResult.data.keywords.map(item => item.word);
    
    // 如果关键词数量不足，无法聚类
    if (keywords.length < minClusterSize) {
      return {
        success: true,
        data: {
          clusters: []
        }
      };
    }

    // 获取词向量
    const vectorsResult = await getWordVectors(keywords);
    if (!vectorsResult.success) {
      return vectorsResult;
    }

    // 简单实现的聚类算法（实际项目中可能需要更复杂的算法）
    // 这里使用简化版的层次聚类
    const vectors = vectorsResult.data.vectors;
    const clusters = simpleClusterAlgorithm(keywords, vectors, threshold, minClusterSize);

    return {
      success: true,
      data: {
        clusters: clusters
      }
    };
  } catch (error) {
    console.error('聚类分析失败:', error);
    return {
      success: false,
      error: error.message || '聚类分析服务调用失败'
    };
  }
}

/**
 * 简单聚类算法
 * @param {Array<string>} keywords 关键词列表
 * @param {Array<Array<number>>} vectors 词向量列表
 * @param {number} threshold 聚类阈值
 * @param {number} minClusterSize 最小簇大小
 * @returns {Array<Object>} 聚类结果
 */
function simpleClusterAlgorithm(keywords, vectors, threshold, minClusterSize) {
  // 计算余弦相似度
  function cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    return dotProduct / (norm1 * norm2);
  }

  // 初始化每个词为一个簇
  let clusters = keywords.map((word, index) => ({
    keywords: [word],
    center: word,
    vector: vectors[index],
    size: 1
  }));

  // 合并簇
  let changed = true;
  while (changed && clusters.length > 1) {
    changed = false;
    
    // 找到最相似的两个簇
    let maxSim = -1;
    let maxI = -1;
    let maxJ = -1;
    
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const sim = cosineSimilarity(clusters[i].vector, clusters[j].vector);
        if (sim > maxSim && sim >= threshold) {
          maxSim = sim;
          maxI = i;
          maxJ = j;
        }
      }
    }
    
    // 如果找到了相似度高于阈值的簇，合并它们
    if (maxI !== -1 && maxJ !== -1) {
      const cluster1 = clusters[maxI];
      const cluster2 = clusters[maxJ];
      
      // 合并关键词
      const newKeywords = [...cluster1.keywords, ...cluster2.keywords];
      
      // 计算新的中心向量
      const newVector = cluster1.vector.map((val, idx) => 
        (val * cluster1.size + cluster2.vector[idx] * cluster2.size) / (cluster1.size + cluster2.size)
      );
      
      // 选择最接近中心向量的词作为中心词
      let centerIndex = 0;
      let maxCenterSim = -1;
      
      for (let i = 0; i < newKeywords.length; i++) {
        const wordIndex = keywords.indexOf(newKeywords[i]);
        const sim = cosineSimilarity(newVector, vectors[wordIndex]);
        if (sim > maxCenterSim) {
          maxCenterSim = sim;
          centerIndex = i;
        }
      }
      
      // 创建新簇
      const newCluster = {
        keywords: newKeywords,
        center: newKeywords[centerIndex],
        vector: newVector,
        size: cluster1.size + cluster2.size
      };
      
      // 更新簇列表
      clusters.splice(maxJ, 1);
      clusters[maxI] = newCluster;
      
      changed = true;
    }
  }
  
  // 过滤掉小于最小簇大小的簇
  return clusters
    .filter(cluster => cluster.size >= minClusterSize)
    .map(cluster => ({
      keywords: cluster.keywords,
      center: cluster.center,
      size: cluster.size
    }));
}

// 导出模块
module.exports = {
  extractKeywords,
  getWordVectors,
  clusterKeywords
};
