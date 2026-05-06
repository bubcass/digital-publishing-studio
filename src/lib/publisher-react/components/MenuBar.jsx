// src/components/MenuBar.jsx
import React from 'react'

function Icon({ children }) {
  return <span className="menubar-icon" aria-hidden="true">{children}</span>
}

function Btn({ onClick, disabled, active, title, children, wide = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`menubar-button${active ? ' active' : ''}${wide ? ' menubar-button--wide' : ''}`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="menubar-divider" aria-hidden="true" />
}

export default function MenuBar({ editor }) {
  if (!editor) return null

  const insertCallout = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'calloutBlock',
        attrs: {
          title: 'Callout',
          style: 'key-point',
          text: 'Add an important point here.',
        },
      })
      .run()
  }

  const insertChart = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'chartBlock',
        attrs: {
          title: 'Chart placeholder',
          component: 'exampleChart',
          data: '/data/example-chart.json',
        },
      })
      .run()
  }

  const insertImage = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'imageBlock',
        attrs: {
          src: '/media/broad-view-of-full-dail-chamber.jpg',
          alt: 'Broad view of the full Dail chamber',
          caption: '',
          credit: '',
          layout: 'full',
        },
      })
      .run()
  }

  const insertQuote = () => {
    editor.chain().focus().toggleBlockquote().run()
  }

  return (
    <div className="menubar">
      <div className="menubar-group">
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Icon>↶</Icon>
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Icon>↷</Icon>
        </Btn>
      </div>

      <Divider />

      <div className="menubar-group">
        <select
          className="menubar-select"
          onChange={(e) => {
            const val = e.target.value
            if (val === 'p') editor.chain().focus().setParagraph().run()
            else editor.chain().focus().toggleHeading({ level: Number(val) }).run()
          }}
          value={
            editor.isActive('heading', { level: 1 }) ? '1' :
            editor.isActive('heading', { level: 2 }) ? '2' :
            editor.isActive('heading', { level: 3 }) ? '3' :
            editor.isActive('heading', { level: 4 }) ? '4' : 'p'
          }
          title="Heading level"
        >
          <option value="p">Paragraph</option>
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option value="3">H3</option>
          <option value="4">H4</option>
        </select>

        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <Icon>≣</Icon>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
          <Icon>1.</Icon>
        </Btn>
      </div>

      <Divider />

      <div className="menubar-group">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Icon><strong>B</strong></Icon>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Icon><em>I</em></Icon>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Icon><span className="menubar-strike">S</span></Icon>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          <Icon>&lt;/&gt;</Icon>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <Icon><span className="menubar-underline">U</span></Icon>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
          <Icon>✎</Icon>
        </Btn>
        <Btn
          onClick={() => {
            const prev = editor.getAttributes('link')?.href || ''
            const url = window.prompt('Enter URL', prev)
            if (url === null) return
            if (url === '') return editor.chain().focus().unsetLink().run()
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          }}
          active={editor.isActive('link')}
          title="Link"
        >
          <Icon>⌁</Icon>
        </Btn>
      </div>

      <Divider />

      <div className="menubar-group">
        <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
          <Icon>x²</Icon>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
          <Icon>x₂</Icon>
        </Btn>
      </div>

      <Divider />

      <div className="menubar-group">
        <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
          <Icon>☰</Icon>
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
          <Icon>≣</Icon>
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
          <Icon>☷</Icon>
        </Btn>
      </div>

      <Divider />

      <div className="menubar-group menubar-group--muted">
        <details className="menubar-menu">
          <summary className="menubar-menu__summary">
            <Icon>⊞</Icon>
            <span>Add</span>
          </summary>
          <div className="menubar-menu__panel">
            <button type="button" onClick={insertImage}>Full-width image</button>
            <button type="button" onClick={insertQuote}>Quote</button>
            <button type="button" onClick={insertCallout}>Callout</button>
            <button type="button" onClick={insertChart}>Chart placeholder</button>
          </div>
        </details>
      </div>
    </div>
  )
}
