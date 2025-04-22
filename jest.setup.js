// 模拟微信小程序环境
global.wx = {
  getSystemInfoSync: () => ({
    platform: 'devtools',
    model: 'iPhone X',
    system: 'iOS 14.0',
    version: '7.0.4',
    SDKVersion: '2.19.4',
    language: 'zh_CN',
    pixelRatio: 3,
    screenWidth: 375,
    screenHeight: 812,
    windowWidth: 375,
    windowHeight: 812,
    statusBarHeight: 44,
    safeArea: {
      bottom: 812,
      height: 768,
      left: 0,
      right: 375,
      top: 44,
      width: 375
    },
    platform: 'devtools'
  }),
  
  // 云开发相关
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  },

  // 界面交互
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showModal: jest.fn(),
  
  // 数据缓存
  setStorageSync: jest.fn(),
  getStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  clearStorageSync: jest.fn(),
  
  // 网络请求
  request: jest.fn(),
  uploadFile: jest.fn(),
  downloadFile: jest.fn(),
  
  // 路由
  navigateTo: jest.fn(),
  redirectTo: jest.fn(),
  switchTab: jest.fn(),
  navigateBack: jest.fn(),
  
  // 媒体
  chooseImage: jest.fn(),
  previewImage: jest.fn(),
  getRecorderManager: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    onStart: jest.fn(),
    onStop: jest.fn(),
    onError: jest.fn()
  })),
  
  // 位置
  getLocation: jest.fn(),
  chooseLocation: jest.fn(),
  
  // 设备
  getNetworkType: jest.fn(),
  onNetworkStatusChange: jest.fn(),
  
  // 界面
  createSelectorQuery: jest.fn(() => ({
    select: jest.fn(() => ({
      boundingClientRect: jest.fn(),
      exec: jest.fn()
    }))
  })),
  
  // 更新
  getUpdateManager: jest.fn(() => ({
    onCheckForUpdate: jest.fn(),
    onUpdateReady: jest.fn(),
    onUpdateFailed: jest.fn(),
    applyUpdate: jest.fn()
  }))
};

// 模拟getCurrentPages
global.getCurrentPages = jest.fn(() => []);

// 模拟getApp
global.getApp = jest.fn(() => ({
  globalData: {
    userInfo: null,
    hasUserInfo: false,
    canIUse: true
  }
}));

// 模拟Page构造器
global.Page = jest.fn();

// 模拟Component构造器
global.Component = jest.fn();

// 模拟App构造器
global.App = jest.fn();

// 模拟Behavior构造器
global.Behavior = jest.fn();

// 添加自定义的matchers
expect.extend({
  // 示例: 添加一个自定义的matcher
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
}); 