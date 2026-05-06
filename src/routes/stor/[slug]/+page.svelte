<script lang="ts">
  import StorArticlePage from '$lib/components/stor/StorArticlePage.svelte';

  let { data } = $props();
</script>

<StorArticlePage story={data.story} />
