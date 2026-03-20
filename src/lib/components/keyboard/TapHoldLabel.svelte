<!-- TapHoldLabel — Tap-Hold アクションの2行ラベル表示 -->
<!-- Props: tapLabel, holdLabel, keyWidth, keyHeight, fontSize, gap -->
<!-- Used by: components/keyboard/KeySvg.svelte -->
<script lang="ts">
	interface Props {
		tapLabel: string;
		holdLabel: string;
		keyWidth: number;
		keyHeight: number;
		fontSize: number;
		gap: number;
	}

	let { tapLabel, holdLabel, keyWidth, keyHeight, fontSize, gap }: Props = $props();
</script>

<text x={keyWidth / 2} y={keyHeight * 0.35 + fontSize * 0.2} font-size={fontSize} text-anchor="middle" class="key-label key-label-tap">{tapLabel}</text>
<line x1={gap * 3} y1={keyHeight * 0.5} x2={keyWidth - gap * 3} y2={keyHeight * 0.5} class="key-divider" />
<text x={keyWidth / 2} y={keyHeight * 0.7 + fontSize * 0.2} font-size={fontSize} text-anchor="middle" class="key-label key-label-hold">{holdLabel}</text>
