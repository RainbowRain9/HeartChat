import { IRole } from './role';

/**
 * 消息类型
 */
export type MessageType = 'text';

/**
 * 发送者类型
 */
export type SenderType = 'user' | 'other';

/**
 * 情绪类型
 */
export type EmotionType = 'happy' | 'sad' | 'angry' | 'neutral' | 'anxious' | 'excited';

/**
 * 对话语气
 */
export type ToneType = 'formal' | 'casual' | 'friendly' | 'serious' | 'empathetic';

/**
 * 情绪状态
 */
export interface IEmotionState {
  // 主要情绪
  type: EmotionType;
  // 情绪强度 (0-1)
  intensity: number;
  // 情绪倾向 (-1到1，负面到正面)
  valence: number;
  // 激活度 (0-1，平静到激动)
  arousal: number;
}

/**
 * 回复建议
 */
export interface IReplyOption {
  // 建议内容
  content: string;
  // 情绪状态
  emotion: IEmotionState;
  // 建议说明
  explanation: string;
  // 语气类型
  tone: ToneType;
}

/**
 * 聊天消息
 */
export interface IMessage {
  // 消息ID
  id: string;
  // 消息类型
  type: MessageType;
  // 消息内容
  content: string;
  // 发送者类型
  sender: SenderType;
  // 发送时间
  timestamp: number;
  // 语音时长(秒)
  duration?: number;
  // 情绪状态
  emotion?: IEmotionState;
  // 回复建议
  replyOptions?: IReplyOption[];
}

/**
 * 对话会话
 */
export interface IConversation {
  // 会话ID
  id: string;
  // 关联角色
  role: IRole;
  // 消息列表
  messages: IMessage[];
  // 创建时间
  startTime: number;
  // 最后更新时间
  lastTime: number;
  // 会话标题
  title: string;
  // 会话标签
  tags: string[];
}

/**
 * 关键词
 */
export interface IKeyword {
  word: string;
  weight: number;
}

/**
 * 对话分析结果
 */
export interface IConversationAnalysis {
  // 情绪变化趋势
  emotionTrend: IEmotionState[];
  // 关键词列表
  keywords: IKeyword[];
  // 对话节奏
  communicationPace: number;
  // 建议策略
  suggestions: string[];
} 