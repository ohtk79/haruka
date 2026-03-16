// =============================================================================
// share-serializer テスト
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
	toShareAction,
	fromShareAction,
	isLayerZeroDefault,
	serializeForShare,
	deserializeFromShare,
	createImportSummary
} from '$lib/services/share-serializer';
import type { KeyAction, PhysicalKey, EditorState, LayoutTemplate } from '$lib/models/types';
import type { ShareAction, ShareData } from '$lib/models/share-types';
import { SHARE_FORMAT_VERSION, TAP_HOLD_DEFAULT_TIMEOUT, BASE_LAYER_NAME } from '$lib/models/constants';

// =============================================================================
// テスト用ヘルパー
// =============================================================================

/** 最小テンプレート（テスト用） */
function createTestTemplate(): LayoutTemplate {
	return {
		id: 'ansi-104',
		name: 'ANSI 104',
		keys: [
			{ id: 'KeyA', label: 'A', kanataName: 'a', x: 0, y: 0, width: 1, height: 1 },
			{ id: 'KeyB', label: 'B', kanataName: 'b', x: 1, y: 0, width: 1, height: 1 },
			{ id: 'FnKey', label: 'Fn', x: 2, y: 0, width: 1, height: 1 }
		]
	};
}

/** テスト用 EditorState（layer-0 のみ、デフォルト状態） */
function createDefaultState(): EditorState {
	const template = createTestTemplate();
	const actions = new Map<string, KeyAction>();
	actions.set('KeyA', { type: 'key', value: 'a' });
	actions.set('KeyB', { type: 'key', value: 'b' });
	actions.set('FnKey', { type: 'transparent' });
	return {
		template,
		layers: [{ name: BASE_LAYER_NAME, actions }],
		selectedKeyId: null,
		activeLayerIndex: 0,
		jisToUsRemap: false,
		tappingTerm: TAP_HOLD_DEFAULT_TIMEOUT
	};
}

// =============================================================================
// toShareAction
// =============================================================================

describe('toShareAction', () => {
	it('key アクションを短縮形に変換する', () => {
		const action: KeyAction = { type: 'key', value: 'a' };
		expect(toShareAction(action)).toEqual({ t: 'k', v: 'a' });
	});

	it('key アクション + modifier を変換する', () => {
		const action: KeyAction = { type: 'key', value: 'a', modifiers: ['lctl', 'lsft'] };
		expect(toShareAction(action)).toEqual({ t: 'k', v: 'a', m: ['lctl', 'lsft'] });
	});

	it('空 modifier は省略される', () => {
		const action: KeyAction = { type: 'key', value: 'a', modifiers: [] };
		const result = toShareAction(action);
		expect(result).toEqual({ t: 'k', v: 'a' });
		expect('m' in result).toBe(false);
	});

	it('transparent を変換する', () => {
		expect(toShareAction({ type: 'transparent' })).toEqual({ t: '_' });
	});

	it('no-op を変換する', () => {
		expect(toShareAction({ type: 'no-op' })).toEqual({ t: 'x' });
	});

	it('layer-while-held を変換する', () => {
		expect(toShareAction({ type: 'layer-while-held', layer: 'nav' })).toEqual({
			t: 'lh',
			l: 'nav'
		});
	});

	it('layer-switch を変換する', () => {
		expect(toShareAction({ type: 'layer-switch', layer: 'gaming' })).toEqual({
			t: 'ls',
			l: 'gaming'
		});
	});

	it('tap-hold を再帰的に変換する', () => {
		const action: KeyAction = {
			type: 'tap-hold',
			variant: 'tap-hold-press',
			tapTimeout: 200,
			holdTimeout: 150,
			tapAction: { type: 'key', value: 'a' },
			holdAction: { type: 'layer-while-held', layer: 'nav' }
		};
		expect(toShareAction(action)).toEqual({
			t: 'th',
			vr: 'thp',
			to: 200,
			ho: 150,
			ta: { t: 'k', v: 'a' },
			ha: { t: 'lh', l: 'nav' }
		});
	});
});

// =============================================================================
// fromShareAction
// =============================================================================

describe('fromShareAction', () => {
	it('短縮 key を復元する', () => {
		expect(fromShareAction({ t: 'k', v: 'a' })).toEqual({ type: 'key', value: 'a' });
	});

	it('modifier 付き key を復元する', () => {
		expect(fromShareAction({ t: 'k', v: 'a', m: ['lctl'] })).toEqual({
			type: 'key',
			value: 'a',
			modifiers: ['lctl']
		});
	});

	it('transparent を復元する', () => {
		expect(fromShareAction({ t: '_' })).toEqual({ type: 'transparent' });
	});

	it('no-op を復元する', () => {
		expect(fromShareAction({ t: 'x' })).toEqual({ type: 'no-op' });
	});

	it('layer-while-held を復元する', () => {
		expect(fromShareAction({ t: 'lh', l: 'nav' })).toEqual({
			type: 'layer-while-held',
			layer: 'nav'
		});
	});

	it('layer-switch を復元する', () => {
		expect(fromShareAction({ t: 'ls', l: 'gaming' })).toEqual({
			type: 'layer-switch',
			layer: 'gaming'
		});
	});

	it('tap-hold を再帰的に復元する', () => {
		const shareAction: ShareAction = {
			t: 'th',
			vr: 'thr',
			to: 300,
			ho: 250,
			ta: { t: 'k', v: 'b' },
			ha: { t: 'ls', l: 'game' }
		};
		expect(fromShareAction(shareAction)).toEqual({
			type: 'tap-hold',
			variant: 'tap-hold-release',
			tapTimeout: 300,
			holdTimeout: 250,
			tapAction: { type: 'key', value: 'b' },
			holdAction: { type: 'layer-switch', layer: 'game' }
		});
	});
});

// =============================================================================
// toShareAction ↔ fromShareAction ラウンドトリップ
// =============================================================================

describe('toShareAction / fromShareAction roundtrip', () => {
	const actions: KeyAction[] = [
		{ type: 'key', value: 'spc' },
		{ type: 'key', value: 'a', modifiers: ['lctl', 'lsft'] },
		{ type: 'transparent' },
		{ type: 'no-op' },
		{ type: 'layer-while-held', layer: 'arrows' },
		{ type: 'layer-switch', layer: 'layer-1' },
		{
			type: 'tap-hold',
			variant: 'tap-hold',
			tapTimeout: 200,
			holdTimeout: 200,
			tapAction: { type: 'key', value: 'esc' },
			holdAction: { type: 'layer-while-held', layer: 'nav' }
		}
	];

	for (const action of actions) {
		it(`${action.type} をラウンドトリップできる`, () => {
			const share = toShareAction(action);
			const restored = fromShareAction(share);
			expect(restored).toEqual(action);
		});
	}
});

// =============================================================================
// isLayerZeroDefault
// =============================================================================

describe('isLayerZeroDefault', () => {
	const keyWithKanata: PhysicalKey = {
		id: 'KeyA',
		label: 'A',
		kanataName: 'a',
		x: 0,
		y: 0,
		width: 1,
		height: 1
	};
	const keyWithoutKanata: PhysicalKey = {
		id: 'FnKey',
		label: 'Fn',
		x: 2,
		y: 0,
		width: 1,
		height: 1
	};

	it('kanataName キーの key アクション（同値）はデフォルト', () => {
		expect(isLayerZeroDefault({ type: 'key', value: 'a' }, keyWithKanata)).toBe(true);
	});

	it('kanataName キーで modifier 付きはデフォルトでない', () => {
		expect(
			isLayerZeroDefault({ type: 'key', value: 'a', modifiers: ['lctl'] }, keyWithKanata)
		).toBe(false);
	});

	it('kanataName キーで値が異なるとデフォルトでない', () => {
		expect(isLayerZeroDefault({ type: 'key', value: 'b' }, keyWithKanata)).toBe(false);
	});

	it('kanataName キーで transparent はデフォルトでない', () => {
		expect(isLayerZeroDefault({ type: 'transparent' }, keyWithKanata)).toBe(false);
	});

	it('kanataName なしキーの transparent はデフォルト', () => {
		expect(isLayerZeroDefault({ type: 'transparent' }, keyWithoutKanata)).toBe(true);
	});

	it('kanataName なしキーの key アクションはデフォルトでない', () => {
		expect(isLayerZeroDefault({ type: 'key', value: 'fn' }, keyWithoutKanata)).toBe(false);
	});
});

// =============================================================================
// serializeForShare
// =============================================================================

describe('serializeForShare', () => {
	it('デフォルト状態では差分が空になる', () => {
		const state = createDefaultState();
		const result = serializeForShare(state);
		expect(result.v).toBe(SHARE_FORMAT_VERSION);
		expect(result.t).toBe('ansi-104');
		expect(result.l).toHaveLength(1);
		expect(result.l[0].n).toBe(BASE_LAYER_NAME);
		expect(result.l[0].a).toEqual({});
	});

	it('変更されたキーだけが差分に含まれる', () => {
		const state = createDefaultState();
		state.layers[0].actions.set('KeyA', { type: 'key', value: 'z' });
		const result = serializeForShare(state);
		expect(result.l[0].a).toEqual({ KeyA: { t: 'k', v: 'z' } });
	});

	it('layer-1 では transparent 以外が差分に含まれる', () => {
		const state = createDefaultState();
		const layer1Actions = new Map<string, KeyAction>();
		layer1Actions.set('KeyA', { type: 'transparent' });
		layer1Actions.set('KeyB', { type: 'key', value: 'j' });
		layer1Actions.set('FnKey', { type: 'no-op' });
		state.layers.push({ name: 'nav', actions: layer1Actions });

		const result = serializeForShare(state);
		expect(result.l).toHaveLength(2);
		expect(result.l[1].n).toBe('nav');
		// transparent は差分に含まれない
		expect(result.l[1].a).toEqual({
			KeyB: { t: 'k', v: 'j' },
			FnKey: { t: 'x' }
		});
	});

	it('jisToUsRemap が true のときだけ j フィールドが含まれる', () => {
		const state = createDefaultState();
		state.jisToUsRemap = true;
		const result = serializeForShare(state);
		expect(result.j).toBe(true);

		state.jisToUsRemap = false;
		const result2 = serializeForShare(state);
		expect(result2.j).toBeUndefined();
	});

	it('tappingTerm がデフォルトと異なるときだけ tt が含まれる', () => {
		const state = createDefaultState();
		state.tappingTerm = 300;
		const result = serializeForShare(state);
		expect(result.tt).toBe(300);

		state.tappingTerm = TAP_HOLD_DEFAULT_TIMEOUT;
		const result2 = serializeForShare(state);
		expect(result2.tt).toBeUndefined();
	});
});

// =============================================================================
// deserializeFromShare
// =============================================================================

describe('deserializeFromShare', () => {
	it('デフォルトの ShareData からベースレイヤを復元できる', () => {
		const data: ShareData = {
			v: 1,
			t: 'ansi-104',
			l: [{ n: BASE_LAYER_NAME, a: {} }]
		};
		const state = deserializeFromShare(data);
		expect(state.template.id).toBe('ansi-104');
		expect(state.layers).toHaveLength(1);
		expect(state.layers[0].name).toBe(BASE_LAYER_NAME);
		expect(state.jisToUsRemap).toBe(false);
		expect(state.tappingTerm).toBe(TAP_HOLD_DEFAULT_TIMEOUT);
	});

	it('差分が正しく適用される', () => {
		const data: ShareData = {
			v: 1,
			t: 'ansi-104',
			l: [{ n: BASE_LAYER_NAME, a: { KeyA: { t: 'k', v: 'z' } } }]
		};
		const state = deserializeFromShare(data);
		const keyAAction = state.layers[0].actions.get('KeyA');
		expect(keyAAction).toEqual({ type: 'key', value: 'z' });
	});

	it('jisToUsRemap と tappingTerm が復元される', () => {
		const data: ShareData = {
			v: 1,
			t: 'ansi-104',
			l: [{ n: BASE_LAYER_NAME, a: {} }],
			j: true,
			tt: 300
		};
		const state = deserializeFromShare(data);
		expect(state.jisToUsRemap).toBe(true);
		expect(state.tappingTerm).toBe(300);
	});

	it('存在しないテンプレートでエラーが発生する', () => {
		const data: ShareData = {
			v: 1,
			t: 'nonexistent-template',
			l: [{ n: BASE_LAYER_NAME, a: {} }]
		};
		expect(() => deserializeFromShare(data)).toThrow('Template not found');
	});
});

// =============================================================================
// serializeForShare ↔ deserializeFromShare ラウンドトリップ
// =============================================================================

describe('serializeForShare / deserializeFromShare roundtrip', () => {
	it('カスタマイズ済みの設定をラウンドトリップできる', () => {
		const state = createDefaultState();
		// layer-0 にカスタマイズを追加
		state.layers[0].actions.set('KeyA', { type: 'key', value: 'z' });
		state.layers[0].actions.set('KeyB', {
			type: 'tap-hold',
			variant: 'tap-hold',
			tapTimeout: 200,
			holdTimeout: 200,
			tapAction: { type: 'key', value: 'b' },
			holdAction: { type: 'layer-while-held', layer: 'nav' }
		});
		state.jisToUsRemap = true;
		state.tappingTerm = 250;

		// layer-1 を追加
		const layer1Actions = new Map<string, KeyAction>();
		layer1Actions.set('KeyA', { type: 'key', value: 'h' });
		layer1Actions.set('KeyB', { type: 'transparent' });
		layer1Actions.set('FnKey', { type: 'transparent' });
		state.layers.push({ name: 'nav', actions: layer1Actions });

		const shared = serializeForShare(state);
		const restored = deserializeFromShare(shared);

		// テンプレートが ANSI-104 として復元される（実際のテンプレートキー数はテスト用の3ではなく104）
		// なので、カスタマイズしたキーの値だけを比較
		expect(restored.jisToUsRemap).toBe(true);
		expect(restored.tappingTerm).toBe(250);
		expect(restored.layers).toHaveLength(2);
		expect(restored.layers[0].name).toBe(BASE_LAYER_NAME);
		expect(restored.layers[1].name).toBe('nav');

		// layer-0: カスタマイズしたキーが復元される
		const keyA = restored.layers[0].actions.get('KeyA');
		expect(keyA).toEqual({ type: 'key', value: 'z' });
		const keyB = restored.layers[0].actions.get('KeyB');
		expect(keyB).toEqual({
			type: 'tap-hold',
			variant: 'tap-hold',
			tapTimeout: 200,
			holdTimeout: 200,
			tapAction: { type: 'key', value: 'b' },
			holdAction: { type: 'layer-while-held', layer: 'nav' }
		});

		// layer-1: カスタマイズしたキーが復元される
		const navKeyA = restored.layers[1].actions.get('KeyA');
		expect(navKeyA).toEqual({ type: 'key', value: 'h' });
		// layer-1 のデフォルトは transparent
		const navKeyB = restored.layers[1].actions.get('KeyB');
		expect(navKeyB).toEqual({ type: 'transparent' });
	});
});

// =============================================================================
// createImportSummary
// =============================================================================

describe('createImportSummary', () => {
	it('基本的なサマリ情報を返す', () => {
		const data: ShareData = {
			v: 1,
			t: 'ansi-104',
			l: [
				{ n: BASE_LAYER_NAME, a: { KeyA: { t: 'k', v: 'z' }, KeyB: { t: 'x' } } },
				{ n: 'nav', a: { KeyA: { t: 'k', v: 'h' } } }
			]
		};
		const summary = createImportSummary(data);
		expect(summary.templateName).toBe('104(ANSI)');
		expect(summary.layerCount).toBe(2);
		expect(summary.changedKeyCount).toBe(3);
		expect(summary.changedSettingsCount).toBe(0);
		expect(summary.currentTemplateName).toBeUndefined();
	});

	it('テンプレート不一致の場合に currentTemplateName が設定される', () => {
		const data: ShareData = {
			v: 1,
			t: 'ansi-104',
			l: [{ n: BASE_LAYER_NAME, a: {} }]
		};
		const summary = createImportSummary(data, 'JIS109');
		expect(summary.currentTemplateName).toBe('JIS109');
	});

	it('同一テンプレート名の場合は currentTemplateName なし', () => {
		const data: ShareData = {
			v: 1,
			t: 'ansi-104',
			l: [{ n: BASE_LAYER_NAME, a: {} }]
		};
		const summary = createImportSummary(data, '104(ANSI)');
		expect(summary.currentTemplateName).toBeUndefined();
	});

	it('jisToUsRemap が true の場合 changedSettingsCount が 1', () => {
		const data: ShareData = {
			v: 1,
			t: 'jis-109',
			l: [{ n: BASE_LAYER_NAME, a: {} }],
			j: true
		};
		const summary = createImportSummary(data);
		expect(summary.changedSettingsCount).toBe(1);
	});

	it('tappingTerm が設定されている場合 changedSettingsCount が 1', () => {
		const data: ShareData = {
			v: 1,
			t: 'ansi-104',
			l: [{ n: BASE_LAYER_NAME, a: {} }],
			tt: 300
		};
		const summary = createImportSummary(data);
		expect(summary.changedSettingsCount).toBe(1);
	});

	it('jisToUsRemap と tappingTerm 両方の場合 changedSettingsCount が 2', () => {
		const data: ShareData = {
			v: 1,
			t: 'jis-109',
			l: [{ n: BASE_LAYER_NAME, a: {} }],
			j: true,
			tt: 150
		};
		const summary = createImportSummary(data);
		expect(summary.changedSettingsCount).toBe(2);
	});
});
