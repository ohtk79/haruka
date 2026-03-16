import { describe, it, expect } from 'vitest';
import { generateKeJson } from '$lib/services/ke-generator';
import type { KeManipulator, KeRule } from '$lib/services/ke-generator';
import { JIS_109_TEMPLATE } from '$lib/templates/jis109';
import { ANSI_104_TEMPLATE } from '$lib/templates/ansi104';
import type { EditorState, Layer, KeyAction } from '$lib/models/types';
import { BASE_LAYER_NAME } from '$lib/models/constants';
import { JIS_TO_US_MAPPINGS } from '$lib/models/jis-us-map';

// =============================================================================
// Test Helpers
// =============================================================================

function createBaseLayer(): Layer {
	const actions = new Map<string, KeyAction>();
	for (const key of JIS_109_TEMPLATE.keys) {
		if (!key.kanataName) continue;
		actions.set(key.id, { type: 'key', value: key.kanataName });
	}
	return { name: BASE_LAYER_NAME, actions };
}

function createTransparentLayer(name: string): Layer {
	const actions = new Map<string, KeyAction>();
	for (const key of JIS_109_TEMPLATE.keys) {
		actions.set(key.id, { type: 'transparent' });
	}
	return { name, actions };
}

function createState(overrides?: Partial<EditorState>): EditorState {
	return {
		template: JIS_109_TEMPLATE,
		layers: [createBaseLayer()],
		selectedKeyId: null,
		activeLayerIndex: 0,
		jisToUsRemap: false,
		tappingTerm: 200,
		...overrides
	};
}

function findRule(rules: KeRule[], layerName: string, keyName: string): KeRule | undefined {
	return rules.find((r) => r.description === `haruka: ${layerName} - ${keyName}`);
}

function getManipulator(rule: KeRule): KeManipulator {
	return rule.manipulators[0];
}

// =============================================================================
// Tests
// =============================================================================

describe('ke-generator', () => {
	describe('top-level structure', () => {
		it('generates correct title with template name', () => {
			const state = createState();
			const result = generateKeJson(state);
			expect(result.json.title).toBe(`haruka: ${JIS_109_TEMPLATE.name}`);
		});

		it('generates no rules for default (all-passthrough) state', () => {
			const state = createState();
			const result = generateKeJson(state);
			expect(result.json.rules).toHaveLength(0);
		});
	});

	describe('Pattern A: simple key remap (no modifiers)', () => {
		it('generates a rule for customized key in base layer', () => {
			const state = createState();
			state.layers[0].actions.set('KeyA', { type: 'key', value: 'b' });

			const result = generateKeJson(state);
			const rule = findRule(result.json.rules, BASE_LAYER_NAME, 'a');
			expect(rule).toBeDefined();

			const m = getManipulator(rule!);
			expect(m.from.key_code).toBe('a');
			expect(m.from.modifiers).toEqual({ optional: ['any'] });
			expect(m.to).toEqual([{ key_code: 'b' }]);
			expect(m.conditions).toBeUndefined();
		});
	});

	describe('Pattern B: key with modifiers', () => {
		it('generates modifiers in to event', () => {
			const state = createState();
			state.layers[0].actions.set('KeyA', {
				type: 'key',
				value: 'c',
				modifiers: ['lctl', 'lsft']
			});

			const result = generateKeJson(state);
			const rule = findRule(result.json.rules, BASE_LAYER_NAME, 'a');
			expect(rule).toBeDefined();

			const m = getManipulator(rule!);
			expect(m.to).toEqual([{ key_code: 'c', modifiers: ['left_control', 'left_shift'] }]);
		});
	});

	describe('Pattern C: tap-hold with hold=key', () => {
		it('generates to_if_alone and to_if_held_down', () => {
			const state = createState();
			state.layers[0].actions.set('KeyA', {
				type: 'tap-hold',
				variant: 'tap-hold',
				tapTimeout: 200,
				holdTimeout: 200,
				tapAction: { type: 'key', value: 'a' },
				holdAction: { type: 'key', value: 'b' }
			});

			const result = generateKeJson(state);
			const rule = findRule(result.json.rules, BASE_LAYER_NAME, 'a');
			expect(rule).toBeDefined();

			const m = getManipulator(rule!);
			expect(m.to_if_alone).toEqual([{ key_code: 'a' }]);
			expect(m.to_if_held_down).toEqual([{ key_code: 'b' }]);
			expect(m.parameters).toEqual({
				'basic.to_if_alone_timeout_milliseconds': 200,
				'basic.to_if_held_down_threshold_milliseconds': 200
			});
		});
	});

	describe('Pattern D: tap-hold with hold=layer-while-held', () => {
		it('generates to (set_variable) + to_after_key_up (reset) + to_if_alone', () => {
			const state = createState();
			const navLayer = createTransparentLayer('nav');
			state.layers.push(navLayer);

			state.layers[0].actions.set('Space', {
				type: 'tap-hold',
				variant: 'tap-hold-press',
				tapTimeout: 200,
				holdTimeout: 200,
				tapAction: { type: 'key', value: 'spc' },
				holdAction: { type: 'layer-while-held', layer: 'nav' }
			});

			const result = generateKeJson(state);
			const rule = findRule(result.json.rules, BASE_LAYER_NAME, 'spc');
			expect(rule).toBeDefined();

			const m = getManipulator(rule!);
			expect(m.to).toEqual([
				{ set_variable: { name: 'haruka_layer', value: 'nav' } }
			]);
			expect(m.to_after_key_up).toEqual([
				{ set_variable: { name: 'haruka_layer', value: BASE_LAYER_NAME } }
			]);
			expect(m.to_if_alone).toEqual([{ key_code: 'spacebar' }]);
		});
	});

	describe('Pattern E: tap-hold with hold=layer-switch', () => {
		it('generates to_if_held_down (set_variable) + to_if_alone', () => {
			const state = createState();
			const gamingLayer = createTransparentLayer('gaming');
			state.layers.push(gamingLayer);

			state.layers[0].actions.set('KeyA', {
				type: 'tap-hold',
				variant: 'tap-hold-release',
				tapTimeout: 200,
				holdTimeout: 200,
				tapAction: { type: 'key', value: 'a' },
				holdAction: { type: 'layer-switch', layer: 'gaming' }
			});

			const result = generateKeJson(state);
			const rule = findRule(result.json.rules, BASE_LAYER_NAME, 'a');
			expect(rule).toBeDefined();

			const m = getManipulator(rule!);
			expect(m.to_if_alone).toEqual([{ key_code: 'a' }]);
			expect(m.to_if_held_down).toEqual([
				{ set_variable: { name: 'haruka_layer', value: 'gaming' } }
			]);
		});
	});

	describe('Pattern F: non-base layer with variable_if condition', () => {
		it('adds variable_if condition for non-base layer rules', () => {
			const state = createState();
			const navLayer = createTransparentLayer('nav');
			navLayer.actions.set('KeyJ', { type: 'key', value: 'down' });
			state.layers.push(navLayer);

			const result = generateKeJson(state);
			const rule = findRule(result.json.rules, 'nav', 'j');
			expect(rule).toBeDefined();

			const m = getManipulator(rule!);
			expect(m.conditions).toEqual([
				{ type: 'variable_if', name: 'haruka_layer', value: 'nav' }
			]);
			expect(m.to).toEqual([{ key_code: 'down_arrow' }]);
		});
	});

	describe('Pattern G: no-op', () => {
		it('generates to=[vk_none] for no-op', () => {
			const state = createState();
			state.layers[0].actions.set('KeyA', { type: 'no-op' });

			const result = generateKeJson(state);
			const rule = findRule(result.json.rules, BASE_LAYER_NAME, 'a');
			expect(rule).toBeDefined();

			const m = getManipulator(rule!);
			expect(m.to).toEqual([{ key_code: 'vk_none' }]);
		});
	});

	describe('rule ordering', () => {
		it('non-base layer rules come before base layer rules', () => {
			const state = createState();
			const navLayer = createTransparentLayer('nav');
			navLayer.actions.set('KeyJ', { type: 'key', value: 'down' });
			state.layers.push(navLayer);

			// Also customize base
			state.layers[0].actions.set('KeyA', { type: 'key', value: 'b' });

			const result = generateKeJson(state);
			const navRuleIdx = result.json.rules.findIndex((r) =>
				r.description.startsWith('haruka: nav')
			);
			const baseRuleIdx = result.json.rules.findIndex((r) =>
				r.description.startsWith(`haruka: ${BASE_LAYER_NAME}`)
			);

			expect(navRuleIdx).toBeLessThan(baseRuleIdx);
		});

		it('non-base layers are sorted alphabetically', () => {
			const state = createState();
			const navLayer = createTransparentLayer('nav');
			navLayer.actions.set('KeyJ', { type: 'key', value: 'down' });
			const alphaLayer = createTransparentLayer('alpha');
			alphaLayer.actions.set('KeyK', { type: 'key', value: 'up' });
			state.layers.push(navLayer, alphaLayer);

			const result = generateKeJson(state);
			const alphaIdx = result.json.rules.findIndex((r) =>
				r.description.startsWith('haruka: alpha')
			);
			const navIdx = result.json.rules.findIndex((r) =>
				r.description.startsWith('haruka: nav')
			);

			expect(alphaIdx).toBeLessThan(navIdx);
		});
	});

	describe('transparent handling', () => {
		it('skips transparent actions in non-base layers', () => {
			const state = createState();
			const navLayer = createTransparentLayer('nav');
			// All keys are transparent
			state.layers.push(navLayer);

			const result = generateKeJson(state);
			const navRules = result.json.rules.filter((r) =>
				r.description.startsWith('haruka: nav')
			);
			expect(navRules).toHaveLength(0);
		});
	});

	describe('media key skipping', () => {
		it('skips media keys and reports them', () => {
			const state = createState();
			// Add a media key to template and customize it
			const mediaKey = {
				id: 'MediaPlayPause',
				label: 'Play',
				kanataName: 'pp',
				x: 0,
				y: 10,
				width: 1,
				height: 1
			};
			state.template = { ...state.template, keys: [...state.template.keys, mediaKey] };
			state.layers[0].actions.set('MediaPlayPause', { type: 'key', value: 'spc' });

			const result = generateKeJson(state);
			expect(result.skippedMediaKeys).toContain('pp');
			// Should not have a rule for media key
			const mediaRule = findRule(result.json.rules, BASE_LAYER_NAME, 'pp');
			expect(mediaRule).toBeUndefined();
		});
	});

	describe('henk/mhnk from/to distinction', () => {
		it('uses japanese_pc_xfer as from and japanese_kana as to for henk', () => {
			const state = createState();
			// Remap a different key to output henk
			state.layers[0].actions.set('KeyA', { type: 'key', value: 'henk' });

			const result = generateKeJson(state);
			const rule = findRule(result.json.rules, BASE_LAYER_NAME, 'a');
			expect(rule).toBeDefined();

			const m = getManipulator(rule!);
			expect(m.from.key_code).toBe('a');
			// When the to value is 'henk', getKeToKeyCode returns 'japanese_kana'
			expect(m.to).toEqual([{ key_code: 'japanese_kana' }]);
		});

		it('uses japanese_pc_xfer for from when henk is the source key', () => {
			const state = createState();
			// Remap henk (Convert) to a different key
			state.layers[0].actions.set('Convert', { type: 'key', value: 'spc' });

			const result = generateKeJson(state);
			const rule = findRule(result.json.rules, BASE_LAYER_NAME, 'henk');
			expect(rule).toBeDefined();

			const m = getManipulator(rule!);
			expect(m.from.key_code).toBe('japanese_pc_xfer');
			expect(m.to).toEqual([{ key_code: 'spacebar' }]);
		});
	});

	describe('KE timeout parameters', () => {
		it('uses custom timeout values from state', () => {
			const state = createState({
				tappingTerm: 2000
			});
			state.layers[0].actions.set('KeyA', {
				type: 'tap-hold',
				variant: 'tap-hold',
				tapTimeout: 200,
				holdTimeout: 200,
				tapAction: { type: 'key', value: 'a' },
				holdAction: { type: 'key', value: 'b' }
			});

			const result = generateKeJson(state);
			const rule = findRule(result.json.rules, BASE_LAYER_NAME, 'a');
			const m = getManipulator(rule!);

			expect(m.parameters).toEqual({
				'basic.to_if_alone_timeout_milliseconds': 2000,
				'basic.to_if_held_down_threshold_milliseconds': 2000
			});
		});
	});

	describe('default key skipping', () => {
		it('does not generate rules for default key actions in base layer', () => {
			const state = createState();
			// All keys are default -> no rules
			const result = generateKeJson(state);
			expect(result.json.rules).toHaveLength(0);
		});
	});
});

// =============================================================================
// ANSI 104 Template Tests
// =============================================================================

function createAnsiBaseLayer(): Layer {
	const actions = new Map<string, KeyAction>();
	for (const key of ANSI_104_TEMPLATE.keys) {
		if (!key.kanataName) continue;
		actions.set(key.id, { type: 'key', value: key.kanataName });
	}
	return { name: BASE_LAYER_NAME, actions };
}

function createAnsiState(overrides?: Partial<EditorState>): EditorState {
	return {
		template: ANSI_104_TEMPLATE,
		layers: [createAnsiBaseLayer()],
		selectedKeyId: null,
		activeLayerIndex: 0,
		jisToUsRemap: false,
		tappingTerm: 200,
		...overrides
	};
}

describe('ke-generator: ANSI 104 template', () => {
	it('generates correct title with 104(ANSI) template name', () => {
		const state = createAnsiState();
		const result = generateKeJson(state);
		expect(result.json.title).toBe('haruka: 104(ANSI)');
	});

	it('generates no rules for default (all-passthrough) state', () => {
		const state = createAnsiState();
		const result = generateKeJson(state);
		expect(result.json.rules).toHaveLength(0);
	});

	it('has no skipped media keys', () => {
		const state = createAnsiState();
		const result = generateKeJson(state);
		expect(result.skippedMediaKeys).toHaveLength(0);
	});

	it('generates correct from/to mapping for customized ANSI key', () => {
		const state = createAnsiState();
		state.layers[0].actions.set('KeyA', { type: 'key', value: 'b' });

		const result = generateKeJson(state);
		const rule = findRule(result.json.rules, BASE_LAYER_NAME, 'a');
		expect(rule).toBeDefined();

		const m = getManipulator(rule!);
		expect(m.from.key_code).toBe('a');
		expect(m.to).toEqual([{ key_code: 'b' }]);
	});
});

// =============================================================================
// JIS→US KE ルール生成テスト
// =============================================================================

describe('ke-generator: JIS→US KE rules', () => {
	/** JIS→USルールを含む description にマッチするヘルパー */
	function findJisUsRule(rules: KeRule[], aliasName: string): KeRule | undefined {
		return rules.find((r) => r.description === `haruka: ${BASE_LAYER_NAME} - ${aliasName}`);
	}

	// KE-JUS-001: jisToUsRemap=true, 全キーデフォルト → 16個のJIS→USルール生成
	it('generates 16 JIS→US rules when jisToUsRemap=true and all keys default', () => {
		const state = createState({ jisToUsRemap: true });
		const result = generateKeJson(state);

		const jusRules = result.json.rules.filter((r) =>
			r.description.includes('jus-')
		);
		expect(jusRules).toHaveLength(16);
	});

	// KE-JUS-002: 各JIS→USルールが2 manipulatorsを持つ
	it('each JIS→US rule has exactly 2 manipulators', () => {
		const state = createState({ jisToUsRemap: true });
		const result = generateKeJson(state);

		const jusRules = result.json.rules.filter((r) =>
			r.description.includes('jus-')
		);
		for (const rule of jusRules) {
			expect(rule.manipulators).toHaveLength(2);
		}
	});

	// KE-JUS-003: Shift manipulatorのfrom.modifiers.mandatoryに["shift"]が含まれる
	it('shift manipulator has mandatory: ["shift"] in from.modifiers', () => {
		const state = createState({ jisToUsRemap: true });
		const result = generateKeJson(state);

		const jusRules = result.json.rules.filter((r) =>
			r.description.includes('jus-')
		);
		for (const rule of jusRules) {
			const shiftManipulator = rule.manipulators[0];
			expect(shiftManipulator.from.modifiers?.mandatory).toEqual(['shift']);
			expect(shiftManipulator.from.modifiers?.optional).toEqual(['any']);
		}
	});

	// KE-JUS-004: Shift manipulatorがNon-Shift manipulatorより先に配置
	it('shift manipulator is placed before non-shift manipulator', () => {
		const state = createState({ jisToUsRemap: true });
		const result = generateKeJson(state);

		const jusRules = result.json.rules.filter((r) =>
			r.description.includes('jus-')
		);
		for (const rule of jusRules) {
			// index 0 = shift (has mandatory), index 1 = non-shift (no mandatory)
			expect(rule.manipulators[0].from.modifiers?.mandatory).toEqual(['shift']);
			expect(rule.manipulators[1].from.modifiers?.mandatory).toBeUndefined();
		}
	});

	// KE-JUS-005: 2キーのShift → open_bracket（@相当）
	it('key "2" shift produces to: [{ key_code: "open_bracket" }]', () => {
		const state = createState({ jisToUsRemap: true });
		const result = generateKeJson(state);

		const rule = findJisUsRule(result.json.rules, 'jus-2');
		expect(rule).toBeDefined();

		const shiftManipulator = rule!.manipulators[0];
		expect(shiftManipulator.to).toEqual([{ key_code: 'open_bracket' }]);

		const normalManipulator = rule!.manipulators[1];
		expect(normalManipulator.to).toEqual([{ key_code: '2' }]);
	});

	// KE-JUS-006: grvキーのNormal → open_bracket + left_shift（`相当）
	it('key "grv" normal produces to: [{ key_code: "open_bracket", modifiers: ["left_shift"] }]', () => {
		const state = createState({ jisToUsRemap: true });
		const result = generateKeJson(state);

		const rule = findJisUsRule(result.json.rules, 'jus-grv');
		expect(rule).toBeDefined();

		const normalManipulator = rule!.manipulators[1];
		expect(normalManipulator.to).toEqual([
			{ key_code: 'open_bracket', modifiers: ['left_shift'] }
		]);

		const shiftManipulator = rule!.manipulators[0];
		expect(shiftManipulator.to).toEqual([
			{ key_code: 'equal_sign', modifiers: ['left_shift'] }
		]);
	});

	// KE-JUS-007: jisToUsRemap=false → JIS→USルールが0件
	it('generates no JIS→US rules when jisToUsRemap=false', () => {
		const state = createState({ jisToUsRemap: false });
		const result = generateKeJson(state);

		const jusRules = result.json.rules.filter((r) =>
			r.description.includes('jus-')
		);
		expect(jusRules).toHaveLength(0);
	});

	// KE-JUS-008: カスタマイズ済みキーは通常のbuildManipulatorで処理
	it('customized JIS→US target key uses buildManipulator instead of JIS→US rule', () => {
		const state = createState({ jisToUsRemap: true });
		// 2キーをカスタムアクション（key→a）に設定
		state.layers[0].actions.set('Digit2', { type: 'key', value: 'a' });

		const result = generateKeJson(state);

		// JIS→USルールは15件（2キーが除外）
		const jusRules = result.json.rules.filter((r) =>
			r.description.includes('jus-')
		);
		expect(jusRules).toHaveLength(15);

		// jus-2 ルールは存在しない
		const jus2 = findJisUsRule(result.json.rules, 'jus-2');
		expect(jus2).toBeUndefined();

		// 代わりに通常のベースレイヤールールとして2キーが存在
		const customRule = findRule(result.json.rules, BASE_LAYER_NAME, '2');
		expect(customRule).toBeDefined();
		expect(customRule!.manipulators[0].to).toEqual([{ key_code: 'a' }]);
	});

	// KE-JUS-009: JIS→USルール + 非ベースレイヤールールの共存・順序
	it('JIS→US rules are placed after non-base layer rules and before base custom rules', () => {
		const state = createState({ jisToUsRemap: true });
		const navLayer = createTransparentLayer('nav');
		navLayer.actions.set('KeyJ', { type: 'key', value: 'down' });
		state.layers.push(navLayer);

		// ベースレイヤーでaキーをカスタマイズ
		state.layers[0].actions.set('KeyA', { type: 'key', value: 'b' });

		const result = generateKeJson(state);

		// 非ベースレイヤールールのインデックス
		const navRuleIdx = result.json.rules.findIndex((r) =>
			r.description.startsWith('haruka: nav')
		);
		// JIS→USルールの最初のインデックス
		const firstJusIdx = result.json.rules.findIndex((r) =>
			r.description.includes('jus-')
		);
		// ベースレイヤーカスタムルールのインデックス
		const baseCustomIdx = result.json.rules.findIndex((r) =>
			r.description === `haruka: ${BASE_LAYER_NAME} - a`
		);

		expect(navRuleIdx).toBeLessThan(firstJusIdx);
		expect(firstJusIdx).toBeLessThan(baseCustomIdx);
	});

	// KE-JUS-010: ¥/roキーのShift → international3 + left_shift
	it('¥ and ro keys shift produce to: [{ key_code: "international3", modifiers: ["left_shift"] }]', () => {
		const state = createState({ jisToUsRemap: true });
		const result = generateKeJson(state);

		// ¥キー
		const yenRule = findJisUsRule(result.json.rules, 'jus-yen');
		expect(yenRule).toBeDefined();
		expect(yenRule!.manipulators[0].to).toEqual([
			{ key_code: 'international3', modifiers: ['left_shift'] }
		]);
		expect(yenRule!.manipulators[1].to).toEqual([
			{ key_code: 'international1' }
		]);

		// roキー
		const roRule = findJisUsRule(result.json.rules, 'jus-ro');
		expect(roRule).toBeDefined();
		expect(roRule!.manipulators[0].to).toEqual([
			{ key_code: 'international3', modifiers: ['left_shift'] }
		]);
		expect(roRule!.manipulators[1].to).toEqual([
			{ key_code: 'international1' }
		]);
	});

	// =========================================================================
	// リマップキーへの JIS→US 変換適用テスト (013-fix-jis-us-remap)
	// =========================================================================

	/** リマップされた JIS→US ルールを description から検索するヘルパー */
	function findJisUsRemapRule(rules: KeRule[], aliasName: string, sourceKeyName: string): KeRule | undefined {
		return rules.find((r) => r.description === `haruka: ${BASE_LAYER_NAME} - ${aliasName} (${sourceKeyName})`);
	}

	// KE-JR-001: A→2 リマップで JIS→US ルールが from.key_code="a" で生成される
	it('generates JIS→US remap rule with from.key_code="a" when KeyA is remapped to 2', () => {
		const state = createState({ jisToUsRemap: true });
		state.layers[0].actions.set('KeyA', { type: 'key', value: '2' });
		const result = generateKeJson(state);

		// リマップ元 KeyA に対する JIS→US ルールが生成される
		const remapRule = findJisUsRemapRule(result.json.rules, 'jus-2', 'a');
		expect(remapRule).toBeDefined();
		expect(remapRule!.manipulators[0].from.key_code).toBe('a');
		expect(remapRule!.manipulators[0].from.modifiers).toEqual({ mandatory: ['shift'], optional: ['any'] });

		// 物理キー Digit2 の JIS→US ルールも残っている
		const physicalRule = findJisUsRule(result.json.rules, 'jus-2');
		expect(physicalRule).toBeDefined();
		expect(physicalRule!.manipulators[0].from.key_code).toBe('2');
	});

	// KE-JR-002: A→B リマップ（非変換対象）で通常のベースレイヤールール生成
	it('generates normal base layer rule for non-JIS-US remap', () => {
		const state = createState({ jisToUsRemap: true });
		state.layers[0].actions.set('KeyA', { type: 'key', value: 'b' });
		const result = generateKeJson(state);

		// 通常のベースレイヤールールとして生成される（description は物理キー名 'a'）
		const customRule = findRule(result.json.rules, BASE_LAYER_NAME, 'a');
		expect(customRule).toBeDefined();
		expect(customRule!.manipulators[0].from.key_code).toBe('a');
		expect(customRule!.manipulators[0].to).toEqual([{ key_code: 'b' }]);
	});

	// KE-JR-003: 物理 2→A リマップで jus-2 ルールが 16→15 に減る
	it('removes JIS→US rule for physical key when remapped away from target', () => {
		const state = createState({ jisToUsRemap: true });
		state.layers[0].actions.set('Digit2', { type: 'key', value: 'a' });
		const result = generateKeJson(state);

		// Digit2 は もう 2 を出力しないので jus-2 ルールなし
		const jus2 = findJisUsRule(result.json.rules, 'jus-2');
		expect(jus2).toBeUndefined();

		// JIS→US ルールは 15 個に減る
		const jusRules = result.json.rules.filter((r) =>
			r.description.includes('jus-')
		);
		expect(jusRules).toHaveLength(15);
	});

	// KE-JR-004: A→2, B→6 の複数リマップで両方に JIS→US ルール生成
	it('generates JIS→US remap rules for multiple remapped keys', () => {
		const state = createState({ jisToUsRemap: true });
		state.layers[0].actions.set('KeyA', { type: 'key', value: '2' });
		state.layers[0].actions.set('KeyB', { type: 'key', value: '6' });
		const result = generateKeJson(state);

		// A→2 リマップの JIS→US ルール
		const remapRuleA = findJisUsRemapRule(result.json.rules, 'jus-2', 'a');
		expect(remapRuleA).toBeDefined();

		// B→6 リマップの JIS→US ルール
		const remapRuleB = findJisUsRemapRule(result.json.rules, 'jus-6', 'b');
		expect(remapRuleB).toBeDefined();

		// 物理キーのルールも残っている
		const physicalRule2 = findJisUsRule(result.json.rules, 'jus-2');
		expect(physicalRule2).toBeDefined();
		const physicalRule6 = findJisUsRule(result.json.rules, 'jus-6');
		expect(physicalRule6).toBeDefined();
	});

	// KE-JR-005: jisToUsRemap=false で A→2 リマップ → 通常のベースレイヤールール
	it('generates normal base layer rule when jisToUsRemap is false', () => {
		const state = createState({ jisToUsRemap: false });
		state.layers[0].actions.set('KeyA', { type: 'key', value: '2' });
		const result = generateKeJson(state);

		// JIS→US ルールは一切なし
		const jusRules = result.json.rules.filter((r) =>
			r.description.includes('jus-')
		);
		expect(jusRules).toHaveLength(0);

		// 通常のルールとして生成（description は物理キー名 'a'）
		const customRule = findRule(result.json.rules, BASE_LAYER_NAME, 'a');
		expect(customRule).toBeDefined();
		expect(customRule!.manipulators[0].to).toEqual([{ key_code: '2' }]);
	});

	// KE-JR-006: 修飾キー付きリマップ（A → Ctrl+2）で通常ベースレイヤールール
	it('generates normal base layer rule for remap with modifiers', () => {
		const state = createState({ jisToUsRemap: true });
		state.layers[0].actions.set('KeyA', { type: 'key', value: '2', modifiers: ['lctl'] });
		const result = generateKeJson(state);

		// 修飾キー付きリマップは JIS→US 変換対象外
		const remapRule = findJisUsRemapRule(result.json.rules, 'jus-2', 'a');
		expect(remapRule).toBeUndefined();

		// 通常のベースレイヤールールとして from.key_code="a" で出力
		const customRules = result.json.rules.filter((r) =>
			r.description === `haruka: ${BASE_LAYER_NAME} - C-2`
			|| r.manipulators.some((m) => m.from.key_code === 'a')
		);
		expect(customRules.length).toBeGreaterThan(0);
	});

	// KE-JR-007: リマップ JIS→US ルールの順序（物理キー → リマップキー）
	it('places remap JIS→US rules after physical JIS→US rules', () => {
		const state = createState({ jisToUsRemap: true });
		state.layers[0].actions.set('KeyA', { type: 'key', value: '2' });
		const result = generateKeJson(state);

		// 物理キーの jus-2 ルール
		const physicalIdx = result.json.rules.findIndex(
			(r) => r.description === `haruka: ${BASE_LAYER_NAME} - jus-2`
		);
		// リマップの jus-2 ルール
		const remapIdx = result.json.rules.findIndex(
			(r) => r.description === `haruka: ${BASE_LAYER_NAME} - jus-2 (a)`
		);

		expect(physicalIdx).toBeGreaterThanOrEqual(0);
		expect(remapIdx).toBeGreaterThanOrEqual(0);
		expect(physicalIdx).toBeLessThan(remapIdx);
	});
});
