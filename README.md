# Oireachtas digital publishing studio

Static SvelteKit proof of concept for the publishing journey:

```txt
Create article
→ add publication metadata
→ edit structured content
→ preview rendered article
→ export Stór JSON
```

This app combines:

- the current TipTap / ProseMirror publisher workflow
- the current Stór / Inside Parliament article renderer
- the shared Stór JSON contract

It is designed to work as a static site, including on GitHub Pages.

## What This POC Demonstrates

- A browser-based publishing workflow at `/publish`
- Current metadata handling for:
  - destination
  - article type
  - section / eyebrow
  - topics
  - contributors
  - committee reports
  - hero media
  - auto-generated reference / slug / id
- Structured content editing with TipTap
- Structured blocks for:
  - heading
  - paragraph
  - quote
  - callout
  - image
  - chart
- Browser-only preview at `/preview`
- Static committed sample articles at `/stor/[slug]`
- JSON export of the current Stór payload

## Project Structure

```txt
src/
  lib/
    components/stor/        Current Stór renderer components
    content/stor/           Current Stór article types, validators, sample JSON
    publisher-react/        Current publisher workflow mounted inside SvelteKit
    preview-storage.ts      Browser storage preview utilities
  routes/
    +page.svelte            Landing page
    +layout.svelte          Shared shell
    /publish                Publisher route
    /preview                Browser-storage preview route
    /stor                   Sample article index
    /stor/[slug]            Static committed article route
static/
  media/                    Existing Inside Parliament / Stór assets
stor-content-contract/
  README.md
  stor.schema.json
  example-story.json
```

## Current Contract Preserved

The app was built from the current state of:

- `2025-10-16_PM_with_Markdown/tiptap-poc`
- `2026-04-22-svelte-inside-parliament`
- `stor-content-contract`

Current top-level article fields preserved include:

- `id`
- `slug`
- `type`
- `destination`
- `title`
- `dek`
- `section`
- `committeeName`
- `topics`
- `theme` as deprecated fallback
- `layout`
- `status`
- `hero`
- `contributors`
- `publishedDate`
- `blocks`

Current supported block types:

- `heading`
- `paragraph`
- `quote`
- `callout`
- `image`
- `chart`

## How Preview Works Without a Backend

Preview is fully browser-based.

```txt
Publisher builds current Stór JSON
→ saves it to localStorage
→ opens /preview
→ /preview reads the stored JSON
→ the current Stór article renderer renders it
```

If no preview content exists, `/preview` shows an empty state and links back to `/publish`.

## How Export Works

`Export JSON` downloads the current Stór JSON payload as a `.json` file.

That exported file is the notional publishable artifact for the proof of concept.

The app does not attempt to write files permanently from the browser.

## Static Sample Articles

Committed example JSON lives under:

- `src/lib/content/stor/example-story.json`

Those files are rendered at:

- `/stor/[slug]`

So the static content path works independently of the browser preview path.

## Run Locally

```bash
npm install
npm run check
npm run build
npm run dev
```

Then open:

- `/publish`
- `/preview`
- `/stor/example-story`

## Manual Workflow Test

1. Open `/publish`.
2. Enter title, destination, contributors, and other required metadata.
3. Add content and structured blocks.
4. Click `Preview article`.
5. Confirm `/preview` renders the article.
6. Go back and change content or metadata.
7. Preview again and confirm the rendered article updates.
8. Click `Export JSON`.
9. Confirm `/stor/example-story` works independently of preview storage.

## GitHub Pages Deployment

This app uses SvelteKit static adapter and is configured for non-root base paths.

For the GitHub repo:

```txt
https://github.com/bubcass/digital-publishing-studio
```

the required base path is:

```txt
/digital-publishing-studio
```

Build locally for that repo with:

```bash
BASE_PATH=/digital-publishing-studio npm run build
```

The repo also includes a GitHub Actions workflow at:

- `.github/workflows/deploy.yml`

That workflow:

- installs dependencies
- runs `npm run check`
- builds with `BASE_PATH=/digital-publishing-studio`
- deploys the static `build/` output to GitHub Pages

The static build uses a `404.html` fallback so client-side routes can still resolve on GitHub Pages.

## Deliberately Not Implemented

- permanent browser publishing
- database persistence
- approval workflow
- authentication
- production CMS
- server API preview
- Node-only runtime preview
- full Word import pipeline beyond the current browser import path

## Future Work

- richer static contract docs for `committeeName` and committee report routing
- stronger schema-driven validation feedback
- deeper body block parity with the richer Inside Parliament story system
- optional media picker for existing static assets
- permanent publishing destination beyond browser preview and JSON export
