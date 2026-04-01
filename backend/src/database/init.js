const { DatabaseSync } = require('node:sqlite')
const path = require('path')
const fs = require('fs')
const config = require('../config')

let db

function getDb() {
  if (!db) {
    fs.mkdirSync(path.dirname(config.dbPath), { recursive: true })
    db = new DatabaseSync(config.dbPath)
    db.exec("PRAGMA journal_mode = WAL")
    db.exec("PRAGMA foreign_keys = ON")
    initSchema()
  }
  return db
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      cover_media_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      thumb_filename TEXT,
      album_id INTEGER REFERENCES albums(id) ON DELETE SET NULL,
      caption TEXT,
      taken_at TEXT,
      uploaded_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      event_date TEXT NOT NULL,
      media_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
      is_milestone INTEGER NOT NULL DEFAULT 0,
      emoji TEXT DEFAULT '❤️',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS couple_config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      person1_name TEXT,
      person2_name TEXT,
      anniversary_date TEXT,
      love_story TEXT,
      setup_done INTEGER NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO couple_config (id) VALUES (1);

    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_media_album_id ON media(album_id);
    CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
    CREATE INDEX IF NOT EXISTS idx_media_taken_at ON media(taken_at);
    CREATE INDEX IF NOT EXISTS idx_timeline_event_date ON timeline_events(event_date);
    CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);
  `)
}

module.exports = { getDb }
