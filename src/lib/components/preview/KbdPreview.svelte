<!--
  KbdPreview — CodeMirror 6 editor for .kbd/.json preview output
  Props: content, selectedKeyId, highlightRanges, tab
  Used by: Preview popup window
-->
<script lang="ts">
	import { EditorView } from '@codemirror/view';
	import { EditorState as CMState } from '@codemirror/state';
	import { kbdLanguage } from './kbd-language';
	import {
		highlightField,
		highlightTheme,
		setHighlights,
		findKeyRangesInKbd,
		type HighlightMode
	} from './kbd-highlight';
	import { onMount } from 'svelte';

	interface Props {
		value?: string;
		selectedKeyKanataName?: string | null;
		highlightMode?: HighlightMode | null;
		activeLayerIndex?: number;
		keOnly?: boolean;
	}

	let {
		value = '',
		selectedKeyKanataName = null,
		highlightMode = null,
		activeLayerIndex = 0,
		keOnly = false
	}: Props = $props();

	let container: HTMLDivElement;
	let view: EditorView;

	onMount(() => {
		const state = CMState.create({
			doc: value,
			extensions: [
				kbdLanguage,
				highlightField,
				highlightTheme,
				EditorView.editable.of(false),
				CMState.readOnly.of(true),
				EditorView.theme({
					'&': {
						fontSize: '13px',
						fontFamily: 'monospace'
					},
					'.cm-content': {
						padding: '8px 0'
					},
					'.cm-gutters': {
						display: 'none'
					},
					'.cm-scroller': {
						overflow: 'auto',
						maxHeight: '400px'
					}
				})
			]
		});

		view = new EditorView({
			state,
			parent: container
		});

		return () => {
			view.destroy();
		};
	});

	// Update content and highlights reactively
	$effect(() => {
		if (!view) return;

		const needsDocUpdate = value !== view.state.doc.toString();
		const hasHighlight = !!(selectedKeyKanataName && highlightMode);

		// Compute highlight ranges
		const ranges = hasHighlight ? findKeyRangesInKbd(value, selectedKeyKanataName!) : [];
		const highlightEffect = hasHighlight
			? setHighlights.of({ ranges, mode: highlightMode! })
			: setHighlights.of(null);

		// Scroll to focused layer's highlighted range
		const scrollTarget = hasHighlight
			? (ranges.find((r) => r.section === 'deflayer' && r.layerIndex === activeLayerIndex) ??
				ranges.find((r) => r.section === 'deflayer'))
			: null;
		const scrollEffects = scrollTarget
			? [EditorView.scrollIntoView(scrollTarget.from, { y: 'center' })]
			: [];

		if (needsDocUpdate) {
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: value },
				effects: [highlightEffect, ...scrollEffects]
			});
		} else {
			view.dispatch({
				effects: [highlightEffect, ...scrollEffects]
			});
		}
	});
</script>

<div class="rounded border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900 {keOnly ? 'pointer-events-none opacity-40' : ''}" title={keOnly ? 'Apple キーボードは Karabiner-Elements 専用です' : undefined}>
	<div bind:this={container}></div>
	<!-- Hidden element for E2E test access to full text (CodeMirror virtualizes off-screen lines) -->
	<pre class="kbd-preview-raw" style="display:none" aria-hidden="true">{value}</pre>
</div>
