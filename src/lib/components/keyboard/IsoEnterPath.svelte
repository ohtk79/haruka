<!-- IsoEnterPath — ISO/JIS Enter のL字型 SVG パス描画 -->
<!-- Props: key, gap, r, isMultiLineLabel, labelLines, label, fontSize -->
<!-- Used by: components/keyboard/KeySvg.svelte -->
<script lang="ts">
	interface Props {
		keyWidth: number;
		keyHeight: number;
		gap: number;
		r: number;
		isMultiLineLabel: boolean;
		labelLines: string[];
		label: string;
		fontSize: number;
	}

	let { keyWidth, keyHeight, gap, r, isMultiLineLabel, labelLines, label, fontSize }: Props = $props();

	const stepX = $derived(0.25 + gap);
	const stepY = $derived(1 - gap);
</script>

<path
	d="M {gap} {gap + r}
	   A {r} {r} 0 0 1 {gap + r} {gap}
	   L {keyWidth - gap - r} {gap}
	   A {r} {r} 0 0 1 {keyWidth - gap} {gap + r}
	   L {keyWidth - gap} {keyHeight - gap - r}
	   A {r} {r} 0 0 1 {keyWidth - gap - r} {keyHeight - gap}
	   L {stepX + r} {keyHeight - gap}
	   A {r} {r} 0 0 1 {stepX} {keyHeight - gap - r}
	   L {stepX} {stepY + r}
	   A {r} {r} 0 0 0 {stepX - r} {stepY}
	   L {gap + r} {stepY}
	   A {r} {r} 0 0 1 {gap} {stepY - r}
	   Z"
	class="key-shape"
/>
{#if isMultiLineLabel}
	<text x={keyWidth / 2} y={keyHeight / 2 - fontSize * 0.3} font-size={fontSize} text-anchor="middle" class="key-label">
		{#each labelLines as line, i}
			<tspan x={keyWidth / 2} dy={i === 0 ? 0 : fontSize * 1.2}>{line}</tspan>
		{/each}
	</text>
{:else}
	<text x={keyWidth / 2} y={keyHeight / 2 + fontSize * 0.35} font-size={fontSize} text-anchor="middle" class="key-label">{label}</text>
{/if}
