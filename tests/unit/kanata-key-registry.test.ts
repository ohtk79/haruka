import { describe, it, expect } from 'vitest';
import { VALID_KANATA_KEY_NAMES } from '$lib/models/kanata-key-registry';
import { JIS_109_TEMPLATE } from '$lib/templates/jis109';
import { ANSI_104_TEMPLATE } from '$lib/templates/ansi104';
import { JIS_TO_US_MAPPINGS } from '$lib/models/jis-us-map';

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
});
