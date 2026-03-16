import { describe, it, expect } from 'vitest';
import {
	KANATA_TO_KE_MAP,
	getKeFromKeyCode,
	getKeToKeyCode,
	isKeUnsupported
} from '$lib/models/ke-keycode-map';
import { JIS_109_TEMPLATE } from '$lib/templates/jis109';

describe('ke-keycode-map', () => {
	describe('coverage', () => {
		it('should have a mapping for every key in JIS 109 template', () => {
			for (const key of JIS_109_TEMPLATE.keys) {
				if (!key.kanataName) continue;
				expect(
					KANATA_TO_KE_MAP[key.kanataName],
					`Missing KE mapping for kanata key: ${key.kanataName} (${key.id})`
				).toBeDefined();
			}
		});

		it('should have exactly 128 entries (109 template + 1 eisu + 1 fn + 7 media + 2 JIS int + 7 F13-F19 + 1 NumpadEqual)', () => {
			expect(Object.keys(KANATA_TO_KE_MAP)).toHaveLength(128);
		});
	});

	describe('alphabet keys', () => {
		it('maps a-z to same key_code', () => {
			for (const ch of 'abcdefghijklmnopqrstuvwxyz') {
				expect(getKeFromKeyCode(ch)).toBe(ch);
				expect(getKeToKeyCode(ch)).toBe(ch);
			}
		});
	});

	describe('number keys', () => {
		it('maps 0-9 to same key_code', () => {
			for (const n of '0123456789') {
				expect(getKeFromKeyCode(n)).toBe(n);
				expect(getKeToKeyCode(n)).toBe(n);
			}
		});
	});

	describe('henk/mhnk (from/to different)', () => {
		it('henk fromKeyCode is japanese_pc_xfer', () => {
			expect(getKeFromKeyCode('henk')).toBe('japanese_pc_xfer');
		});
		it('henk toKeyCode is japanese_kana', () => {
			expect(getKeToKeyCode('henk')).toBe('japanese_kana');
		});
		it('mhnk fromKeyCode is japanese_pc_nfer', () => {
			expect(getKeFromKeyCode('mhnk')).toBe('japanese_pc_nfer');
		});
		it('mhnk toKeyCode is japanese_eisuu', () => {
			expect(getKeToKeyCode('mhnk')).toBe('japanese_eisuu');
		});
	});

	describe('JIS-specific keys', () => {
		it('maps ¥ to international3', () => {
			expect(getKeFromKeyCode('¥')).toBe('international3');
			expect(getKeToKeyCode('¥')).toBe('international3');
		});
		it('maps ro to international1', () => {
			expect(getKeFromKeyCode('ro')).toBe('international1');
			expect(getKeToKeyCode('ro')).toBe('international1');
		});
	});

	describe('modifier keys', () => {
		it('maps lsft/rsft to left_shift/right_shift', () => {
			expect(getKeFromKeyCode('lsft')).toBe('left_shift');
			expect(getKeFromKeyCode('rsft')).toBe('right_shift');
		});
		it('maps lctl/rctl to left_control/right_control', () => {
			expect(getKeFromKeyCode('lctl')).toBe('left_control');
			expect(getKeFromKeyCode('rctl')).toBe('right_control');
		});
		it('maps lalt/ralt to left_option/right_option', () => {
			expect(getKeFromKeyCode('lalt')).toBe('left_option');
			expect(getKeFromKeyCode('ralt')).toBe('right_option');
		});
		it('maps lmet/rmet to left_command/right_command', () => {
			expect(getKeFromKeyCode('lmet')).toBe('left_command');
			expect(getKeFromKeyCode('rmet')).toBe('right_command');
		});
	});

	describe('media keys (unsupported)', () => {
		const mediaKeys = ['volu', 'vold', 'mute', 'pp', 'prev', 'next', 'stop'];

		it('all 7 media keys are marked as keUnsupported', () => {
			for (const key of mediaKeys) {
				expect(isKeUnsupported(key), `${key} should be marked unsupported`).toBe(true);
			}
		});

		it('non-media keys are not marked as keUnsupported', () => {
			expect(isKeUnsupported('a')).toBe(false);
			expect(isKeUnsupported('spc')).toBe(false);
			expect(isKeUnsupported('ret')).toBe(false);
		});
	});

	describe('getKeFromKeyCode/getKeToKeyCode', () => {
		it('returns undefined for unknown keys', () => {
			expect(getKeFromKeyCode('unknown-key')).toBeUndefined();
			expect(getKeToKeyCode('unknown-key')).toBeUndefined();
		});

		it('for keys without toKeyCode, getKeToKeyCode returns fromKeyCode', () => {
			expect(getKeToKeyCode('a')).toBe('a');
			expect(getKeToKeyCode('spc')).toBe('spacebar');
			expect(getKeToKeyCode('ret')).toBe('return_or_enter');
		});
	});

	describe('special keys', () => {
		it('maps common special keys correctly', () => {
			expect(getKeFromKeyCode('esc')).toBe('escape');
			expect(getKeFromKeyCode('tab')).toBe('tab');
			expect(getKeFromKeyCode('ret')).toBe('return_or_enter');
			expect(getKeFromKeyCode('spc')).toBe('spacebar');
			expect(getKeFromKeyCode('bspc')).toBe('delete_or_backspace');
			expect(getKeFromKeyCode('del')).toBe('delete_forward');
		});

		it('maps arrow keys correctly', () => {
			expect(getKeFromKeyCode('up')).toBe('up_arrow');
			expect(getKeFromKeyCode('down')).toBe('down_arrow');
			expect(getKeFromKeyCode('lft')).toBe('left_arrow');
			expect(getKeFromKeyCode('rght')).toBe('right_arrow');
		});
	});
});
