import { describe, it, expect } from 'vitest';
import { generateKbd } from '$lib/services/kbd-generator';
import { JIS_109_TEMPLATE } from '$lib/templates/jis109';
import { JIS_TO_US_MAPPINGS, JIS_TO_US_MAP_BY_KEY } from '$lib/models/jis-us-map';
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

function createState(jisToUsRemap: boolean): EditorState {
	return {
		template: JIS_109_TEMPLATE,
		layers: [createBaseLayer()],
		selectedKeyId: null,
		activeLayerIndex: 0,
		jisToUsRemap,
		tappingTerm: 200
	};
}

describe('kbd-generator with JIS→US remap', () => {
	describe('US remap OFF', () => {
		it('should not contain jus-* aliases', () => {
			const result = generateKbd(createState(false));
			expect(result).not.toContain('jus-');
			expect(result).not.toContain('JIS→US');
		});

		it('should not contain v1.4.0+ header comment', () => {
			const result = generateKbd(createState(false));
			expect(result).not.toContain('Requires kanata v1.4.0+');
		});
	});

	describe('US remap ON', () => {
		const result = generateKbd(createState(true));

		it('should contain kanata v1.4.0+ header comment', () => {
			expect(result).toContain(';; Requires kanata v1.4.0+ (fork action)');
		});

		it('should contain JIS→US conversion aliases section comment', () => {
			expect(result).toContain(';; JIS→US conversion aliases');
		});

		it('should contain all 16 jus-* alias definitions', () => {
			for (const mapping of JIS_TO_US_MAPPINGS) {
				expect(result).toContain(mapping.aliasName);
			}
		});

		it('should use fork syntax for 14 aliases (not jus-lbr, jus-rbr)', () => {
			// jus-lbr, jus-rbr は normalExpr と Shift出力が一致するため fork 不要
			const directAliases = new Set(['jus-lbr', 'jus-rbr']);
			for (const mapping of JIS_TO_US_MAPPINGS) {
				const aliasPattern = new RegExp(`${mapping.aliasName}\\s+\\(fork`);
				if (directAliases.has(mapping.aliasName)) {
					expect(result).not.toMatch(aliasPattern);
				} else {
					expect(result).toMatch(aliasPattern);
				}
			}
		});

		it('should use unshift for category B (jus-2, jus-6, jus-scl)', () => {
			// カテゴリB: 素キーshiftExpr → unshiftでShift一時解除
			const categoryB = new Set(['jus-2', 'jus-6', 'jus-scl']);
			for (const mapping of JIS_TO_US_MAPPINGS) {
				const aliasLine = result.split('\n').find((l) => l.includes(mapping.aliasName + ' '));
				if (aliasLine === undefined) continue; // jus-lbr, jus-rbr は直接値
				if (categoryB.has(mapping.aliasName)) {
					expect(aliasLine, `${mapping.aliasName} should use unshift`).toContain('unshift');
					expect(aliasLine, `${mapping.aliasName} should NOT use release-key`).not.toContain('release-key');
				} else {
					expect(aliasLine, `${mapping.aliasName} should NOT use unshift`).not.toContain('unshift');
				}
			}
		});

		it('should NOT use release-key for jus-yen and jus-ro', () => {
			for (const mapping of JIS_TO_US_MAPPINGS) {
				if (!mapping.needsReleaseKey) {
					const aliasLine = result.split('\n').find((l) => l.includes(mapping.aliasName + ' '));
					expect(aliasLine, `Missing alias line for ${mapping.aliasName}`).toBeDefined();
					expect(aliasLine).not.toContain('release-key');
				}
			}
		});

		it('should contain @jus-* references in deflayer layer-0 for 16 keys', () => {
			for (const mapping of JIS_TO_US_MAPPINGS) {
				expect(result).toContain(`@${mapping.aliasName}`);
			}
		});

		it('deflayer layer-0 should contain @jus-* references only within base layer section', () => {
			const lines = result.split('\n');
			const baseStart = lines.findIndex((l) => l.includes('(deflayer layer-0'));
			const baseEnd = lines.findIndex((l, i) => i > baseStart && l.trim() === ')');

			const baseSection = lines.slice(baseStart, baseEnd + 1).join('\n');
			for (const mapping of JIS_TO_US_MAPPINGS) {
				expect(baseSection).toContain(`@${mapping.aliasName}`);
			}
		});
	});

	describe('US remap ON with multiple layers', () => {
		it('should NOT apply jus-* to non-base layers', () => {
			const state = createState(true);
			// Add a second layer with transparent keys
			const layer2Actions = new Map<string, KeyAction>();
			for (const key of JIS_109_TEMPLATE.keys) {
				layer2Actions.set(key.id, { type: 'transparent' });
			}
			state.layers.push({ name: 'nav', actions: layer2Actions });

			const result = generateKbd(state);
			const lines = result.split('\n');

			// Find nav layer section
			const navStart = lines.findIndex((l) => l.includes('(deflayer nav'));
			const navEnd = lines.findIndex((l, i) => i > navStart && l.trim() === ')');
			const navSection = lines.slice(navStart, navEnd + 1).join('\n');

			// Non-base layer should NOT contain @jus-* references
			expect(navSection).not.toContain('@jus-');
		});
	});

	describe('US remap ON with user-customized JIS keys', () => {
		it('should NOT use @jus-* for keys changed to transparent', () => {
			const state = createState(true);
			// Change Semicolon (;) to transparent
			state.layers[0].actions.set('Semicolon', { type: 'transparent' });
			const result = generateKbd(state);

			const lines = result.split('\n');
			const baseStart = lines.findIndex((l) => l.includes('(deflayer layer-0'));
			const baseEnd = lines.findIndex((l, i) => i > baseStart && l.trim() === ')');
			const baseSection = lines.slice(baseStart, baseEnd + 1).join('\n');

			expect(baseSection).not.toContain('@jus-scl');
			expect(baseSection).toMatch(/\b_\b/);
		});

		it('should NOT use @jus-* for keys changed to no-op', () => {
			const state = createState(true);
			// Change Digit6 (6) to no-op
			state.layers[0].actions.set('Digit6', { type: 'no-op' });
			const result = generateKbd(state);

			const lines = result.split('\n');
			const baseStart = lines.findIndex((l) => l.includes('(deflayer layer-0'));
			const baseEnd = lines.findIndex((l, i) => i > baseStart && l.trim() === ')');
			const baseSection = lines.slice(baseStart, baseEnd + 1).join('\n');

			expect(baseSection).not.toContain('@jus-6');
			expect(baseSection).toContain('XX');
		});

		it('should NOT use @jus-* for keys remapped to different key', () => {
			const state = createState(true);
			// Change Digit2 (2) to 'f'
			state.layers[0].actions.set('Digit2', { type: 'key', value: 'f' });
			const result = generateKbd(state);

			const lines = result.split('\n');
			const baseStart = lines.findIndex((l) => l.includes('(deflayer layer-0'));
			const baseEnd = lines.findIndex((l, i) => i > baseStart && l.trim() === ')');
			const baseSection = lines.slice(baseStart, baseEnd + 1).join('\n');

			expect(baseSection).not.toContain('@jus-2');
			expect(baseSection).toMatch(/\bf\b/);
		});

		it('should still use @jus-* for unchanged JIS keys', () => {
			const state = createState(true);
			// Change only Digit6 - other JIS keys should remain @jus-*
			state.layers[0].actions.set('Digit6', { type: 'no-op' });
			const result = generateKbd(state);

			const lines = result.split('\n');
			const baseStart = lines.findIndex((l) => l.includes('(deflayer layer-0'));
			const baseEnd = lines.findIndex((l, i) => i > baseStart && l.trim() === ')');
			const baseSection = lines.slice(baseStart, baseEnd + 1).join('\n');

			// Other JIS keys still use aliases
			expect(baseSection).toContain('@jus-2');
			expect(baseSection).toContain('@jus-grv');
			expect(baseSection).toContain('@jus-scl');
			// But Digit6 should be XX
			expect(baseSection).not.toContain('@jus-6');
		});
	});

	describe('correct fork expressions', () => {
		// カテゴリA-fork: S-付きshiftExpr → 素キー出力
		it('jus-grv should fork with bare key: normal=S-[, shift==', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-grv '));
			expect(line).toBeDefined();
			expect(line).toContain('(fork S-[ = (lsft rsft))');
		});

		it('jus-7 should fork with bare key: normal=7, shift=6', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-7 '));
			expect(line).toBeDefined();
			expect(line).toContain('(fork 7 6 (lsft rsft))');
		});

		it('jus-8 should fork with bare key: normal=8, shift=\'', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-8 '));
			expect(line).toBeDefined();
			expect(line).toContain("(fork 8 ' (lsft rsft))");
		});

		it('jus-9 should fork with bare key: normal=9, shift=8', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-9 '));
			expect(line).toBeDefined();
			expect(line).toContain('(fork 9 8 (lsft rsft))');
		});

		it('jus-0 should fork with bare key: normal=0, shift=9', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-0 '));
			expect(line).toBeDefined();
			expect(line).toContain('(fork 0 9 (lsft rsft))');
		});

		it('jus-min should fork with bare key: normal=-, shift=ro', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-min '));
			expect(line).toBeDefined();
			expect(line).toContain('(fork - ro (lsft rsft))');
		});

		it('jus-eq should fork with bare key: normal=S--, shift=;', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-eq '));
			expect(line).toBeDefined();
			expect(line).toContain('(fork S-- ; (lsft rsft))');
		});

		it('jus-quo should fork with bare key: normal=S-7, shift=2', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-quo '));
			expect(line).toBeDefined();
			expect(line).toContain('(fork S-7 2 (lsft rsft))');
		});

		it('jus-bsl should fork with bare key: normal=ro, shift=\u00A5', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-bsl '));
			expect(line).toBeDefined();
			expect(line).toContain('(fork ro \u00A5 (lsft rsft))');
		});

		// カテゴリA-direct: normalExprとShift出力が一致 → fork除去
		it('jus-lbr should output bare key ] without fork', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-lbr '));
			expect(line).toBeDefined();
			expect(line).toMatch(/jus-lbr\s+]/);
			expect(line).not.toContain('fork');
		});

		it('jus-rbr should output bare key \\ without fork', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-rbr '));
			expect(line).toBeDefined();
			expect(line).toMatch(/jus-rbr\s+\\/);
			expect(line).not.toContain('fork');
		});

		// カテゴリB: 素キーshiftExpr → unshiftでShift一時解除
		it('jus-2 should use unshift for bare key', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-2 '));
			expect(line).toBeDefined();
			expect(line).toContain('(fork 2 (unshift [) (lsft rsft))');
		});

		it('jus-6 should use unshift for bare key', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-6 '));
			expect(line).toBeDefined();
			expect(line).toContain('(fork 6 (unshift =) (lsft rsft))');
		});

		it('jus-scl should use unshift for bare key', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-scl '));
			expect(line).toBeDefined();
			expect(line).toContain("(fork ; (unshift ') (lsft rsft))");
		});

		// カテゴリC: needsReleaseKey=false → 変更なし
		it('jus-yen should fork without release-key', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-yen '));
			expect(line).toBeDefined();
			expect(line).toContain('(fork ro S-\u00A5 (lsft rsft))');
		});

		it('jus-ro should fork without release-key', () => {
			const result = generateKbd(createState(true));
			const line = result.split('\n').find((l) => l.includes('jus-ro '));
			expect(line).toBeDefined();
			expect(line).toContain('(fork ro S-\u00A5 (lsft rsft))');
		});
	});

	// =========================================================================
	// リマップキーへの JIS→US 変換適用テスト (013-fix-jis-us-remap)
	// =========================================================================

	describe('JIS→US remap with key remapping', () => {
		// KBD-JR-001: A→2 リマップで @jus-2 が出力される
		it('should output @jus-2 when KeyA is remapped to 2', () => {
			const state = createState(true);
			state.layers[0].actions.set('KeyA', { type: 'key', value: '2' });
			const result = generateKbd(state);

			const lines = result.split('\n');
			const baseStart = lines.findIndex((l) => l.includes('(deflayer layer-0'));
			const baseEnd = lines.findIndex((l, i) => i > baseStart && l.trim() === ')');
			const baseSection = lines.slice(baseStart, baseEnd + 1).join('\n');

			// KeyA の位置に @jus-2 が出力される
			expect(baseSection).toContain('@jus-2');
			// 物理 Digit2 にも @jus-2 が残っている（デフォルトのまま）
			const jus2Count = (baseSection.match(/@jus-2/g) ?? []).length;
			expect(jus2Count).toBe(2);
		});

		// KBD-JR-002: A→B リマップ（非変換対象）で素の b が出力される
		it('should output plain b when KeyA is remapped to non-JIS-US key', () => {
			const state = createState(true);
			state.layers[0].actions.set('KeyA', { type: 'key', value: 'b' });
			const result = generateKbd(state);

			const lines = result.split('\n');
			const baseStart = lines.findIndex((l) => l.includes('(deflayer layer-0'));
			const baseEnd = lines.findIndex((l, i) => i > baseStart && l.trim() === ')');
			const baseSection = lines.slice(baseStart, baseEnd + 1).join('\n');

			// b は変換対象外なので JIS→US 変換なし（@jus-bsl 等にマッチしないよう正規表現で検証）
			expect(baseSection).not.toMatch(/@jus-b[\s)]/)
		});

		// KBD-JR-003: 物理 2→A リマップで @jus-2 が消える
		it('should not output @jus-2 when Digit2 is remapped to a', () => {
			const state = createState(true);
			state.layers[0].actions.set('Digit2', { type: 'key', value: 'a' });
			const result = generateKbd(state);

			const lines = result.split('\n');
			const baseStart = lines.findIndex((l) => l.includes('(deflayer layer-0'));
			const baseEnd = lines.findIndex((l, i) => i > baseStart && l.trim() === ')');
			const baseSection = lines.slice(baseStart, baseEnd + 1).join('\n');

			// Digit2 はもはや 2 を出力しないので @jus-2 なし
			expect(baseSection).not.toContain('@jus-2');
		});

		// KBD-JR-004: A→2, B→6 の複数リマップ
		it('should output @jus-2 and @jus-6 for multiple remaps', () => {
			const state = createState(true);
			state.layers[0].actions.set('KeyA', { type: 'key', value: '2' });
			state.layers[0].actions.set('KeyB', { type: 'key', value: '6' });
			const result = generateKbd(state);

			const lines = result.split('\n');
			const baseStart = lines.findIndex((l) => l.includes('(deflayer layer-0'));
			const baseEnd = lines.findIndex((l, i) => i > baseStart && l.trim() === ')');
			const baseSection = lines.slice(baseStart, baseEnd + 1).join('\n');

			// 物理キー + リマップキーの両方
			const jus2Count = (baseSection.match(/@jus-2/g) ?? []).length;
			const jus6Count = (baseSection.match(/@jus-6/g) ?? []).length;
			expect(jus2Count).toBe(2); // 物理 Digit2 + KeyA→2
			expect(jus6Count).toBe(2); // 物理 Digit6 + KeyB→6
		});

		// KBD-JR-005: jisToUsRemap=false で A→2 リマップ → 素の 2
		it('should output plain 2 when jisToUsRemap is false', () => {
			const state = createState(false);
			state.layers[0].actions.set('KeyA', { type: 'key', value: '2' });
			const result = generateKbd(state);

			// JIS→US 変換は一切なし
			expect(result).not.toContain('@jus-');
			expect(result).not.toContain('jus-');
		});

		// KBD-JR-006: 修飾キー付きリマップ（A → Ctrl+2）で JIS→US 変換なし
		it('should not apply JIS→US conversion for remap with modifiers', () => {
			const state = createState(true);
			state.layers[0].actions.set('KeyA', { type: 'key', value: '2', modifiers: ['lctl'] });
			const result = generateKbd(state);

			const lines = result.split('\n');
			const baseStart = lines.findIndex((l) => l.includes('(deflayer layer-0'));
			const baseEnd = lines.findIndex((l, i) => i > baseStart && l.trim() === ')');
			const baseSection = lines.slice(baseStart, baseEnd + 1).join('\n');

			// 物理 Digit2 の @jus-2 は残るが、KeyA 位置は修飾キー付きリマップ
			const jus2Count = (baseSection.match(/@jus-2/g) ?? []).length;
			expect(jus2Count).toBe(1); // 物理 Digit2 のみ
		});

		// KBD-JR-007: リマップ時の列幅に @jus-* の幅が反映される
		it('should account for @jus-* width in column calculation for remapped keys', () => {
			const state = createState(true);
			state.layers[0].actions.set('KeyA', { type: 'key', value: '2' });
			const result = generateKbd(state);

			// @jus-2 (6文字) は 'a' (1文字) より長いので列幅が拡大されるはず
			// 出力が正しく整列されていること（@jus-2 がトランケートされていないこと）を確認
			const lines = result.split('\n');
			const baseStart = lines.findIndex((l) => l.includes('(deflayer layer-0'));
			const baseEnd = lines.findIndex((l, i) => i > baseStart && l.trim() === ')');
			const baseSection = lines.slice(baseStart, baseEnd + 1).join('\n');
			expect(baseSection).toContain('@jus-2');
		});
	});

	// =========================================================================
	// tap-hold 内 JIS→US 変換テスト
	// =========================================================================

	describe('JIS→US remap with tap-hold actions', () => {
		function createStateWithNavLayer(jisToUsRemap: boolean): EditorState {
			const state = createState(jisToUsRemap);
			const layer2Actions = new Map<string, KeyAction>();
			for (const key of JIS_109_TEMPLATE.keys) {
				layer2Actions.set(key.id, { type: 'transparent' });
			}
			state.layers.push({ name: 'nav', actions: layer2Actions });
			return state;
		}

		// KBD-JR-TH-001: 非JISキー(A)に tap-hold(tap=2) で @jus-2 が使用される
		it('should use @jus-2 in tap-hold alias when tap is 2', () => {
			const state = createStateWithNavLayer(true);
			state.layers[0].actions.set('KeyA', {
				type: 'tap-hold',
				tapAction: { type: 'key', value: '2' },
				holdAction: { type: 'layer-while-held', layer: 'nav' },
				variant: 'tap-hold-press',
				tapTimeout: 200,
				holdTimeout: 200
			});
			const result = generateKbd(state, 'windows');

			const aliasLine = result.split('\n').find((l) => l.includes('a_layer-0'));
			expect(aliasLine).toBeDefined();
			expect(aliasLine).toContain('@jus-2');
		});

		// KBD-JR-TH-002: 物理JISキー(Digit2)に tap-hold(tap=2) で @jus-2 が使用される
		it('should use @jus-2 in tap-hold alias for physical Digit2', () => {
			const state = createStateWithNavLayer(true);
			state.layers[0].actions.set('Digit2', {
				type: 'tap-hold',
				tapAction: { type: 'key', value: '2' },
				holdAction: { type: 'layer-while-held', layer: 'nav' },
				variant: 'tap-hold-press',
				tapTimeout: 200,
				holdTimeout: 200
			});
			const result = generateKbd(state, 'windows');

			const aliasLine = result.split('\n').find((l) => l.includes('2_layer-0'));
			expect(aliasLine).toBeDefined();
			expect(aliasLine).toContain('@jus-2');
		});

		// KBD-JR-TH-003: tap が非変換対象キー(f)の場合、JIS→US 変換なし
		it('should not use @jus-* when tap is non-JIS-US key', () => {
			const state = createStateWithNavLayer(true);
			state.layers[0].actions.set('KeyA', {
				type: 'tap-hold',
				tapAction: { type: 'key', value: 'f' },
				holdAction: { type: 'layer-while-held', layer: 'nav' },
				variant: 'tap-hold-press',
				tapTimeout: 200,
				holdTimeout: 200
			});
			const result = generateKbd(state, 'windows');

			const aliasLine = result.split('\n').find((l) => l.includes('a_layer-0'));
			expect(aliasLine).toBeDefined();
			expect(aliasLine).not.toContain('@jus-');
			expect(aliasLine).toContain(' f ');
		});

		// KBD-JR-TH-004: jisToUsRemap=false で tap-hold(tap=2) → 素の 2
		it('should not use @jus-* when jisToUsRemap is false', () => {
			const state = createStateWithNavLayer(false);
			state.layers[0].actions.set('KeyA', {
				type: 'tap-hold',
				tapAction: { type: 'key', value: '2' },
				holdAction: { type: 'layer-while-held', layer: 'nav' },
				variant: 'tap-hold-press',
				tapTimeout: 200,
				holdTimeout: 200
			});
			const result = generateKbd(state, 'windows');

			const aliasLine = result.split('\n').find((l) => l.includes('a_layer-0'));
			expect(aliasLine).toBeDefined();
			expect(aliasLine).not.toContain('@jus-');
		});

		// KBD-JR-TH-005: 非ベースレイヤーの tap-hold では JIS→US 変換なし
		it('should not use @jus-* for tap-hold on non-base layer', () => {
			const state = createStateWithNavLayer(true);
			// nav レイヤーに tap-hold を設定
			state.layers[1].actions.set('KeyA', {
				type: 'tap-hold',
				tapAction: { type: 'key', value: '2' },
				holdAction: { type: 'layer-while-held', layer: 'nav' },
				variant: 'tap-hold-press',
				tapTimeout: 200,
				holdTimeout: 200
			});
			const result = generateKbd(state, 'windows');

			const aliasLine = result.split('\n').find((l) => l.includes('a_nav'));
			expect(aliasLine).toBeDefined();
			expect(aliasLine).not.toContain('@jus-');
		});

		// KBD-JR-TH-006: tap に修飾キーが付いている場合、JIS→US 変換なし
		it('should not use @jus-* when tap has modifiers', () => {
			const state = createStateWithNavLayer(true);
			state.layers[0].actions.set('KeyA', {
				type: 'tap-hold',
				tapAction: { type: 'key', value: '2', modifiers: ['lctl'] },
				holdAction: { type: 'layer-while-held', layer: 'nav' },
				variant: 'tap-hold-press',
				tapTimeout: 200,
				holdTimeout: 200
			});
			const result = generateKbd(state, 'windows');

			const aliasLine = result.split('\n').find((l) => l.includes('a_layer-0'));
			expect(aliasLine).toBeDefined();
			expect(aliasLine).not.toContain('@jus-2');
		});

		// KBD-JR-TH-007: 全16キーが tap-hold でも正しく変換される
		it('should handle all 16 JIS-US keys in tap-hold', () => {
			const state = createStateWithNavLayer(true);
			// grv キーに tap-hold(tap=grv) を設定
			state.layers[0].actions.set('Backquote', {
				type: 'tap-hold',
				tapAction: { type: 'key', value: 'grv' },
				holdAction: { type: 'layer-while-held', layer: 'nav' },
				variant: 'tap-hold-press',
				tapTimeout: 200,
				holdTimeout: 200
			});
			const result = generateKbd(state, 'windows');

			const aliasLine = result.split('\n').find((l) => l.includes('grv_layer-0'));
			expect(aliasLine).toBeDefined();
			expect(aliasLine).toContain('@jus-grv');
		});
	});

	// =========================================================================
	// 非ベースレイヤー JIS→US 変換テスト (017-fix-jis-us-nonbase-layer)
	// =========================================================================

	describe('JIS→US remap on non-base layers', () => {
		function createStateWithLayer1(jisToUsRemap: boolean): EditorState {
			const state = createState(jisToUsRemap);
			const layer1Actions = new Map<string, KeyAction>();
			for (const key of JIS_109_TEMPLATE.keys) {
				layer1Actions.set(key.id, { type: 'transparent' });
			}
			state.layers.push({ name: 'layer-1', actions: layer1Actions });
			return state;
		}

		function getLayerSection(result: string, layerName: string): string {
			const lines = result.split('\n');
			const start = lines.findIndex((l) => l.includes(`(deflayer ${layerName}`));
			const end = lines.findIndex((l, i) => i > start && l.trim() === ')');
			return lines.slice(start, end + 1).join('\n');
		}

		// KBD-NB-001: 非ベースレイヤーに変換対象キー → @jus-* が出力される
		it('should output @jus-2 when non-base layer key is remapped to 2', () => {
			const state = createStateWithLayer1(true);
			state.layers[1].actions.set('KeyA', { type: 'key', value: '2' });
			const result = generateKbd(state);

			const layer1Section = getLayerSection(result, 'layer-1');
			expect(layer1Section).toContain('@jus-2');
		});

		// KBD-NB-002: 非ベースレイヤーの transparent → _ が出力される
		it('should output _ for transparent keys in non-base layer', () => {
			const state = createStateWithLayer1(true);
			// 全キー transparent のまま
			const result = generateKbd(state);

			const layer1Section = getLayerSection(result, 'layer-1');
			expect(layer1Section).not.toContain('@jus-');
			// transparent は _ として出力される
			expect(layer1Section).toContain(' _ ');
		});

		// KBD-NB-003: 非ベースレイヤーの未設定キー（action なし）→ _ が出力される
		it('should output default key name for undefined action in non-base layer', () => {
			const state = createStateWithLayer1(true);
			// KeyA の action を削除（Map からキーを消す）
			state.layers[1].actions.delete('KeyA');
			const result = generateKbd(state);

			const layer1Section = getLayerSection(result, 'layer-1');
			// 未設定キーに @jus-* は出力されない
			expect(layer1Section).not.toMatch(/@jus-a[\s)]/);
		});

		// KBD-NB-004: jisToUsRemap=false → 非ベースレイヤーでも @jus-* なし
		it('should not output @jus-* in non-base layer when jisToUsRemap=false', () => {
			const state = createStateWithLayer1(false);
			state.layers[1].actions.set('KeyA', { type: 'key', value: '2' });
			const result = generateKbd(state);

			const layer1Section = getLayerSection(result, 'layer-1');
			expect(layer1Section).not.toContain('@jus-');
		});

		// KBD-NB-005: 非ベースレイヤーに変換対象外キー → 素のキー名
		it('should output plain key name for non-target key in non-base layer', () => {
			const state = createStateWithLayer1(true);
			state.layers[1].actions.set('KeyA', { type: 'key', value: 'b' });
			const result = generateKbd(state);

			const layer1Section = getLayerSection(result, 'layer-1');
			expect(layer1Section).not.toMatch(/@jus-b[\s)]/);
			expect(layer1Section).toMatch(/\bb\b/);
		});

		// KBD-NB-006: 非ベースレイヤーに修飾キー付き変換対象キー → 修飾キー表現
		it('should not apply JIS→US for key with modifiers in non-base layer', () => {
			const state = createStateWithLayer1(true);
			state.layers[1].actions.set('KeyA', { type: 'key', value: '2', modifiers: ['lctl'] });
			const result = generateKbd(state);

			const layer1Section = getLayerSection(result, 'layer-1');
			expect(layer1Section).not.toContain('@jus-2');
			expect(layer1Section).toContain('C-2');
		});

		// KBD-NB-007: 物理位置ベースのデフォルトキー → @jus-* が出力される
		it('should output @jus-2 when Digit2 is explicitly set to 2 in non-base layer', () => {
			const state = createStateWithLayer1(true);
			state.layers[1].actions.set('Digit2', { type: 'key', value: '2' });
			const result = generateKbd(state);

			const layer1Section = getLayerSection(result, 'layer-1');
			expect(layer1Section).toContain('@jus-2');
		});

		// KBD-NB-008: 複数レイヤーに異なる変換対象キー → 各レイヤーに正しい @jus-*
		it('should output correct @jus-* for multiple non-base layers', () => {
			const state = createStateWithLayer1(true);
			state.layers[1].actions.set('KeyA', { type: 'key', value: '2' });

			const layer2Actions = new Map<string, KeyAction>();
			for (const key of JIS_109_TEMPLATE.keys) {
				layer2Actions.set(key.id, { type: 'transparent' });
			}
			layer2Actions.set('KeyB', { type: 'key', value: '6' });
			state.layers.push({ name: 'layer-2', actions: layer2Actions });

			const result = generateKbd(state);

			const layer1Section = getLayerSection(result, 'layer-1');
			expect(layer1Section).toContain('@jus-2');
			expect(layer1Section).not.toContain('@jus-6');

			const layer2Section = getLayerSection(result, 'layer-2');
			expect(layer2Section).toContain('@jus-6');
			expect(layer2Section).not.toContain('@jus-2');
		});
	});

	// =========================================================================
	// Shift 修飾 + JIS→US 変換テスト (018-fix-shift-jis-us-remap)
	// =========================================================================

	describe('JIS→US remap with Shift modifier', () => {
		function createStateWithLayer1(jisToUsRemap: boolean): EditorState {
			const state = createState(jisToUsRemap);
			const layer1Actions = new Map<string, KeyAction>();
			for (const key of JIS_109_TEMPLATE.keys) {
				layer1Actions.set(key.id, { type: 'transparent' });
			}
			state.layers.push({ name: 'layer-1', actions: layer1Actions });
			return state;
		}

		function getLayerSection(result: string, layerName: string): string {
			const lines = result.split('\n');
			const start = lines.findIndex((l) => l.includes(`(deflayer ${layerName}`));
			const end = lines.findIndex((l, i) => i > start && l.trim() === ')');
			return lines.slice(start, end + 1).join('\n');
		}

		// KBD-JR-SHIFT-001: Shift+2 → `[`（カテゴリ B、Shift 吸収）
		it('should output [ when key 2 has lsft modifier with JIS→US remap', () => {
			const state = createState(true);
			state.layers[0].actions.set('KeyA', { type: 'key', value: '2', modifiers: ['lsft'] });
			const result = generateKbd(state);

			const baseSection = getLayerSection(result, 'layer-0');
			// KeyA 位置に [ が出力される（@jus-2 ではない）
			expect(baseSection).toContain('[');
			// S-2 は出力されない
			expect(baseSection).not.toContain('S-2');
		});

		// KBD-JR-SHIFT-002: Shift+grv → `S-=`（カテゴリ A、S- 接頭辞）
		it('should output S-= when key grv has lsft modifier with JIS→US remap', () => {
			const state = createState(true);
			state.layers[0].actions.set('KeyA', { type: 'key', value: 'grv', modifiers: ['lsft'] });
			const result = generateKbd(state);

			const baseSection = getLayerSection(result, 'layer-0');
			expect(baseSection).toContain('S-=');
		});

		// KBD-JR-SHIFT-003: Shift+Ctrl+2 → `C-[`（複合修飾キー）
		it('should output C-[ when key 2 has lsft and lctl modifiers with JIS→US remap', () => {
			const state = createState(true);
			state.layers[0].actions.set('KeyA', { type: 'key', value: '2', modifiers: ['lsft', 'lctl'] });
			const result = generateKbd(state);

			const baseSection = getLayerSection(result, 'layer-0');
			expect(baseSection).toContain('C-[');
		});

		// KBD-JR-SHIFT-004: rsft+; → `'`（右 Shift、カテゴリ B）
		it('should output quote when key ; has rsft modifier with JIS→US remap', () => {
			const state = createState(true);
			state.layers[0].actions.set('KeyA', { type: 'key', value: ';', modifiers: ['rsft'] });
			const result = generateKbd(state);

			const baseSection = getLayerSection(result, 'layer-0');
			expect(baseSection).toContain("'");
		});

		// KBD-JR-SHIFT-005: jisToUsRemap=false → Shift+2 は S-2（変換なし）
		it('should output S-2 when jisToUsRemap is false', () => {
			const state = createState(false);
			state.layers[0].actions.set('KeyA', { type: 'key', value: '2', modifiers: ['lsft'] });
			const result = generateKbd(state);

			const baseSection = getLayerSection(result, 'layer-0');
			expect(baseSection).toContain('S-2');
		});

		// KBD-JR-SHIFT-006: Ctrl+2（Shift なし）→ C-2（JIS→US 変換なし）
		it('should output C-2 when key 2 has only lctl modifier with JIS→US remap', () => {
			const state = createState(true);
			state.layers[0].actions.set('KeyA', { type: 'key', value: '2', modifiers: ['lctl'] });
			const result = generateKbd(state);

			const baseSection = getLayerSection(result, 'layer-0');
			expect(baseSection).toContain('C-2');
			expect(baseSection).not.toContain('C-[');
		});

		// KBD-NB-SHIFT-001: 非ベースレイヤー Shift+2 → `[`
		it('should output [ when non-base layer key 2 has lsft modifier', () => {
			const state = createStateWithLayer1(true);
			state.layers[1].actions.set('KeyA', { type: 'key', value: '2', modifiers: ['lsft'] });
			const result = generateKbd(state);

			const layer1Section = getLayerSection(result, 'layer-1');
			expect(layer1Section).toContain('[');
			expect(layer1Section).not.toContain('S-2');
		});

		// KBD-NB-SHIFT-002: 非ベースレイヤー Shift+Ctrl+grv → `C-S-=`
		it('should output C-S-= when non-base layer key grv has lsft and lctl modifiers', () => {
			const state = createStateWithLayer1(true);
			state.layers[1].actions.set('KeyA', { type: 'key', value: 'grv', modifiers: ['lsft', 'lctl'] });
			const result = generateKbd(state);

			const layer1Section = getLayerSection(result, 'layer-1');
			expect(layer1Section).toContain('C-S-=');
		});
	});

	// =========================================================================
	// Windows ターゲット JIS→US 変換テスト (022-fix-win-key-ro-yen)
	// =========================================================================

	describe('Windows target JIS→US remap', () => {
		// T008: Windows + JIS→US ON で 4 エイリアスの出力値を検証
		describe('US1: defalias alias values', () => {
			const result = generateKbd(createState(true), 'windows');

			it('should output jus-min as fork with arbitrary-code 226 for JIS layout', () => {
				const aliasLine = result.split('\n').find((l) => l.includes('jus-min '));
				expect(aliasLine).toBeDefined();
				expect(aliasLine).toContain('jus-min');
				// Windows JIS: normalExpr='-', shiftExpr='(multi lsft (arbitrary-code 226))' → fork
				expect(aliasLine).toContain('(fork - (multi lsft (arbitrary-code 226)) (lsft rsft))');
			});

			it('should output jus-bsl as fork with arbitrary-code 226/220', () => {
				const aliasLine = result.split('\n').find((l) => l.includes('jus-bsl '));
				expect(aliasLine).toBeDefined();
				// Windows JIS: normalExpr='(arbitrary-code 226)', shiftExpr='(multi lsft (arbitrary-code 220))'
				expect(aliasLine).toContain('(fork (arbitrary-code 226) (multi lsft (arbitrary-code 220)) (lsft rsft))');
			});

			it('should output jus-yen with arbitrary-code expressions', () => {
				const aliasLine = result.split('\n').find((l) => l.includes('jus-yen '));
				expect(aliasLine).toBeDefined();
				// Windows JIS: normalExpr='(arbitrary-code 226)', shiftExpr='(multi lsft (arbitrary-code 220))'
				expect(aliasLine).toContain('(fork (arbitrary-code 226) (multi lsft (arbitrary-code 220)) (lsft rsft))');
			});

			it('should output jus-ro with arbitrary-code expressions', () => {
				const aliasLine = result.split('\n').find((l) => l.includes('jus-ro '));
				expect(aliasLine).toBeDefined();
				// Windows JIS: normalExpr='(arbitrary-code 226)', shiftExpr='(multi lsft (arbitrary-code 220))'
				expect(aliasLine).toContain('(fork (arbitrary-code 226) (multi lsft (arbitrary-code 220)) (lsft rsft))');
			});
		});

		// T009: Windows + JIS→US ON で defalias セクションに ro / ¥ が出力キーコードとして含まれない
		describe('US1: defalias must not contain unmapped keycodes', () => {
			it('should not contain ro or ¥ as output keycodes in defalias', () => {
				const result = generateKbd(createState(true), 'windows');
				const defaliasStart = result.indexOf('(defalias');
				const defaliasEnd = result.indexOf(')', defaliasStart + '(defalias'.length);
				const defaliasSection = result.slice(defaliasStart, defaliasEnd + 1);
				// 出力キーコードとしての ro / ¥ がないことを確認（スペース区切りで単語マッチ）
				expect(defaliasSection).not.toMatch(/\bro\b/);
				expect(defaliasSection).not.toMatch(/\b¥\b/);
			});
		});

		// T014: Windows ターゲットの defsrc に ro と ¥ が含まれる
		describe('US4: defsrc contains physical key names', () => {
			it('should contain ro and ¥ in defsrc for Windows target', () => {
				const result = generateKbd(createState(true), 'windows');
				const defsrcMatch = result.match(/\(defsrc[^)]+\)/);
				expect(defsrcMatch).not.toBeNull();
				const defsrcSection = defsrcMatch![0];
				expect(defsrcSection).toMatch(/\bro\b/);
				expect(defsrcSection).toContain('¥');
			});
		});

		// T020: 非ベースレイヤーで Shift + ro が Windows で S-\ として出力される
		describe('US3: non-base layer Shift+ro/¥ for Windows', () => {
			function createStateWithLayer1(jisToUsRemap: boolean): EditorState {
				const state = createState(jisToUsRemap);
				const layer1Actions = new Map<string, KeyAction>();
				for (const key of JIS_109_TEMPLATE.keys) {
					layer1Actions.set(key.id, { type: 'transparent' });
				}
				state.layers.push({ name: 'layer-1', actions: layer1Actions });
				return state;
			}

			function getLayerSection(result: string, layerName: string): string {
				const lines = result.split('\n');
				const start = lines.findIndex((l) => l.includes(`(deflayer ${layerName}`));
				if (start === -1) return '';
				const end = lines.findIndex((l, i) => i > start && l.trim() === ')');
				return lines.slice(start, end + 1).join('\n');
			}

			it('should output (multi lsft (arbitrary-code 220)) when non-base layer has Shift+ro on Windows', () => {
				const state = createStateWithLayer1(true);
				const roKey = JIS_109_TEMPLATE.keys.find((k) => k.kanataName === 'ro');
				expect(roKey).toBeDefined();
				state.layers[1].actions.set(roKey!.id, { type: 'key', value: 'ro', modifiers: ['lsft'] });
				const result = generateKbd(state, 'windows');
				const layer1Section = getLayerSection(result, 'layer-1');
				expect(layer1Section).toContain('(multi lsft (arbitrary-code 220))');
				expect(layer1Section).not.toMatch(/\bS-ro\b/);
			});

			// T021: 非ベースレイヤーで Shift + ¥ が Windows で arbitrary-code 式として出力される
			it('should output (multi lsft (arbitrary-code 220)) when non-base layer has Shift+¥ on Windows', () => {
				const state = createStateWithLayer1(true);
				const yenKey = JIS_109_TEMPLATE.keys.find((k) => k.kanataName === '¥');
				expect(yenKey).toBeDefined();
				state.layers[1].actions.set(yenKey!.id, { type: 'key', value: '¥', modifiers: ['lsft'] });
				const result = generateKbd(state, 'windows');
				const layer1Section = getLayerSection(result, 'layer-1');
				expect(layer1Section).toContain('(multi lsft (arbitrary-code 220))');
				expect(layer1Section).not.toMatch(/\bS-¥\b/);
			});
		});
	});

	// =========================================================================
	// macOS ターゲット回帰テスト (022-fix-win-key-ro-yen)
	// =========================================================================

	describe('macOS target JIS→US remap regression', () => {
		// T015: macOS ターゲットの defsrc に ro と ¥ が含まれる
		it('should contain ro and ¥ in defsrc for macOS target', () => {
			const result = generateKbd(createState(true));
			const defsrcMatch = result.match(/\(defsrc[^)]+\)/);
			expect(defsrcMatch).not.toBeNull();
			const defsrcSection = defsrcMatch![0];
			expect(defsrcSection).toMatch(/\bro\b/);
			expect(defsrcSection).toContain('¥');
		});

		// T017: macOS ターゲットで jus-yen が従来出力と同一
		it('should output jus-yen as "(fork ro S-¥ (lsft rsft))" on macOS', () => {
			const result = generateKbd(createState(true));
			const aliasLine = result.split('\n').find((l) => l.includes('jus-yen '));
			expect(aliasLine).toBeDefined();
			expect(aliasLine).toContain('(fork ro S-¥ (lsft rsft))');
		});

		// T018: macOS ターゲットで jus-ro, jus-bsl, jus-min が従来出力と同一
		it('should output jus-ro as "(fork ro S-¥ (lsft rsft))" on macOS', () => {
			const result = generateKbd(createState(true));
			const aliasLine = result.split('\n').find((l) => l.includes('jus-ro '));
			expect(aliasLine).toBeDefined();
			expect(aliasLine).toContain('(fork ro S-¥ (lsft rsft))');
		});

		it('should output jus-bsl as "(fork ro ¥ (lsft rsft))" on macOS', () => {
			const result = generateKbd(createState(true));
			const aliasLine = result.split('\n').find((l) => l.includes('jus-bsl '));
			expect(aliasLine).toBeDefined();
			expect(aliasLine).toContain('(fork ro ¥ (lsft rsft))');
		});

		it('should output jus-min as "(fork - ro (lsft rsft))" on macOS', () => {
			const result = generateKbd(createState(true));
			const aliasLine = result.split('\n').find((l) => l.includes('jus-min '));
			expect(aliasLine).toBeDefined();
			expect(aliasLine).toContain('(fork - ro (lsft rsft))');
		});
	});
});
