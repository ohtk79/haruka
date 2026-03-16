import { describe, it, expect } from 'vitest';
import { JIS_TO_US_MAPPINGS, JIS_TO_US_MAP_BY_KEY } from '$lib/models/jis-us-map';
import { JIS_109_TEMPLATE } from '$lib/templates/jis109';

describe('JIS_TO_US_MAPPINGS', () => {
	it('should contain exactly 16 mapping records', () => {
		expect(JIS_TO_US_MAPPINGS).toHaveLength(16);
	});

	it('all physicalKeyIds should exist in JIS_109_TEMPLATE', () => {
		const templateKeyIds = new Set(JIS_109_TEMPLATE.keys.map((k) => k.id));
		for (const mapping of JIS_TO_US_MAPPINGS) {
			expect(templateKeyIds.has(mapping.physicalKeyId)).toBe(true);
		}
	});

	it('all aliasNames should be unique', () => {
		const names = JIS_TO_US_MAPPINGS.map((m) => m.aliasName);
		expect(new Set(names).size).toBe(names.length);
	});

	it('all aliasNames should have jus- prefix', () => {
		for (const mapping of JIS_TO_US_MAPPINGS) {
			expect(mapping.aliasName).toMatch(/^jus-/);
		}
	});

	it('needsReleaseKey should be false only for jus-yen and jus-ro', () => {
		for (const mapping of JIS_TO_US_MAPPINGS) {
			if (mapping.aliasName === 'jus-yen' || mapping.aliasName === 'jus-ro') {
				expect(mapping.needsReleaseKey).toBe(false);
			} else {
				expect(mapping.needsReleaseKey).toBe(true);
			}
		}
	});

	it('all normalExpr and shiftExpr should be non-empty strings', () => {
		for (const mapping of JIS_TO_US_MAPPINGS) {
			expect(mapping.normalExpr.length).toBeGreaterThan(0);
			expect(mapping.shiftExpr.length).toBeGreaterThan(0);
		}
	});

	it('all display labels (jisNormal, jisShift, usNormal, usShift) should be non-empty', () => {
		for (const mapping of JIS_TO_US_MAPPINGS) {
			expect(mapping.jisNormal.length).toBeGreaterThan(0);
			expect(mapping.jisShift.length).toBeGreaterThan(0);
			expect(mapping.usNormal.length).toBeGreaterThan(0);
			expect(mapping.usShift.length).toBeGreaterThan(0);
		}
	});

	it('kanataDefsrcName should match template key kanataName', () => {
		const templateKeyMap = new Map(JIS_109_TEMPLATE.keys.map((k) => [k.id, k.kanataName]));
		for (const mapping of JIS_TO_US_MAPPINGS) {
			const expectedKanataName = templateKeyMap.get(mapping.physicalKeyId);
			expect(mapping.kanataDefsrcName).toBe(expectedKanataName);
		}
	});
});

describe('JIS_TO_US_MAP_BY_KEY', () => {
	it('should have 16 entries', () => {
		expect(JIS_TO_US_MAP_BY_KEY.size).toBe(16);
	});

	it('should allow lookup by physicalKeyId', () => {
		const mapping = JIS_TO_US_MAP_BY_KEY.get('Digit2');
		expect(mapping).toBeDefined();
		expect(mapping!.aliasName).toBe('jus-2');
	});
});
