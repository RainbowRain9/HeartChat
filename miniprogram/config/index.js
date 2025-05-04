/**
 * 全局配置文件
 * 用于存储应用中的各种配置项，避免硬编码
 */

// 云环境配置
const cloudConfig = {
  // 云环境ID
  ENV_ID: 'rainbowrain-2gt3j8hda726e4fe',
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
  DEFAULT_USERNAME: '游客'
};

// 角色配置
const roleConfig = {
  // 角色分类
  CATEGORIES: [
    { id: 'all', name: '全部' },
    { id: 'family', name: '家庭' },
    { id: 'friend', name: '朋友' },
    { id: 'work', name: '工作' },
    { id: 'love', name: '恋爱' },
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
