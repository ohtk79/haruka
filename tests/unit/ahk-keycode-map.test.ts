import { describe, expect, it } from 'vitest';
import {
	getAhkHotkeyToken,
	getAhkKeyMapping,
	getAhkSendToken,
	hasAhkMapping
} from '$lib/models/ahk-keycode-map';

describe('ahk-keycode-map', () => {
	it('基本キーの AHK token を返す', () => {
		expect(getAhkHotkeyToken('a')).toBe('a');
		expect(getAhkSendToken('a')).toBe('a');
	});

	it('JIS 固有キーは sc/vk token を持つ', () => {
		expect(getAhkKeyMapping('¥')).toMatchObject({ hotkeyToken: 'sc07D', sendToken: 'sc07D' });
		expect(getAhkKeyMapping('mhnk')).toMatchObject({ hotkeyToken: 'vk1D', sendToken: 'vk1D' });
		expect(getAhkKeyMapping('ro')).toMatchObject({ hotkeyToken: 'sc073', sendToken: 'sc073' });
	});

	it('modifier キーは左右を保持した token を持つ', () => {
		expect(getAhkKeyMapping('lctl')).toMatchObject({ hotkeyToken: 'LCtrl', sendToken: 'LCtrl' });
		expect(getAhkKeyMapping('rsft')).toMatchObject({ hotkeyToken: 'RShift', sendToken: 'RShift' });
	});

	it('メディアキーをサポートする', () => {
		expect(hasAhkMapping('vold')).toBe(true);
		expect(getAhkKeyMapping('vold')).toMatchObject({ hotkeyToken: 'Volume_Down' });
	});

	it('未対応キーは undefined を返す', () => {
		expect(hasAhkMapping('unknown-key')).toBe(false);
		expect(getAhkKeyMapping('unknown-key')).toBeUndefined();
	});
});