
# user 云函数实现流程图

```mermaid
graph TD
    A[开始] --> B{接收 event};
    B --> C{解析 action};
    C --> D{switch (action)};

    D -- "getInfo" --> E[getInfo: 获取用户信息];
    D -- "updateProfile" --> F[updateProfile: 更新用户资料];
    D -- "getStats" --> G[getStats: 获取用户统计];
    D -- "updateStats" --> H[updateStats: 更新用户统计];
    D -- "getReportList" --> I[getReportList: 获取用户报告列表];
    D -- "markReportAsRead" --> J[markReportAsRead: 标记报告为已读];
    D -- "getUserInterests" --> K[getUserInterests: 获取用户兴趣];
    D -- "updateUserInterest" --> L[updateUserInterest: 更新用户兴趣关键词];
    D -- "batchUpdateUserInterests" --> M[batchUpdateUserInterests: 批量更新用户兴趣];
    D -- "deleteUserInterest" --> N[deleteUserInterest: 删除用户兴趣关键词];
    D -- "updateKeywordCategory" --> O[updateKeywordCategory: 更新关键词分类];
    D -- "batchUpdateKeywordCategories" --> P[batchUpdateKeywordCategories: 批量更新关键词分类];
    D -- "updateKeywordEmotionScore" --> Q[updateKeywordEmotionScore: 更新关键词情感分数];
    D -- "getUserConfig" --> R[getUserConfig: 获取用户配置];
    D -- "getUserPerception" --> S[getUserPerception: 获取用户画像];
    D -- "createDatabaseIndexes" --> T[createDatabaseIndexes: 创建数据库索引];
    D -- "default" --> U[返回未知操作错误];

    subgraph "getInfo"
        E --> E1[从 "users" 集合查询];
        E1 --> E2[构建并返回用户信息];
    end

    subgraph "updateProfile"
        F --> F1[构建更新数据];
        F1 --> F2[更新 "users" 集合];
        F2 --> F3[查询更新后的用户并返回];
    end

    subgraph "getStats"
        G --> G1[从 "users" 集合查询];
        G1 --> G2[返回 stats 字段];
    end

    subgraph "updateStats"
        H --> H1[查询 "users" 集合];
        H1 --> H2{根据 statsType 更新};
        H2 -- "chatCount" --> H3[增加 chat_count];
        H2 -- "solvedCount" --> H4[增加 solved_count];
        H2 -- "rating" --> H5[更新 rating_avg 和 rating_count];
        H2 -- "activeDay" --> H6[更新 last_active 和 active_days];
        H6 --> H7[更新 "users" 集合并返回];
        H3 --> H7;
        H4 --> H7;
        H5 --> H7;
    end

    subgraph "getUserInterests"
        K --> K1[调用 userInterests.js -> getUserInterests];
        K1 --> K2[查询 "userInterests" 集合];
        K2 --> K3{找到记录?};
        K3 -- 是 --> K4[返回记录];
        K3 -- 否 --> K5[创建新记录并返回];
    end

    subgraph "updateUserInterest"
        L --> L1[调用 userInterests.js -> updateUserInterest];
        L1 --> L2[查询 "userInterests" 集合];
        L2 --> L3{找到关键词?};
        L3 -- 是 --> L4[更新关键词权重];
        L3 -- 否 --> L5[添加新关键词];
        L5 --> L6{是否自动分类?};
        L6 -- 是 --> L7[调用 "analysis" 云函数分类];
        L7 --> L8[更新 "userInterests" 集合];
        L4 --> L8;
        L6 -- 否 --> L8;
    end
    
    subgraph "batchUpdateUserInterests"
        M --> M1[调用 userInterests.js -> batchUpdateUserInterests];
        M1 --> M2[查询 "userInterests" 集合];
        M2 --> M3[批量处理关键词];
        M3 --> M4{是否自动分类?};
        M4 -- 是 --> M5[调用 "analysis" 云函数批量分类];
        M5 --> M6[更新 "userInterests" 集合];
        M4 -- 否 --> M6;
    end

    subgraph "getUserPerception"
        S --> S1[调用 userPerception_new.js -> getUserPerception];
        S1 --> S2[查询 "userInterests", "emotionRecords", "messages"];
        S2 --> S3[调用 "httpRequest" -> 智谱AI];
        S3 --> S4[调用 analyzeUserDialogues];
        S4 --> S5[调用 generateAIPersonalitySummary];
        S5 --> S6[整合数据并返回用户画像];
    end

    subgraph "createDatabaseIndexes"
        T --> T1[调用 createIndexes.js];
        T1 --> T2{指定集合?};
        T2 -- "userInterests" --> T3[createUserInterestsIndexes];
        T2 -- "roles" --> T4[createRolesIndexes];
        T2 -- "emotionRecords" --> T5[createEmotionRecordsIndexes];
        T2 -- "all" / "none" --> T6[createAllIndexes];
        T6 --> T7[返回结果];
        T3 --> T7;
        T4 --> T7;
        T5 --> T7;
    end

    E2 --> V[结束];
    F3 --> V;
    G2 --> V;
    H7 --> V;
    I --> V;
    J --> V;
    K4 --> V;
    K5 --> V;
    L8 --> V;
    M6 --> V;
    N --> V;
    O --> V;
    P --> V;
    Q --> V;
    R --> V;
    S6 --> V;
    T7 --> V;
    U --> V;
```
