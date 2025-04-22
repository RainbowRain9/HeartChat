> 本文由 [简悦 SimpRead](http://ksria.com/simpread/) 转码， 原文地址 [docs.cloudbase.net](https://docs.cloudbase.net/ai/miniprogram-using)

> 云开发 AI+ 无缝接入 DeepSeek + 混元双模型开发智能体，支持小程序、h5、公众号、微信客服等场景

提示

云开发 AI+ 无缝接入 DeepSeek + 混元双模型开发智能体，支持小程序、h5、公众号、微信客服等场景

新用户首月免费体验，并赠送 100 万 token

立即体验云开发平台 AI 能力，点击查看 [完整指引](https://docs.cloudbase.net/ai/quickstart)

本文介绍 **小程序** 如何快速接入 **云开发 AI**（满血版 DeepSeek）能力

解锁云开发平台更多 AI 核心能力，**智能问答机器人、企业知识库 AI 化、微信平台客服 AI 化** 点击查看 [快速指引](https://docs.cloudbase.net/ai/quickstart)

准备工作[​](#准备工作 "准备工作的直接链接")
--------------------------

*   注册一个微信小程序账号，并且创建本地小程序工程项目
*   小程序基础库需要在 3.7.1 及以上版本，具备 `wx.cloud.extend.AI` 对象
*   小程序需要开通「云开发」，可在小程序开发工具中点击工具栏里的「云开发」按钮进行开通，并创建环境（PS：对于首次使用云开发的用户，第一个月套餐免费）：
    *   ![](https://cloudcache.tencent-cloud.com/qcloud/ui/static/static_source_business/3103c75d-07f3-4085-aac3-30840942acb1.png)

指引一：调用大模型，实现文本生成[​](#指引一调用大模型实现文本生成 "指引一：调用大模型，实现文本生成的直接链接")
------------------------------------------------------------

在小程序中，直接调用大模型的文本生成能力，实现最简单的文本生成。 这里以一个 “七言绝句” 生成器的简单 Demo 为例：

### 第 1 步：初始化云开发环境[​](#第-1-步初始化云开发环境 "第 1 步：初始化云开发环境的直接链接")

在小程序代码中，通过以下代码进行云开发环境初始化：

```
wx.cloud.init({
  env: "<云开发环境ID>",
});


```

其中 `"<云开发环境ID>"` 需替换为实际云开发环境 ID。初始化成功后，就可使用 `wx.cloud.extend.AI` 调用 AI 能力。

### 第 2 步： 创建 AI 模型，并调用生成文本[​](#第-2-步-创建-ai-模型并调用生成文本 "第 2 步： 创建 AI 模型，并调用生成文本的直接链接")

在小程序基础库 3.7.1 及以上，以调用 DeepSeek-R1 模型为例，小程序端的代码如下：

```
const model = wx.cloud.extend.AI.createModel("deepseek");


const systemPrompt =
  "请严格按照七言绝句或七言律诗的格律要求创作，平仄需符合规则，押韵要和谐自然，韵脚字需在同一韵部。创作内容围绕用户给定的主题，七言绝句共四句，每句七个字；七言律诗共八句，每句七个字，颔联和颈联需对仗工整。同时，要融入生动的意象、丰富的情感与优美的意境，展现出古诗词的韵味与美感。";


const userInput = "帮我写一首赞美玉龙雪山的诗";


const res = await model.streamText({
  data: {
    model: "deepseek-r1", 
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput },
    ],
  },
});



for await (let str of res.textStream) {
  console.log(str);
}






```

可见，仅需几行小程序代码，就可以通过云开发直接调用大模型的文本生成能力。

指引二：通过 Agent（智能体）实现智能对话[​](#指引二通过-agent智能体实现智能对话 "指引二：通过 Agent（智能体）实现智能对话的直接链接")
--------------------------------------------------------------------------------

通过调用大模型的文本生成接口，可以快速实现一问一答的场景。但对于一个完整的对话功能来说，仅仅有一个大模型的输入、输出还不够，还需要把大模型变为完整的 Agent，才能更好地与用户进行对话。

云开发的 AI 能力不仅提供了原始的大模型接入，还提供了 Agent 接入的能力，开发者可以在云开发上定义自己的 Agent，然后通过小程序直接调用 Agent 进行对话。

### 第 1 步：初始化云开发环境[​](#第-1-步初始化云开发环境-1 "第 1 步：初始化云开发环境的直接链接")

在小程序代码中，通过以下代码进行云开发环境初始化：

```
wx.cloud.init({
  env: "<云开发环境ID>",
});


```

其中 `"<云开发环境 ID>"` 需替换为实际云开发环境 ID。初始化成功后，就可使用 `wx.cloud.extend.AI` 调用 AI 能力。

### 第 2 步：创建一个 Agent[​](#第-2-步创建一个-agent "第 2 步：创建一个 Agent的直接链接")

进入[云开发平台 - AI+](https://tcb.cloud.tencent.com/dev?#/ai?tab=agent)，创建一个新的 Agent。

![](https://cloudcache.tencent-cloud.com/qcloud/ui/static/static_source_business/4b259b54-f1f4-4ca3-b9e5-f96d49de0bf3.png)

这里可以选择模板创建，也可以自行输入提示词和欢迎语，创建一个自定义的 Agent。 为了简单，我们直接创建一个模板：

![](https://cloudcache.tencent-cloud.com/qcloud/ui/static/static_source_business/77524bf8-2ec3-403a-b12f-416ee33df6d4.png)

点击页面中上方的 “复制 ID”，我们会获得一个 `bot-id`，即 Agent 的唯一标识，在下面的代码中会用到。

### 第 3 步：在小程序中实现与 Agent 的对话[​](#第-3-步在小程序中实现与-agent-的对话 "第 3 步：在小程序中实现与 Agent 的对话的直接链接")

刚才创建了一个 “小程序开发专家” 的 Agent 智能体，下面来试试与它进行对话，看他能不能处理云开发常见的报错问题。 在小程序中，使用以下代码直接调用刚刚我们创建的 Agent，进行对话：

```
wx.cloud.init({
  env: "<云开发环境ID>",
});


const userInput =
  "我的小程序这个报错是什么意思：FunctionName parameter could not be found";

const res = await wx.cloud.extend.AI.bot.sendMessage({
  data: {
    botId: "xxx-bot-id", 
    msg: userInput, 
    history: [], 
  },
});
for await (let x of res.textStream) {
  console.log(x);
}










```

我们也可以把对话内容记录下来，重复调用 Agent 的接口，从而实现多轮对话

```
const res = await wx.cloud.extend.AI.bot.sendMessage({
  data: {
    botId: "xxx-bot-id", 
    msg: userInput,  
    history: [
      { role: "user", message: "我这个报错是什么意思？……"},
      { role: "bot", message: "### 报错解释……" },
      { role: "user"，message: "那我要如何操作来修复呢？" }
      
    ]
  },
});


```

### 第 4 步：实现更加丰富的聊天功能[​](#第-4-步实现更加丰富的聊天功能 "第 4 步：实现更加丰富的聊天功能的直接链接")

云开发在 SDK 中提供了一整套接入 Agent（智能体）的 API 接口，包括基础对话、对话历史保存、对话反馈收集、次轮问题推荐等。

小程序开发者可在[云开发平台](https://tcb.cloud.tencent.com/dev?#/ai?tab=agent)中创建 Agent，然后在小程序前端代码中直接调用 `wx.cloud.extend.AI` 下的各类接口直接与 Agent 进行交互，包含：

*   获取聊天记录
*   发送、获取用户反馈
*   获取推荐次轮问题

下面是一些代码示例：

#### 获取聊天记录[​](#获取聊天记录 "获取聊天记录的直接链接")

```
await wx.cloud.extend.AI.bot.getChatRecords({
  botId: "botId-xxx",
  pageNumber: 1,
  pageSize: 10,
  sort: "asc",
});


```

传入 botId、分页信息和排序方式，获取指定 Agent 的聊天记录。

#### 发送反馈与获取反馈[​](#发送反馈与获取反馈 "发送反馈与获取反馈的直接链接")

发送用户反馈：

```
const res = await wx.cloud.extend.AI.bot.sendFeedback({
  userFeedback: {
    botId: "botId-xxx",
    recordId: "recordId-xxx",
    comment: "非常棒",
    rating: 5,
    tags: ["优美"],
    aiAnswer: "落英缤纷",
    input: "来个成语",
    type: "upvote",
  },
});


```

#### 获取次轮推荐问题[​](#获取次轮推荐问题 "获取次轮推荐问题的直接链接")

```
const res = await wx.cloud.extend.AI.bot.getRecommendQuestions({
  data: {
    botId: "xxx-bot-id",
    msg: "介绍一下 Python 语言",
  },
});
for await (let x of res.textStream) {
  console.log(x);
}


```

在 `data` 参数中设置 `botId` 和用户消息 `msg`，通过遍历 `textStream` 获取推荐问题。

指引三：使用云开发 AI 对话组件，快速接入 AI 对话[​](#指引三使用云开发-ai-对话组件快速接入-ai-对话 "指引三：使用云开发 AI 对话组件，快速接入 AI 对话的直接链接")
------------------------------------------------------------------------------------------------

为了方便开发者快速在自己的小程序里实现 AI 对话功能，云开发提供了一个 AI 对话的小程序源码组件供开发者直接使用，效果如下图：

![](https://qcloudimg.tencent-cloud.cn/raw/774362c0a4b9b61169e25c745cf0b7d2.png)

### 第 1 步：下载组件包[​](#第-1-步下载组件包 "第 1 步：下载组件包的直接链接")

方式一：直接下载组件包（[https://gitee.com/TencentCloudBase/cloudbase-agent-ui/tree/dev/apps/miniprogram-agent-ui](https://gitee.com/TencentCloudBase/cloudbase-agent-ui/tree/dev/apps/miniprogram-agent-ui)），包含 agent-ui 全码组件和使用指引

方式二：通过微信开发者工具创建 agent-ui 组件模板，根据指引配置使用

![](https://qcloudimg.tencent-cloud.cn/raw/9e7ce66913a90131071d84b3b8117635.png)

### 第 2 步：引入组件到自己的小程序项目[​](#第-2-步引入组件到自己的小程序项目 "第 2 步：引入组件到自己的小程序项目的直接链接")

1.  拷贝 miniprogram/components/agent-ui 组件到小程序中

![](https://qcloudimg.tencent-cloud.cn/raw/2fb0ff731e5fbded35b970589c9ec89d.png)

2.  在页面 index.json 配置文件中注册组件

```
{
  "usingComponents": {
    "agent-ui":"/components/agent-ui/index"
  },
}


```

3.  在页面 index.wxml 文件中使用组件

```
<view>
  <agent-ui agentConfig="{{agentConfig}}" showBotAvatar="{{showBotAvatar}}" chatMode="{{chatMode}}" modelConfig="{{modelConfig}}"></agent-ui>
</view>


```

4.  在页面 index.js 文件中编写配置

对接 Agent ：

```
 data: {
    chatMode: "bot", 
    showBotAvatar: true, 
    agentConfig: {
      botId: "bot-e7d1e736", 
      allowWebSearch: true, 
      allowUploadFile: true, 
      allowPullRefresh: true, 
      allowUploadImage: true 
    }
  }


```

对接大模型：

```
  data: {
    chatMode: "model", 
    showBotAvatar: true, 
    modelConfig: {
      modelProvider: "hunyuan-open", 
      quickResponseModel: "hunyuan-lite", 
      logo: "", 
      welcomeMsg: "欢迎语", 
    },
  }


```

### 第 3 步：初始化云开发环境[​](#第-3-步初始化云开发环境 "第 3 步：初始化云开发环境的直接链接")

在 app.js 中，onLauch 生命周期内，初始化 sdk

```
   
   App({
     onLaunch: function () {
       wx.cloud.init({
         env: "<云开发环境ID>",
       });
     },
   });


```

随后便可以直接在页面中使用 AI 对话组件了：

![](https://qcloudimg.tencent-cloud.cn/raw/a1b717e5ab264d89977f564aecb9c30c.png)

总结[​](#总结 "总结的直接链接")
--------------------

这篇文章一共介绍了云开发的以下三种方式接入大模型，分别适用于不同的场景：

1.  通过 SDK 直接调用大模型：适用于非对话类的通用场景，如文本生成、智能补全、智能翻译等。
2.  通过 SDK 调用 Agent（智能体）对话能力：这种方式适合专门的 AI 对话场景，支持配置欢迎语、提示词、知识库等对话中需要的能力。
3.  使用 AI 对话组件：这种方式对于专业前端开发者更友好，可以基于云开发提供的 UI 组件，快速在小程序中植入 AI 对话能力。

以上的三种小程序接入 AI 的方式，云开发将完整的代码示例放在了代码仓库中，供大家参考：

*   Gitee：[https://gitee.com/TencentCloudBase/cloudbase-ai-example](https://gitee.com/TencentCloudBase/cloudbase-ai-example)
*   Github：[https://github.com/TencentCloudBase/cloudbase-ai-example](https://github.com/TencentCloudBase/cloudbase-ai-example)

当然，不只是小程序，云开发的 AI 能力也支持通过 Web 应用、Node.js、 HTTP API 来对大模型进行调用，可以参考以下文档：

*   Web 应用接入：[https://docs.cloudbase.net/ai/sdk-reference/init](https://docs.cloudbase.net/ai/sdk-reference/init)
*   Node.js 接入：[https://docs.cloudbase.net/ai/sdk-reference/init](https://docs.cloudbase.net/ai/sdk-reference/init)
*   HTTP API 接入：[https://docs.cloudbase.net/http-api/ai-bot/ai-agent-%E6%8E%A5%E5%85%A5](https://docs.cloudbase.net/http-api/ai-bot/ai-agent-%E6%8E%A5%E5%85%A5)

提示

解锁云开发平台更多 AI 核心能力，点击查看 [快速指引](https://docs.cloudbase.net/ai/quickstart)

未来，云开发计划推出更多的 AI 能力，如 Tool Calling（工具调用）、多 Agent 串联、工作流编排等，敬请期待，可访问以下内容获取更多信息：

*   腾讯云开发主页：[https://tcb.cloud.tencent.com/](https://tcb.cloud.tencent.com/)
*   云开发官方文档：[https://docs.cloudbase.net/](https://docs.cloudbase.net/)
*   云开发 Agent 能力用户交流群：
    *   ![](https://cloudcache.tencent-cloud.com/qcloud/ui/static/static_source_business/c14f5766-59cf-4d98-acda-0b83eb501da8.png)