# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

情侣私密空间 — a romantic private web app for couples. Features: media gallery (photo + video), love timeline, relationship counter.

**Stack**: Vue 3 + Vite + TailwindCSS (frontend) / Node.js + Express + SQLite (backend) / Nginx + Docker Compose (deployment)

## Development Commands

**Prerequisites**: Node.js 22+ (backend uses built-in `node:sqlite`, which requires Node 22.5+)

```bash
# Backend (port 3000)
cd backend && npm install && npm run dev

# Frontend (port 5173, proxies /api and /uploads → localhost:3000)
cd frontend && npm install && npm run dev

# Frontend production build
cd frontend && npm run build
```

No test suite exists. No lint scripts exist.

## Project Structure

```
backend/src/
  index.js          # Express app entry, CORS, routes registration
  config.js         # All config from .env (port, jwtSecret, uploadsDir, paths)
  database/init.js  # SQLite schema + getDb() singleton
  routes/           # auth.js, media.js, albums.js, timeline.js, config.js
  middleware/
    auth.js         # JWT verification → req.user
    upload.js       # Multer config (allowed MIME, size limit)
  services/
    sms.js          # 阿里云短信发送封装（dev 模式打印到控制台）
  utils/
    validate.js     # LIMITS constants + validateFields() — used by all routes
    video-thumbnail.js  # ffmpeg-based video thumbnail extraction (graceful degradation)

frontend/src/
  lib/
    axios.js        # Centralized axios instance with request/response interceptors
  router/index.js   # Vue Router — /login, /setup (guest), / (auth required, children below)
  stores/           # Pinia: auth.js, config.js, toast.js
  views/
    Layout.vue      # Shell: sticky header (avatar → /settings) + bottom nav tabs
    Home.vue        # Dashboard: LoveCounter + recent 6 photos
    Gallery.vue     # Masonry grid, album filter, Lightbox
    Timeline.vue    # Vertical alternating timeline + managing mode + add/edit modal
    Upload.vue      # Drag-drop + file preview + album select
    Settings.vue    # Edit couple names, anniversary, love story, avatar
    Login.vue       # Two-step MFA login
    Setup.vue       # One-time: create 2 accounts + set anniversary
  components/
    Toast.vue            # Global toast UI (teleport to body, TransitionGroup)
    HeartParticles.vue   # Canvas floating hearts
    LoveCounter.vue      # Real-time days/hours/minutes/seconds counter
    PhotoCard.vue        # Thumbnail with video indicator + uploader badge
    Lightbox.vue         # Fullscreen viewer with touch swipe
```

## Key Architecture Notes

### Frontend API Layer

**Always use `api` from `@/lib/axios`, never raw `axios`**. The instance has:
- Request interceptor: auto-attaches `Authorization: Bearer <token>` from `localStorage`
- Response interceptor: maps 401 → logout+redirect, 403/429/500 → toast error
- `_skipToast: true` config flag: suppresses interceptor toasts for pages that handle errors inline (Login.vue, Setup.vue pass this on every request so their `error.value` bindings work undisturbed)

**Toast pattern**: import `useToastStore()` and call `.success()` / `.error()` / `.info()`. The `Toast.vue` component is mounted once in `App.vue` via teleport.

**Timeline managing mode**: `managing = ref(false)` toggled by a header button. Edit/delete buttons on cards are `v-if="managing"`. Delete success auto-sets `managing = false`.

### Auth Flow

JWT in `localStorage`, restored on app load in `auth.js` store. **Login is two-step MFA**:
1. `POST /api/auth/login` — validates phone + password, sends SMS OTP (4-digit, 5-min TTL, 60-sec resend cooldown)
2. `POST /api/auth/verify-otp` — validates code, issues 7-day JWT

Accounts use Chinese phone numbers (`1[3-9]XXXXXXXXX`) as `username`. Three independent in-memory rate limits (all reset on restart):
- **Login failures**: 5 wrong passwords → 15-min account lock
- **OTP send cooldown**: 60 sec between sends per phone
- **OTP verify failures**: 5 wrong codes → 15-min block per phone

`/setup` is double-protected: backend returns 403 if `setup_done=1`; frontend router guard calls `/api/auth/setup-status` before allowing access (catch block also redirects to prevent bypass).

### File Storage

| Type | Path | URL |
|------|------|-----|
| Originals | `backend/data/uploads/originals/` | `/uploads/originals/<filename>` |
| Thumbnails | `backend/data/uploads/thumbs/` | `/uploads/thumbs/<thumb_filename>` |
| Avatars | `backend/data/uploads/avatars/` | `/uploads/avatars/<filename>` |

In dev, Node.js serves `/uploads` statically. In production, Nginx serves `/uploads/` directly from the `/data/uploads/` Docker volume.

**Image thumbnails**: Jimp generates `thumb_<name>.jpg` (max 600px). WebP silently skipped (Jimp limitation).
**Video thumbnails**: `fluent-ffmpeg` extracts frame at 0.5s → `thumb_<name>.jpg`. If `ffmpeg` binary is not on PATH, a one-time warning is logged and thumbnails are skipped (graceful degradation). Docker image includes ffmpeg via `apk add --no-cache ffmpeg`.
**Avatars**: Jimp crops to 200×200 square (quality 85). Old avatar file deleted on update.

### Backend Validation

All user-facing string fields are validated in routes via `require('../utils/validate')`:

```js
const { validateFields, LIMITS } = require('../utils/validate')
// Returns first error string or null
const err = validateFields([
  { value: name, name: '相册名', limit: LIMITS.album_name },  // 50
])
if (err) return res.status(400).json({ error: err })
```

Key limits: `display_name/person_name: 30`, `album_name: 50`, `timeline_title: 100`, `timeline_description: 2000`, `media_caption: 500`, `love_story: 5000`, `emoji: 10`.

### SQLite

Uses Node.js built-in `node:sqlite` (`DatabaseSync`) — no third-party sqlite package. `getDb()` singleton in `database/init.js`, safe to call anywhere. WAL mode + foreign keys enabled.

### Module System

Backend: CommonJS (`require`/`module.exports`). Frontend: ESM (`import`/`export`).

### Config

All env vars in `backend/src/config.js`, loaded from `../../.env` (project root). `config.uploadsDir` resolves to `backend/data/uploads/`. In production, startup throws if `JWT_SECRET` is missing.

## API Routes

```
Auth:   GET  /api/auth/setup-status
        POST /api/auth/login | verify-otp | setup
        GET  /api/auth/me
        POST /api/auth/avatar          # upload avatar (auth, multipart, 2MB max, image only)
Media:  GET  /api/media                # paginated, ?album=&type=
        GET  /api/media/recent         # last 6 items
        POST /api/media/upload         # multipart, max 20 files
        DELETE /api/media/:id          # ownership enforced (uploaded_by = req.user.id)
Albums: GET/POST /api/albums
        PUT/DELETE /api/albums/:id
Timeline: GET/POST /api/timeline
          PUT/DELETE /api/timeline/:id  # no ownership check — shared by both users by design
Config: GET/PUT /api/config            # couple names, anniversary, love story
```

## Security Notes

- Media DELETE: `uploaded_by = req.user.id` check (403 on mismatch); Lightbox only shows delete for uploader
- Timeline: **no ownership check** — intentional, both users co-own the timeline
- Input lengths enforced on both frontend (`maxlength` attributes) and backend (`validateFields`)
- Production error responses scrubbed of internal details
- Nginx security headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`

## CSS Utility Classes (custom, in `main.css`)

`.btn-rose`, `.btn-ghost`, `.card`, `.input-field` — defined in `frontend/src/assets/main.css`. Use these instead of raw Tailwind for consistent styling.

## Environment Setup

Copy `.env.example` to `.env` in the project root:
```
JWT_SECRET=<random 32+ chars>     # REQUIRED in production
CORS_ORIGIN=https://your-domain.com
ANNIVERSARY_DATE=YYYY-MM-DD
PORT=3000
MAX_FILE_SIZE_MB=100

# 阿里云短信 (生产环境必填; dev 模式打印到控制台)
ALIYUN_ACCESS_KEY_ID=
ALIYUN_ACCESS_KEY_SECRET=
ALIYUN_SMS_SIGN_NAME=
ALIYUN_SMS_TEMPLATE_CODE=
```

## Deployment

```bash
# First deploy
git clone <repo> && cd couple-space
cp .env.example .env   # set JWT_SECRET, CORS_ORIGIN, NODE_ENV=production
cd frontend && npm install && npm run build && cd ..
docker compose up -d
docker compose exec nginx certbot --nginx -d your-domain.com

# Update
git pull
cd frontend && npm run build && cd ..
docker compose up -d --build
```

Data persists in `./data/` (gitignored) — back this up. Frontend must be built on the host before starting containers (`docker compose` mounts `./frontend/dist`).
