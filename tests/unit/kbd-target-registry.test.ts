import { describe, it, expect } from 'vitest';
import {
	resolveKbdAction,
	KBD_TARGET_REGISTRY,
	type KbdActionStrategy
} from '$lib/models/kbd-target-registry';
import type { KbdTargetOs } from '$lib/models/types';

describe('resolveKbdAction', () => {
	describe('lang1 × target', () => {
		it('Windows → fixed-arbitrary-code 22 (VK_IME_ON)', () => {
			const result = resolveKbdAction('lang1', 'windows');
			expect(result.type).toBe('fixed-arbitrary-code');
			if (result.type === 'fixed-arbitrary-code') {
				expect(result.code).toBe(22);
				expect(result.kanataExpr).toBe('(arbitrary-code 22)');
				expect(result.description).toBe('VK_IME_ON');
			}
		});

		it('macOS → native-key kana', () => {
			const result = resolveKbdAction('lang1', 'macos');
			expect(result.type).toBe('native-key');
			if (result.type === 'native-key') {
				expect(result.kanataToken).toBe('kana');
			}
		});

		it('Linux → unsupported', () => {
			const result = resolveKbdAction('lang1', 'linux');
			expect(result.type).toBe('unsupported');
		});
	});

	describe('lang2 × target', () => {
		it('Windows → fixed-arbitrary-code 26 (VK_IME_OFF)', () => {
			const result = resolveKbdAction('lang2', 'windows');
			expect(result.type).toBe('fixed-arbitrary-code');
			if (result.type === 'fixed-arbitrary-code') {
				expect(result.code).toBe(26);
				expect(result.kanataExpr).toBe('(arbitrary-code 26)');
				expect(result.description).toBe('VK_IME_OFF');
			}
		});

		it('macOS → native-key eisu', () => {
			const result = resolveKbdAction('lang2', 'macos');
			expect(result.type).toBe('native-key');
			if (result.type === 'native-key') {
				expect(result.kanataToken).toBe('eisu');
			}
		});

		it('Linux → unsupported', () => {
			const result = resolveKbdAction('lang2', 'linux');
			expect(result.type).toBe('unsupported');
		});
	});

	describe('jp-kana × target', () => {
		it('Windows → native-key katahira（deflocalkeys-wintercept で定義）', () => {
			const result = resolveKbdAction('jp-kana', 'windows');
			expect(result.type).toBe('native-key');
			if (result.type === 'native-key') {
				expect(result.kanataToken).toBe('katahira');
			}
		});

		it('macOS → native-key kana', () => {
			const result = resolveKbdAction('jp-kana', 'macos');
			expect(result.type).toBe('native-key');
			if (result.type === 'native-key') {
				expect(result.kanataToken).toBe('kana');
			}
		});

		it('Linux → native-key kana', () => {
			const result = resolveKbdAction('jp-kana', 'linux');
			expect(result.type).toBe('native-key');
			if (result.type === 'native-key') {
				expect(result.kanataToken).toBe('kana');
			}
		});
	});

	describe('未登録 action ID のフォールバック', () => {
		it('通常キーはそのまま native-key として通過する', () => {
			const result = resolveKbdAction('a', 'windows');
			expect(result).toEqual({ type: 'native-key', kanataToken: 'a' });
		});

		it('henk など他の JIS キーもそのまま通過する', () => {
			const result = resolveKbdAction('henk', 'macos');
			expect(result).toEqual({ type: 'native-key', kanataToken: 'henk' });
		});
	});

	describe('レジストリの整合性', () => {
		it('全登録 action ID × target の戦略が定義されている', () => {
			const targets: KbdTargetOs[] = ['windows', 'macos', 'linux'];
			for (const [actionId, targetMap] of KBD_TARGET_REGISTRY) {
				for (const target of targets) {
					const strategy = targetMap.get(target);
					expect(strategy, `${actionId} × ${target} に戦略がない`).toBeDefined();
				}
			}
		});

		it('resolveKbdAction は同一入力に対して常に同一結果を返す（純粋関数）', () => {
			const r1 = resolveKbdAction('lang1', 'windows');
			const r2 = resolveKbdAction('lang1', 'windows');
			expect(r1).toEqual(r2);
		});
	});
});
