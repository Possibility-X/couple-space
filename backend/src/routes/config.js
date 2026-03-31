const express = require('express')
const { getDb } = require('../database/init')
const auth = require('../middleware/auth')

const router = express.Router()

router.get('/', auth, (req, res) => {
  const db = getDb()
  const cfg = db.prepare('SELECT * FROM couple_config WHERE id = 1').get()
  res.json(cfg)
})

router.put('/', auth, (req, res) => {
  const { person1_name, person2_name, anniversary_date, love_story } = req.body
  const db = getDb()
  db.prepare(`
    UPDATE couple_config SET
      person1_name = COALESCE(?, person1_name),
      person2_name = COALESCE(?, person2_name),
      anniversary_date = COALESCE(?, anniversary_date),
      love_story = COALESCE(?, love_story)
    WHERE id = 1
  `).run(person1_name, person2_name, anniversary_date, love_story)
  res.json({ ok: true })
})

module.exports = router
