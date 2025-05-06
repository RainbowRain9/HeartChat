# 数据库完整设计方案

## 一、用户模块

### 1. 用户基础信息(user_base)

#### 表结构
```sql
CREATE TABLE user_base (
    user_id         VARCHAR(100) PRIMARY KEY,    -- 用户ID(openid)
    username        VARCHAR(50)  NOT NULL,       -- 用户名
    avatar_url      VARCHAR(255),               -- 头像URL
    user_type       TINYINT     DEFAULT 1,      -- 用户类型(1普通/2企业/3管理员)
    status          TINYINT     DEFAULT 1,      -- 状态(0禁用/1启用)
    created_at      TIMESTAMP   DEFAULT NOW(),  -- 创建时间
    updated_at      TIMESTAMP   DEFAULT NOW()   -- 更新时间
);
```

#### 安全规则
```json
{
  "read": "auth.openid != null",
  "write": "auth.openid != null && doc._openid == auth.openid",
  "update": "auth.openid != null && doc._openid == auth.openid",
  "delete": false
}
```

#### 说明
- 所有登录用户可读
- 只能修改自己的数据
- 禁止删除用户数据
- 使用openid作为用户唯一标识

### 2. 用户详细信息(user_profile)

#### 表结构
```sql
CREATE TABLE user_profile (
    profile_id      BIGINT       PRIMARY KEY,    -- 档案ID
    user_id         VARCHAR(100) NOT NULL,       -- 用户ID
    real_name       VARCHAR(50),                 -- 真实姓名
    gender          TINYINT,                     -- 性别(0未知/1男/2女)
    location        VARCHAR(100),                -- 地区
    bio             TEXT,                        -- 个人简介
    tags            JSON,                        -- 标签
    
    INDEX idx_user_id(user_id)
);
```

#### 安全规则
```json
{
  "read": "auth.openid != null && doc.user_id == auth.openid",
  "write": "auth.openid != null && doc.user_id == auth.openid",
  "update": "auth.openid != null && doc.user_id == auth.openid",
  "delete": false
}
```

#### 说明
- 只能读写自己的详细资料
- 禁止删除用户资料
- 与user_base通过user_id关联

### 3. 用户统计信息(user_stats)

#### 表结构
```sql
CREATE TABLE user_stats (
    stats_id        BIGINT       PRIMARY KEY,    -- 统计ID
    user_id         VARCHAR(100) NOT NULL,       -- 用户ID
    chat_count      INT          DEFAULT 0,      -- 对话次数
    solved_count    INT          DEFAULT 0,      -- 解决问题数
    rating_avg      DECIMAL(3,2) DEFAULT 0,      -- 平均评分
    active_days     INT          DEFAULT 0,      -- 活跃天数
    last_active     TIMESTAMP,                   -- 最后活跃时间
    
    INDEX idx_user_id(user_id)
);
```

#### 安全规则
```json
{
  "read": "auth.openid != null && doc.user_id == auth.openid",
  "write": "auth.openid != null && doc.user_id == auth.openid",
  "update": "auth.openid != null && doc.user_id == auth.openid",
  "delete": false
}
```

#### 说明
- 只能读写自己的统计数据
- 系统自动更新统计信息
- 禁止删除统计数据

## 二、对话模块

### 1. 对话会话(chat_session)

#### 表结构
```sql
CREATE TABLE chat_session (
    session_id      BIGINT       PRIMARY KEY,    -- 会话ID
    user_id         VARCHAR(100) NOT NULL,       -- 用户ID
    target_id       VARCHAR(100) NOT NULL,       -- 目标ID(角色或用户)
    title           VARCHAR(100),                -- 会话标题
    session_type    TINYINT     DEFAULT 1,      -- 会话类型
    status          TINYINT     DEFAULT 1,      -- 状态
    start_time      TIMESTAMP   DEFAULT NOW(),  -- 开始时间
    end_time        TIMESTAMP,                  -- 结束时间
    
    INDEX idx_user_id(user_id),
    INDEX idx_start_time(start_time)
);
```

#### 安全规则
```json
{
  "read": "auth.openid != null && (doc.user_id == auth.openid || doc.target_id == auth.openid)",
  "write": "auth.openid != null",
  "update": "auth.openid != null && doc.user_id == auth.openid",
  "delete": "auth.openid != null && doc.user_id == auth.openid"
}
```

#### 说明
- 会话参与者可以读取
- 登录用户可以创建会话
- 只有创建者可以更新和删除

### 2. 对话消息(chat_message)

#### 表结构
```sql
CREATE TABLE chat_message (
    message_id      BIGINT       PRIMARY KEY,    -- 消息ID
    session_id      BIGINT       NOT NULL,       -- 会话ID
    sender_id       VARCHAR(100) NOT NULL,       -- 发送者ID
    receiver_id     VARCHAR(100) NOT NULL,       -- 接收者ID
    content_type    TINYINT     DEFAULT 1,      -- 内容类型(1文本/2图片/3语音)
    content         TEXT,                        -- 消息内容
    send_time       TIMESTAMP   DEFAULT NOW(),  -- 发送时间
    status          TINYINT     DEFAULT 1,      -- 状态
    
    INDEX idx_session_id(session_id),
    INDEX idx_send_time(send_time)
);
```

#### 安全规则
```json
{
  "read": "auth.openid != null && (doc.sender_id == auth.openid || doc.receiver_id == auth.openid)",
  "write": "auth.openid != null",
  "update": "auth.openid != null && doc.sender_id == auth.openid",
  "delete": "auth.openid != null && doc.sender_id == auth.openid"
}
```

#### 说明
- 消息参与者可以读取
- 登录用户可以发送消息
- 只有发送者可以更新和删除

### 3. 消息情感分析(message_emotion)

#### 表结构
```sql
CREATE TABLE message_emotion (
    emotion_id      BIGINT       PRIMARY KEY,    -- 情感ID
    message_id      BIGINT       NOT NULL,       -- 消息ID
    user_id         VARCHAR(100) NOT NULL,       -- 用户ID
    emotion_type    TINYINT,                     -- 情感类型
    emotion_value   DECIMAL(3,2),                -- 情感值
    keywords        JSON,                        -- 关键词
    analysis_time   TIMESTAMP   DEFAULT NOW(),  -- 分析时间
    
    INDEX idx_message_id(message_id),
    INDEX idx_user_id(user_id)
);
```

#### 安全规则
```json
{
  "read": "auth.openid != null && doc.user_id == auth.openid",
  "write": "auth.openid != null",
  "update": "auth.openid != null && doc.user_id == auth.openid",
  "delete": false
}
```

#### 说明
- 只能读写自己的情感分析数据
- 系统自动进行情感分析
- 禁止删除分析记录

## 三、功能模块



#### 安全规则
```json
{
  "read": "auth.openid != null && doc.user_id == auth.openid",
  "write": "auth.openid != null",
  "update": "auth.openid != null && doc.user_id == auth.openid",
  "delete": "auth.openid != null && doc.user_id == auth.openid"
}
```

#### 说明
- 只能读写自己创建的角色
- 允许删除自己的角色
- 角色可以被用于对话

### 2. 情感练习(emotion_practices)

#### 表结构
```sql
CREATE TABLE emotion_practices (
    practice_id     BIGINT       PRIMARY KEY,    -- 练习ID
    title           VARCHAR(100) NOT NULL,       -- 练习标题
    content         TEXT         NOT NULL,       -- 练习内容
    difficulty      TINYINT     DEFAULT 1,      -- 难度等级
    tags            JSON,                        -- 标签
    status          TINYINT     DEFAULT 1,      -- 状态
    created_at      TIMESTAMP   DEFAULT NOW()   -- 创建时间
);
```

#### 安全规则
```json
{
  "read": "auth.openid != null",
  "write": false,
  "update": false,
  "delete": false
}
```

#### 说明
- 所有登录用户可读
- 禁止修改练习内容
- 系统预置的练习数据

### 3. 练习进度(practice_progress)

#### 表结构
```sql
CREATE TABLE practice_progress (
    progress_id     BIGINT       PRIMARY KEY,    -- 进度ID
    user_id         VARCHAR(100) NOT NULL,       -- 用户ID
    practice_id     BIGINT       NOT NULL,       -- 练习ID
    status          TINYINT     DEFAULT 0,      -- 状态(0未完成/1已完成)
    score           INT,                         -- 得分
    comments        TEXT,                        -- 评语
    finish_time     TIMESTAMP,                  -- 完成时间
    
    INDEX idx_user_id(user_id),
    INDEX idx_practice_id(practice_id)
);
```

#### 安全规则
```json
{
  "read": "auth.openid != null && doc.user_id == auth.openid",
  "write": "auth.openid != null",
  "update": "auth.openid != null && doc.user_id == auth.openid",
  "delete": false
}
```

#### 说明
- 只能读写自己的练习进度
- 禁止删除进度记录
- 系统自动更新完成状态

## 四、系统模块

### 1. 系统配置(sys_config)

#### 表结构
```sql
CREATE TABLE sys_config (
    config_id       BIGINT       PRIMARY KEY,    -- 配置ID
    config_key      VARCHAR(50)  NOT NULL,       -- 配置键
    config_value    TEXT,                        -- 配置值
    config_type     TINYINT,                     -- 配置类型
    description     VARCHAR(255),                -- 描述
    status          TINYINT     DEFAULT 1,      -- 状态
    created_at      TIMESTAMP   DEFAULT NOW(),  -- 创建时间
    updated_at      TIMESTAMP   DEFAULT NOW(),  -- 更新时间
    
    UNIQUE INDEX idx_key(config_key)
);
```



#### 说明
- 所有登录用户可读
- 禁止修改系统配置
- 系统预置的配置数据

### 2. 登录日志(sys_log_login)

#### 表结构
```sql
CREATE TABLE sys_log_login (
    log_id          BIGINT       PRIMARY KEY,    -- 日志ID
    user_id         VARCHAR(100) NOT NULL,       -- 用户ID
    status          TINYINT,                     -- 状态(0失败/1成功)
    ip              VARCHAR(64),                 -- IP地址
    device          VARCHAR(100),                -- 设备信息
    created_at      TIMESTAMP   DEFAULT NOW(),  -- 创建时间
    
    INDEX idx_user_id(user_id),
    INDEX idx_created_at(created_at)
);
```



#### 说明
- 禁止读取日志
- 登录用户可以写入日志
- 禁止修改和删除日志

### 3. 操作日志(sys_log_operation)

#### 表结构
```sql
CREATE TABLE sys_log_operation (
    log_id          BIGINT       PRIMARY KEY,    -- 日志ID
    user_id         VARCHAR(100) NOT NULL,       -- 用户ID
    operation       VARCHAR(50),                 -- 操作类型
    method          VARCHAR(100),                -- 请求方法
    params          TEXT,                        -- 请求参数
    time            INT,                         -- 执行时长
    ip              VARCHAR(64),                 -- IP地址
    created_at      TIMESTAMP   DEFAULT NOW(),  -- 创建时间
    
    INDEX idx_user_id(user_id),
    INDEX idx_created_at(created_at)
);
```


#### 说明
- 禁止读取日志
- 登录用户可以写入日志
- 禁止修改和删除日志

## 五、字典模块

### 1. 字典类型(dict_type)

#### 表结构
```sql
CREATE TABLE dict_type (
    type_id         BIGINT       PRIMARY KEY,    -- 类型ID
    type_name       VARCHAR(50)  NOT NULL,       -- 类型名称
    type_key        VARCHAR(50)  NOT NULL,       -- 类型键
    status          TINYINT     DEFAULT 1,      -- 状态
    
    UNIQUE INDEX idx_type_key(type_key)
);
```



#### 说明
- 所有登录用户可读
- 禁止修改字典类型
- 系统预置的字典类型

### 2. 字典数据(dict_data)
### 1. 角色管理(roles)

#### 表结构
```sql
CREATE TABLE roles (
    role_id         BIGINT       PRIMARY KEY,    -- 角色ID
    user_id         VARCHAR(100) NOT NULL,       -- 创建者ID
    role_name       VARCHAR(50)  NOT NULL,       -- 角色名称
    role_desc       TEXT,                        -- 角色描述
    avatar_url      VARCHAR(255),               -- 角色头像
    personality     JSON,                        -- 性格特征
    speaking_style  TEXT,                        -- 说话风格
    background      TEXT,                        -- 背景故事
    prompt_template TEXT,                        -- 角色提示词模板
    status          TINYINT     DEFAULT 1,      -- 状态
    created_at      TIMESTAMP   DEFAULT NOW(),  -- 创建时间
    
    INDEX idx_user_id(user_id)
);
```
#### 表结构
```sql
CREATE TABLE dict_data (
    data_id         BIGINT       PRIMARY KEY,    -- 数据ID
    type_id         BIGINT       NOT NULL,       -- 类型ID
    data_label      VARCHAR(50)  NOT NULL,       -- 数据标签
    data_value      VARCHAR(50)  NOT NULL,       -- 数据值
    sort_order      INT          DEFAULT 0,      -- 排序
    status          TINYINT     DEFAULT 1,      -- 状态
    
    INDEX idx_type_id(type_id)
);
```



#### 说明
- 所有登录用户可读
- 禁止修改字典数据
- 系统预置的字典数据

## 六、数据库设计说明

### 1. 字段命名规范
- 主键统一使用`_id`后缀
- 外键使用关联表名+`_id`
- 创建时间统一使用`created_at`
- 更新时间统一使用`updated_at`
- 状态字段统一使用`status`

### 2. 索引设计原则
- 主键使用自增ID或UUID
- 外键字段必建索引
- 常用查询字段建索引
- 避免过多索引影响写入性能

### 3. 安全规则说明
- auth.openid：当前登录用户的openid
- doc.user_id：数据所属用户的ID
- doc.sender_id：消息发送者ID
- doc.receiver_id：消息接收者ID

### 4. 权限控制原则
- 所有操作都需要用户登录
- 用户只能访问自己的数据
- 系统数据只读不可写
- 日志只写不可读

### 5. 数据库优化建议
- 合理使用索引
- 控制字段长度
- 适当冗余设计
- 定期清理日志
- 分表分库规划 