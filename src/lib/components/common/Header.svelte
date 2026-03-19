<!--
  Header — App header bar with template selection and file operations
  Props: onexport, onnewfile, onpreview, onshare, formatStatuses, persistenceError, shareAvailable
  Used by: routes/+page.svelte
-->
<script lang="ts">
	import { TEMPLATES } from '$lib/templates';
	import ShareDialog from './ShareDialog.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import type { ExportFormatId, ExportFormatStatus } from '$lib/models/export-format';
	import type { KbdTargetOs, KbdTargetExportStatus } from '$lib/models/types';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { getTemplateName } from '$lib/templates/index';

	let {
		onexport,
		onnewfile,
		onpreview,
		onshare,
		formatStatuses,
		kbdTargetStatuses,
		persistenceError = null,
		shareAvailable = true
	}: {
		onexport: (format: ExportFormatId, kbdTarget?: KbdTargetOs) => void;
		onnewfile: (templateId: string) => void;
		onpreview: () => void;
		onshare: () => Promise<string>;
		formatStatuses: ExportFormatStatus[];
		kbdTargetStatuses: KbdTargetExportStatus[];
		persistenceError: string | null;
		shareAvailable?: boolean;
	} = $props();

	/** .kbd 以外のエクスポート項目 */
	const nonKbdExportItems: { format: ExportFormatId; label: string }[] = [
		{ format: 'json', label: m.header_exportJson() },
		{ format: 'ahk', label: m.header_exportAhk() }
	];

	/** OS ごとの .kbd ラベル */
	const kbdTargetLabels: Record<KbdTargetOs, string> = {
		windows: m.header_exportKbdWindows(),
		macos: m.header_exportKbdMacos(),
		linux: m.header_exportKbdLinux(),
	};

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

	function getFormatStatus(format: ExportFormatId): ExportFormatStatus {
		return (
			formatStatuses.find((status) => status.format === format) ?? {
				format,
				available: false,
				staticallySupported: false,
				issues: [],
				notices: [],
				disabledReason: null
			}
		);
	}

	function getNoticeSummary(status: ExportFormatStatus): string | null {
		if (status.notices.length === 0) return null;
		if (status.notices.length === 1) return status.notices[0].message;
		return `${status.notices[0].message} (+${status.notices.length - 1})`;
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
					class="absolute right-0 z-50 mt-1 w-72 rounded-md bg-white shadow-lg ring-1 ring-black/5"
					role="menu"
				>
					{#each kbdTargetStatuses as kbdStatus}
						<button
							class="block w-full px-4 py-3 text-left text-sm {kbdStatus.available ? 'text-gray-700 hover:bg-gray-100' : 'cursor-not-allowed text-gray-300'}"
							role="menuitem"
							disabled={!kbdStatus.available}
							title={kbdStatus.disabledReason ?? undefined}
							data-testid="menu-export-kbd-{kbdStatus.target}"
							onclick={() => {
								if (!kbdStatus.available) return;
								showExportMenu = false;
								onexport('kbd', kbdStatus.target);
							}}
						>
							<span>{kbdTargetLabels[kbdStatus.target]}</span>
							{#if kbdStatus.notice}
								<span class="mt-1 block text-xs text-amber-600">{kbdStatus.notice}</span>
							{/if}
						</button>
					{/each}
					{#each nonKbdExportItems as item}
						{@const status = getFormatStatus(item.format)}
						{@const noticeSummary = getNoticeSummary(status)}
						<button
							class="block w-full px-4 py-3 text-left text-sm {status.available ? 'text-gray-700 hover:bg-gray-100' : 'cursor-not-allowed text-gray-300'}"
							role="menuitem"
							disabled={!status.available}
							title={status.disabledReason ?? undefined}
							data-testid="menu-export-{item.format}"
							onclick={() => {
								if (!status.available) return;
								showExportMenu = false;
								onexport(item.format);
							}}
						>
							<span>{item.label}</span>
							{#if noticeSummary}
								<span class="mt-1 block text-xs text-amber-600">{noticeSummary}</span>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</header>

<ShareDialog open={shareDialogOpen} url={shareUrl} onclose={() => { shareDialogOpen = false; }} />
