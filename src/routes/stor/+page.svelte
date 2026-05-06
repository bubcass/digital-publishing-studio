<script lang="ts">
  import { base } from '$app/paths';

  let { data } = $props();
</script>

<svelte:head>
  <title>Sample articles | Oireachtas digital publishing studio</title>
</svelte:head>

<section class="home-hero page-shell">
  <div>
    <p class="eyebrow">Committed sample content</p>
    <h1>Stór sample articles</h1>
  </div>
  <p class="lede">
    These routes are built from committed JSON content and work independently of browser preview storage.
  </p>
</section>

<section class="page-shell article-index">
  {#each data.articles as article}
    <article class="article-index__item">
      {#if article.section}
        <p class="eyebrow">{article.section}</p>
      {/if}
      <h2><a href="{base}/stor/{article.slug}/">{article.title}</a></h2>
      {#if article.dek}
        <p class="kicker">{article.dek}</p>
      {/if}
      {#if article.publishedDate}
        <small>{article.publishedDate}</small>
      {/if}
    </article>
  {/each}
</section>

<style>
  .article-index {
    display: grid;
    gap: var(--space-7);
    padding-bottom: var(--space-8);
    padding-top: var(--space-8);
  }

  .article-index__item {
    border-top: 1px solid var(--color-line);
    max-width: var(--measure);
    padding-top: var(--space-5);
  }

  h2 {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-heading);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-3);
  }

  small {
    color: var(--color-muted);
    display: block;
    font-size: var(--font-size-small);
    margin-top: var(--space-3);
  }
</style>
