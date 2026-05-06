// src/utils/markdown.js
import { marked } from 'marked'

// Configure as needed
marked.setOptions({
  gfm: true,
  breaks: true,
})

export function mdToHtml(md = '') {
  return marked.parse(md || '')
}

// super-light heuristic so we don't convert every paste of plain text
export function looksLikeMarkdown(s = '') {
  if (!s) return false
  // quick wins: headings, lists, fenced code, link syntax
  return (
    /^#{1,6}\s/m.test(s) ||                 // # Heading
    /^[\-\*\+]\s/m.test(s) ||               // - list
    /^\d+\.\s/m.test(s) ||                  // 1. list
    /(^|\n)```/.test(s) ||                  // fenced code
    /$begin:math:display$.+$end:math:display$$begin:math:text$.+$end:math:text$/.test(s) ||               // [link](url)
    /^>\s/m.test(s)                         // blockquote
  )
}