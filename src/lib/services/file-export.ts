// =============================================================================
// File Export Service — File System Access API with anchor fallback
// =============================================================================
// Depends on: (none)
// Tested by: N/A (browser API, covered by E2E: tests/e2e/export.spec.ts)
// Called from: routes/+page.svelte

export type ExportFormat = 'kbd' | 'json' | 'both';

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
 * Export both .kbd and .json files
 */
export async function exportBoth(
	kbdContent: string,
	jsonContent: string,
	kbdFilename: string = 'keymap.kbd',
	jsonFilename: string = 'haruka.json'
): Promise<void> {
	await exportKbd(kbdContent, kbdFilename);
	await exportKeJson(jsonContent, jsonFilename);
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
	keJsonText: string
): Promise<void> {
	switch (format) {
		case 'kbd':
			await exportKbd(kbdText, 'kanata.kbd');
			break;
		case 'json':
			await exportKeJson(keJsonText, 'haruka.json');
			break;
		case 'both':
			await exportBoth(kbdText, keJsonText, 'kanata.kbd', 'haruka.json');
			break;
	}
}

/**
 * Handle download (.kbd only)
 */
export async function handleDownload(kbdText: string): Promise<void> {
	await exportKbd(kbdText, 'kanata.kbd');
}
