// =============================================================================
// Data Migration Service — v1 → v2 → v3 → v4 → v5 → v6
// =============================================================================
// Depends on: models/types.ts, models/constants.ts
// Tested by: tests/unit/migration.test.ts
// Called from: stores/persistence.ts
// Converts legacy localStorage data to the new format:
// v1 → v2: output-chord → key + modifiers (C/S/A/M), layer wrap
// v2 → v3: modifier IDs C/S/A/M → lctl/lsft/lalt/lmet (left/right distinction)
// v3 → v4: base layer rename 'base' → 'layer-0'
// v4 → v5: action ID 正規化 kana→lang1, eisu→lang2
// v5 → v6: keyId/action 正規化 (Apple JIS KanaMode→Lang1Key, JIS 109 lang1→jp-kana)

import type { KeyAction, SerializedEditorState, SerializedLayer, VersionedStorage, TapAction, HoldAction } from '$lib/models/types';
import { TAP_HOLD_DEFAULT_TIMEOUT, LEGACY_ACTION_MIGRATION } from '$lib/models/constants';

/** Legacy action type from v1 (not in current KeyAction union) */
interface LegacyOutputChord {
	type: 'output-chord';
	key?: string;
	modifiers?: string[];
}

/** Action type used during v1 migration (includes legacy types) */
type MigratableAction = KeyAction | LegacyOutputChord;

/** Current schema version */
export const CURRENT_VERSION = 6;

/** Migration function type */
type MigrationFn = (data: SerializedEditorState) => SerializedEditorState;

/** Migration registry: version → function that migrates FROM that version */
export const MIGRATIONS: ReadonlyMap<number, MigrationFn> = new Map<number, MigrationFn>([
	[1, migrateV1ToV2],
	[2, migrateV2ToV3],
	[3, migrateV3ToV4],
	[4, migrateV4ToV5],
	[5, migrateV5ToV6],
]);

/**
 * Detect whether raw localStorage data needs migration
 * Returns true if data is v1 (no version field) or has outdated version
 */
export function needsMigration(raw: unknown): boolean {
	if (!raw || typeof raw !== 'object') return false;

	// Check if it's already a VersionedStorage
	if ('version' in (raw as Record<string, unknown>)) {
		const versioned = raw as VersionedStorage;
		return versioned.version < CURRENT_VERSION;
	}

	// No version field → v1 format, needs migration
	// Check if it looks like a SerializedEditorState
	return 'templateId' in (raw as Record<string, unknown>);
}

/**
 * Migrate v1 data to v2 format
 * - output-chord → key + modifiers
 * - Top-level layer-while-held/layer-switch → tap-hold wrap
 * - Idempotent: already-v2 data passes through unchanged
 */
export function migrateV1ToV2(data: SerializedEditorState): SerializedEditorState {
	return {
		...data,
		layers: data.layers.map(migrateLayer),
		tappingTerm: data.tappingTerm ?? 200,
		keAloneTimeout: data.keAloneTimeout ?? 1000,
		keHeldThreshold: data.keHeldThreshold ?? 500
	};
}

/**
 * Migrate a single layer's actions
 */
function migrateLayer(layer: SerializedLayer): SerializedLayer {
	const newActions: Record<string, KeyAction> = {};

	for (const [keyId, action] of Object.entries(layer.actions)) {
		newActions[keyId] = migrateAction(action as MigratableAction, true);
	}

	return { name: layer.name, actions: newActions };
}

/** Map legacy kanata modifier names to new modifier IDs */
const LEGACY_MODIFIER_MAP: Record<string, string> = {
	lctl: 'C',
	rctl: 'C',
	lsft: 'S',
	rsft: 'S',
	lalt: 'A',
	ralt: 'A',
	lmet: 'M',
	rmet: 'M'
};

function migrateLegacyModifiers(modifiers: string[]): string[] {
	return modifiers
		.map((m) => LEGACY_MODIFIER_MAP[m] ?? m)
		.filter((m, i, arr) => arr.indexOf(m) === i); // deduplicate
}

/**
 * Migrate a single action
 * @param topLevel - true when processing a top-level key action (not inside tap-hold)
 */
function migrateAction(action: MigratableAction, topLevel: boolean): KeyAction {
	// output-chord → key + modifiers
	if (action.type === 'output-chord') {
		const modifiers = migrateLegacyModifiers(action.modifiers ?? []);
		return {
			type: 'key',
			value: action.key ?? '',
			...(modifiers.length > 0 ? { modifiers } : {})
		};
	}

	// Top-level layer-while-held → tap-hold wrap (only at top level)
	if (topLevel && action.type === 'layer-while-held') {
		return {
			type: 'tap-hold',
			variant: 'tap-hold-press',
			tapTimeout: TAP_HOLD_DEFAULT_TIMEOUT,
			holdTimeout: TAP_HOLD_DEFAULT_TIMEOUT,
			tapAction: { type: 'transparent' },
			holdAction: { type: 'layer-while-held', layer: action.layer }
		};
	}

	// Top-level layer-switch → tap-hold wrap (only at top level)
	if (topLevel && action.type === 'layer-switch') {
		return {
			type: 'tap-hold',
			variant: 'tap-hold-press',
			tapTimeout: TAP_HOLD_DEFAULT_TIMEOUT,
			holdTimeout: TAP_HOLD_DEFAULT_TIMEOUT,
			tapAction: { type: 'transparent' },
			holdAction: { type: 'layer-switch', layer: action.layer }
		};
	}

	// Tap-hold: recursively migrate sub-actions (not top-level)
	if (action.type === 'tap-hold') {
		return {
			...action,
			tapAction: migrateAction(action.tapAction, false) as TapAction,
			holdAction: migrateAction(action.holdAction, false) as HoldAction
		};
	}

	// All other types pass through unchanged
	return action as KeyAction;
}

// =============================================================================
// v2 → v3 Migration: Modifier IDs C/S/A/M → lctl/lsft/lalt/lmet
// =============================================================================

/** Map v2 modifier IDs to v3 (left-side by default, already-v3 pass through) */
const V2_TO_V3_MODIFIER_MAP: Record<string, string> = {
	C: 'lctl', S: 'lsft', A: 'lalt', M: 'lmet',
	lctl: 'lctl', rctl: 'rctl', lsft: 'lsft', rsft: 'rsft',
	lalt: 'lalt', ralt: 'ralt', lmet: 'lmet', rmet: 'rmet'
};

/**
 * Migrate v2 data to v3 format
 * - Modifier IDs: C→lctl, S→lsft, A→lalt, M→lmet
 * - Idempotent: already-v3 data passes through unchanged
 */
export function migrateV2ToV3(data: SerializedEditorState): SerializedEditorState {
	return {
		...data,
		layers: data.layers.map(migrateLayerV3)
	};
}

function migrateLayerV3(layer: SerializedLayer): SerializedLayer {
	const newActions: Record<string, KeyAction> = {};
	for (const [keyId, action] of Object.entries(layer.actions)) {
		newActions[keyId] = migrateActionV3(action);
	}
	return { name: layer.name, actions: newActions };
}

function migrateModifiersV3(modifiers: string[]): string[] {
	return modifiers.map((m) => V2_TO_V3_MODIFIER_MAP[m] ?? m);
}

function migrateActionV3(action: KeyAction): KeyAction {
	if (action.type === 'key' && action.modifiers && action.modifiers.length > 0) {
		return { ...action, modifiers: migrateModifiersV3(action.modifiers) };
	}
	if (action.type === 'tap-hold') {
		return {
			...action,
			tapAction: migrateActionV3(action.tapAction) as TapAction,
			holdAction: migrateActionV3(action.holdAction) as HoldAction
		};
	}
	return action;
}

// =============================================================================
// v3 → v4 Migration: Base layer rename 'base' → 'layer-0'
// =============================================================================

const V3_BASE_LAYER_NAME = 'base';
const V4_BASE_LAYER_NAME = 'layer-0';

/**
 * Migrate v3 data to v4 format
 * - Rename base layer from 'base' to 'layer-0'
 * - Update all layer references in actions (layer-while-held, layer-switch)
 * - Idempotent: already-v4 data passes through unchanged
 */
export function migrateV3ToV4(data: SerializedEditorState): SerializedEditorState {
	return {
		...data,
		layers: data.layers.map(migrateLayerV4)
	};
}

function migrateLayerV4(layer: SerializedLayer): SerializedLayer {
	const newName = layer.name === V3_BASE_LAYER_NAME ? V4_BASE_LAYER_NAME : layer.name;
	const newActions: Record<string, KeyAction> = {};
	for (const [keyId, action] of Object.entries(layer.actions)) {
		newActions[keyId] = migrateActionV4(action);
	}
	return { name: newName, actions: newActions };
}

function migrateActionV4(action: KeyAction): KeyAction {
	if (action.type === 'layer-while-held' || action.type === 'layer-switch') {
		if (action.layer === V3_BASE_LAYER_NAME) {
			return { ...action, layer: V4_BASE_LAYER_NAME };
		}
	}
	if (action.type === 'tap-hold') {
		return {
			...action,
			tapAction: migrateActionV4(action.tapAction) as TapAction,
			holdAction: migrateActionV4(action.holdAction) as HoldAction
		};
	}
	return action;
}

// =============================================================================
// v4 → v5 Migration: action ID 正規化 kana→lang1, eisu→lang2
// =============================================================================

/**
 * Migrate v4 data to v5 format
 * - Normalize legacy action IDs: kana→lang1, eisu→lang2
 * - Idempotent: already-v5 data passes through unchanged
 */
export function migrateV4ToV5(data: SerializedEditorState): SerializedEditorState {
	return {
		...data,
		layers: data.layers.map(migrateLayerV5)
	};
}

function migrateLayerV5(layer: SerializedLayer): SerializedLayer {
	const newActions: Record<string, KeyAction> = {};
	for (const [keyId, action] of Object.entries(layer.actions)) {
		newActions[keyId] = migrateActionV5(action);
	}
	return { name: layer.name, actions: newActions };
}

function migrateActionV5(action: KeyAction): KeyAction {
	if (action.type === 'key') {
		const migrated = LEGACY_ACTION_MIGRATION[action.value];
		if (migrated) {
			return { ...action, value: migrated };
		}
	}
	if (action.type === 'tap-hold') {
		return {
			...action,
			tapAction: migrateActionV5(action.tapAction) as TapAction,
			holdAction: migrateActionV5(action.holdAction) as HoldAction
		};
	}
	return action;
}

// =============================================================================
// v5 → v6 Migration: keyId/action 正規化 (Apple JIS KanaMode→Lang1Key, JIS 109 kana→jp-kana)
// =============================================================================

/** v5→v6 で逆変換が必要なアクション値（v4→v5 で誤って変換されたもの） */
const V6_ACTION_REVERT: Readonly<Record<string, Record<string, string>>> = {
	'apple-jis': { lang1: 'kana', lang2: 'eisu' },
	'jis-109': { lang1: 'jp-kana' },
};

/** v5→v6 で keyId をリネームするマップ (テンプレート単位) */
const V6_KEY_RENAME: Readonly<Record<string, Record<string, string>>> = {
	'apple-jis': { KanaMode: 'Lang1Key' },
};

export function migrateV5ToV6(data: SerializedEditorState): SerializedEditorState {
	const revertMap = V6_ACTION_REVERT[data.templateId];
	const renameMap = V6_KEY_RENAME[data.templateId];
	if (!revertMap && !renameMap) return data;
	return {
		...data,
		layers: data.layers.map(layer => migrateLayerV6(layer, revertMap, renameMap))
	};
}

function migrateLayerV6(
	layer: SerializedLayer,
	revertMap: Record<string, string> | undefined,
	renameMap: Record<string, string> | undefined
): SerializedLayer {
	const newActions: Record<string, KeyAction> = {};
	for (const [keyId, action] of Object.entries(layer.actions)) {
		const newKeyId = renameMap?.[keyId] ?? keyId;
		newActions[newKeyId] = revertMap ? migrateActionV6(action, revertMap) : action;
	}
	return { name: layer.name, actions: newActions };
}

function migrateActionV6(action: KeyAction, revertMap: Record<string, string>): KeyAction {
	if (action.type === 'key') {
		const reverted = revertMap[action.value];
		if (reverted) {
			return { ...action, value: reverted };
		}
	}
	if (action.type === 'tap-hold') {
		return {
			...action,
			tapAction: migrateActionV6(action.tapAction, revertMap) as TapAction,
			holdAction: migrateActionV6(action.holdAction, revertMap) as HoldAction
		};
	}
	return action;
}

/**
 * Parse raw localStorage JSON and migrate if needed
 * Returns the migrated SerializedEditorState and whether migration occurred
 */
export function parseAndMigrate(raw: string): {
	data: SerializedEditorState;
	migrated: boolean;
	migratedFrom?: number;
} {
	const parsed = JSON.parse(raw);

	let data: SerializedEditorState;
	let version: number;

	// Check if it's a VersionedStorage wrapper
	if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
		const versioned = parsed as VersionedStorage;
		if (versioned.version >= CURRENT_VERSION) {
			return { data: versioned.data, migrated: false };
		}
		version = versioned.version;
		data = versioned.data;
	} else if (needsMigration(parsed)) {
		// No version wrapper — treat as v1
		version = 1;
		data = parsed as SerializedEditorState;
	} else {
		// Assume it's a valid SerializedEditorState
		return { data: parsed as SerializedEditorState, migrated: false };
	}

	// Chain migrations using registry
	const startVersion = version;
	for (let v = version; v < CURRENT_VERSION; v++) {
		const migrateFn = MIGRATIONS.get(v);
		if (migrateFn) {
			data = migrateFn(data);
		}
	}

	const migrated = startVersion < CURRENT_VERSION;
	return { data, migrated, migratedFrom: migrated ? startVersion : undefined };
}
