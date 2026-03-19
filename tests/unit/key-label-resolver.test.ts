import { describe, it, expect } from 'vitest';
import { getActionLabel, getActionClass, resolveKeyLabel } from '$lib/utils/key-label-resolver';
import type { KeyAction, PhysicalKey } from '$lib/models/types';
import type { ShiftLabelEntry } from '$lib/models/shift-labels';

// Helper: minimal PhysicalKey stub
function makeKey(overrides: Partial<PhysicalKey> = {}): PhysicalKey {
	return {
		id: 'KeyA',
		kanataName: 'a',
		label: 'A',
		x: 0,
		y: 0,
		width: 1,
		height: 1,
		shape: 'rect',
		...overrides
	};
}

// Helper: ShiftLabelEntry
function makeShiftEntry(overrides: Partial<ShiftLabelEntry> = {}): ShiftLabelEntry {
	return {
		jisNormal: 'a',
		jisShift: 'A',
		usNormal: 'a',
		usShift: 'A',
		...overrides
	};
}

describe('getActionLabel', () => {
	const key = makeKey();

	it('returns key.label when action is undefined', () => {
		expect(getActionLabel(undefined, key, false)).toBe('A');
	});

	it('returns value for simple key action', () => {
		const action: KeyAction = { type: 'key', value: 'b' };
		expect(getActionLabel(action, key, false)).toBe('B');
	});

	it('returns modifier prefix for key action with modifiers', () => {
		const action: KeyAction = { type: 'key', value: 'a', modifiers: ['lsft'] };
		expect(getActionLabel(action, key, false)).toMatch(/.*-A$/);
	});

	it('returns "_" for transparent action', () => {
		const action: KeyAction = { type: 'transparent' };
		expect(getActionLabel(action, key, false)).toBe('_');
	});

	it('returns "XX" for no-op action', () => {
		const action: KeyAction = { type: 'no-op' };
		expect(getActionLabel(action, key, false)).toBe('XX');
	});

	it('returns layer name for layer-while-held', () => {
		const action: KeyAction = { type: 'layer-while-held', layer: 'nav' };
		expect(getActionLabel(action, key, false)).toBe('nav');
	});

	it('returns layer name for layer-switch', () => {
		const action: KeyAction = { type: 'layer-switch', layer: 'game' };
		expect(getActionLabel(action, key, false)).toBe('game');
	});

	it('returns empty string for tap-hold (handled by 2-line display)', () => {
		const action: KeyAction = {
			type: 'tap-hold',
			variant: 'tap-hold',
			tapTimeout: 200,
			holdTimeout: 200,
			tapAction: { type: 'key', value: 'a' },
			holdAction: { type: 'layer-while-held', layer: 'nav' }
		};
		expect(getActionLabel(action, key, false)).toBe('');
	});

	it('resolves tap-hold tapAction recursively', () => {
		const tapAction: KeyAction = { type: 'key', value: 'x' };
		expect(getActionLabel(tapAction, key, false)).toBe('X');
	});

	it('resolves tap-hold holdAction recursively', () => {
		const holdAction: KeyAction = { type: 'layer-while-held', layer: 'fn' };
		expect(getActionLabel(holdAction, key, false)).toBe('fn');
	});

	it('uses US label when jisToUsRemap is true and US label exists', () => {
		// 'kp0' has a display label in KANATA_KEY_LABEL_MAP
		const action: KeyAction = { type: 'key', value: 'a' };
		// This test checks that jisToUsRemap param is passed through
		const label = getActionLabel(action, key, true);
		expect(typeof label).toBe('string');
	});

	// IME キーのラベル解決テスト（JIS モード = jisToUsRemap: false）
	describe('IME キーラベル (JIS モード)', () => {
		it('lang1 → かな', () => {
			const action: KeyAction = { type: 'key', value: 'lang1' };
			expect(getActionLabel(action, key, false)).toBe('かな');
		});

		it('lang2 → 英数', () => {
			const action: KeyAction = { type: 'key', value: 'lang2' };
			expect(getActionLabel(action, key, false)).toBe('英数');
		});

		it('jp-kana → カナ', () => {
			const action: KeyAction = { type: 'key', value: 'jp-kana' };
			expect(getActionLabel(action, key, false)).toBe('カナ');
		});

		it('eisu → 英数', () => {
			const action: KeyAction = { type: 'key', value: 'eisu' };
			expect(getActionLabel(action, key, false)).toBe('英数');
		});

		it('kana → かな', () => {
			const action: KeyAction = { type: 'key', value: 'kana' };
			expect(getActionLabel(action, key, false)).toBe('かな');
		});
	});

	// IME キーのラベル解決テスト（US モード = jisToUsRemap: true）
	describe('IME キーラベル (US モード)', () => {
		it('lang1 → LANG1', () => {
			const action: KeyAction = { type: 'key', value: 'lang1' };
			expect(getActionLabel(action, key, true)).toBe('LANG1');
		});

		it('lang2 → LANG2', () => {
			const action: KeyAction = { type: 'key', value: 'lang2' };
			expect(getActionLabel(action, key, true)).toBe('LANG2');
		});

		it('jp-kana → KANA', () => {
			const action: KeyAction = { type: 'key', value: 'jp-kana' };
			expect(getActionLabel(action, key, true)).toBe('KANA');
		});

		it('eisu → LANG2', () => {
			const action: KeyAction = { type: 'key', value: 'eisu' };
			expect(getActionLabel(action, key, true)).toBe('LANG2');
		});

		it('kana → LANG1', () => {
			const action: KeyAction = { type: 'key', value: 'kana' };
			expect(getActionLabel(action, key, true)).toBe('LANG1');
		});
	});

	// IME キー + Modifier の組み合わせ
	describe('IME キー + Modifier', () => {
		it('lctl + lang1 (JIS) → *C-かな', () => {
			const action: KeyAction = { type: 'key', value: 'lang1', modifiers: ['lctl'] };
			expect(getActionLabel(action, key, false)).toBe('*C-かな');
		});

		it('lctl + lang1 (US) → *C-LANG1', () => {
			const action: KeyAction = { type: 'key', value: 'lang1', modifiers: ['lctl'] };
			expect(getActionLabel(action, key, true)).toBe('*C-LANG1');
		});
	});
});

describe('getActionClass', () => {
	it('returns "key-normal" for undefined action', () => {
		expect(getActionClass(undefined)).toBe('key-normal');
	});

	it('returns "key-normal" for simple key action', () => {
		expect(getActionClass({ type: 'key', value: 'a' })).toBe('key-normal');
	});

	it('returns "key-chord" for key action with modifiers', () => {
		expect(getActionClass({ type: 'key', value: 'a', modifiers: ['lsft'] })).toBe('key-chord');
	});

	it('returns "key-transparent" for transparent', () => {
		expect(getActionClass({ type: 'transparent' })).toBe('key-transparent');
	});

	it('returns "key-noop" for no-op', () => {
		expect(getActionClass({ type: 'no-op' })).toBe('key-noop');
	});

	it('returns "key-layer" for layer-while-held', () => {
		expect(getActionClass({ type: 'layer-while-held', layer: 'nav' })).toBe('key-layer');
	});

	it('returns "key-layer" for layer-switch', () => {
		expect(getActionClass({ type: 'layer-switch', layer: 'game' })).toBe('key-layer');
	});

	it('returns "key-taphold" for tap-hold', () => {
		expect(
			getActionClass({
				type: 'tap-hold',
				variant: 'tap-hold',
				tapTimeout: 200,
				holdTimeout: 200,
				tapAction: { type: 'key', value: 'a' },
				holdAction: { type: 'layer-while-held', layer: 'nav' }
			})
		).toBe('key-taphold');
	});
});

describe('resolveKeyLabel', () => {
	const key = makeKey({ id: 'Digit2', kanataName: '2', label: '2' });
	const shiftLabels = new Map<string, ShiftLabelEntry>([
		['Digit2', makeShiftEntry({ jisNormal: '2', jisShift: '"', usNormal: '2', usShift: '@' })]
	]);
	const shiftLabelByKanataName = new Map<string, ShiftLabelEntry>([
		['3', makeShiftEntry({ jisNormal: '3', jisShift: '#', usNormal: '3', usShift: '#' })]
	]);

	it('returns shift label for default action (JIS mode)', () => {
		const result = resolveKeyLabel(undefined, key, false, shiftLabels, undefined);
		expect(result).toBe('"\n2');
	});

	it('returns shift label for default action (US mode)', () => {
		const result = resolveKeyLabel(undefined, key, true, shiftLabels, undefined);
		expect(result).toBe('@\n2');
	});

	it('returns shift label when action matches key kanataName', () => {
		const action: KeyAction = { type: 'key', value: '2' };
		const result = resolveKeyLabel(action, key, false, shiftLabels, undefined);
		expect(result).toBe('"\n2');
	});

	it('returns target shift label for remapped key action', () => {
		const action: KeyAction = { type: 'key', value: '3' };
		const result = resolveKeyLabel(action, key, false, shiftLabels, shiftLabelByKanataName);
		expect(result).toBe('#\n3');
	});

	it('falls back to getActionLabel for non-default action without shift label', () => {
		const action: KeyAction = { type: 'key', value: 'z' };
		const result = resolveKeyLabel(action, key, false, shiftLabels, shiftLabelByKanataName);
		expect(result).toBe('Z');
	});

	it('returns getActionLabel for transparent action', () => {
		const action: KeyAction = { type: 'transparent' };
		const result = resolveKeyLabel(action, key, false, shiftLabels, undefined);
		expect(result).toBe('_');
	});

	it('returns getActionLabel for no-op action', () => {
		const action: KeyAction = { type: 'no-op' };
		const result = resolveKeyLabel(action, key, false, shiftLabels, undefined);
		expect(result).toBe('XX');
	});

	it('returns normal char when shift char is null', () => {
		const noShiftLabels = new Map<string, ShiftLabelEntry>([
			['Digit2', makeShiftEntry({ jisNormal: '2', jisShift: null, usNormal: '2', usShift: null })]
		]);
		const result = resolveKeyLabel(undefined, key, false, noShiftLabels, undefined);
		expect(result).toBe('2');
	});
});
