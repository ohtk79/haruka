<!--
  KeyboardSvg — Full keyboard layout SVG with key selection
  Props: template, activeLayer, selectedKeyId, usMode, onkeyclick
  Used by: routes/+page.svelte
-->
<script lang="ts">
	import type { Layer, LayoutTemplate } from '$lib/models/types';
	import { SHIFT_LABELS, type ShiftLabelEntry } from '$lib/models/shift-labels';
	import KeySvg from './KeySvg.svelte';

	interface Props {
		template: LayoutTemplate;
		activeLayer: Layer;
		selectedKeyId: string | null;
		jisToUsRemap?: boolean;
		onkeyselect: (keyId: string) => void;
	}

	let { template, activeLayer, selectedKeyId, jisToUsRemap = false, onkeyselect }: Props = $props();

	// kanata key name → ShiftLabelEntry reverse lookup for remapped keys
	let shiftLabelByKanataName: ReadonlyMap<string, ShiftLabelEntry> = $derived.by(() => {
		const map = new Map<string, ShiftLabelEntry>();
		for (const key of template.keys) {
			const entry = SHIFT_LABELS.get(key.id);
			if (entry && key.kanataName) {
				map.set(key.kanataName, entry);
			}
		}
		return map;
	});
</script>

<svg
	viewBox="0 0 23 6.5"
	preserveAspectRatio="xMidYMid meet"
	class="keyboard-svg w-full"
	xmlns="http://www.w3.org/2000/svg"
>
	{#each template.keys as key (key.id)}
		<KeySvg
			{key}
			action={activeLayer.actions.get(key.id)}
			selected={selectedKeyId === key.id}
			{jisToUsRemap}
			{shiftLabelByKanataName}
			onclick={() => onkeyselect(key.id)}
		/>
	{/each}
</svg>

<style>
	.keyboard-svg {
		max-width: 100%;
		height: auto;
	}
</style>
