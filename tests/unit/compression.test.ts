import { describe, it, expect } from 'vitest';
import { compress, decompress, isCompressionStreamAvailable } from '$lib/utils/compression';

describe('compression', () => {
	describe('isCompressionStreamAvailable', () => {
		it('ブラウザ環境で利用可能かどうかを boolean で返す', () => {
			const result = isCompressionStreamAvailable();
			expect(typeof result).toBe('boolean');
		});
	});

	describe('compress / decompress roundtrip', () => {
		it('短いテキストデータをラウンドトリップできる', async () => {
			const original = new TextEncoder().encode('Hello, World!');
			const compressed = await compress(original);
			const decompressed = await decompress(compressed);
			expect(decompressed).toEqual(original);
		});

		it('JSON データをラウンドトリップできる', async () => {
			const json = JSON.stringify({ v: 1, t: 'jis-109', l: [{ n: 'layer-0', a: {} }] });
			const original = new TextEncoder().encode(json);
			const compressed = await compress(original);
			const decompressed = await decompress(compressed);
			expect(new TextDecoder().decode(decompressed)).toBe(json);
		});

		it('空のデータをラウンドトリップできる', async () => {
			const original = new Uint8Array(0);
			const compressed = await compress(original);
			const decompressed = await decompress(compressed);
			expect(decompressed).toEqual(original);
		});

		it('1KB の繰り返しデータを圧縮すると元より小さくなる', async () => {
			const original = new TextEncoder().encode('abcdefghij'.repeat(100));
			const compressed = await compress(original);
			expect(compressed.length).toBeLessThan(original.length);
			const decompressed = await decompress(compressed);
			expect(decompressed).toEqual(original);
		});
	});
});
