const LIMITS = {
  display_name: 30,
  person_name: 30,
  album_name: 50,
  album_description: 500,
  timeline_title: 100,
  timeline_description: 2000,
  media_caption: 500,
  love_story: 5000,
  emoji: 10,
}

/**
 * Validate a list of fields against length limits.
 * @param {Array<{value:any, name:string, limit:number}>} fields
 * @returns {string|null} error message, or null if all pass
 */
function validateFields(fields) {
  for (const f of fields) {
    if (f.value == null) continue
    if (typeof f.value !== 'string') continue
    if (f.value.length > f.limit) {
      return `${f.name}不能超过 ${f.limit} 个字符`
    }
  }
  return null
}

module.exports = { LIMITS, validateFields }
