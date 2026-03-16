import { describe, it, expect } from 'vitest';
import { findKeyRangesInKbd } from '../../src/lib/components/preview/kbd-highlight';

// Minimal .kbd text for testing
const SIMPLE_KBD = `(defsrc
  a b c
)
(deflayer base
  1 2 3
)`;

const MULTI_ROW_KBD = `(defsrc
  a    b    c
  d    e    f
)
(deflayer base
  1    2    3
  4    5    6
)
(deflayer nav
  q    w    e
  r    t    y
)`;

describe('findKeyRangesInKbd', () => {
	describe('defsrc block key range detection', () => {
		it('finds a key in the defsrc block', () => {
			const ranges = findKeyRangesInKbd(SIMPLE_KBD, 'a');
			const defsrcRanges = ranges.filter((r) => r.section === 'defsrc');
			expect(defsrcRanges).toHaveLength(1);
			expect(SIMPLE_KBD.slice(defsrcRanges[0].from, defsrcRanges[0].to)).toBe('a');
		});

		it('finds a key in the middle of a row', () => {
			const ranges = findKeyRangesInKbd(SIMPLE_KBD, 'b');
			const defsrcRanges = ranges.filter((r) => r.section === 'defsrc');
			expect(defsrcRanges).toHaveLength(1);
			expect(SIMPLE_KBD.slice(defsrcRanges[0].from, defsrcRanges[0].to)).toBe('b');
		});

		it('finds a key at the end of a row', () => {
			const ranges = findKeyRangesInKbd(SIMPLE_KBD, 'c');
			const defsrcRanges = ranges.filter((r) => r.section === 'defsrc');
			expect(defsrcRanges).toHaveLength(1);
			expect(SIMPLE_KBD.slice(defsrcRanges[0].from, defsrcRanges[0].to)).toBe('c');
		});

		it('finds a key in a second row of multi-row defsrc', () => {
			const ranges = findKeyRangesInKbd(MULTI_ROW_KBD, 'e');
			const defsrcRanges = ranges.filter((r) => r.section === 'defsrc');
			expect(defsrcRanges).toHaveLength(1);
			expect(MULTI_ROW_KBD.slice(defsrcRanges[0].from, defsrcRanges[0].to)).toBe('e');
		});
	});

	describe('deflayer corresponding position detection', () => {
		it('finds the corresponding token in a single deflayer', () => {
			const ranges = findKeyRangesInKbd(SIMPLE_KBD, 'a');
			const layerRanges = ranges.filter((r) => r.section === 'deflayer');
			expect(layerRanges).toHaveLength(1);
			expect(SIMPLE_KBD.slice(layerRanges[0].from, layerRanges[0].to)).toBe('1');
			expect(layerRanges[0].layerIndex).toBe(0);
		});

		it('finds corresponding tokens across multiple deflayers', () => {
			const ranges = findKeyRangesInKbd(MULTI_ROW_KBD, 'b');
			const layerRanges = ranges.filter((r) => r.section === 'deflayer');
			expect(layerRanges).toHaveLength(2);
			expect(MULTI_ROW_KBD.slice(layerRanges[0].from, layerRanges[0].to)).toBe('2');
			expect(layerRanges[0].layerIndex).toBe(0);
			expect(MULTI_ROW_KBD.slice(layerRanges[1].from, layerRanges[1].to)).toBe('w');
			expect(layerRanges[1].layerIndex).toBe(1);
		});

		it('handles second-row key mapping across deflayers', () => {
			const ranges = findKeyRangesInKbd(MULTI_ROW_KBD, 'd');
			const layerRanges = ranges.filter((r) => r.section === 'deflayer');
			expect(layerRanges).toHaveLength(2);
			expect(MULTI_ROW_KBD.slice(layerRanges[0].from, layerRanges[0].to)).toBe('4');
			expect(MULTI_ROW_KBD.slice(layerRanges[1].from, layerRanges[1].to)).toBe('r');
		});

		it('includes both defsrc and deflayer ranges', () => {
			const ranges = findKeyRangesInKbd(SIMPLE_KBD, 'b');
			expect(ranges).toHaveLength(2); // 1 defsrc + 1 deflayer
			expect(ranges[0].section).toBe('defsrc');
			expect(ranges[1].section).toBe('deflayer');
		});
	});

	describe('edge cases', () => {
		it('returns empty array for non-existent key name', () => {
			const ranges = findKeyRangesInKbd(SIMPLE_KBD, 'z');
			expect(ranges).toEqual([]);
		});

		it('returns empty array for empty string input', () => {
			const ranges = findKeyRangesInKbd('', 'a');
			expect(ranges).toEqual([]);
		});

		it('returns empty array for kbd text without defsrc', () => {
			const kbdText = `(deflayer base
  1 2 3
)`;
			const ranges = findKeyRangesInKbd(kbdText, '1');
			expect(ranges).toEqual([]);
		});

		it('handles complex token names like @alias', () => {
			const kbdText = `(defsrc
  a b
)
(deflayer base
  @alias1 @alias2
)`;
			const ranges = findKeyRangesInKbd(kbdText, 'a');
			const layerRanges = ranges.filter((r) => r.section === 'deflayer');
			expect(layerRanges).toHaveLength(1);
			expect(kbdText.slice(layerRanges[0].from, layerRanges[0].to)).toBe('@alias1');
		});

		it('collects ranges from multiple deflayers', () => {
			const ranges = findKeyRangesInKbd(MULTI_ROW_KBD, 'a');
			// 1 defsrc + 2 deflayers
			expect(ranges).toHaveLength(3);
			expect(ranges.filter((r) => r.section === 'defsrc')).toHaveLength(1);
			expect(ranges.filter((r) => r.section === 'deflayer')).toHaveLength(2);
		});
	});
});
