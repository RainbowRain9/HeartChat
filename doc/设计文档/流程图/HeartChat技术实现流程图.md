# HeartChat技术实现流程图

本文档展示了HeartChat项目的核心技术实现流程，包括AI调用、情感分析、用户画像生成等关键技术流程。

## 1. AI对话生成流程

```mermaid
flowchart TD
    Start[开始] --> GetUserInput[获取用户输入]
    GetUserInput --> ValidateInput[验证输入]
    ValidateInput --> GetRoleInfo[获取角色信息]
    GetRoleInfo --> BuildPrompt[构建提示词]
    BuildPrompt --> GetChatHistory[获取聊天历史]
    GetChatHistory --> FormatMessages[格式化消息]
    FormatMessages --> CallAI[调用智谱AI]
    CallAI --> ProcessResponse[处理AI响应]
    ProcessResponse --> StreamResponse[流式返回响应]
    StreamResponse --> SaveMessage[保存消息]
    SaveMessage --> TriggerAnalysis[触发情感分析]
    TriggerAnalysis --> End[结束]
    
    subgraph 提示词构建
        BuildPrompt --> CombineSystemPrompt[合并系统提示词]
        CombineSystemPrompt --> AddRoleInfo[添加角色信息]
        AddRoleInfo --> AddUserInfo[添加用户信息]
        AddUserInfo --> AddInstructions[添加指令]
    end
    
    subgraph AI调用处理
        CallAI --> HandleTimeout[处理超时]
        CallAI --> HandleError[处理错误]
        CallAI --> HandleSuccess[处理成功]
    end
    
    subgraph 响应处理
        ProcessResponse --> ParseJSON[解析JSON]
        ParseJSON --> FilterContent[过滤内容]
        FilterContent --> FormatOutput[格式化输出]
    end
```

## 2. 情感分析实现流程

```mermaid
flowchart TD
    Start[开始] --> GetText[获取文本内容]
    GetText --> ValidateText[验证文本]
    ValidateText --> PreparePrompt[准备分析提示词]
    PreparePrompt --> CallAI[调用智谱AI]
    CallAI --> ParseResult[解析结果]
    ParseResult --> ExtractEmotions[提取情绪数据]
    ExtractEmotions --> ExtractKeywords[提取关键词]
    ExtractKeywords --> ClassifyKeywords[分类关键词]
    ClassifyKeywords --> CalculateStats[计算统计数据]
    CalculateStats --> SaveResults[保存分析结果]
    SaveResults --> UpdateUserInterests[更新用户兴趣]
    UpdateUserInterests --> ReturnResults[返回结果]
    ReturnResults --> End[结束]
    
    subgraph 情绪提取
        ExtractEmotions --> IdentifyPrimary[识别主要情绪]
        IdentifyPrimary --> CalculateIntensity[计算情绪强度]
        CalculateIntensity --> NormalizeValues[归一化数值]
    end
    
    subgraph 关键词处理
        ExtractKeywords --> TokenizeText[分词]
        TokenizeText --> RemoveStopwords[去除停用词]
        RemoveStopwords --> CalculateWeight[计算权重]
    end
    
    subgraph 关键词分类
        ClassifyKeywords --> GetEmbeddings[获取词向量]
        GetEmbeddings --> ClusterKeywords[聚类关键词]
        ClusterKeywords --> LabelClusters[标记类别]
    end
```

## 3. 用户画像生成流程

```mermaid
flowchart TD
    Start[开始] --> GetUserData[获取用户数据]
    GetUserData --> GetMessages[获取历史消息]
    GetMessages --> GetEmotions[获取情绪记录]
    GetEmotions --> GetInterests[获取兴趣数据]
    GetInterests --> PrepareData[准备分析数据]
    PrepareData --> BuildPrompt[构建分析提示词]
    BuildPrompt --> CallAI[调用智谱AI]
    CallAI --> ParseResult[解析结果]
    ParseResult --> ExtractPersonality[提取性格特征]
    ExtractPersonality --> GenerateSummary[生成个性总结]
    GenerateSummary --> SaveProfile[保存用户画像]
    SaveProfile --> ReturnProfile[返回用户画像]
    ReturnProfile --> End[结束]
    
    subgraph 数据准备
        PrepareData --> AggregateMessages[聚合消息内容]
        AggregateMessages --> SummarizeEmotions[汇总情绪数据]
        SummarizeEmotions --> OrganizeInterests[整理兴趣数据]
    end
    
    subgraph 性格特征提取
        ExtractPersonality --> IdentifyTraits[识别特质]
        IdentifyTraits --> CalculateScores[计算特质分数]
        CalculateScores --> RankTraits[排序特质]
    end
    
    subgraph 个性总结生成
        GenerateSummary --> CreateNarrative[创建叙述]
        CreateNarrative --> HighlightStrengths[突出优势]
        HighlightStrengths --> SuggestGrowth[提出成长建议]
    end
```

## 4. 关键词分类与聚类流程

```mermaid
flowchart TD
    Start[开始] --> GetKeywords[获取关键词列表]
    GetKeywords --> FilterKeywords[过滤关键词]
    FilterKeywords --> GetEmbeddings[获取词向量]
    GetEmbeddings --> PerformClustering[执行聚类]
    PerformClustering --> LabelClusters[标记聚类]
    LabelClusters --> CalculateWeights[计算类别权重]
    CalculateWeights --> SaveCategories[保存类别]
    SaveCategories --> UpdateUserInterests[更新用户兴趣]
    UpdateUserInterests --> ReturnResults[返回结果]
    ReturnResults --> End[结束]
    
    subgraph 词向量获取
        GetEmbeddings --> CallEmbeddingAPI[调用Embedding API]
        CallEmbeddingAPI --> NormalizeVectors[归一化向量]
    end
    
    subgraph 聚类处理
        PerformClustering --> CalculateSimilarity[计算相似度]
        CalculateSimilarity --> ApplyKMeans[应用K-Means]
        ApplyKMeans --> OptimizeClusters[优化聚类]
    end
    
    subgraph 聚类标记
        LabelClusters --> FindCentroid[找到中心点]
        FindCentroid --> GetRepresentative[获取代表性词]
        GetRepresentative --> AssignLabel[分配标签]
    end
```

## 5. 情绪波动指数计算流程

```mermaid
flowchart TD
    Start[开始] --> GetEmotionRecords[获取情绪记录]
    GetEmotionRecords --> SortByTime[按时间排序]
    SortByTime --> CalculateBaseline[计算基准线]
    CalculateBaseline --> CalculateDeviations[计算偏差]
    CalculateDeviations --> ApplyWeights[应用权重]
    ApplyWeights --> CalculateVolatility[计算波动指数]
    CalculateVolatility --> NormalizeIndex[归一化指数]
    NormalizeIndex --> ClassifyVolatility[分类波动程度]
    ClassifyVolatility --> SaveResults[保存结果]
    SaveResults --> ReturnResults[返回结果]
    ReturnResults --> End[结束]
    
    subgraph 基准线计算
        CalculateBaseline --> GetAverages[获取平均值]
        GetAverages --> IdentifyTrend[识别趋势]
        IdentifyTrend --> AdjustBaseline[调整基准线]
    end
    
    subgraph 偏差计算
        CalculateDeviations --> MeasureDistance[测量距离]
        MeasureDistance --> IdentifyPeaks[识别峰值]
        IdentifyPeaks --> CalculateVariance[计算方差]
    end
    
    subgraph 波动指数计算
        CalculateVolatility --> ApplyFormula[应用公式]
        ApplyFormula --> AdjustTimeWeight[调整时间权重]
        AdjustTimeWeight --> SmoothResults[平滑结果]
    end
```

## 6. 每日情绪报告生成流程

```mermaid
flowchart TD
    Start[开始] --> GetDailyRecords[获取当日情绪记录]
    GetDailyRecords --> ValidateData[验证数据]
    ValidateData --> AggregateEmotions[聚合情绪数据]
    AggregateEmotions --> IdentifyTrends[识别趋势]
    IdentifyTrends --> ExtractKeywords[提取关键词]
    ExtractKeywords --> ClusterKeywords[聚类关键词]
    ClusterKeywords --> PreparePrompt[准备报告提示词]
    PreparePrompt --> CallAI[调用智谱AI]
    CallAI --> GenerateReport[生成报告内容]
    GenerateReport --> FormatReport[格式化报告]
    FormatReport --> SaveReport[保存报告]
    SaveReport --> NotifyUser[通知用户]
    NotifyUser --> End[结束]
    
    subgraph 情绪聚合
        AggregateEmotions --> CalculateDistribution[计算分布]
        CalculateDistribution --> IdentifyPrimary[识别主要情绪]
        IdentifyPrimary --> CalculateChanges[计算变化]
    end
    
    subgraph 趋势识别
        IdentifyTrends --> CompareWithHistory[与历史比较]
        CompareWithHistory --> DetectPatterns[检测模式]
        DetectPatterns --> PredictTrend[预测趋势]
    end
    
    subgraph 报告生成
        GenerateReport --> CreateSummary[创建摘要]
        CreateSummary --> AddInsights[添加洞察]
        AddInsights --> AddSuggestions[添加建议]
    end
```

## 7. 暗黑模式实现流程

```mermaid
flowchart TD
    Start[开始] --> CheckUserPreference[检查用户偏好]
    CheckUserPreference --> CheckSystemSetting[检查系统设置]
    CheckSystemSetting --> DetermineTheme[确定主题]
    DetermineTheme --> LoadThemeConfig[加载主题配置]
    LoadThemeConfig --> ApplyGlobalTheme[应用全局主题]
    ApplyGlobalTheme --> NotifyComponents[通知组件]
    NotifyComponents --> UpdateUI[更新UI]
    UpdateUI --> SavePreference[保存偏好]
    SavePreference --> End[结束]
    
    subgraph 主题确定
        DetermineTheme --> CheckCache[检查缓存]
        CheckCache --> CheckDefault[检查默认值]
        CheckDefault --> ResolveConflict[解决冲突]
    end
    
    subgraph 主题应用
        ApplyGlobalTheme --> SetVariables[设置CSS变量]
        SetVariables --> UpdateClasses[更新CSS类]
        UpdateClasses --> UpdateImages[更新图片资源]
    end
    
    subgraph 组件更新
        NotifyComponents --> SendEvent[发送事件]
        SendEvent --> UpdateCharts[更新图表]
        UpdateCharts --> UpdateForms[更新表单]
    end
```

## 8. 本地缓存管理流程

```mermaid
flowchart TD
    Start[开始] --> InitializeCache[初始化缓存]
    InitializeCache --> DefineSchema[定义缓存结构]
    DefineSchema --> SetExpiryRules[设置过期规则]
    SetExpiryRules --> HandleRequests[处理缓存请求]
    
    HandleRequests --> ReadRequest{读取请求?}
    ReadRequest -->|是| CheckCache[检查缓存]
    ReadRequest -->|否| WriteRequest{写入请求?}
    
    CheckCache --> CacheExists{缓存存在?}
    CacheExists -->|是| CheckExpiry[检查是否过期]
    CacheExists -->|否| FetchData[获取数据]
    
    CheckExpiry --> IsExpired{是否过期?}
    IsExpired -->|是| FetchData
    IsExpired -->|否| ReturnCache[返回缓存数据]
    
    FetchData --> SaveCache[保存到缓存]
    SaveCache --> ReturnData[返回数据]
    
    WriteRequest -->|是| ValidateData[验证数据]
    WriteRequest -->|否| DeleteRequest{删除请求?}
    
    ValidateData --> UpdateCache[更新缓存]
    UpdateCache --> SyncIfNeeded[必要时同步]
    SyncIfNeeded --> ReturnSuccess[返回成功]
    
    DeleteRequest -->|是| RemoveCache[移除缓存]
    DeleteRequest -->|否| InvalidRequest[无效请求]
    
    RemoveCache --> ReturnSuccess
    InvalidRequest --> ReturnError[返回错误]
    
    ReturnCache --> End[结束]
    ReturnData --> End
    ReturnSuccess --> End
    ReturnError --> End
    
    subgraph 缓存初始化
        InitializeCache --> CheckStorage[检查存储空间]
        CheckStorage --> ClearExpired[清理过期缓存]
        ClearExpired --> SetDefaults[设置默认值]
    end
    
    subgraph 数据同步
        SyncIfNeeded --> CheckConnection[检查连接]
        CheckConnection --> QueueSync[队列同步]
        QueueSync --> PerformSync[执行同步]
    end
```

## 9. 分包加载实现流程

```mermaid
flowchart TD
    Start[开始] --> AnalyzeApp[分析应用]
    AnalyzeApp --> IdentifyModules[识别模块]
    IdentifyModules --> PlanPackages[规划分包]
    PlanPackages --> ConfigureApp[配置应用]
    ConfigureApp --> OrganizeFiles[组织文件]
    OrganizeFiles --> UpdateReferences[更新引用]
    UpdateReferences --> OptimizeCommon[优化公共资源]
    OptimizeCommon --> ImplementLazyLoad[实现懒加载]
    ImplementLazyLoad --> TestPerformance[测试性能]
    TestPerformance --> AdjustStrategy[调整策略]
    AdjustStrategy --> FinalizeConfig[完成配置]
    FinalizeConfig --> End[结束]
    
    subgraph 分包规划
        PlanPackages --> IdentifyMainPackage[确定主包]
        IdentifyMainPackage --> GroupByFeature[按功能分组]
        GroupByFeature --> OptimizeSize[优化大小]
    end
    
    subgraph 引用更新
        UpdateReferences --> UpdatePaths[更新路径]
        UpdatePaths --> HandleCrossReference[处理交叉引用]
        HandleCrossReference --> OptimizeImports[优化导入]
    end
    
    subgraph 懒加载实现
        ImplementLazyLoad --> DefinePreloadRule[定义预加载规则]
        DefinePreloadRule --> ImplementOnDemand[实现按需加载]
        ImplementOnDemand --> HandleFailure[处理加载失败]
    end
```
