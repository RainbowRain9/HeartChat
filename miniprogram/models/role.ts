/**
 * 角色关系类型
 */
export type RelationType = 
  | 'superior'    // 上级
  | 'subordinate' // 下级
  | 'colleague'   // 同事
  | 'friend'      // 朋友
  | 'family'      // 家人
  | 'lover'       // 恋人
  | 'other';      // 其他

/**
 * 性格特征
 */
export interface IPersonality {
  // 外向性 (0-1)
  extroversion: number;
  // 开放性 (0-1)
  openness: number;
  // 尽责性 (0-1)
  conscientiousness: number;
  // 宜人性 (0-1)
  agreeableness: number;
  // 神经质 (0-1)
  neuroticism: number;
}

/**
 * 沟通偏好
 */
export interface ICommunicationStyle {
  // 正式程度 (0-1)
  formality: number;
  // 直接程度 (0-1)
  directness: number;
  // 情感表达 (0-1)
  emotionalExpression: number;
  // 反馈频率 (0-1)
  feedbackFrequency: number;
}

/**
 * 角色信息
 */
export interface IRole {
  id: string;
  name: string;
  avatar: string;
  description: string;
  personality: string[];
  tags: string[];
  scenarios: string[];
}

/**
 * 默认角色列表
 */
export const DEFAULT_ROLES: IRole[] = [
  {
    id: 'friend',
    name: '知心朋友',
    avatar: '/assets/images/roles/friend.png',
    description: '一个善解人意的朋友,可以倾诉心事',
    personality: ['善解人意', '温暖', '真诚'],
    tags: ['朋友', '倾诉', '建议'],
    scenarios: ['日常交流', '情感困扰', '生活建议']
  },
  {
    id: 'mentor',
    name: '人生导师',
    avatar: '/assets/images/roles/mentor.png',
    description: '一个经验丰富的导师,给予人生指导',
    personality: ['睿智', '耐心', '严谨'],
    tags: ['指导', '建议', '规划'],
    scenarios: ['职业发展', '学习提升', '目标规划']
  }
]; 