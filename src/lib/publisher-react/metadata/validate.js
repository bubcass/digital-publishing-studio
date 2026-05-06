// src/metadata/validate.js

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateMetadata(meta = {}) {
  const errors = []
  const warnings = []
  const title = String(meta.title || '').trim()

  // --- Required core fields ---
  if (!title || title.length < 3 || title === 'Untitled research document') {
    errors.push('Title (min 3 chars)')
  }
  if (!meta.destination || String(meta.destination).trim().length === 0) {
    errors.push('Destination')
  }
  if (
    meta.destination !== 'committee-reports' &&
    (!meta.contentType || String(meta.contentType).trim().length === 0)
  ) {
    errors.push('Article type')
  }
  if (
    meta.destination === 'committee-reports' &&
    !String(meta.committeeName || '').trim()
  ) {
    errors.push('Authoring committee')
  }

  // Date published is ONLY required if status is "published"
  if (meta.status === 'published') {
    const d = String(meta.datePublished || '').slice(0, 10)
    if (!DATE_RE.test(d)) {
      errors.push('Date published (YYYY-MM-DD)')
    }
  } else if (meta.datePublished) {
    // If present while not published, just sanity-check and warn if odd
    const d = String(meta.datePublished).slice(0, 10)
    if (!DATE_RE.test(d)) {
      warnings.push('Date published format should be YYYY-MM-DD')
    }
  }

  // Non-blocking suggestions
  if (meta.hero?.src && !String(meta.hero?.alt || '').trim()) {
    warnings.push('Hero image alt text not set')
  }
  if (meta.destination !== 'committee-reports' && !meta.unit?.unitCode) {
    warnings.push('Unit not set')
  }
  if (!Array.isArray(meta.contributors) || meta.contributors.length === 0) {
    errors.push('At least one contributor')
  } else {
    meta.contributors.forEach((contributor, index) => {
      const label = `Contributor ${index + 1}`
      if (!String(contributor?.given || '').trim()) {
        errors.push(`${label}: given name`)
      }
      if (!String(contributor?.family || '').trim()) {
        errors.push(`${label}: surname`)
      }

      const unitCode =
        typeof contributor?.affiliation === 'string'
          ? ''
          : contributor?.affiliation?.unitCode

      if (!String(unitCode || '').trim()) {
        errors.push(`${label}: unit`)
      }
    })
  }
  if (meta.status === 'published') {
    if (!meta.license || String(meta.license).trim().length === 0) {
      warnings.push('License is empty for a published item')
    }
    const d = safeDate(meta.datePublished)
    if (d && d.getTime() > Date.now()) {
      warnings.push('Date published is in the future')
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  }
}

function safeDate(s) {
  try {
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}
