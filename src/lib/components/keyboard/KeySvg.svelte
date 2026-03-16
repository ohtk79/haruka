<!--
  KeySvg — Single keyboard key SVG rendering with action display
  Props: key, action, selected, usMode, onclick
  Used by: components/keyboard/KeyboardSvg.svelte
-->
<script lang="ts">
	import type { KeyAction, PhysicalKey } from '$lib/models/types';
	import { SHIFT_LABELS, type ShiftLabelEntry } from '$lib/models/shift-labels';
	import { getActionLabel, getActionClass, resolveKeyLabel } from '$lib/utils/key-label-resolver';

	interface Props {
		key: PhysicalKey;
		action: KeyAction | undefined;
		selected: boolean;
		jisToUsRemap?: boolean;
		shiftLabelByKanataName?: ReadonlyMap<string, ShiftLabelEntry>;
		onclick: () => void;
	}

	let { key, action, selected, jisToUsRemap = false, shiftLabelByKanataName, onclick }: Props = $props();

	// Gap for visual separation between keys
	const gap = 0.05;
	// Corner radius (shared with rect keys via rx="0.08")
	const r = 0.08;

	let actionClass = $derived(
		// kanataName のないキー（Fn など）は transparent でも通常キーと同じ見た目にする
		(!key.kanataName && action?.type === 'transparent') ? 'key-normal' : getActionClass(action)
	);
	let label = $derived(resolveKeyLabel(action, key, jisToUsRemap, SHIFT_LABELS, shiftLabelByKanataName));
	let labelLines = $derived(label.split('\n'));
	let isMultiLineLabel = $derived(labelLines.length > 1);
	let isTapHold = $derived(action?.type === 'tap-hold');
	let tapLabel = $derived(action?.type === 'tap-hold' ? getActionLabel(action.tapAction, key, jisToUsRemap) : '');
	let holdLabel = $derived(action?.type === 'tap-hold' ? getActionLabel(action.holdAction, key, jisToUsRemap) : '');
	let isIsoEnter = $derived(key.shape === 'iso-enter');

	// Font size unified across all keys, capped at 1u equivalent
	let fontSize = $derived(Math.min(key.width, key.height, 1) * 0.28);
</script>

<!-- Svelte 5 compiler does not recognize keyboard event handlers on SVG <g> elements (role="button" + tabindex="0" are set correctly) -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<g
	class="key-group {actionClass}"
	class:selected
	transform="translate({key.x}, {key.y})"
	{onclick}
	role="button"
	tabindex="0"
	aria-label="{key.label}: {label}"
	data-key-id={key.id}
	onkeydown={(e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onclick();
		}
	}}
>
	{#if isIsoEnter}
		<!-- JIS Enter: L-shaped with rounded corners -->
		<!-- Step Y aligned with adjacent key bottom edges (1 - gap) -->
		{@const stepX = 0.25 + gap}
		{@const stepY = 1 - gap}
		<path
			d="M {gap} {gap + r}
			   A {r} {r} 0 0 1 {gap + r} {gap}
			   L {key.width - gap - r} {gap}
			   A {r} {r} 0 0 1 {key.width - gap} {gap + r}
			   L {key.width - gap} {key.height - gap - r}
			   A {r} {r} 0 0 1 {key.width - gap - r} {key.height - gap}
			   L {stepX + r} {key.height - gap}
			   A {r} {r} 0 0 1 {stepX} {key.height - gap - r}
			   L {stepX} {stepY + r}
			   A {r} {r} 0 0 0 {stepX - r} {stepY}
			   L {gap + r} {stepY}
			   A {r} {r} 0 0 1 {gap} {stepY - r}
			   Z"
			class="key-shape"
		/>
		{#if isMultiLineLabel}
			<text
				x={key.width / 2}
				y={key.height / 2 - fontSize * 0.3}
				font-size={fontSize}
				text-anchor="middle"
				class="key-label"
			>
				{#each labelLines as line, i}
					<tspan x={key.width / 2} dy={i === 0 ? 0 : fontSize * 1.2}>{line}</tspan>
				{/each}
			</text>
		{:else}
			<text
				x={key.width / 2}
				y={key.height / 2 + fontSize * 0.35}
				font-size={fontSize}
				text-anchor="middle"
				class="key-label"
			>
				{label}
			</text>
		{/if}
	{:else}
		<rect
			x={gap}
			y={gap}
			width={key.width - gap * 2}
			height={key.height - gap * 2}
			rx="0.08"
			class="key-shape"
		/>
		{#if isTapHold}
			<!-- Tap-Hold 2-line display -->
			<text
				x={key.width / 2}
				y={key.height * 0.35 + fontSize * 0.2}
				font-size={fontSize}
				text-anchor="middle"
				class="key-label key-label-tap"
			>
				{tapLabel}
			</text>
			<line
				x1={gap * 3}
				y1={key.height * 0.5}
				x2={key.width - gap * 3}
				y2={key.height * 0.5}
				class="key-divider"
			/>
			<text
				x={key.width / 2}
				y={key.height * 0.7 + fontSize * 0.2}
				font-size={fontSize}
				text-anchor="middle"
				class="key-label key-label-hold"
			>
				{holdLabel}
			</text>
		{:else if isMultiLineLabel}
			<text
				x={key.width / 2}
				y={key.height / 2 - fontSize * 0.3}
				font-size={fontSize}
				text-anchor="middle"
				class="key-label"
			>
				{#each labelLines as line, i}
					<tspan x={key.width / 2} dy={i === 0 ? 0 : fontSize * 1.2}>{line}</tspan>
				{/each}
			</text>
		{:else}
			<text
				x={key.width / 2}
				y={key.height / 2 + fontSize * 0.35}
				font-size={fontSize}
				text-anchor="middle"
				class="key-label"
			>
				{label}
			</text>
		{/if}
	{/if}
</g>

<style>
	.key-group {
		cursor: pointer;
		transition: transform 0.1s ease;
	}
	.key-group:hover {
		filter: brightness(1.1);
	}
	.key-group:focus {
		outline: none;
	}
	.key-group:focus-visible .key-shape {
		stroke: #2563eb;
		stroke-width: 0.06;
	}
	.key-group.selected {
		filter: none;
	}
	.key-group.selected .key-shape {
		stroke: #3b82f6;
		stroke-width: 0.06;
	}
	.key-shape {
		fill: #e5e7eb;
		stroke: #9ca3af;
		stroke-width: 0.03;
		transition:
			fill 0.15s ease,
			stroke 0.15s ease;
	}
	.key-label {
		fill: #1f2937;
		pointer-events: none;
		user-select: none;
		font-family: system-ui, -apple-system, sans-serif;
	}
	.key-divider {
		stroke: #9ca3af;
		stroke-width: 0.02;
	}

	/* Action type coloring */
	.key-normal .key-shape {
		fill: #e5e7eb;
	}
	.key-transparent .key-shape {
		fill: #f3f4f6;
		stroke-dasharray: 0.06 0.04;
		stroke: #d1d5db;
	}
	.key-transparent .key-label {
		fill: #9ca3af;
	}
	.key-noop .key-shape {
		fill: #d1d5db;
	}
	.key-noop .key-label {
		fill: #6b7280;
	}
	.key-layer .key-shape {
		fill: #dbeafe;
		stroke: #93c5fd;
	}
	.key-layer .key-label {
		fill: #1d4ed8;
	}
	.key-taphold .key-shape {
		fill: #d1fae5;
		stroke: #6ee7b7;
	}
	.key-taphold .key-label {
		fill: #065f46;
	}
	.key-chord .key-shape {
		fill: #e9d5ff;
		stroke: #c084fc;
	}
	.key-chord .key-label {
		fill: #6b21a8;
	}
</style>
