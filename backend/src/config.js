require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

module.exports = {
  port: parseInt(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  anniversaryDate: process.env.ANNIVERSARY_DATE || '2023-01-01',
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB) || 100,
  nodeEnv: process.env.NODE_ENV || 'development',
  uploadsDir: require('path').join(__dirname, '../data/uploads'),
  dbPath: require('path').join(__dirname, '../data/db/couple.db'),
}
