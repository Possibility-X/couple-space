const { execSync } = require('child_process')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')

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
 * @param {string} videoPath - Full path to the video file
 * @param {string} outputDir - Directory to write the thumbnail
 * @param {string} baseName - Base filename (without extension)
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

module.exports = { extractThumbnail }
