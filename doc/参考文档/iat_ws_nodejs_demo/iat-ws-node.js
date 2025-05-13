/**
 *
 * 运行前：请先填写Appid、APIKey、APISecret
 *
 * 语音听写流式 WebAPI 接口调用示例 接口文档（必看）：https://doc.xfyun.cn/rest_api/语音听写（流式版）.html
 * webapi 听写服务参考帖子（必看）：http://bbs.xfyun.cn/forum.php?mod=viewthread&tid=38947&extra=
 * 语音听写流式WebAPI 服务，热词使用方式：登陆开放平台https://www.xfyun.cn/后，找到控制台--我的应用---语音听写---服务管理--上传热词
 * 注意：热词只能在识别的时候会增加热词的识别权重，需要注意的是增加相应词条的识别率，但并不是绝对的，具体效果以您测试为准。
 * 错误码链接：https://www.xfyun.cn/document/error-code （code返回错误码时必看）
 * @author iflytek
 */
const CryptoJS = require('crypto-js')
const WebSocket = require('ws')
var fs = require('fs')

// 系统配置 
const config = {
  // 请求地址
  hostUrl: "wss://iat-api.xfyun.cn/v2/iat",
  host: "iat-api.xfyun.cn",
  //在控制台-我的应用-语音听写（流式版）获取
  appid: "********",
  //在控制台-我的应用-语音听写（流式版）获取
  apiSecret: "********************************",
  //在控制台-我的应用-语音听写（流式版）获取
  apiKey: "********************************",
  file: "./16k_10.pcm", //请填写您的音频文件路径
  uri: "/v2/iat",
  highWaterMark: 1280
}

// 帧定义
const FRAME = {
  STATUS_FIRST_FRAME: 0,
  STATUS_CONTINUE_FRAME: 1,
  STATUS_LAST_FRAME: 2
}

// 获取当前时间 RFC1123格式
let date = (new Date().toUTCString())
// 设置当前临时状态为初始化
let status = FRAME.STATUS_FIRST_FRAME
// 记录本次识别用sid
let currentSid = ""
// 识别结果
let iatResult = []

let wssUrl = config.hostUrl + "?authorization=" + getAuthStr(date) + "&date=" + date + "&host=" + config.host
let ws = new WebSocket(wssUrl)

// 连接建立完毕，读取数据进行识别
ws.on('open', (event) => {
  console.log("websocket connect!")
  var readerStream = fs.createReadStream(config.file, {
    highWaterMark: config.highWaterMark
  });
  readerStream.on('data', function (chunk) {
    send(chunk)
  });
  // 最终帧发送结束
  readerStream.on('end', function () {
    status = FRAME.STATUS_LAST_FRAME
    send("")
  });
})

// 得到识别结果后进行处理，仅供参考，具体业务具体对待
ws.on('message', (data, err) => {
  if (err) {
    console.log(`err:${err}`)
    return
  }
  res = JSON.parse(data)
  if (res.code != 0) {
    console.log(`error code ${res.code}, reason ${res.message}`)
    return
  }

  let str = ""
  if (res.data.status == 2) {
	// res.data.status ==2 说明数据全部返回完毕，可以关闭连接，释放资源
    str += "最终识别结果"
    currentSid = res.sid
    ws.close()
  } else {
    str += "中间识别结果"
  }
  iatResult[res.data.result.sn] = res.data.result
  if (res.data.result.pgs == 'rpl') {
    res.data.result.rg.forEach(i => {
      iatResult[i] = null
    })
    str += "【动态修正】"
  }
  str += "："
  iatResult.forEach(i => {
    if (i != null) {
      i.ws.forEach(j => {
        j.cw.forEach(k => {
          str += k.w
        })
      })
    }
  })
  console.log(str)
  // ... do something
})

// 资源释放
ws.on('close', () => {
  console.log(`本次识别sid：${currentSid}`)
  console.log('connect close!')
})

// 建连错误
ws.on('error', (err) => {
  console.log("websocket connect err: " + err)
})

// 鉴权签名
function getAuthStr(date) {
  let signatureOrigin = `host: ${config.host}\ndate: ${date}\nGET ${config.uri} HTTP/1.1`
  let signatureSha = CryptoJS.HmacSHA256(signatureOrigin, config.apiSecret)
  let signature = CryptoJS.enc.Base64.stringify(signatureSha)
  let authorizationOrigin = `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  let authStr = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(authorizationOrigin))
  return authStr
}

// 传输数据
function send(data) {
  let frame = "";
  let frameDataSection = {
    "status": status,
    "format": "audio/L16;rate=16000",
    "audio": data.toString('base64'),
    "encoding": "raw"
  }
  switch (status) {
    case FRAME.STATUS_FIRST_FRAME:
      frame = {
		// 填充common
        common: {
          app_id: config.appid
        },
		//填充business
        business: {
          language: "zh_cn",
          domain: "iat",
          accent: "mandarin",
          dwa: "wpgs" // 可选参数，动态修正
        },
		//填充data
        data: frameDataSection
      }
      status = FRAME.STATUS_CONTINUE_FRAME;
      break;
    case FRAME.STATUS_CONTINUE_FRAME:
    case FRAME.STATUS_LAST_FRAME:
	  //填充frame
      frame = {
        data: frameDataSection
      }
      break;
  }
  ws.send(JSON.stringify(frame))
}