// =============================================================================
// localStorage Persistence Service — EditorState serialization
// =============================================================================
// Depends on: models/constants.ts, models/types.ts, services/migration.ts
// Tested by: N/A (integration-level, covered by E2E)
// Called from: routes/+page.svelte
// Serialize/deserialize EditorState with Map↔Object conversion

import { STORAGE_KEY, STORAGE_DEBOUNCE_MS, TAP_HOLD_DEFAULT_TIMEOUT } from '$lib/models/constants';
import * as m from '$lib/paraglide/messages';
import type {
	EditorState,
	KeyAction,
	Layer,
	SerializedEditorState,
	SerializedLayer,
	LayoutTemplate,
	VersionedStorage
} from '$lib/models/types';
import { parseAndMigrate, CURRENT_VERSION } from '$lib/services/migration';

// =============================================================================
// Serialization
// =============================================================================

function serializeLayers(layers: Layer[]): SerializedLayer[] {
	return layers.map((layer) => ({
		name: layer.name,
		actions: Object.fromEntries(layer.actions)
	}));
}

function deserializeLayers(serialized: SerializedLayer[]): Layer[] {
	return serialized.map((sl) => ({
		name: sl.name,
		actions: new Map<string, KeyAction>(Object.entries(sl.actions))
	}));
}

export function serialize(state: EditorState): SerializedEditorState {
	return {
		templateId: state.template.id,
		customKeys: state.template.keys,
		layers: serializeLayers(state.layers),
		selectedKeyId: state.selectedKeyId,
		activeLayerIndex: state.activeLayerIndex,
		jisToUsRemap: state.jisToUsRemap,
		tappingTerm: state.tappingTerm
	};
}

export function deserialize(
	data: SerializedEditorState,
	template: LayoutTemplate
): Partial<EditorState> {
	return {
		layers: deserializeLayers(data.layers),
		selectedKeyId: data.selectedKeyId,
		activeLayerIndex: data.activeLayerIndex,
		jisToUsRemap: data.jisToUsRemap ?? false,
		tappingTerm: data.tappingTerm ?? TAP_HOLD_DEFAULT_TIMEOUT
	};
}

// =============================================================================
// Storage Operations
// =============================================================================

export function saveState(state: EditorState): void {
	try {
		const serialized = serialize(state);
		const versioned: VersionedStorage = {
			version: CURRENT_VERSION,
			data: serialized
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned));
	} catch (err: any) {
		if (err?.name === 'QuotaExceededError' || err?.code === 22) {
			console.error('[persistence] localStorage quota exceeded');
			throw new PersistenceError(m.error_storage_quotaExceeded());
		}
		console.error('[persistence] Failed to save state:', err);
		throw new PersistenceError(m.error_storage_saveFailed());
	}
}

export function loadState(template: LayoutTemplate): Partial<EditorState> | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const { data, migrated, migratedFrom } = parseAndMigrate(raw);

		// Validate templateId matches
		if (data.templateId !== template.id) {
			console.warn('[persistence] Template mismatch, ignoring saved state');
			return null;
		}

		const state = deserialize(data, template);

		// If migrated, re-save immediately in new format
		if (migrated) {
			console.info(`[persistence] Data migrated from v${migratedFrom} to v${CURRENT_VERSION}, re-saving`);
			try {
				const versioned: VersionedStorage = {
					version: CURRENT_VERSION,
					data: serialize({
						template,
						layers: state.layers ?? [],
						selectedKeyId: state.selectedKeyId ?? null,
						activeLayerIndex: state.activeLayerIndex ?? 0,
						jisToUsRemap: state.jisToUsRemap ?? false,
						tappingTerm: state.tappingTerm ?? TAP_HOLD_DEFAULT_TIMEOUT
					})
				};
				localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned));
			} catch (saveErr) {
				console.warn('[persistence] Failed to re-save migrated data:', saveErr);
			}
		}

		return state;
	} catch (err) {
		console.error('[persistence] Failed to load state:', err);
		return null;
	}
}

export function clearState(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (err) {
		console.error('[persistence] Failed to clear state:', err);
	}
}

// =============================================================================
// Debounced Save
// =============================================================================

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedSave(state: EditorState): void {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		saveState(state);
	}, STORAGE_DEBOUNCE_MS);
}

// =============================================================================
// Error Class
// =============================================================================

export class PersistenceError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'PersistenceError';
	}
}

// =============================================================================
// Template ID Helper
// =============================================================================

/**
 * Read only the templateId from saved localStorage data without full deserialization.
 * Returns null if no saved data exists or data is invalid.
 */
export function getSavedTemplateId(): string | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const { data } = parseAndMigrate(raw);
		return data.templateId ?? null;
	} catch {
		return null;
	}
}
