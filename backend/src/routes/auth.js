const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getDb } = require('../database/init')
const config = require('../config')
const { sendOtp } = require('../services/sms')

const router = express.Router()

const PHONE_REGEX = /^1[3-9]\d{9}$/
function isValidPhone(p) { return PHONE_REGEX.test(p) }
function generateOtp() { return String(Math.floor(100000 + Math.random() * 900000)) }

// 登录失败记录 { phone: { count, lockedUntil } }
const loginAttempts = new Map()
const MAX_ATTEMPTS = 5
const LOCK_TIME = 15 * 60 * 1000 // 15分钟

// OTP 发送冷却 { phone: lastSentAt(timestamp) }
const otpSendTimes = new Map()
const OTP_COOL_DOWN = 60 * 1000 // 60秒

// 每小时清理过期记录
setInterval(() => {
  const now = Date.now()
  for (const [phone, attempt] of loginAttempts.entries()) {
    if (attempt.lockedUntil > 0 && attempt.lockedUntil < now) {
      loginAttempts.delete(phone)
    }
  }
  for (const [phone, sentAt] of otpSendTimes.entries()) {
    if (now - sentAt > OTP_COOL_DOWN * 10) {
      otpSendTimes.delete(phone)
    }
  }
  getDb().prepare("DELETE FROM otp_codes WHERE expires_at < datetime('now')").run()
}, 60 * 60 * 1000)

// GET /api/auth/setup-status
router.get('/setup-status', (req, res) => {
  const db = getDb()
  const cfg = db.prepare('SELECT setup_done FROM couple_config WHERE id = 1').get()
  res.json({ setupDone: cfg?.setup_done || 0 })
})

// POST /api/auth/login — 第一步：验证手机号+密码，发送短信验证码
router.post('/login', async (req, res) => {
  const { phone, password } = req.body
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' })
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: '请输入正确的手机号码' })
  }

  // 检查账号是否被锁定
  const attempt = loginAttempts.get(phone)
  if (attempt && attempt.lockedUntil > Date.now()) {
    const remainingMinutes = Math.ceil((attempt.lockedUntil - Date.now()) / 60000)
    return res.status(429).json({ error: `账号已锁定，请在 ${remainingMinutes} 分钟后重试` })
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(phone)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    const current = loginAttempts.get(phone) || { count: 0, lockedUntil: 0 }
    current.count++
    if (current.count >= MAX_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCK_TIME
      loginAttempts.set(phone, current)
      return res.status(429).json({ error: '登录失败次数过多，账号已锁定 15 分钟' })
    }
    loginAttempts.set(phone, current)
    return res.status(401).json({ error: '手机号或密码错误' })
  }

  // 密码正确，清除失败记录
  loginAttempts.delete(phone)

  // 检查 OTP 发送冷却
  const lastSent = otpSendTimes.get(phone) || 0
  const coolRemaining = OTP_COOL_DOWN - (Date.now() - lastSent)
  if (coolRemaining > 0) {
    return res.status(429).json({ error: `请等待 ${Math.ceil(coolRemaining / 1000)} 秒后再发送验证码` })
  }

  // 生成并存储 OTP（5分钟有效）
  const code = generateOtp()
  db.prepare(`
    INSERT INTO otp_codes (phone, code, expires_at)
    VALUES (?, ?, datetime('now', '+5 minutes'))
  `).run(phone, code)
  otpSendTimes.set(phone, Date.now())

  try {
    await sendOtp(phone, code)
  } catch (e) {
    console.error('SMS error:', e.message)
    return res.status(500).json({ error: config.nodeEnv === 'production' ? '短信发送失败，请稍后重试' : e.message })
  }

  res.json({ ok: true })
})

// POST /api/auth/verify-otp — 第二步：验证短信码，签发 JWT
router.post('/verify-otp', (req, res) => {
  const { phone, code } = req.body
  if (!phone || !code) {
    return res.status(400).json({ error: '手机号和验证码不能为空' })
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: '请输入正确的手机号码' })
  }

  const db = getDb()
  const otp = db.prepare(`
    SELECT * FROM otp_codes
    WHERE phone = ? AND used = 0 AND expires_at > datetime('now')
    ORDER BY id DESC LIMIT 1
  `).get(phone)

  if (!otp || otp.code !== code) {
    return res.status(401).json({ error: '验证码错误或已过期' })
  }

  db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otp.id)

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(phone)
  if (!user) return res.status(404).json({ error: '用户不存在' })

  const token = jwt.sign(
    { id: user.id, username: user.username, displayName: user.display_name },
    config.jwtSecret,
    { expiresIn: '7d' }
  )
  res.json({ token, user: { id: user.id, username: user.username, displayName: user.display_name, avatar: user.avatar } })
})

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), (req, res) => {
  const db = getDb()
  const user = db.prepare('SELECT id, username, display_name, avatar, created_at FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ error: '用户不存在' })
  res.json({ id: user.id, username: user.username, displayName: user.display_name, avatar: user.avatar })
})

// POST /api/auth/setup — 初始化两个账号（仅 setup_done=0 时可用）
router.post('/setup', (req, res) => {
  const db = getDb()
  const cfg = db.prepare('SELECT setup_done FROM couple_config WHERE id = 1').get()
  if (cfg && cfg.setup_done) {
    return res.status(403).json({ error: '已完成初始化' })
  }
  const { person1, person2, anniversaryDate } = req.body
  if (!person1?.username || !person1?.password || !person2?.username || !person2?.password) {
    return res.status(400).json({ error: '请提供双方账号信息' })
  }
  if (!isValidPhone(person1.username)) {
    return res.status(400).json({ error: 'TA 的手机号格式不正确' })
  }
  if (!isValidPhone(person2.username)) {
    return res.status(400).json({ error: '你的手机号格式不正确' })
  }

  const insertUser = db.prepare(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)'
  )
  const hash1 = bcrypt.hashSync(person1.password, 10)
  const hash2 = bcrypt.hashSync(person2.password, 10)

  try {
    db.exec('BEGIN')
    insertUser.run(person1.username, hash1, person1.displayName || person1.username)
    insertUser.run(person2.username, hash2, person2.displayName || person2.username)
    db.prepare(`
      UPDATE couple_config SET
        person1_name = ?, person2_name = ?,
        anniversary_date = ?, setup_done = 1
      WHERE id = 1
    `).run(person1.displayName || person1.username, person2.displayName || person2.username, anniversaryDate || config.anniversaryDate)
    db.exec('COMMIT')
    res.json({ ok: true })
  } catch (e) {
    db.exec('ROLLBACK')
    console.error('Setup error:', e)
    const message = config.nodeEnv === 'production' ? '初始化失败，请检查账号信息后重试' : '初始化失败：' + e.message
    res.status(400).json({ error: message })
  }
})

module.exports = router
