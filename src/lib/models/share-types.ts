// =============================================================================
// Share Types — URL 共有用の軽量 JSON スキーマ型定義
// =============================================================================
// Depends on: (none)
// Tested by: N/A (type-only module)
// Called from: services/share-serializer.ts, services/share-url.ts, services/share-validator.ts

// =============================================================================
// ShareAction — 短縮キー Action (discriminated union)
// =============================================================================

/** 短縮キー Action の type 値 */
export type ShareActionType = 'k' | '_' | 'x' | 'th' | 'lh' | 'ls';

/** 通常キー (短縮形) */
export interface ShareActionKey {
	t: 'k';
	v: string;
	/** 修飾キー ID リスト (省略 = 修飾なし) */
	m?: string[];
}

/** Transparent (短縮形) */
export interface ShareActionTransparent {
	t: '_';
}

/** No-op (短縮形) */
export interface ShareActionNoOp {
	t: 'x';
}

/** Layer While Held (短縮形) */
export interface ShareActionLayerWhileHeld {
	t: 'lh';
	/** レイヤ名 */
	l: string;
}

/** Layer Switch (短縮形) */
export interface ShareActionLayerSwitch {
	t: 'ls';
	/** レイヤ名 */
	l: string;
}

/** Tap-Hold variant (短縮形) */
export type ShareTapHoldVariant = 'th' | 'thp' | 'thr';

/** Tap-Hold の tapAction に使用可能（短縮形） */
export type ShareTapAction = ShareActionKey | ShareActionTransparent | ShareActionNoOp;

/** Tap-Hold の holdAction に使用可能（短縮形） */
export type ShareHoldAction =
	| ShareActionKey
	| ShareActionNoOp
	| ShareActionLayerWhileHeld
	| ShareActionLayerSwitch;

/** Tap-Hold (短縮形) */
export interface ShareActionTapHold {
	t: 'th';
	/** variant */
	vr: ShareTapHoldVariant;
	/** tapTimeout */
	to: number;
	/** holdTimeout */
	ho: number;
	/** tapAction (再帰) */
	ta: ShareTapAction;
	/** holdAction (再帰) */
	ha: ShareHoldAction;
}

/** KeyAction の短縮形 Union */
export type ShareAction =
	| ShareActionKey
	| ShareActionTransparent
	| ShareActionNoOp
	| ShareActionLayerWhileHeld
	| ShareActionLayerSwitch
	| ShareActionTapHold;

// =============================================================================
// ShareLayer / ShareData — URL 共有トップレベル構造
// =============================================================================

/** 差分レイヤ（デフォルトから変更のあるキーのみ含む） */
export interface ShareLayer {
	/** レイヤ名 */
	n: string;
	/** PhysicalKey.id → ShareAction（変更分のみ） */
	a: Record<string, ShareAction>;
}

/** 共有 URL に埋め込む圧縮用 JSON スキーマ */
export interface ShareData {
	/** 共有フォーマットバージョン */
	v: number;
	/** テンプレート ID */
	t: string;
	/** 差分レイヤ配列 */
	l: ShareLayer[];
	/** JIS→US リマップ ON (true の場合のみ含む) */
	j?: boolean;
	/** Tapping Term (デフォルト値と異なる場合のみ含む) */
	tt?: number;
}

// =============================================================================
// ImportSummary — 復元確認ダイアログ表示用
// =============================================================================

/** 復元確認ダイアログに表示するサマリ情報 */
export interface ImportSummary {
	/** テンプレート名 */
	templateName: string;
	/** レイヤ数 */
	layerCount: number;
	/** 変更キー総数（全レイヤ合計の差分キー数） */
	changedKeyCount: number;
	/** 変更された Global Settings の数 */
	changedSettingsCount: number;
	/** テンプレート不一致の場合に現在のテンプレート名 */
	currentTemplateName?: string;
}
