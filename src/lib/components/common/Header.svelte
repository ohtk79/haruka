<!--
  Header — App header bar with template selection and file operations
  Props: ondownload, onexport, onnewfile, onpreview, onshare, keOnly, persistenceError, shareAvailable
  Used by: routes/+page.svelte
-->
<script lang="ts">
	import { TEMPLATES } from '$lib/templates';
	import ShareDialog from './ShareDialog.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { getTemplateName } from '$lib/templates/index';

	let {
		ondownload,
		onexport,
		onnewfile,
		onpreview,
		onshare,
		keOnly = false,
		persistenceError = null,
		shareAvailable = true
	}: {
		ondownload: () => void;
		onexport: (format: 'kbd' | 'json' | 'both') => void;
		onnewfile: (templateId: string) => void;
		onpreview: () => void;
		onshare: () => Promise<string>;
		keOnly?: boolean;
		persistenceError: string | null;
		shareAvailable?: boolean;
	} = $props();

	let showExportMenu = $state(false);
	let showNewMenu = $state(false);
	let shareDialogOpen = $state(false);
	let shareUrl = $state('');
	let shareLoading = $state(false);

	function closeAllMenus() {
		showExportMenu = false;
		showNewMenu = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeAllMenus();
		}
	}

	function handleWindowClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('[data-dropdown]')) {
			closeAllMenus();
		}
	}

	async function handleShare() {
		shareLoading = true;
		try {
			shareUrl = await onshare();
			shareDialogOpen = true;
		} finally {
			shareLoading = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<header class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
	<div class="flex items-baseline gap-2">
		<h1 class="text-xl font-bold text-gray-900">haruka</h1>
		<span class="text-xs text-gray-400">v{__APP_VERSION__} (<span title={__BUILD_TIMESTAMP__}>{new Date(__BUILD_TIMESTAMP__).toLocaleString(getLocale(), { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>)</span>
	</div>

	<div class="flex items-center gap-3">
		{#if persistenceError}
			<span class="text-sm text-red-600">{persistenceError}</span>
		{/if}
		<LanguageSwitcher />
		<div class="relative" data-dropdown>
			<button
				class="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
				aria-haspopup="true"
				aria-expanded={showNewMenu}
				onclick={() => { showExportMenu = false; showNewMenu = !showNewMenu; }}
				data-testid="btn-new-file"
			>
				{m.header_newFile()}
			</button>
			{#if showNewMenu}
				<div
					class="absolute right-0 z-50 mt-1 w-44 rounded-md bg-white shadow-lg ring-1 ring-black/5"
					role="menu"
				>
					{#each TEMPLATES as tmpl}
						<button
							class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
							role="menuitem"
							data-testid="menu-template-{tmpl.id}"
							onclick={() => {
								showNewMenu = false;
								onnewfile(tmpl.id);
							}}
						>
							{getTemplateName(tmpl.id)}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		<button
			class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
			onclick={handleShare}
			disabled={!shareAvailable || shareLoading}
			title={shareAvailable ? m.header_shareTitle() : m.header_shareUnsupported()}
			data-testid="btn-share"
		>
			{shareLoading ? m.header_sharing() : m.header_share()}
		</button>
		<button
			class="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
			onclick={onpreview}
			title={m.header_previewTitle()}
			data-testid="btn-preview"
		>
			<span class="inline-flex items-center gap-1"><span class="inline-block rounded border border-current px-0.5 text-xs leading-none">↗</span> {m.header_preview()}</span>
		</button>
		<div class="relative" data-dropdown>
			<button
				class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
				aria-haspopup="true"
				aria-expanded={showExportMenu}
				onclick={() => { showNewMenu = false; showExportMenu = !showExportMenu; }}
				data-testid="btn-export"
			>
				{m.header_export()}
			</button>
			{#if showExportMenu}
				<div
					class="absolute right-0 z-50 mt-1 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5"
					role="menu"
				>
					<button
						class="block w-full px-4 py-2 text-left text-sm {keOnly ? 'cursor-not-allowed text-gray-300' : 'text-gray-700 hover:bg-gray-100'}"
						role="menuitem"
						disabled={keOnly}
						title={keOnly ? m.header_appleKarabinerOnly() : undefined}
						data-testid="menu-export-kbd"
						onclick={() => {
							showExportMenu = false;
							onexport('kbd');
						}}
					>
						{m.header_exportKbd()}
					</button>
					<button
						class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
						role="menuitem"
						data-testid="menu-export-json"
						onclick={() => {
							showExportMenu = false;
							onexport('json');
						}}
					>
						{m.header_exportJson()}
					</button>
					<button
						class="block w-full px-4 py-2 text-left text-sm {keOnly ? 'cursor-not-allowed text-gray-300' : 'text-gray-700 hover:bg-gray-100'}"
						role="menuitem"
						disabled={keOnly}
						title={keOnly ? m.header_appleKarabinerOnly() : undefined}
						data-testid="menu-export-both"
						onclick={() => {
							showExportMenu = false;
							onexport('both');
						}}
					>
						{m.header_exportBoth()}
					</button>
				</div>
			{/if}
		</div>
	</div>
</header>

<ShareDialog open={shareDialogOpen} url={shareUrl} onclose={() => { shareDialogOpen = false; }} />
