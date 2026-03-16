// =============================================================================
// Preview Popup Service — Manages preview popup window
// =============================================================================
// Depends on: (none)
// Tested by: N/A (browser popup, covered by manual testing)
// Called from: routes/+page.svelte

import * as m from '$lib/paraglide/messages';

let previewWindow: Window | null = $state(null);
let previewPopupTab = $state<'kbd' | 'json'>('kbd');

export function getPreviewPopupTab(): 'kbd' | 'json' {
	return previewPopupTab;
}

export function isPreviewOpen(): boolean {
	return previewWindow !== null && !previewWindow.closed;
}

export function openPreviewPopup(kbdText: string, keJsonText: string, keOnly = false): void {
	if (previewWindow && !previewWindow.closed) {
		previewWindow.focus();
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
		.tab:hover:not(.active) { background: #e5e7eb; }
		pre { margin: 0; padding: 16px; font-size: 13px; font-family: 'SF Mono', 'Fira Code', monospace; line-height: 1.5; white-space: pre; overflow: auto; }
		.panel { display: none; }
		.panel.active { display: block; }
	</style>`;
	w.document.body.innerHTML = `
		<div class="tabs">
			<button class="tab ${keOnly ? '' : 'active'}" data-tab="kbd" ${keOnly ? `disabled style="opacity:0.4;cursor:not-allowed;" title="${m.preview_appleKarabinerOnly()}"` : ''}>${m.preview_tabKbd()}</button>
			<button class="tab ${keOnly ? 'active' : ''}" data-tab="json">${m.preview_tabJson()}</button>
		</div>
		<div id="kbd-panel" class="panel ${keOnly ? '' : 'active'}"><pre id="kbd-content"></pre></div>
		<div id="json-panel" class="panel ${keOnly ? 'active' : ''}"><pre id="json-content"></pre></div>
	`;
	// Tab switching
	w.document.querySelectorAll('.tab').forEach((btn) => {
		btn.addEventListener('click', () => {
			const tab = (btn as HTMLElement).dataset.tab as 'kbd' | 'json';
			w.document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
			btn.classList.add('active');
			w.document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
			w.document.getElementById(`${tab}-panel`)?.classList.add('active');
			previewPopupTab = tab;
		});
	});
	if (keOnly) previewPopupTab = 'json';
	// Initial content
	updatePopupContent(kbdText, keJsonText);
}

export function updatePopupContent(kbdText: string, keJsonText: string): void {
	if (!previewWindow || previewWindow.closed) return;
	const kbdEl = previewWindow.document.getElementById('kbd-content');
	const jsonEl = previewWindow.document.getElementById('json-content');
	if (kbdEl) kbdEl.textContent = kbdText;
	if (jsonEl) jsonEl.textContent = keJsonText;
}

export function closePreviewPopup(): void {
	if (previewWindow && !previewWindow.closed) {
		previewWindow.close();
	}
	previewWindow = null;
}
