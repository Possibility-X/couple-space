const { execSync } = require('child_process')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const fs = require('fs')

let ffmpegAvailable = null

function checkFfmpeg() {
  if (ffmpegAvailable !== null) return ffmpegAvailable
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' })
    ffmpegAvailable = true
  } catch {
    console.warn('ffmpeg not found — video thumbnails will be skipped')
    ffmpegAvailable = false
  }
  return ffmpegAvailable
}

/**
 * Extract a thumbnail from a video at 0.5s.
 * @returns {Promise<string|null>} Thumbnail filename or null on failure
 */
function extractThumbnail(videoPath, outputDir, baseName) {
  if (!checkFfmpeg()) return Promise.resolve(null)

  const thumbName = `thumb_${baseName}.jpg`
  return new Promise(resolve => {
    ffmpeg(videoPath)
      .on('end', () => resolve(thumbName))
      .on('error', (err) => {
        console.error('Video thumbnail error:', err.message)
        resolve(null)
      })
      .screenshots({
        count: 1,
        timemarks: ['0.5'],
        folder: outputDir,
        filename: thumbName,
        size: '600x?'
      })
  })
}

/**
 * Remux an MP4 video with -movflags +faststart so the moov atom is at the
 * front of the file. This lets browsers start playback without downloading
 * the entire file. Non-MP4 types are silently skipped. Fails non-fatally.
 */
async function addFastStart(filePath, mimetype) {
  if (!checkFfmpeg()) return
  if (mimetype !== 'video/mp4' && mimetype !== 'video/x-m4v') return

  const tmpPath = filePath + '.faststart.mp4'
  try {
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .outputOptions(['-c copy', '-movflags +faststart'])
        .output(tmpPath)
        .on('end', resolve)
        .on('error', reject)
        .run()
    })
    await fs.promises.rename(tmpPath, filePath)
  } catch (e) {
    console.error('faststart remux failed:', e.message)
    fs.promises.unlink(tmpPath).catch(() => {})
  }
}

module.exports = { extractThumbnail, addFastStart }
