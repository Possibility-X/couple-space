'use strict'
const Dypnsapi = require('@alicloud/dypnsapi20170525')
const OpenApi = require('@alicloud/openapi-client')
const Util = require('@alicloud/tea-util')
const config = require('../config')

function createClient() {
  const clientConfig = new OpenApi.Config({
    accessKeyId: config.aliyunAccessKeyId,
    accessKeySecret: config.aliyunAccessKeySecret,
    endpoint: 'dypnsapi.aliyuncs.com',
  })
  return new Dypnsapi.default(clientConfig)
}

/**
 * 发送短信验证码（验证码由阿里云生成和管理）
 * 开发模式下打印到控制台，固定使用 123456
 */
async function sendSmsCode(phone) {
  if (config.nodeEnv === 'development') {
    console.log(`[SMS DEV] 手机 ${phone} 验证码: 123456 (固定测试码)`)
    return
  }
  const client = createClient()
  const request = new Dypnsapi.SendSmsVerifyCodeRequest({
    phoneNumber: phone,
    signName: config.aliyunSmsSignName,
    templateCode: config.aliyunSmsTemplateCode,
    templateParam: JSON.stringify({ code: '##code##', min: '5' }),
  })
  const runtime = new Util.RuntimeOptions({})
  const resp = await client.sendSmsVerifyCodeWithOptions(request, runtime)
  if (resp.body.code !== 'OK') {
    throw new Error(`短信发送失败: ${resp.body.message}`)
  }
}

/**
 * 核验短信验证码
 * 开发模式下固定接受 123456
 * @returns {Promise<boolean>}
 */
async function verifySmsCode(phone, code) {
  if (config.nodeEnv === 'development') {
    return code === '123456'
  }
  const client = createClient()
  const request = new Dypnsapi.CheckSmsVerifyCodeRequest({
    phoneNumber: phone,
    verifyCode: code,
  })
  const runtime = new Util.RuntimeOptions({})
  try {
    const resp = await client.checkSmsVerifyCodeWithOptions(request, runtime)
    return resp.body.code === 'OK'
  } catch (e) {
    console.error('OTP check error:', e.message)
    return false
  }
}

module.exports = { sendSmsCode, verifySmsCode }
