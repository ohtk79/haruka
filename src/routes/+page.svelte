<!-- +page.svelte — Orchestrates EditorStore, keyboard SVG, action panel, layer tabs, file I/O -->
<script lang="ts">
	import { setContext, onMount, onDestroy } from 'svelte';
	import { EDITOR_STORE_CONTEXT_KEY } from '$lib/models/constants';
	import { EditorStore } from '$lib/stores/editor.svelte';
	import { DEFAULT_TEMPLATE, getTemplateById, getTemplateName } from '$lib/templates';
	import KeyboardSvg from '$lib/components/keyboard/KeyboardSvg.svelte';
	import ActionPanel from '$lib/components/panels/ActionPanel.svelte';
	import LayerTabs from '$lib/components/layers/LayerTabs.svelte';
	import GlobalSettingsPanel from '$lib/components/panels/GlobalSettingsPanel.svelte';
	import ConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';
	import NewFileConfirmDialog from '$lib/components/common/NewFileConfirmDialog.svelte';
	import ImportConfirmDialog from '$lib/components/common/ImportConfirmDialog.svelte';
	import Header from '$lib/components/common/Header.svelte';
	import DebugPanel from '$lib/components/common/DebugPanel.svelte';
	import { checkLayerReferences } from '$lib/services/validation';
	import { handleExport } from '$lib/services/file-export';
	import { openPreviewPopup, updatePopupContent, closePreviewPopup } from '$lib/services/preview-popup.svelte';
	import { loadState, debouncedSave, clearState, getSavedTemplateId, PersistenceError } from '$lib/stores/persistence';
	import { debugLog } from '$lib/services/debug-logger.svelte';
	import { isCompressionStreamAvailable } from '$lib/utils/compression';
	import { DialogState } from '$lib/stores/dialog-state.svelte';
	import { checkUrlHash, generateShareUrlFromState, getShareErrorMessage } from '$lib/services/share-url-handler';
	import type { KeyAction, KbdTargetOs } from '$lib/models/types';
	import type { ExportFormat } from '$lib/services/file-export';
	import * as m from '$lib/paraglide/messages';

	const savedTemplateId = getSavedTemplateId();
	const initialTemplate = savedTemplateId ? getTemplateById(savedTemplateId) ?? DEFAULT_TEMPLATE : DEFAULT_TEMPLATE;
	const store = new EditorStore(initialTemplate);
	setContext(EDITOR_STORE_CONTEXT_KEY, store);
	const dialog = new DialogState();
	const shareAvailable = isCompressionStreamAvailable();
	let persistenceError = $state<string | null>(null);
	let kbdHighlightMode = $state<'selected' | 'changed' | null>(null);
	let settingsTabActive = $state(false);
	let pendingImportState: Partial<import('$lib/models/types').EditorState> | null = null;

	onMount(async () => {
		const saved = loadState(initialTemplate);
		debugLog.logRestoreState(!!saved);
		if (saved) store.restoreState(saved);
		debugLog.log('App mounted', `layers=${store.layers.length}, template=${store.template.id}`);
		try {
			const result = await checkUrlHash(getTemplateName(store.template.id));
			if (result) {
				pendingImportState = result.state;
				dialog.openImportDialog(result.summary);
			}
		} catch (err) {
			dialog.setShareError(getShareErrorMessage(err));
		}
	});

	$effect(() => {
		const state = store.getState();
		try { debouncedSave(state); persistenceError = null; }
		catch (err) { if (err instanceof PersistenceError) persistenceError = err.message; }
	});
	$effect(() => { updatePopupContent(store.kbdText, store.keJsonText, store.ahkText, store.formatStatuses, store.kbdValidation, store.kbdNotice); });
	onDestroy(() => closePreviewPopup());

	function handleKeySelect(keyId: string) {
		const isDeselecting = store.selectedKeyId === keyId;
		store.selectKey(isDeselecting ? null : keyId);
		kbdHighlightMode = isDeselecting ? null : 'selected';
	}

	function handleActionChange(keyId: string, action: KeyAction) {
		store.setAction(keyId, action);
		if (keyId === store.selectedKeyId) kbdHighlightMode = 'changed';
	}

	function handleLayerDelete(index: number) {
		const layerName = store.layers[index]?.name;
		if (!layerName) return;
		const brokenRefs = checkLayerReferences(store.layers, layerName);
		if (brokenRefs.length > 0) {
			dialog.openConfirmDialog(
				m.dialog_deleteLayer_title(),
				m.dialog_deleteLayer_message({ layerName, refCount: String(brokenRefs.length) }),
				m.button_delete(),
				() => { store.deleteLayer(index); dialog.closeConfirmDialog(); }
			);
		} else {
			store.deleteLayer(index);
		}
	}

	function handleExportAction(format: ExportFormat, kbdTarget?: KbdTargetOs) {
		if (format === 'kbd' && kbdTarget) {
			handleExport(format, store.generateKbdForTarget(kbdTarget), store.keJsonText, store.ahkText);
		} else {
			handleExport(format, store.kbdText, store.keJsonText, store.ahkText);
		}
	}

	function handlePreview() {
		openPreviewPopup(store.kbdText, store.keJsonText, store.ahkText, store.formatStatuses, store.kbdValidation, store.kbdTarget, (t) => store.setKbdTarget(t), store.kbdNotice);
	}

	function handleNewFile(templateId: string) {
		const tmpl = getTemplateById(templateId);
		if (tmpl) dialog.openNewFileDialog(tmpl);
	}

	function handleNewFileCreate(jisToUsRemap: boolean) {
		if (!dialog.newFileTemplate) return;
		store.resetWithTemplate(dialog.newFileTemplate, jisToUsRemap);
		clearState();
		settingsTabActive = false;
		dialog.closeNewFileDialog();
	}

	function handleImportConfirm() {
		if (pendingImportState) { store.restoreState(pendingImportState); pendingImportState = null; }
		dialog.closeImportDialog();
	}
</script>

<Header
	onexport={handleExportAction}
	onnewfile={handleNewFile}
	onpreview={handlePreview}
	onshare={() => generateShareUrlFromState(store.getState())}
	formatStatuses={store.formatStatuses}
	kbdTargetStatuses={store.kbdTargetStatuses}
	{persistenceError}
	{shareAvailable}
/>

<main class="mx-auto max-w-screen-2xl p-4">
	{#if dialog.shareErrorMessage}
		<div class="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
			<span>{dialog.shareErrorMessage}</span>
			<button class="ml-4 text-red-600 hover:text-red-800" onclick={() => { dialog.setShareError(null); }} aria-label={m.button_close()} data-testid="btn-error-banner-close">&times;</button>
		</div>
	{/if}

	<div class="mb-4">
		<LayerTabs
			layers={store.layers}
			activeIndex={store.activeLayerIndex}
			isSettingsActive={settingsTabActive}
			onlayerswitch={(i) => { settingsTabActive = false; store.switchLayer(i); }}
			onlayeradd={() => { const err = store.addLayer(`layer-${store.layers.length}`); if (err) alert(err); }}
			onlayerdelete={handleLayerDelete}
			onlayerrename={(i, n) => { const err = store.renameLayer(i, n); if (err) alert(err); }}
			onlayerreorder={(from, to) => store.reorderLayer(from, to)}
			onsettingsswitch={() => { settingsTabActive = true; store.selectKey(null); }}
		/>
	</div>

	{#if settingsTabActive}
		<div class="rounded-lg border border-gray-200 bg-white p-4">
			<GlobalSettingsPanel tappingTerm={store.tappingTerm} ontappingtermchange={(v) => store.setTappingTerm(v)} />
		</div>
	{:else}
	<div class="flex flex-col gap-4">
		<div>
			<KeyboardSvg
				template={store.template}
				activeLayer={store.activeLayer}
				selectedKeyId={store.selectedKeyId}
				jisToUsRemap={store.useUsLabels}
				onkeyselect={handleKeySelect}
			/>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white p-4">
			<ActionPanel
				selectedKey={store.selectedKey}
				currentAction={store.currentAction}
				layers={store.layers}
				onactionchange={handleActionChange}
				usMode={store.useUsLabels}
				templateKanataNames={store.templateKanataNames}
				isAppleTemplate={store.template.keOnly === true}
			/>
		</div>
	</div>
	{/if}
</main>

<ConfirmDialog
	open={dialog.confirmOpen} title={dialog.confirmTitle} description={dialog.confirmDesc}
	confirmLabel={dialog.confirmLabel}
	onconfirm={() => dialog.confirmAction?.()} oncancel={() => dialog.closeConfirmDialog()}
/>
<NewFileConfirmDialog
	open={dialog.newFileConfirmOpen}
	templateName={dialog.newFileTemplate ? getTemplateName(dialog.newFileTemplate.id) : ''}
	showJisUsToggle={dialog.newFileTemplate?.id === 'jis-109' || dialog.newFileTemplate?.id === 'apple-jis'}
	showKeOnlyNotice={dialog.newFileTemplate?.keOnly === true}
	oncreate={handleNewFileCreate} oncancel={() => dialog.closeNewFileDialog()}
/>
<ImportConfirmDialog
	open={dialog.importConfirmOpen} summary={dialog.importSummary}
	onconfirm={handleImportConfirm} oncancel={() => { pendingImportState = null; dialog.closeImportDialog(); }}
/>
<DebugPanel {store} />
