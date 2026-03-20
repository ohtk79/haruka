import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	serialize,
	deserialize,
	saveState,
	loadState,
	clearState,
	PersistenceError,
	getSavedTemplateId
} from '$lib/stores/persistence';
import { STORAGE_KEY, TAP_HOLD_DEFAULT_TIMEOUT } from '$lib/models/constants';
import type { EditorState, KeyAction, Layer, LayoutTemplate } from '$lib/models/types';

// テスト用最小テンプレート
const MINI_TEMPLATE: LayoutTemplate = {
	id: 'test-mini',
	name: 'Test Mini',
	keys: [
		{ id: 'KeyA', label: 'A', kanataName: 'a', x: 0, y: 0, width: 1, height: 1 },
		{ id: 'KeyB', label: 'B', kanataName: 'b', x: 1, y: 0, width: 1, height: 1 }
	]
};

function createTestState(overrides?: Partial<EditorState>): EditorState {
	const actions = new Map<string, KeyAction>([
		['KeyA', { type: 'key', value: 'a' }],
		['KeyB', { type: 'transparent' }]
	]);
	const layers: Layer[] = [{ name: 'layer-0', actions }];
	return {
		template: MINI_TEMPLATE,
		layers,
		selectedKeyId: null,
		activeLayerIndex: 0,
		jisToUsRemap: false,
		tappingTerm: TAP_HOLD_DEFAULT_TIMEOUT,
		...overrides
	};
}

describe('persistence', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	// =========================================================================
	// serialize / deserialize ラウンドトリップ
	// =========================================================================
	describe('serialize / deserialize round-trip', () => {
		it('round-trips basic state with Map↔Object conversion', () => {
			const state = createTestState();
			const serialized = serialize(state);
			const restored = deserialize(serialized, MINI_TEMPLATE);

			expect(restored.layers).toHaveLength(1);
			expect(restored.layers![0].name).toBe('layer-0');
			expect(restored.layers![0].actions).toBeInstanceOf(Map);
			expect(restored.layers![0].actions.get('KeyA')).toEqual({ type: 'key', value: 'a' });
			expect(restored.layers![0].actions.get('KeyB')).toEqual({ type: 'transparent' });
			expect(restored.activeLayerIndex).toBe(0);
			expect(restored.jisToUsRemap).toBe(false);
			expect(restored.tappingTerm).toBe(TAP_HOLD_DEFAULT_TIMEOUT);
		});

		it('round-trips state with tap-hold actions', () => {
			const tapHold: KeyAction = {
				type: 'tap-hold',
				variant: 'tap-hold',
				tapTimeout: 200,
				holdTimeout: 200,
				tapAction: { type: 'key', value: 'a' },
				holdAction: { type: 'layer-while-held', layer: 'layer-1' }
			};
			const state = createTestState({
				layers: [{ name: 'layer-0', actions: new Map([['KeyA', tapHold]]) }]
			});
			const restored = deserialize(serialize(state), MINI_TEMPLATE);
			expect(restored.layers![0].actions.get('KeyA')).toEqual(tapHold);
		});

		it('round-trips state with jisToUsRemap and custom tappingTerm', () => {
			const state = createTestState({ jisToUsRemap: true, tappingTerm: 300 });
			const restored = deserialize(serialize(state), MINI_TEMPLATE);
			expect(restored.jisToUsRemap).toBe(true);
			expect(restored.tappingTerm).toBe(300);
		});
	});

	// =========================================================================
	// saveState / loadState の localStorage 操作
	// =========================================================================
	describe('saveState / loadState', () => {
		it('saves and loads state from localStorage', () => {
			const state = createTestState();
			saveState(state);

			const loaded = loadState(MINI_TEMPLATE);
			expect(loaded).not.toBeNull();
			expect(loaded!.layers![0].actions.get('KeyA')).toEqual({ type: 'key', value: 'a' });
		});

		it('returns null when no saved data exists', () => {
			expect(loadState(MINI_TEMPLATE)).toBeNull();
		});

		it('returns null when template ID does not match', () => {
			const state = createTestState();
			saveState(state);

			const otherTemplate: LayoutTemplate = { ...MINI_TEMPLATE, id: 'different-template' };
			expect(loadState(otherTemplate)).toBeNull();
		});
	});

	// =========================================================================
	// PersistenceError ハンドリング
	// =========================================================================
	describe('PersistenceError handling', () => {
		it('PersistenceError is an Error subclass with correct name', () => {
			const err = new PersistenceError('test message');
			expect(err).toBeInstanceOf(Error);
			expect(err).toBeInstanceOf(PersistenceError);
			expect(err.name).toBe('PersistenceError');
			expect(err.message).toBe('test message');
		});

		it('loadState returns null on corrupted localStorage data', () => {
			localStorage.setItem('kanata-web-config-state', '{invalid json!!!');
			expect(loadState(MINI_TEMPLATE)).toBeNull();
		});
	});

	// =========================================================================
	// sanitizeAction: 不正 modifiers の除去
	// =========================================================================
	describe('sanitizeAction via deserialize', () => {
		it('strips invalid modifiers from transparent actions', () => {
			const state = createTestState({
				layers: [{
					name: 'layer-0',
					actions: new Map([
						['KeyA', { type: 'transparent', modifiers: ['lctl'] } as unknown as KeyAction]
					])
				}]
			});
			const serialized = serialize(state);
			const restored = deserialize(serialized, MINI_TEMPLATE);
			const action = restored.layers![0].actions.get('KeyA');
			expect(action).toEqual({ type: 'transparent' });
			expect(action).not.toHaveProperty('modifiers');
		});
	});

	// =========================================================================
	// clearState / getSavedTemplateId
	// =========================================================================
	describe('clearState and getSavedTemplateId', () => {
		it('clearState removes saved data', () => {
			saveState(createTestState());
			expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
			clearState();
			expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
		});

		it('getSavedTemplateId returns template ID from saved data', () => {
			saveState(createTestState());
			expect(getSavedTemplateId()).toBe('test-mini');
		});

		it('getSavedTemplateId returns null when no data saved', () => {
			expect(getSavedTemplateId()).toBeNull();
		});
	});
});
