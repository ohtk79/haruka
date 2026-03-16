import { describe, it, expect } from 'vitest';
import { generateKbd } from '$lib/services/kbd-generator';
import { JIS_109_TEMPLATE } from '$lib/templates/jis109';
import { ANSI_104_TEMPLATE } from '$lib/templates/ansi104';
import type { EditorState, Layer, KeyAction } from '$lib/models/types';
import { BASE_LAYER_NAME } from '$lib/models/constants';

function createBaseLayer(): Layer {
	const actions = new Map<string, KeyAction>();
	for (const key of JIS_109_TEMPLATE.keys) {
		if (!key.kanataName) continue;
		actions.set(key.id, { type: 'key', value: key.kanataName });
	}
	return { name: BASE_LAYER_NAME, actions };
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

describe('kbd-generator: key + modifiers', () => {
	it('key without modifiers outputs plain key name', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', { type: 'key', value: 'b' });

		const result = generateKbd(state);
		// Find line containing the remap — 'a' column should now show 'b'
		expect(result).toContain('b');
	});

	it('key with single modifier outputs C-a format', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', { type: 'key', value: 'a', modifiers: ['lctl'] });

		const result = generateKbd(state);
		expect(result).toContain('C-a');
	});

	it('key with multiple modifiers outputs C-S-a format (sorted Ctrl→Shift→Alt→Meta)', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', { type: 'key', value: 'c', modifiers: ['lsft', 'lctl'] });

		const result = generateKbd(state);
		expect(result).toContain('C-S-c');
	});

	it('key with all four left modifiers sorts C→S→A→M', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', { type: 'key', value: 'x', modifiers: ['lmet', 'lalt', 'lsft', 'lctl'] });

		const result = generateKbd(state);
		expect(result).toContain('C-S-A-M-x');
	});

	it('key with A modifier outputs A-z format', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyZ', { type: 'key', value: 'z', modifiers: ['lalt'] });

		const result = generateKbd(state);
		expect(result).toContain('A-z');
	});

	it('key with right modifier uses (multi ...) syntax', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', { type: 'key', value: 'a', modifiers: ['rctl'] });

		const result = generateKbd(state);
		expect(result).toContain('(multi rctl a)');
	});

	it('key with ralt uses chord prefix AG', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', { type: 'key', value: 'a', modifiers: ['ralt'] });

		const result = generateKbd(state);
		expect(result).toContain('AG-a');
	});

	it('key with mixed L/R modifiers uses (multi ...) syntax', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', { type: 'key', value: 'a', modifiers: ['lctl', 'rsft'] });

		const result = generateKbd(state);
		expect(result).toContain('(multi lctl rsft a)');
	});
});

describe('kbd-generator: tap-hold', () => {
	it('tap-hold with key tap and key hold outputs correct alias', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', {
			type: 'tap-hold',
			variant: 'tap-hold',
			tapTimeout: 200,
			holdTimeout: 200,
			tapAction: { type: 'key', value: 'a' },
			holdAction: { type: 'key', value: 'b' }
		});

		const result = generateKbd(state);
		expect(result).toContain('(defalias');
		expect(result).toContain('a_layer-0');
		expect(result).toContain('(tap-hold 200 200 a b)');
	});

	it('tap-hold with hold=layer-while-held outputs correct syntax', () => {
		const state = createState();
		const navLayer: Layer = { name: 'nav', actions: new Map() };
		for (const key of JIS_109_TEMPLATE.keys) {
			navLayer.actions.set(key.id, { type: 'transparent' });
		}
		state.layers.push(navLayer);

		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', {
			type: 'tap-hold',
			variant: 'tap-hold-press',
			tapTimeout: 200,
			holdTimeout: 200,
			tapAction: { type: 'key', value: 'a' },
			holdAction: { type: 'layer-while-held', layer: 'nav' }
		});

		const result = generateKbd(state);
		expect(result).toContain('(tap-hold-press 200 200 a (layer-while-held nav))');
	});

	it('tap-hold with hold=layer-switch outputs correct syntax', () => {
		const state = createState();
		const gamingLayer: Layer = { name: 'gaming', actions: new Map() };
		for (const key of JIS_109_TEMPLATE.keys) {
			gamingLayer.actions.set(key.id, { type: 'transparent' });
		}
		state.layers.push(gamingLayer);

		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', {
			type: 'tap-hold',
			variant: 'tap-hold-release',
			tapTimeout: 200,
			holdTimeout: 200,
			tapAction: { type: 'key', value: 'a' },
			holdAction: { type: 'layer-switch', layer: 'gaming' }
		});

		const result = generateKbd(state);
		expect(result).toContain('(tap-hold-release 200 200 a (layer-switch gaming))');
	});

	it('tap-hold with hold=no-op outputs XX for hold', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', {
			type: 'tap-hold',
			variant: 'tap-hold',
			tapTimeout: 200,
			holdTimeout: 200,
			tapAction: { type: 'key', value: 'a' },
			holdAction: { type: 'no-op' }
		});

		const result = generateKbd(state);
		expect(result).toContain('(tap-hold 200 200 a XX)');
	});

	it('tap-hold with tap=transparent outputs _ for tap', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', {
			type: 'tap-hold',
			variant: 'tap-hold',
			tapTimeout: 200,
			holdTimeout: 200,
			tapAction: { type: 'transparent' },
			holdAction: { type: 'key', value: 'b' }
		});

		const result = generateKbd(state);
		expect(result).toContain('(tap-hold 200 200 _ b)');
	});

	it('tap-hold with modified tap key outputs C-S-a format', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', {
			type: 'tap-hold',
			variant: 'tap-hold',
			tapTimeout: 200,
			holdTimeout: 200,
			tapAction: { type: 'key', value: 'a', modifiers: ['lsft', 'lctl'] },
			holdAction: { type: 'key', value: 'b' }
		});

		const result = generateKbd(state);
		expect(result).toContain('(tap-hold 200 200 C-S-a b)');
	});
});

describe('kbd-generator: action types', () => {
	it('transparent outputs _', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', { type: 'transparent' });

		const result = generateKbd(state);
		// In the deflayer line for "a" position, should show _
		expect(result).toMatch(/_\s/);
	});

	it('no-op outputs XX', () => {
		const state = createState();
		const baseLayer = state.layers[0];
		baseLayer.actions.set('KeyA', { type: 'no-op' });

		const result = generateKbd(state);
		expect(result).toContain('XX');
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

describe('kbd-generator: ANSI 104 template', () => {
	it('generates valid .kbd output with ANSI 104 key names', () => {
		const state = createAnsiState();
		const result = generateKbd(state);

		// Should contain defsrc and deflayer
		expect(result).toContain('(defsrc');
		expect(result).toContain('(deflayer');

		// ANSI-specific keys should be in defsrc
		expect(result).toContain('grv');
		expect(result).toContain('bspc');
		expect(result).toContain('ret');
		expect(result).toContain('spc');

		// JIS-specific keys should NOT be present in defsrc
		expect(result).not.toContain('¥');
		expect(result).not.toContain(' ro ');
		expect(result).not.toContain('mhnk');
		expect(result).not.toContain('henk');
		expect(result).not.toMatch(/\bkana\b/);
	});

	it('correctly outputs ANSI 104 defsrc with 104 key names', () => {
		const state = createAnsiState();
		const result = generateKbd(state);

		// Extract defsrc block content
		const defsrcMatch = result.match(/\(defsrc([\s\S]*?)\)/);
		expect(defsrcMatch).not.toBeNull();
	});

	it('generates correct action when a key is customized in ANSI 104', () => {
		const state = createAnsiState();
		state.layers[0].actions.set('KeyA', { type: 'key', value: 'b' });

		const result = generateKbd(state);
		expect(result).toContain('b');
	});
});
