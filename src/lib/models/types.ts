// =============================================================================
// Data Model Types — Core type definitions for the Kanata Web Configurator
// =============================================================================
// Depends on: (none)
// Tested by: N/A (type-only module)
// Called from: stores/, services/, components/, templates/

/**
 * キーボード上の 1 つの物理キーの位置・形状・識別情報
 */
export interface PhysicalKey {
	/** 一意な識別子 (例: "KeyA", "Space", "F1") — HTML event.code 準拠 */
	id: string;
	/** 表示ラベル (例: "A", "Space", "半角/全角") */
	label: string;
	/** kanata defsrc でのキー名 (例: "a", "spc", "grv")。kanata 非対応キーは undefined */
	kanataName?: string;
	/** SVG 上の X 座標 (キーユニット, 0 起点) */
	x: number;
	/** SVG 上の Y 座標 */
	y: number;
	/** キー幅 (1.0 = 標準キー 1u) */
	width: number;
	/** キー高さ (通常 1.0) */
	height: number;
	/** 特殊形状。省略時は "rect"。JIS Enter は "iso-enter" (逆L字) */
	shape?: 'rect' | 'iso-enter';
}

/**
 * 物理キーボードの形状定義
 */
export interface LayoutTemplate {
	/** テンプレート識別子 (例: "jis-109") */
	id: string;
	/** 表示名 (例: "JIS 109") */
	name: string;
	/** テンプレートに含まれる物理キー一覧 */
	keys: PhysicalKey[];
	/** true ならネイティブ US 配列テンプレート（ラベル表示で US 側を使用） */
	usLayout?: boolean;
	/** true なら KE 専用テンプレート（kanata .kbd 生成を抑止） */
	keOnly?: boolean;
}

// =============================================================================
// Key Action Types
// =============================================================================

/** Tap-Hold バリアント */
export type TapHoldVariant = 'tap-hold' | 'tap-hold-press' | 'tap-hold-release';

/** 通常キー出力（修飾キー付きを統合） */
export interface KeyActionKey {
	type: 'key';
	value: string;
	/** 修飾キーリスト (空/undefined = 修飾なし) */
	modifiers?: string[];
}

/** 下位レイヤに委譲 */
export interface KeyActionTransparent {
	type: 'transparent';
}

/** 何もしない */
export interface KeyActionNoOp {
	type: 'no-op';
}

/** 押している間だけレイヤ有効 */
export interface KeyActionLayerWhileHeld {
	type: 'layer-while-held';
	layer: string;
}

/** ベースレイヤ恒久切替 */
export interface KeyActionLayerSwitch {
	type: 'layer-switch';
	layer: string;
}

/** 短押し/長押しで別アクション */
export interface KeyActionTapHold {
	type: 'tap-hold';
	variant: TapHoldVariant;
	tapTimeout: number;
	holdTimeout: number;
	tapAction: TapAction;
	holdAction: HoldAction;
}

/** キーに割り当てられるアクション (Union 型) — 内部表現用 */
export type KeyAction =
	| KeyActionKey
	| KeyActionTransparent
	| KeyActionNoOp
	| KeyActionLayerWhileHeld
	| KeyActionLayerSwitch
	| KeyActionTapHold;

/** UI トップレベルで選択可能なアクション */
export type TopLevelAction =
	| KeyActionKey
	| KeyActionTransparent
	| KeyActionNoOp
	| KeyActionTapHold;

/** tap-hold の tapAction に設定可能 */
export type TapAction =
	| KeyActionKey
	| KeyActionTransparent
	| KeyActionNoOp;

/** tap-hold の holdAction に設定可能 */
export type HoldAction =
	| KeyActionKey
	| KeyActionNoOp
	| KeyActionLayerWhileHeld
	| KeyActionLayerSwitch;

// =============================================================================
// Type Guards
// =============================================================================

export function isTopLevelAction(action: KeyAction): action is TopLevelAction {
	return ['key', 'transparent', 'no-op', 'tap-hold'].includes(action.type);
}

export function isTapAction(action: KeyAction): action is TapAction {
	return ['key', 'transparent', 'no-op'].includes(action.type);
}

export function isHoldAction(action: KeyAction): action is HoldAction {
	return ['key', 'no-op', 'layer-while-held', 'layer-switch'].includes(action.type);
}

export function hasModifiers(action: KeyActionKey): boolean {
	return (action.modifiers?.length ?? 0) > 0;
}

// =============================================================================
// Layer & Editor State
// =============================================================================

/**
 * キーマップの 1 レイヤ分
 */
export interface Layer {
	/** レイヤ名 (英数字 + ハイフン + アンダースコア) */
	name: string;
	/** PhysicalKey.id → KeyAction のマッピング */
	actions: Map<string, KeyAction>;
}

/**
 * アプリケーション全体の状態
 */
export interface EditorState {
	/** 選択されたキーボードテンプレート */
	template: LayoutTemplate;
	/** レイヤ一覧 (index 0 = base) */
	layers: Layer[];
	/** 現在選択中のキー ID (未選択時は null) */
	selectedKeyId: string | null;
	/** 現在アクティブなレイヤのインデックス */
	activeLayerIndex: number;
	/** JIS→US 配列変換の有効/無効 */
	jisToUsRemap: boolean;
	/** グローバル Tapping Term (ms) — kanata tap-hold と KE 両方に使用 */
	tappingTerm: number;
}

// =============================================================================
// Serialization Types (localStorage)
// =============================================================================

/**
 * localStorage に保存される JSON スキーマ (v2)
 */
export interface SerializedEditorState {
	templateId: string;
	/** テンプレートからカスタマイズされたキー一覧 (差分ではなく全量) */
	customKeys?: PhysicalKey[];
	layers: SerializedLayer[];
	selectedKeyId: string | null;
	activeLayerIndex: number;
	/** JIS→US 配列変換の有効/無効 (後方互換: undefined = false) */
	jisToUsRemap?: boolean;
	/** グローバル Tapping Term (ms) (後方互換: undefined = 200) */
	tappingTerm?: number;
	/** @deprecated tappingTerm に統合。デシリアライズ時は無視 */
	keAloneTimeout?: number;
	/** @deprecated tappingTerm に統合。デシリアライズ時は無視 */
	keHeldThreshold?: number;
}

/**
 * バージョン付きストレージラッパー
 */
export interface VersionedStorage {
	version: number;
	data: SerializedEditorState;
}

/**
 * シリアライズされたレイヤ
 */
export interface SerializedLayer {
	name: string;
	/** Map → Object.fromEntries() で変換 */
	actions: Record<string, KeyAction>;
}
