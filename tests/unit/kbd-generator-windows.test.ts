import { describe, it, expect } from 'vitest';
import { generateKbd } from '$lib/services/kbd-generator';
import { validateKbdExport } from '$lib/services/export-format-support';
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
		...overrides,
	};
}

describe('kbd-generator: Windows target-aware 変換', () => {
	it('lang1 を含む状態で Windows target → (arbitrary-code 22) が出力される', () => {
		const state = createState();
		// KanaMode キーに lang1 を設定
		state.layers[0].actions.set('KanaMode', { type: 'key', value: 'lang1' });
		const result = generateKbd(state, 'windows');
		expect(result).toContain('(arbitrary-code 22)');
		expect(result).not.toMatch(/\blang1\b/);
	});

	it('lang2 を含む状態で Windows target → (arbitrary-code 26) が出力される', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', { type: 'key', value: 'lang2' });
		const result = generateKbd(state, 'windows');
		expect(result).toContain('(arbitrary-code 26)');
		expect(result).not.toMatch(/\blang2\b/);
	});

	it('lang1 を含む状態で macOS target → kana が出力される', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', { type: 'key', value: 'lang1' });
		const result = generateKbd(state, 'macos');
		expect(result).toMatch(/\bkana\b/);
		expect(result).not.toContain('(arbitrary-code');
	});

	it('lang2 を含む状態で macOS target → eisu が出力される', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', { type: 'key', value: 'lang2' });
		const result = generateKbd(state, 'macos');
		expect(result).toMatch(/\beisu\b/);
	});

	it('jp-kana を含む状態で Windows target → katahira が出力される', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', { type: 'key', value: 'jp-kana' });
		const result = generateKbd(state, 'windows');
		expect(result).toMatch(/\bkatahira\b/);
	});

	it('通常キーは target に関係なくそのまま出力される', () => {
		const state = createState();
		state.layers[0].actions.set('KeyA', { type: 'key', value: 'b' });
		const winResult = generateKbd(state, 'windows');
		const macResult = generateKbd(state, 'macos');
		expect(winResult).toContain(' b ');
		expect(macResult).toContain(' b ');
	});
});

describe('kbd-generator: 修飾キー付き target-aware 変換', () => {
	it('lang1 + lctl で Windows target → C-(arbitrary-code 22) が出力される', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', {
			type: 'key',
			value: 'lang1',
			modifiers: ['lctl'],
		});
		const result = generateKbd(state, 'windows');
		// chord prefix で C- が付く
		expect(result).toContain('C-(arbitrary-code 22)');
	});

	it('lang1 + lctl で macOS target → C-kana が出力される', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', {
			type: 'key',
			value: 'lang1',
			modifiers: ['lctl'],
		});
		const result = generateKbd(state, 'macos');
		expect(result).toContain('C-kana');
	});
});

describe('kbd-generator: tap-hold 内の target-aware 変換', () => {
	it('tap に lang1 を含む tap-hold で Windows target → alias に (arbitrary-code 22) が含まれる', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', {
			type: 'tap-hold',
			variant: 'tap-hold',
			tapTimeout: 200,
			holdTimeout: 200,
			tapAction: { type: 'key', value: 'lang1' },
			holdAction: { type: 'no-op' },
		});
		const result = generateKbd(state, 'windows');
		expect(result).toContain('(arbitrary-code 22)');
	});
});

describe('kbd-generator: 列幅計算が変換後テキスト長を考慮', () => {
	it('(arbitrary-code 22) のテキスト長が列幅に反映される', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', { type: 'key', value: 'lang1' });
		const result = generateKbd(state, 'windows');
		// (arbitrary-code 22) = 18文字。列幅計算が正しければアラインメントが維持される
		expect(result).toContain('(arbitrary-code 22)');
		// 出力が valid な .kbd テキストであること
		expect(result).toContain('(defsrc');
		expect(result).toContain('(deflayer');
	});
});

describe('validateKbdExport: unsupported target 検出 (TR-WKC-012, TR-WKC-013)', () => {
	it('Linux target + lang1 → unsupported が検出される', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', { type: 'key', value: 'lang1' });
		const result = validateKbdExport(state, 'linux');
		expect(result.valid).toBe(false);
		expect(result.unsupportedActions.length).toBeGreaterThan(0);
		const diag = result.unsupportedActions[0];
		expect(diag.targetOs).toBe('linux');
		expect(diag.actionId).toBe('lang1');
	});

	it('Linux target + lang2 → unsupported が検出される', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', { type: 'key', value: 'lang2' });
		const result = validateKbdExport(state, 'linux');
		expect(result.valid).toBe(false);
		expect(result.unsupportedActions.some((d) => d.actionId === 'lang2')).toBe(true);
	});

	it('macOS target + jp-kana → valid（全 target で native-key サポート済み）', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', { type: 'key', value: 'jp-kana' });
		const result = validateKbdExport(state, 'macos');
		expect(result.valid).toBe(true);
		expect(result.unsupportedActions).toHaveLength(0);
	});

	it('Windows target + lang1 → valid（サポート済み）', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', { type: 'key', value: 'lang1' });
		const result = validateKbdExport(state, 'windows');
		expect(result.valid).toBe(true);
		expect(result.unsupportedActions).toHaveLength(0);
	});

	it('macOS target + lang1 → valid（サポート済み）', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', { type: 'key', value: 'lang1' });
		const result = validateKbdExport(state, 'macos');
		expect(result.valid).toBe(true);
	});

	it('通常キーのみ → 全 target で valid', () => {
		const state = createState();
		const result = validateKbdExport(state, 'linux');
		expect(result.valid).toBe(true);
	});

	it('tap-hold 内の unsupported action も検出される', () => {
		const state = createState();
		state.layers[0].actions.set('KanaMode', {
			type: 'tap-hold',
			variant: 'tap-hold',
			tapTimeout: 200,
			holdTimeout: 200,
			tapAction: { type: 'key', value: 'lang1' },
			holdAction: { type: 'no-op' },
		});
		const result = validateKbdExport(state, 'linux');
		expect(result.valid).toBe(false);
		expect(result.unsupportedActions.some((d) => d.actionId === 'lang1')).toBe(true);
	});
});

describe('kbd-generator: Windows deflocalkeys-wintercept（カタカナ/ひらがなキー対応）', () => {
	it('Windows target + JIS 109 テンプレート → deflocalkeys-wintercept katahira 241 が出力される', () => {
		const state = createState();
		const result = generateKbd(state, 'windows');
		expect(result).toContain('(deflocalkeys-wintercept');
		expect(result).toContain('katahira 241');
	});

	it('deflocalkeys-wintercept は defcfg の後、defsrc の前に配置される', () => {
		const state = createState();
		const result = generateKbd(state, 'windows');
		const deflocalPos = result.indexOf('(deflocalkeys-wintercept');
		const defcfgEnd = result.indexOf(')', result.indexOf('(defcfg'));
		const defsrcPos = result.indexOf('(defsrc');
		expect(deflocalPos).toBeGreaterThan(defcfgEnd);
		expect(deflocalPos).toBeLessThan(defsrcPos);
	});

	it('deflocalkeys-win は出力されない（wintercept 版が両方読み込む問題を回避）', () => {
		const state = createState();
		const result = generateKbd(state, 'windows');
		const lines = result.split('\n');
		const hasDlkWin = lines.some(l => /^\(deflocalkeys-win\s/.test(l.trim()));
		expect(hasDlkWin).toBe(false);
	});

	it('defsrc に katahira が 1 回だけ出現する', () => {
		const state = createState();
		const result = generateKbd(state, 'windows');
		const defsrcMatch = result.match(/\(defsrc[\s\S]*?\)/)?.[0] ?? '';
		const count = (defsrcMatch.match(/\bkatahira\b/g) ?? []).length;
		expect(count).toBe(1);
	});

	it('macOS target → deflocalkeys は出力されない', () => {
		const state = createState();
		const result = generateKbd(state, 'macos');
		expect(result).not.toContain('deflocalkeys');
	});

	it('Linux target → deflocalkeys は出力されない', () => {
		const state = createState();
		const result = generateKbd(state, 'linux');
		expect(result).not.toContain('deflocalkeys');
	});

	it('ANSI 104 テンプレート（kana キーなし）→ deflocalkeys は出力されない', () => {
		const actions = new Map<string, KeyAction>();
		for (const key of ANSI_104_TEMPLATE.keys) {
			if (!key.kanataName) continue;
			actions.set(key.id, { type: 'key', value: key.kanataName });
		}
		const state: EditorState = {
			template: ANSI_104_TEMPLATE,
			layers: [{ name: BASE_LAYER_NAME, actions }],
			selectedKeyId: null,
			activeLayerIndex: 0,
			jisToUsRemap: false,
			tappingTerm: 200,
		};
		const result = generateKbd(state, 'windows');
		expect(result).not.toContain('deflocalkeys');
	});
});

describe('kbd-generator: Windows wintercept 注意喚起ヘッダーコメント', () => {
	it('Windows target + JIS テンプレート → wintercept 注意喚起コメントが出力される', () => {
		const state = createState();
		const result = generateKbd(state, 'windows');
		expect(result).toContain(';; NOTE:');
		expect(result).toContain('deflocalkeys-wintercept');
		expect(result).toContain('--wintercept');
	});

	it('macOS target → wintercept 注意喚起コメントは出力されない', () => {
		const state = createState();
		const result = generateKbd(state, 'macos');
		expect(result).not.toContain('--wintercept');
	});

	it('ANSI 104 テンプレート + Windows → wintercept 注意喚起コメントは出力されない', () => {
		const actions = new Map<string, KeyAction>();
		for (const key of ANSI_104_TEMPLATE.keys) {
			if (!key.kanataName) continue;
			actions.set(key.id, { type: 'key', value: key.kanataName });
		}
		const state: EditorState = {
			template: ANSI_104_TEMPLATE,
			layers: [{ name: BASE_LAYER_NAME, actions }],
			selectedKeyId: null,
			activeLayerIndex: 0,
			jisToUsRemap: false,
			tappingTerm: 200,
		};
		const result = generateKbd(state, 'windows');
		expect(result).not.toContain('--wintercept');
	});
});
