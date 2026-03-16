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
});
