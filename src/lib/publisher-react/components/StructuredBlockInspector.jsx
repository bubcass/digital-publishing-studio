import React from 'react'

function Field({ label, children }) {
  return (
    <label className="inspector-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export default function StructuredBlockInspector({ selectedBlock, onUpdate }) {
  if (!selectedBlock) {
    return (
      <aside className="inspector-panel inspector-panel--idle">
        <h3>Inspector</h3>
        <p>Select an image, callout, or chart only when you need to edit it.</p>
      </aside>
    )
  }

  if (selectedBlock.type === 'calloutBlock') {
    return (
      <aside className="inspector-panel">
        <h3>Callout Block</h3>
        <Field label="Label">
          <input
            value={selectedBlock.attrs.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </Field>
        <Field label="Style">
          <select
            value={selectedBlock.attrs.style || 'default'}
            onChange={(e) => onUpdate({ style: e.target.value })}
          >
            <option value="default">default</option>
            <option value="key-point">key-point</option>
            <option value="note">note</option>
          </select>
        </Field>
        <Field label="Text">
          <textarea
            rows={6}
            value={selectedBlock.attrs.text || ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
          />
        </Field>
      </aside>
    )
  }

  if (selectedBlock.type === 'chartBlock') {
    return (
      <aside className="inspector-panel">
        <h3>Chart Block</h3>
        <Field label="Title">
          <input
            value={selectedBlock.attrs.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </Field>
        <Field label="Component">
          <input
            value={selectedBlock.attrs.component || ''}
            onChange={(e) => onUpdate({ component: e.target.value })}
          />
        </Field>
        <Field label="Data Path">
          <input
            value={selectedBlock.attrs.data || ''}
            onChange={(e) => onUpdate({ data: e.target.value })}
          />
        </Field>
      </aside>
    )
  }

  if (selectedBlock.type === 'imageBlock') {
    return (
      <aside className="inspector-panel">
        <h3>Image Block</h3>
        <Field label="Image Path">
          <input
            value={selectedBlock.attrs.src || ''}
            onChange={(e) => onUpdate({ src: e.target.value })}
          />
        </Field>
        <Field label="Alt Text">
          <input
            value={selectedBlock.attrs.alt || ''}
            onChange={(e) => onUpdate({ alt: e.target.value })}
          />
        </Field>
        <Field label="Caption">
          <input
            value={selectedBlock.attrs.caption || ''}
            onChange={(e) => onUpdate({ caption: e.target.value })}
          />
        </Field>
        <Field label="Credit">
          <input
            value={selectedBlock.attrs.credit || ''}
            onChange={(e) => onUpdate({ credit: e.target.value })}
          />
        </Field>
        <Field label="Layout">
          <select
            value={selectedBlock.attrs.layout || 'inline'}
            onChange={(e) => onUpdate({ layout: e.target.value })}
          >
            <option value="inline">inline</option>
            <option value="wide">wide</option>
            <option value="full">full</option>
          </select>
        </Field>
      </aside>
    )
  }

  return null
}
