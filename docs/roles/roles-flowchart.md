```mermaid
graph TD
    A[roles 云函数入口] --> B{根据 event.action 分发};

    B --> CRUD[基础角色管理];
    B --> STATS[使用统计];
    B --> PROMPT[提示词生成];
    B --> MEMORY[记忆管理];
    B --> PERCEPTION[用户画像];

    subgraph 基础角色管理
        CRUD --> getRoles[getRoles: 查询 roles];
        CRUD --> getRoleDetail[getRoleDetail: 查询 roles];
        CRUD --> createRole[createRole: 写入 roles];
        CRUD --> updateRole[updateRole: 更新 roles];
        CRUD --> deleteRole[deleteRole: 删除 roles];
    end

    subgraph 使用统计
        STATS --> updateUsage[updateUsage: 读/写 roleUsage];
        STATS --> getMessageStats[getMessageStats: 聚合查询 chats/messages];
    end

    subgraph 提示词生成 (generatePrompt)
        PROMPT --> P1[查询 roles 获取角色信息];
        P1 --> P2[promptGenerator.generateBasePrompt];
        P2 --> P3[memoryManager.getRelevantMemories];
        P3 --> P4[promptGenerator.generatePromptWithMemories];
        P4 --> P5[获取角色自身的 user_perception];
        P5 --> P6[promptGenerator.generatePromptWithUserPerception];
        P6 --> P7[更新 roles 的 system_prompt];
        P7 --> P8[返回最终提示词];
    end

    subgraph 记忆管理
        MEMORY --> M1[extractMemories: 从对话提取记忆];
        M1 --> M2[memoryManager.extractMemoriesFromChat];
        M2 --> M3[memoryManager.updateRoleMemories];
        M3 --> M4[更新 roles 的 memories 字段];
        MEMORY --> M5[getRelevantMemories: 获取相关记忆];
        M5 --> M6[memoryManager.getRelevantMemories];
    end

    subgraph 用户画像
        PERCEPTION --> UP1[updateUserPerception: 更新用户画像];
        UP1 --> UP2[userPerception.analyzeUserPerception];
        UP2 --> UP3[userPerception.updateRoleUserPerception];
        UP3 --> UP4[更新 roles 的 user_perception 字段];
        PERCEPTION --> UP5[getUserPerceptionSummary: 获取摘要];
        UP5 --> UP6[userPerception.generateUserPerceptionSummary];
    end
```