const multer = require('multer')
const path = require('path')
const fs = require('fs')
const config = require('../config')

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm'
]

function createUploadMiddleware() {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(config.uploadsDir, 'originals')
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
      cb(null, name)
    }
  })

  return multer({
    storage,
    limits: { fileSize: config.maxFileSizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (ALLOWED_MIME.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error(`不支持的文件类型: ${file.mimetype}`))
      }
    }
  })
}

module.exports = { createUploadMiddleware }
