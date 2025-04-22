module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配规则
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // 转换器配置
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // 模块文件扩展名
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],

  // 模块名称映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/miniprogram/$1'
  },

  // 覆盖率收集配置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'miniprogram/**/*.ts',
    '!miniprogram/**/*.d.ts',
    '!miniprogram/miniprogram_npm/**',
    '!miniprogram/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // 测试环境设置
  setupFiles: [
    '<rootDir>/jest.setup.js'
  ],

  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/miniprogram_npm/',
    '/dist/'
  ],

  // 每个测试文件运行前执行的代码
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],

  // 是否显示每个测试用例的执行结果
  verbose: true,

  // 测试超时时间
  testTimeout: 10000,

  // 是否在运行测试时显示每个测试用例的名称
  silent: false,

  // 是否启用监视模式
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],

  // 全局变量
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    },
    wx: {
      getSystemInfoSync: () => ({
        platform: 'devtools'
      }),
      cloud: {
        init: jest.fn(),
        callFunction: jest.fn()
      },
      showToast: jest.fn(),
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      showModal: jest.fn(),
      setStorageSync: jest.fn(),
      getStorageSync: jest.fn(),
      removeStorageSync: jest.fn(),
      clearStorageSync: jest.fn()
    },
    getCurrentPages: jest.fn(() => []),
    getApp: jest.fn(() => ({
      globalData: {}
    }))
  }
}; 