import { describe, expect, it } from 'vitest';
import { EMPTY_AHK_GENERATOR_RESULT } from '$lib/models/export-format';
import type { LayoutTemplate } from '$lib/models/types';
import {
	getSupportedFormats,
	isFormatStaticallySupported,
	resolveExportFormatStatuses
} from '$lib/services/export-format-support';

const LEGACY_TEMPLATE: LayoutTemplate = {
	id: 'legacy',
	name: 'Legacy',
	keys: []
};

const KE_ONLY_TEMPLATE: LayoutTemplate = {
	id: 'apple',
	name: 'Apple',
	keys: [],
	keOnly: true,
	supportedFormats: ['json']
};

const FULL_TEMPLATE: LayoutTemplate = {
	id: 'ansi-104',
	name: 'ANSI',
	keys: [],
	supportedFormats: ['kbd', 'json', 'ahk']
};

describe('export-format-support', () => {
	it('legacy template は kbd/json/json-unified を互換補完する', () => {
		expect(getSupportedFormats(LEGACY_TEMPLATE)).toEqual(['kbd', 'json', 'json-unified']);
		expect(isFormatStaticallySupported(LEGACY_TEMPLATE, 'kbd')).toBe(true);
		expect(isFormatStaticallySupported(LEGACY_TEMPLATE, 'ahk')).toBe(false);
	});

	it('supportedFormats を優先して判定する', () => {
		expect(getSupportedFormats(KE_ONLY_TEMPLATE)).toEqual(['json', 'json-unified']);
		expect(isFormatStaticallySupported(KE_ONLY_TEMPLATE, 'kbd')).toBe(false);
	});

	it('AHK issue があると unavailable になる', () => {
		const statuses = resolveExportFormatStatuses({
			template: FULL_TEMPLATE,
			kbdText: 'kbd',
			keJsonText: '{}',
			keUnifiedJsonText: '{}',
			ahkResult: {
				text: '',
				issues: [
					{
						format: 'ahk',
						severity: 'error',
						code: 'AHK_KEY_NOT_MAPPED',
						message: 'unsupported key'
					}
				],
				notices: []
			}
		});
		const ahkStatus = statuses.find((status) => status.format === 'ahk');
		expect(ahkStatus).toMatchObject({ available: false, disabledReason: 'unsupported key' });
	});

	it('AHK notice のみなら available を維持する', () => {
		const statuses = resolveExportFormatStatuses({
			template: FULL_TEMPLATE,
			kbdText: 'kbd',
			keJsonText: '{}',
			keUnifiedJsonText: '{}',
			ahkResult: {
				...EMPTY_AHK_GENERATOR_RESULT,
				text: '; ahk',
				notices: [
					{
						format: 'ahk',
						code: 'AHK_VARIANT_NORMALIZED',
						layerName: 'layer-1',
						keyId: 'CapsLock',
						originalVariant: 'tap-hold-press',
						convertedVariant: 'tap-hold',
						message: 'normalized',
						headerComment: 'layer-1 / CapsLock: tap-hold-press -> tap-hold'
					}
				]
			}
		});
		const ahkStatus = statuses.find((status) => status.format === 'ahk');
		expect(ahkStatus).toMatchObject({ available: true });
		expect(ahkStatus?.notices).toHaveLength(1);
	});
});