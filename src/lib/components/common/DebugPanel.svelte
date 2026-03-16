<!--
  DebugPanel — In-app debug panel with action log and state snapshot
  Props: store (EditorStore)
  Used by: routes/+page.svelte
-->
<script lang="ts">
	import { debugLog } from '$lib/services/debug-logger.svelte';
	import type { EditorStore } from '$lib/stores/editor.svelte';
	import * as m from '$lib/paraglide/messages';

	let { store }: { store: EditorStore } = $props();

	let open = $state(false);
	let activeTab = $state<'log' | 'state'>('log');
	let autoScroll = $state(true);
	let logContainer = $state<HTMLDivElement | undefined>(undefined);

	// Toggle with Ctrl+Shift+D
	function handleKeydown(e: KeyboardEvent) {
		if (e.ctrlKey && e.shiftKey && e.key === 'D') {
			e.preventDefault();
			open = !open;
		}
	}

	// Auto-scroll to bottom
	$effect(() => {
		if (autoScroll && logContainer && debugLog.entries.length > 0) {
			// Access length to create dependency
			debugLog.entries.length;
			requestAnimationFrame(() => {
				if (logContainer) {
					logContainer.scrollTop = logContainer.scrollHeight;
				}
			});
		}
	});

	function copyLog() {
		const snapshot = debugLog.stateSnapshot(store);
		const text = `=== State Snapshot ===\n${snapshot}\n\n=== Action Log (${debugLog.entries.length} entries) ===\n${debugLog.toText()}`;
		navigator.clipboard.writeText(text);
		copyFeedback = true;
		setTimeout(() => (copyFeedback = false), 1500);
	}

	let copyFeedback = $state(false);

	const categoryColors: Record<string, string> = {
		action: 'text-blue-400',
		state: 'text-green-400',
		lifecycle: 'text-yellow-400',
		error: 'text-red-400'
	};
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Toggle button (always visible, bottom-right) -->
<button
	class="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full
		   bg-gray-800 text-white shadow-lg transition-colors hover:bg-gray-700
		   {open ? 'ring-2 ring-blue-400' : ''}"
	onclick={() => (open = !open)}
	title="Debug Panel (Ctrl+Shift+D)"
>
	🔧
</button>

{#if open}
	<!-- Debug panel -->
	<div
		class="fixed bottom-16 right-4 z-50 flex w-[560px] max-w-[90vw] flex-col rounded-lg border border-gray-700 bg-gray-900 text-gray-200 shadow-2xl"
		style="max-height: 400px;"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-700 px-3 py-2">
			<div class="flex gap-2">
				<button
					class="rounded px-2 py-0.5 text-xs {activeTab === 'log'
						? 'bg-blue-600 text-white'
						: 'text-gray-400 hover:text-white'}"
					onclick={() => (activeTab = 'log')}
				>
					{m.debug_tabLog({ count: debugLog.entries.length })}
				</button>
				<button
					class="rounded px-2 py-0.5 text-xs {activeTab === 'state'
						? 'bg-blue-600 text-white'
						: 'text-gray-400 hover:text-white'}"
					onclick={() => (activeTab = 'state')}
				>
					{m.debug_tabState()}
				</button>
			</div>
			<div class="flex items-center gap-2">
				<button
					class="rounded px-2 py-0.5 text-xs {copyFeedback
						? 'bg-green-600 text-white'
						: 'text-gray-400 hover:text-white'}"
					onclick={copyLog}
				>
					{copyFeedback ? m.debug_copied() : m.debug_copy()}
				</button>
				<button
					class="rounded px-2 py-0.5 text-xs text-gray-400 hover:text-white"
					onclick={() => debugLog.clear()}
				>
					{m.debug_clear()}
				</button>
				<label class="flex items-center gap-1 text-xs text-gray-400">
					<input type="checkbox" bind:checked={autoScroll} class="h-3 w-3" />
					{m.debug_autoScroll()}
				</label>
			</div>
		</div>

		<!-- Content -->
		{#if activeTab === 'log'}
			<div bind:this={logContainer} class="flex-1 overflow-auto p-2 font-mono text-xs" style="max-height: 340px;">
				{#if debugLog.entries.length === 0}
					<p class="py-4 text-center text-gray-500">{m.debug_emptyLog()}</p>
				{:else}
					{#each debugLog.entries as entry, i}
					<div class="flex gap-2 leading-5 hover:bg-gray-800/50 {entry.category === 'error' ? 'bg-red-900/20' : ''}">
							<span class="shrink-0 text-gray-500">{entry.time}</span>
							<span class="shrink-0 w-20 {categoryColors[entry.category] ?? 'text-gray-400'}">
								[{entry.category.toUpperCase()}]
							</span>
							<span class="flex-1">
								{entry.message}
								{#if entry.detail}
									<span class="text-gray-500"> → {entry.detail}</span>
								{/if}
							</span>
						</div>
					{/each}
				{/if}
			</div>
		{:else}
			<!-- State tab -->
			<div class="flex-1 overflow-auto whitespace-pre-wrap p-3 font-mono text-xs" style="max-height: 340px;">
				{debugLog.stateSnapshot(store)}
			</div>
		{/if}
	</div>
{/if}
