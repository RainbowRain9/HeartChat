/**
 * 关键词分类器
 * 用于自动对关键词进行分类
 */

// 导入大模型调用模块
const bigmodel = require('./bigmodel');

// 预定义的分类
const PREDEFINED_CATEGORIES = [
  '学习', '工作', '娱乐', '社交', '健康', '生活', '科技', '艺术', '体育',
  '旅游', '美食', '时尚', '金融', '宠物', '家庭', '音乐', '电影', '阅读',
  '游戏', '心理', '自我提升', '时间管理', '压力缓解', '人际关系', '休闲活动',
  '其他'
];

// 细分类别映射
const SUBCATEGORIES = {
  '学习': ['考试', '课程', '学位', '研究', '论文', '知识', '学校', '教育', '学习方法', '学科'],
  '工作': ['职业', '事业', '工作压力', '职场', '同事', '上司', '晋升', '薪资', '求职', '面试'],
  '娱乐': ['休闲', '放松', '爱好', '兴趣', '消遣', '玩乐', '娱乐活动'],
  '社交': ['朋友', '社交圈', '人际交往', '社交活动', '聚会', '交友', '社交技巧'],
  '健康': ['身体健康', '心理健康', '锻炼', '饮食', '睡眠', '医疗', '疾病', '健康习惯'],
  '生活': ['日常生活', '生活方式', '生活质量', '居住', '家务', '购物', '消费'],
  '科技': ['技术', '数码', '互联网', '软件', '硬件', '人工智能', '编程', '科技产品'],
  '艺术': ['绘画', '音乐', '舞蹈', '文学', '电影', '摄影', '设计', '创作', '艺术欣赏'],
  '体育': ['运动', '健身', '比赛', '体育项目', '体育赛事', '团队运动', '个人运动'],
  '旅游': ['旅行', '出游', '景点', '度假', '探险', '文化体验', '旅游规划'],
  '美食': ['饮食', '烹饪', '餐厅', '美食探索', '食谱', '饮品', '烘焙'],
  '时尚': ['服装', '穿搭', '美容', '护肤', '化妆', '时尚潮流', '个人形象'],
  '金融': ['理财', '投资', '储蓄', '保险', '股票', '基金', '经济', '财务规划'],
  '宠物': ['宠物饲养', '宠物健康', '宠物行为', '宠物用品', '宠物训练'],
  '家庭': ['家人', '亲情', '婚姻', '恋爱', '子女', '家庭关系', '家庭教育'],
  '音乐': ['音乐欣赏', '乐器', '音乐创作', '音乐会', '音乐流派', '歌手', '乐队'],
  '电影': ['电影欣赏', '电影制作', '电影人物', '电影类型', '影评', '电视剧'],
  '阅读': ['书籍', '文学作品', '阅读习惯', '作家', '读书笔记', '阅读理解'],
  '游戏': ['电子游戏', '手机游戏', '游戏设备', '游戏策略', '游戏社区', '游戏开发'],
  '心理': ['心理健康', '情绪管理', '心理咨询', '心理疗法', '心理学', '自我认知'],
  '自我提升': ['个人成长', '自我发展', '技能提升', '目标设定', '习惯养成', '自律'],
  '时间管理': ['效率提升', '任务规划', '时间分配', '优先级设定', '拖延症克服'],
  '压力缓解': ['减压方法', '压力源识别', '放松技巧', '冥想', '压力管理'],
  '人际关系': ['人际交往', '沟通技巧', '冲突处理', '关系维护', '社交网络'],
  '休闲活动': ['户外活动', '室内活动', '休闲爱好', '放松方式', '娱乐方式']
};

// 分类提示词模板
const CLASSIFICATION_PROMPT = `
你是一个专业的关键词分类器。请将以下关键词分类到最合适的类别中。
可用的类别有：${PREDEFINED_CATEGORIES.join('、')}。

每个类别的说明：
- 学习：与学习、教育、知识获取、考试、学术研究相关的关键词
- 工作：与职业、事业、职场、工作环境、职业发展相关的关键词
- 娱乐：与休闲、放松、娱乐活动相关的关键词
- 社交：与人际交往、社交活动、交友相关的关键词
- 健康：与身体健康、医疗、疾病、健康生活相关的关键词
- 生活：与日常生活、生活方式、家庭生活相关的关键词
- 科技：与技术、数码、互联网、软硬件相关的关键词
- 艺术：与绘画、音乐、舞蹈、文学、创作相关的关键词
- 体育：与运动、健身、体育比赛相关的关键词
- 旅游：与旅行、出游、景点、度假相关的关键词
- 美食：与饮食、烹饪、餐厅、食物相关的关键词
- 时尚：与服装、穿搭、美容、化妆相关的关键词
- 金融：与理财、投资、储蓄、经济相关的关键词
- 宠物：与宠物饲养、宠物健康相关的关键词
- 家庭：与家人、亲情、婚姻、恋爱相关的关键词
- 音乐：与音乐欣赏、乐器、音乐创作相关的关键词
- 电影：与电影欣赏、电影制作相关的关键词
- 阅读：与书籍、文学作品、阅读习惯相关的关键词
- 游戏：与电子游戏、手机游戏相关的关键词
- 心理：与心理健康、情绪管理、心理咨询相关的关键词
- 自我提升：与个人成长、自我发展、技能提升相关的关键词
- 时间管理：与效率提升、任务规划、时间分配相关的关键词
- 压力缓解：与减压方法、压力源识别、放松技巧相关的关键词
- 人际关系：与人际交往、沟通技巧、冲突处理相关的关键词
- 休闲活动：与户外活动、室内活动、休闲爱好相关的关键词
- 其他：不属于以上任何类别的关键词

关键词列表：
{{keywords}}

请以JSON格式返回结果，格式如下：
{
  "classifications": [
    {"keyword": "关键词1", "category": "类别1"},
    {"keyword": "关键词2", "category": "类别2"},
    ...
  ]
}

只返回JSON格式的结果，不要有任何其他文字。
`;

/**
 * 批量分类关键词
 * @param {Array<string>} keywords 关键词数组
 * @returns {Promise<Array>} 分类结果数组，每个元素包含keyword和category字段
 */
async function batchClassifyKeywords(keywords) {
  try {
    if (!Array.isArray(keywords) || keywords.length === 0) {
      console.warn('关键词数组为空');
      return [];
    }

    // 去重
    const uniqueKeywords = [...new Set(keywords)];
    console.log(`准备分类 ${uniqueKeywords.length} 个关键词: ${JSON.stringify(uniqueKeywords)}`);

    // 构建提示词
    const prompt = CLASSIFICATION_PROMPT.replace('{{keywords}}', uniqueKeywords.join('、'));
    console.log('分类提示词:', prompt);

    // 当API_KEY为空时，使用预定义分类
    if (!process.env.ZHIPU_API_KEY) {
      console.warn('智谱AI API密钥未设置，使用预定义分类进行本地分类');

      // 使用细分类别映射进行本地分类
      const classifications = uniqueKeywords.map(keyword => {
        // 默认分类
        let category = '其他';

        // 遍历所有类别及其关键词
        for (const [cat, keywords] of Object.entries(SUBCATEGORIES)) {
          // 检查关键词是否包含在当前类别的关键词列表中
          if (keywords.some(k => keyword.includes(k))) {
            category = cat;
            break;
          }
        }

        // 如果上面的方法没有分类成功，使用更简单的规则
        if (category === '其他') {
          // 学习相关
          if (keyword.includes('学') || keyword.includes('考') || keyword.includes('课') ||
              keyword.includes('教') || keyword.includes('研') || keyword.includes('论文') ||
              keyword.includes('毕业') || keyword.includes('学位') || keyword.includes('博士') ||
              keyword.includes('知识') || keyword.includes('教育') || keyword.includes('学校')) {
            category = '学习';
          }
          // 工作相关
          else if (keyword.includes('工作') || keyword.includes('公司') || keyword.includes('职业') ||
                 keyword.includes('项目') || keyword.includes('业务') || keyword.includes('客户') ||
                 keyword.includes('设计') || keyword.includes('开发') || keyword.includes('测试') ||
                 keyword.includes('产品') || keyword.includes('市场') || keyword.includes('销售')) {
            category = '工作';
          }
          // 娱乐相关
          else if (keyword.includes('游戏') || keyword.includes('影视') || keyword.includes('电影') ||
                 keyword.includes('剧') || keyword.includes('音乐') || keyword.includes('娱乐') ||
                 keyword.includes('电视') || keyword.includes('综艺') || keyword.includes('节目')) {
            category = '娱乐';
          }
          // 社交相关
          else if (keyword.includes('朋友') || keyword.includes('社交') || keyword.includes('交流') ||
                 keyword.includes('关系') || keyword.includes('聊天') || keyword.includes('群聊') ||
                 keyword.includes('微信') || keyword.includes('聊天') || keyword.includes('消息')) {
            category = '社交';
          }
          // 健康相关
          else if (keyword.includes('健康') || keyword.includes('运动') || keyword.includes('销售') ||
                 keyword.includes('饮食') || keyword.includes('睡眠') || keyword.includes('医疗') ||
                 keyword.includes('疾病') || keyword.includes('药') || keyword.includes('身体')) {
            category = '健康';
          }
          // 生活相关
          else if (keyword.includes('生活') || keyword.includes('日常') || keyword.includes('家庭') ||
                 keyword.includes('家居') || keyword.includes('购物') || keyword.includes('旅行') ||
                 keyword.includes('美食') || keyword.includes('穿搭') || keyword.includes('装修')) {
            category = '生活';
          }
          // 心理相关
          else if (keyword.includes('心理') || keyword.includes('情绪') || keyword.includes('压力') ||
                 keyword.includes('焦虑') || keyword.includes('抑郁') || keyword.includes('焦虑') ||
                 keyword.includes('心情') || keyword.includes('心态') || keyword.includes('心理咨询')) {
            category = '心理';
          }
          // 自我提升相关
          else if (keyword.includes('提升') || keyword.includes('成长') || keyword.includes('发展') ||
                 keyword.includes('目标') || keyword.includes('规划') || keyword.includes('习惯') ||
                 keyword.includes('自律') || keyword.includes('自学') || keyword.includes('技能')) {
            category = '自我提升';
          }
          // 时间管理相关
          else if (keyword.includes('时间') || keyword.includes('管理') || keyword.includes('效率') ||
                 keyword.includes('安排') || keyword.includes('计划') || keyword.includes('日程') ||
                 keyword.includes('任务') || keyword.includes('优先级') || keyword.includes('拖延')) {
            category = '时间管理';
          }
          // 压力缓解相关
          else if (keyword.includes('减压') || keyword.includes('放松') || keyword.includes('缓解') ||
                 keyword.includes('冷静') || keyword.includes('平静') || keyword.includes('冥想') ||
                 keyword.includes('瑜伽') || keyword.includes('健身') || keyword.includes('按摩')) {
            category = '压力缓解';
          }
          // 人际关系相关
          else if (keyword.includes('人际') || keyword.includes('沟通') || keyword.includes('冲突') ||
                 keyword.includes('关系') || keyword.includes('相处') || keyword.includes('交往') ||
                 keyword.includes('信任') || keyword.includes('理解') || keyword.includes('合作')) {
            category = '人际关系';
          }
        }

        return {
          keyword: keyword,
          category: category
        };
      });

      console.log(`本地分类完成，分类结果: ${JSON.stringify(classifications)}`);
      return classifications;
    }

    // 调用大模型
    console.log('开始调用大模型进行分类...');
    const response = await bigmodel.chatCompletion({
      messages: [
        { role: 'system', content: '你是一个专业的关键词分类器，只返回JSON格式的结果。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2, // 低温度，提高确定性
      response_format: { type: 'json_object' } // 指定返回JSON格式
    });

    console.log('大模型返回原始响应:', JSON.stringify(response));

    // 解析结果
    if (response && response.choices && response.choices.length > 0) {
      const content = response.choices[0].message.content;
      console.log('大模型返回内容:', content);

      try {
        // 尝试解析JSON
        const result = JSON.parse(content);

        if (result && Array.isArray(result.classifications)) {
          console.log(`成功分类 ${result.classifications.length} 个关键词:`, JSON.stringify(result.classifications));
          return result.classifications;
        } else {
          console.error('分类结果格式错误:', result);
          return [];
        }
      } catch (parseError) {
        console.error('解析分类结果失败:', parseError);
        console.log('原始返回内容:', content);
        return [];
      }
    } else {
      console.error('大模型返回结果无效');
      return [];
    }
  } catch (error) {
    console.error('批量分类关键词失败:', error);
    return [];
  }
}

/**
 * 分类单个关键词
 * @param {string} keyword 关键词
 * @returns {Promise<string>} 分类结果
 */
async function classifyKeyword(keyword) {
  try {
    if (!keyword) {
      console.warn('关键词为空');
      return '其他';
    }

    // 调用批量分类函数
    const results = await batchClassifyKeywords([keyword]);

    if (results && results.length > 0) {
      return results[0].category;
    } else {
      console.warn(`关键词 "${keyword}" 分类失败，使用默认分类`);
      return '其他';
    }
  } catch (error) {
    console.error(`分类关键词 "${keyword}" 失败:`, error);
    return '其他';
  }
}

/**
 * 获取所有预定义分类
 * @returns {Array<string>} 分类数组
 */
function getPredefinedCategories() {
  return [...PREDEFINED_CATEGORIES];
}

// 导出模块
module.exports = {
  batchClassifyKeywords,
  classifyKeyword,
  getPredefinedCategories
};
