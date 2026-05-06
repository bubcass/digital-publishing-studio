<script lang="ts">
  import type { StorChartBlock } from '$lib/content/stor/types';

  let { block }: { block: StorChartBlock } = $props();
</script>

<section class="chart-block" aria-label={block.title ?? 'Chart placeholder'}>
  <p class="eyebrow">Chart</p>
  <h2>{block.title || 'Chart placeholder'}</h2>
  <div class="chart-placeholder">
    <p>Chart component placeholder</p>
    {#if block.component}
      <p><strong>Component:</strong> {block.component}</p>
    {/if}
    {#if block.data}
      <p><strong>Data:</strong> {block.data}</p>
    {/if}
  </div>
</section>

<style>
  .chart-block {
    margin: clamp(var(--space-7), 5vw, 4rem) auto;
    max-width: var(--measure-prose);
    width: 100%;
  }

  h2 {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-heading);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-4);
  }

  .chart-placeholder {
    background: var(--color-soft);
    border: 1px dashed var(--color-line-strong);
    color: var(--color-muted);
    padding: var(--space-7);
    text-align: center;
  }

  .chart-placeholder p {
    margin: 0.35rem 0;
  }

  .chart-placeholder strong {
    color: var(--color-accent-2);
  }

  @media (max-width: 620px) {
    .chart-block {
      margin: 3rem auto;
    }
  }
</style>
