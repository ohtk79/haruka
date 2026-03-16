// =============================================================================
// KE Complex Modifications JSON Generator — Generates Karabiner-Elements JSON
// =============================================================================
// Depends on: models/types.ts, models/ke-keycode-map.ts, models/constants.ts, models/jis-us-map.ts
// Tested by: tests/unit/ke-generator.test.ts
// Called from: stores/editor.svelte.ts

import type { EditorState, KeyAction, Layer, PhysicalKey } from '$lib/models/types';
import {
	KANATA_TO_KE_MAP,
	getKeFromKeyCode,
	getKeToKeyCode,
	isKeUnsupported
} from '$lib/models/ke-keycode-map';
import { KE_MODIFIER_MAP, BASE_LAYER_NAME } from '$lib/models/constants';
import { JIS_TO_US_MAPPINGS } from '$lib/models/jis-us-map';
import { getTemplateName } from '$lib/templates/index';

// =============================================================================
// Non-kanata key mappings (KE-only keys like Fn)
// =============================================================================

/**
 * kanataName を持たないキーの KE key_code マッピング
 * PhysicalKey.id → KE key_code
 */
const NON_KANATA_KE_MAP: Readonly<Record<string, string>> = {
	Fn: 'fn',
};

/**
 * PhysicalKey から KE の from key_code を取得する
 * kanataName があればそちらを使い、なければ NON_KANATA_KE_MAP にフォールバック
 */
function getKeKeyCodeFromPhysicalKey(key: PhysicalKey): string | undefined {
	if (key.kanataName) {
		return getKeFromKeyCode(key.kanataName);
	}
	return NON_KANATA_KE_MAP[key.id];
}

// =============================================================================
// KE JSON Types
// =============================================================================

export interface KeComplexModifications {
	title: string;
	rules: KeRule[];
}

export interface KeRule {
	description: string;
	manipulators: KeManipulator[];
}

export interface KeManipulator {
	type: 'basic';
	from: KeFrom;
	to?: KeToEvent[];
	to_if_alone?: KeToEvent[];
	to_if_held_down?: KeToEvent[];
	to_after_key_up?: KeToEvent[];
	conditions?: KeCondition[];
	parameters?: KeParameters;
}

export interface KeFrom {
	key_code: string;
	modifiers?: {
		mandatory?: string[];
		optional?: string[];
	};
}

export type KeToEvent =
	| { key_code: string; modifiers?: string[] }
	| { set_variable: { name: string; value: string | number } };

export interface KeCondition {
	type: 'variable_if' | 'variable_unless';
	name: string;
	value: string | number;
}

export interface KeParameters {
	'basic.to_if_alone_timeout_milliseconds'?: number;
	'basic.to_if_held_down_threshold_milliseconds'?: number;
}

// =============================================================================
// Generator Result
// =============================================================================

export interface KeGeneratorResult {
	json: KeComplexModifications;
	/** kanata 専用でスキップされたキー情報 */
	skippedMediaKeys: string[];
}

// =============================================================================
// Generator
// =============================================================================

/**
 * Generate KE Complex Modifications JSON from EditorState
 */
export function generateKeJson(state: EditorState): KeGeneratorResult {
	const rules: KeRule[] = [];
	const skippedMediaKeys: string[] = [];

	// Rule order: non-base layers first (alphabetical), then base
	const nonBaseLayers = state.layers
		.filter((l) => l.name !== BASE_LAYER_NAME)
		.sort((a, b) => a.name.localeCompare(b.name));
	const baseLayer = state.layers.find((l) => l.name === BASE_LAYER_NAME);

	// Generate non-base layer rules (with variable_if conditions)
	for (const layer of nonBaseLayers) {
		for (const key of state.template.keys) {
			const action = layer.actions.get(key.id);
			if (!action) continue;

			// Skip transparent — no rule needed
			if (action.type === 'transparent') continue;

			// Check for unsupported media keys
			if (key.kanataName && isKeUnsupported(key.kanataName)) {
				if (!skippedMediaKeys.includes(key.kanataName)) {
					skippedMediaKeys.push(key.kanataName);
				}
				continue;
			}

			const fromKeyCode = getKeKeyCodeFromPhysicalKey(key);
			if (!fromKeyCode) continue;

			const manipulator = buildManipulator(action, key, layer.name, state);
			if (!manipulator) continue;

			// Add variable_if condition for non-base layers
			manipulator.conditions = [
				{ type: 'variable_if', name: 'haruka_layer', value: layer.name }
			];

			rules.push({
				description: `haruka: ${layer.name} - ${key.kanataName ?? key.id}`,
				manipulators: [manipulator]
			});
		}
	}

	// Generate base layer rules (no conditions)
	if (baseLayer) {
		// JIS→US ルール生成（カスタムルールの前に配置）
		if (state.jisToUsRemap) {
			rules.push(...buildJisUsRules(state, baseLayer));
		}

		for (const key of state.template.keys) {
			const action = baseLayer.actions.get(key.id);
			if (!action) continue;

			// Skip default actions (key with same kanataName, no modifiers)
			if (isDefaultAction(action, key)) continue;

			// Check for unsupported media keys
			if (key.kanataName && isKeUnsupported(key.kanataName)) {
				if (!skippedMediaKeys.includes(key.kanataName)) {
					skippedMediaKeys.push(key.kanataName);
				}
				continue;
			}

			const fromKeyCode = getKeKeyCodeFromPhysicalKey(key);
			if (!fromKeyCode) continue;

			const manipulator = buildManipulator(action, key, BASE_LAYER_NAME, state);
			if (!manipulator) continue;

			rules.push({
				description: `haruka: ${BASE_LAYER_NAME} - ${key.kanataName ?? key.id}`,
				manipulators: [manipulator]
			});
		}
	}

	return {
		json: {
			title: `haruka: ${getTemplateName(state.template.id)}`,
			rules
		},
		skippedMediaKeys
	};
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Check if an action is the default for a key (no remap needed)
 */
function isDefaultAction(action: KeyAction, key: PhysicalKey): boolean {
	return (
		action.type === 'key' &&
		action.value === key.kanataName &&
		(!action.modifiers || action.modifiers.length === 0)
	);
}

/**
 * JIS→US変換ルールを生成する
 */
function buildJisUsRules(state: EditorState, baseLayer: Layer): KeRule[] {
	const rules: KeRule[] = [];
	for (const mapping of JIS_TO_US_MAPPINGS) {
		const key = state.template.keys.find((k) => k.kanataName === mapping.kanataDefsrcName);
		if (!key) continue;

		const action = baseLayer.actions.get(key.id);
		if (action && !isDefaultAction(action, key)) continue;

		const fromKeyCode = getKeFromKeyCode(mapping.kanataDefsrcName);
		if (!fromKeyCode) continue;

		const normalTo = parseKanataExpr(mapping.normalExpr);
		const shiftTo = parseKanataExpr(mapping.shiftExpr);
		if (!normalTo || !shiftTo) continue;

		rules.push({
			description: `haruka: ${BASE_LAYER_NAME} - ${mapping.aliasName}`,
			manipulators: [
				{
					type: 'basic',
					from: { key_code: fromKeyCode, modifiers: { mandatory: ['shift'], optional: ['any'] } },
					to: [shiftTo]
				},
				{
					type: 'basic',
					from: { key_code: fromKeyCode, modifiers: { optional: ['any'] } },
					to: [normalTo]
				}
			]
		});
	}
	return rules;
}

/**
 * kanata式（S-[, int1, S-int3 等）をKE toイベントに変換する
 */
function parseKanataExpr(expr: string): { key_code: string; modifiers?: string[] } | null {
	const hasShift = expr.startsWith('S-');
	const kanataKey = hasShift ? expr.slice(2) : expr;
	const keyCode = getKeToKeyCode(kanataKey);
	if (!keyCode) return null;
	return hasShift ? { key_code: keyCode, modifiers: ['left_shift'] } : { key_code: keyCode };
}

/**
 * Build a KE manipulator for a given action
 */
function buildManipulator(
	action: KeyAction,
	key: PhysicalKey,
	layerName: string,
	state: EditorState
): KeManipulator | null {
	const fromKeyCode = getKeKeyCodeFromPhysicalKey(key);
	if (!fromKeyCode) return null;

	const from: KeFrom = {
		key_code: fromKeyCode,
		modifiers: { optional: ['any'] }
	};

	switch (action.type) {
		// Pattern A: Simple key remap (no modifiers)
		// Pattern B: Key with modifiers
		case 'key': {
			const toKeyCode = getKeToKeyCode(action.value);
			if (!toKeyCode) return null;

			const toEvent: { key_code: string; modifiers?: string[] } = { key_code: toKeyCode };

			if (action.modifiers && action.modifiers.length > 0) {
				toEvent.modifiers = action.modifiers
					.map((m) => KE_MODIFIER_MAP[m])
					.filter(Boolean);
			}

			return { type: 'basic', from, to: [toEvent] };
		}

		// Pattern G: no-op
		case 'no-op':
			return { type: 'basic', from, to: [{ key_code: 'vk_none' }] };

		// Pattern C/D/E: tap-hold
		case 'tap-hold':
			return buildTapHoldManipulator(action, from, state);

		// These should not appear at top level, but handle gracefully
		case 'layer-while-held':
		case 'layer-switch':
			return null;

		case 'transparent':
			return null;

		default:
			return null;
	}
}

/**
 * Build a KE manipulator for tap-hold actions
 */
function buildTapHoldManipulator(
	action: KeyAction & { type: 'tap-hold' },
	from: KeFrom,
	state: EditorState
): KeManipulator | null {
	const manipulator: KeManipulator = {
		type: 'basic',
		from,
		parameters: {
			'basic.to_if_alone_timeout_milliseconds': state.tappingTerm,
			'basic.to_if_held_down_threshold_milliseconds': state.tappingTerm
		}
	};

	// Build tap action (to_if_alone)
	const tapEvent = buildSimpleToEvent(action.tapAction);
	if (tapEvent) {
		manipulator.to_if_alone = [tapEvent];
	}

	// Build hold action
	switch (action.holdAction.type) {
		case 'key': {
			// Pattern C: hold = key
			const holdEvent = buildSimpleToEvent(action.holdAction);
			if (holdEvent) {
				manipulator.to_if_held_down = [holdEvent];
			}
			break;
		}
		case 'no-op': {
			// hold = no-op: use vk_none
			manipulator.to_if_held_down = [{ key_code: 'vk_none' }];
			break;
		}
		case 'layer-while-held': {
			// Pattern D: hold = layer-while-held
			manipulator.to = [
				{ set_variable: { name: 'haruka_layer', value: action.holdAction.layer } }
			];
			manipulator.to_after_key_up = [
				{ set_variable: { name: 'haruka_layer', value: BASE_LAYER_NAME } }
			];
			break;
		}
		case 'layer-switch': {
			// Pattern E: hold = layer-switch
			manipulator.to_if_held_down = [
				{ set_variable: { name: 'haruka_layer', value: action.holdAction.layer } }
			];
			break;
		}
	}

	return manipulator;
}

/**
 * Build a simple to event from a TapAction/HoldAction that is key type
 */
function buildSimpleToEvent(
	action: KeyAction
): { key_code: string; modifiers?: string[] } | null {
	switch (action.type) {
		case 'key': {
			const toKeyCode = getKeToKeyCode(action.value);
			if (!toKeyCode) return null;

			const event: { key_code: string; modifiers?: string[] } = { key_code: toKeyCode };
			if (action.modifiers && action.modifiers.length > 0) {
				event.modifiers = action.modifiers
					.map((m) => KE_MODIFIER_MAP[m])
					.filter(Boolean);
			}
			return event;
		}
		case 'transparent':
		case 'no-op':
			return null;
		default:
			return null;
	}
}
