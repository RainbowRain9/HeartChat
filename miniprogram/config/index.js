/**
 * 全局配置文件
 * 用于存储应用中的各种配置项，避免硬编码
 */

// 云环境配置
const cloudConfig = {
  // 云环境ID
  ENV_ID: 'cloud1-9gpfk3ie94d8630a',
  // 云函数超时时间（毫秒）
  TIMEOUT: 30000,
  // 云函数重试次数
  MAX_RETRY: 3
};

// 用户配置
const userConfig = {
  // 默认头像URL
  DEFAULT_AVATAR: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
  // 默认用户名
  DEFAULT_USERNAME: '游客',
  // 默认情绪概览数据
  DEFAULT_EMOTION_DATA: {
    labels: ['疲惫', '压力', '担忧', '焦虑', '平静', '满足', '快乐'],
    values: [25, 20, 15, 10, 15, 10, 5],
    colors: [
      '#ffc107', // 疲惫
      '#f56565', // 压力
      '#4299e1', // 担忧
      '#ed64a6', // 焦虑
      '#48bb78', // 平静
      '#9f7aea', // 满足
      '#38b2ac'  // 快乐
    ],
    mainEmotion: '疲惫',
    secondEmotion: '压力'
  },
  // 默认个性分析数据
  DEFAULT_PERSONALITY_DATA: {
    labels: ['责任感', '完美主义', '同理心', '创造力', '社交性', '冒险精神', '耐心'],
    values: [85, 80, 70, 65, 50, 40, 60],
    summary: '根据你的对话内容和情绪反应，我们分析出你是一个责任感强、追求完美的人，同时也具有同理心和创造力。'
  },
  // 默认个性特质
  DEFAULT_PERSONALITY_TRAITS: [
    { name: '开朗', score: 85 },
    { name: '理性', score: 70 },
    { name: '创造力', score: 65 },
    { name: '耐心', score: 75 },
    { name: '好奇心', score: 90 }
  ],
  // 默认个性摘要
  DEFAULT_PERSONALITY_SUMMARY: '您的性格特点是开朗、乐观，善于与人沟通。在面对挑战时，您表现出较强的适应能力和解决问题的能力。您对新事物充满好奇心，喜欢探索和学习。',
  // 默认兴趣标签
  DEFAULT_INTEREST_TAGS: ['旅行', '摄影', '美食', '电影', '音乐', '阅读', '科技']
};

// 角色配置
const roleConfig = {
  // 角色分类 - 用于角色选择页面
  CATEGORIES: [
    { id: 'all', name: '全部' },
    { id: 'family', name: '家庭' },
    { id: 'friend', name: '朋友' },
    { id: 'work', name: '工作' },
    { id: 'love', name: '恋爱' },
    { id: 'other', name: '其他' }
  ],
  // 角色分类 - 用于角色编辑页面
  ROLE_CATEGORIES: [
    { id: 'emotion', name: '情感支持' },
    { id: 'psychology', name: '心理咨询' },
    { id: 'life', name: '生活伙伴' },
    { id: 'career', name: '职场导师' },
    { id: 'other', name: '其他' }
  ],
  // 关系选项
  RELATIONSHIPS: [
    { id: 'parent', name: '父母', category: 'family' },
    { id: 'child', name: '子女', category: 'family' },
    { id: 'sibling', name: '兄弟姐妹', category: 'family' },
    { id: 'friend', name: '朋友', category: 'friend' },
    { id: 'colleague', name: '同事', category: 'work' },
    { id: 'boss', name: '上司', category: 'work' },
    { id: 'subordinate', name: '下属', category: 'work' },
    { id: 'lover', name: '恋人', category: 'love' },
    { id: 'ex', name: '前任', category: 'love' },
    { id: 'other', name: '其他', category: 'other' }
  ],
  // 关系选项列表 - 用于角色编辑页面
  RELATIONSHIP_OPTIONS: [
    '父母', '子女', '兄弟姐妹', '朋友', '恋人', '配偶',
    '上级', '下级', '同事', '客户', '合作伙伴', '老师',
    '学生', '医生', '病人', '其他'
  ],
  // 关系与分类的映射 - 用于角色编辑页面
  RELATIONSHIP_TO_CATEGORY_MAP: {
    '父母': 'life',
    '子女': 'life',
    '兄弟姐妹': 'life',
    '朋友': 'life',
    '恋人': 'emotion',
    '配偶': 'emotion',
    '上级': 'career',
    '下级': 'career',
    '同事': 'career',
    '客户': 'career',
    '合作伙伴': 'career',
    '老师': 'psychology',
    '学生': 'psychology',
    '医生': 'psychology',
    '病人': 'psychology',
    '其他': 'other'
  },
  // 默认角色头像
  DEFAULT_ROLE_AVATAR: '/images/avatars/default-avatar.png'
};

// 主题配置
const themeConfig = {
  // TabBar页面列表
  TAB_BAR_PAGES: [
    'pages/home/home',
    'pages/role-select/role-select',
    'pages/user/user'
  ],
  // 情绪颜色映射
  EMOTION_COLORS: {
    // 亮色模式
    light: {
      'happy': '#4CAF50',
      'sad': '#2196F3',
      'angry': '#F44336',
      'fear': '#9C27B0',
      'surprise': '#FF9800',
      'disgust': '#795548',
      'neutral': '#607D8B'
    },
    // 暗色模式
    dark: {
      'happy': '#81C784',
      'sad': '#64B5F6',
      'angry': '#E57373',
      'fear': '#BA68C8',
      'surprise': '#FFB74D',
      'disgust': '#A1887F',
      'neutral': '#90A4AE'
    }
  }
};

// 导出配置
export default {
  cloud: cloudConfig,
  user: userConfig,
  role: roleConfig,
  theme: themeConfig
};

// 为了兼容CommonJS模块系统
module.exports = {
  cloud: cloudConfig,
  user: userConfig,
  role: roleConfig,
  theme: themeConfig
};
