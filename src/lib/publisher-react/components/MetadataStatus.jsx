// src/components/MetadataStatus.jsx
import React from 'react'

export default function MetadataStatus({ report, metadata }) {
  const errs = Array.isArray(report?.errors) ? report.errors : []
  const warns = Array.isArray(report?.warnings) ? report.warnings : []

  // Normalize to { field?: string, message: string }
  const norm = errs.map(e =>
    typeof e === 'string' ? { message: e } : { field: e.field, message: e.message || String(e) },
  )
  const normWarnings = warns.map(w =>
    typeof w === 'string' ? { message: w } : { field: w.field, message: w.message || String(w) },
  )

  const hasErrors = norm.length > 0
  const hasWarnings = normWarnings.length > 0
  const status = (metadata?.status || 'draft').toLowerCase()
  const version = metadata?.version || ''
  const title = metadata?.title || 'Untitled research document'
  const destination =
    metadata?.destination === 'stor'
      ? 'Stór'
      : metadata?.destination === 'committee-reports'
        ? 'Committee reports'
        : 'Inside Parliament'

  // ✅ Build contributor names list
  const contribs = Array.isArray(metadata?.contributors) ? metadata.contributors : []
  const contribNames = contribs
    .map(c => [c.given, c.family].filter(Boolean).join(' ').trim())
    .filter(Boolean)
  const contribText = contribNames.length
    ? `Contributors: ${contribNames.join(', ')}`
    : 'No contributors listed'

  const readiness = hasErrors ? 'blocked' : hasWarnings ? 'caution' : 'ready'
  const pillClass = `pill pill--${readiness}`
  const pillTitle = hasErrors
    ? 'Requirements not met'
    : hasWarnings
      ? `Ready for publication to ${destination}, but could use more detail`
      : `Ready for publication to ${destination}`

  return (
    <div className="status-wrap">
      <div className={pillClass}>
        <div className="pill-main">
          <div className="pill-title">
            <span>{pillTitle}</span>
            <div className="pill-title__meta">
              <span className="pill-badge pill-badge--status" title={`Status: ${status}`}>
                {status.replace('_', ' ')}
              </span>
              {version && (
                <span className="pill-badge" title="Version">{`v${version}`}</span>
              )}
            </div>
          </div>

          {/* ✅ Title + contributor names */}
          <div className="pill-meta">
            <span title="Document title">{title}</span>
            <span className="pill-dot">•</span>
            <span title="Contributors">{contribText}</span>
          </div>

          {(hasErrors || hasWarnings) && (
            <div className="pill-errors">
              <details open={true}>
                <summary>
                  Show details ({norm.length + normWarnings.length})
                </summary>
                <ul>
                  {norm.map((e, i) => (
                    <li key={`error-${i}`}>
                      {e.field ? <strong>{humanize(e.field)}:</strong> : null}{' '}
                      {e.message || 'Required field is missing.'}
                    </li>
                  ))}
                  {normWarnings.map((w, i) => (
                    <li key={`warning-${i}`}>
                      {w.field ? <strong>{humanize(w.field)}:</strong> : null}{' '}
                      {w.message}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Simple label prettifier for field keys like "datePublished" → "Date Published"
function humanize(k = '') {
  if (!k) return ''
  return String(k)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}
