require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

const nodeEnv = process.env.NODE_ENV || 'development'

if (nodeEnv === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET 环境变量在生产环境中必须设置！')
}

module.exports = {
  port: parseInt(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  anniversaryDate: process.env.ANNIVERSARY_DATE || '2023-01-01',
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB) || 100,
  nodeEnv,
  uploadsDir: require('path').join(__dirname, '../data/uploads'),
  dbPath: require('path').join(__dirname, '../data/db/couple.db'),
}
