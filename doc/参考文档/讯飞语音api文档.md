> 本文由 [简悦 SimpRead](http://ksria.com/simpread/) 转码， 原文地址 [mp.weixin.qq.com](https://mp.weixin.qq.com/s?__biz=Mzk0ODcxNTI0OA==&mid=2247487083&idx=1&sn=8cd86f02e647843affe2b384bde9841d&chksm=c21334e024382129d24ed8ae4f2fccfd1ccc737f42496610deee65636301ff9e2c04804deea7&mpshare=1&scene=1&srcid=0506QX874hj3IYojJN86TKSI&sharer_shareinfo=6223fdce9151693707293a5222355f02&sharer_shareinfo_first=6223fdce9151693707293a5222355f02#rd)

讯飞作为语音识别的领头羊，相应的语音转文字的准确率也是很高的。

**5 万次免费调用**，够你用到天荒地老！

曾经我花了两天时间摸索接入流程，踩了无数坑。今天我把完整经验毫无保留分享给大家，保证你短时间搞定全流程！

注册帐号
====

注册环节有些小复杂，每一步都关系到能否顺利获得免费额度。

请认准官方地址：https://www.xfyun.cn/services/voicedictation

![](https://mmbiz.qpic.cn/mmbiz_png/MpREkIqiasHe7lZFQz2aSfUxLKOdtia6iaweHZCSxjrXia3Y3CSnuAURQibrF48wn3xvKNPMn6IJ7xOJCCMwYbqO1xg/640?wx_fmt=png&from=appmsg)

点击免费试用，之后会出现下面功能。

![](https://mmbiz.qpic.cn/mmbiz_png/MpREkIqiasHe7lZFQz2aSfUxLKOdtia6iawqRa0YTQue3Ksib99QumFultpKrzjpq39C0msKGOibWlvVHzA35c7kjzA/640?wx_fmt=png&from=appmsg)

** 最关键的一步：** 完成个人实名认证！不要跳过这步，否则无法获得 5 万次免费额度

认证完成后，系统会自动为你发放权益，可在 "个人空间" 去创建应用了。

官方地址：https://console.xfyun.cn/app/myapp

点击创建应用。

![](https://mmbiz.qpic.cn/mmbiz_png/MpREkIqiasHe7lZFQz2aSfUxLKOdtia6iaw6ibffMpwucBUibEiavmlc1EtBljE87ibmlHqTtPrOiaXibMM5nbTaupC7libA/640?wx_fmt=png&from=appmsg)

当应用创建之后，进入详情会发现左侧有很多调用的服务列表，点击 “语音识别”->"语音听写（流式版）"，就会发现后面有 websocket 服务接口认证信息，这个要保存起来。

![](https://mmbiz.qpic.cn/mmbiz_png/MpREkIqiasHe7lZFQz2aSfUxLKOdtia6iaw6zzWQ6u23MNn4E9UY8Z7ibyiaAp17DLNYm7iagcibFSANpkPIibsw6ZbicnQ/640?wx_fmt=png&from=appmsg)

接下来，就要参考这个说明文档。

https://www.xfyun.cn/doc/asr/voicedictation/API.html

使用 Cursor 快速开发听写转文本小程序
======================

第一步：初始化一个微信小程序项目。

还是老样子，今图小程序开发工具界面，点击创建小程序 -> 不使用模板。

![](https://mmbiz.qpic.cn/mmbiz_png/MpREkIqiasHe7lZFQz2aSfUxLKOdtia6iawcYTe38K5ZCn2Tn1gC5hSlOumicgqz1NXhXp8XROXeVgbUO8hgnKw1wA/640?wx_fmt=png&from=appmsg)

第二步：开发云函数鉴权服务。

我们这里要用到腾讯云函数。只要前端输出项目 id，自动通过云函数去获取到访问讯飞的 wss 地址。

【目前官方首月免费，以后每个月 19 元，如果觉得贵的话，可以自己搭建后端服务器】。

我们直接按照官方说明文档的要求复制下来，丢给 cursor，告诉他给我生成一个云函数。

![](https://mmbiz.qpic.cn/mmbiz_png/MpREkIqiasHe7lZFQz2aSfUxLKOdtia6iawbedp1Fv0rySNZSIkAPC8xNxZAt7C7Gc4UlvZeSlPicZvyEBcpEju4BQ/640?wx_fmt=png&from=appmsg)

具体云函数后端功能可以让 cursor 生成。

```
请帮我创建一个微信小程序云函数，用于科大讯飞语音识别API的鉴权。 要求： 1. 函数名为 getWssUrl 2. 需接收前端传来的数据 3. 使用鉴权crypto算法生成鉴权URL 4. 返回鉴权后的WebSocket URL给前端 5. 需包含错误处理机制  科大讯飞的鉴权算法是：...（此处粘贴讯飞官方文档中我刚才截取的内容）

```

生成好的云端函数，记得上传。Cursor 会生成完整的云函数代码，将其保存到项目的 cloudfunctions 目录下并在微信开发者工具中上传并部署云函数

![](https://mmbiz.qpic.cn/mmbiz_png/MpREkIqiasHe7lZFQz2aSfUxLKOdtia6iawhqX9pQzEibRVDBXvibNWGG64cDFeBibRCvADibuOugdtxxWicZ3fy8H6ViaQ/640?wx_fmt=png&from=appmsg)

第三步：参考官方例子，直接让 cursor 给生成代码。

我们首先要进入官方的文档，对应的官方地址：

https://www.xfyun.cn/doc/asr/voicedictation/API.html#%E8%B0%83%E7%94%A8%E7%A4%BA%E4%BE%8B

找到对应的代码逻辑，譬如 iat-js-demo 的主要逻辑在这里。

![](https://mmbiz.qpic.cn/mmbiz_png/MpREkIqiasHe7lZFQz2aSfUxLKOdtia6iawUicCicGG84icOYRhjEOQicSGNNsGKJXL60R2ibT9890thYG7v2j1xqtnKyg/640?wx_fmt=png&from=appmsg)

我们可以这样写提示词，将主要逻辑附加在我们的提示词后面。

![](https://mmbiz.qpic.cn/mmbiz_png/MpREkIqiasHe7lZFQz2aSfUxLKOdtia6iaw1wZW44kBZNLYeA1TmfDogYCo8uz4JmeJA11VXVutrBZDdXyKStiaklg/640?wx_fmt=png&from=appmsg)

然后在 cursor 中先用 ask 模式，询问 cursor 需要补充哪些内容，以便我们更容易理解。

![](https://mmbiz.qpic.cn/mmbiz_png/MpREkIqiasHe7lZFQz2aSfUxLKOdtia6iawuiceWxh1nD0qsPA9aIBOwuTMb9vdIiaXBDt07PsJquSuwlXoTAtrXWPw/640?wx_fmt=png&from=appmsg)

接下来按照他的要求回复之后，再切换 agent 模式下让 cursor 生成代码。

![](https://mmbiz.qpic.cn/mmbiz_png/MpREkIqiasHe7lZFQz2aSfUxLKOdtia6iawYj9xrX5juXzr3jhXz2cn0IKkRvoYNWiaMzdRw233vNzicsQpSJyUNQibg/640?wx_fmt=png&from=appmsg)

第四步：配置微信小程序合法域名。

打开微信小程序管理界面，添加合法域名。

![](https://mmbiz.qpic.cn/mmbiz_png/MpREkIqiasHe7lZFQz2aSfUxLKOdtia6iaw7NT6rfoDMGdyhcmWJze0TAa8tc0Hm7RQxsw8YCLcCRbnav4R5pClXw/640?wx_fmt=png&from=appmsg)

添加下面两项：

```
#request的合法域名是：
https://iat-api.xfyun.cn
#socket合法域名是
wss://iat-api.xfyun.cn

```

就这样，经过不断的修改终于可以输入语音，自动转文字了。

![](https://mmbiz.qpic.cn/mmbiz_png/MpREkIqiasHe7lZFQz2aSfUxLKOdtia6iawfv8q7pYhys47xtkf0HTClOSEYd3K3DWqLuJoOaMosoE4dRJvdHpIWQ/640?wx_fmt=png&from=appmsg)

注意事项
====

完成以上步骤后，编译运行小程序，就可以实现语音转文字功能了！

**❗重要提醒：** 在电脑模拟器上测试时，讯飞接口可能返回空值！这是个常见坑，**一定要用真机调试才能获得正确结果**。

其实体验下来，websoket 去调用还是比较麻烦的，配置这个必须要静下心来，不然任何错误都会让你调试发狂。