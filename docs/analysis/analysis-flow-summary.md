# HeartChat Analysis 云函数流程图概览

## 📋 系统架构流程图

```mermaid
graph TD
    A[客户端调用] --> B[index.js 主入口]
    B --> C{功能类型判断}
    
    C -->|emotion| D[情感分析流程]
    C -->|keywords| E[关键词提取流程]
    C -->|daily_report| F[每日报告生成流程]
    C -->|user_interests| G[用户兴趣分析流程]
    C -->|其他功能| H[其他处理流程]
    
    D --> I[bigmodel.js 智谱AI调用]
    E --> I
    F --> I
    G --> J[userInterestAnalyzer.js]
    H --> I
    
    I --> K[智谱AI API]
    J --> L[keywordClassifier.js]
    J --> M[keywordEmotionLinker.js]
    
    K --> N[返回分析结果]
    L --> N
    M --> N
    N --> O[云数据库存储]
    O --> P[返回客户端]
```

## 🔧 核心模块详细流程

### 1. 情感分析流程

```mermaid
flowchart TD
    A[接收文本分析请求] --> B[参数验证]
    B --> C{验证通过?}
    C -->|否| D[返回错误]
    C -->|是| E[并行处理]
    
    E --> F[情感分析调用]
    E --> G[关键词提取调用]
    
    F --> H[调用智谱AI情感分析]
    G --> I[调用智谱AI关键词提取]
    
    H --> J[解析情感结果]
    I --> K[解析关键词结果]
    
    J --> L[保存情感记录]
    K --> M[关联关键词情感]
    
    L --> N[异步保存数据库]
    M --> O[异步关联处理]
    
    N --> P[返回综合结果]
    O --> P
```

### 2. 用户兴趣分析流程

```mermaid
flowchart TD
    A[接收兴趣分析请求] --> B[参数验证]
    B --> C[获取关键词数据]
    C --> D[获取情感记录]
    
    D --> E[关键词分类处理]
    E --> F[调用分类器]
    F --> G{AI可用?}
    
    G -->|是| H[智谱AI分类]
    G -->|否| I[本地规则分类]
    
    H --> J[分类结果处理]
    I --> J
    
    J --> K[计算类别权重]
    K --> L[权重标准化]
    L --> M[提取关注点]
    M --> N[情感关联分析]
    N --> O[返回分析结果]
```

### 3. 每日报告生成流程

```mermaid
flowchart TD
    A[接收报告生成请求] --> B[参数验证]
    B --> C[检查已存在报告]
    C --> D{已存在且不强制重新生成?}
    
    D -->|是| E[返回现有报告]
    D -->|否| F[查询当天情感记录]
    
    F --> G{有情感记录?}
    G -->|否| H[返回错误]
    G -->|是| I[提取情感数据]
    
    I --> J[统计情感分布]
    J --> K[分析关键词]
    K --> L[分析关注点]
    L --> M[生成AI报告内容]
    
    M --> N{AI生成成功?}
    N -->|是| O[使用AI内容]
    N -->|否| P[使用默认内容]
    
    O --> Q[构建报告数据]
    P --> Q
    
    Q --> R[保存报告]
    R --> S[更新用户兴趣]
    S --> T[返回新报告]
```

## 🗄️ 数据流程图

```mermaid
flowchart LR
    A[用户输入] --> B[情感分析]
    B --> C[关键词提取]
    C --> D[用户兴趣分析]
    D --> E[每日报告生成]
    
    B --> F[emotionRecords集合]
    C --> G[userInterests集合]
    D --> G
    E --> H[userReports集合]
    
    F --> I[数据库]
    G --> I
    H --> I
    
    I --> J[数据统计]
    J --> K[用户画像]
    K --> L[个性化服务]
```

## 🚀 性能优化流程

```mermaid
flowchart TD
    A[请求到达] --> B[参数验证]
    B --> C[并行处理优化]
    
    C --> D[并行AI调用]
    C --> E[并行数据处理]
    
    D --> F[智谱AI调用]
    E --> G[本地数据处理]
    
    F --> H{API调用成功?}
    H -->|是| I[处理AI结果]
    H -->|否| J[本地降级处理]
    
    G --> K[数据处理完成]
    I --> K
    J --> K
    
    K --> L[结果整合]
    L --> M[异步保存]
    M --> N[返回结果]
```

## 📊 错误处理流程

```mermaid
flowchart TD
    A[异常发生] --> B[日志记录]
    B --> C[错误类型判断]
    
    C -->|API错误| D[重试机制]
    C -->|数据错误| E[数据验证]
    C -->|系统错误| F[系统降级]
    
    D --> G{重试成功?}
    G -->|是| H[继续处理]
    G -->|否| I[降级处理]
    
    E --> J{数据可修复?}
    J -->|是| K[数据修复]
    J -->|否| I
    
    F --> I
    K --> H
    I --> L[返回友好错误]
    H --> M[正常流程]
```

## 🔄 模块间调用关系

```mermaid
graph TB
    subgraph "主入口层"
        A[index.js]
    end
    
    subgraph "AI能力层"
        B[bigmodel.js]
    end
    
    subgraph "分析引擎层"
        C[userInterestAnalyzer.js]
        D[keywordClassifier.js]
        E[keywordEmotionLinker.js]
    end
    
    subgraph "数据存储层"
        F[云数据库]
    end
    
    subgraph "外部服务层"
        G[智谱AI API]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    
    C --> B
    C --> D
    C --> E
    
    D --> B
    E --> B
    
    B --> G
    
    A --> F
    C --> F
    E --> F
```

## 📈 数据统计流程

```mermaid
flowchart TD
    A[原始数据] --> B[情感分析]
    B --> C[关键词提取]
    C --> D[用户兴趣统计]
    
    D --> E[关键词分类统计]
    D --> F[情感关联统计]
    D --> G[时间序列统计]
    
    E --> H[类别分布图]
    F --> I[情感关联图]
    G --> J[趋势分析图]
    
    H --> K[用户画像报告]
    I --> K
    J --> K
    
    K --> L[个性化推荐]
    L --> M[情感陪伴服务]
```

---

## 📝 流程特点总结

### 1. **模块化设计**
- 清晰的职责分离
- 松耦合的模块架构
- 易于维护和扩展

### 2. **并行处理**
- 情感分析和关键词提取并行
- 异步数据保存和处理
- 提高响应速度

### 3. **容错机制**
- 多重错误处理策略
- 优雅降级方案
- 系统稳定性保障

### 4. **数据驱动**
- 基于数据的决策流程
- 统计分析和用户画像
- 个性化服务能力

### 5. **性能优化**
- 缓存策略应用
- 资源使用优化
- 响应时间控制

这些流程图展示了 HeartChat Analysis 云函数的完整实现逻辑，为开发团队提供了清晰的技术文档和指导。