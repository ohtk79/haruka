<!--
  LayerTabs — Layer tab bar with add/delete/rename/reorder and context menu
  Props: layers, activeIndex, isSettingsActive, onlayerswitch, onlayeradd, onlayerdelete, onlayerrename, onlayerreorder, onsettingsswitch
  Used by: routes/+page.svelte
-->
<script lang="ts">
	import type { Layer } from '$lib/models/types';
	import { MAX_LAYERS } from '$lib/models/constants';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		layers: Layer[];
		activeIndex: number;
		isSettingsActive?: boolean;
		onlayerswitch: (index: number) => void;
		onlayeradd: () => void;
		onlayerdelete: (index: number) => void;
		onlayerrename: (index: number, name: string) => void;
		onlayerreorder: (fromIndex: number, toIndex: number) => void;
		onsettingsswitch?: () => void;
	}

	let {
		layers,
		activeIndex,
		isSettingsActive = false,
		onlayerswitch,
		onlayeradd,
		onlayerdelete,
		onlayerrename,
		onlayerreorder,
		onsettingsswitch
	}: Props = $props();

	let editingIndex = $state<number | null>(null);
	let editingName = $state('');
	let contextMenuIndex = $state<number | null>(null);
	let contextMenuPos = $state({ x: 0, y: 0 });
	let editInput = $state<HTMLInputElement | null>(null);

	// Focus the rename input when it appears
	$effect(() => {
		if (editInput) {
			editInput.focus();
		}
	});

	function startRename(index: number) {
		editingIndex = index;
		editingName = layers[index].name;
		contextMenuIndex = null;
	}

	function commitRename() {
		if (editingIndex !== null && editingName.trim()) {
			onlayerrename(editingIndex, editingName.trim());
		}
		editingIndex = null;
	}

	function handleTabContextMenu(e: MouseEvent, index: number) {
		if (index === 0) return; // base layer — no context menu
		e.preventDefault();
		contextMenuIndex = index;
		contextMenuPos = { x: e.clientX, y: e.clientY };
	}

	function closeContextMenu() {
		contextMenuIndex = null;
	}

	function handleDelete(index: number) {
		contextMenuIndex = null;
		onlayerdelete(index);
	}

	function handleMoveLeft(index: number) {
		contextMenuIndex = null;
		if (index > 1) onlayerreorder(index, index - 1);
	}

	function handleMoveRight(index: number) {
		contextMenuIndex = null;
		if (index < layers.length - 1) onlayerreorder(index, index + 1);
	}
</script>

<svelte:window onclick={closeContextMenu} />

<div class="layer-tabs">
	<div class="flex items-center gap-1 border-b border-gray-200 pb-1">
		<!-- Settings tab -->
		{#if onsettingsswitch}
			<button
				class="rounded-t px-3 py-1 text-sm transition-colors"
				class:bg-blue-500={isSettingsActive}
				class:text-white={isSettingsActive}
				class:bg-gray-100={!isSettingsActive}
				class:text-gray-600={!isSettingsActive}
				class:hover:bg-gray-200={!isSettingsActive}
				onclick={onsettingsswitch}
				data-testid="btn-settings-tab"
			>
				{m.layer_settings()}
			</button>
			<span class="mx-1 text-gray-300">|</span>
		{/if}

		{#each layers as layer, i}
			{#if editingIndex === i}
				<input
					type="text"
					class="rounded border border-blue-400 px-2 py-1 text-sm focus:outline-none"
					bind:value={editingName}
					bind:this={editInput}
					onblur={commitRename}
					onkeydown={(e) => {
						if (e.key === 'Enter') commitRename();
						if (e.key === 'Escape') (editingIndex = null);
					}}
				/>
			{:else}
				<button
					class="rounded-t px-3 py-1 text-sm transition-colors"
					class:bg-blue-500={activeIndex === i && !isSettingsActive}
					class:text-white={activeIndex === i && !isSettingsActive}
					class:bg-gray-100={activeIndex !== i || isSettingsActive}
					class:text-gray-600={activeIndex !== i || isSettingsActive}
					class:hover:bg-gray-200={activeIndex !== i || isSettingsActive}
					onclick={() => onlayerswitch(i)}
					oncontextmenu={(e) => handleTabContextMenu(e, i)}
				>
					{layer.name}
					{#if i === 0}
						<span class="ml-1 text-xs opacity-50">🔒</span>
					{/if}
				</button>
			{/if}
		{/each}

		<!-- Add layer button -->
		{#if layers.length < MAX_LAYERS}
			<button
				class="rounded border border-dashed border-gray-300 px-2 py-1 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500"
				onclick={onlayeradd}
				title={m.layer_addLayer()}
				data-testid="btn-add-layer"
			>
				+
			</button>
		{:else}
			<span class="px-2 text-xs text-gray-400">{m.layer_maxLayers({ max: String(MAX_LAYERS) })}</span>
		{/if}
	</div>

	<!-- Context menu -->
	{#if contextMenuIndex !== null}
		<div
			class="fixed z-50 rounded border border-gray-200 bg-white py-1 shadow-lg"
			style="left: {contextMenuPos.x}px; top: {contextMenuPos.y}px;"
		>
			<button
				class="block w-full px-4 py-1 text-left text-sm hover:bg-gray-100"
				onclick={() => contextMenuIndex !== null && startRename(contextMenuIndex)}
			>
				{m.layer_rename()}
			</button>
			<button
				class="block w-full px-4 py-1 text-left text-sm hover:bg-gray-100"
				onclick={() => contextMenuIndex !== null && handleMoveLeft(contextMenuIndex)}
			>
				{m.layer_moveLeft()}
			</button>
			<button
				class="block w-full px-4 py-1 text-left text-sm hover:bg-gray-100"
				onclick={() => contextMenuIndex !== null && handleMoveRight(contextMenuIndex)}
			>
				{m.layer_moveRight()}
			</button>
			<hr class="my-1" />
			<button
				class="block w-full px-4 py-1 text-left text-sm text-red-600 hover:bg-red-50"
				onclick={() => contextMenuIndex !== null && handleDelete(contextMenuIndex)}
			>
				{m.layer_delete()}
			</button>
		</div>
	{/if}
</div>
