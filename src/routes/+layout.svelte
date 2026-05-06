<script lang="ts">
  import '../styles.css';
  import { base } from '$app/paths';

  let { children } = $props();
</script>

<svelte:head>
  <title>Oireachtas digital publishing studio</title>
  <meta
    name="description"
    content="Create and preview research articles for Stór, Inside Parliament and committee reports."
  />
</svelte:head>

<a class="skip-link" href="#content">Skip to content</a>

<header class="site-header" aria-label="Site header">
  <nav class="site-nav" aria-label="Primary navigation">
    <a class="brand" href="{base}/" aria-label="Oireachtas digital publishing studio home">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 28" xmlns="http://www.w3.org/2000/svg" fill="none" role="presentation" focusable="false">
          <path d="M12 9H26L32 5L38 9H52" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
          <line x1="12" y1="10.5" x2="52" y2="10.5" stroke="currentColor" stroke-width="1.2" />
          <rect x="12" y="10.5" width="40" height="13.5" stroke="currentColor" stroke-width="1.2" />
          <line x1="27.5" y1="10.5" x2="27.5" y2="24" stroke="currentColor" stroke-width="1.1" />
          <line x1="30" y1="10.5" x2="30" y2="24" stroke="currentColor" stroke-width="1.1" />
          <line x1="34" y1="10.5" x2="34" y2="24" stroke="currentColor" stroke-width="1.1" />
          <line x1="36.5" y1="10.5" x2="36.5" y2="24" stroke="currentColor" stroke-width="1.1" />
          <line x1="26.5" y1="24" x2="37.5" y2="24" stroke="currentColor" stroke-width="1.2" />
          <rect x="30.7" y="18.2" width="2.6" height="5.8" fill="currentColor" />
          <rect x="15" y="13" width="1.7" height="1.7" fill="currentColor" />
          <rect x="19" y="13" width="1.7" height="1.7" fill="currentColor" />
          <rect x="23" y="13" width="1.7" height="1.7" fill="currentColor" />
          <rect x="39.3" y="13" width="1.7" height="1.7" fill="currentColor" />
          <rect x="43.3" y="13" width="1.7" height="1.7" fill="currentColor" />
          <rect x="47.3" y="13" width="1.7" height="1.7" fill="currentColor" />
          <rect x="15" y="18" width="1.7" height="1.7" fill="currentColor" />
          <rect x="19" y="18" width="1.7" height="1.7" fill="currentColor" />
          <rect x="23" y="18" width="1.7" height="1.7" fill="currentColor" />
          <rect x="39.3" y="18" width="1.7" height="1.7" fill="currentColor" />
          <rect x="43.3" y="18" width="1.7" height="1.7" fill="currentColor" />
          <rect x="47.3" y="18" width="1.7" height="1.7" fill="currentColor" />
          <line x1="12" y1="24" x2="52" y2="24" stroke="currentColor" stroke-width="1.2" />
        </svg>
      </span>
      <span>Oireachtas digital publishing studio</span>
    </a>
    <div class="nav-links">
      <a href="{base}/publish/">Publish</a>
      <a href="{base}/preview/">Preview</a>
    </div>
  </nav>
</header>

<main id="content">
  {@render children()}
</main>

<footer class="site-footer">
  <p>Oireachtas digital publishing studio | Static publishing proof of concept</p>
</footer>
