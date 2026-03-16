<!--
  +layout.svelte — Root layout: global CSS import
  Used by: SvelteKit routing
-->
<script lang="ts">
	import '../app.css';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages';

	let { children } = $props();

	// HTML lang 属性を現在のロケールに同期
	$effect(() => {
		document.documentElement.lang = getLocale();
	});
</script>

<svelte:head>
	<title>{m.meta_title()}</title>
	<meta name="description" content={m.meta_description()} />
</svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900">
	{@render children()}
</div>
