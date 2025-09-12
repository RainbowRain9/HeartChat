# Analysis 云函数模块详细流程图

## 目录
1. [BigModel 模块流程图](#bigmodel-模块流程图)
2. [KeywordClassifier 模块流程图](#keywordclassifier-模块流程图)
3. [UserInterestAnalyzer 模块流程图](#userinterestanalyzer-模块流程图)
4. [KeywordEmotionLinker 模块流程图](#keywordemotionlinker-模块流程图)
5. [错误处理流程图](#错误处理流程图)

---

## BigModel 模块流程图

### 情感分析详细流程
```mermaid
graph TD
    subgraph "BigModel 情感分析详细流程"
        A[analyzeEmotion函数调用] --> B[验证text参数]
        B --> C{参数有效?}
        
        C -->|否| D[返回参数错误]
        C -->|是| E[构建messages数组]
        
        E --> F[添加system提示词<br>详细的情感分析指令]
        E --> G{有历史消息?}
        
        G -->|是| H[添加最多5条历史消息<br>作为上下文]
        G -->|否| I[跳过历史消息]
        
        H --> J[添加当前用户消息]
        I --> J
        
        J --> K[调用智谱AI API<br>GLM-4-Flash模型]
        K --> L{API调用成功?}
        
        L -->|失败| M[返回API错误]
        L -->|成功| N[解析choices[0].message.content]
        
        N --> O{JSON解析成功?}
        
        O -->|失败| P[返回解析错误]
        O -->|成功| Q[标准化返回结果]
        
        Q --> R[兼容旧版字段映射]
        R --> S[添加新字段支持]
        S --> T[返回完整情感分析对象]
        
        M --> U[返回错误对象]
        P --> U
        D --> U
    end
    
    style F fill:#f3e5f5
    style Q fill:#fff3e0
    style T fill:#e1f5fe
```

### 词向量获取流程
```mermaid
graph TD
    subgraph "BigModel 词向量获取流程"
        A[getEmbeddings函数调用] --> B[验证texts数组]
        B --> C{数组有效?}
        
        C -->|否| D[返回参数错误]
        C -->|是| E{ZHIPU_API_KEY存在?}
        
        E -->|否| F[生成本地模拟向量<br>1536维伪随机向量]
        E -->|是| G[调用智谱AI embeddings接口<br>embedding-3模型]
        
        F --> H[向量归一化处理]
        G --> I{API调用成功?}
        
        I -->|失败| J[降级到本地模拟向量]
        I -->|成功| K[提取embedding数据]
        
        H --> L[返回模拟向量结果<br>标记source: local]
        J --> M[生成模拟向量<br>标记source: local_fallback]
        K --> N[返回API向量结果<br>标记source: api]
        
        D --> O[返回错误]
        L --> P[成功返回]
        M --> P
        N --> P
    end
    
    style F fill:#fff3e0
    style G fill:#f3e5f5
    style J fill:#ffe0b2
    style P fill:#e1f5fe
```

---

## KeywordClassifier 模块流程图

### 批量关键词分类流程
```mermaid
graph TD
    subgraph "KeywordClassifier 批量分类流程"
        A[batchClassifyKeywords调用] --> B[验证keywords数组]
        B --> C{数组有效?}
        
        C -->|否| D[返回空数组]
        C -->|是| E[去重处理]
        
        E --> F{ZHIPU_API_KEY存在?}
        
        F -->|否| G[本地规则分类]
        F -->|是| H[构建分类提示词]
        
        G --> I[遍历每个关键词]
        H --> J[调用智谱AI chatCompletion]
        
        I --> K[检查细分类别映射<br>SUBCATEGORIES]
        K --> L{找到匹配类别?}
        
        L -->|是| M[使用匹配类别]
        L -->|否| N[简单规则匹配]
        
        N --> O{规则匹配成功?}
        
        O -->|是| P[使用规则类别]
        O -->|否| Q[默认类别: 其他]
        
        M --> R[添加到分类结果]
        P --> R
        Q --> R
        
        J --> S{AI调用成功?}
        S -->|失败| T[降级到本地分类]
        S -->|成功| U[解析JSON响应]
        
        U --> V{JSON解析成功?}
        V -->|失败| W[降级到本地分类]
        V -->|成功| X[返回AI分类结果]
        
        T --> G
        W --> G
        
        R --> Y[完成所有关键词分类]
        X --> Z[返回分类结果]
        Y --> AA[返回本地分类结果]
        
        D --> AB[结束]
        Z --> AB
        AA --> AB
    end
    
    style K fill:#e8f5e8
    style J fill:#f3e5f5
    style T fill:#ffe0b2
    style X fill:#e1f5fe
```

### 细分类别映射规则
```mermaid
graph TD
    subgraph "细分类别映射规则"
        A[学习类] --> A1[考试、课程、学位、研究、论文]
        A --> A2[知识、学校、教育、学习方法、学科]
        
        B[工作类] --> B1[职业、事业、职场、同事、上司]
        B --> B2[晋升、薪资、求职、面试]
        
        C[娱乐类] --> C1[休闲、放松、爱好、兴趣]
        C --> C2[消遣、玩乐、娱乐活动]
        
        D[社交类] --> D1[朋友、社交圈、人际交往]
        D --> D2[社交活动、聚会、交友]
        
        E[健康类] --> E1[身体健康、心理健康、锻炼]
        E --> E2[饮食、睡眠、医疗、疾病]
        
        F[心理类] --> F1[心理健康、情绪管理、心理咨询]
        F --> F2[心理疗法、心理学、自我认知]
        
        G[自我提升类] --> G1[个人成长、自我发展、技能提升]
        G --> G2[目标设定、习惯养成、自律]
        
        H[时间管理类] --> H1[效率提升、任务规划、时间分配]
        H --> H2[优先级设定、拖延症克服]
        
        I[压力缓解类] --> I1[减压方法、压力源识别]
        I --> I2[放松技巧、冥想、压力管理]
        
        J[人际关系类] --> J1[人际交往、沟通技巧]
        J --> J2[冲突处理、关系维护]
        
        style A fill:#e3f2fd
        style B fill:#e3f2fd
        style C fill:#e3f2fd
        style D fill:#e3f2fd
        style E fill:#e3f2fd
        style F fill:#f3e5f5
        style G fill:#f3e5f5
        style H fill:#f3e5f5
        style I fill:#f3e5f5
        style J fill:#f3e5f5
    end
```

---

## UserInterestAnalyzer 模块流程图

### 兴趣分析主流程
```mermaid
graph TD
    subgraph "UserInterestAnalyzer 主流程"
        A[analyzeUserInterests调用] --> B[验证keywords数组]
        B --> C{数组有效?}
        
        C -->|否| D[返回错误]
        C -->|是| E[调用classifyKeywords]
        
        E --> F{关键词分类成功?}
        F -->|否| G[使用默认分类<br>category: 其他]
        F -->|是| H[获得分类结果]
        
        G --> I[calculateCategoryWeights]
        H --> I
        
        I --> J[normalizeWeights<br>计算百分比]
        J --> K[extractFocusPoints<br>取前5个主要类别]
        K --> L[analyzeEmotionalAssociations]
        
        L --> M[构建完整分析结果]
        M --> N[返回成功结果]
        
        D --> O[返回错误结果]
    end
    
    style E fill:#fff3e0
    style L fill:#e8f5e8
    style N fill:#e1f5fe
```

### 情感关联分析流程
```mermaid
graph TD
    subgraph "情感关联分析流程"
        A[analyzeEmotionalAssociations] --> B{有emotionRecords?}
        
        B -->|否| C[返回空关联结果]
        B -->|是| D[初始化情感极性映射]
        
        D --> E[遍历emotionRecords]
        E --> F[提取emotionType和polarity]
        F --> G[提取keywords]
        G --> H[遍历keywords]
        
        H --> I[构建keywordEmotionMap]
        I --> J[统计positive/negative/count]
        J --> K{所有记录处理完?}
        
        K -->|否| E
        K -->|是| L[筛选关联强度>0.6的关键词]
        
        L --> M[按关联强度排序]
        M --> N[返回top 5 positive/negative关联]
        
        C --> O[结束]
        N --> O
    end
    
    style D fill:#fff3e0
    style L fill:#e8f5e8
    style N fill:#e1f5fe
```

---

## KeywordEmotionLinker 模块流程图

### 关键词情感关联流程
```mermaid
graph TD
    subgraph "关键词情感关联流程"
        A[linkKeywordsToEmotion调用] --> B[验证参数完整性]
        B --> C{参数有效?}
        
        C -->|否| D[返回false]
        C -->|是| E[calculateEmotionScore]
        
        E --> F[查询userInterests记录]
        F --> G{找到用户记录?}
        
        G -->|否| H[返回false]
        G -->|是| I[提取existingKeywords]
        
        I --> J[遍历keywords]
        J --> K[查找匹配的existingKeyword]
        K --> L{找到匹配?}
        
        L -->|否| M[跳过当前关键词]
        L -->|是| N[计算新的emotionScore<br>加权平均: 70%当前 + 30%新值]
        
        N --> O[更新数据库字段]
        O --> P{更新成功?}
        
        P -->|是| Q[updateCount++]
        P -->|否| R[记录更新失败]
        
        M --> S{所有关键词处理完?}
        Q --> S
        R --> S
        
        S -->|否| J
        S -->|是| T{updateCount > 0?}
        
        T -->|是| U[返回true]
        T -->|否| V[返回false]
        
        D --> W[结束]
        H --> W
        U --> W
        V --> W
    end
    
    style E fill:#fff3e0
    style O fill:#e8f5e8
    style U fill:#e1f5fe
```

### 情感分数计算流程
```mermaid
graph TD
    subgraph "情感分数计算流程"
        A[calculateEmotionScore] --> B{有直接score字段?}
        
        B -->|是| C[返回score值<br>限制在-1到1之间]
        B -->|否| D[提取type和intensity]
        
        D --> E{有type?}
        E -->|否| F[返回0]
        E -->|是| G[查找emotionScores映射]
        
        G --> H{找到映射?}
        H -->|否| I[使用基础分数0]
        H -->|是| J[使用映射的基础分数]
        
        I --> K[返回0]
        J --> L[基础分数 × intensity]
        L --> M[返回计算结果]
        
        C --> N[返回结果]
        K --> N
        M --> N
    end
    
    style G fill:#fff3e0
    style L fill:#e8f5e8
    style N fill:#e1f5fe
```

---

## 错误处理流程图

### 统一错误处理流程
```mermaid
graph TD
    subgraph "统一错误处理流程"
        A[函数调用] --> B[try-catch包装]
        B --> C{异常发生?}
        
        C -->|否| D[正常执行流程]
        C -->|是| E[捕获异常]
        
        D --> F[返回成功结果]
        E --> G[console.error错误日志]
        
        G --> H[判断错误类型]
        H --> I[API调用错误]
        H --> J[参数验证错误]
        H --> K[数据库操作错误]
        H --> L[JSON解析错误]
        H --> M[其他未知错误]
        
        I --> N[返回API错误信息]
        J --> O[返回参数错误信息]
        K --> P[返回数据库错误信息]
        L --> Q[返回解析错误信息]
        M --> R[返回通用错误信息]
        
        N --> S[返回统一错误格式]
        O --> S
        P --> S
        Q --> S
        R --> S
        
        F --> T[结束]
        S --> T
    end
    
    style G fill:#ffebee
    style H fill:#fff3e0
    style S fill:#f44336
```

### 降级策略流程
```mermaid
graph TD
    subgraph "降级策略流程"
        A[主要功能调用] --> B{AI服务可用?}
        
        B -->|是| C[使用AI服务]
        B -->|否| D[启动降级机制]
        
        C --> E{AI调用成功?}
        E -->|是| F[返回AI结果]
        E -->|否| D
        
        D --> G[本地算法替代]
        G --> H[模拟数据生成]
        H --> I[默认值使用]
        
        I --> J[缓存数据读取]
        J --> K{降级成功?}
        
        K -->|是| L[返回降级结果]
        K -->|否| M[返回错误但标记为降级]
        
        F --> N[成功返回]
        L --> N
        M --> O[返回错误]
    end
    
    style D fill:#fff3e0
    style G fill:#fff3e0
    style L fill:#ffe0b2
    style M fill:#ffcdd2
```

### 数据验证流程
```mermaid
graph TD
    subgraph "数据验证流程"
        A[接收输入数据] --> B[类型检查]
        B --> C{类型正确?}
        
        C -->|否| D[返回类型错误]
        C -->|是| E[空值检查]
        
        E --> F{值有效?}
        F -->|否| G[返回空值错误]
        F -->|是| H[范围检查]
        
        H --> I{在有效范围内?}
        I -->|否| J[返回范围错误]
        I -->|是| K[格式检查]
        
        K --> L{格式正确?}
        L -->|否| M[返回格式错误]
        L -->|是| N[数据验证通过]
        
        D --> O[返回验证失败]
        G --> O
        J --> O
        M --> O
        
        N --> P[继续处理]
        O --> Q[结束]
    end
    
    style B fill:#e8f5e8
    style H fill:#e8f5e8
    style K fill:#e8f5e8
    style N fill:#4caf50
```

---

## 性能优化流程

### 并行处理流程
```mermaid
graph TD
    subgraph "并行处理流程"
        A[主函数调用] --> B[识别可并行操作]
        B --> C[构建Promise.all数组]
        
        C --> D[Promise1: 情感分析]
        C --> E[Promise2: 关键词提取]
        C --> F[Promise3: 数据库查询]
        
        D --> G[AI调用]
        E --> H[AI调用]
        F --> I[数据库操作]
        
        G --> J[完成Promise1]
        H --> K[完成Promise2]
        I --> L[完成Promise3]
        
        J --> M[等待所有Promise完成]
        K --> M
        L --> M
        
        M --> N[汇总所有结果]
        N --> O[处理依赖关系]
        O --> P[返回最终结果]
    end
    
    style D fill:#f3e5f5
    style E fill:#f3e5f5
    style F fill:#e8f5e8
    style M fill:#4caf50
```

### 缓存策略流程
```mermaid
graph TD
    subgraph "缓存策略流程"
        A[请求处理] --> B{需要缓存数据?}
        
        B -->|否| C[直接处理请求]
        B -->|是| D[检查缓存]
        
        C --> E[返回结果]
        D --> F{缓存命中?}
        
        F -->|是| G{缓存有效?}
        F -->|否| H[处理请求]
        
        G -->|是| I[返回缓存数据]
        G -->|否| H
        
        H --> J[处理数据]
        J --> K[更新缓存]
        K --> L[返回新数据]
        
        E --> M[结束]
        I --> M
        L --> M
    end
    
    style D fill:#fff3e0
    style G fill:#4caf50
    style K fill:#e8f5e8
```

这些流程图详细展示了 analysis 云函数中各个模块的具体处理逻辑，包括错误处理、降级策略、数据验证和性能优化等方面的实现细节。