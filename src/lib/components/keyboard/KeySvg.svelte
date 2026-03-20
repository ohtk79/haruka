<!--
  KeySvg — Single keyboard key SVG rendering with action display
  Props: key, action, selected, usMode, onclick
  Used by: components/keyboard/KeyboardSvg.svelte
-->
<script lang="ts">
	import type { KeyAction, PhysicalKey } from '$lib/models/types';
	import { SHIFT_LABELS, type ShiftLabelEntry } from '$lib/models/key-metadata';
	import { getActionLabel, getActionClass, resolveKeyLabel } from '$lib/utils/key-label-resolver';
	import { calcBaseFontSize, calcFontSize } from './key-svg-utils';
	import IsoEnterPath from './IsoEnterPath.svelte';
	import TapHoldLabel from './TapHoldLabel.svelte';

	interface Props {
		key: PhysicalKey;
		action: KeyAction | undefined;
		selected: boolean;
		jisToUsRemap?: boolean;
		shiftLabelByKanataName?: ReadonlyMap<string, ShiftLabelEntry>;
		onclick: () => void;
	}

	let { key, action, selected, jisToUsRemap = false, shiftLabelByKanataName, onclick }: Props = $props();

	const gap = 0.05;
	const r = 0.08;

	let actionClass = $derived(
		(!key.kanataName && action?.type === 'transparent') ? 'key-normal' : getActionClass(action)
	);
	let label = $derived(resolveKeyLabel(action, key, jisToUsRemap, SHIFT_LABELS, shiftLabelByKanataName));
	let labelLines = $derived(label.split('\n'));
	let isMultiLineLabel = $derived(labelLines.length > 1);
	let isTapHold = $derived(action?.type === 'tap-hold');
	let tapLabel = $derived(action?.type === 'tap-hold' ? getActionLabel(action.tapAction, key, jisToUsRemap) : '');
	let holdLabel = $derived(action?.type === 'tap-hold' ? getActionLabel(action.holdAction, key, jisToUsRemap) : '');
	let fontSize = $derived(calcFontSize(calcBaseFontSize(key.width, key.height), labelLines));
</script>

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
	onkeydown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onclick(); } }}
>
	{#if key.shape === 'iso-enter'}
		<IsoEnterPath keyWidth={key.width} keyHeight={key.height} {gap} {r} {isMultiLineLabel} {labelLines} {label} {fontSize} />
	{:else}
		<rect x={gap} y={gap} width={key.width - gap * 2} height={key.height - gap * 2} rx="0.08" class="key-shape" />
		{#if isTapHold}
			<TapHoldLabel {tapLabel} {holdLabel} keyWidth={key.width} keyHeight={key.height} {fontSize} {gap} />
		{:else if isMultiLineLabel}
			<text x={key.width / 2} y={key.height / 2 - fontSize * 0.3} font-size={fontSize} text-anchor="middle" class="key-label">
				{#each labelLines as line, i}
					<tspan x={key.width / 2} dy={i === 0 ? 0 : fontSize * 1.2}>{line}</tspan>
				{/each}
			</text>
		{:else}
			<text x={key.width / 2} y={key.height / 2 + fontSize * 0.35} font-size={fontSize} text-anchor="middle" class="key-label">{label}</text>
		{/if}
	{/if}
</g>

<style>
	.key-group { cursor: pointer; transition: transform 0.1s ease; }
	.key-group:hover { filter: brightness(1.1); }
	.key-group:focus { outline: none; }
	.key-group:focus-visible :global(.key-shape) { stroke: #2563eb; stroke-width: 0.06; }
	.key-group.selected { filter: none; }
	.key-group.selected :global(.key-shape) { stroke: #3b82f6; stroke-width: 0.06; }
	/* 子コンポーネント内の要素にも適用するため :global() を使用 */
	.key-group :global(.key-shape) { fill: #e5e7eb; stroke: #9ca3af; stroke-width: 0.03; transition: fill 0.15s ease, stroke 0.15s ease; }
	.key-group :global(.key-label) { fill: #1f2937; pointer-events: none; user-select: none; font-family: system-ui, -apple-system, sans-serif; }
	.key-group :global(.key-divider) { stroke: #9ca3af; stroke-width: 0.02; }
	/* Action type coloring */
	.key-normal :global(.key-shape) { fill: #e5e7eb; }
	.key-transparent :global(.key-shape) { fill: #f3f4f6; stroke-dasharray: 0.06 0.04; stroke: #d1d5db; }
	.key-transparent :global(.key-label) { fill: #9ca3af; }
	.key-noop :global(.key-shape) { fill: #d1d5db; }
	.key-noop :global(.key-label) { fill: #6b7280; }
	.key-layer :global(.key-shape) { fill: #dbeafe; stroke: #93c5fd; }
	.key-layer :global(.key-label) { fill: #1d4ed8; }
	.key-taphold :global(.key-shape) { fill: #d1fae5; stroke: #6ee7b7; }
	.key-taphold :global(.key-label) { fill: #065f46; }
	.key-chord :global(.key-shape) { fill: #e9d5ff; stroke: #c084fc; }
	.key-chord :global(.key-label) { fill: #6b21a8; }
</style>
