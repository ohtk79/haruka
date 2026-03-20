// =============================================================================
// Action Handler — 共通ディスパッチ機構 (Visitor パターン)
// =============================================================================
// アクションタイプごとの処理を型安全に集約する。
// 新しいアクションタイプ追加時、ActionVisitor<T> にプロパティを追加すれば
// 全利用元でコンパイルエラーが発生し、漏れを防ぐ。
// Depends on: models/types.ts
// Tested by: tests/unit/action-handler.test.ts
// Called from: services/kbd-generator.ts, services/ke-generator.ts,
//              services/ahk-generator.ts, services/share-serializer.ts,
//              services/debug-logger.svelte.ts, utils/key-label-resolver.ts

import type {
	KeyAction,
	KeyActionKey,
	KeyActionTransparent,
	KeyActionNoOp,
	KeyActionTapHold,
	KeyActionLayerWhileHeld,
	KeyActionLayerSwitch,
	TapAction,
	HoldAction
} from '$lib/models/types';

/**
 * アクションタイプごとの処理ハンドラー定義。
 * 全 6 タイプが必須（コンパイル時に網羅性を保証）。
 */
export type ActionVisitor<T> = {
	key: (action: KeyActionKey) => T;
	transparent: (action: KeyActionTransparent) => T;
	'no-op': (action: KeyActionNoOp) => T;
	'tap-hold': (action: KeyActionTapHold) => T;
	'layer-while-held': (action: KeyActionLayerWhileHeld) => T;
	'layer-switch': (action: KeyActionLayerSwitch) => T;
};

/**
 * TapAction 用の Visitor（3 タイプ: key / transparent / no-op）
 */
export type TapActionVisitor<T> = {
	key: (action: KeyActionKey) => T;
	transparent: (action: KeyActionTransparent) => T;
	'no-op': (action: KeyActionNoOp) => T;
};

/**
 * HoldAction 用の Visitor（4 タイプ: key / no-op / layer-while-held / layer-switch）
 */
export type HoldActionVisitor<T> = {
	key: (action: KeyActionKey) => T;
	'no-op': (action: KeyActionNoOp) => T;
	'layer-while-held': (action: KeyActionLayerWhileHeld) => T;
	'layer-switch': (action: KeyActionLayerSwitch) => T;
};

/**
 * KeyAction に対して Visitor パターンで処理を実行する。
 * 内部の switch 文が action.type の唯一の exhaustive dispatch となる。
 */
export function visitAction<T>(action: KeyAction, visitor: ActionVisitor<T>): T {
	switch (action.type) {
		case 'key': return visitor.key(action);
		case 'transparent': return visitor.transparent(action);
		case 'no-op': return visitor['no-op'](action);
		case 'tap-hold': return visitor['tap-hold'](action);
		case 'layer-while-held': return visitor['layer-while-held'](action);
		case 'layer-switch': return visitor['layer-switch'](action);
	}
}

/**
 * TapAction に対して Visitor パターンで処理を実行する。
 */
export function visitTapAction<T>(action: TapAction, visitor: TapActionVisitor<T>): T {
	switch (action.type) {
		case 'key': return visitor.key(action);
		case 'transparent': return visitor.transparent(action);
		case 'no-op': return visitor['no-op'](action);
	}
}

/**
 * HoldAction に対して Visitor パターンで処理を実行する。
 */
export function visitHoldAction<T>(action: HoldAction, visitor: HoldActionVisitor<T>): T {
	switch (action.type) {
		case 'key': return visitor.key(action);
		case 'no-op': return visitor['no-op'](action);
		case 'layer-while-held': return visitor['layer-while-held'](action);
		case 'layer-switch': return visitor['layer-switch'](action);
	}
}
