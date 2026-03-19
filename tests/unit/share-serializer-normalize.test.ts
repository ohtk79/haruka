import { describe, it, expect } from 'vitest';
import { fromShareAction, toShareAction } from '$lib/services/share-serializer';
import { LEGACY_ACTION_MIGRATION } from '$lib/models/constants';
import type { KeyAction } from '$lib/models/types';
import type { ShareAction } from '$lib/models/share-types';

describe('share-serializer 正規化: fromShareAction', () => {
	describe('TR-WKC-003: eisu/kana は有効なキー名としてそのまま通過する', () => {
		it('eisu の ShareAction がそのまま eisu として通過する', () => {
			const shareAction: ShareAction = { t: 'k', v: 'eisu' };
			const result = fromShareAction(shareAction);
			expect(result.type).toBe('key');
			if (result.type === 'key') {
				expect(result.value).toBe('eisu');
			}
		});

		it('kana の ShareAction がそのまま kana として通過する', () => {
			const shareAction: ShareAction = { t: 'k', v: 'kana' };
			const result = fromShareAction(shareAction);
			expect(result.type).toBe('key');
			if (result.type === 'key') {
				expect(result.value).toBe('kana');
			}
		});
	});

	describe('TR-WKC-004: tap-hold 内の eisu/kana はそのまま通過する', () => {
		it('tap-hold の tapAction に eisu が含まれる場合そのまま通過する', () => {
			const shareAction: ShareAction = {
				t: 'th',
				vr: 'th',
				to: 200,
				ho: 200,
				ta: { t: 'k', v: 'eisu' },
				ha: { t: 'x' },
			};
			const result = fromShareAction(shareAction);
			expect(result.type).toBe('tap-hold');
			if (result.type === 'tap-hold') {
				expect(result.tapAction).toEqual({ type: 'key', value: 'eisu' });
			}
		});
	});

	describe('新 action ID はそのまま通過する', () => {
		it('lang1 はそのまま通過する', () => {
			const shareAction: ShareAction = { t: 'k', v: 'lang1' };
			const result = fromShareAction(shareAction);
			expect(result).toEqual({ type: 'key', value: 'lang1' });
		});

		it('通常キー a はそのまま通過する', () => {
			const shareAction: ShareAction = { t: 'k', v: 'a' };
			const result = fromShareAction(shareAction);
			expect(result).toEqual({ type: 'key', value: 'a' });
		});

		it('modifier 付きはそのまま通過する', () => {
			const shareAction: ShareAction = { t: 'k', v: 'a', m: ['lctl'] };
			const result = fromShareAction(shareAction);
			expect(result).toEqual({ type: 'key', value: 'a', modifiers: ['lctl'] });
		});
	});
});
