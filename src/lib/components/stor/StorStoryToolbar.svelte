<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { StorArticle, StorBlock } from '$lib/content/stor/types';
  import { BOOKMARK_KEY, readBookmarks } from '$lib/components/story/bookmarks';

  let { story }: { story: StorArticle } = $props();

  let isClient = $state(false);
  let isPlaying = $state(false);
  let isBookmarked = $state(false);
  let shareFeedback = $state('');
  let utterance: SpeechSynthesisUtterance | null = null;

  function stripHtml(value: string) {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function blockCopy(block: StorBlock) {
    switch (block.type) {
      case 'heading':
      case 'paragraph':
        return stripHtml(block.text);
      case 'quote':
        return [block.text, block.attribution].filter(Boolean).map((part) => stripHtml(part!)).join(' ');
      case 'callout':
        return [block.title, block.text].filter(Boolean).map((part) => stripHtml(part!)).join(' ');
      case 'chart':
        return [block.title, block.component].filter(Boolean).map((part) => stripHtml(part!)).join(' ');
      case 'image':
        return [block.image.alt, block.image.caption].filter(Boolean).map((part) => stripHtml(part!)).join(' ');
      default:
        return '';
    }
  }

  let storyAudioText = $derived(
    [story.title, story.dek, ...story.blocks.map(blockCopy)]
      .filter(Boolean)
      .map((part) => stripHtml(part!))
      .join(' ')
  );

  function storyUrl() {
    if (!isClient) return `/stor/${story.slug}`;
    return window.location.href;
  }

  function clearFeedbackSoon() {
    window.setTimeout(() => {
      shareFeedback = '';
    }, 1800);
  }

  function stopPlayback() {
    if (!isClient || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    utterance = null;
    isPlaying = false;
  }

  function togglePlayback() {
    if (!isClient || !window.speechSynthesis || !storyAudioText) return;

    if (isPlaying) {
      stopPlayback();
      return;
    }

    utterance = new SpeechSynthesisUtterance(storyAudioText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      isPlaying = false;
      utterance = null;
    };
    utterance.onerror = () => {
      isPlaying = false;
      utterance = null;
    };

    isPlaying = true;
    window.speechSynthesis.speak(utterance);
  }

  async function shareStory() {
    if (!isClient) return;

    const shareData = {
      title: story.title,
      text: stripHtml(story.dek ?? ''),
      url: storyUrl()
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') return;
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareData.url);
      shareFeedback = 'Link copied';
      clearFeedbackSoon();
    }
  }

  function writeBookmarks(next: string[]) {
    if (!isClient) return;
    window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
  }

  function toggleBookmark() {
    if (!isClient) return;

    const bookmarks = readBookmarks();
    const next = isBookmarked
      ? bookmarks.filter((slug) => slug !== story.slug)
      : [...new Set([...bookmarks, story.slug])];

    writeBookmarks(next);
    isBookmarked = next.includes(story.slug);
  }

  onMount(() => {
    isClient = true;
    isBookmarked = readBookmarks().includes(story.slug);
  });

  onDestroy(() => {
    stopPlayback();
  });
</script>

<section class="story-toolbar" aria-label="Story actions">
  <div class="story-toolbar__inner">
    <div class="story-toolbar__actions">
      <button
        type="button"
        class="listen-button"
        onclick={togglePlayback}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? 'Stop listening to the story' : 'Listen to the story'}
        disabled={!storyAudioText}
      >
        <span class="listen-button__icon" aria-hidden="true">
          {#if isPlaying}
            <svg viewBox="0 0 20 20" fill="none">
              <rect x="5" y="4.5" width="3.5" height="11" rx="0.8" fill="currentColor"></rect>
              <rect x="11.5" y="4.5" width="3.5" height="11" rx="0.8" fill="currentColor"></rect>
            </svg>
          {:else}
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M6.5 4.8L15 10L6.5 15.2V4.8Z" fill="currentColor"></path>
            </svg>
          {/if}
        </span>
        <span class="listen-button__label">
          {isPlaying ? 'Stop listening' : 'Listen to the story'}
        </span>
      </button>

      <button type="button" class="icon-button icon-button--labelled" onclick={shareStory}>
        <span aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="M11.5 4.5L15.5 8.5M15.5 8.5L11.5 12.5M15.5 8.5H7.75C5.68 8.5 4 10.18 4 12.25V15.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </span>
        <span>Share</span>
      </button>

      <button
        type="button"
        class="icon-button icon-button--labelled"
        onclick={toggleBookmark}
        aria-pressed={isBookmarked}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Save this story'}
      >
        <span aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="M6 3.75H14C14.41 3.75 14.75 4.09 14.75 4.5V16L10 13.1L5.25 16V4.5C5.25 4.09 5.59 3.75 6 3.75Z"
              stroke="currentColor"
              stroke-width="1.5"
              fill={isBookmarked ? 'currentColor' : 'none'}
              stroke-linejoin="round"
            ></path>
          </svg>
        </span>
        <span>Save</span>
      </button>
    </div>
  </div>

  {#if shareFeedback}
    <p class="story-toolbar__feedback" aria-live="polite">{shareFeedback}</p>
  {/if}
</section>

<style>
  .story-toolbar {
    border-top: 1px solid var(--color-line);
    margin: 0 auto;
    max-width: calc(var(--measure-prose) + (var(--gutter) * 2));
    padding: var(--space-3) var(--gutter) var(--space-2);
  }

  .story-toolbar__inner {
    display: block;
    margin: 0 auto;
    max-width: var(--measure-prose);
  }

  .story-toolbar__actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: flex-start;
  }

  .listen-button,
  .icon-button {
    align-items: center;
    appearance: none;
    background: transparent;
    border: 1px solid var(--color-line);
    border-radius: var(--radius);
    color: var(--color-accent-2);
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    font-family: var(--font-sans);
    gap: 0.45rem;
    height: 2.5rem;
    justify-content: center;
    min-height: 2.5rem;
    padding: 0.5rem 0.8rem;
    transition:
      border-color 120ms ease,
      color 120ms ease,
      background-color 120ms ease;
  }

  .listen-button:hover,
  .listen-button:focus-visible,
  .icon-button:hover,
  .icon-button:focus-visible {
    border-color: var(--color-line-strong);
    color: var(--link-hover);
  }

  .listen-button:disabled {
    color: var(--color-faint);
    cursor: default;
  }

  .listen-button__icon,
  .icon-button > span[aria-hidden='true'] {
    align-items: center;
    display: inline-flex;
    height: 1.25rem;
    justify-content: center;
    width: 1.25rem;
  }

  .listen-button__icon {
    border: 1px solid color-mix(in srgb, var(--color-line-strong) 72%, white);
    border-radius: 999px;
    flex: 0 0 auto;
    height: 1.7rem;
    width: 1.7rem;
  }

  .listen-button__icon svg,
  .icon-button svg {
    display: block;
    height: 100%;
    width: 100%;
  }

  .listen-button__label,
  .icon-button {
    font-size: var(--font-size-small);
    font-weight: 600;
    letter-spacing: 0;
    line-height: 1;
  }

  .icon-button {
    min-width: 2.5rem;
    padding-left: 0.8rem;
    padding-right: 0.8rem;
  }

  .icon-button--labelled {
    gap: 0.4rem;
    padding-left: 0.8rem;
    padding-right: 0.85rem;
  }

  .story-toolbar__feedback {
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: var(--font-size-small);
    margin: 0.35rem 0 0;
  }

  @media (max-width: 700px) {
    .story-toolbar__actions {
      gap: 0.5rem;
    }
  }
</style>
