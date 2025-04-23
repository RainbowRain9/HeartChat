# HeartChat数据库结构图

本文档展示了HeartChat项目的数据库结构，包括各个集合的字段和关系。

## 数据库集合关系图

```mermaid
erDiagram
    users ||--o{ user_profile : "关联"
    users ||--o{ user_base : "关联"
    users ||--o{ user_stats : "关联"
    users ||--o{ user_config : "关联"
    users ||--o{ user_interests : "关联"
    users ||--o{ chats : "创建"
    users ||--o{ emotionRecords : "拥有"
    users ||--o{ userReports : "拥有"
    
    roles ||--o{ chats : "使用"
    roles ||--o{ roleUsage : "记录"
    
    chats ||--o{ messages : "包含"
    
    emotionRecords ||--o{ userReports : "汇总"
    
    user_interests ||--o{ emotionRecords : "关联"
```

## 数据库集合详细结构

### 1. 用户相关集合

#### 1.1 users 集合

```mermaid
classDiagram
    class users {
        _id: String
        _openid: String
        stats: Object
        created_at: Date
        updated_at: Date
    }
    
    class stats {
        openid: String
        session_key: String
        unionid: String
    }
    
    users *-- stats
```

#### 1.2 user_base 集合

```mermaid
classDiagram
    class user_base {
        _id: String
        userId: String
        username: String
        avatar_url: String
        gender: Number
        country: String
        province: String
        city: String
        language: String
        created_at: Date
        updated_at: Date
    }
```

#### 1.3 user_profile 集合

```mermaid
classDiagram
    class user_profile {
        _id: String
        userId: String
        nickname: String
        bio: String
        birthday: Date
        occupation: String
        education: String
        interests: Array
        personality: Object
        created_at: Date
        updated_at: Date
    }
    
    class personality {
        traits: Array
        summary: String
        analysis: String
    }
    
    user_profile *-- personality
```

#### 1.4 user_stats 集合

```mermaid
classDiagram
    class user_stats {
        _id: String
        userId: String
        chat_count: Number
        message_count: Number
        emotion_record_count: Number
        last_active: Date
        created_at: Date
        updated_at: Date
    }
```

#### 1.5 user_config 集合

```mermaid
classDiagram
    class user_config {
        _id: String
        userId: String
        theme: String
        notification: Boolean
        privacy: Object
        created_at: Date
        updated_at: Date
    }
    
    class privacy {
        share_emotion: Boolean
        share_profile: Boolean
        data_collection: Boolean
    }
    
    user_config *-- privacy
```

#### 1.6 user_interests 集合

```mermaid
classDiagram
    class user_interests {
        _id: String
        userId: String
        keywords: Array
        categories: Array
        created_at: Date
        updated_at: Date
    }
    
    class keyword {
        word: String
        weight: Number
        category: String
        emotions: Array
    }
    
    class category {
        name: String
        count: Number
        weight: Number
    }
    
    user_interests *-- keyword
    user_interests *-- category
```

### 2. 角色相关集合

#### 2.1 roles 集合

```mermaid
classDiagram
    class roles {
        _id: String
        name: String
        avatar: String
        description: String
        prompt: String
        system_prompt: String
        category: String
        tags: Array
        creator: String
        is_system: Boolean
        is_public: Boolean
        usage_count: Number
        created_at: Date
        updated_at: Date
    }
```

#### 2.2 roleUsage 集合

```mermaid
classDiagram
    class roleUsage {
        _id: String
        userId: String
        roleId: String
        chat_count: Number
        message_count: Number
        last_used: Date
        created_at: Date
        updated_at: Date
    }
```

### 3. 聊天相关集合

#### 3.1 chats 集合

```mermaid
classDiagram
    class chats {
        _id: String
        userId: String
        roleId: String
        title: String
        last_message: String
        last_message_time: Date
        message_count: Number
        created_at: Date
        updated_at: Date
    }
```

#### 3.2 messages 集合

```mermaid
classDiagram
    class messages {
        _id: String
        chatId: String
        userId: String
        roleId: String
        content: String
        type: String
        sender: String
        timestamp: Date
        emotion_analyzed: Boolean
        created_at: Date
    }
```

### 4. 情感相关集合

#### 4.1 emotionRecords 集合

```mermaid
classDiagram
    class emotionRecords {
        _id: String
        userId: String
        chatId: String
        messageId: String
        text: String
        emotions: Object
        keywords: Array
        analysis: String
        timestamp: Date
        created_at: Date
    }
    
    class emotions {
        joy: Number
        sadness: Number
        anger: Number
        fear: Number
        surprise: Number
        disgust: Number
        neutral: Number
        primary: String
        secondary: String
    }
    
    class keyword {
        word: String
        weight: Number
        emotion: String
    }
    
    emotionRecords *-- emotions
    emotionRecords *-- keyword
```

### 5. 报告相关集合

#### 5.1 userReports 集合

```mermaid
classDiagram
    class userReports {
        _id: String
        userId: String
        date: Date
        type: String
        title: String
        content: String
        emotion_summary: Object
        keyword_summary: Array
        created_at: Date
    }
    
    class emotion_summary {
        primary: String
        distribution: Object
        volatility: Number
        trend: String
    }
    
    class keyword_summary {
        category: String
        keywords: Array
        count: Number
    }
    
    userReports *-- emotion_summary
    userReports *-- keyword_summary
```

## 数据库索引结构

```mermaid
graph TD
    subgraph users集合索引
        UI1[_openid]
        UI2[stats.openid]
        UI3[created_at]
    end
    
    subgraph user_base集合索引
        UBI1[userId]
        UBI2[username]
    end
    
    subgraph user_profile集合索引
        UPI1[userId]
    end
    
    subgraph user_interests集合索引
        UII1[userId]
        UII2[userId + categories.name]
    end
    
    subgraph roles集合索引
        RI1[creator]
        RI2[is_system]
        RI3[is_public]
        RI4[category]
        RI5[usage_count]
    end
    
    subgraph chats集合索引
        CI1[userId]
        CI2[roleId]
        CI3[userId + roleId]
        CI4[last_message_time]
    end
    
    subgraph messages集合索引
        MI1[chatId]
        MI2[userId]
        MI3[timestamp]
        MI4[emotion_analyzed]
    end
    
    subgraph emotionRecords集合索引
        EI1[userId]
        EI2[chatId]
        EI3[messageId]
        EI4[timestamp]
        EI5[userId + timestamp]
    end
    
    subgraph userReports集合索引
        URI1[userId]
        URI2[date]
        URI3[type]
        URI4[userId + date]
    end
```
