
云函数2.0中使用需在对应云函数目录下安装 @cloudbase/node-sdk 3.7.0 以上的版本

#### 安装依赖

在创建云函数2.0时会在云函数2.0目录下默认新建一个 package.json 并提示用户是否立即本地安装依赖。请注意云函数2.0的运行环境是 Node.js，因此在本地安装依赖时务必保证已安装 Node.js，同时 node 和 npm 都在环境变量中。如不本地安装依赖，可以用命令行在该目录下运行：

```
npm install --save @cloudbase/node-sdk@3.7
```

#### 初始化和使用 SDK

在云函数2.0中调用数据模型 SDK 之前，需要执行一次初始化方法：

```
const cloudbase = require("@cloudbase/node-sdk");

exports.main = async (event, context) => {
    // 指定云开发环境 ID
    const app = cloudbase.init({
      context: context,
      env: "some-env-id",  // 不传 'env' 时调用当前环境
    });

    const models = app.models;
    // 接下来就可以调用 models 上的数据模型增删改查等方法了
    // models.post.create({
    //  data: {
    //    body: "你好，世界👋\n\nfrom china",
    //    title: "你好，世界👋",
    //    slug: "hello-world-cn",
    //  },
    // }).then(({ data } => { console.log(data)}))
};
```

创建单条数据

```
const { data } = await models.ai_bot_chat_history_5hobd2b.create({
  data: {
      role: "文本",  // 角色
      need_async_reply: true,  // 是否异步回复
      type: "文本",  // 消息类型
      content: "<p>文本内容</p>",  // 内容
      recommend_questions: [],  // 推荐问题
      reply_to: "文本",  // 被回复的消息id
      event: "文本",  // 事件类型
      reply: "文本",  // 回复的消息id
      bot_id: "文本",  // 智能体ID
      conversation: "文本",  // 会话
      origin_msg: "多行文本",  // 原始消息内容
      image: "https://main.qcloudimg.com/raw/c85c9a875e9754545ee19f20438b2caa.svg",  // 图片地址
      trace_id: "文本",  // 请求 id
      record_id: "文本",  // 对话记录ID
      trigger_src: "文本",  // 来源
      sender: "文本",  // 发送者
      async_reply: "<p>文本内容</p>",  // 异步回复内容
    },
  // envType: pre 体验环境， prod 正式环境
  envType: "pre",
});

// 返回创建的数据 id
console.log(data);
// { id: "7d8ff72c665eb6c30243b6313aa8539e"}
```

详细用法可参考: 

创建多条数据

```
const { data } = await models.ai_bot_chat_history_5hobd2b.createMany({
  data: [
    {
        role: "文本",  // 角色
        need_async_reply: true,  // 是否异步回复
        type: "文本",  // 消息类型
        content: "<p>文本内容</p>",  // 内容
        recommend_questions: [],  // 推荐问题
        reply_to: "文本",  // 被回复的消息id
        event: "文本",  // 事件类型
        reply: "文本",  // 回复的消息id
        bot_id: "文本",  // 智能体ID
        conversation: "文本",  // 会话
        origin_msg: "多行文本",  // 原始消息内容
        image: "https://main.qcloudimg.com/raw/c85c9a875e9754545ee19f20438b2caa.svg",  // 图片地址
        trace_id: "文本",  // 请求 id
        record_id: "文本",  // 对话记录ID
        trigger_src: "文本",  // 来源
        sender: "文本",  // 发送者
        async_reply: "<p>文本内容</p>",  // 异步回复内容
      },
    {
        role: "文本",  // 角色
        need_async_reply: true,  // 是否异步回复
        type: "文本",  // 消息类型
        content: "<p>文本内容</p>",  // 内容
        recommend_questions: [],  // 推荐问题
        reply_to: "文本",  // 被回复的消息id
        event: "文本",  // 事件类型
        reply: "文本",  // 回复的消息id
        bot_id: "文本",  // 智能体ID
        conversation: "文本",  // 会话
        origin_msg: "多行文本",  // 原始消息内容
        image: "https://main.qcloudimg.com/raw/c85c9a875e9754545ee19f20438b2caa.svg",  // 图片地址
        trace_id: "文本",  // 请求 id
        record_id: "文本",  // 对话记录ID
        trigger_src: "文本",  // 来源
        sender: "文本",  // 发送者
        async_reply: "<p>文本内容</p>",  // 异步回复内容
      },
  ],
  // envType: pre 体验环境， prod 正式环境
  envType: "pre",
});

// 返回创建的数据 idList
console.log(data);
// {
//   "idList": [
//     "7d8ff72c665ebe5c02442a1a7b29685e",
//     "7d8ff72c665ebe5c02442a1b77feba4b",
//     "7d8ff72c665ebe5c02442a1c48263dc6",
//     "7d8ff72c665ebe5c02442a1d53c311b0"
//   ]
// }
```

详细用法可参考: 

更新单条数据

```
const { data } = await models.ai_bot_chat_history_5hobd2b.update({
  data: {
      role: "文本",  // 角色
      need_async_reply: true,  // 是否异步回复
      type: "文本",  // 消息类型
      content: "<p>文本内容</p>",  // 内容
      recommend_questions: [],  // 推荐问题
      reply_to: "文本",  // 被回复的消息id
      event: "文本",  // 事件类型
      reply: "文本",  // 回复的消息id
      bot_id: "文本",  // 智能体ID
      conversation: "文本",  // 会话
      origin_msg: "多行文本",  // 原始消息内容
      image: "https://main.qcloudimg.com/raw/c85c9a875e9754545ee19f20438b2caa.svg",  // 图片地址
      trace_id: "文本",  // 请求 id
      record_id: "文本",  // 对话记录ID
      trigger_src: "文本",  // 来源
      sender: "文本",  // 发送者
      async_reply: "<p>文本内容</p>",  // 异步回复内容
    },
  filter: {
    where: {
      $and: [
        {
          _id: {
            $eq: 'xxxx', // 推荐传入_id数据标识进行操作
          },
        },
      ]
    }
  },
  // envType: pre 体验环境， prod 正式环境
  envType: "pre",
});

// 返回更新成功的条数
console.log(data);
// { count: 1}
```

详细用法可参考: 

更新多条数据

```
const { data } = await models.ai_bot_chat_history_5hobd2b.updateMany({
  data: {
      role: "文本",  // 角色
      need_async_reply: true,  // 是否异步回复
      type: "文本",  // 消息类型
      content: "<p>文本内容</p>",  // 内容
      recommend_questions: [],  // 推荐问题
      reply_to: "文本",  // 被回复的消息id
      event: "文本",  // 事件类型
      reply: "文本",  // 回复的消息id
      bot_id: "文本",  // 智能体ID
      conversation: "文本",  // 会话
      origin_msg: "多行文本",  // 原始消息内容
      image: "https://main.qcloudimg.com/raw/c85c9a875e9754545ee19f20438b2caa.svg",  // 图片地址
      trace_id: "文本",  // 请求 id
      record_id: "文本",  // 对话记录ID
      trigger_src: "文本",  // 来源
      sender: "文本",  // 发送者
      async_reply: "<p>文本内容</p>",  // 异步回复内容
    },
  filter: {
    where: {
      $and: [
        {
          title: {
            $nempty: 1 // 不为空的数据
          }
        }
      ]
    }
  },
  // envType: pre 体验环境， prod 正式环境
  envType: "pre",
});

// 返回更新成功的条数
console.log(data);
// {
//   "count": 33
// }
```

详细用法可参考: 

删除单条数据

```
const { data } = await models.ai_bot_chat_history_5hobd2b.delete({
  filter: {
    where: {
      $and: [
        {
          _id: {
            $eq: 'xxx', // 推荐传入_id数据标识进行操作
          },
        },
      ]
    }
  },
  // envType: pre 体验环境， prod 正式环境
  envType: "pre",
});

// 返回删除成功的条数
console.log(data);
// {
//   "count": 1
// }
```

详细用法可参考: 

删除多条数据

```
const { data } = await models.ai_bot_chat_history_5hobd2b.deleteMany({
  filter: {
    where: {
      $and: [
        {
          title: {
            $eq: 'Hello World👋'
          }
        }
      ]
    }
  },
  // envType: pre 体验环境， prod 正式环境
  envType: "pre",
});

console.log(data);
// 返回删除成功的条数
// {
//   "count": 7
// }
```

详细用法可参考: 

读取单条数据

```
const { data } = await models.ai_bot_chat_history_5hobd2b.get({
  filter: {
    where: {
      $and: [
        {
          _id: {
            $eq: _id, // 推荐传入_id数据标识进行操作
          },
        },
      ]
    }
  },
  // envType: pre 体验环境， prod 正式环境
  envType: "pre",
});

// 返回查询到的数据
console.log(data);
```

详细用法可参考: 

读取多条数据

```
const { data } = await models.ai_bot_chat_history_5hobd2b.list({
  filter: {
    where: {}
  },
  pageSize: 10, // 分页大小，建议指定，如需设置为其它值，需要和 pageNumber 配合使用，两者同时指定才会生效
  pageNumber: 1, // 第几页
  getCount: true, // 开启用来获取总数
  // envType: pre 体验环境， prod 正式环境
  envType: "pre",
});

// 返回查询到的数据列表 records 和 总数 total
console.log(data);
// {
//   "records": [{...},{...}],
//   "total": 51
// }
```

详细用法可参考: 

创建关联数据

```
const { data } = await models.ai_bot_chat_history_5hobd2b.create({
    data: {
      exmaple: {    // 关联模型标识
        _id: "xxx", // 关联的数据 ID
      },
      xxx: "文章写的很不错😄", // 其它字段
    },
    // envType: pre 体验环境， prod 正式环境
    envType: "pre",
  });

  // 返回写入的数据 _id
  console.log(data);
  // { id: "7d8ff72c665eb6c30243b6313aa8539e"}
```

详细用法可参考: 

查询关联数据

```
const { data } = await models.ai_bot_chat_history_5hobd2b.list({
  filter: {
    where: {
      exmaple: {    // 关联模型标识
        $eq: "xxx", // 传入数据 ID
      },
    }
  },
  getCount: true, // 是否返回总数
  // envType: pre 体验环境， prod 正式环境
  envType: "pre",
});

// 返回查询到的数据和总数
console.log(data);
// {
//  "records": [
//    {
//      "owner": "Anonymous(95fblM7nvPi01yQmYxBvBg)",
//      "createdAt": 1717491698898,
//      "createBy": "Anonymous(95fblM7nvPi01yQmYxBvBg)",
//      "post": "e2764d2d665ecbc9024b058f1d6b33a4",
//      "updateBy": "Anonymous(95fblM7nvPi01yQmYxBvBg)",
//      "_openid": "95fblM7nvPi01yQmYxBvBg",
//      "xxx": "文章写的很不错😄",
//      "_id": "b787f7c3665ed7f20247f85409c36512",
//      "updatedAt": 1717491698898
//    },
//  ],
//  "total": 1
// }
```