<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import StorArticlePage from '$lib/components/stor/StorArticlePage.svelte';
  import { validateStorPreviewArticle } from '$lib/content/stor/preview-store';
  import { readCurrentPreviewArticle } from '$lib/preview-storage';
  import type { StorArticle } from '$lib/content/stor/types';

  let article = $state<StorArticle | null>(null);
  let errorMessage = $state('');
  let loaded = $state(false);

  onMount(() => {
    const stored = readCurrentPreviewArticle();
    if (!stored) {
      loaded = true;
      return;
    }

    try {
      article = validateStorPreviewArticle(stored);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Preview content could not be loaded.';
    } finally {
      loaded = true;
    }
  });
</script>

<svelte:head>
  <title>Preview | Oireachtas digital publishing studio</title>
</svelte:head>

{#if !loaded}
  <section class="page-shell preview-state">
    <p class="eyebrow">Preview</p>
    <h1>Loading preview</h1>
  </section>
{:else if article}
  <StorArticlePage story={article} />
{:else}
  <section class="page-shell preview-state">
    <p class="eyebrow">Preview</p>
    <h1>No preview article yet</h1>
    <p class="kicker">
      {errorMessage || 'Create or edit an article in the publisher, then click Preview article to render it here.'}
    </p>
    <a class="landing-link" href="{base}/publish/">Go to publisher</a>
  </section>
{/if}

<style>
  .preview-state {
    display: grid;
    gap: var(--space-4);
    max-width: var(--measure);
    min-height: 40vh;
    padding-bottom: var(--space-8);
    padding-top: var(--space-8);
  }

  h1 {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-heading);
    line-height: var(--line-height-heading);
    margin: 0;
  }
</style>
