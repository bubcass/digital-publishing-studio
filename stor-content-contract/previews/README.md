# Shared Preview Folder

In development, the SvelteKit `/stor/[slug]` route can read JSON files from this folder.

Use the publisher’s `Save To Shared Preview Folder` action and choose this directory in the browser file picker.

Current dev preview flow:

```txt
Publisher
→ save <slug>.json into stor-content-contract/previews/
→ open /stor/<slug> in the SvelteKit app
```

This folder is for temporary preview content only. Checked-in sample contract files still live one level up in:

- `stor-content-contract/example-story.json`
