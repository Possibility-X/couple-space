const jwt = require('jsonwebtoken')
const config = require('../config')

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' })
  }
  const token = authHeader.slice(7)
  try {
    req.user = jwt.verify(token, config.jwtSecret)
    next()
  } catch {
    res.status(401).json({ error: 'Token 无效或已过期' })
  }
}

module.exports = authMiddleware
