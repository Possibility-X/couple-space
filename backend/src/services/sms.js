const Dysmsapi = require('@alicloud/dysmsapi20170525')
const OpenApiClient = require('@alicloud/openapi-client')
const TeaUtil = require('@alicloud/tea-util')
const config = require('../config')

async function sendOtp(phone, code) {
  if (config.nodeEnv === 'development') {
    console.log(`[SMS DEV] 手机 ${phone} 验证码: ${code}`)
    return
  }

  const clientConfig = new OpenApiClient.Config({
    accessKeyId: config.aliyunAccessKeyId,
    accessKeySecret: config.aliyunAccessKeySecret,
    endpoint: 'dysmsapi.aliyuncs.com',
  })
  const client = new Dysmsapi.default(clientConfig)

  const request = new Dysmsapi.SendSmsRequest({
    phoneNumbers: phone,
    signName: config.aliyunSmsSignName,
    templateCode: config.aliyunSmsTemplateCode,
    templateParam: JSON.stringify({ code, min: '5' }),
  })

  const runtime = new TeaUtil.RuntimeOptions({})
  const response = await client.sendSmsWithOptions(request, runtime)

  if (response.body.code !== 'OK') {
    throw new Error(`短信发送失败: ${response.body.message}`)
  }
}

module.exports = { sendOtp }
