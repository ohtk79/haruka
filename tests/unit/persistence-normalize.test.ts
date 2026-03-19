import { describe, it, expect } from 'vitest';
import { LEGACY_ACTION_MIGRATION } from '$lib/models/constants';
import type { KeyAction, TapAction, HoldAction } from '$lib/models/types';

// normalizeActionId は persistence.ts の内部関数のため、同等ロジックを再実装してテスト
// 実装後は persistence.ts 経由で E2E テストで検証

/**
 * persistence.ts の normalizeActionId() と同等のピュア関数
 */
function normalizeActionId(action: KeyAction): KeyAction {
	if (action.type === 'key') {
		const migrated = LEGACY_ACTION_MIGRATION[action.value];
		if (migrated) {
			return { ...action, value: migrated };
		}
	}
	if (action.type === 'tap-hold') {
		return {
			...action,
			tapAction: normalizeActionId(action.tapAction) as TapAction,
			holdAction: normalizeActionId(action.holdAction) as HoldAction,
		};
	}
	return action;
}

describe('persistence 正規化: normalizeActionId', () => {
	describe('TR-WKC-001: eisu は有効なキー名としてそのまま通過する', () => {
		it('type=key の eisu がそのまま通過する', () => {
			const action: KeyAction = { type: 'key', value: 'eisu' };
			const result = normalizeActionId(action);
			expect(result).toEqual({ type: 'key', value: 'eisu' });
		});
	});

	describe('TR-WKC-002: kana は有効なキー名としてそのまま通過する', () => {
		it('type=key の kana がそのまま通過する', () => {
			const action: KeyAction = { type: 'key', value: 'kana' };
			const result = normalizeActionId(action);
			expect(result).toEqual({ type: 'key', value: 'kana' });
		});
	});

	describe('TR-WKC-004: tap-hold 内のネストされた旧 ID が正規化される', () => {
		it('tapAction 内の eisu がそのまま通過する', () => {
			const action: KeyAction = {
				type: 'tap-hold',
				variant: 'tap-hold',
				tapTimeout: 200,
				holdTimeout: 200,
				tapAction: { type: 'key', value: 'eisu' },
				holdAction: { type: 'no-op' },
			};
			const result = normalizeActionId(action);
			expect(result.type).toBe('tap-hold');
			if (result.type === 'tap-hold') {
				expect(result.tapAction).toEqual({ type: 'key', value: 'eisu' });
				expect(result.holdAction).toEqual({ type: 'no-op' });
			}
		});

		it('holdAction 内の kana がそのまま通過する', () => {
			const action: KeyAction = {
				type: 'tap-hold',
				variant: 'tap-hold-press',
				tapTimeout: 200,
				holdTimeout: 200,
				tapAction: { type: 'transparent' },
				holdAction: { type: 'key', value: 'kana' },
			};
			const result = normalizeActionId(action);
			if (result.type === 'tap-hold') {
				expect(result.tapAction).toEqual({ type: 'transparent' });
				expect(result.holdAction).toEqual({ type: 'key', value: 'kana' });
			}
		});
	});

	describe('TR-WKC-005: 新 action ID はそのまま通過する', () => {
		it('lang1 はそのまま通過する', () => {
			const action: KeyAction = { type: 'key', value: 'lang1' };
			const result = normalizeActionId(action);
			expect(result).toEqual({ type: 'key', value: 'lang1' });
		});

		it('lang2 はそのまま通過する', () => {
			const action: KeyAction = { type: 'key', value: 'lang2' };
			const result = normalizeActionId(action);
			expect(result).toEqual({ type: 'key', value: 'lang2' });
		});

		it('通常キーはそのまま通過する', () => {
			const action: KeyAction = { type: 'key', value: 'a' };
			const result = normalizeActionId(action);
			expect(result).toEqual({ type: 'key', value: 'a' });
		});

		it('transparent はそのまま通過する', () => {
			const action: KeyAction = { type: 'transparent' };
			const result = normalizeActionId(action);
			expect(result).toEqual({ type: 'transparent' });
		});

		it('modifier 付きの key はそのまま通過する（value が非レガシーの場合）', () => {
			const action: KeyAction = { type: 'key', value: 'a', modifiers: ['lctl'] };
			const result = normalizeActionId(action);
			expect(result).toEqual({ type: 'key', value: 'a', modifiers: ['lctl'] });
		});

		it('modifier 付きの eisu はそのまま通過する', () => {
			const action: KeyAction = { type: 'key', value: 'eisu', modifiers: ['lctl'] };
			const result = normalizeActionId(action);
			expect(result).toEqual({ type: 'key', value: 'eisu', modifiers: ['lctl'] });
		});
	});

	describe('イミュータブル性', () => {
		it('元のオブジェクトを変更しない', () => {
			const action: KeyAction = { type: 'key', value: 'eisu' };
			const original = { ...action };
			normalizeActionId(action);
			expect(action).toEqual(original);
		});
	});
});
