// =============================================================================
// UI terminology policy test
// =============================================================================

import { describe, it, expect } from 'vitest';
import enMessages from '../../messages/en.json';
import jaMessages from '../../messages/ja.json';

type MessageMap = Record<string, unknown>;

const UI_DISALLOWED_PATTERNS: RegExp[] = [
	/\bKE\b/,
	/KE\s*Only/i,
	/KE\s*専用/,
	/\.json\s*\(KE\)/i
];

function collectViolations(locale: string, messages: MessageMap): string[] {
	const violations: string[] = [];

	for (const [key, value] of Object.entries(messages)) {
		if (key === '$schema' || typeof value !== 'string') continue;

		for (const pattern of UI_DISALLOWED_PATTERNS) {
			if (pattern.test(value)) {
				violations.push(`${locale}:${key} => ${value}`);
				break;
			}
		}
	}

	return violations;
}

describe('UI terminology policy', () => {
	it('messages must use Karabiner-Elements in UI text (no KE abbreviation)', () => {
		const violations = [
			...collectViolations('en', enMessages as MessageMap),
			...collectViolations('ja', jaMessages as MessageMap)
		];
		expect(violations).toEqual([]);
	});

	it('messages must not include Karabier typo', () => {
		const serialized = JSON.stringify({ enMessages, jaMessages });
		expect(serialized).not.toContain('Karabier-Elements');
	});
});
