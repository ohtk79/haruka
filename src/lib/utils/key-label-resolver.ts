// =============================================================================
// Key Label Resolver
// =============================================================================
// Pure functions extracted from KeySvg.svelte for testability
// See: contracts/internal-modules.md C-001

import type { KeyAction, PhysicalKey } from '$lib/models/types';
import { hasModifiers } from '$lib/models/types';
import { MODIFIER_DISPLAY_MAP } from '$lib/models/constants';
import { KANATA_KEY_LABEL_MAP, US_KEY_LABELS } from '$lib/utils/kanata-keys';
import type { ShiftLabelEntry } from '$lib/models/shift-labels';

/**
 * Get display label for an action.
 * Returns the physical key label when action is undefined.
 */
export function getActionLabel(
	act: KeyAction | undefined,
	key: PhysicalKey,
	jisToUsRemap: boolean
): string {
	if (!act) return key.label;
	switch (act.type) {
		case 'key': {
			const jisLabel = KANATA_KEY_LABEL_MAP.get(act.value) ?? act.value;
			const keyLabel = (jisToUsRemap && US_KEY_LABELS.get(act.value)) || jisLabel;
			if (act.modifiers && act.modifiers.length > 0) {
				const mods = act.modifiers.map((m) => MODIFIER_DISPLAY_MAP[m] ?? m).join('-');
				return `${mods}-${keyLabel}`;
			}
			return keyLabel;
		}
		case 'transparent':
			return '_';
		case 'no-op':
			return 'XX';
		case 'layer-while-held':
			return act.layer;
		case 'layer-switch':
			return act.layer;
		case 'tap-hold':
			return ''; // handled by 2-line display
		default:
			return key.label;
	}
}

/**
 * Get CSS class name for action type coloring.
 */
export function getActionClass(act: KeyAction | undefined): string {
	if (!act) return 'key-normal';
	switch (act.type) {
		case 'key':
			return hasModifiers(act) ? 'key-chord' : 'key-normal';
		case 'transparent':
			return 'key-transparent';
		case 'no-op':
			return 'key-noop';
		case 'layer-while-held':
		case 'layer-switch':
			return 'key-layer';
		case 'tap-hold':
			return 'key-taphold';
		default:
			return 'key-normal';
	}
}

/**
 * Resolve the full display label for a key, considering shift labels
 * and JIS/US remap state.
 */
export function resolveKeyLabel(
	action: KeyAction | undefined,
	key: PhysicalKey,
	jisToUsRemap: boolean,
	shiftLabels: ReadonlyMap<string, ShiftLabelEntry>,
	shiftLabelByKanataName: ReadonlyMap<string, ShiftLabelEntry> | undefined
): string {
	const isDefaultAction = !action || (action.type === 'key' && action.value === key.kanataName);

	// Default action: use shift label from the physical key
	if (isDefaultAction) {
		const entry = shiftLabels.get(key.id);
		if (entry) {
			const shiftChar = jisToUsRemap ? entry.usShift : entry.jisShift;
			const normalChar = jisToUsRemap ? entry.usNormal : entry.jisNormal;
			if (shiftChar !== null) {
				return `${shiftChar}\n${normalChar}`;
			}
			return normalChar;
		}
	}

	// Remapped key action: look up shift label for the target kanata key
	if (action?.type === 'key' && shiftLabelByKanataName) {
		const targetEntry = shiftLabelByKanataName.get(action.value);
		if (targetEntry) {
			const shiftChar = jisToUsRemap ? targetEntry.usShift : targetEntry.jisShift;
			const normalChar = jisToUsRemap ? targetEntry.usNormal : targetEntry.jisNormal;
			if (shiftChar !== null) {
				return `${shiftChar}\n${normalChar}`;
			}
			return normalChar;
		}
	}

	// kanataName を持たないキー（Fn など）が transparent の場合、物理ラベルを表示
	if (action?.type === 'transparent' && !key.kanataName) {
		return key.label;
	}

	return getActionLabel(action, key, jisToUsRemap);
}
