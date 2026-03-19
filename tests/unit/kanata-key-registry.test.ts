import { describe, it, expect } from 'vitest';
import { VALID_KANATA_KEY_NAMES } from '$lib/models/kanata-key-registry';
import { JIS_109_TEMPLATE } from '$lib/templates/jis109';
import { ANSI_104_TEMPLATE } from '$lib/templates/ansi104';
import { APPLE_MAGIC_JIS_TEMPLATE } from '$lib/templates/apple-magic-jis';
import { APPLE_MAGIC_US_TEMPLATE } from '$lib/templates/apple-magic-us';
import { JIS_TO_US_MAPPINGS } from '$lib/models/jis-us-map';
import { KANATA_KEY_LABEL_MAP, US_KEY_LABELS } from '$lib/utils/kanata-keys';

/** S- プレフィックスを除去して実キー名を抽出 */
function extractKeyName(expr: string): string {
	return expr.startsWith('S-') ? expr.slice(2) : expr;
}

describe('kanata-key-registry', () => {
	it('JIS 109 テンプレートの全キーが VALID', () => {
		for (const key of JIS_109_TEMPLATE.keys) {
			if (!key.kanataName) continue;
			expect(
				VALID_KANATA_KEY_NAMES.has(key.kanataName),
				`JIS 109 key "${key.kanataName}" (${key.id}) is not in registry`
			).toBe(true);
		}
	});

	it('ANSI 104 テンプレートの全キーが VALID', () => {
		for (const key of ANSI_104_TEMPLATE.keys) {
			if (!key.kanataName) continue;
			expect(
				VALID_KANATA_KEY_NAMES.has(key.kanataName),
				`ANSI 104 key "${key.kanataName}" (${key.id}) is not in registry`
			).toBe(true);
		}
	});

	it('JIS→US 変換の全キー名が VALID（S- プレフィックス除去後）', () => {
		for (const mapping of JIS_TO_US_MAPPINGS) {
			const normalKey = extractKeyName(mapping.normalExpr);
			expect(
				VALID_KANATA_KEY_NAMES.has(normalKey),
				`normalExpr key "${normalKey}" from ${mapping.aliasName} is not in registry`
			).toBe(true);

			const shiftKey = extractKeyName(mapping.shiftExpr);
			expect(
				VALID_KANATA_KEY_NAMES.has(shiftKey),
				`shiftExpr key "${shiftKey}" from ${mapping.aliasName} is not in registry`
			).toBe(true);
		}
	});

	it('不正キー名 int1 はレジストリに含まれない', () => {
		expect(VALID_KANATA_KEY_NAMES.has('int1')).toBe(false);
	});

	it('不正キー名 int3 はレジストリに含まれない', () => {
		expect(VALID_KANATA_KEY_NAMES.has('int3')).toBe(false);
	});

	// IME キー 5 種が全てレジストリに登録されている
	describe('IME キーのレジストリ登録', () => {
		const imeKeys = ['eisu', 'kana', 'lang1', 'lang2', 'jp-kana'];
		for (const key of imeKeys) {
			it(`${key} がレジストリに存在する`, () => {
				expect(VALID_KANATA_KEY_NAMES.has(key)).toBe(true);
			});
		}
	});

	// IME キーの KANATA_KEY_LABEL_MAP エントリ
	describe('IME キーの displayLabel 整合性', () => {
		it('lang1 の displayLabel は "かな"', () => {
			expect(KANATA_KEY_LABEL_MAP.get('lang1')).toBe('かな');
		});
		it('lang2 の displayLabel は "英数"', () => {
			expect(KANATA_KEY_LABEL_MAP.get('lang2')).toBe('英数');
		});
		it('jp-kana の displayLabel は "カナ"', () => {
			expect(KANATA_KEY_LABEL_MAP.get('jp-kana')).toBe('カナ');
		});
		it('eisu の displayLabel は "英数"', () => {
			expect(KANATA_KEY_LABEL_MAP.get('eisu')).toBe('英数');
		});
		it('kana の displayLabel は "かな"', () => {
			expect(KANATA_KEY_LABEL_MAP.get('kana')).toBe('かな');
		});
	});

	// IME キーの US_KEY_LABELS エントリ
	describe('IME キーの US ラベル整合性', () => {
		it('lang1 の US ラベルは "LANG1"', () => {
			expect(US_KEY_LABELS.get('lang1')).toBe('LANG1');
		});
		it('lang2 の US ラベルは "LANG2"', () => {
			expect(US_KEY_LABELS.get('lang2')).toBe('LANG2');
		});
		it('jp-kana の US ラベルは "KANA"', () => {
			expect(US_KEY_LABELS.get('jp-kana')).toBe('KANA');
		});
		it('eisu の US ラベルは "LANG2"', () => {
			expect(US_KEY_LABELS.get('eisu')).toBe('LANG2');
		});
		it('kana の US ラベルは "LANG1"', () => {
			expect(US_KEY_LABELS.get('kana')).toBe('LANG1');
		});
	});

	// Apple テンプレートに eisu/kana が存在し、非 Apple テンプレートには存在しない
	describe('テンプレート別 IME キー存在チェック', () => {
		const jisKeys = new Set(JIS_109_TEMPLATE.keys.map((k) => k.kanataName).filter(Boolean));
		const ansiKeys = new Set(ANSI_104_TEMPLATE.keys.map((k) => k.kanataName).filter(Boolean));
		const appleJisKeys = new Set(APPLE_MAGIC_JIS_TEMPLATE.keys.map((k) => k.kanataName).filter(Boolean));
		const appleUsKeys = new Set(APPLE_MAGIC_US_TEMPLATE.keys.map((k) => k.kanataName).filter(Boolean));

		it('JIS 109 テンプレートに jp-kana が含まれる', () => {
			expect(jisKeys.has('jp-kana')).toBe(true);
		});

		it('Apple JIS テンプレートに eisu/kana が含まれる', () => {
			expect(appleJisKeys.has('eisu')).toBe(true);
			expect(appleJisKeys.has('kana')).toBe(true);
		});

		it('Apple JIS テンプレートに jp-kana が含まれない', () => {
			expect(appleJisKeys.has('jp-kana')).toBe(false);
		});

		it('ANSI 104 テンプレートに eisu/kana が含まれない', () => {
			expect(ansiKeys.has('eisu')).toBe(false);
			expect(ansiKeys.has('kana')).toBe(false);
		});

		it('Apple US テンプレートに eisu/kana が含まれない（物理キー無し）', () => {
			// Apple US は物理キーボードに eisu/kana が無い
			expect(appleUsKeys.has('eisu')).toBe(false);
			expect(appleUsKeys.has('kana')).toBe(false);
		});
	});
});
