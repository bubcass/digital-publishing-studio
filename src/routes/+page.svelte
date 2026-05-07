<svelte:head>
    <title>Oireachtas digital publishing studio</title>
</svelte:head>

<section class="home-hero page-shell">
    <div>
        <p class="eyebrow">Static publishing proof of concept</p>
        <h1>Oireachtas digital publishing studio</h1>
    </div>
    <p class="lede">
        Create and preview research articles for Stór, Inside Parliament and
        committee reports in a browser-based workflow.
    </p>
</section>

<section class="page-shell landing-grid">
    <article class="landing-card">
        <p class="eyebrow">1. Publish</p>
        <h2>Build an article</h2>
        <p>
            Use a TipTap-based publisher workflow with metadata, contributors,
            structured blocks, hero media and JSON export.
        </p>
        <a class="landing-link" href="./publish/">Open publisher</a>
    </article>

    <article class="landing-card">
        <p class="eyebrow">2. Preview</p>
        <h2>See the rendered page</h2>
        <p>
            Preview works entirely in the browser. The current article is stored
            locally, then rendered with the same article shell used for
            committed content.
        </p>
        <a class="landing-link" href="./preview/">Open preview</a>
    </article>

    <article class="landing-card">
        <p class="eyebrow">3. Export</p>
        <h2>Export the JSON artifact</h2>
        <p>
            Export the JSON payload as the notional publishable artifact for the
            proof of concept, or browse sample article elements.
        </p>
        <a class="landing-link" href="./stor/">Browse sample article</a>
    </article>
</section>

<style>
    .landing-grid {
        display: grid;
        gap: var(--space-6);
        grid-template-columns: repeat(3, minmax(0, 1fr));
        padding-bottom: var(--space-8);
        padding-top: var(--space-8);
    }

    .landing-card {
        border-top: 1px solid var(--color-line);
        display: grid;
        gap: var(--space-3);
        padding-top: var(--space-5);
    }

    h2 {
        color: var(--color-accent-2);
        font-family: var(--font-sans);
        font-size: var(--font-size-h2);
        font-weight: var(--font-weight-heading);
        line-height: var(--line-height-heading);
        margin: 0;
    }

    .landing-card p:not(.eyebrow) {
        color: var(--color-muted);
        margin: 0;
    }

    .landing-link {
        font-size: var(--font-size-small);
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    @media (max-width: 860px) {
        .landing-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
