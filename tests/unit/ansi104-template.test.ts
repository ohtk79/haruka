import { describe, it, expect } from 'vitest';
import { ANSI_104_TEMPLATE } from '$lib/templates/ansi104';
import { TEMPLATES, DEFAULT_TEMPLATE, getTemplateById } from '$lib/templates';

describe('ANSI 104 Template', () => {
	it('should have id "ansi-104" and name "104(ANSI)"', () => {
		expect(ANSI_104_TEMPLATE.id).toBe('ansi-104');
		expect(ANSI_104_TEMPLATE.name).toBe('104(ANSI)');
	});

	it('should have exactly 104 keys', () => {
		expect(ANSI_104_TEMPLATE.keys).toHaveLength(104);
	});

	it('should have correct row-by-row key counts', () => {
		const byRow = new Map<number, number>();
		for (const key of ANSI_104_TEMPLATE.keys) {
			const count = byRow.get(key.y) ?? 0;
			byRow.set(key.y, count + 1);
		}
		expect(byRow.get(0)).toBe(16); // Function keys
		expect(byRow.get(1.5)).toBe(21); // Number row
		expect(byRow.get(2.5)).toBe(21); // QWERTY row
		expect(byRow.get(3.5)).toBe(16); // Home row
		expect(byRow.get(4.5)).toBe(17); // Shift row
		expect(byRow.get(5.5)).toBe(13); // Space row
	});

	it('should have main area width of 15u for each row', () => {
		// Main area keys are those with x < 15
		const rows = [1.5, 2.5, 3.5, 4.5, 5.5];
		for (const y of rows) {
			const mainKeys = ANSI_104_TEMPLATE.keys.filter((k) => k.y === y && k.x < 15);
			const minX = Math.min(...mainKeys.map((k) => k.x));
			const maxEnd = Math.max(...mainKeys.map((k) => k.x + k.width));
			expect(maxEnd - minX).toBeCloseTo(15, 5);
		}
	});

	it('should have no shape property on any key (all rect)', () => {
		for (const key of ANSI_104_TEMPLATE.keys) {
			expect(key.shape).toBeUndefined();
		}
	});

	it('should have unique kanataName for all keys', () => {
		const names = ANSI_104_TEMPLATE.keys.map((k) => k.kanataName);
		const unique = new Set(names);
		expect(unique.size).toBe(names.length);
	});

	it('should have unique id for all keys', () => {
		const ids = ANSI_104_TEMPLATE.keys.map((k) => k.id);
		const unique = new Set(ids);
		expect(unique.size).toBe(ids.length);
	});

	it('should use US layout labels for ANSI-specific keys', () => {
		const keyMap = new Map(ANSI_104_TEMPLATE.keys.map((k) => [k.id, k]));
		expect(keyMap.get('Backquote')!.label).toBe('`');
		expect(keyMap.get('Equal')!.label).toBe('=');
		expect(keyMap.get('BracketLeft')!.label).toBe('[');
		expect(keyMap.get('BracketRight')!.label).toBe(']');
		expect(keyMap.get('Quote')!.label).toBe("'");
		expect(keyMap.get('Backslash')!.label).toBe('\\');
	});

	it('should have ANSI-specific key sizes', () => {
		const keyMap = new Map(ANSI_104_TEMPLATE.keys.map((k) => [k.id, k]));
		expect(keyMap.get('Backspace')!.width).toBe(2);
		expect(keyMap.get('Enter')!.width).toBe(2.25);
		expect(keyMap.get('Enter')!.y).toBe(3.5); // Row 3 (not Row 2)
		expect(keyMap.get('Backslash')!.width).toBe(1.5);
		expect(keyMap.get('Backslash')!.y).toBe(2.5); // Row 2 (not Row 3)
		expect(keyMap.get('ShiftRight')!.width).toBe(2.75);
		expect(keyMap.get('Space')!.width).toBe(6.25);
		expect(keyMap.get('ControlLeft')!.width).toBe(1.25);
		expect(keyMap.get('ControlRight')!.width).toBe(1.25);
	});

	it('should NOT contain JIS-specific keys', () => {
		const ids = new Set(ANSI_104_TEMPLATE.keys.map((k) => k.id));
		expect(ids.has('IntlYen')).toBe(false);
		expect(ids.has('IntlRo')).toBe(false);
		expect(ids.has('NonConvert')).toBe(false);
		expect(ids.has('Convert')).toBe(false);
		expect(ids.has('KanaMode')).toBe(false);
	});
});

describe('Template Registry', () => {
	it('should contain ANSI 104 and JIS 109 templates', () => {
		expect(TEMPLATES).toHaveLength(4);
		expect(TEMPLATES[0].id).toBe('ansi-104');
		expect(TEMPLATES[1].id).toBe('jis-109');
		expect(TEMPLATES[2].id).toBe('apple-us');
		expect(TEMPLATES[3].id).toBe('apple-jis');
	});

	it('should have ANSI 104 as default template', () => {
		expect(DEFAULT_TEMPLATE.id).toBe('ansi-104');
	});

	it('should find templates by ID', () => {
		expect(getTemplateById('ansi-104')).toBe(ANSI_104_TEMPLATE);
		expect(getTemplateById('jis-109')).toBeDefined();
		expect(getTemplateById('jis-109')!.id).toBe('jis-109');
	});

	it('should return undefined for unknown template ID', () => {
		expect(getTemplateById('unknown')).toBeUndefined();
		expect(getTemplateById('')).toBeUndefined();
	});
});
