<script lang="ts">
  import type { StorBlock } from '$lib/content/stor/types';
  import StorChartPlaceholder from './StorChartPlaceholder.svelte';
  import StorImageBlock from './StorImageBlock.svelte';

  let { block }: { block: StorBlock } = $props();
</script>

{#if block.type === 'heading'}
  <section class="text-block heading-block">
    {#if block.level === 1}
      <h1>{@html block.text}</h1>
    {:else if block.level === 3}
      <h3>{@html block.text}</h3>
    {:else if block.level === 4}
      <h4>{@html block.text}</h4>
    {:else}
      <h2>{@html block.text}</h2>
    {/if}
  </section>
{:else if block.type === 'paragraph'}
  <section class="text-block paragraph-block">
    <p>{@html block.text}</p>
  </section>
{:else if block.type === 'callout'}
  <section class={`callout-block ${block.style ?? 'default'}`}>
    {#if block.title}
      <p class="eyebrow">{block.title}</p>
    {/if}
    <div class="callout-card">
      <p>{@html block.text}</p>
    </div>
  </section>
{:else if block.type === 'quote'}
  <figure class="quote-block">
    <blockquote>
      <p>{block.text}</p>
    </blockquote>
    {#if block.attribution}
      <figcaption>{block.attribution}</figcaption>
    {/if}
  </figure>
{:else if block.type === 'image'}
  <StorImageBlock {block} />
{:else if block.type === 'chart'}
  <StorChartPlaceholder {block} />
{/if}

<style>
  .text-block,
  .callout-block,
  .quote-block {
    max-width: var(--measure-prose);
    width: 100%;
  }

  .heading-block {
    margin: clamp(var(--space-7), 5vw, 4rem) auto var(--space-stack);
  }

  .paragraph-block {
    margin: 0 auto var(--space-stack);
  }

  .callout-block,
  .quote-block {
    margin: clamp(var(--space-7), 5vw, 4rem) auto;
  }

  h2,
  h3,
  h4 {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-heading);
    line-height: var(--line-height-heading);
    margin: 0;
    text-wrap: balance;
  }

  h2 {
    font-size: var(--font-size-h2);
  }

  h3,
  h4 {
    font-size: var(--font-size-h3);
  }

  p {
    color: var(--color-ink);
    font-family: var(--font-serif);
    font-size: var(--font-size-body);
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-body);
    margin: 0 0 var(--space-stack);
  }

  .paragraph-block p :global(a),
  .callout-card p :global(a) {
    color: var(--link);
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--link) 55%, transparent);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.18em;
  }

  .paragraph-block p :global(strong),
  .callout-card p :global(strong) {
    color: var(--color-accent-2);
    font-weight: 600;
  }

  .paragraph-block p:last-child {
    margin-bottom: 0;
  }

  .callout-card {
    background: var(--color-soft);
    border: 1px solid var(--color-line);
    padding: var(--space-5);
  }

  .callout-block.key-point .callout-card {
    border-color: var(--color-line-strong);
  }

  .quote-block {
    border-left: 1px solid var(--color-line-strong);
    padding: var(--space-2) 0 var(--space-2) var(--space-5);
  }

  .callout-card p:last-child,
  .quote-block p:last-child {
    margin-bottom: 0;
  }

  blockquote {
    margin: 0;
  }

  .quote-block p {
    font-size: clamp(1.2rem, 1.9vw, 1.65rem);
    font-weight: 500;
    line-height: 1.3;
    text-wrap: balance;
  }

  figcaption {
    color: var(--color-muted);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-meta);
    letter-spacing: 0.09em;
    line-height: var(--line-height-small);
    margin-top: var(--space-4);
    text-transform: uppercase;
  }

  @media (max-width: 620px) {
    .heading-block,
    .callout-block,
    .quote-block {
      margin: 3rem auto;
    }

    .paragraph-block {
      margin: 0 auto var(--space-stack);
    }
  }
</style>
