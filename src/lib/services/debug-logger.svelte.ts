// =============================================================================
// Debug Logger Service — Timestamped event capture for debug panel
// =============================================================================
// Depends on: models/types.ts, models/action-handler.ts
// Tested by: N/A (UI-only debug tool)
// Called from: stores/editor.svelte.ts, components/common/DebugPanel.svelte, routes/+page.svelte

import type { KeyAction } from '$lib/models/types';
import { visitAction } from '$lib/models/action-handler';
import * as m from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime.js';

export interface DebugLogEntry {
	time: string;
	category: 'action' | 'state' | 'lifecycle' | 'error';
	message: string;
	detail?: string;
}

const MAX_ENTRIES = 200;

class DebugLogger {
	entries: DebugLogEntry[] = $state([]);
	enabled: boolean = $state(true);

	private push(category: DebugLogEntry['category'], message: string, detail?: string) {
		if (!this.enabled) return;
		const now = new Date();
		const time = now.toLocaleTimeString(getLocale(), { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
		this.entries.push({ time, category, message, detail });
		if (this.entries.length > MAX_ENTRIES) {
			this.entries.splice(0, this.entries.length - MAX_ENTRIES);
		}
	}

	// --- Store actions ---

	logSelectKey(keyId: string | null) {
		this.push('action', `selectKey(${keyId ?? 'null'})`);
	}

	logSetAction(keyId: string, action: KeyAction) {
		const detail = formatAction(action);
		this.push('action', `setAction("${keyId}")`, detail);
	}

	logSwitchLayer(index: number, layerName: string) {
		this.push('action', `switchLayer(${index}) → "${layerName}"`);
	}

	logAddLayer(name: string, result: string | null) {
		if (result) {
			this.push('error', `addLayer("${name}") FAILED: ${result}`);
		} else {
			this.push('action', `addLayer("${name}")`);
		}
	}

	logDeleteLayer(index: number, name: string, result: string | null) {
		if (result) {
			this.push('error', `deleteLayer(${index}, "${name}") FAILED: ${result}`);
		} else {
			this.push('action', `deleteLayer(${index}, "${name}")`);
		}
	}

	logRenameLayer(index: number, oldName: string, newName: string, result: string | null) {
		if (result) {
			this.push('error', `renameLayer("${oldName}" → "${newName}") FAILED: ${result}`);
		} else {
			this.push('action', `renameLayer("${oldName}" → "${newName}")`);
		}
	}

	logReorderLayer(from: number, to: number) {
		this.push('action', `reorderLayer(${from} → ${to})`);
	}

	logResetToNew() {
		this.push('lifecycle', 'resetToNew()');
	}

	logRestoreState(hasData: boolean) {
		this.push('lifecycle', hasData ? m.debug_logRestoreFound() : m.debug_logRestoreEmpty());
	}

	logPersistenceSave() {
		this.push('state', m.debug_logPersistSave());
	}

	logPersistenceError(msg: string) {
		this.push('error', `persistence: ${msg}`);
	}

	// --- Generic ---

	log(message: string, detail?: string) {
		this.push('state', message, detail);
	}

	// --- Utilities ---

	clear() {
		this.entries = [];
	}

	toText(): string {
		return this.entries
			.map((e) => {
				const tag = `[${e.category.toUpperCase()}]`.padEnd(12);
				const line = `${e.time} ${tag} ${e.message}`;
				return e.detail ? `${line}\n             ${e.detail}` : line;
			})
			.join('\n');
	}

	/** Current state summary for quick copy */
	stateSnapshot(store: {
		selectedKeyId: string | null;
		activeLayerIndex: number;
		layers: { name: string; actions: Map<string, KeyAction> }[];
		activeLayer: { name: string; actions: Map<string, KeyAction> };
	}): string {
		const selKey = store.selectedKeyId ?? '(none)';
		const layerInfo = store.layers.map((l, i) => `  [${i}] ${l.name} (${l.actions.size} keys)`).join('\n');
		const action = store.selectedKeyId
			? store.activeLayer?.actions.get(store.selectedKeyId)
			: undefined;
		return [
			`Selected Key: ${selKey}`,
			`Active Layer: [${store.activeLayerIndex}] ${store.activeLayer?.name}`,
			action ? `Current Action: ${formatAction(action)}` : 'Current Action: (none)',
			`Layers:\n${layerInfo}`
		].join('\n');
	}
}

function formatAction(action: KeyAction): string {
	return visitAction(action, {
		key: (a) => {
			const mods = a.modifiers && a.modifiers.length > 0 ? `[${a.modifiers.join('+')}] ` : '';
			return `key(${mods}"${a.value}")`;
		},
		transparent: () => 'transparent (_)',
		'no-op': () => 'no-op (XX)',
		'layer-while-held': (a) => `layer-while-held("${a.layer}")`,
		'layer-switch': (a) => `layer-switch("${a.layer}")`,
		'tap-hold': (a) => `tap-hold(${a.variant}, tap=${formatAction(a.tapAction)}, hold=${formatAction(a.holdAction)}, ${a.tapTimeout}/${a.holdTimeout}ms)`
	});
}

/** Singleton instance */
export const debugLog = new DebugLogger();
