import { describe, it, expect } from 'vitest';
import { base64urlEncode, base64urlDecode } from '$lib/utils/base64url';

describe('base64url', () => {
	describe('roundtrip', () => {
		it('空の Uint8Array をラウンドトリップできる', () => {
			const original = new Uint8Array(0);
			const encoded = base64urlEncode(original);
			const decoded = base64urlDecode(encoded);
			expect(decoded).toEqual(original);
		});

		it('短いデータをラウンドトリップできる', () => {
			const original = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
			const encoded = base64urlEncode(original);
			const decoded = base64urlDecode(encoded);
			expect(decoded).toEqual(original);
		});

		it('バイナリデータ (0-255) をラウンドトリップできる', () => {
			const original = new Uint8Array(256);
			for (let i = 0; i < 256; i++) original[i] = i;
			const encoded = base64urlEncode(original);
			const decoded = base64urlDecode(encoded);
			expect(decoded).toEqual(original);
		});

		it('大きめのデータ (1KB) をラウンドトリップできる', () => {
			const original = new Uint8Array(1024);
			for (let i = 0; i < 1024; i++) original[i] = i % 256;
			const encoded = base64urlEncode(original);
			const decoded = base64urlDecode(encoded);
			expect(decoded).toEqual(original);
		});
	});

	describe('URL-safe characters', () => {
		it('エンコード結果に + / = が含まれない', () => {
			// 0xFB, 0xFF のようなバイトは標準 Base64 で + や / を生成しやすい
			const data = new Uint8Array([0xfb, 0xff, 0xfe, 0x3e, 0x3f]);
			const encoded = base64urlEncode(data);
			expect(encoded).not.toContain('+');
			expect(encoded).not.toContain('/');
			expect(encoded).not.toContain('=');
		});

		it('エンコード結果は [A-Za-z0-9_-] のみで構成される', () => {
			const data = new Uint8Array(128);
			for (let i = 0; i < 128; i++) data[i] = i * 2;
			const encoded = base64urlEncode(data);
			expect(encoded).toMatch(/^[A-Za-z0-9_-]*$/);
		});
	});

	describe('padding handling', () => {
		it('パディングなし (3の倍数バイト)', () => {
			const data = new Uint8Array([1, 2, 3]); // 3 bytes → 4 base64 chars, no padding
			const encoded = base64urlEncode(data);
			expect(encoded.length % 4).toBe(0);
			expect(base64urlDecode(encoded)).toEqual(data);
		});

		it('パディング1文字分 (3n+2バイト)', () => {
			const data = new Uint8Array([1, 2]); // 2 bytes → 3 base64 chars (1 padding removed)
			const encoded = base64urlEncode(data);
			expect(base64urlDecode(encoded)).toEqual(data);
		});

		it('パディング2文字分 (3n+1バイト)', () => {
			const data = new Uint8Array([1]); // 1 byte → 2 base64 chars (2 padding removed)
			const encoded = base64urlEncode(data);
			expect(base64urlDecode(encoded)).toEqual(data);
		});
	});
});
