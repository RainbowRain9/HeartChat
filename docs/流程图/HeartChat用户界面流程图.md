# HeartChat用户界面流程图

本文档展示了HeartChat项目的用户界面流程，包括页面跳转和用户交互流程。

## 整体用户界面流程

```mermaid
graph TD
    Start[启动小程序] --> Welcome[欢迎页面]
    Welcome --> Login{是否登录?}
    Login -->|否| Auth[授权登录]
    Login -->|是| Home[首页]
    Auth --> Home
    
    Home --> RoleSelect[角色选择]
    Home --> EmotionHistory[情绪历史]
    Home --> EmotionAnalysis[情绪分析]
    Home --> UserCenter[个人中心]
    
    RoleSelect --> Chat[聊天界面]
    EmotionHistory --> EmotionDetail[情绪详情]
    EmotionAnalysis --> EmotionDashboard[情绪面板]
    UserCenter --> UserProfile[用户资料]
    UserCenter --> Settings[设置]
    
    Chat --> EmotionAnalysis
    EmotionDetail --> EmotionDashboard
    
    subgraph 主要页面导航
        Home
        RoleSelect
        Chat
        EmotionHistory
        EmotionAnalysis
        UserCenter
    end
    
    subgraph 次要页面导航
        EmotionDetail
        EmotionDashboard
        UserProfile
        Settings
    end
```

## 详细用户界面流程

### 1. 登录与授权流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Welcome as 欢迎页面
    participant Auth as 授权页面
    participant API as 微信API
    participant Backend as 后端服务
    participant Home as 首页
    
    User->>Welcome: 打开小程序
    Welcome->>Welcome: 检查登录状态
    alt 未登录
        Welcome->>Auth: 跳转到授权页面
        Auth->>User: 请求用户授权
        User->>Auth: 同意授权
        Auth->>API: 调用wx.login
        API->>Auth: 返回code
        Auth->>Backend: 发送code
        Backend->>Auth: 返回用户信息和openid
        Auth->>Welcome: 保存用户信息
    else 已登录
        Welcome->>Welcome: 获取缓存的用户信息
    end
    Welcome->>Home: 跳转到首页
```

### 2. 首页交互流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Home as 首页
    participant RoleSelect as 角色选择
    participant Chat as 聊天界面
    participant EmotionHistory as 情绪历史
    participant EmotionAnalysis as 情绪分析
    participant UserCenter as 个人中心
    
    User->>Home: 进入首页
    Home->>Home: 加载最近对话
    Home->>Home: 加载情绪数据
    
    alt 点击开始对话
        User->>Home: 点击"开始对话"
        Home->>RoleSelect: 跳转到角色选择
        User->>RoleSelect: 选择角色
        RoleSelect->>Chat: 跳转到聊天界面
    else 点击历史对话
        User->>Home: 点击历史对话
        Home->>Chat: 跳转到聊天界面并加载历史
    else 点击情绪历史
        User->>Home: 点击"情绪历史"
        Home->>EmotionHistory: 跳转到情绪历史
    else 点击情绪分析
        User->>Home: 点击"情绪分析"
        Home->>EmotionAnalysis: 跳转到情绪分析
    else 点击个人中心
        User->>Home: 点击"个人中心"
        Home->>UserCenter: 跳转到个人中心
    end
```

### 3. 聊天界面交互流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Chat as 聊天界面
    participant Backend as 后端服务
    participant AI as 智谱AI
    participant EmotionAnalysis as 情绪分析
    
    User->>Chat: 进入聊天界面
    Chat->>Chat: 加载角色信息
    Chat->>Chat: 加载历史消息
    
    User->>Chat: 发送消息
    Chat->>Chat: 显示用户消息
    Chat->>Backend: 发送消息到后端
    Backend->>AI: 调用智谱AI
    AI->>Backend: 返回AI回复
    Backend->>Chat: 返回AI回复
    Chat->>Chat: 显示AI回复
    
    Backend->>Backend: 分析情绪
    Backend->>Chat: 返回情绪分析结果
    Chat->>Chat: 更新情绪指示器
    
    alt 点击情绪分析
        User->>Chat: 点击情绪分析按钮
        Chat->>EmotionAnalysis: 跳转到情绪分析
    else 退出聊天
        User->>Chat: 点击返回
        Chat->>Chat: 保存聊天状态
    end
```

### 4. 情绪分析交互流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant EmotionAnalysis as 情绪分析
    participant Backend as 后端服务
    participant EmotionDashboard as 情绪面板
    
    User->>EmotionAnalysis: 进入情绪分析
    EmotionAnalysis->>Backend: 获取情绪数据
    Backend->>EmotionAnalysis: 返回情绪数据
    EmotionAnalysis->>EmotionAnalysis: 显示情绪分布
    EmotionAnalysis->>EmotionAnalysis: 显示关键词
    EmotionAnalysis->>EmotionAnalysis: 显示情绪分析
    
    alt 查看详细面板
        User->>EmotionAnalysis: 点击查看详情
        EmotionAnalysis->>EmotionDashboard: 显示情绪面板
        User->>EmotionDashboard: 浏览情绪数据
    else 分享情绪分析
        User->>EmotionAnalysis: 点击分享
        EmotionAnalysis->>EmotionAnalysis: 生成分享图片
    else 导出情绪分析
        User->>EmotionAnalysis: 点击导出
        EmotionAnalysis->>EmotionAnalysis: 导出数据
    end
```

### 5. 情绪历史交互流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant EmotionHistory as 情绪历史
    participant Backend as 后端服务
    participant EmotionDetail as 情绪详情
    
    User->>EmotionHistory: 进入情绪历史
    EmotionHistory->>Backend: 获取历史情绪数据
    Backend->>EmotionHistory: 返回历史情绪数据
    EmotionHistory->>EmotionHistory: 显示情绪趋势图
    EmotionHistory->>EmotionHistory: 显示情绪记录列表
    
    alt 查看详细情绪
        User->>EmotionHistory: 点击情绪记录
        EmotionHistory->>EmotionDetail: 跳转到情绪详情
        EmotionDetail->>Backend: 获取详细情绪数据
        Backend->>EmotionDetail: 返回详细情绪数据
        EmotionDetail->>EmotionDetail: 显示详细情绪分析
    else 筛选时间范围
        User->>EmotionHistory: 选择时间范围
        EmotionHistory->>Backend: 获取筛选后的数据
        Backend->>EmotionHistory: 返回筛选后的数据
        EmotionHistory->>EmotionHistory: 更新显示
    end
```

### 6. 用户中心交互流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UserCenter as 个人中心
    participant UserProfile as 用户资料
    participant Backend as 后端服务
    participant Settings as 设置
    
    User->>UserCenter: 进入个人中心
    UserCenter->>UserCenter: 加载用户信息
    UserCenter->>UserCenter: 显示用户统计
    
    alt 查看/编辑资料
        User->>UserCenter: 点击"个人资料"
        UserCenter->>UserProfile: 跳转到用户资料
        UserProfile->>Backend: 获取用户详细资料
        Backend->>UserProfile: 返回用户详细资料
        UserProfile->>UserProfile: 显示用户资料
        
        opt 编辑资料
            User->>UserProfile: 编辑资料
            UserProfile->>Backend: 保存资料
            Backend->>UserProfile: 返回保存结果
            UserProfile->>UserProfile: 更新显示
        end
    else 查看设置
        User->>UserCenter: 点击"设置"
        UserCenter->>Settings: 跳转到设置
        
        opt 切换主题
            User->>Settings: 切换暗黑/亮色模式
            Settings->>Settings: 更新主题设置
        end
        
        opt 隐私设置
            User->>Settings: 调整隐私设置
            Settings->>Backend: 保存设置
            Backend->>Settings: 返回保存结果
        end
    end
```

## 暗黑模式切换流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Settings as 设置页面
    participant ThemeManager as 主题管理器
    participant Pages as 所有页面
    participant Components as 所有组件
    
    User->>Settings: 切换暗黑/亮色模式
    Settings->>ThemeManager: 更新主题设置
    ThemeManager->>ThemeManager: 保存设置到本地缓存
    ThemeManager->>Pages: 通知主题变更
    ThemeManager->>Components: 通知主题变更
    
    Pages->>Pages: 应用新主题样式
    Components->>Components: 应用新主题样式
    
    alt 系统跟随
        ThemeManager->>ThemeManager: 监听系统主题变更
        ThemeManager->>Pages: 通知主题变更
        ThemeManager->>Components: 通知主题变更
    end
```

## 角色选择与创建流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant RoleSelect as 角色选择页面
    participant RoleEditor as 角色编辑器
    participant Backend as 后端服务
    participant Chat as 聊天界面
    
    User->>RoleSelect: 进入角色选择
    RoleSelect->>Backend: 获取角色列表
    Backend->>RoleSelect: 返回角色列表
    RoleSelect->>RoleSelect: 显示角色列表
    
    alt 选择现有角色
        User->>RoleSelect: 选择角色
        RoleSelect->>Chat: 跳转到聊天界面
    else 创建新角色
        User->>RoleSelect: 点击"创建角色"
        RoleSelect->>RoleEditor: 跳转到角色编辑器
        User->>RoleEditor: 填写角色信息
        User->>RoleEditor: 点击"生成提示词"
        RoleEditor->>Backend: 请求生成提示词
        Backend->>RoleEditor: 返回生成的提示词
        RoleEditor->>RoleEditor: 显示生成的提示词
        User->>RoleEditor: 编辑提示词
        User->>RoleEditor: 点击"保存"
        RoleEditor->>Backend: 保存角色信息
        Backend->>RoleEditor: 返回保存结果
        RoleEditor->>RoleSelect: 返回角色选择
        RoleSelect->>Backend: 获取更新后的角色列表
        Backend->>RoleSelect: 返回更新后的角色列表
        RoleSelect->>RoleSelect: 显示更新后的角色列表
    end
```
