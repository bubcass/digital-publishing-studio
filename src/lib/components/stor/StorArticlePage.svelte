<script lang="ts">
  import { base } from '$app/paths';
  import { plainTextFromHtml } from '$lib/content/text';
  import type { StorArticle } from '$lib/content/stor/types';
  import StorBlockRenderer from './StorBlockRenderer.svelte';
  import StorStoryToolbar from './StorStoryToolbar.svelte';

  let { story }: { story: StorArticle } = $props();

  function formatDate(value: string | null) {
    if (!value) return null;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return new Intl.DateTimeFormat('en-IE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(parsed);
  }

  function estimateReadingTime(article: StorArticle) {
    const text = article.blocks
      .map((block) => {
        switch (block.type) {
          case 'chart':
            return [block.title, block.component].filter(Boolean).join(' ');
          case 'quote':
            return [block.text, block.attribution].filter(Boolean).join(' ');
          case 'callout':
            return [block.title, block.text].filter(Boolean).join(' ');
          case 'image':
            return [block.image.alt, block.image.caption, block.image.credit].filter(Boolean).join(' ');
          case 'heading':
          case 'paragraph':
            return block.text;
          default:
            return '';
        }
      })
      .join(' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  }

  function visibleAuthorNames(article: StorArticle) {
    const contributors = article.contributors?.length ? article.contributors : article.authors ?? [];
    const visibleAuthors = contributors.filter((contributor) => contributor.showAsAuthor === true);

    if (visibleAuthors.length) {
      return visibleAuthors.map((contributor) => contributor.name).join(', ');
    }

    if (!article.contributors?.length && contributors.length) {
      return contributors[0].name;
    }

    return null;
  }

  function assetUrl(src: string) {
    const staticMediaMatch = src.match(/\/static\/media\/(.+)$/);
    if (staticMediaMatch) return `${base}/media/${staticMediaMatch[1]}`;
    if (src.startsWith('/media/')) return `${base}${src}`;
    if (src.startsWith('media/')) return `${base}/${src}`;
    if (!src.includes('/') && /\.[a-z0-9]+$/i.test(src)) return `${base}/media/${src}`;
    if (/^(https?:)?\/\//.test(src)) return src;
    return `${base}${src}`;
  }

  function heroType(article: StorArticle) {
    const explicitType = article.hero?.type;
    if (explicitType === 'video' || explicitType === 'image') return explicitType;
    const src = article.hero?.src || '';
    return /\.(mp4|webm|ogg|mov)$/i.test(src) ? 'video' : 'image';
  }

  function heroLayout(article: StorArticle) {
    if (article.layout === 'immersive') return 'immersive';
    if (article.layout === 'split' || article.layout === 'feature') return 'split';
    return 'contained';
  }

  let authorLine = $derived(visibleAuthorNames(story));
  let publishedDate = $derived(formatDate(story.publishedDate ?? null));
  let eyebrow = $derived(story.section || story.committeeName || story.theme || null);
  let readingTime = $derived(estimateReadingTime(story));
  let layout = $derived(heroLayout(story));
  let heroIsVideo = $derived(story.hero ? heroType(story) === 'video' : false);
</script>

<svelte:head>
  <title>{story.title} | Inside Parliament</title>
  <meta name="description" content={plainTextFromHtml(story.dek ?? '')} />
</svelte:head>

<article class="story">
  <header class={`story-hero ${layout}`}>
    {#if story.hero && layout === 'immersive'}
      <figure class="hero-media">
        {#if heroIsVideo}
          <video
            autoplay
            muted
            loop
            playsinline
            aria-label={story.hero.alt}
            poster={story.hero.poster ? assetUrl(story.hero.poster) : undefined}
          >
            <source src={assetUrl(story.hero.src)} type="video/mp4" />
          </video>
        {:else}
          <img src={assetUrl(story.hero.src)} alt={story.hero.alt} fetchpriority="high" />
        {/if}
        <div class="hero-overlay">
          {#if eyebrow}
            <p class="eyebrow">{eyebrow}</p>
          {/if}
          <h1>{story.title}</h1>
          {#if story.dek}
            <p class="lede overlay-dek">{story.dek}</p>
          {/if}
          <div class="meta" aria-label="Story details">
            {#if authorLine}
              <span>By {authorLine}</span>
            {/if}
            {#if publishedDate}
              <span>{publishedDate}</span>
            {/if}
            <span>{readingTime}</span>
          </div>
        </div>
      </figure>

      <div class="mobile-immersive-copy">
        {#if story.dek}
          <p class="lede">{story.dek}</p>
        {/if}
        <div class="meta" aria-label="Story details">
          {#if authorLine}
            <span>By {authorLine}</span>
          {/if}
          {#if publishedDate}
            <span>{publishedDate}</span>
          {/if}
          <span>{readingTime}</span>
        </div>
      </div>

      {#if story.hero.caption || story.hero.credit}
        <p class="caption immersive-caption">
          {story.hero.caption}
          {#if story.hero.credit}
            <span>{story.hero.credit}</span>
          {/if}
        </p>
      {/if}
    {:else}
      <div class="hero-copy">
        {#if eyebrow}
          <p class="eyebrow">{eyebrow}</p>
        {/if}
        <h1>{story.title}</h1>
        {#if story.dek}
          <p class="lede">{story.dek}</p>
        {/if}
        <div class="meta" aria-label="Story details">
          {#if authorLine}
            <span>By {authorLine}</span>
          {/if}
          {#if publishedDate}
            <span>{publishedDate}</span>
          {/if}
          <span>{readingTime}</span>
        </div>
      </div>

      {#if story.hero}
        <figure class="hero-media">
          {#if heroIsVideo}
            <video
              autoplay
              muted
              loop
              playsinline
              aria-label={story.hero.alt}
              poster={story.hero.poster ? assetUrl(story.hero.poster) : undefined}
            >
              <source src={assetUrl(story.hero.src)} type="video/mp4" />
            </video>
          {:else}
            <img src={assetUrl(story.hero.src)} alt={story.hero.alt} fetchpriority="high" />
          {/if}
          {#if story.hero.caption || story.hero.credit}
            <figcaption class="caption">
              {story.hero.caption}
              {#if story.hero.credit}
                <span>{story.hero.credit}</span>
              {/if}
            </figcaption>
          {/if}
        </figure>
      {/if}
    {/if}
  </header>

  <StorStoryToolbar {story} />

  <div class="story-body">
    {#each story.blocks as block}
      <StorBlockRenderer {block} />
    {/each}
  </div>
</article>

<style>
  .story {
    overflow: clip;
    --site-header-height: 3.25rem;
  }

  .story-hero.split {
    align-items: stretch;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    margin: 0 calc(50% - 50vw);
    max-width: none;
    min-height: max(42rem, calc(100svh - var(--site-header-height)));
    padding: 0;
  }

  .hero-copy {
    max-width: var(--measure-prose);
    width: 100%;
  }

  .story-hero.split .hero-copy {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    justify-content: center;
    justify-self: end;
    padding: clamp(var(--space-7), 7vw, 5rem) clamp(var(--space-6), 5vw, var(--space-8)) clamp(var(--space-7), 7vw, 5rem) var(--gutter);
  }

  .story-hero.contained {
    margin: 0 auto;
    max-width: calc(var(--measure-hero) + (var(--gutter) * 2));
    padding: clamp(var(--space-7), 7vw, 5rem) var(--gutter) var(--space-5);
  }

  .story-hero.contained .hero-copy {
    max-width: var(--measure-hero);
    padding: 0;
  }

  .story-hero.contained h1,
  .story-hero.contained .lede,
  .story-hero.contained .meta {
    max-width: 100%;
  }

  h1 {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-heading);
    letter-spacing: 0;
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-stack);
    text-wrap: balance;
  }

  .lede {
    font-family: var(--font-sans);
    font-size: var(--font-size-body);
    line-height: var(--line-height-body);
    margin: 0;
    max-width: var(--measure-card);
    white-space: pre-line;
  }

  .lede :global(a) {
    color: inherit;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.16em;
  }

  .lede :global(em) {
    font-style: italic;
  }

  .lede :global(strong) {
    color: var(--color-accent-2);
    font-weight: 600;
  }

  .meta {
    color: var(--color-muted);
    display: flex;
    flex-wrap: wrap;
    font-size: var(--font-size-small);
    font-weight: 500;
    gap: 0.35rem 0.65rem;
    letter-spacing: 0;
    line-height: var(--line-height-small);
    margin: var(--space-5) 0 0;
    max-width: var(--measure-card);
  }

  .meta span:not(:last-child)::after {
    color: var(--color-faint);
    content: "/";
    margin-left: 0.65rem;
  }

  .hero-media {
    margin: 0;
    min-width: 0;
  }

  .story-hero.split .hero-media {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    grid-column: 2;
  }

  img,
  video {
    background: var(--color-soft);
    flex: 1;
    height: 100%;
    min-height: 30rem;
    object-fit: cover;
    width: 100%;
  }

  .story-hero.contained .hero-media {
    margin-top: var(--space-6);
  }

  .story-hero.contained img,
  .story-hero.contained video {
    aspect-ratio: 16 / 10;
    display: block;
    flex: none;
    height: auto;
    min-height: 0;
  }

  figcaption {
    margin-left: 0;
    padding-right: var(--gutter);
  }

  figcaption span,
  .immersive-caption span {
    color: var(--color-faint);
    display: block;
    margin-top: 0.2rem;
  }

  .story-hero.immersive {
    margin: 0 calc(50% - 50vw);
    max-width: none;
    padding: 0;
  }

  .story-hero.immersive .hero-media {
    min-height: max(42rem, calc(100svh - var(--site-header-height)));
    position: relative;
  }

  .story-hero.immersive .hero-media::after {
    background: linear-gradient(
      180deg,
      rgb(0 0 0 / 0.08) 0%,
      rgb(0 0 0 / 0.04) 45%,
      rgb(0 0 0 / 0.52) 100%
    );
    content: '';
    inset: 0;
    pointer-events: none;
    position: absolute;
  }

  .story-hero.immersive img,
  .story-hero.immersive video {
    display: block;
    height: max(42rem, calc(100svh - var(--site-header-height)));
    min-height: 0;
  }

  .hero-overlay {
    bottom: clamp(var(--space-7), 8vh, 5rem);
    color: var(--color-paper);
    left: max(var(--gutter), calc((100vw - var(--wide)) / 2 + var(--gutter)));
    max-width: min(34rem, calc(100vw - (var(--gutter) * 2)));
    position: absolute;
    z-index: 1;
  }

  .story-hero.immersive .overlay-dek,
  .story-hero.immersive .meta {
    backdrop-filter: blur(10px);
    background: linear-gradient(
      180deg,
      rgba(24, 21, 18, 0.62),
      rgba(24, 21, 18, 0.46)
    );
    border: 1px solid rgba(255, 253, 248, 0.14);
    border-radius: 0.5rem;
    box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.14);
    padding: var(--space-3) var(--space-4);
  }

  .story-hero.immersive h1,
  .story-hero.immersive .lede,
  .story-hero.immersive .meta,
  .story-hero.immersive .eyebrow {
    color: var(--color-paper);
  }

  .story-hero.immersive h1 {
    max-width: 12ch;
  }

  .story-hero.immersive .lede {
    margin-top: var(--space-3);
    max-width: 32rem;
  }

  .story-hero.immersive .meta span:not(:last-child)::after {
    color: rgb(255 255 255 / 0.58);
  }

  .story-hero.immersive .meta {
    margin-top: var(--space-3);
  }

  .story-hero.immersive .immersive-caption {
    margin: var(--space-2) auto 0;
    max-width: var(--measure);
    padding: 0 var(--gutter);
  }

  .mobile-immersive-copy {
    display: none;
  }

  .story-body {
    padding: 0 var(--gutter) 0;
  }

  .story-hero.split + .story-body,
  .story-hero.immersive + .story-body {
    padding-top: 0;
  }

  .story-body > :global(:first-child) {
    margin-top: 0;
  }

  .story-hero.split + :global(.story-toolbar),
  .story-hero.immersive + :global(.story-toolbar) {
    padding-top: var(--space-4);
  }

  @media (max-width: 860px) {
    .story-hero.split,
    .story-hero.contained {
      display: block;
      min-height: 0;
      padding-top: 3rem;
    }

    .story-hero.split {
      margin: 0;
    }

    .story-hero.contained {
      padding-bottom: var(--space-4);
    }

    h1 {
      font-size: clamp(2rem, 9vw, 2.85rem);
    }

    .story-hero.split .hero-copy {
      padding: 0 var(--gutter) var(--space-6);
    }

    .story-hero.split .hero-media {
      margin-top: 0;
    }

    .story-hero.contained .hero-media {
      margin-top: var(--space-5);
    }

    .story-hero.split img,
    .story-hero.split video,
    .story-hero.contained img,
    .story-hero.contained video {
      aspect-ratio: 4 / 3;
      height: auto;
      min-height: 0;
    }

    figcaption {
      padding: 0 var(--gutter);
    }

    .story-hero.immersive .hero-media {
      min-height: 0;
    }

    .story-hero.immersive .hero-media::after {
      background: linear-gradient(180deg, rgb(0 0 0 / 0.05) 0%, rgb(0 0 0 / 0.5) 100%);
    }

    .story-hero.immersive img,
    .story-hero.immersive video {
      aspect-ratio: 4 / 5;
      height: auto;
      min-height: 27rem;
    }

    .hero-overlay {
      bottom: var(--space-5);
      left: var(--gutter);
    }

    .story-hero.immersive .overlay-dek,
    .story-hero.immersive .meta {
      display: none;
    }

    .story-hero.immersive h1 {
      font-size: clamp(2rem, 9vw, 2.85rem);
      max-width: 11ch;
    }

    .mobile-immersive-copy {
      display: block;
      margin: 0 auto;
      max-width: calc(var(--measure) + (var(--gutter) * 2));
      padding: var(--space-5) var(--gutter) 0;
    }

    .story-hero.immersive .mobile-immersive-copy .lede {
      color: var(--color-muted);
    }

    .story-hero.immersive .mobile-immersive-copy .meta {
      color: var(--color-muted);
      display: flex;
    }

    .story-hero.immersive .mobile-immersive-copy .meta span:not(:last-child)::after {
      color: var(--color-faint);
    }
  }
</style>
