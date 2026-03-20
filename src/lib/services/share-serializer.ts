// =============================================================================
// Share Serializer — EditorState ↔ ShareData 変換サービス
// =============================================================================
// Depends on: models/types.ts, models/share-types.ts, models/constants.ts, templates/index.ts, models/action-handler.ts
// Tested by: tests/unit/share-serializer.test.ts
// Called from: services/share-url.ts, routes/+page.svelte

import type {
	KeyAction,
	KeyActionKey,
	KeyActionTapHold,
	EditorState,
	Layer,
	PhysicalKey,
	LayoutTemplate,
	TapAction,
	HoldAction,
	TapHoldVariant
} from '$lib/models/types';
import { visitAction } from '$lib/models/action-handler';
import type {
	ShareAction,
	ShareActionKey,
	ShareActionTapHold,
	ShareData,
	ShareLayer,
	ShareTapAction,
	ShareHoldAction,
	ShareTapHoldVariant,
	ImportSummary
} from '$lib/models/share-types';
import {
	SHARE_FORMAT_VERSION,
	TAPPING_TERM_DEFAULT,
	BASE_LAYER_NAME,
	LEGACY_ACTION_MIGRATION
} from '$lib/models/constants';
import { getTemplateById, getTemplateName, TEMPLATES } from '$lib/templates';

// =============================================================================
// KeyAction → ShareAction 変換
// =============================================================================

/** TapHoldVariant → ShareTapHoldVariant 短縮マッピング */
const VARIANT_TO_SHORT: Record<TapHoldVariant, ShareTapHoldVariant> = {
	'tap-hold': 'th',
	'tap-hold-press': 'thp',
	'tap-hold-release': 'thr'
};

/** ShareTapHoldVariant → TapHoldVariant 復元マッピング */
const SHORT_TO_VARIANT: Record<ShareTapHoldVariant, TapHoldVariant> = {
	th: 'tap-hold',
	thp: 'tap-hold-press',
	thr: 'tap-hold-release'
};

/**
 * KeyAction を短縮形の ShareAction に変換する
 */
export function toShareAction(action: KeyAction): ShareAction {
	return visitAction<ShareAction>(action, {
		key: (a) => {
			const result: ShareActionKey = { t: 'k', v: a.value };
			if (a.modifiers && a.modifiers.length > 0) {
				result.m = [...a.modifiers];
			}
			return result;
		},
		transparent: () => ({ t: '_' as const }),
		'no-op': () => ({ t: 'x' as const }),
		'layer-while-held': (a) => ({ t: 'lh' as const, l: a.layer }),
		'layer-switch': (a) => ({ t: 'ls' as const, l: a.layer }),
		'tap-hold': (a) => ({
			t: 'th' as const,
			vr: VARIANT_TO_SHORT[a.variant],
			to: a.tapTimeout,
			ho: a.holdTimeout,
			ta: toShareAction(a.tapAction) as ShareTapAction,
			ha: toShareAction(a.holdAction) as ShareHoldAction
		})
	});
}

// =============================================================================
// ShareAction → KeyAction 変換
// =============================================================================

/**
 * ShareAction を KeyAction に復元する
 */
export function fromShareAction(shareAction: ShareAction): KeyAction {
	switch (shareAction.t) {
		case 'k': {
			const migratedValue = LEGACY_ACTION_MIGRATION[shareAction.v] ?? shareAction.v;
			const result: KeyActionKey = { type: 'key', value: migratedValue };
			if (shareAction.m && shareAction.m.length > 0) {
				result.modifiers = [...shareAction.m];
			}
			return result;
		}
		case '_':
			return { type: 'transparent' };
		case 'x':
			return { type: 'no-op' };
		case 'lh':
			return { type: 'layer-while-held', layer: shareAction.l };
		case 'ls':
			return { type: 'layer-switch', layer: shareAction.l };
		case 'th': {
			return {
				type: 'tap-hold',
				variant: SHORT_TO_VARIANT[shareAction.vr],
				tapTimeout: shareAction.to,
				holdTimeout: shareAction.ho,
				tapAction: fromShareAction(shareAction.ta) as TapAction,
				holdAction: fromShareAction(shareAction.ha) as HoldAction
			};
		}
	}
}

// =============================================================================
// デフォルト判定
// =============================================================================

/**
 * layer-0 のキーがデフォルト値かどうかを判定する
 * - kanataName があるキー: type=key, value=kanataName, modifier なし → デフォルト
 * - kanataName がないキー: type=transparent → デフォルト
 */
export function isLayerZeroDefault(action: KeyAction, key: PhysicalKey): boolean {
	if (key.kanataName) {
		return (
			action.type === 'key' &&
			action.value === key.kanataName &&
			(!('modifiers' in action) || !action.modifiers || action.modifiers.length === 0)
		);
	}
	return action.type === 'transparent';
}

// =============================================================================
// シリアライズ（EditorState → ShareData）
// =============================================================================

/**
 * EditorState を差分ベースの ShareData に変換する
 * layer-0: テンプレートのデフォルトと異なるキーのみ記録
 * layer-1+: transparent 以外のキーのみ記録
 */
export function serializeForShare(state: EditorState): ShareData {
	const template = state.template;
	const layers: ShareLayer[] = [];

	for (let layerIndex = 0; layerIndex < state.layers.length; layerIndex++) {
		const layer = state.layers[layerIndex];
		const diffs: Record<string, ShareAction> = {};

		for (const [keyId, action] of layer.actions) {
			const key = template.keys.find((k) => k.id === keyId);
			if (!key) continue;

			if (layerIndex === 0) {
				// layer-0: テンプレートデフォルトと異なるものだけ
				if (!isLayerZeroDefault(action, key)) {
					diffs[keyId] = toShareAction(action);
				}
			} else {
				// layer-1+: transparent 以外はすべて差分
				if (action.type !== 'transparent') {
					diffs[keyId] = toShareAction(action);
				}
			}
		}

		layers.push({ n: layer.name, a: diffs });
	}

	const result: ShareData = {
		v: SHARE_FORMAT_VERSION,
		t: template.id,
		l: layers
	};

	if (state.jisToUsRemap === true) {
		result.j = true;
	}

	if (state.tappingTerm !== TAPPING_TERM_DEFAULT) {
		result.tt = state.tappingTerm;
	}

	return result;
}

// =============================================================================
// デシリアライズ（ShareData → EditorState）
// =============================================================================

/**
 * ShareData + テンプレート情報から EditorState を再構築する
 * @throws テンプレートが見つからない場合にエラー
 */
export function deserializeFromShare(data: ShareData): EditorState {
	const template = getTemplateById(data.t);
	if (!template) {
		throw new Error(`Template not found: ${data.t}`);
	}

	const layers: Layer[] = [];

	for (let layerIndex = 0; layerIndex < data.l.length; layerIndex++) {
		const shareLayer = data.l[layerIndex];

		// ベースレイヤかどうかでデフォルトアクションを生成
		const actions = new Map<string, KeyAction>();
		for (const key of template.keys) {
			if (layerIndex === 0) {
				// layer-0: kanataName があれば key アクション、なければ transparent
				if (key.kanataName) {
					actions.set(key.id, { type: 'key', value: key.kanataName });
				} else {
					actions.set(key.id, { type: 'transparent' });
				}
			} else {
				// layer-1+: 全キー transparent
				actions.set(key.id, { type: 'transparent' });
			}
		}

		// 差分を上書き適用
		for (const [keyId, shareAction] of Object.entries(shareLayer.a)) {
			actions.set(keyId, fromShareAction(shareAction));
		}

		layers.push({ name: shareLayer.n, actions });
	}

	return {
		template,
		layers,
		selectedKeyId: null,
		activeLayerIndex: 0,
		jisToUsRemap: data.j ?? false,
		tappingTerm: data.tt ?? TAPPING_TERM_DEFAULT
	};
}

// =============================================================================
// ImportSummary 生成
// =============================================================================

/**
 * ShareData から復元確認ダイアログ用のサマリ情報を生成する
 */
export function createImportSummary(
	data: ShareData,
	currentTemplateName?: string
): ImportSummary {
	const template = getTemplateById(data.t);
	const templateName = getTemplateName(data.t);

	const changedKeyCount = data.l.reduce(
		(sum, layer) => sum + Object.keys(layer.a).length,
		0
	);

	// Global Settings の変更数を算出
	let changedSettingsCount = 0;
	if (data.j) changedSettingsCount++;
	if (data.tt !== undefined) changedSettingsCount++;

	const summary: ImportSummary = {
		templateName,
		layerCount: data.l.length,
		changedKeyCount,
		changedSettingsCount
	};

	// テンプレート不一致の場合
	if (currentTemplateName && currentTemplateName !== templateName) {
		summary.currentTemplateName = currentTemplateName;
	}

	return summary;
}
