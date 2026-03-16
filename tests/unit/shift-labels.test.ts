import { describe, it, expect } from 'vitest';
import { SHIFT_LABELS } from '$lib/models/shift-labels';
import { JIS_109_TEMPLATE } from '$lib/templates/jis109';

describe('SHIFT_LABELS', () => {
	it('should cover all keys in JIS_109_TEMPLATE', () => {
		for (const key of JIS_109_TEMPLATE.keys) {
			expect(SHIFT_LABELS.has(key.id), `Missing shift label for key: ${key.id}`).toBe(true);
		}
	});

	it('digit keys should have non-null jisShift and usShift', () => {
		const digitKeys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];
		for (const keyId of digitKeys) {
			const entry = SHIFT_LABELS.get(keyId);
			expect(entry, `Missing entry for ${keyId}`).toBeDefined();
			expect(entry!.jisShift, `${keyId} jisShift should not be null`).not.toBeNull();
			expect(entry!.usShift, `${keyId} usShift should not be null`).not.toBeNull();
		}
	});

	it('symbol keys should have non-null jisShift and usShift', () => {
		const symbolKeys = ['Minus', 'Equal', 'BracketLeft', 'BracketRight', 'Semicolon', 'Quote', 'Backslash', 'Slash'];
		for (const keyId of symbolKeys) {
			const entry = SHIFT_LABELS.get(keyId);
			expect(entry, `Missing entry for ${keyId}`).toBeDefined();
			expect(entry!.jisShift, `${keyId} jisShift should not be null`).not.toBeNull();
			expect(entry!.usShift, `${keyId} usShift should not be null`).not.toBeNull();
		}
	});

	it('JIS-specific keys should have non-null jisShift', () => {
		const jisKeys = ['IntlYen', 'IntlRo'];
		for (const keyId of jisKeys) {
			const entry = SHIFT_LABELS.get(keyId);
			expect(entry, `Missing entry for ${keyId}`).toBeDefined();
			expect(entry!.jisShift, `${keyId} jisShift should not be null`).not.toBeNull();
		}
	});

	it('IntlYen should have non-null usShift', () => {
		const entry = SHIFT_LABELS.get('IntlYen');
		expect(entry).toBeDefined();
		expect(entry!.usShift).not.toBeNull();
	});

	it('IntlRo should have null usShift (JIS-only key)', () => {
		const entry = SHIFT_LABELS.get('IntlRo');
		expect(entry).toBeDefined();
		expect(entry!.usNormal).toBe('Ro');
		expect(entry!.usShift).toBeNull();
	});

	it('alphabet keys should have uppercase jisShift and usShift', () => {
		const alphabetKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c) => `Key${c}`);
		for (const keyId of alphabetKeys) {
			const entry = SHIFT_LABELS.get(keyId);
			expect(entry, `Missing entry for ${keyId}`).toBeDefined();
			expect(entry!.jisShift).toBe(entry!.jisNormal.toUpperCase());
			expect(entry!.usShift).toBe(entry!.usNormal.toUpperCase());
		}
	});

	it('modifier and special keys should have null shift values', () => {
		const specialKeys = [
			'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
			'PrintScreen', 'ScrollLock', 'Pause', 'Backspace', 'Insert', 'Home', 'PageUp',
			'Tab', 'Enter', 'Delete', 'End', 'PageDown',
			'CapsLock', 'ShiftLeft', 'ShiftRight',
			'ControlLeft', 'ControlRight', 'MetaLeft', 'MetaRight', 'AltLeft', 'AltRight',
			'Space', 'ContextMenu',
			'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
		];
		for (const keyId of specialKeys) {
			const entry = SHIFT_LABELS.get(keyId);
			expect(entry, `Missing entry for ${keyId}`).toBeDefined();
			expect(entry!.jisShift, `${keyId} jisShift should be null`).toBeNull();
			expect(entry!.usShift, `${keyId} usShift should be null`).toBeNull();
		}
	});

	it('comma and period should have shift labels', () => {
		const commaEntry = SHIFT_LABELS.get('Comma');
		expect(commaEntry).toBeDefined();
		expect(commaEntry!.jisShift).toBe('<');
		expect(commaEntry!.usShift).toBe('<');

		const periodEntry = SHIFT_LABELS.get('Period');
		expect(periodEntry).toBeDefined();
		expect(periodEntry!.jisShift).toBe('>');
		expect(periodEntry!.usShift).toBe('>');
	});

	it('numpad keys should have Num as shift label', () => {
		const numpadKeys = [
			'NumLock', 'NumpadDivide', 'NumpadMultiply', 'NumpadSubtract',
			'Numpad7', 'Numpad8', 'Numpad9', 'NumpadAdd',
			'Numpad4', 'Numpad5', 'Numpad6',
			'Numpad1', 'Numpad2', 'Numpad3', 'NumpadEnter',
			'Numpad0', 'NumpadDecimal'
		];
		for (const keyId of numpadKeys) {
			const entry = SHIFT_LABELS.get(keyId);
			expect(entry, `Missing entry for ${keyId}`).toBeDefined();
			expect(entry!.jisShift, `${keyId} jisShift should be 'Num'`).toBe('Num');
			expect(entry!.usShift, `${keyId} usShift should be 'Num'`).toBe('Num');
		}
	});
});
