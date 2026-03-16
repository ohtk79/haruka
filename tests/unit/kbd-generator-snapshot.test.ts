import { describe, it, expect, afterAll } from 'vitest';
import { generateKbd } from '$lib/services/kbd-generator';
import { JIS_109_TEMPLATE } from '$lib/templates/jis109';
import { ANSI_104_TEMPLATE } from '$lib/templates/ansi104';
import type { EditorState, Layer, KeyAction, LayoutTemplate } from '$lib/models/types';
import { BASE_LAYER_NAME } from '$lib/models/constants';

// ヘルパー: ベースレイヤー作成
function createBaseLayer(template: LayoutTemplate): Layer {
	const actions = new Map<string, KeyAction>();
	for (const key of template.keys) {
		if (!key.kanataName) continue;
		actions.set(key.id, { type: 'key', value: key.kanataName });
	}
	return { name: BASE_LAYER_NAME, actions };
}

// ヘルパー: カスタムレイヤー作成（tap-hold, layer-while-held, transparent 混在）
function createCustomLayer(template: LayoutTemplate): Layer {
	const actions = new Map<string, KeyAction>();
	for (const key of template.keys) {
		actions.set(key.id, { type: 'transparent' });
	}
	// tap-hold: CapsLock → Esc(tap) / layer-while-held nav(hold)
	actions.set('CapsLock', {
		type: 'tap-hold',
		variant: 'tap-hold-press',
		tapTimeout: 200,
		holdTimeout: 200,
		tapAction: { type: 'key', value: 'esc' },
		holdAction: { type: 'layer-while-held', layer: 'nav' },
	});
	// layer-while-held: Space → layer-while-held nav
	actions.set('Space', {
		type: 'layer-while-held',
		layer: 'nav',
	});
	// キーリマップ: KeyA → KeyB
	actions.set('KeyA', { type: 'key', value: 'b' });
	// no-op: KeyZ
	actions.set('KeyZ', { type: 'no-op' });
	return { name: 'nav', actions };
}

// ヘルパー: EditorState 作成
function createState(
	template: LayoutTemplate,
	overrides?: Partial<EditorState>
): EditorState {
	return {
		template,
		layers: [createBaseLayer(template)],
		selectedKeyId: null,
		activeLayerIndex: 0,
		jisToUsRemap: false,
		tappingTerm: 200,
		...overrides,
	};
}

// CI 用 .kbd ファイル出力先
const KBD_OUTPUTS: Map<string, string> = new Map();

describe('kbd-generator snapshot tests', () => {
	afterAll(async () => {
		if (KBD_OUTPUTS.size === 0) return;
		// node: モジュールを動的にインポート（svelte-check の型解析を回避）
		const nodeFs = 'node:' + 'fs';
		const nodePath = 'node:' + 'path';
		const nodeUrl = 'node:' + 'url';
		const fs = await import(/* @vite-ignore */ nodeFs);
		const path = await import(/* @vite-ignore */ nodePath);
		const url = await import(/* @vite-ignore */ nodeUrl);
		const repoRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
		const outDir = path.resolve(repoRoot, 'test-output');
		fs.mkdirSync(outDir, { recursive: true });
		for (const [name, content] of KBD_OUTPUTS) {
			fs.writeFileSync(path.resolve(outDir, `${name}.kbd`), content, 'utf-8');
		}
	});

	it('JIS 109 デフォルト（US remap OFF）', () => {
		const state = createState(JIS_109_TEMPLATE);
		const result = generateKbd(state);
		KBD_OUTPUTS.set('jis109-off', result);
		expect(result).toMatchSnapshot();
	});

	it('JIS 109 デフォルト（US remap ON）', () => {
		const state = createState(JIS_109_TEMPLATE, { jisToUsRemap: true });
		const result = generateKbd(state);
		KBD_OUTPUTS.set('jis109-on', result);
		expect(result).toMatchSnapshot();
	});

	it('JIS 109 複数レイヤー（US remap ON）', () => {
		const base = createBaseLayer(JIS_109_TEMPLATE);
		const custom = createCustomLayer(JIS_109_TEMPLATE);
		const state = createState(JIS_109_TEMPLATE, {
			jisToUsRemap: true,
			layers: [base, custom],
		});
		const result = generateKbd(state);
		KBD_OUTPUTS.set('jis109-on-multi', result);
		expect(result).toMatchSnapshot();
	});

	it('ANSI 104 デフォルト', () => {
		const state = createState(ANSI_104_TEMPLATE);
		const result = generateKbd(state);
		KBD_OUTPUTS.set('ansi104', result);
		expect(result).toMatchSnapshot();
	});

	it('ANSI 104 複数レイヤー', () => {
		const base = createBaseLayer(ANSI_104_TEMPLATE);
		const custom = createCustomLayer(ANSI_104_TEMPLATE);
		const state = createState(ANSI_104_TEMPLATE, {
			layers: [base, custom],
		});
		const result = generateKbd(state);
		KBD_OUTPUTS.set('ansi104-multi', result);
		expect(result).toMatchSnapshot();
	});
});
