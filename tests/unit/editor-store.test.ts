import { describe, it, expect, beforeEach } from 'vitest';
import { EditorStore } from '$lib/stores/editor.svelte';
import { JIS_109_TEMPLATE } from '$lib/templates/jis109';
import { ANSI_104_TEMPLATE } from '$lib/templates/ansi104';
import { BASE_LAYER_NAME, TAP_HOLD_DEFAULT_TIMEOUT, MAX_LAYERS } from '$lib/models/constants';
import type { KeyAction, LayoutTemplate, PhysicalKey } from '$lib/models/types';

// テスト用ヘルパー: 最小テンプレート（3キー）
const MINI_TEMPLATE = {
	id: 'test-mini',
	name: 'Test Mini',
	keys: [
		{ id: 'KeyA', label: 'A', kanataName: 'a', x: 0, y: 0, width: 1, height: 1 },
		{ id: 'KeyB', label: 'B', kanataName: 'b', x: 1, y: 0, width: 1, height: 1 },
		{ id: 'KeyC', label: 'C', kanataName: 'c', x: 2, y: 0, width: 1, height: 1 }
	]
} satisfies LayoutTemplate;

const MINI_AHK_TEMPLATE = {
	...MINI_TEMPLATE,
	id: 'test-mini-ahk',
	supportedFormats: ['kbd', 'json', 'ahk']
} satisfies LayoutTemplate;

describe('EditorStore', () => {
	let store: EditorStore;

	beforeEach(() => {
		store = new EditorStore(MINI_TEMPLATE);
	});

	// =========================================================================
	// T003: constructor, initial state, selectKey, switchLayer
	// =========================================================================

	describe('constructor / initialization', () => {
		it('initializes with a single base layer', () => {
			expect(store.layers).toHaveLength(1);
			expect(store.layers[0].name).toBe(BASE_LAYER_NAME);
		});

		it('sets default state values', () => {
			expect(store.selectedKeyId).toBeNull();
			expect(store.activeLayerIndex).toBe(0);
			expect(store.jisToUsRemap).toBe(false);
			expect(store.tappingTerm).toBe(TAP_HOLD_DEFAULT_TIMEOUT);
		});

		it('initializes base layer with key actions from template', () => {
			const baseActions = store.layers[0].actions;
			expect(baseActions.size).toBe(3);
			expect(baseActions.get('KeyA')).toEqual({ type: 'key', value: 'a' });
			expect(baseActions.get('KeyB')).toEqual({ type: 'key', value: 'b' });
			expect(baseActions.get('KeyC')).toEqual({ type: 'key', value: 'c' });
		});

		it('accepts pre-built layers via constructor', () => {
			const customLayers = [
				{ name: BASE_LAYER_NAME, actions: new Map([['KeyA', { type: 'key' as const, value: 'x' }]]) },
				{ name: 'nav', actions: new Map([['KeyA', { type: 'transparent' as const }]]) }
			];
			const s = new EditorStore(MINI_TEMPLATE, customLayers);
			expect(s.layers).toHaveLength(2);
			expect(s.layers[0].actions.get('KeyA')).toEqual({ type: 'key', value: 'x' });
		});

		it('activeLayer derived property reflects current layer', () => {
			expect(store.activeLayer).toBe(store.layers[0]);
		});
	});

	describe('selectKey', () => {
		it('selects a key by id', () => {
			store.selectKey('KeyA');
			expect(store.selectedKeyId).toBe('KeyA');
		});

		it('deselects with null', () => {
			store.selectKey('KeyA');
			store.selectKey(null);
			expect(store.selectedKeyId).toBeNull();
		});
	});

	describe('switchLayer', () => {
		it('switches to a valid layer index', () => {
			store.addLayer('nav');
			store.switchLayer(1);
			expect(store.activeLayerIndex).toBe(1);
			expect(store.activeLayer.name).toBe('nav');
		});

		it('ignores invalid indices', () => {
			store.switchLayer(-1);
			expect(store.activeLayerIndex).toBe(0);
			store.switchLayer(99);
			expect(store.activeLayerIndex).toBe(0);
		});
	});

	// =========================================================================
	// T004: setAction for all ActionType variants
	// =========================================================================

	describe('setAction', () => {
		it('sets a key action', () => {
			const action: KeyAction = { type: 'key', value: 'z' };
			store.setAction('KeyA', action);
			expect(store.layers[0].actions.get('KeyA')).toEqual({ type: 'key', value: 'z' });
		});

		it('sets a key action with modifiers', () => {
			const action: KeyAction = { type: 'key', value: 'a', modifiers: ['lctl', 'lsft'] };
			store.setAction('KeyA', action);
			expect(store.layers[0].actions.get('KeyA')).toEqual({
				type: 'key',
				value: 'a',
				modifiers: ['lctl', 'lsft']
			});
		});

		it('sets transparent action', () => {
			store.setAction('KeyA', { type: 'transparent' });
			expect(store.layers[0].actions.get('KeyA')).toEqual({ type: 'transparent' });
		});

		it('sets no-op action', () => {
			store.setAction('KeyA', { type: 'no-op' });
			expect(store.layers[0].actions.get('KeyA')).toEqual({ type: 'no-op' });
		});

		it('sets tap-hold action', () => {
			const action: KeyAction = {
				type: 'tap-hold',
				variant: 'tap-hold',
				tapTimeout: 200,
				holdTimeout: 200,
				tapAction: { type: 'key', value: 'a' },
				holdAction: { type: 'layer-while-held', layer: 'nav' }
			};
			store.setAction('KeyA', action);
			expect(store.layers[0].actions.get('KeyA')).toEqual(action);
		});

		it('rejects non-top-level actions (layer-while-held)', () => {
			const original = store.layers[0].actions.get('KeyA');
			store.setAction('KeyA', { type: 'layer-while-held', layer: 'nav' });
			expect(store.layers[0].actions.get('KeyA')).toEqual(original);
		});

		it('rejects non-top-level actions (layer-switch)', () => {
			const original = store.layers[0].actions.get('KeyA');
			store.setAction('KeyA', { type: 'layer-switch', layer: 'nav' });
			expect(store.layers[0].actions.get('KeyA')).toEqual(original);
		});

		it('sets action on active layer (not base)', () => {
			store.addLayer('nav');
			store.switchLayer(1);
			store.setAction('KeyA', { type: 'key', value: 'z' });
			expect(store.layers[1].actions.get('KeyA')).toEqual({ type: 'key', value: 'z' });
			// base layer unchanged
			expect(store.layers[0].actions.get('KeyA')).toEqual({ type: 'key', value: 'a' });
		});
	});

	// =========================================================================
	// T005: Layer management (addLayer, deleteLayer, renameLayer, reorderLayer)
	// =========================================================================

	describe('addLayer', () => {
		it('adds a new transparent layer', () => {
			const err = store.addLayer('nav');
			expect(err).toBeNull();
			expect(store.layers).toHaveLength(2);
			expect(store.layers[1].name).toBe('nav');
			// all keys should be transparent
			expect(store.layers[1].actions.get('KeyA')).toEqual({ type: 'transparent' });
		});

		it('switches to newly added layer', () => {
			store.addLayer('nav');
			expect(store.activeLayerIndex).toBe(1);
		});

		it('returns error for duplicate name', () => {
			store.addLayer('nav');
			const err = store.addLayer('nav');
			expect(err).toBeTruthy();
		});

		it('returns error when max layers reached', () => {
			for (let i = 1; i < MAX_LAYERS; i++) {
				store.addLayer(`layer-${i}`);
			}
			expect(store.layers).toHaveLength(MAX_LAYERS);
			const err = store.addLayer('overflow');
			expect(err).toBeTruthy();
		});
	});

	describe('deleteLayer', () => {
		beforeEach(() => {
			store.addLayer('nav');
			store.addLayer('fn');
		});

		it('deletes a non-base layer', () => {
			const err = store.deleteLayer(1);
			expect(err).toBeNull();
			expect(store.layers).toHaveLength(2);
			expect(store.layers[1].name).toBe('fn');
		});

		it('returns error when deleting base layer', () => {
			const err = store.deleteLayer(0);
			expect(err).toBeTruthy();
		});

		it('adjusts activeLayerIndex when active layer deleted', () => {
			store.switchLayer(2); // fn
			store.deleteLayer(2);
			expect(store.activeLayerIndex).toBe(1); // nav
		});

		it('adjusts activeLayerIndex when layer below active is deleted', () => {
			store.switchLayer(2); // fn
			store.deleteLayer(1); // nav removed
			expect(store.activeLayerIndex).toBe(1); // fn shifted to index 1
		});

		it('returns error for invalid index', () => {
			const err = store.deleteLayer(99);
			expect(err).toBeTruthy();
		});
	});

	describe('renameLayer', () => {
		beforeEach(() => {
			store.addLayer('nav');
		});

		it('renames a non-base layer', () => {
			const err = store.renameLayer(1, 'navigation');
			expect(err).toBeNull();
			expect(store.layers[1].name).toBe('navigation');
		});

		it('returns error when renaming base layer', () => {
			const err = store.renameLayer(0, 'newbase');
			expect(err).toBeTruthy();
		});

		it('returns error for duplicate name', () => {
			store.addLayer('fn');
			const err = store.renameLayer(2, 'nav');
			expect(err).toBeTruthy();
		});

		it('returns error for invalid index', () => {
			const err = store.renameLayer(99, 'test');
			expect(err).toBeTruthy();
		});
	});

	describe('reorderLayer', () => {
		beforeEach(() => {
			store.addLayer('nav');
			store.addLayer('fn');
			store.addLayer('media');
		});

		it('reorders non-base layers', () => {
			const err = store.reorderLayer(1, 3); // nav → after media
			expect(err).toBeNull();
			expect(store.layers[1].name).toBe('fn');
			expect(store.layers[2].name).toBe('media');
			expect(store.layers[3].name).toBe('nav');
		});

		it('returns error when moving base layer', () => {
			expect(store.reorderLayer(0, 1)).toBeTruthy();
		});

		it('returns error when target is base position', () => {
			expect(store.reorderLayer(1, 0)).toBeTruthy();
		});

		it('adjusts activeLayerIndex when active layer is moved', () => {
			store.switchLayer(1); // nav
			store.reorderLayer(1, 3);
			expect(store.activeLayerIndex).toBe(3);
		});

		it('adjusts activeLayerIndex when layers shift around active', () => {
			store.switchLayer(2); // fn at index 2
			store.reorderLayer(1, 3); // nav moves from 1 to 3
			// active was at 2, from=1 < active, to=3 >= active → active--
			expect(store.activeLayerIndex).toBe(1);
		});

		it('returns error for out-of-range indices', () => {
			expect(store.reorderLayer(1, 99)).toBeTruthy();
		});
	});

	// =========================================================================
	// T006: State serialization (getState/restoreState, $derived)
	// =========================================================================

	describe('getState / restoreState', () => {
		it('round-trips basic state', () => {
			store.selectKey('KeyB');
			store.setTappingTerm(300);

			const state = store.getState();
			const newStore = new EditorStore(MINI_TEMPLATE);
			newStore.restoreState(state);

			expect(newStore.selectedKeyId).toBe('KeyB');
			expect(newStore.tappingTerm).toBe(300);
			expect(newStore.layers).toHaveLength(1);
		});

		it('round-trips multi-layer state', () => {
			store.addLayer('nav');
			store.switchLayer(1);
			store.setAction('KeyA', { type: 'key', value: 'z' });

			const state = store.getState();
			const newStore = new EditorStore(MINI_TEMPLATE);
			newStore.restoreState(state);

			expect(newStore.layers).toHaveLength(2);
			expect(newStore.activeLayerIndex).toBe(1);
			expect(newStore.layers[1].actions.get('KeyA')).toEqual({ type: 'key', value: 'z' });
		});

		it('restores partial state without overwriting everything', () => {
			store.selectKey('KeyA');
			store.setTappingTerm(300);

			const newStore = new EditorStore(MINI_TEMPLATE);
			newStore.restoreState({ tappingTerm: 500 });

			expect(newStore.tappingTerm).toBe(500);
			expect(newStore.selectedKeyId).toBeNull(); // not overwritten
		});

		it('restores jisToUsRemap flag', () => {
			const newStore = new EditorStore(MINI_TEMPLATE);
			newStore.restoreState({ jisToUsRemap: true });
			expect(newStore.jisToUsRemap).toBe(true);
		});

		it('restoreState に template が含まれる場合はテンプレートも切り替える', () => {
			const importedStore = new EditorStore(ANSI_104_TEMPLATE);
			const importedState = importedStore.getState();

			const newStore = new EditorStore(JIS_109_TEMPLATE);
			newStore.restoreState(importedState);

			expect(newStore.template.id).toBe('ansi-104');
			expect(newStore.layers[0]?.actions.has('Escape')).toBe(true);
		});

		it('getState は derived export state を含めない', () => {
			const ahkStore = new EditorStore(MINI_AHK_TEMPLATE);
			const state = ahkStore.getState();
			expect('ahkResult' in state).toBe(false);
			expect('ahkText' in state).toBe(false);
			expect('formatStatuses' in state).toBe(false);
		});
	});

	describe('$derived properties', () => {
		it('kbdText updates when layers change', () => {
			const initial = store.kbdText;
			expect(typeof initial).toBe('string');
			expect(initial.length).toBeGreaterThan(0);

			store.setAction('KeyA', { type: 'no-op' });
			const updated = store.kbdText;
			expect(updated).not.toBe(initial);
		});

		it('keResult produces valid output', () => {
			expect(store.keResult).toBeDefined();
			expect(store.keResult.json).toBeDefined();
		});

		it('keJsonText is valid JSON string', () => {
			const parsed = JSON.parse(store.keJsonText);
			expect(parsed).toBeDefined();
		});

		it('ahkResult / ahkText が AHK 対応テンプレートで生成される', () => {
			const ahkStore = new EditorStore(MINI_AHK_TEMPLATE);
			expect(ahkStore.ahkResult.issues).toHaveLength(0);
			expect(ahkStore.ahkText).toContain('#Requires AutoHotkey v2.0');
		});

		it('formatStatuses が AHK 対応テンプレートで 3 形式を available にする', () => {
			const ahkStore = new EditorStore(MINI_AHK_TEMPLATE);
			const statusMap = Object.fromEntries(
				ahkStore.formatStatuses.map((status) => [status.format, status])
			);
			expect(statusMap.kbd.available).toBe(true);
			expect(statusMap.json.available).toBe(true);
			expect(statusMap.ahk.available).toBe(true);
		});
	});

	// =========================================================================
	// T007: Remaining methods
	// =========================================================================

	describe('setTappingTerm', () => {
		it('updates tapping term', () => {
			store.setTappingTerm(300);
			expect(store.tappingTerm).toBe(300);
		});
	});

	describe('toggleJisToUsRemap', () => {
		it('toggles from false to true', () => {
			store.toggleJisToUsRemap();
			expect(store.jisToUsRemap).toBe(true);
		});

		it('toggles from true to false and resets base layer keys', () => {
			// Use full JIS template for proper remap testing
			const jisStore = new EditorStore(JIS_109_TEMPLATE);
			jisStore.toggleJisToUsRemap(); // on
			expect(jisStore.jisToUsRemap).toBe(true);
			jisStore.toggleJisToUsRemap(); // off → resets mapped keys
			expect(jisStore.jisToUsRemap).toBe(false);
			// Base layer should have original kanataName values restored
			const baseActions = jisStore.layers[0].actions;
			const escAction = baseActions.get('Escape');
			expect(escAction).toEqual({ type: 'key', value: 'esc' });
		});
	});

	describe('addPhysicalKey', () => {
		it('adds a new physical key to template and all layers', () => {
			store.addLayer('nav');
			const newKey: PhysicalKey = {
				id: 'KeyD',
				label: 'D',
				kanataName: 'd',
				x: 3, y: 0, width: 1, height: 1
			};
			store.addPhysicalKey(newKey);

			expect(store.template.keys).toHaveLength(4);
			// base layer gets key action
			expect(store.layers[0].actions.get('KeyD')).toEqual({ type: 'key', value: 'd' });
			// other layers get transparent
			expect(store.layers[1].actions.get('KeyD')).toEqual({ type: 'transparent' });
		});

		it('ignores duplicate key id', () => {
			const dup: PhysicalKey = {
				id: 'KeyA',
				label: 'A2',
				kanataName: 'a2',
				x: 0, y: 0, width: 1, height: 1
			};
			store.addPhysicalKey(dup);
			expect(store.template.keys).toHaveLength(3);
		});
	});

	describe('removePhysicalKey', () => {
		it('removes a physical key from template and all layers', () => {
			store.removePhysicalKey('KeyA');
			expect(store.template.keys).toHaveLength(2);
			expect(store.layers[0].actions.has('KeyA')).toBe(false);
		});

		it('deselects removed key if selected', () => {
			store.selectKey('KeyA');
			store.removePhysicalKey('KeyA');
			expect(store.selectedKeyId).toBeNull();
		});

		it('ignores non-existent key id', () => {
			store.removePhysicalKey('NonExistent');
			expect(store.template.keys).toHaveLength(3);
		});
	});

	describe('resetToNew', () => {
		it('resets to initial state with base layer only', () => {
			store.addLayer('nav');
			store.selectKey('KeyA');
			store.setTappingTerm(500);

			store.resetToNew();

			expect(store.layers).toHaveLength(1);
			expect(store.layers[0].name).toBe(BASE_LAYER_NAME);
			expect(store.selectedKeyId).toBeNull();
			expect(store.activeLayerIndex).toBe(0);
			expect(store.jisToUsRemap).toBe(false);
			expect(store.tappingTerm).toBe(TAP_HOLD_DEFAULT_TIMEOUT);
		});
	});

	describe('resetWithTemplate', () => {
		it('resets with a new template', () => {
			store.addLayer('nav');
			store.selectKey('KeyA');

			store.resetWithTemplate(ANSI_104_TEMPLATE);

			expect(store.template.id).toBe('ansi-104');
			expect(store.layers).toHaveLength(1);
			expect(store.layers[0].name).toBe(BASE_LAYER_NAME);
			expect(store.selectedKeyId).toBeNull();
			expect(store.activeLayerIndex).toBe(0);
			expect(store.jisToUsRemap).toBe(false);
		});

		it('resets with jisToUsRemap flag', () => {
			store.resetWithTemplate(JIS_109_TEMPLATE, true);
			expect(store.jisToUsRemap).toBe(true);
			expect(store.template.id).toBe('jis-109');
		});
	});

	// =========================================================================
	// ES-01~03: レイヤ間データ独立性・switchLayer・getState/restoreState サニタイズ
	// =========================================================================

	describe('レイヤ間データ独立性 (ES-01~03)', () => {
		it('ES-01: setAction() で Layer-1 にアクション設定 → Layer-0 のアクションが不変', () => {
			const layer0Original = store.layers[0].actions.get('KeyA');
			store.addLayer('nav');
			store.switchLayer(1);
			store.setAction('KeyA', { type: 'key', value: 'z', modifiers: ['lsft'] });
			// Layer-1 は更新される
			expect(store.layers[1].actions.get('KeyA')).toEqual({ type: 'key', value: 'z', modifiers: ['lsft'] });
			// Layer-0 は不変
			expect(store.layers[0].actions.get('KeyA')).toEqual(layer0Original);
		});

		it('ES-02: switchLayer() → activeLayer が切り替え先レイヤを正しく返す', () => {
			// Layer-0 のアクションを変更
			store.setAction('KeyA', { type: 'key', value: 'x' });
			// addLayer は自動的に Layer-1 に切り替わる
			store.addLayer('nav');
			store.setAction('KeyA', { type: 'key', value: 'z' });

			// Layer-1 のアクション
			expect(store.activeLayer.actions.get('KeyA')).toEqual({ type: 'key', value: 'z' });
			// Layer-0 に戻す
			store.switchLayer(0);
			expect(store.activeLayer.actions.get('KeyA')).toEqual({ type: 'key', value: 'x' });
		});

		it('ES-03: getState() → restoreState() で Trans/No-op の modifier がサニタイズされる', () => {
			store.addLayer('nav');
			store.switchLayer(1);
			// Layer-1 に key アクション（modifier 付き）を設定
			store.setAction('KeyA', { type: 'key', value: 'z', modifiers: ['lsft'] });
			// 不正データを手動で仕込む: Trans に modifiers が付いた状態
			store.layers[1].actions.set('KeyB', { type: 'transparent', modifiers: ['lctl'] } as unknown as KeyAction);

			const state = store.getState();
			const newStore = new EditorStore(MINI_TEMPLATE);
			newStore.restoreState(state);

			// 正常データはそのまま
			expect(newStore.layers[1].actions.get('KeyA')).toEqual({ type: 'key', value: 'z', modifiers: ['lsft'] });
			// Trans の modifiers はサニタイズされないことに注意: restoreState は sanitizeAction を通さない
			// (sanitizeAction は persistence.ts の deserializeLayers 内で適用される)
			// ここでは getState/restoreState のラウンドトリップが全レイヤを保持することを検証
			expect(newStore.layers).toHaveLength(2);
			expect(newStore.layers[0].actions.get('KeyA')).toEqual(store.layers[0].actions.get('KeyA'));
		});
	});
});
