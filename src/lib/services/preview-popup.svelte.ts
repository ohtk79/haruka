// =============================================================================
// Preview Popup Service — Manages preview popup window
// =============================================================================
// Depends on: models/export-format.ts
// Tested by: N/A (browser popup, covered by manual testing)
// Called from: routes/+page.svelte

import type { ExportFormatId, ExportFormatStatus } from '$lib/models/export-format';
import type { KbdTargetOs } from '$lib/models/types';
import type { KbdValidationResult } from '$lib/services/export-format-support';
import * as m from '$lib/paraglide/messages';

let previewWindow: Window | null = $state(null);
let previewPopupTab: ExportFormatId = $state('kbd');
let previewFormatStatuses: ExportFormatStatus[] = $state([]);
let previewKbdValidation: KbdValidationResult | null = $state(null);
let previewKbdNotice: string | null = $state(null);
let onKbdTargetChange: ((target: KbdTargetOs) => void) | null = null;

export function getPreviewPopupTab(): ExportFormatId {
	return previewPopupTab;
}

export function isPreviewOpen(): boolean {
	return previewWindow !== null && !previewWindow.closed;
}

export function openPreviewPopup(
	kbdText: string,
	keJsonText: string,
	ahkText: string,
	formatStatuses: ExportFormatStatus[],
	kbdValidation: KbdValidationResult,
	kbdTarget: KbdTargetOs = 'windows',
	onTargetChange?: (target: KbdTargetOs) => void,
	kbdNotice?: string | null,
	keUnifiedJsonText: string = ''
): void {
	previewFormatStatuses = formatStatuses;
	previewKbdValidation = kbdValidation;
	previewKbdNotice = kbdNotice ?? null;
	previewPopupTab = resolvePreviewTab(formatStatuses, previewPopupTab);
	onKbdTargetChange = onTargetChange ?? null;

	if (previewWindow && !previewWindow.closed) {
		previewWindow.focus();
		updatePopupContent(kbdText, keJsonText, ahkText, formatStatuses, kbdValidation, undefined, keUnifiedJsonText);
		return;
	}

	const w = window.open('', 'haruka-preview', 'width=720,height=600,resizable=yes,scrollbars=yes');
	if (!w) return;
	previewWindow = w;
	w.document.title = m.preview_windowTitle();
	w.document.head.innerHTML = `<style>
		body { margin: 0; font-family: system-ui, sans-serif; background: #f9fafb; }
		.tabs { display: flex; gap: 4px; padding: 8px 12px; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 1; }
		.tab { padding: 4px 12px; font-size: 13px; border: none; border-radius: 6px; cursor: pointer; background: transparent; color: #4b5563; }
		.tab.active { background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.1); color: #111; }
		.tab:hover:not(.active):not(:disabled) { background: #e5e7eb; }
		.tab:disabled { opacity: 0.45; cursor: not-allowed; }
		.target-bar { display: none; padding: 6px 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
		.target-bar.active { display: flex; align-items: center; gap: 8px; }
		.target-bar label { font-size: 12px; color: #6b7280; }
		.target-segment { display: inline-flex; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; }
		.target-segment button { padding: 3px 10px; font-size: 12px; border: none; background: #fff; color: #4b5563; cursor: pointer; border-right: 1px solid #d1d5db; }
		.target-segment button:last-child { border-right: none; }
		.target-segment button.active { background: #3b82f6; color: #fff; }
		.target-segment button:hover:not(.active) { background: #f3f4f6; }
		.status { display: none; padding: 10px 16px; font-size: 12px; border-bottom: 1px solid #e5e7eb; }
		.status.active { display: block; }
		.status.notice { background: #fff7ed; color: #9a3412; }
		.status.error { background: #fef2f2; color: #991b1b; }
		.status p { margin: 0 0 4px; }
		.status p:last-child { margin-bottom: 0; }
		pre { margin: 0; padding: 16px; font-size: 13px; font-family: 'SF Mono', 'Fira Code', monospace; line-height: 1.5; white-space: pre; overflow: auto; }
		.panel { display: none; }
		.panel.active { display: block; }
	</style>`;
	w.document.body.innerHTML = `
		<div class="tabs">
			<button class="tab" data-tab="kbd">${m.preview_tabKbd()}</button>
			<button class="tab" data-tab="json">${m.preview_tabJson()}</button>
			<button class="tab" data-tab="json-unified">${m.preview_tabJsonUnified()}</button>
			<button class="tab" data-tab="ahk">${m.preview_tabAhk()}</button>
		</div>
		<div id="target-bar" class="target-bar">
			<label>${m.preview_targetLabel()}</label>
			<div class="target-segment">
				<button data-target="windows" class="${kbdTarget === 'windows' ? 'active' : ''}">Windows</button>
				<button data-target="macos" class="${kbdTarget === 'macos' ? 'active' : ''}">macOS</button>
				<button data-target="linux" class="${kbdTarget === 'linux' ? 'active' : ''}">Linux</button>
			</div>
		</div>
		<div id="status-panel" class="status"></div>
		<div id="kbd-panel" class="panel"><pre id="kbd-content"></pre></div>
		<div id="json-panel" class="panel"><pre id="json-content"></pre></div>
		<div id="json-unified-panel" class="panel"><pre id="json-unified-content"></pre></div>
		<div id="ahk-panel" class="panel"><pre id="ahk-content"></pre></div>
	`;
	w.document.querySelectorAll<HTMLButtonElement>('.tab').forEach((button) => {
		button.addEventListener('click', () => {
			const tab = button.dataset.tab as ExportFormatId;
			if (!getFormatStatus(previewFormatStatuses, tab)?.available) return;
			previewPopupTab = tab;
			applyPopupState();
		});
	});

	w.document.querySelectorAll<HTMLButtonElement>('.target-segment button').forEach((button) => {
		button.addEventListener('click', () => {
			const target = button.dataset.target as KbdTargetOs;
			onKbdTargetChange?.(target);
			// target セグメントの active 状態を更新
			w.document.querySelectorAll<HTMLButtonElement>('.target-segment button').forEach((b) => {
				b.classList.toggle('active', b.dataset.target === target);
			});
		});
	});

	updatePopupContent(kbdText, keJsonText, ahkText, formatStatuses, kbdValidation, undefined, keUnifiedJsonText);
}

export function updatePopupContent(
	kbdText: string,
	keJsonText: string,
	ahkText: string,
	formatStatuses: ExportFormatStatus[],
	kbdValidation?: KbdValidationResult,
	kbdNotice?: string | null,
	keUnifiedJsonText: string = ''
): void {
	if (!previewWindow || previewWindow.closed) return;
	previewFormatStatuses = formatStatuses;
	if (kbdValidation !== undefined) previewKbdValidation = kbdValidation;
	previewKbdNotice = kbdNotice ?? null;
	previewPopupTab = resolvePreviewTab(formatStatuses, previewPopupTab);
	const kbdEl = previewWindow.document.getElementById('kbd-content');
	const jsonEl = previewWindow.document.getElementById('json-content');
	const jsonUnifiedEl = previewWindow.document.getElementById('json-unified-content');
	const ahkEl = previewWindow.document.getElementById('ahk-content');
	if (kbdEl) kbdEl.textContent = kbdText;
	if (jsonEl) jsonEl.textContent = keJsonText;
	if (jsonUnifiedEl) jsonUnifiedEl.textContent = keUnifiedJsonText;
	if (ahkEl) ahkEl.textContent = ahkText;
	applyPopupState();
}

export function closePreviewPopup(): void {
	if (previewWindow && !previewWindow.closed) {
		previewWindow.close();
	}
	previewWindow = null;
}

function applyPopupState(): void {
	if (!previewWindow || previewWindow.closed) return;
	const activeTab = resolvePreviewTab(previewFormatStatuses, previewPopupTab);
	previewPopupTab = activeTab;
	const status = getFormatStatus(previewFormatStatuses, activeTab);

	previewWindow.document.querySelectorAll<HTMLButtonElement>('.tab').forEach((button) => {
		const tab = button.dataset.tab as ExportFormatId;
		const tabStatus = getFormatStatus(previewFormatStatuses, tab);
		button.disabled = !tabStatus?.available;
		button.classList.toggle('active', tab === activeTab);
		button.title = tabStatus?.disabledReason ?? '';
	});

	for (const tab of ['kbd', 'json', 'json-unified', 'ahk'] as const) {
		previewWindow.document.getElementById(`${tab}-panel`)?.classList.toggle('active', tab === activeTab);
	}

	// .kbd タブ選択時のみ target セグメントを表示
	const targetBar = previewWindow.document.getElementById('target-bar');
	targetBar?.classList.toggle('active', activeTab === 'kbd');

	const statusPanel = previewWindow.document.getElementById('status-panel');
	if (!statusPanel || !status) return;
	if (!status.available) {
		statusPanel.className = 'status active error';
		statusPanel.innerHTML = `<p><strong>${escapeHtml(m.preview_unavailable())}</strong></p><p>${escapeHtml(status.disabledReason ?? '')}</p>`;
		return;
	}
	// .kbd タブでバリデーションエラーがある場合はステータスパネルに表示
	if (activeTab === 'kbd' && previewKbdValidation && !previewKbdValidation.valid) {
		statusPanel.className = 'status active error';
		statusPanel.innerHTML = previewKbdValidation.unsupportedActions
			.map((a) => `<p>${escapeHtml(a.actionId)}: ${escapeHtml(a.reason)}</p>`)
			.join('');
		return;
	}
	// .kbd タブで wintercept 注意喚起がある場合はステータスパネルに表示
	if (activeTab === 'kbd' && previewKbdNotice) {
		statusPanel.className = 'status active notice';
		statusPanel.innerHTML = `<p>${escapeHtml(previewKbdNotice)}</p>`;
		return;
	}
	if (status.notices.length > 0) {
		statusPanel.className = 'status active notice';
		statusPanel.innerHTML = status.notices
			.map((notice) => `<p>${escapeHtml(notice.message)}</p>`)
			.join('');
		return;
	}
	statusPanel.className = 'status';
	statusPanel.innerHTML = '';
}

function resolvePreviewTab(
	formatStatuses: ExportFormatStatus[],
	currentTab?: ExportFormatId
): ExportFormatId {
	if (currentTab && getFormatStatus(formatStatuses, currentTab)?.available) {
		return currentTab;
	}
	return formatStatuses.find((status) => status.available)?.format ?? 'json';
}

function getFormatStatus(
	formatStatuses: ExportFormatStatus[],
	format: ExportFormatId
): ExportFormatStatus | undefined {
	return formatStatuses.find((status) => status.format === format);
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}
