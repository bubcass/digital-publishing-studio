import { Node, mergeAttributes } from '@tiptap/core'

export const ImageBlock = Node.create({
  name: 'imageBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-src') || '',
        renderHTML: (attributes) => ({ 'data-src': attributes.src || '' }),
      },
      alt: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-alt') || '',
        renderHTML: (attributes) => ({ 'data-alt': attributes.alt || '' }),
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption') || '',
        renderHTML: (attributes) => ({ 'data-caption': attributes.caption || '' }),
      },
      credit: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-credit') || '',
        renderHTML: (attributes) => ({ 'data-credit': attributes.credit || '' }),
      },
      layout: {
        default: 'inline',
        parseHTML: (element) => element.getAttribute('data-layout') || 'inline',
        renderHTML: (attributes) => ({ 'data-layout': attributes.layout || 'inline' }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'stor-image' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'stor-image',
      mergeAttributes(HTMLAttributes, {
        class: `stor-embedded-block stor-embedded-block--image stor-embedded-block--${node.attrs.layout || 'inline'}`,
      }),
      ['div', { class: 'stor-embedded-block__eyebrow' }, 'Image'],
      ['p', { class: 'stor-embedded-block__text' }, node.attrs.alt || 'Image description'],
      ['p', { class: 'stor-embedded-block__meta' }, node.attrs.src || 'No image path selected'],
      ...(node.attrs.caption ? [['p', { class: 'stor-embedded-block__meta' }, node.attrs.caption]] : []),
    ]
  },
})
