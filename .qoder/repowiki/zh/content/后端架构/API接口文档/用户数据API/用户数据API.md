# 用户数据API

<cite>
**本文档引用的文件**
- [getEmotionRecords/index.js](file://cloudfunctions/getEmotionRecords/index.js)
- [generateDailyReports/index.js](file://cloudfunctions/generateDailyReports/index.js)
- [user/index.js](file://cloudfunctions/user/index.js)
- [doc/开发文档/cloudfunctions/getEmotionRecords.md](file://doc/开发文档/cloudfunctions/getEmotionRecords.md)
- [doc/开发文档/cloudfunctions/generateDailyReports.md](file://doc/开发文档/cloudfunctions/generateDailyReports.md)
- [doc/开发文档/cloudfunctions/user.md](file://doc/开发文档/cloudfunctions/user.md)
- [doc/开发文档/database/emotionRecords.md](file://doc/开发文档/database/emotionRecords.md)
- [doc/开发文档/database/userReports.md](file://doc/开发文档/database/userReports.md)
- [doc/开发文档/database/user_base.md](file://doc/开发文档/database/user_base.md)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概述](#架构概述)
5. [详细组件分析](#详细组件分析)
6. [依赖分析](#依赖分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)

## 简介
本文档全面记录了用户相关数据服务的API集合，包括用户资料管理、情绪历史查询和每日报告生成。详细描述了`getEmotionRecords`云函数的分页查询参数设计（如时间范围、分页大小等）和返回的数据结构。说明了`generateDailyReports`云函数如何基于历史数据生成个性化报告的逻辑。解释了`user`云函数提供的用户基础信息操作接口。提供了综合使用这些API构建用户中心页面的代码示例，展示数据关联查询的最佳实践。包含性能建议，如大数据量下的分页策略和缓存机制。

## 项目结构
用户数据服务API主要由三个核心云函数组成：`getEmotionRecords`用于查询情绪记录，`generateDailyReports`用于生成每日报告，`user`用于管理用户基础信息。这些函数通过云数据库进行数据交互，形成了完整的用户数据服务体系。

```mermaid
graph TD
subgraph "云函数"
A[getEmotionRecords] --> D[数据库]
B[generateDailyReports] --> D[数据库]
C[user] --> D[数据库]
end
subgraph "数据库"
D[数据库] --> E[emotionRecords]
D --> F[userReports]
D --> G[user_base]
D --> H[user_profile]
D --> I[user_stats]
D --> J[user_config]
end
A --> |查询| E
B --> |生成| F
C --> |管理| G
C --> |管理| H
C --> |管理| I
C --> |管理| J
```

**图表来源**
- [cloudfunctions/getEmotionRecords/index.js](file://cloudfunctions/getEmotionRecords/index.js)
- [cloudfunctions/generateDailyReports/index.js](file://cloudfunctions/generateDailyReports/index.js)
- [cloudfunctions/user/index.js](file://cloudfunctions/user/index.js)

**章节来源**
- [cloudfunctions/getEmotionRecords/index.js](file://cloudfunctions/getEmotionRecords/index.js)
- [cloudfunctions/generateDailyReports/index.js](file://cloudfunctions/generateDailyReports/index.js)
- [cloudfunctions/user/index.js](file://cloudfunctions/user/index.js)

## 核心组件
用户数据API的核心组件包括三个主要云函数：`getEmotionRecords`提供情绪历史记录查询服务，`generateDailyReports`实现每日心情报告的批量生成，`user`管理用户基础信息和配置。这些组件共同构成了用户中心的数据服务基础。

**章节来源**
- [cloudfunctions/getEmotionRecords/index.js](file://cloudfunctions/getEmotionRecords/index.js)
- [cloudfunctions/generateDailyReports/index.js](file://cloudfunctions/generateDailyReports/index.js)
- [cloudfunctions/user/index.js](file://cloudfunctions/user/index.js)

## 架构概述
用户数据API采用微服务架构，每个云函数独立处理特定业务逻辑。`getEmotionRecords`负责情绪记录的查询，`generateDailyReports`负责报告的生成和通知，`user`负责用户信息的管理。这些服务通过统一的数据库接口进行数据交互，确保了数据的一致性和完整性。

```mermaid
graph LR
Client[客户端] --> GetEmotionRecords[getEmotionRecords]
Client --> GenerateDailyReports[generateDailyReports]
Client --> User[user]
GetEmotionRecords --> DB[(数据库)]
GenerateDailyReports --> DB
User --> DB
DB --> EmotionRecords[emotionRecords]
DB --> UserReports[userReports]
DB --> UserBase[user_base]
DB --> UserProfile[user_profile]
DB --> UserStats[user_stats]
DB --> UserConfig[user_config]
```

**图表来源**
- [cloudfunctions/getEmotionRecords/index.js](file://cloudfunctions/getEmotionRecords/index.js)
- [cloudfunctions/generateDailyReports/index.js](file://cloudfunctions/generateDailyReports/index.js)
- [cloudfunctions/user/index.js](file://cloudfunctions/user/index.js)

## 详细组件分析

### getEmotionRecords云函数分析
`getEmotionRecords`云函数提供情绪记录查询服务，支持根据用户ID和角色ID进行查询，并具有降级查询机制以提高兼容性。

#### 查询参数设计
```mermaid
classDiagram
class GetEmotionRecordsParams {
+string userId
+string roleId
+number limit
}
class GetEmotionRecordsResponse {
+boolean success
+array data
+string openid
+string appid
+string unionid
}
GetEmotionRecordsParams --> GetEmotionRecordsResponse : "查询"
```

**图表来源**
- [cloudfunctions/getEmotionRecords/index.js](file://cloudfunctions/getEmotionRecords/index.js)

#### 分页查询流程
```mermaid
sequenceDiagram
participant Client as "客户端"
participant Function as "getEmotionRecords"
participant Database as "数据库"
Client->>Function : 调用云函数
Function->>Function : 验证参数
alt 参数验证失败
Function-->>Client : 返回错误信息
else 参数验证成功
Function->>Function : 构建查询条件
Function->>Database : 尝试字符串查询
alt 字符串查询成功
Database-->>Function : 返回结果
else 字符串查询失败
Function->>Database : 尝试对象查询
alt 对象查询成功
Database-->>Function : 返回结果
else 对象查询失败
Function-->>Client : 返回详细错误信息
end
end
Function->>Function : 按createTime降序排序
Function->>Function : 限制返回数量(limit)
Function-->>Client : 返回查询结果
end
```

**图表来源**
- [cloudfunctions/getEmotionRecords/index.js](file://cloudfunctions/getEmotionRecords/index.js)

#### 返回数据结构
```mermaid
erDiagram
EMOTION_RECORDS {
string _id PK
string userId FK
string roleId FK
datetime createTime
object analysis
string originalText
}
USER_BASE {
string user_id PK
string username
string avatar_url
}
EMOTION_RECORDS ||--o{ USER_BASE : "userId"
```

**图表来源**
- [doc/开发文档/database/emotionRecords.md](file://doc/开发文档/database/emotionRecords.md)

**章节来源**
- [cloudfunctions/getEmotionRecords/index.js](file://cloudfunctions/getEmotionRecords/index.js)
- [doc/开发文档/cloudfunctions/getEmotionRecords.md](file://doc/开发文档/cloudfunctions/getEmotionRecords.md)

### generateDailyReports云函数分析
`generateDailyReports`云函数负责批量生成用户的每日心情报告，并支持订阅消息通知功能。

#### 报告生成逻辑
```mermaid
flowchart TD
Start([开始]) --> CalculateDate["计算目标日期<br/>(前一天)"]
CalculateDate --> QueryActiveUsers["查询活跃用户<br/>(有情绪记录)"]
QueryActiveUsers --> CheckUsers{"有活跃用户?"}
CheckUsers --> |否| ReturnSuccess["返回成功<br/>(无用户需要处理)"]
CheckUsers --> |是| ProcessUser["处理用户"]
ProcessUser --> CallAnalysis["调用analysis云函数<br/>(生成报告)"]
CallAnalysis --> CheckReport{"报告生成成功?"}
CheckReport --> |否| RecordFailure["记录失败结果"]
CheckReport --> |是| CheckNotification["检查用户通知设置"]
CheckNotification --> CheckTemplate["查询订阅消息模板ID"]
CheckTemplate --> SendNotification["发送订阅消息"]
SendNotification --> RecordSuccess["记录成功结果"]
RecordFailure --> Delay["延迟500ms"]
RecordSuccess --> Delay
Delay --> NextUser{"还有更多用户?"}
NextUser --> |是| ProcessUser
NextUser --> |否| ReturnResults["返回统计结果"]
ReturnSuccess --> ReturnResults
ReturnResults --> End([结束])
```

**图表来源**
- [cloudfunctions/generateDailyReports/index.js](file://cloudfunctions/generateDailyReports/index.js)

#### 数据处理流程
```mermaid
sequenceDiagram
participant Scheduler as "定时任务"
participant GenerateDailyReports as "generateDailyReports"
participant Analysis as "analysis云函数"
participant Database as "数据库"
Scheduler->>GenerateDailyReports : 触发执行
GenerateDailyReports->>Database : 查询昨日活跃用户
Database-->>GenerateDailyReports : 返回用户列表
loop 每个用户
GenerateDailyReports->>Analysis : 调用analysis生成报告
Analysis->>Database : 查询用户情绪记录
Database-->>Analysis : 返回情绪数据
Analysis->>Analysis : 生成报告内容
Analysis->>Database : 保存报告
Database-->>Analysis : 返回报告ID
Analysis-->>GenerateDailyReports : 返回结果
alt 用户开启通知
GenerateDailyReports->>Database : 查询用户通知设置
Database-->>GenerateDailyReports : 返回设置
GenerateDailyReports->>Database : 查询订阅消息模板
Database-->>GenerateDailyReports : 返回模板ID
GenerateDailyReports->>WeChat : 发送订阅消息
WeChat-->>GenerateDailyReports : 返回发送结果
end
end
GenerateDailyReports-->>Scheduler : 返回统计结果
```

**图表来源**
- [cloudfunctions/generateDailyReports/index.js](file://cloudfunctions/generateDailyReports/index.js)

**章节来源**
- [cloudfunctions/generateDailyReports/index.js](file://cloudfunctions/generateDailyReports/index.js)
- [doc/开发文档/cloudfunctions/generateDailyReports.md](file://doc/开发文档/cloudfunctions/generateDailyReports.md)

### user云函数分析
`user`云函数提供用户基础信息操作接口，支持用户资料的获取和更新。

#### 用户信息操作
```mermaid
classDiagram
class UserParams {
+string action
+string userId
+string username
+string avatarUrl
+string gender
+string country
+string province
+string city
+string bio
+object settings
}
class UserInfo {
+string userId
+string username
+string avatarUrl
+number userType
+number status
+string gender
+string country
+string province
+string city
+string bio
+object stats
}
class UserResponse {
+boolean success
+object data
+string error
}
UserParams --> UserInfo : "更新"
UserInfo --> UserResponse : "返回"
```

**图表来源**
- [cloudfunctions/user/index.js](file://cloudfunctions/user/index.js)

#### 用户资料更新流程
```mermaid
flowchart TD
Start([开始]) --> ValidateParams["验证参数"]
ValidateParams --> CheckUserId{"用户ID存在?"}
CheckUserId --> |否| ReturnError["返回错误信息"]
CheckUserId --> |是| UpdateBase["更新user_base表"]
UpdateBase --> CheckProfile{"用户资料存在?"}
CheckProfile --> |否| CreateProfile["创建用户资料"]
CheckProfile --> |是| UpdateProfile["更新用户资料"]
CreateProfile --> UpdateConfig
UpdateProfile --> UpdateConfig
UpdateConfig --> CheckConfig{"用户配置存在?"}
CheckConfig --> |否| CreateConfig["创建用户配置"]
CheckConfig --> |是| UpdateConfig["更新用户配置"]
CreateConfig --> GetUpdatedInfo
UpdateConfig --> GetUpdatedInfo
GetUpdatedInfo --> ReturnSuccess["返回更新后的用户信息"]
ReturnError --> End([结束])
ReturnSuccess --> End
```

**图表来源**
- [cloudfunctions/user/index.js](file://cloudfunctions/user/index.js)

**章节来源**
- [cloudfunctions/user/index.js](file://cloudfunctions/user/index.js)
- [doc/开发文档/cloudfunctions/user.md](file://doc/开发文档/cloudfunctions/user.md)

## 依赖分析
用户数据API的各个组件之间存在明确的依赖关系，通过数据库集合进行数据交互。

```mermaid
graph TD
GetEmotionRecords[getEmotionRecords] --> EmotionRecords[emotionRecords]
GenerateDailyReports[generateDailyReports] --> EmotionRecords
GenerateDailyReports --> UserReports[userReports]
GenerateDailyReports --> Users[users]
GenerateDailyReports --> SysConfig[sys_config]
User[user] --> UserBase[user_base]
User --> UserProfile[user_profile]
User --> UserStats[user_stats]
User --> UserConfig[user_config]
EmotionRecords -.->|userId| UserBase
UserReports -.->|userId| UserBase
Users -.->|_id| UserBase
```

**图表来源**
- [cloudfunctions/getEmotionRecords/index.js](file://cloudfunctions/getEmotionRecords/index.js)
- [cloudfunctions/generateDailyReports/index.js](file://cloudfunctions/generateDailyReports/index.js)
- [cloudfunctions/user/index.js](file://cloudfunctions/user/index.js)

**章节来源**
- [doc/开发文档/database/emotionRecords.md](file://doc/开发文档/database/emotionRecords.md)
- [doc/开发文档/database/userReports.md](file://doc/开发文档/database/userReports.md)
- [doc/开发文档/database/user_base.md](file://doc/开发文档/database/user_base.md)

## 性能考虑
在处理用户数据API时，需要考虑大数据量下的性能优化策略。

### 分页策略
对于`getEmotionRecords`云函数，采用limit参数限制返回记录数量，默认为20条，避免一次性返回过多数据影响性能。建议前端实现分页加载，每次请求获取固定数量的记录。

### 缓存机制
对于频繁访问的用户基础信息，建议在客户端进行缓存，减少云函数调用次数。对于每日报告，由于是每日生成一次，可以考虑在生成后缓存结果，避免重复计算。

### 批量处理优化
`generateDailyReports`云函数在处理大量用户时，通过限制处理用户数量（最多100个）和添加延迟（500ms）来避免API调用过于频繁，确保系统稳定性。

**章节来源**
- [cloudfunctions/getEmotionRecords/index.js](file://cloudfunctions/getEmotionRecords/index.js)
- [cloudfunctions/generateDailyReports/index.js](file://cloudfunctions/generateDailyReports/index.js)

## 故障排除指南
### 常见问题
1. **getEmotionRecords查询失败**：检查userId参数是否正确传递，确保数据库emotionRecords集合存在并设置了正确的读权限。
2. **每日报告未生成**：检查analysis云函数是否正常运行，确认sys_config集合中配置了正确的report_template_id。
3. **用户信息更新失败**：检查用户ID是否存在，确保user_base集合中有对应记录。

### 错误处理
各云函数都实现了详细的错误日志记录，包括参数验证错误、查询错误和系统错误。对于getEmotionRecords，提供了字符串查询和对象查询两种方式的错误详情，便于排查问题。

**章节来源**
- [cloudfunctions/getEmotionRecords/index.js](file://cloudfunctions/getEmotionRecords/index.js)
- [cloudfunctions/generateDailyReports/index.js](file://cloudfunctions/generateDailyReports/index.js)
- [cloudfunctions/user/index.js](file://cloudfunctions/user/index.js)

## 结论
用户数据API提供了完整的用户相关数据服务，包括情绪历史查询、每日报告生成和用户基础信息管理。通过合理的分页策略和缓存机制，确保了在大数据量下的性能表现。各组件之间通过清晰的接口和数据库设计实现了良好的解耦，便于维护和扩展。