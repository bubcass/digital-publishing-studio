import { Node, mergeAttributes } from '@tiptap/core'

export const ChartBlock = Node.create({
  name: 'chartBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'Chart placeholder',
        parseHTML: (element) => element.getAttribute('data-title') || 'Chart placeholder',
        renderHTML: (attributes) => ({ 'data-title': attributes.title || 'Chart placeholder' }),
      },
      component: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-component') || '',
        renderHTML: (attributes) => ({ 'data-component': attributes.component || '' }),
      },
      data: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-data') || '',
        renderHTML: (attributes) => ({ 'data-data': attributes.data || '' }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'stor-chart' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'stor-chart',
      mergeAttributes(HTMLAttributes, {
        class: 'stor-embedded-block stor-embedded-block--chart',
      }),
      ['div', { class: 'stor-embedded-block__eyebrow' }, 'Chart'],
      ['p', { class: 'stor-embedded-block__text' }, node.attrs.title || 'Chart placeholder'],
      ['p', { class: 'stor-embedded-block__meta' }, node.attrs.component || 'No component selected'],
      ['p', { class: 'stor-embedded-block__meta' }, node.attrs.data || 'No data file selected'],
    ]
  },
})
