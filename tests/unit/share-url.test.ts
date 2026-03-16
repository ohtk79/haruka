// =============================================================================
// share-url テスト
// =============================================================================

import { describe, it, expect } from 'vitest';
import { encodeShareData, generateShareUrl, decodeShareData, extractEncodedFromHash } from '$lib/services/share-url';
import type { ShareData } from '$lib/models/share-types';
import { URL_HASH_PREFIX } from '$lib/models/constants';

// =============================================================================
// encodeShareData
// =============================================================================

describe('encodeShareData', () => {
	it('ShareData を Base64URL 文字列にエンコードできる', async () => {
		const data: ShareData = {
			v: 1,
			t: 'ansi-104',
			l: [{ n: 'layer-0', a: {} }]
		};
		const encoded = await encodeShareData(data);
		expect(typeof encoded).toBe('string');
		expect(encoded.length).toBeGreaterThan(0);
	});

	it('エンコード結果が URL-safe 文字のみを含む', async () => {
		const data: ShareData = {
			v: 1,
			t: 'jis-109',
			l: [
				{ n: 'layer-0', a: { KeyA: { t: 'k', v: 'z' } } },
				{ n: 'nav', a: { KeyB: { t: 'lh', l: 'nav' } } }
			],
			j: true,
			tt: 300
		};
		const encoded = await encodeShareData(data);
		// Base64URL: A-Z, a-z, 0-9, -, _ のみ（= なし）
		expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
	});

	it('同じデータは同じエンコード結果になる', async () => {
		const data: ShareData = {
			v: 1,
			t: 'ansi-104',
			l: [{ n: 'layer-0', a: { KeyA: { t: 'k', v: 'a' } } }]
		};
		const encoded1 = await encodeShareData(data);
		const encoded2 = await encodeShareData(data);
		expect(encoded1).toBe(encoded2);
	});
});

// =============================================================================
// generateShareUrl
// =============================================================================

describe('generateShareUrl', () => {
	it('ベース URL とハッシュフラグメントを組み合わせる', () => {
		const url = generateShareUrl('abc123', 'https://example.com/haruka');
		expect(url).toBe(`https://example.com/haruka#${URL_HASH_PREFIX}abc123`);
	});

	it('ベース URL にトレイリングスラッシュがあっても正しい', () => {
		const url = generateShareUrl('xyz', 'https://example.com/app/');
		expect(url).toBe(`https://example.com/app/#${URL_HASH_PREFIX}xyz`);
	});
});

// =============================================================================
// decodeShareData
// =============================================================================

describe('decodeShareData', () => {
	it('encodeShareData の結果をデコードして元のデータを復元できる', async () => {
		const original: ShareData = {
			v: 1,
			t: 'ansi-104',
			l: [{ n: 'layer-0', a: { KeyA: { t: 'k', v: 'z' } } }]
		};
		const encoded = await encodeShareData(original);
		const decoded = await decodeShareData(encoded);
		expect(decoded).toEqual(original);
	});

	it('複雑なデータのラウンドトリップが正しい', async () => {
		const original: ShareData = {
			v: 1,
			t: 'jis-109',
			l: [
				{
					n: 'layer-0',
					a: {
						KeyA: { t: 'k', v: 'z', m: ['lctl'] },
						KeyB: {
							t: 'th',
							vr: 'thp',
							to: 200,
							ho: 150,
							ta: { t: 'k', v: 'b' },
							ha: { t: 'lh', l: 'nav' }
						}
					}
				},
				{ n: 'nav', a: { KeyA: { t: 'k', v: 'h' } } }
			],
			j: true,
			tt: 300
		};
		const encoded = await encodeShareData(original);
		const decoded = await decodeShareData(encoded);
		expect(decoded).toEqual(original);
	});

	it('不正なBase64URLデータでエラーが発生する', async () => {
		await expect(decodeShareData('!!invalid!!')).rejects.toThrow();
	});
});

// =============================================================================
// extractEncodedFromHash
// =============================================================================

describe('extractEncodedFromHash', () => {
	it('#config=xxx からエンコード文字列を抽出する', () => {
		expect(extractEncodedFromHash('#config=abc123')).toBe('abc123');
	});

	it('# なしの config=xxx からも抽出できる', () => {
		expect(extractEncodedFromHash('config=abc123')).toBe('abc123');
	});

	it('config= プレフィックスがない場合は null を返す', () => {
		expect(extractEncodedFromHash('#other=abc')).toBeNull();
	});

	it('空のハッシュは null を返す', () => {
		expect(extractEncodedFromHash('')).toBeNull();
		expect(extractEncodedFromHash('#')).toBeNull();
	});
});
