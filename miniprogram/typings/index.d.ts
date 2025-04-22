/// <reference path="./wx/index.d.ts" />

// 全局类型定义
declare namespace NodeJS {
  interface Global {
    wx: WechatMiniprogram.Wx;
    App: WechatMiniprogram.App.Constructor;
    Page: WechatMiniprogram.Page.Constructor;
    Component: WechatMiniprogram.Component.Constructor;
    Behavior: WechatMiniprogram.Behavior.Constructor;
    getApp: () => AppOption;
    getCurrentPages: () => WechatMiniprogram.Page.Instance<any>[];
  }
}

// App 实例的类型定义
interface AppOption {
  globalData: {
    userInfo: WechatMiniprogram.UserInfo | null;
    hasUserInfo: boolean;
    canIUse: boolean;
  };
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback;
}

// 页面 data 的类型定义
interface IPageData {
  userInfo: WechatMiniprogram.UserInfo;
  hasUserInfo: boolean;
  canIUse: boolean;
}

// 组件 data 的类型定义
interface IComponentData {
  [key: string]: any;
}

// 组件 properties 的类型定义
interface IComponentProps {
  [key: string]: WechatMiniprogram.Component.PropertyOption;
}

// 组件 methods 的类型定义
interface IComponentMethods {
  [key: string]: (...args: any[]) => any;
}

// 云函数返回结果的类型定义
interface CloudFunctionResult<T = any> {
  result: T;
  errMsg?: string;
  requestID?: string;
}

// 自定义事件的类型定义
interface CustomEvent extends WechatMiniprogram.BaseEvent {
  detail: any;
}

// 表情分析结果的类型定义
interface EmotionAnalysisResult {
  emotion: string;
  score: number;
  timestamp: number;
}

// 对话记录的类型定义
interface ChatRecord {
  id: string;
  content: string;
  type: 'text' | 'voice';
  timestamp: number;
  emotion?: EmotionAnalysisResult;
}

// 练习记录的类型定义
interface PracticeRecord {
  id: string;
  type: string;
  content: string;
  timestamp: number;
  duration?: number;
  score?: number;
}

// 用户配置的类型定义
interface UserConfig {
  theme: 'light' | 'dark';
  fontSize: number;
  language: 'zh_CN' | 'en_US';
  notificationEnabled: boolean;
}

// 全局状态的类型定义
interface GlobalState {
  isLoggedIn: boolean;
  currentUser: WechatMiniprogram.UserInfo | null;
  systemInfo: WechatMiniprogram.SystemInfo;
  config: UserConfig;
}

// 声明全局变量
declare const wx: WechatMiniprogram.Wx;
declare const App: WechatMiniprogram.App.Constructor;
declare const Page: WechatMiniprogram.Page.Constructor;
declare const Component: WechatMiniprogram.Component.Constructor;
declare const Behavior: WechatMiniprogram.Behavior.Constructor;
declare const getApp: () => AppOption;
declare const getCurrentPages: () => WechatMiniprogram.Page.Instance<any>[]; 