// =============================================================================
// Unit Tests: KeyPicker isKeyAvailable() フィルタリングポリシー (KA-01~04)
// =============================================================================
// KeyPicker.svelte 内の isKeyAvailable() ロジックをユニットテストする。
// コンポーネント内部関数のため、同等のピュア関数を再実装してポリシーを検証する。

import { describe, it, expect } from 'vitest';
import {
	ALL_TEMPLATE_KANATA_NAMES,
	ANSI_104_TEMPLATE,
	JIS_109_TEMPLATE,
	APPLE_MAGIC_US_TEMPLATE,
	APPLE_MAGIC_JIS_TEMPLATE
} from '$lib/templates';
import type { LayoutTemplate } from '$lib/models/types';

// KeyPicker.svelte の US_MODE_KEY_ALIASES と同等
const US_MODE_KEY_ALIASES: ReadonlyMap<string, string> = new Map([['¥', '\\']]);

// IME キー排他グループ
const APPLE_IME_KEYS: ReadonlySet<string> = new Set(['eisu', 'kana']);
const STANDARD_IME_KEYS: ReadonlySet<string> = new Set(['lang1', 'lang2', 'jp-kana']);

/**
 * KeyPicker.svelte の isKeyAvailable() と同等のピュア関数
 */
function isKeyAvailable(
	kanataName: string,
	usMode: boolean,
	templateKanataNames: ReadonlySet<string> | undefined,
	isAppleTemplate: boolean = false
): boolean {
	if (usMode && US_MODE_KEY_ALIASES.has(kanataName)) return false;
	// IME キーの排他制御: Apple テンプレートでは standard IME キーを非表示、逆も同様
	if (isAppleTemplate && STANDARD_IME_KEYS.has(kanataName)) return false;
	if (!isAppleTemplate && APPLE_IME_KEYS.has(kanataName)) return false;
	if (!templateKanataNames) return true;
	if (templateKanataNames.has(kanataName)) return true;
	if (!ALL_TEMPLATE_KANATA_NAMES.has(kanataName)) return true;
	if (usMode) return true;
	return false;
}

/** テンプレートから kanataName のセットを作成 */
function templateKanataSet(template: LayoutTemplate): ReadonlySet<string> {
	return new Set(template.keys.map((k) => k.kanataName).filter((n): n is string => n !== undefined));
}

// テンプレートごとの usMode を算出
function getUsMode(template: LayoutTemplate, jisToUsRemap = false): boolean {
	return jisToUsRemap || template.usLayout === true;
}

// テンプレートが Apple かどうか
function isApple(template: LayoutTemplate): boolean {
	return template.keOnly === true;
}

describe('isKeyAvailable フィルタリングポリシー', () => {
	const ansiNames = templateKanataSet(ANSI_104_TEMPLATE);
	const jisNames = templateKanataSet(JIS_109_TEMPLATE);
	const appleUsNames = templateKanataSet(APPLE_MAGIC_US_TEMPLATE);
	const appleJisNames = templateKanataSet(APPLE_MAGIC_JIS_TEMPLATE);

	describe('KA-01: grv が全テンプレートで利用可能', () => {
		it('ANSI-104 (usMode=true): grv が利用可能', () => {
			expect(isKeyAvailable('grv', getUsMode(ANSI_104_TEMPLATE), ansiNames, isApple(ANSI_104_TEMPLATE))).toBe(true);
		});

		it('JIS-109 (usMode=false): grv が利用可能', () => {
			expect(isKeyAvailable('grv', getUsMode(JIS_109_TEMPLATE), jisNames, isApple(JIS_109_TEMPLATE))).toBe(true);
		});

		it('Apple Magic US (usMode=true): grv が利用可能', () => {
			expect(isKeyAvailable('grv', getUsMode(APPLE_MAGIC_US_TEMPLATE), appleUsNames, isApple(APPLE_MAGIC_US_TEMPLATE))).toBe(true);
		});

		it('Apple Magic JIS (usMode=false): grv は templateKanataNames に含まれないが usMode ON で利用可能', () => {
			// Apple JIS にはデフォルトで grv がない — usMode=false だと false
			expect(isKeyAvailable('grv', false, appleJisNames, isApple(APPLE_MAGIC_JIS_TEMPLATE))).toBe(false);
			// jisToUsRemap=true (usMode ON) なら利用可能
			expect(isKeyAvailable('grv', true, appleJisNames, isApple(APPLE_MAGIC_JIS_TEMPLATE))).toBe(true);
		});
	});

	describe('KA-02: JIS 固有キー (henk, mhnk, ro) の表示ポリシー', () => {
		const jisSpecificKeys = ['henk', 'mhnk', 'ro'];

		it('JIS-109: JIS 固有キーが全て表示', () => {
			for (const key of jisSpecificKeys) {
				expect(isKeyAvailable(key, getUsMode(JIS_109_TEMPLATE), jisNames, isApple(JIS_109_TEMPLATE))).toBe(true);
			}
		});

		it('ANSI-104 (usMode=true): JIS 固有キーは usMode ON のため表示される', () => {
			for (const key of jisSpecificKeys) {
				expect(isKeyAvailable(key, getUsMode(ANSI_104_TEMPLATE), ansiNames, isApple(ANSI_104_TEMPLATE))).toBe(true);
			}
		});

		it('Apple JIS (usMode=false): テンプレートに含まれるキーのみ表示', () => {
			expect(isKeyAvailable('ro', false, appleJisNames, isApple(APPLE_MAGIC_JIS_TEMPLATE))).toBe(true);
			expect(isKeyAvailable('henk', false, appleJisNames, isApple(APPLE_MAGIC_JIS_TEMPLATE))).toBe(false);
			expect(isKeyAvailable('mhnk', false, appleJisNames, isApple(APPLE_MAGIC_JIS_TEMPLATE))).toBe(false);
		});
	});

	describe('KA-03: IME キー排他制御 — 非Apple テンプレート', () => {
		// 非Apple テンプレートでは lang1/lang2/jp-kana を表示、eisu/kana を非表示
		it('JIS-109: lang1/lang2 が表示される', () => {
			expect(isKeyAvailable('lang1', getUsMode(JIS_109_TEMPLATE), jisNames, false)).toBe(true);
			expect(isKeyAvailable('lang2', getUsMode(JIS_109_TEMPLATE), jisNames, false)).toBe(true);
		});

		it('JIS-109: jp-kana がテンプレートキーとして表示される', () => {
			expect(isKeyAvailable('jp-kana', getUsMode(JIS_109_TEMPLATE), jisNames, false)).toBe(true);
		});

		it('JIS-109: eisu/kana が非表示', () => {
			expect(isKeyAvailable('eisu', getUsMode(JIS_109_TEMPLATE), jisNames, false)).toBe(false);
			expect(isKeyAvailable('kana', getUsMode(JIS_109_TEMPLATE), jisNames, false)).toBe(false);
		});

		it('ANSI-104: lang1/lang2/jp-kana が表示される', () => {
			expect(isKeyAvailable('lang1', getUsMode(ANSI_104_TEMPLATE), ansiNames, false)).toBe(true);
			expect(isKeyAvailable('lang2', getUsMode(ANSI_104_TEMPLATE), ansiNames, false)).toBe(true);
			expect(isKeyAvailable('jp-kana', getUsMode(ANSI_104_TEMPLATE), ansiNames, false)).toBe(true);
		});

		it('ANSI-104: eisu/kana が非表示', () => {
			expect(isKeyAvailable('eisu', getUsMode(ANSI_104_TEMPLATE), ansiNames, false)).toBe(false);
			expect(isKeyAvailable('kana', getUsMode(ANSI_104_TEMPLATE), ansiNames, false)).toBe(false);
		});
	});

	describe('KA-04: IME キー排他制御 — Apple テンプレート', () => {
		// Apple テンプレートでは eisu/kana を表示、lang1/lang2/jp-kana を非表示
		it('Apple JIS: eisu/kana が表示される', () => {
			expect(isKeyAvailable('eisu', false, appleJisNames, true)).toBe(true);
			expect(isKeyAvailable('kana', false, appleJisNames, true)).toBe(true);
		});

		it('Apple JIS: lang1/lang2/jp-kana が非表示', () => {
			expect(isKeyAvailable('lang1', false, appleJisNames, true)).toBe(false);
			expect(isKeyAvailable('lang2', false, appleJisNames, true)).toBe(false);
			expect(isKeyAvailable('jp-kana', false, appleJisNames, true)).toBe(false);
		});

		it('Apple US: eisu/kana が表示される（usMode）', () => {
			expect(isKeyAvailable('eisu', getUsMode(APPLE_MAGIC_US_TEMPLATE), appleUsNames, true)).toBe(true);
			expect(isKeyAvailable('kana', getUsMode(APPLE_MAGIC_US_TEMPLATE), appleUsNames, true)).toBe(true);
		});

		it('Apple US: lang1/lang2/jp-kana が非表示', () => {
			expect(isKeyAvailable('lang1', getUsMode(APPLE_MAGIC_US_TEMPLATE), appleUsNames, true)).toBe(false);
			expect(isKeyAvailable('lang2', getUsMode(APPLE_MAGIC_US_TEMPLATE), appleUsNames, true)).toBe(false);
			expect(isKeyAvailable('jp-kana', getUsMode(APPLE_MAGIC_US_TEMPLATE), appleUsNames, true)).toBe(false);
		});
	});
});
