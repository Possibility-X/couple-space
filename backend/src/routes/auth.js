const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getDb } = require('../database/init')
const config = require('../config')

const router = express.Router()

// GET /api/auth/setup-status - 检查是否已完成初始化（公开接口）
router.get('/setup-status', (req, res) => {
  const db = getDb()
  const cfg = db.prepare('SELECT setup_done FROM couple_config WHERE id = 1').get()
  res.json({ setupDone: cfg?.setup_done || 0 })
})

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }
  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }
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

// POST /api/auth/setup - 初始化两个账号（仅 setup_done=0 时可用）
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
    res.status(400).json({ error: '初始化失败：' + e.message })
  }
})

module.exports = router
