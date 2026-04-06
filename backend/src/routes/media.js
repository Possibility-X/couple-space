const express = require('express')
const path = require('path')
const fs = require('fs')
const Jimp = require('jimp')
const { getDb } = require('../database/init')
const config = require('../config')
const auth = require('../middleware/auth')
const { createUploadMiddleware } = require('../middleware/upload')
const { validateFields, LIMITS } = require('../utils/validate')
const { extractThumbnail } = require('../utils/video-thumbnail')

const router = express.Router()
const upload = createUploadMiddleware()

// GET /api/media
router.get('/', auth, (req, res) => {
  const db = getDb()
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
  const offset = (page - 1) * limit

  const { album, type } = req.query
  let where = '1=1'
  const params = []
  if (album) { where += ' AND m.album_id = ?'; params.push(album) }
  if (type === 'image') { where += " AND m.mime_type LIKE 'image/%'" }
  if (type === 'video') { where += " AND m.mime_type LIKE 'video/%'" }

  // node:sqlite uses spread params, not array
  const items = db.prepare(`
    SELECT m.*, u.display_name as uploader_name, u.avatar as uploader_avatar
    FROM media m
    LEFT JOIN users u ON m.uploaded_by = u.id
    WHERE ${where}
    ORDER BY m.taken_at DESC, m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM media m WHERE ${where}`)
    .get(...params).cnt

  res.json({ items, total, page, limit })
})

// POST /api/media/upload
router.post('/upload', auth, upload.array('files', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '没有上传文件' })
  }
  const captionErr = validateFields([
    { value: req.body.caption, name: '备注', limit: LIMITS.media_caption },
  ])
  if (captionErr) return res.status(400).json({ error: captionErr })
  const db = getDb()
  const thumbDir = path.join(config.uploadsDir, 'thumbs')
  fs.mkdirSync(thumbDir, { recursive: true })

  const results = []
  for (const file of req.files) {
    let width = null, height = null, thumbFilename = null
    const takenAt = req.body.taken_at || null

    if (file.mimetype.startsWith('image/')) {
      try {
        const image = await Jimp.read(file.path)
        width = image.bitmap.width
        height = image.bitmap.height

        // Scale to fit within 600×600, save as JPEG
        thumbFilename = 'thumb_' + path.parse(file.filename).name + '.jpg'
        if (width > 600 || height > 600) {
          image.scaleToFit(600, 600)
        }
        await image.quality(80).writeAsync(path.join(thumbDir, thumbFilename))
      } catch (e) {
        // Non-fatal: unsupported format (e.g. WebP) — skip thumbnail
        console.error('Thumbnail error:', e.message)
        thumbFilename = null
      }
    }

    if (file.mimetype.startsWith('video/')) {
      const baseName = path.parse(file.filename).name
      thumbFilename = await extractThumbnail(file.path, thumbDir, baseName)
    }

    const result = db.prepare(`
      INSERT INTO media (filename, original_name, mime_type, size, width, height, thumb_filename, album_id, caption, taken_at, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      file.filename, file.originalname, file.mimetype, file.size,
      width, height, thumbFilename,
      req.body.album_id || null,
      req.body.caption || null,
      takenAt,
      req.user.id
    )

    results.push({ id: result.lastInsertRowid, filename: file.filename, thumbFilename })
  }

  res.json({ uploaded: results })
})

// DELETE /api/media/:id
router.delete('/:id', auth, async (req, res) => {
  const db = getDb()
  const item = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ error: '文件不存在' })
  if (item.uploaded_by !== req.user.id) return res.status(403).json({ error: '无权删除此文件' })

  const origPath = path.join(config.uploadsDir, 'originals', item.filename)
  const thumbPath = item.thumb_filename ? path.join(config.uploadsDir, 'thumbs', item.thumb_filename) : null
  try { await fs.promises.unlink(origPath) } catch (e) { console.error('Failed to delete original:', e.message) }
  if (thumbPath) {
    try { await fs.promises.unlink(thumbPath) } catch (e) { console.error('Failed to delete thumb:', e.message) }
  }

  db.prepare('DELETE FROM media WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// GET /api/media/recent - for home dashboard
router.get('/recent', auth, (req, res) => {
  const db = getDb()
  const items = db.prepare(`
    SELECT m.*, u.display_name as uploader_name
    FROM media m LEFT JOIN users u ON m.uploaded_by = u.id
    ORDER BY m.created_at DESC LIMIT 6
  `).all()
  res.json(items)
})

module.exports = router
