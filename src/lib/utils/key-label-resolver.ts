// =============================================================================
// Key Label Resolver
// =============================================================================
// Pure functions extracted from KeySvg.svelte for testability
// See: contracts/internal-modules.md C-001

import type { KeyAction, PhysicalKey } from '$lib/models/types';
import { hasModifiers } from '$lib/models/types';
import { visitAction } from '$lib/models/action-handler';
import { MODIFIER_DISPLAY_MAP } from '$lib/models/constants';
import { KANATA_KEY_LABEL_MAP, US_KEY_LABELS, type ShiftLabelEntry } from '$lib/models/key-metadata';

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
	return visitAction(act, {
		key: (a) => {
			const jisLabel = KANATA_KEY_LABEL_MAP.get(a.value) ?? a.value;
			const keyLabel = (jisToUsRemap && US_KEY_LABELS.get(a.value)) || jisLabel;
			if (a.modifiers && a.modifiers.length > 0) {
				const mods = a.modifiers.map((m) => MODIFIER_DISPLAY_MAP[m] ?? m).join('-');
				return `${mods}-${keyLabel}`;
			}
			return keyLabel;
		},
		transparent: () => '_',
		'no-op': () => 'XX',
		'layer-while-held': (a) => a.layer,
		'layer-switch': (a) => a.layer,
		'tap-hold': () => '' // handled by 2-line display
	});
}

/**
 * Get CSS class name for action type coloring.
 */
export function getActionClass(act: KeyAction | undefined): string {
	if (!act) return 'key-normal';
	return visitAction(act, {
		key: (a) => hasModifiers(a) ? 'key-chord' : 'key-normal',
		transparent: () => 'key-transparent',
		'no-op': () => 'key-noop',
		'layer-while-held': () => 'key-layer',
		'layer-switch': () => 'key-layer',
		'tap-hold': () => 'key-taphold'
	});
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
