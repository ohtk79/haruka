// =============================================================================
// i18n message key integrity test
// =============================================================================

import { describe, it, expect } from 'vitest';
import enMessages from '../../messages/en.json';
import jaMessages from '../../messages/ja.json';

type MessageMap = Record<string, unknown>;

const SCHEMA_KEY = '$schema';

function getMessageKeys(messages: MessageMap): string[] {
	return Object.keys(messages)
		.filter((key) => key !== SCHEMA_KEY)
		.sort();
}

describe('i18n message key integrity', () => {
	it('ja/en message files must have the exact same key set', () => {
		const jaKeys = getMessageKeys(jaMessages as MessageMap);
		const enKeys = getMessageKeys(enMessages as MessageMap);

		const jaSet = new Set(jaKeys);
		const enSet = new Set(enKeys);

		const missingInEn = jaKeys.filter((key) => !enSet.has(key));
		const missingInJa = enKeys.filter((key) => !jaSet.has(key));

		expect({ missingInEn, missingInJa }).toEqual({
			missingInEn: [],
			missingInJa: []
		});
	});
});
