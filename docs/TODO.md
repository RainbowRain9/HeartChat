# HeartChat 项目待办事项

## 阶段一：基础框架与核心登录 (优先级: 高)

- [ ] 搭建项目基础结构，配置云开发环境
- [ ] 初始化 Git 仓库，配置项目目录
- [ ] 配置 app.json (页面, 窗口, TabBar, 分包)
- [ ] 实现 welcome 页面 UI 和登录逻辑 (调用 wx.getUserProfile, wx.login)
- [ ] 实现 login 云函数 (code2Session, 读写 users 数据库)
- [ ] 创建 users 数据库集合及权限配置
- [ ] 实现 home 页面基础 UI 和 TabBar 导航
- [ ] 封装 utils/auth.js 和 utils/api.js

## 阶段二：角色选择与 AI 对话基础 (优先级: 高)

- [ ] 创建 roles 数据库集合并预置数据
- [ ] 实现 role 云函数 (获取列表)
- [ ] 实现 role-select 页面 UI 和逻辑 (调用 role 云函数)
- [ ] 实现 role-card 组件
- [ ] 创建 chats 和 messages 数据库集合
- [ ] 实现 chat 页面 UI (含 scroll-view)
- [ ] 实现 chat-bubble 组件
- [ ] 实现 chat-input 组件
- [ ] 实现 chat 页面发送消息逻辑
- [ ] 实现 chat 云函数 (核心: 对接智谱 AI GLM-4, 保存消息)
- [ ] 实现 chat 页面接收和展示 AI 回复
- [ ] 实现 chat 云函数获取历史消息接口 (分页)
- [ ] 实现 chat 页面历史消息加载

## 阶段三：情绪感知与实时分析 (优先级: 中)

- [ ] 创建 emotion_records 数据库集合
- [ ] 修改 chat 云函数，集成情绪分析 (调用智谱 AI 时要求返回情绪)
- [ ] 保存情绪分析结果到 emotion_records
- [ ] 实现 emotion-analysis 页面基础 UI 和逻辑 (获取单次分析结果)
- [ ] 实现 emotion-card 组件基础
- [ ] 实现 emotion-chart 组件基础占位

## 阶段四：情绪历史与报告 (优先级: 中)

- [ ] 实现 emotion-history 页面 UI (含筛选器)
- [ ] 实现 emotion-history 页面逻辑 (调用云函数获取历史)
- [ ] 实现 daily-report 页面 UI
- [ ] 实现 daily-report 页面逻辑 (调用云函数获取报告)
- [ ] 完善 emotion-chart 组件 (集成图表库, 绘制线图/饼图)
- [ ] 扩展 analysis 云函数 (获取历史接口)
- [ ] 扩展 analysis 云函数 (生成报告接口，调用智谱 AI 总结)

## 阶段五：用户中心与设置 (优先级: 低)

- [ ] 创建/设计 user_stats 数据库集合/字段
- [ ] 实现 profile 页面 UI 和逻辑 (调用 user 云函数)
- [ ] 实现 settings 页面 UI 和逻辑
- [ ] 实现 user 云函数 (获取/更新信息, 获取/更新设置)
- [ ] 完善 user-avatar 组件

## 其他

- [ ] 编写单元测试
- [ ] 进行集成测试和 UI 测试
- [ ] 性能优化
- [ ] UI/UX 细节打磨
- [ ] 部署上线
