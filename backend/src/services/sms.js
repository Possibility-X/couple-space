const Core = require('@alicloud/pop-core')
const config = require('../config')

async function sendOtp(phone, code) {
  if (config.nodeEnv === 'development') {
    console.log(`[SMS DEV] 手机 ${phone} 验证码: ${code}`)
    return
  }
  const client = new Core({
    accessKeyId: config.aliyunAccessKeyId,
    accessKeySecret: config.aliyunAccessKeySecret,
    endpoint: 'https://dysmsapi.aliyuncs.com',
    apiVersion: '2017-05-25'
  })
  const result = await client.request('SendSms', {
    PhoneNumbers: phone,
    SignName: config.aliyunSmsSignName,
    TemplateCode: config.aliyunSmsTemplateCode,
    TemplateParam: JSON.stringify({ code, min: '5' })
  }, { method: 'POST' })
  if (result.Code !== 'OK') {
    throw new Error(`短信发送失败: ${result.Message}`)
  }
}

module.exports = { sendOtp }
