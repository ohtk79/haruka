import { describe, it, expect } from 'vitest';
import { migrateV1ToV2, migrateV2ToV3, migrateV3ToV4, needsMigration, parseAndMigrate, CURRENT_VERSION } from '$lib/services/migration';
import type { SerializedEditorState, VersionedStorage } from '$lib/models/types';

// =============================================================================
// Test Helpers
// =============================================================================

function createV1State(overrides?: Partial<SerializedEditorState>): SerializedEditorState {
	return {
		templateId: 'jis-109',
		layers: [
			{
				name: 'base',
				actions: {
					KeyA: { type: 'key', value: 'a' }
				}
			}
		],
		selectedKeyId: null,
		activeLayerIndex: 0,
		...overrides
	};
}

// =============================================================================
// Tests
// =============================================================================

describe('migration', () => {
	describe('needsMigration', () => {
		it('returns true for v1 data (no version field)', () => {
			const v1 = createV1State();
			expect(needsMigration(v1)).toBe(true);
		});

		it('returns true for versioned data with older version', () => {
			const old: VersionedStorage = { version: 1, data: createV1State() };
			expect(needsMigration(old)).toBe(true);
		});

		it('returns false for current version data', () => {
			const current: VersionedStorage = { version: CURRENT_VERSION, data: createV1State() };
			expect(needsMigration(current)).toBe(false);
		});

		it('returns false for null/undefined', () => {
			expect(needsMigration(null)).toBe(false);
			expect(needsMigration(undefined)).toBe(false);
		});
	});

	describe('migrateV1ToV2: output-chord → key+modifiers', () => {
		it('converts output-chord to key with modifiers', () => {
			const v1 = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyA: { type: 'output-chord', modifiers: ['lctl'], key: 'c' } as any
						}
					}
				]
			});

			const result = migrateV1ToV2(v1);
			const action = result.layers[0].actions['KeyA'];
			expect(action.type).toBe('key');
			expect((action as any).value).toBe('c');
			expect((action as any).modifiers).toEqual(['C']);
		});

		it('handles output-chord with multiple modifiers', () => {
			const v1 = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyA: {
								type: 'output-chord',
								modifiers: ['lctl', 'lsft'],
								key: 'a'
							} as any
						}
					}
				]
			});

			const result = migrateV1ToV2(v1);
			const action = result.layers[0].actions['KeyA'] as any;
			expect(action.type).toBe('key');
			expect(action.modifiers).toEqual(['C', 'S']);
		});
	});

	describe('migrateV1ToV2: layer-while-held → tap-hold wrap', () => {
		it('wraps top-level layer-while-held in tap-hold', () => {
			const v1 = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							Space: { type: 'layer-while-held', layer: 'nav' } as any
						}
					}
				]
			});

			const result = migrateV1ToV2(v1);
			const action = result.layers[0].actions['Space'] as any;
			expect(action.type).toBe('tap-hold');
			expect(action.variant).toBe('tap-hold-press');
			expect(action.tapTimeout).toBe(200);
			expect(action.holdTimeout).toBe(200);
			expect(action.tapAction).toEqual({ type: 'transparent' });
			expect(action.holdAction).toEqual({ type: 'layer-while-held', layer: 'nav' });
		});
	});

	describe('migrateV1ToV2: layer-switch → tap-hold wrap', () => {
		it('wraps top-level layer-switch in tap-hold', () => {
			const v1 = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyG: { type: 'layer-switch', layer: 'gaming' } as any
						}
					}
				]
			});

			const result = migrateV1ToV2(v1);
			const action = result.layers[0].actions['KeyG'] as any;
			expect(action.type).toBe('tap-hold');
			expect(action.variant).toBe('tap-hold-press');
			expect(action.holdAction).toEqual({ type: 'layer-switch', layer: 'gaming' });
		});
	});

	describe('migrateV1ToV2: new format passthrough', () => {
		it('passes through key actions unchanged', () => {
			const v1 = createV1State();
			const result = migrateV1ToV2(v1);
			expect(result.layers[0].actions['KeyA']).toEqual({ type: 'key', value: 'a' });
		});

		it('passes through transparent/no-op actions', () => {
			const v1 = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyA: { type: 'transparent' },
							KeyB: { type: 'no-op' }
						}
					}
				]
			});

			const result = migrateV1ToV2(v1);
			expect(result.layers[0].actions['KeyA']).toEqual({ type: 'transparent' });
			expect(result.layers[0].actions['KeyB']).toEqual({ type: 'no-op' });
		});
	});

	describe('migrateV1ToV2: adds KE timeout defaults', () => {
		it('adds keAloneTimeout and keHeldThreshold defaults', () => {
			const v1 = createV1State();
			const result = migrateV1ToV2(v1);
			expect(result.keAloneTimeout).toBe(1000);
			expect(result.keHeldThreshold).toBe(500);
		});

		it('preserves existing timeout values', () => {
			const v1 = createV1State({ keAloneTimeout: 2000, keHeldThreshold: 800 });
			const result = migrateV1ToV2(v1);
			expect(result.keAloneTimeout).toBe(2000);
			expect(result.keHeldThreshold).toBe(800);
		});
	});

	describe('migrateV1ToV2: idempotency', () => {
		it('applying migration twice produces same result', () => {
			const v1 = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyA: { type: 'output-chord', modifiers: ['lctl'], key: 'c' } as any,
							Space: { type: 'layer-while-held', layer: 'nav' } as any
						}
					}
				]
			});

			const first = migrateV1ToV2(v1);
			const second = migrateV1ToV2(first);
			expect(second).toEqual(first);
		});
	});

	describe('migrateV1ToV2: tap-hold recursive migration', () => {
		it('migrates output-chord inside tap-hold tapAction', () => {
			const v1 = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyA: {
								type: 'tap-hold',
								variant: 'tap-hold',
								tapTimeout: 200,
								holdTimeout: 200,
								tapAction: {
									type: 'output-chord',
									modifiers: ['lctl'],
									key: 'c'
								} as any,
								holdAction: { type: 'key', value: 'b' }
							} as any
						}
					}
				]
			});

			const result = migrateV1ToV2(v1);
			const action = result.layers[0].actions['KeyA'] as any;
			expect(action.type).toBe('tap-hold');
			expect(action.tapAction.type).toBe('key');
			expect(action.tapAction.value).toBe('c');
			expect(action.tapAction.modifiers).toEqual(['C']);
		});
	});

	describe('migrateV2ToV3: modifier IDs C/S/A/M → lctl/lsft/lalt/lmet', () => {
		it('converts C to lctl in key modifiers', () => {
			const v2: SerializedEditorState = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyA: { type: 'key', value: 'c', modifiers: ['C'] }
						}
					}
				]
			});

			const result = migrateV2ToV3(v2);
			const action = result.layers[0].actions['KeyA'] as any;
			expect(action.modifiers).toEqual(['lctl']);
		});

		it('converts multiple modifiers C,S → lctl,lsft', () => {
			const v2: SerializedEditorState = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyA: { type: 'key', value: 'a', modifiers: ['C', 'S'] }
						}
					}
				]
			});

			const result = migrateV2ToV3(v2);
			const action = result.layers[0].actions['KeyA'] as any;
			expect(action.modifiers).toEqual(['lctl', 'lsft']);
		});

		it('passes through already-v3 modifier IDs unchanged', () => {
			const v3: SerializedEditorState = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyA: { type: 'key', value: 'a', modifiers: ['rctl', 'lsft'] }
						}
					}
				]
			});

			const result = migrateV2ToV3(v3);
			const action = result.layers[0].actions['KeyA'] as any;
			expect(action.modifiers).toEqual(['rctl', 'lsft']);
		});

		it('converts modifiers inside tap-hold tapAction', () => {
			const v2: SerializedEditorState = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyA: {
								type: 'tap-hold',
								variant: 'tap-hold',
								tapTimeout: 200,
								holdTimeout: 200,
								tapAction: { type: 'key', value: 'c', modifiers: ['C'] },
								holdAction: { type: 'key', value: 'b' }
							} as any
						}
					}
				]
			});

			const result = migrateV2ToV3(v2);
			const action = result.layers[0].actions['KeyA'] as any;
			expect(action.tapAction.modifiers).toEqual(['lctl']);
		});

		it('is idempotent', () => {
			const v2: SerializedEditorState = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyA: { type: 'key', value: 'a', modifiers: ['C', 'S'] }
						}
					}
				]
			});

			const first = migrateV2ToV3(v2);
			const second = migrateV2ToV3(first);
			expect(second).toEqual(first);
		});
	});

	describe('parseAndMigrate', () => {
		it('parses and migrates v1 JSON (chains v1→v2→v3→v4)', () => {
			const v1 = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyA: { type: 'output-chord', modifiers: ['lctl'], key: 'c' } as any
						}
					}
				]
			});

			const { data, migrated } = parseAndMigrate(JSON.stringify(v1));
			expect(migrated).toBe(true);
			expect(data.layers[0].name).toBe('layer-0');
			expect(data.layers[0].actions['KeyA']).toEqual({
				type: 'key',
				value: 'c',
				modifiers: ['lctl']
			});
		});

		it('passes through current version without migration', () => {
			const current: VersionedStorage = {
				version: CURRENT_VERSION,
				data: createV1State()
			};

			const { data, migrated } = parseAndMigrate(JSON.stringify(current));
			expect(migrated).toBe(false);
			expect(data.templateId).toBe('jis-109');
		});

		it('migrates v2 versioned data to v3→v4 (C→lctl, base→layer-0)', () => {
			const v2: VersionedStorage = {
				version: 2,
				data: createV1State({
					layers: [
						{
							name: 'base',
							actions: {
								KeyA: { type: 'key', value: 'c', modifiers: ['C', 'S'] }
							}
						}
					]
				})
			};

			const { data, migrated } = parseAndMigrate(JSON.stringify(v2));
			expect(migrated).toBe(true);
			expect(data.layers[0].name).toBe('layer-0');
			expect(data.layers[0].actions['KeyA']).toEqual({
				type: 'key',
				value: 'c',
				modifiers: ['lctl', 'lsft']
			});
		});
	});

	describe('migrateV3ToV4: base layer rename base→layer-0', () => {
		it('renames base layer to layer-0', () => {
			const v3: SerializedEditorState = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyA: { type: 'key', value: 'a' }
						}
					}
				]
			});

			const result = migrateV3ToV4(v3);
			expect(result.layers[0].name).toBe('layer-0');
		});

		it('does not rename non-base layers', () => {
			const v3: SerializedEditorState = createV1State({
				layers: [
					{ name: 'base', actions: { KeyA: { type: 'key', value: 'a' } } },
					{ name: 'nav', actions: { KeyA: { type: 'transparent' } } }
				]
			});

			const result = migrateV3ToV4(v3);
			expect(result.layers[0].name).toBe('layer-0');
			expect(result.layers[1].name).toBe('nav');
		});

		it('updates layer references in layer-while-held actions', () => {
			const v3: SerializedEditorState = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							KeyA: { type: 'key', value: 'a' }
						}
					},
					{
						name: 'nav',
						actions: {
							Space: { type: 'layer-while-held', layer: 'base' } as any
						}
					}
				]
			});

			const result = migrateV3ToV4(v3);
			expect((result.layers[1].actions['Space'] as any).layer).toBe('layer-0');
		});

		it('updates layer references inside tap-hold actions', () => {
			const v3: SerializedEditorState = createV1State({
				layers: [
					{
						name: 'base',
						actions: {
							Space: {
								type: 'tap-hold',
								variant: 'tap-hold-press',
								tapTimeout: 200,
								holdTimeout: 200,
								tapAction: { type: 'key', value: 'spc' },
								holdAction: { type: 'layer-switch', layer: 'base' }
							} as any
						}
					}
				]
			});

			const result = migrateV3ToV4(v3);
			const action = result.layers[0].actions['Space'] as any;
			expect(action.holdAction.layer).toBe('layer-0');
		});

		it('is idempotent', () => {
			const v3: SerializedEditorState = createV1State({
				layers: [
					{ name: 'base', actions: { KeyA: { type: 'key', value: 'a' } } }
				]
			});

			const first = migrateV3ToV4(v3);
			const second = migrateV3ToV4(first);
			expect(second).toEqual(first);
		});
	});
});
