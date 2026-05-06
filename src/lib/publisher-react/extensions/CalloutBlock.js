import { Node, mergeAttributes } from '@tiptap/core'

export const CalloutBlock = Node.create({
  name: 'calloutBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'Callout',
        parseHTML: (element) => element.getAttribute('data-title') || 'Callout',
        renderHTML: (attributes) => ({ 'data-title': attributes.title || 'Callout' }),
      },
      style: {
        default: 'default',
        parseHTML: (element) => element.getAttribute('data-style') || 'default',
        renderHTML: (attributes) => ({ 'data-style': attributes.style || 'default' }),
      },
      text: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-text') || '',
        renderHTML: (attributes) => ({ 'data-text': attributes.text || '' }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'stor-callout' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'stor-callout',
      mergeAttributes(HTMLAttributes, {
        class: `stor-embedded-block stor-embedded-block--callout stor-embedded-block--${node.attrs.style || 'default'}`,
      }),
      ['div', { class: 'stor-embedded-block__eyebrow' }, node.attrs.title || 'Callout'],
      ['p', { class: 'stor-embedded-block__text' }, node.attrs.text || 'Empty callout'],
    ]
  },
})
