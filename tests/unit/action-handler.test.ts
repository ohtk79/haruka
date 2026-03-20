// =============================================================================
// Action Handler Unit Tests
// =============================================================================

import { describe, it, expect } from 'vitest';
import { visitAction, visitTapAction, visitHoldAction } from '$lib/models/action-handler';
import type { KeyAction, TapAction, HoldAction } from '$lib/models/types';

describe('visitAction', () => {
	// 各アクションタイプで正しいハンドラーが呼ばれることを検証
	const visitor = {
		key: (a: { type: 'key'; value: string }) => `key:${a.value}`,
		transparent: () => 'transparent',
		'no-op': () => 'no-op',
		'tap-hold': (a: { type: 'tap-hold' }) => 'tap-hold',
		'layer-while-held': (a: { type: 'layer-while-held'; layer: string }) => `lwh:${a.layer}`,
		'layer-switch': (a: { type: 'layer-switch'; layer: string }) => `ls:${a.layer}`
	};

	it('key アクションを正しくディスパッチする', () => {
		const action: KeyAction = { type: 'key', value: 'a' };
		expect(visitAction(action, visitor)).toBe('key:a');
	});

	it('key アクション（修飾キー付き）を正しくディスパッチする', () => {
		const action: KeyAction = { type: 'key', value: 'a', modifiers: ['lctl'] };
		expect(visitAction(action, visitor)).toBe('key:a');
	});

	it('transparent アクションを正しくディスパッチする', () => {
		const action: KeyAction = { type: 'transparent' };
		expect(visitAction(action, visitor)).toBe('transparent');
	});

	it('no-op アクションを正しくディスパッチする', () => {
		const action: KeyAction = { type: 'no-op' };
		expect(visitAction(action, visitor)).toBe('no-op');
	});

	it('tap-hold アクションを正しくディスパッチする', () => {
		const action: KeyAction = {
			type: 'tap-hold',
			variant: 'tap-hold',
			tapTimeout: 200,
			holdTimeout: 200,
			tapAction: { type: 'key', value: 'a' },
			holdAction: { type: 'key', value: 'b' }
		};
		expect(visitAction(action, visitor)).toBe('tap-hold');
	});

	it('layer-while-held アクションを正しくディスパッチする', () => {
		const action: KeyAction = { type: 'layer-while-held', layer: 'layer-1' };
		expect(visitAction(action, visitor)).toBe('lwh:layer-1');
	});

	it('layer-switch アクションを正しくディスパッチする', () => {
		const action: KeyAction = { type: 'layer-switch', layer: 'layer-2' };
		expect(visitAction(action, visitor)).toBe('ls:layer-2');
	});
});

describe('visitTapAction', () => {
	const visitor = {
		key: (a: { type: 'key'; value: string }) => `key:${a.value}`,
		transparent: () => 'transparent',
		'no-op': () => 'no-op'
	};

	it('key タップアクションをディスパッチする', () => {
		const action: TapAction = { type: 'key', value: 'x' };
		expect(visitTapAction(action, visitor)).toBe('key:x');
	});

	it('transparent タップアクションをディスパッチする', () => {
		const action: TapAction = { type: 'transparent' };
		expect(visitTapAction(action, visitor)).toBe('transparent');
	});

	it('no-op タップアクションをディスパッチする', () => {
		const action: TapAction = { type: 'no-op' };
		expect(visitTapAction(action, visitor)).toBe('no-op');
	});
});

describe('visitHoldAction', () => {
	const visitor = {
		key: (a: { type: 'key'; value: string }) => `key:${a.value}`,
		'no-op': () => 'no-op',
		'layer-while-held': (a: { type: 'layer-while-held'; layer: string }) => `lwh:${a.layer}`,
		'layer-switch': (a: { type: 'layer-switch'; layer: string }) => `ls:${a.layer}`
	};

	it('key ホールドアクションをディスパッチする', () => {
		const action: HoldAction = { type: 'key', value: 'y' };
		expect(visitHoldAction(action, visitor)).toBe('key:y');
	});

	it('no-op ホールドアクションをディスパッチする', () => {
		const action: HoldAction = { type: 'no-op' };
		expect(visitHoldAction(action, visitor)).toBe('no-op');
	});

	it('layer-while-held ホールドアクションをディスパッチする', () => {
		const action: HoldAction = { type: 'layer-while-held', layer: 'layer-1' };
		expect(visitHoldAction(action, visitor)).toBe('lwh:layer-1');
	});

	it('layer-switch ホールドアクションをディスパッチする', () => {
		const action: HoldAction = { type: 'layer-switch', layer: 'layer-2' };
		expect(visitHoldAction(action, visitor)).toBe('ls:layer-2');
	});
});
