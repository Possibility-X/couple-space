const express = require('express')
const { getDb } = require('../database/init')
const auth = require('../middleware/auth')

const router = express.Router()

router.get('/', auth, (req, res) => {
  const db = getDb()
  const events = db.prepare(`
    SELECT t.*, m.filename as media_filename, m.thumb_filename as media_thumb
    FROM timeline_events t
    LEFT JOIN media m ON t.media_id = m.id
    ORDER BY t.event_date DESC, t.created_at DESC
  `).all()
  res.json(events)
})

router.post('/', auth, (req, res) => {
  const { title, description, event_date, media_id, is_milestone, emoji } = req.body
  if (!title || !event_date) return res.status(400).json({ error: '标题和日期不能为空' })
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO timeline_events (title, description, event_date, media_id, is_milestone, emoji)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, description || null, event_date, media_id || null, is_milestone ? 1 : 0, emoji || '❤️')
  res.json({ id: result.lastInsertRowid })
})

router.put('/:id', auth, (req, res) => {
  const { title, description, event_date, media_id, is_milestone, emoji } = req.body
  const db = getDb()
  const event = db.prepare('SELECT id FROM timeline_events WHERE id = ?').get(req.params.id)
  if (!event) return res.status(404).json({ error: '事件不存在' })
  db.prepare(`
    UPDATE timeline_events SET
      title = COALESCE(?, title),
      description = ?,
      event_date = COALESCE(?, event_date),
      media_id = ?,
      is_milestone = COALESCE(?, is_milestone),
      emoji = COALESCE(?, emoji)
    WHERE id = ?
  `).run(title, description, event_date, media_id, is_milestone != null ? (is_milestone ? 1 : 0) : null, emoji, req.params.id)
  res.json({ ok: true })
})

router.delete('/:id', auth, (req, res) => {
  const db = getDb()
  const event = db.prepare('SELECT id FROM timeline_events WHERE id = ?').get(req.params.id)
  if (!event) return res.status(404).json({ error: '事件不存在' })
  db.prepare('DELETE FROM timeline_events WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
