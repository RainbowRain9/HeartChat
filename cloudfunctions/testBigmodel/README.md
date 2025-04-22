# 智谱AI (BigModel) 测试云函数

这个云函数用于测试智谱AI API的连接和功能，包括情感分析、关键词提取、文本向量化、关键词聚类和用户兴趣分析等功能。

## 文件结构

- `index.js`: 云函数入口文件，提供各种测试功能的接口
- `bigmodel.js`: 智谱AI模块，包含与智谱AI API交互的核心功能
- `test.js`: 详细的测试脚本，包含多种测试场景和数据
- `package.json`: 项目依赖配置文件

## 使用方法

### 部署云函数

1. 在微信开发者工具中，右键点击 `cloudfunctions/testBigmodel` 目录
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

### 配置环境变量

在云开发控制台中，为该云函数配置以下环境变量：

- `ZHIPU_API_KEY`: 智谱AI的API密钥

### 调用云函数

可以通过以下方式调用云函数进行测试：

```javascript
// 测试所有功能
wx.cloud.callFunction({
  name: 'testBigmodel',
  data: {
    test: 'all'  // 可选值: 'all', 'emotion', 'keywords', 'embeddings', 'clustering', 'interests'
  }
}).then(res => {
  console.log('测试结果:', res);
}).catch(err => {
  console.error('测试失败:', err);
});

// 测试特定功能，例如情感分析
wx.cloud.callFunction({
  name: 'testBigmodel',
  data: {
    test: 'emotion',
    text: '今天天气真好，我感到非常开心！'  // 自定义测试文本
  }
}).then(res => {
  console.log('情感分析测试结果:', res);
}).catch(err => {
  console.error('测试失败:', err);
});
```

## 测试参数说明

根据不同的测试类型，可以传入以下参数：

### 情感分析测试 (test: 'emotion')

- `text`: 要分析的文本内容

### 关键词提取测试 (test: 'keywords')

- `text`: 要提取关键词的文本内容
- `topK`: 要提取的关键词数量，默认为5

### 文本向量化测试 (test: 'embeddings')

- `texts`: 要向量化的文本数组

### 关键词聚类测试 (test: 'clustering')

- `text`: 要进行聚类分析的文本内容
- `threshold`: 聚类阈值，默认为0.7
- `minClusterSize`: 最小簇大小，默认为2

### 用户兴趣分析测试 (test: 'interests')

- `messages`: 用户历史消息数组

## 查看测试结果

测试结果会在云函数日志中详细显示，可以在云开发控制台的"云函数"页面中查看该云函数的运行日志。

## 注意事项

- 确保已正确配置智谱AI的API密钥
- 测试可能会消耗智谱AI的API调用配额
- 对于大量文本或频繁测试，请注意API调用频率限制
