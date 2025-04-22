// 情绪练习的类型定义
interface EmotionPractice {
  id: string;
  title: string;
  description: string;
  steps: string[];
  tips?: string[];
  duration: number;
  completed?: boolean;
}

// 练习进度的类型定义
interface PracticeProgress {
  _id?: string;
  _openid?: string;
  completed: string[];
  createTime: Date;
  updateTime: Date;
}

// 页面数据的类型定义
interface PracticePageData {
  loading: boolean;
  practices: EmotionPractice[];
  currentPractice: EmotionPractice | null;
  progress: PracticeProgress;
  showDetail: boolean;
}

// 全局声明
declare namespace GlobalData {
  interface UserInfo {
    openid?: string;
    [key: string]: any;
  }
} 