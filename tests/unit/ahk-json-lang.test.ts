import { describe, it, expect } from 'vitest';
import { KANATA_TO_AHK_MAP } from '$lib/models/ahk-keycode-map';
import { KANATA_TO_KE_MAP } from '$lib/models/ke-keycode-map';

describe('.ahk 新 action ID マッピング (TR-WKC-016)', () => {
	it('lang1 → vk16 (VK_IME_ON)', () => {
		const entry = KANATA_TO_AHK_MAP['lang1'];
		expect(entry).toBeDefined();
		expect(entry.virtualKeyCode).toBe('vk16');
	});

	it('lang2 → vk1A (VK_IME_OFF)', () => {
		const entry = KANATA_TO_AHK_MAP['lang2'];
		expect(entry).toBeDefined();
		expect(entry.virtualKeyCode).toBe('vk1A');
	});

	it('jp-kana → vkF2 (KANA)', () => {
		const entry = KANATA_TO_AHK_MAP['jp-kana'];
		expect(entry).toBeDefined();
		expect(entry.virtualKeyCode).toBe('vkF2');
	});

	it('旧 kana/eisu エントリも互換性のため残存', () => {
		expect(KANATA_TO_AHK_MAP['kana']).toBeDefined();
		expect(KANATA_TO_AHK_MAP['eisu']).toBeDefined();
	});
});

describe('.json (Karabiner-Elements) 新 action ID マッピング (TR-WKC-017)', () => {
	it('lang1 → japanese_kana', () => {
		const entry = KANATA_TO_KE_MAP['lang1'];
		expect(entry).toBeDefined();
		expect(entry.fromKeyCode).toBe('japanese_kana');
	});

	it('lang2 → japanese_eisuu', () => {
		const entry = KANATA_TO_KE_MAP['lang2'];
		expect(entry).toBeDefined();
		expect(entry.fromKeyCode).toBe('japanese_eisuu');
	});

	it('jp-kana → japanese_pc_katakana', () => {
		const entry = KANATA_TO_KE_MAP['jp-kana'];
		expect(entry).toBeDefined();
		expect(entry.fromKeyCode).toBe('japanese_pc_katakana');
	});

	it('旧 kana/eisu エントリも互換性のため残存', () => {
		expect(KANATA_TO_KE_MAP['kana']).toBeDefined();
		expect(KANATA_TO_KE_MAP['eisu']).toBeDefined();
	});
});
