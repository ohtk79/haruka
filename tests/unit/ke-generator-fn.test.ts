import { describe, it, expect } from 'vitest';
import { generateKeJson } from '$lib/services/ke-generator';
import type { EditorState, Layer, KeyAction, PhysicalKey, LayoutTemplate } from '$lib/models/types';
import { BASE_LAYER_NAME, TAP_HOLD_DEFAULT_TIMEOUT } from '$lib/models/constants';

// =============================================================================
// Test Helpers — Apple Magic Keyboard JIS 風のミニテンプレート
// =============================================================================

/** Fn キーを含むミニテンプレート（keOnly: true） */
function createTestTemplate(): LayoutTemplate {
	return {
		id: 'test-apple-jis',
		name: 'Test Apple JIS',
		keys: [
			{ id: 'KeyA', label: 'A', kanataName: 'a', x: 0, y: 0, width: 1, height: 1 },
			{ id: 'KeyB', label: 'B', kanataName: 'b', x: 1, y: 0, width: 1, height: 1 },
			{ id: 'Fn', label: 'fn', x: 2, y: 0, width: 1, height: 1 },
		],
		keOnly: true,
	};
}

function createBaseLayer(template: LayoutTemplate): Layer {
	const actions = new Map<string, KeyAction>();
	for (const key of template.keys) {
		if (key.kanataName) {
			actions.set(key.id, { type: 'key', value: key.kanataName });
		} else {
			actions.set(key.id, { type: 'transparent' });
		}
	}
	return { name: BASE_LAYER_NAME, actions };
}

function createState(template: LayoutTemplate, layers: Layer[]): EditorState {
	return {
		template,
		layers,
		selectedKeyId: null,
		activeLayerIndex: 0,
		jisToUsRemap: false,
		tappingTerm: TAP_HOLD_DEFAULT_TIMEOUT,
	};
}

// =============================================================================
// Tests
// =============================================================================

describe('ke-generator — Fn キー対応', () => {
	describe('Fn キーの simple remap', () => {
		it('Fn キーに Left Control を割り当てると from: fn → to: left_control の manipulator が生成される', () => {
			const template = createTestTemplate();
			const baseLayer = createBaseLayer(template);
			// Fn キーに Left Control を割り当て
			baseLayer.actions.set('Fn', { type: 'key', value: 'lctl' });

			const state = createState(template, [baseLayer]);
			const result = generateKeJson(state);

			const fnRule = result.json.rules.find((r) => r.description.includes('Fn'));
			expect(fnRule).toBeDefined();
			expect(fnRule!.manipulators).toHaveLength(1);

			const m = fnRule!.manipulators[0];
			expect(m.from.key_code).toBe('fn');
			expect(m.to).toEqual([{ key_code: 'left_control' }]);
		});

		it('Fn キーに no-op を割り当てると vk_none の manipulator が生成される', () => {
			const template = createTestTemplate();
			const baseLayer = createBaseLayer(template);
			baseLayer.actions.set('Fn', { type: 'no-op' });

			const state = createState(template, [baseLayer]);
			const result = generateKeJson(state);

			const fnRule = result.json.rules.find((r) => r.description.includes('Fn'));
			expect(fnRule).toBeDefined();
			expect(fnRule!.manipulators[0].to).toEqual([{ key_code: 'vk_none' }]);
		});

		it('Fn キーが transparent（デフォルト）のときは manipulator が生成されない', () => {
			const template = createTestTemplate();
			const baseLayer = createBaseLayer(template);
			// Fn はデフォルトで transparent

			const state = createState(template, [baseLayer]);
			const result = generateKeJson(state);

			const fnRule = result.json.rules.find((r) => r.description.includes('Fn'));
			expect(fnRule).toBeUndefined();
		});
	});

	describe('Fn キーの tap-hold', () => {
		it('Fn キーに tap-hold（tap: fn, hold: lctl）を割り当てると正しい manipulator が生成される', () => {
			const template = createTestTemplate();
			const baseLayer = createBaseLayer(template);
			baseLayer.actions.set('Fn', {
				type: 'tap-hold',
				variant: 'tap-hold',
				tapTimeout: TAP_HOLD_DEFAULT_TIMEOUT,
				holdTimeout: TAP_HOLD_DEFAULT_TIMEOUT,
				tapAction: { type: 'key', value: 'fn' },
				holdAction: { type: 'key', value: 'lctl' },
			});

			const state = createState(template, [baseLayer]);
			const result = generateKeJson(state);

			const fnRule = result.json.rules.find((r) => r.description.includes('Fn'));
			expect(fnRule).toBeDefined();

			const m = fnRule!.manipulators[0];
			expect(m.from.key_code).toBe('fn');
			expect(m.to_if_alone).toEqual([{ key_code: 'fn' }]);
			expect(m.to_if_held_down).toEqual([{ key_code: 'left_control' }]);
			expect(m.parameters).toEqual({
				'basic.to_if_alone_timeout_milliseconds': TAP_HOLD_DEFAULT_TIMEOUT,
				'basic.to_if_held_down_threshold_milliseconds': TAP_HOLD_DEFAULT_TIMEOUT,
			});
		});
	});

	describe('Fn キーの非ベースレイヤー', () => {
		it('非ベースレイヤーの Fn キー manipulator に variable_if condition が付与される', () => {
			const template = createTestTemplate();
			const baseLayer = createBaseLayer(template);
			const layer1: Layer = {
				name: 'layer-1',
				actions: new Map([
					['KeyA', { type: 'transparent' }],
					['KeyB', { type: 'transparent' }],
					['Fn', { type: 'key', value: 'lalt' }],
				]),
			};

			const state = createState(template, [baseLayer, layer1]);
			const result = generateKeJson(state);

			const fnRule = result.json.rules.find(
				(r) => r.description.includes('layer-1') && r.description.includes('Fn')
			);
			expect(fnRule).toBeDefined();

			const m = fnRule!.manipulators[0];
			expect(m.from.key_code).toBe('fn');
			expect(m.to).toEqual([{ key_code: 'left_option' }]);
			expect(m.conditions).toEqual([
				{ type: 'variable_if', name: 'haruka_layer', value: 'layer-1' },
			]);
		});
	});

	describe('通常キーとの混合', () => {
		it('kanataName ありのキーと Fn キーが共存するテンプレートで両方の manipulator が正しく生成される', () => {
			const template = createTestTemplate();
			const baseLayer = createBaseLayer(template);
			// A キーを b にリマップ、Fn キーを lctl にリマップ
			baseLayer.actions.set('KeyA', { type: 'key', value: 'b' });
			baseLayer.actions.set('Fn', { type: 'key', value: 'lctl' });

			const state = createState(template, [baseLayer]);
			const result = generateKeJson(state);

			// A キーの manipulator
			const aRule = result.json.rules.find((r) => r.description.includes('a'));
			expect(aRule).toBeDefined();
			expect(aRule!.manipulators[0].from.key_code).toBe('a');
			expect(aRule!.manipulators[0].to).toEqual([{ key_code: 'b' }]);

			// Fn キーの manipulator
			const fnRule = result.json.rules.find((r) => r.description.includes('Fn'));
			expect(fnRule).toBeDefined();
			expect(fnRule!.manipulators[0].from.key_code).toBe('fn');
			expect(fnRule!.manipulators[0].to).toEqual([{ key_code: 'left_control' }]);
		});
	});

	describe('Fn キーの出力先として fn を使用', () => {
		it('通常キーに fn を出力先として割り当てると to: [{key_code: "fn"}] が生成される', () => {
			const template = createTestTemplate();
			const baseLayer = createBaseLayer(template);
			// A キーを fn にリマップ
			baseLayer.actions.set('KeyA', { type: 'key', value: 'fn' });

			const state = createState(template, [baseLayer]);
			const result = generateKeJson(state);

			const aRule = result.json.rules.find((r) => r.description.includes('a'));
			expect(aRule).toBeDefined();
			expect(aRule!.manipulators[0].to).toEqual([{ key_code: 'fn' }]);
		});
	});
});
