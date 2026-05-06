<script lang="ts">
  import { onMount } from 'svelte';
  import publisherStyles from '$lib/publisher-react/index.css?inline';

  let mountTarget: HTMLDivElement | null = null;
  let isReady = false;
  let errorMessage = '';

  onMount(() => {
    let cleanup = () => {};

    const start = async () => {
      try {
        await import('@vitejs/plugin-react/preamble');

        const [{ createRoot }, { default: React }, { default: PublisherApp }] = await Promise.all([
          import('react-dom/client'),
          import('react'),
          import('$lib/publisher-react/App.jsx')
        ]);

        if (!mountTarget) {
          throw new Error('Publisher mount target was not available.');
        }

        const shadowRoot = mountTarget.shadowRoot ?? mountTarget.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = '';

        const styleElement = document.createElement('style');
        styleElement.textContent = publisherStyles;

        const appHost = document.createElement('div');
        appHost.className = 'publisher-scope';

        shadowRoot.append(styleElement, appHost);

        const root = createRoot(appHost);
        root.render(React.createElement(PublisherApp));
        cleanup = () => root.unmount();
        isReady = true;
      } catch (error) {
        console.error('Failed to mount publisher app', error);
        errorMessage =
          error instanceof Error
            ? error.message
            : 'Publisher could not be loaded.';
      }
    };

    void start();

    return () => cleanup();
  });
</script>

<svelte:head>
  <title>Publish | Oireachtas digital publishing studio</title>
</svelte:head>

<div class="publisher-scope">
  {#if errorMessage}
    <div class="publish-error">
      <strong>Publisher failed to load.</strong>
      <p>{errorMessage}</p>
    </div>
  {:else if !isReady}
    <div class="publish-loading">
      <strong>Loading publisher…</strong>
      <p>Preparing the editor, metadata workflow, and preview tooling.</p>
    </div>
  {/if}

  <div bind:this={mountTarget}></div>
</div>

<style>
  .publish-loading,
  .publish-error {
    max-width: 72rem;
    margin: 2rem auto 0;
    padding: 1rem 1.25rem;
    border: 1px solid var(--line, #d4ccb8);
    background: var(--paper, #f6f3ea);
    color: var(--ink, #4a463d);
  }

  .publish-loading p,
  .publish-error p {
    margin: 0.5rem 0 0;
  }
</style>
