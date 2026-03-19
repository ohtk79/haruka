<!--
  +page.svelte — Main application page: keyboard configurator
  Orchestrates: EditorStore, keyboard SVG, action panel, layer tabs, settings, file I/O
  Tested by: tests/e2e/ (action-type, export, jis-us-remap, template-selection)
-->
<script lang="ts">
	import { setContext, onMount, onDestroy } from 'svelte';
	import { EDITOR_STORE_CONTEXT_KEY } from '$lib/models/constants';
	import { EditorStore } from '$lib/stores/editor.svelte';
	import { DEFAULT_TEMPLATE, getTemplateById } from '$lib/templates';
	import KeyboardSvg from '$lib/components/keyboard/KeyboardSvg.svelte';
	import ActionPanel from '$lib/components/panels/ActionPanel.svelte';
	import LayerTabs from '$lib/components/layers/LayerTabs.svelte';
	import GlobalSettingsPanel from '$lib/components/panels/GlobalSettingsPanel.svelte';
	import ConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';
	import NewFileConfirmDialog from '$lib/components/common/NewFileConfirmDialog.svelte';
	import Header from '$lib/components/common/Header.svelte';
	import { checkLayerReferences } from '$lib/services/validation';
	import { handleExport } from '$lib/services/file-export';
	import { openPreviewPopup, updatePopupContent, closePreviewPopup } from '$lib/services/preview-popup.svelte';
	import { loadState, debouncedSave, clearState, getSavedTemplateId, PersistenceError } from '$lib/stores/persistence';
	import { debugLog } from '$lib/services/debug-logger.svelte';
	import DebugPanel from '$lib/components/common/DebugPanel.svelte';
	import type { KeyAction, LayoutTemplate } from '$lib/models/types';
	import type { ImportSummary } from '$lib/models/share-types';
	import { serializeForShare, deserializeFromShare, createImportSummary } from '$lib/services/share-serializer';
	import { encodeShareData, generateShareUrl, decodeShareData, extractEncodedFromHash } from '$lib/services/share-url';
	import { isCompressionStreamAvailable } from '$lib/utils/compression';
	import { ShareError } from '$lib/services/share-validator';
	import ImportConfirmDialog from '$lib/components/common/ImportConfirmDialog.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getTemplateName } from '$lib/templates/index';

	// Resolve initial template from localStorage or default
	const savedTemplateId = getSavedTemplateId();
	const initialTemplate = savedTemplateId
		? getTemplateById(savedTemplateId) ?? DEFAULT_TEMPLATE
		: DEFAULT_TEMPLATE;

	// Initialize store with resolved template
	const store = new EditorStore(initialTemplate);
	setContext(EDITOR_STORE_CONTEXT_KEY, store);

	// Derived: use US labels when template is natively US or user toggled JIS→US
	let useUsLabels = $derived(store.jisToUsRemap || store.template.usLayout === true);

	// Derived: set of kanataNames in current template (for KeyPicker filtering)
	let templateKanataNames = $derived(new Set(store.template.keys.map((k) => k.kanataName).filter((name): name is string => name !== undefined)));

	// Persistence error display
	let persistenceError = $state<string | null>(null);

	// Restore saved state on mount
	onMount(() => {
		const saved = loadState(initialTemplate);
		debugLog.logRestoreState(!!saved);
		if (saved) {
			store.restoreState(saved);
		}
		debugLog.log('App mounted', `layers=${store.layers.length}, template=${store.template.id}`);

		// URL ハッシュから共有データを検出
		checkUrlHash();
	});

	// Auto-save on state change
	$effect(() => {
		// Access reactive properties to create dependency tracking
		const state = store.getState();
		try {
			debouncedSave(state);
			persistenceError = null;
		} catch (err) {
			if (err instanceof PersistenceError) {
				persistenceError = err.message;
			}
		}
	});
	// Confirm dialog state
	let confirmOpen = $state(false);
	let confirmTitle = $state('');
	let confirmDesc = $state('');
	let confirmLabel = $state('OK');
	let confirmAction = $state<(() => void) | null>(null);

	function handleKeySelect(keyId: string) {
		const isDeselecting = store.selectedKeyId === keyId;
		store.selectKey(isDeselecting ? null : keyId);
		kbdHighlightMode = isDeselecting ? null : 'selected';
	}

	function handleActionChange(keyId: string, action: KeyAction) {
		store.setAction(keyId, action);
		if (keyId === store.selectedKeyId) {
			kbdHighlightMode = 'changed';
		}
	}

	function handleLayerSwitch(index: number) {
		settingsTabActive = false;
		store.switchLayer(index);
	}

	function handleLayerAdd() {
		const name = `layer-${store.layers.length}`;
		const error = store.addLayer(name);
		if (error) {
			alert(error);
		}
	}

	function handleLayerDelete(index: number) {
		const layerName = store.layers[index]?.name;
		if (!layerName) return;

		// Check for broken references
		const brokenRefs = checkLayerReferences(store.layers, layerName);
		if (brokenRefs.length > 0) {
			confirmTitle = m.dialog_deleteLayer_title();
			confirmDesc = m.dialog_deleteLayer_message({ layerName, refCount: String(brokenRefs.length) });
			confirmLabel = m.button_delete();
			confirmAction = () => {
				store.deleteLayer(index);
				confirmOpen = false;
			};
			confirmOpen = true;
		} else {
			store.deleteLayer(index);
		}
	}

	function handleLayerRename(index: number, name: string) {
		const error = store.renameLayer(index, name);
		if (error) {
			alert(error);
		}
	}

	function handleLayerReorder(fromIndex: number, toIndex: number) {
		store.reorderLayer(fromIndex, toIndex);
	}

	let selectedKey = $derived(
		store.selectedKeyId
			? store.template.keys.find((k) => k.id === store.selectedKeyId) ?? null
			: null
	);

	let currentAction = $derived(
		store.selectedKeyId ? store.activeLayer?.actions.get(store.selectedKeyId) : undefined
	);

	// .kbd highlight mode: blue for selected, red for changed
	let kbdHighlightMode = $state<'selected' | 'changed' | null>(null);
	// Settings tab state
	let settingsTabActive = $state(false);

	function handleSettingsSwitch() {
		settingsTabActive = true;
		store.selectKey(null);
	}

	// Sync content to popup window reactively
	$effect(() => {
		updatePopupContent(store.kbdText, store.keJsonText, store.ahkText, store.formatStatuses, store.kbdValidation, store.kbdNotice);
	});

	// Cleanup popup on destroy
	onDestroy(() => closePreviewPopup());

	function handleNewFile(templateId: string) {
		const template = getTemplateById(templateId);
		if (!template) return;

		newFileTemplate = template;
		newFileConfirmOpen = true;
	}
	// New file confirm dialog state
	let newFileConfirmOpen = $state(false);
	let newFileTemplate = $state<LayoutTemplate | null>(null);

	function handleNewFileCreate(jisToUsRemap: boolean) {
		if (!newFileTemplate) return;
		store.resetWithTemplate(newFileTemplate, jisToUsRemap);
		clearState();
		settingsTabActive = false;
		newFileConfirmOpen = false;
		newFileTemplate = null;
	}

	const shareAvailable = isCompressionStreamAvailable();

	// 共有 URL 復元用の状態
	let importConfirmOpen = $state(false);
	let importSummary = $state<ImportSummary>({ templateName: '', layerCount: 0, changedKeyCount: 0, changedSettingsCount: 0 });
	let pendingImportState: ReturnType<typeof deserializeFromShare> | null = null;

	// 共有 URL エラー表示用
	let shareErrorMessage = $state<string | null>(null);

	async function handleShare(): Promise<string> {
		const shareData = serializeForShare(store.getState());
		const encoded = await encodeShareData(shareData);
		return generateShareUrl(encoded);
	}

	/**
	 * URL ハッシュから共有データを検出・デコードし、確認ダイアログを表示する
	 */
	async function checkUrlHash() {
		const hash = window.location.hash;
		const encoded = extractEncodedFromHash(hash);
		if (!encoded) return;

		try {
			const shareData = await decodeShareData(encoded);
			const editorState = deserializeFromShare(shareData);
			importSummary = createImportSummary(shareData, getTemplateName(store.template.id));
			pendingImportState = editorState;
			importConfirmOpen = true;
		} catch (err) {
			// ShareError はステージ別のユーザー向けメッセージを持つ
			if (err instanceof ShareError) {
				shareErrorMessage = err.message;
			} else {
				shareErrorMessage = m.error_share_loadFailed();
			}
			// localStorage の既存設定は変更しない（保全）
		}
		// ハッシュを除去（確認/キャンセルに関わらず）
		history.replaceState(null, '', window.location.pathname + window.location.search);
	}

	function handleImportConfirm() {
		if (pendingImportState) {
			store.restoreState(pendingImportState);
			pendingImportState = null;
		}
		importConfirmOpen = false;
	}

	function handleImportCancel() {
		pendingImportState = null;
		importConfirmOpen = false;
	}
</script>

<Header onexport={(f, kbdTarget) => {
	if (f === 'kbd' && kbdTarget) {
		handleExport(f, store.generateKbdForTarget(kbdTarget), store.keJsonText, store.ahkText);
	} else {
		handleExport(f, store.kbdText, store.keJsonText, store.ahkText);
	}
}} onnewfile={handleNewFile} onpreview={() => openPreviewPopup(store.kbdText, store.keJsonText, store.ahkText, store.formatStatuses, store.kbdValidation, store.kbdTarget, (t) => store.setKbdTarget(t), store.kbdNotice)} onshare={handleShare} formatStatuses={store.formatStatuses} kbdTargetStatuses={store.kbdTargetStatuses} {persistenceError} {shareAvailable} />

<main class="mx-auto max-w-screen-2xl p-4">

	{#if shareErrorMessage}
		<div class="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
			<span>{shareErrorMessage}</span>
			<button
				class="ml-4 text-red-600 hover:text-red-800"
				onclick={() => { shareErrorMessage = null; }}
				aria-label={m.button_close()}
				data-testid="btn-error-banner-close"
			>&times;</button>
		</div>
	{/if}

	<!-- Layer tabs -->
	<div class="mb-4">
		<LayerTabs
			layers={store.layers}
			activeIndex={store.activeLayerIndex}
			isSettingsActive={settingsTabActive}
			onlayerswitch={handleLayerSwitch}
			onlayeradd={handleLayerAdd}
			onlayerdelete={handleLayerDelete}
			onlayerrename={handleLayerRename}
			onlayerreorder={handleLayerReorder}
			onsettingsswitch={handleSettingsSwitch}
		/>
	</div>

	{#if settingsTabActive}
		<!-- Settings panel -->
		<div class="rounded-lg border border-gray-200 bg-white p-4">
			<GlobalSettingsPanel
				tappingTerm={store.tappingTerm}
				ontappingtermchange={(v) => store.setTappingTerm(v)}
			/>
		</div>
	{:else}
	<div class="flex flex-col gap-4">
		<!-- Keyboard area (full width) -->
		<div>
			<KeyboardSvg
				template={store.template}
				activeLayer={store.activeLayer}
				selectedKeyId={store.selectedKeyId}
				jisToUsRemap={useUsLabels}
				onkeyselect={handleKeySelect}
			/>
		</div>

		<!-- Action panel (full width, bottom) -->
		<div class="rounded-lg border border-gray-200 bg-white p-4">
			<ActionPanel
				{selectedKey}
				{currentAction}
				layers={store.layers}
				onactionchange={handleActionChange}
				usMode={useUsLabels}
				templateKanataNames={templateKanataNames}
				isAppleTemplate={store.template.keOnly === true}
			/>
		</div>
	</div>
	{/if}

</main>

<ConfirmDialog
	open={confirmOpen}
	title={confirmTitle}
	description={confirmDesc}
	confirmLabel={confirmLabel}
	onconfirm={() => confirmAction?.()}
	oncancel={() => (confirmOpen = false)}
/>

<NewFileConfirmDialog
	open={newFileConfirmOpen}
	templateName={newFileTemplate ? getTemplateName(newFileTemplate.id) : ''}
	showJisUsToggle={newFileTemplate?.id === 'jis-109' || newFileTemplate?.id === 'apple-jis'}
	showKeOnlyNotice={newFileTemplate?.keOnly === true}
	oncreate={handleNewFileCreate}
	oncancel={() => { newFileConfirmOpen = false; newFileTemplate = null; }}
/>

<ImportConfirmDialog
	open={importConfirmOpen}
	summary={importSummary}
	onconfirm={handleImportConfirm}
	oncancel={handleImportCancel}
/>

<DebugPanel {store} />
