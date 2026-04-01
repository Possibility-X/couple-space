const express = require('express')
const cors = require('cors')
const path = require('path')
const config = require('./config')
const { getDb } = require('./database/init')

const app = express()

app.use(cors({
  origin: config.nodeEnv === 'development'
    ? 'http://localhost:5173'
    : (process.env.CORS_ORIGIN || false),
  credentials: true
}))
app.use(express.json())

// Initialize DB on startup
getDb()

// Static file serving for uploads in development
if (config.nodeEnv === 'development') {
  app.use('/uploads', express.static(config.uploadsDir))
}

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/media', require('./routes/media'))
app.use('/api/albums', require('./routes/albums'))
app.use('/api/timeline', require('./routes/timeline'))
app.use('/api/config', require('./routes/config'))

// Error handler
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `文件超过 ${config.maxFileSizeMB}MB 限制` })
  }
  console.error(err)
  const message = config.nodeEnv === 'production' ? '服务器内部错误' : (err.message || '服务器错误')
  res.status(500).json({ error: message })
})

app.listen(config.port, () => {
  console.log(`✓ 后端运行在 http://localhost:${config.port}`)
})
