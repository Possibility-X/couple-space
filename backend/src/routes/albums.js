const express = require('express')
const { getDb } = require('../database/init')
const auth = require('../middleware/auth')

const router = express.Router()

router.get('/', auth, (req, res) => {
  const db = getDb()
  const albums = db.prepare(`
    SELECT a.*, m.filename as cover_filename, m.thumb_filename as cover_thumb,
           COUNT(med.id) as media_count
    FROM albums a
    LEFT JOIN media m ON a.cover_media_id = m.id
    LEFT JOIN media med ON med.album_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `).all()
  res.json(albums)
})

router.post('/', auth, (req, res) => {
  const { name, description } = req.body
  if (!name) return res.status(400).json({ error: '相册名不能为空' })
  const db = getDb()
  const result = db.prepare('INSERT INTO albums (name, description) VALUES (?, ?)').run(name, description || null)
  res.json({ id: result.lastInsertRowid, name, description })
})

router.put('/:id', auth, (req, res) => {
  const { name, description, cover_media_id } = req.body
  const db = getDb()
  const album = db.prepare('SELECT id FROM albums WHERE id = ?').get(req.params.id)
  if (!album) return res.status(404).json({ error: '相册不存在' })
  db.prepare('UPDATE albums SET name = COALESCE(?, name), description = COALESCE(?, description), cover_media_id = COALESCE(?, cover_media_id) WHERE id = ?')
    .run(name, description, cover_media_id, req.params.id)
  res.json({ ok: true })
})

router.delete('/:id', auth, (req, res) => {
  const db = getDb()
  const album = db.prepare('SELECT id FROM albums WHERE id = ?').get(req.params.id)
  if (!album) return res.status(404).json({ error: '相册不存在' })
  db.prepare('UPDATE media SET album_id = NULL WHERE album_id = ?').run(req.params.id)
  db.prepare('DELETE FROM albums WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
