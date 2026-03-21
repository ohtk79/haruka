// =============================================================================
// File Export Service — File System Access API with anchor fallback
// =============================================================================
// Depends on: (none)
// Tested by: N/A (browser API, covered by E2E: tests/e2e/export.spec.ts)
// Called from: routes/+page.svelte

import type { ExportFormatId } from '$lib/models/export-format';

export type ExportFormat = ExportFormatId;

/**
 * Export .kbd (kanata) file
 */
export async function exportKbd(content: string, filename: string = 'keymap.kbd'): Promise<void> {
	await exportFileWithType(content, filename, {
		description: 'Kanata Config File',
		accept: { 'text/plain': ['.kbd'] }
	});
}

/**
 * Export .json (Karabiner-Elements) file
 */
export async function exportKeJson(content: string, filename: string = 'haruka.json'): Promise<void> {
	await exportFileWithType(content, filename, {
		description: 'Karabiner-Elements Complex Modifications',
		accept: { 'application/json': ['.json'] }
	});
}

/**
 * Export .ahk (AutoHotkey v2) file
 */
export async function exportAhk(content: string, filename: string = 'haruka.ahk'): Promise<void> {
	await exportFileWithType(content, filename, {
		description: 'AutoHotkey v2 Script',
		accept: { 'text/plain': ['.ahk'] }
	});
}

/**
 * Export text content as a file download with type hints
 */
async function exportFileWithType(
	content: string,
	filename: string,
	fileType: { description: string; accept: Record<string, string[]> }
): Promise<void> {
	// Try File System Access API first (Chrome 86+)
	if ('showSaveFilePicker' in window) {
		try {
			const handle = await window.showSaveFilePicker!({
				suggestedName: filename,
				types: [fileType]
			});
			const writable = await handle.createWritable();
			await writable.write(content);
			await writable.close();
			return;
		} catch (err: unknown) {
			// User cancelled the dialog
			if (err instanceof DOMException && err.name === 'AbortError') return;
			// Fall through to anchor download
		}
	}

	// Fallback: anchor download
	const mimeType = filename.endsWith('.json')
		? 'application/json;charset=utf-8'
		: 'text/plain;charset=utf-8';
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Handle export by format selection
 */
export async function handleExport(
	format: ExportFormat,
	kbdText: string,
	keJsonText: string,
	ahkText: string = '',
	keUnifiedJsonText: string = ''
): Promise<void> {
	switch (format) {
		case 'kbd':
			await exportKbd(kbdText, 'kanata.kbd');
			break;
		case 'json':
			await exportKeJson(keJsonText, 'haruka.json');
			break;
		case 'json-unified':
			await exportKeJson(keUnifiedJsonText, 'haruka.json');
			break;
		case 'ahk':
			await exportAhk(ahkText, 'haruka.ahk');
			break;
	}
}

/**
 * Handle download (.kbd only)
 */
export async function handleDownload(kbdText: string): Promise<void> {
	await exportKbd(kbdText, 'kanata.kbd');
}
