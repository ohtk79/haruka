// =============================================================================
// Unit Tests: KeyPicker isKeyAvailable() フィルタリングポリシー (KA-01~03)
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

/**
 * KeyPicker.svelte の isKeyAvailable() と同等のピュア関数
 */
function isKeyAvailable(
	kanataName: string,
	usMode: boolean,
	templateKanataNames: ReadonlySet<string> | undefined
): boolean {
	if (usMode && US_MODE_KEY_ALIASES.has(kanataName)) return false;
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

describe('isKeyAvailable フィルタリングポリシー', () => {
	const ansiNames = templateKanataSet(ANSI_104_TEMPLATE);
	const jisNames = templateKanataSet(JIS_109_TEMPLATE);
	const appleUsNames = templateKanataSet(APPLE_MAGIC_US_TEMPLATE);
	const appleJisNames = templateKanataSet(APPLE_MAGIC_JIS_TEMPLATE);

	describe('KA-01: grv が全テンプレートで利用可能', () => {
		it('ANSI-104 (usMode=true): grv が利用可能', () => {
			expect(isKeyAvailable('grv', getUsMode(ANSI_104_TEMPLATE), ansiNames)).toBe(true);
		});

		it('JIS-109 (usMode=false): grv が利用可能', () => {
			expect(isKeyAvailable('grv', getUsMode(JIS_109_TEMPLATE), jisNames)).toBe(true);
		});

		it('Apple Magic US (usMode=true): grv が利用可能', () => {
			expect(isKeyAvailable('grv', getUsMode(APPLE_MAGIC_US_TEMPLATE), appleUsNames)).toBe(true);
		});

		it('Apple Magic JIS (usMode=false): grv は templateKanataNames に含まれないが usMode ON で利用可能', () => {
			// Apple JIS にはデフォルトで grv がない — usMode=false だと false
			expect(isKeyAvailable('grv', false, appleJisNames)).toBe(false);
			// jisToUsRemap=true (usMode ON) なら利用可能
			expect(isKeyAvailable('grv', true, appleJisNames)).toBe(true);
		});
	});

	describe('KA-02: JIS 固有キー (henk, mhnk, ro, kana) の表示ポリシー', () => {
		const jisSpecificKeys = ['henk', 'mhnk', 'ro', 'kana'];

		it('JIS-109: JIS 固有キーが全て表示', () => {
			for (const key of jisSpecificKeys) {
				expect(isKeyAvailable(key, getUsMode(JIS_109_TEMPLATE), jisNames)).toBe(true);
			}
		});

		it('ANSI-104 (usMode=true): JIS 固有キーは usMode ON のため表示される', () => {
			// usMode=true → rule 5 で全テンプレートキーが表示される
			for (const key of jisSpecificKeys) {
				expect(isKeyAvailable(key, getUsMode(ANSI_104_TEMPLATE), ansiNames)).toBe(true);
			}
		});

		it('Apple JIS (usMode=false): テンプレートに含まれるキーのみ表示', () => {
			// Apple JIS には ro, kana があるが henk, mhnk はない
			expect(isKeyAvailable('ro', false, appleJisNames)).toBe(true);
			expect(isKeyAvailable('kana', false, appleJisNames)).toBe(true);
			// henk, mhnk は JIS-109 にあるがApple JIS にはない → usMode=false では非表示
			expect(isKeyAvailable('henk', false, appleJisNames)).toBe(false);
			expect(isKeyAvailable('mhnk', false, appleJisNames)).toBe(false);
		});
	});

	describe('KA-03: eisu (Apple 固有) が非 Apple テンプレートで非表示', () => {
		it('Apple JIS: eisu が表示される', () => {
			expect(isKeyAvailable('eisu', false, appleJisNames)).toBe(true);
		});

		it('JIS-109 (usMode=false): eisu が非表示', () => {
			expect(isKeyAvailable('eisu', getUsMode(JIS_109_TEMPLATE), jisNames)).toBe(false);
		});

		it('ANSI-104 (usMode=true): eisu は usMode ON のため表示される', () => {
			// usMode=true → rule 5 で表示
			expect(isKeyAvailable('eisu', getUsMode(ANSI_104_TEMPLATE), ansiNames)).toBe(true);
		});

		it('Apple US (usMode=true): eisu は usMode ON のため表示される', () => {
			expect(isKeyAvailable('eisu', getUsMode(APPLE_MAGIC_US_TEMPLATE), appleUsNames)).toBe(true);
		});
	});
});
