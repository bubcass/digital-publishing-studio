<script lang="ts">
  import { base } from '$app/paths';
  import type { StorImageBlock } from '$lib/content/stor/types';

  let { block }: { block: StorImageBlock } = $props();

  function assetUrl(src: string) {
    const staticMediaMatch = src.match(/\/static\/media\/(.+)$/);
    if (staticMediaMatch) return `${base}/media/${staticMediaMatch[1]}`;
    if (src.startsWith('/media/')) return `${base}${src}`;
    if (src.startsWith('media/')) return `${base}/${src}`;
    if (!src.includes('/') && /\.[a-z0-9]+$/i.test(src)) return `${base}/media/${src}`;
    if (/^(https?:)?\/\//.test(src)) return src;
    return `${base}${src}`;
  }
</script>

<figure class={`image-block ${block.layout || 'inline'}`}>
  <img src={assetUrl(block.image.src)} alt={block.image.alt} loading="lazy" />
  {#if block.image.caption || block.image.credit}
    <figcaption>
      {block.image.caption}
      {#if block.image.credit}
        <span>{block.image.credit}</span>
      {/if}
    </figcaption>
  {/if}
</figure>

<style>
  .image-block {
    margin: clamp(var(--space-7), 5vw, 4rem) auto;
  }

  .image-block.inline {
    max-width: var(--measure);
  }

  .image-block.wide {
    max-width: min(var(--wide), calc(100vw - (var(--gutter) * 2)));
  }

  .image-block.full {
    max-width: none;
    width: 100%;
  }

  img {
    background: var(--color-soft);
    border: 1px solid var(--color-line);
    display: block;
    height: auto;
    object-fit: cover;
    width: 100%;
  }

  .wide img,
  .full img {
    aspect-ratio: 16 / 9;
  }

  .inline img {
    aspect-ratio: 4 / 3;
  }

  figcaption {
    margin-left: auto;
    margin-right: auto;
  }

  figcaption span {
    color: var(--color-faint);
    display: block;
    margin-top: 0.2rem;
  }

  @media (max-width: 620px) {
    .image-block {
      margin: 3.5rem auto;
    }

    .image-block.wide {
      max-width: none;
      width: 100%;
    }

    .wide img,
    .full img {
      aspect-ratio: 4 / 3;
    }
  }
</style>
