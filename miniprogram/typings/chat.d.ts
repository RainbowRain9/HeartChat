// 消息类型
interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  emotion?: string;
  emotionType?: string;
  suggestion?: string;
  createTime: Date;
  showTimeFlag?: boolean;
}

// 云函数返回结果
interface ChatResult {
  success: boolean;
  error?: string;
  _id?: string;
  reply?: string;
  emotion?: string;
  suggestion?: string;
  content?: string;
}

// 页面数据
interface ChatPageData {
  messageList: ChatMessage[];
  inputMessage: string;
  scrollToMessage: string;
  sending: boolean;
  loading: boolean;
  hasMore: boolean;
  pageSize: number;
  isVoiceMode: boolean;
  recording: boolean;
  showEmojiPanel: boolean;
  showFeaturePanel: boolean;
}

// 页面实例
interface ChatPageInstance {
  data: ChatPageData;
  initChat: (data: { type?: string; scenario?: string }) => void;
  sendGuideMessage: (type?: string, scenario?: string) => Promise<void>;
  loadHistoryMessages: () => Promise<void>;
  shouldShowTime: (time: Date) => boolean;
  onInputChange: (e: WechatMiniprogram.Input) => void;
  onSend: () => Promise<void>;
  updateMessageList: (tempId: string, result: ChatResult) => void;
  getEmotionType: (emotion: string) => string;
  toggleVoiceInput: () => void;
  startVoiceRecord: (e: WechatMiniprogram.TouchEvent) => Promise<void>;
  endVoiceRecord: () => Promise<void>;
  moveVoiceRecord: (e: WechatMiniprogram.TouchEvent) => void;
  cancelVoiceRecord: () => void;
  showEmojiPanel: () => void;
  showFeaturePanel: () => void;
  onFeatureClick: (e: WechatMiniprogram.TouchEvent) => void;
  scrollToBottom: () => void;
  onScrollToUpper: () => void;
} 