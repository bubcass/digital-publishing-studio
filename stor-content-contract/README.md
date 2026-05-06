# Stór Content Contract

This folder is the shared publishing-contract area for the integration prototype.

Current pipeline:

```txt
Document/text input
→ Stór Publisher (TipTap / ProseMirror)
→ Stór JSON contract
→ SvelteKit Stór renderer
→ Inside Parliament / Stór-style resource page
```

## Files

- `stor.schema.json`
  The current JSON Schema for the shared article/resource contract.
- `example-story.json`
  A richer sample article that demonstrates the current shape.

## Current top-level fields

Required:

- `slug`
- `title`
- `blocks`

Supported optional metadata:

- `id`
- `type`
- `destination`
- `dek`
- `section`
- `committeeName`
- `topics`
- `theme` (deprecated fallback)
- `layout`
- `status`
- `hero`
- `contributors`
- `publishedDate`

Notes:

- `section` is used as the rendered eyebrow / visible series label.
- `committeeName` is used in the same visible eyebrow slot for committee reports.
- `topics` are optional classification tags. They are available to the renderer but are not shown in the article header yet.
- `theme` is deprecated and kept only as a fallback for older JSON.
- `destination` and `type` are taxonomy and routing metadata. They are not shown in the page header.
- `committee-reports` is a supported destination in the current publisher workflow.
- `publishedDate` is displayed in the page metadata line.
- reading time is computed by the SvelteKit renderer from block text at roughly 200 words per minute.
- `hero` is optional. When present, it renders as the main article image above the story body.
- Media paths can point at assets already stored under `2026-04-22-svelte-inside-parliament/static/media/`, for example `/media/full_chamber.png`.

Contributor model:

```json
{
  "name": "Library & Research Service",
  "role": "author",
  "affiliation": "Houses of the Oireachtas",
  "showAsAuthor": true
}
```

Legacy `authors` is now deprecated. The renderer still accepts it as a fallback, but new exports should use `contributors`.

## Supported block types

- `heading`
- `paragraph`
- `quote`
- `callout`
- `image`
- `chart`

Hero / image asset model:

```json
{
  "src": "/media/example.jpg",
  "type": "image",
  "alt": "Describe the image",
  "poster": "/media/example-poster.jpg",
  "caption": "Optional caption",
  "credit": "Optional credit"
}
```

Section / eyebrow authoring:

- The publisher offers destination-specific section options.
- `stor` options:
  `Learning Hub`, `Open Data Insight`, `Visual Data`, `Research Matters`, `Committee Report`
- `inside-parliament` options:
  `Learning Hub`, `Parliament Essentials`, `Report Launch`, `Open Data Insight`, `The Seanad at Work`, `The Dáil at Work`, `Committees at Work`, `The Week Ahead`
- `Other / custom` is also supported. The exported JSON stores the resolved visible label in `section`.

## Temporary publisher conventions

The current publisher now exposes explicit editor controls for callouts and charts.

Older paragraph conventions such as:

- `callout: This becomes a callout block`
- `callout: key-point | This becomes a styled callout block`
- `chart: exampleChart | /data/example-chart.json`

have been superseded by explicit node-based insert controls in the toolbar. They remain useful as historical context for the prototype but are no longer the primary authoring path.

## How the prototype uses this contract

- The publisher exports JSON in this shape.
- The SvelteKit app reads JSON files from `2026-04-22-svelte-inside-parliament/src/lib/content/stor/`.
- In dev mode, the publisher can also POST JSON directly to the SvelteKit preview endpoint.
- The `/stor/[slug]` route renders that content using the current contract-aligned types and validator.

## Manual test checklist

1. Open the publisher app.
2. Choose an input path and enter publication metadata.
3. Edit the content in the TipTap editor.
4. Use the toolbar buttons to insert callout and chart blocks where needed.
5. Add at least one contributor with `Show as author on page` enabled.
6. Choose a `Section / eyebrow` value and optionally add `Topics`.
7. Export `Stór JSON` or use the direct preview action in the publisher.
8. Either place the exported file in `2026-04-22-svelte-inside-parliament/src/lib/content/stor/`, or send it directly to the preview endpoint in dev mode.
9. Start or open the SvelteKit app.
10. Open `/stor/<slug>` or `/stor/preview/<slug>`.
11. Confirm the eyebrow uses `section` when present, the byline comes from visible contributors, and the metadata line shows `publishedDate` plus computed reading time.

## Placeholder / future work

- A true multi-step publisher flow.
- A richer taxonomy model beyond the current `destination` and `type` strings.
- Explicit editor controls for callouts, charts, references and data resources.
- Stronger schema-driven validation in the publisher export flow.
