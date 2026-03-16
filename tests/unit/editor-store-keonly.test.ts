// =============================================================================
// EditorStore keOnly モード ユニットテスト
// =============================================================================
// Module: EditorStore (KE-only template behavior)
// Tested by: this file
// Depends on: editor.svelte.ts, ke-generator.ts, kbd-generator.ts

import { describe, it, expect } from 'vitest';
import { EditorStore } from '$lib/stores/editor.svelte';
import type { LayoutTemplate } from '$lib/models/types';

// keOnly テンプレート（Fn キーを含む最小構成）
const KE_ONLY_TEMPLATE: LayoutTemplate = {
	id: 'test-ke-only',
	name: 'Test KE Only',
	keys: [
		{ id: 'KeyA', label: 'A', kanataName: 'a', x: 0, y: 0, width: 1, height: 1 },
		{ id: 'KeyB', label: 'B', kanataName: 'b', x: 1, y: 0, width: 1, height: 1 },
		// Fn キー: kanataName なし
		{ id: 'Fn', label: 'fn', x: 2, y: 0, width: 1, height: 1 },
	],
	keOnly: true,
};

// 通常テンプレート（keOnly = false）
const NORMAL_TEMPLATE: LayoutTemplate = {
	id: 'test-normal',
	name: 'Test Normal',
	keys: [
		{ id: 'KeyA', label: 'A', kanataName: 'a', x: 0, y: 0, width: 1, height: 1 },
		{ id: 'KeyB', label: 'B', kanataName: 'b', x: 1, y: 0, width: 1, height: 1 },
	],
};

describe('EditorStore keOnly mode', () => {
	it('keOnly テンプレートで kbdText が空文字列になる', () => {
		const store = new EditorStore(KE_ONLY_TEMPLATE);
		expect(store.kbdText).toBe('');
	});

	it('通常テンプレートで kbdText が空でない', () => {
		const store = new EditorStore(NORMAL_TEMPLATE);
		expect(store.kbdText).not.toBe('');
		expect(store.kbdText).toContain('defsrc');
	});

	it('keOnly テンプレートでも keJsonText は正常に生成される', () => {
		const store = new EditorStore(KE_ONLY_TEMPLATE);
		expect(store.keJsonText).not.toBe('');
		const parsed = JSON.parse(store.keJsonText);
		expect(parsed.title).toBeDefined();
	});

	it('keOnly テンプレートで Fn キー（kanataName なし）がレイヤーに含まれる', () => {
		const store = new EditorStore(KE_ONLY_TEMPLATE);
		const layer = store.layers[0];
		// Fn キーのアクションが transparent になる（kanataName がないため）
		expect(layer.actions.get('Fn')).toEqual({ type: 'transparent' });
	});

	it('keOnly テンプレートで通常キーは key アクションが設定される', () => {
		const store = new EditorStore(KE_ONLY_TEMPLATE);
		const layer = store.layers[0];
		expect(layer.actions.get('KeyA')).toEqual({ type: 'key', value: 'a' });
		expect(layer.actions.get('KeyB')).toEqual({ type: 'key', value: 'b' });
	});
});
