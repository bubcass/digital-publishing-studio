function safeSlug(input = '') {
  const base = String(input).trim() || 'untitled-story'
  return (
    base
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-]+|[-]+$/g, '')
      .toLowerCase() || 'untitled-story'
  )
}

function normalizeMediaPath(value = '') {
  const src = String(value || '').trim()
  if (!src) return ''

  const staticMediaMatch = src.match(/\/static\/media\/(.+)$/)
  if (staticMediaMatch) {
    return `/media/${staticMediaMatch[1]}`
  }

  if (src.startsWith('/media/')) return src
  if (src.startsWith('media/')) return `/${src}`
  if (!src.includes('/') && /\.[a-z0-9]+$/i.test(src)) return `/media/${src}`

  return src
}

function inferAssetType(src = '', explicitType = '') {
  if (explicitType === 'video' || explicitType === 'image') return explicitType
  return /\.(mp4|webm|ogg|mov)$/i.test(src) ? 'video' : 'image'
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderMarks(text, marks = []) {
  return marks.reduce((output, mark) => {
    if (mark.type === 'bold') return `<strong>${output}</strong>`
    if (mark.type === 'italic') return `<em>${output}</em>`
    if (mark.type === 'underline') return `<u>${output}</u>`
    if (mark.type === 'strike') return `<s>${output}</s>`
    if (mark.type === 'code') return `<code>${output}</code>`
    if (mark.type === 'link') {
      const href = escapeHtml(mark.attrs?.href || '#')
      return `<a href="${href}">${output}</a>`
    }
    return output
  }, escapeHtml(text))
}

function renderInline(node) {
  if (!node) return ''
  if (node.type === 'text') return renderMarks(node.text || '', node.marks)
  if (node.type === 'hardBreak') return '<br />'
  if (Array.isArray(node.content)) {
    return node.content.map(renderInline).join('')
  }
  return ''
}

function toPlainText(value = '') {
  return String(value)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function paragraphBlock(text = '') {
  return {
    type: 'paragraph',
    text,
  }
}

function blockFromParagraph(node) {
  const html = renderInline(node)
  const text = toPlainText(html)

  if (!text) return null

  return paragraphBlock(html)
}

function blocksFromList(node, ordered = false) {
  const items = node.content || []

  return items
    .map((item, index) => {
      const lines = (item.content || [])
        .map((child) => toPlainText(renderInline(child)))
        .filter(Boolean)

      if (!lines.length) return null

      const prefix = ordered ? `${index + 1}. ` : '• '
      return paragraphBlock(escapeHtml(`${prefix}${lines.join(' ')}`))
    })
    .filter(Boolean)
}

function blockFromQuote(node) {
  const parts = (node.content || [])
    .map((child) => toPlainText(renderInline(child)))
    .filter(Boolean)

  if (!parts.length) return null

  const lastPart = parts[parts.length - 1]
  const attributionMatch = lastPart.match(/^[—-]\s*(.+)$/)

  if (attributionMatch) {
    return {
      type: 'quote',
      text: parts.slice(0, -1).join(' '),
      attribution: attributionMatch[1],
    }
  }

  return {
    type: 'quote',
    text: parts.join(' '),
  }
}

function blockFromCallout(node) {
  return {
    type: 'callout',
    title: node.attrs?.title || 'Callout',
    ...(node.attrs?.style ? { style: node.attrs.style } : {}),
    text: escapeHtml(node.attrs?.text || ''),
  }
}

function blockFromChart(node) {
  return {
    type: 'chart',
    title: node.attrs?.title || 'Chart placeholder',
    ...(node.attrs?.component ? { component: node.attrs.component } : {}),
    ...(node.attrs?.data ? { data: node.attrs.data } : {}),
  }
}

function blockFromImage(node) {
  const src = normalizeMediaPath(node.attrs?.src || '')
  return {
    type: 'image',
    image: {
      src,
      type: inferAssetType(src),
      alt: node.attrs?.alt || '',
      ...(node.attrs?.caption ? { caption: node.attrs.caption } : {}),
      ...(node.attrs?.credit ? { credit: node.attrs.credit } : {}),
    },
    ...(node.attrs?.layout ? { layout: node.attrs.layout } : {}),
  }
}

function extractBlocks(docJson = {}) {
  const nodes = docJson.content || []
  const blocks = []

  for (const node of nodes) {
    if (node.type === 'heading') {
      const text = renderInline(node)
      if (!toPlainText(text)) continue

      blocks.push({
        type: 'heading',
        level: node.attrs?.level || 2,
        text,
      })
      continue
    }

    if (node.type === 'paragraph') {
      const block = blockFromParagraph(node)
      if (block) blocks.push(block)
      continue
    }

    if (node.type === 'blockquote') {
      const block = blockFromQuote(node)
      if (block) blocks.push(block)
      continue
    }

    if (node.type === 'calloutBlock') {
      blocks.push(blockFromCallout(node))
      continue
    }

    if (node.type === 'chartBlock') {
      blocks.push(blockFromChart(node))
      continue
    }

    if (node.type === 'imageBlock') {
      blocks.push(blockFromImage(node))
      continue
    }

    if (node.type === 'bulletList') {
      blocks.push(...blocksFromList(node, false))
      continue
    }

    if (node.type === 'orderedList') {
      blocks.push(...blocksFromList(node, true))
      continue
    }

    if (node.type === 'codeBlock') {
      const text = toPlainText(renderInline(node))
      if (text) blocks.push(paragraphBlock(`<code>${escapeHtml(text)}</code>`))
    }
  }

  return blocks
}

function contributorName(contributor = {}) {
  const parts = [contributor.given, contributor.family].filter(Boolean)
  return parts.join(' ').trim() || contributor.family || ''
}

function normalizeAffiliation(value) {
  if (!value) return undefined
  if (typeof value === 'string') return value.trim() || undefined
  return value.unit || value.org || undefined
}

function extractContributors(metadata = {}) {
  const contributors = (metadata.contributors || [])
    .map((contributor) => ({
      name: contributorName(contributor),
      role: contributor.role || 'author',
      ...(normalizeAffiliation(contributor.affiliation)
        ? { affiliation: normalizeAffiliation(contributor.affiliation) }
        : {}),
      ...(typeof contributor.showAsAuthor === 'boolean'
        ? { showAsAuthor: contributor.showAsAuthor }
        : {}),
    }))
    .filter((contributor) => contributor.name)

  if (contributors.length) return contributors

  return []
}

function extractHero(metadata = {}) {
  const src = normalizeMediaPath(metadata.hero?.src?.trim())
  if (!src) return undefined

  return {
    type: inferAssetType(src, metadata.hero?.type?.trim()),
    src,
    alt: metadata.hero?.alt?.trim() || '',
    ...(normalizeMediaPath(metadata.hero?.poster?.trim())
      ? { poster: normalizeMediaPath(metadata.hero.poster.trim()) }
      : {}),
    ...(metadata.hero?.caption?.trim() ? { caption: metadata.hero.caption.trim() } : {}),
    ...(metadata.hero?.credit?.trim() ? { credit: metadata.hero.credit.trim() } : {}),
  }
}

export function pmToStorDocument(docJson, metadata = {}) {
  const slug = metadata.slug?.trim() || safeSlug(metadata.title)
  const section = metadata.section?.trim() || metadata.theme?.trim() || ''
  const topics = Array.isArray(metadata.topics)
    ? metadata.topics.map((topic) => String(topic || '').trim()).filter(Boolean)
    : []

  return {
    id: metadata.storId?.trim() || slug,
    slug,
    type:
      metadata.destination === 'committee-reports'
        ? 'committee-report'
        : metadata.contentType || 'research-resource',
    destination: metadata.destination || 'inside-parliament',
    title: metadata.title || 'Untitled story',
    dek: metadata.dek || metadata.subtitle || metadata.abstract || '',
    ...(section ? { section } : {}),
    ...(metadata.committeeName?.trim()
      ? { committeeName: metadata.committeeName.trim() }
      : {}),
    ...(metadata.theme ? { theme: metadata.theme } : {}),
    ...(topics.length ? { topics } : {}),
    layout: metadata.layout || 'standard',
    status: metadata.status || 'draft',
    ...(extractHero(metadata) ? { hero: extractHero(metadata) } : {}),
    contributors: extractContributors(metadata),
    publishedDate: metadata.datePublished || null,
    blocks: extractBlocks(docJson),
  }
}
