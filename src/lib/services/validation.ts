// =============================================================================
// Validation Service — Layer name and state validation
// =============================================================================
// Depends on: models/constants.ts, models/types.ts
// Tested by: N/A (tested via EditorStore: tests/unit/editor-store.test.ts)
// Called from: stores/editor.svelte.ts, routes/+page.svelte

import {
	KANATA_RESERVED_WORDS,
	LAYER_NAME_PATTERN,
	MAX_LAYERS,
	TAP_HOLD_TIMEOUT_MAX,
	TAP_HOLD_TIMEOUT_MIN,
	MODIFIER_KEYS,
	KE_DEFAULT_ALONE_TIMEOUT,
	KE_DEFAULT_HELD_THRESHOLD
} from '$lib/models/constants';
import type { KeyAction, KeyActionKey, Layer } from '$lib/models/types';
import { isTopLevelAction, isTapAction, isHoldAction } from '$lib/models/types';
import * as m from '$lib/paraglide/messages';

/**
 * レイヤ名バリデーション
 * @returns エラーメッセージ (null = valid)
 */
export function validateLayerName(
	name: string,
	existingNames: string[],
	currentName?: string
): string | null {
	if (!name || name.trim().length === 0) {
		return m.validation_layerNameRequired();
	}
	if (!LAYER_NAME_PATTERN.test(name)) {
		return m.validation_layerNamePattern();
	}
	if (KANATA_RESERVED_WORDS.includes(name as (typeof KANATA_RESERVED_WORDS)[number])) {
		return m.validation_reservedWord({ name });
	}
	if (currentName !== name && existingNames.includes(name)) {
		return m.validation_duplicateName({ name });
	}
	return null;
}

/**
 * Tap-Hold タイムアウト値バリデーション
 * @returns エラーメッセージ (null = valid)
 */
export function validateTimeout(value: number): string | null {
	if (!Number.isInteger(value)) {
		return m.validation_timeoutInteger();
	}
	if (value < TAP_HOLD_TIMEOUT_MIN || value > TAP_HOLD_TIMEOUT_MAX) {
		return m.validation_timeoutRange({ min: String(TAP_HOLD_TIMEOUT_MIN), max: String(TAP_HOLD_TIMEOUT_MAX) });
	}
	return null;
}

/**
 * レイヤ数バリデーション
 * @returns エラーメッセージ (null = valid)
 */
export function validateLayerCount(currentCount: number): string | null {
	if (currentCount >= MAX_LAYERS) {
		return m.validation_maxLayers({ max: String(MAX_LAYERS) });
	}
	return null;
}

/**
 * レイヤ参照整合性チェック
 * layer-while-held / layer-switch の参照先レイヤが存在するか検証
 * @returns 壊れた参照のリスト
 */
export function checkLayerReferences(
	layers: Layer[],
	deletedLayerName?: string
): { keyId: string; layerName: string; referencedLayer: string }[] {
	const layerNames = new Set(layers.map((l) => l.name));
	if (deletedLayerName) {
		layerNames.delete(deletedLayerName);
	}

	const brokenRefs: { keyId: string; layerName: string; referencedLayer: string }[] = [];

	for (const layer of layers) {
		if (layer.name === deletedLayerName) continue;
		for (const [keyId, action] of layer.actions) {
			const refs = collectLayerReferences(action);
			for (const ref of refs) {
				if (!layerNames.has(ref)) {
					brokenRefs.push({ keyId, layerName: layer.name, referencedLayer: ref });
				}
			}
		}
	}

	return brokenRefs;
}

/**
 * KeyAction 内のレイヤ参照を再帰的に収集
 */
function collectLayerReferences(action: KeyAction): string[] {
	const refs: string[] = [];
	if (action.type === 'layer-while-held' || action.type === 'layer-switch') {
		refs.push(action.layer);
	} else if (action.type === 'tap-hold') {
		refs.push(...collectLayerReferences(action.tapAction));
		refs.push(...collectLayerReferences(action.holdAction));
	}
	return refs;
}

// =============================================================================
// Action Validation
// =============================================================================

/** 有効な修飾子IDリスト */
const VALID_MODIFIER_IDS = MODIFIER_KEYS.map((m) => m.id);

/**
 * KeyActionKey の修飾子バリデーション
 * - 修飾子が指定されている場合、有効な修飾子IDか検証
 * - 修飾子のみ（value 空）は不許可
 * @returns エラーメッセージ (null = valid)
 */
export function validateKeyAction(action: KeyActionKey): string | null {
	if (action.modifiers && action.modifiers.length > 0) {
		for (const mod of action.modifiers) {
			if (!VALID_MODIFIER_IDS.includes(mod as typeof VALID_MODIFIER_IDS[number])) {
				return m.validation_invalidModifier({ mod });
			}
		}
		if (!action.value || action.value.trim() === '') {
			return m.validation_modifierOnly();
		}
	}
	return null;
}

/**
 * トップレベルアクションの構造バリデーション
 * - layer-while-held / layer-switch はトップレベルで不許可（tap-hold 内のみ）
 * @returns エラーメッセージ (null = valid)
 */
export function validateTopLevelAction(action: KeyAction): string | null {
	if (!isTopLevelAction(action)) {
		return m.validation_invalidTopLevel({ type: action.type });
	}
	if (action.type === 'tap-hold') {
		const tapAction = action.tapAction as KeyAction;
		const holdAction = action.holdAction as KeyAction;
		if (!isTapAction(tapAction)) {
			return m.validation_invalidTapAction({ type: tapAction.type });
		}
		if (!isHoldAction(holdAction)) {
			return m.validation_invalidHoldAction({ type: holdAction.type });
		}
	}
	return null;
}

/**
 * KE タイムアウト値バリデーション
 * @returns エラーメッセージ (null = valid)
 */
export function validateKeTimeout(value: number, fieldName: string): string | null {
	if (!Number.isInteger(value)) {
		return m.validation_fieldInteger({ fieldName });
	}
	if (value < 0 || value > 65535) {
		return m.validation_fieldRange({ fieldName });
	}
	return null;
}
