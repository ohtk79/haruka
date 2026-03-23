// =============================================================================
// Constants — Shared constants for the Kanata Web Configurator
// =============================================================================
// Depends on: $lib/paraglide/messages (i18n)
// Tested by: N/A (constant-only module)
// Called from: stores/, services/, components/, routes/+page.svelte

import * as m from '$lib/paraglide/messages';

/** アクションタイプ定数 */
export const ACTION_TYPES = {
	KEY: 'key',
	TRANSPARENT: 'transparent',
	NO_OP: 'no-op',
	TAP_HOLD: 'tap-hold',
	// Internal types (not shown in top-level UI dropdown)
	LAYER_WHILE_HELD: 'layer-while-held',
	LAYER_SWITCH: 'layer-switch'
} as const;

/** アクションタイプの表示ラベル（ロケール対応） */
export function getActionTypeLabel(type: string): string {
	const labels: Record<string, () => string> = {
		[ACTION_TYPES.KEY]: m.actionType_key,
		[ACTION_TYPES.TRANSPARENT]: m.actionType_transparent,
		[ACTION_TYPES.NO_OP]: m.actionType_noOp,
		[ACTION_TYPES.TAP_HOLD]: m.actionType_tapHold,
		[ACTION_TYPES.LAYER_WHILE_HELD]: m.actionType_layerWhileHeld,
		[ACTION_TYPES.LAYER_SWITCH]: m.actionType_layerSwitch,
	};
	return labels[type]?.() ?? type;
}

/** Tap-Hold バリアント */
export const TAP_HOLD_VARIANTS = ['tap-hold', 'tap-hold-press', 'tap-hold-release'] as const;

/** 修飾キー (左右区別あり) */
export const MODIFIER_KEYS = [
	{ id: 'lctl', kanata: 'C' },
	{ id: 'rctl', kanata: null },
	{ id: 'lsft', kanata: 'S' },
	{ id: 'rsft', kanata: null },
	{ id: 'lalt', kanata: 'A' },
	{ id: 'ralt', kanata: 'AG' },
	{ id: 'lmet', kanata: 'M' },
	{ id: 'rmet', kanata: null }
] as const;

/** 修飾キーの表示ラベル（ロケール対応） */
export function getModifierLabel(id: string): string {
	const labels: Record<string, () => string> = {
		lctl: m.modifier_lctl,
		rctl: m.modifier_rctl,
		lsft: m.modifier_lsft,
		rsft: m.modifier_rsft,
		lalt: m.modifier_lalt,
		ralt: m.modifier_ralt,
		lmet: m.modifier_lmet,
		rmet: m.modifier_rmet,
	};
	return labels[id]?.() ?? id;
}

/** 修飾キーソート順 (kanata 出力用: Ctrl→Shift→Alt→Meta, 左→右) */
export const MODIFIER_SORT_ORDER = ['lctl', 'rctl', 'lsft', 'rsft', 'lalt', 'ralt', 'lmet', 'rmet'] as const;

/** kanata chord prefix マップ (左修飾 + AltGr のみ chord 記法あり) */
export const KANATA_CHORD_PREFIX: Record<string, string> = {
	lctl: 'C', lsft: 'S', lalt: 'A', lmet: 'M', ralt: 'AG'
};

/** KeySvg 表示用の短縮ラベル */
export const MODIFIER_DISPLAY_MAP: Record<string, string> = {
	lctl: '*C', rctl: 'C*',
	lsft: '*S', rsft: 'S*',
	lalt: '*A', ralt: 'A*',
	lmet: '*M', rmet: 'M*'
};

/** kanata 予約語 (レイヤ名に使用不可) */
export const KANATA_RESERVED_WORDS = [
	'defsrc',
	'deflayer',
	'defalias',
	'defcfg',
	'defvar',
	'deftemplate',
	'defoverrides',
	'deffakekeys'
] as const;

/** レイヤ名の正規表現パターン */
export const LAYER_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** レイヤ最大数 */
export const MAX_LAYERS = 8;

/** Tap-Hold タイムアウト範囲 (u16) */
export const TAP_HOLD_TIMEOUT_MIN = 0;
export const TAP_HOLD_TIMEOUT_MAX = 65535;

/** Tap-Hold デフォルトタイムアウト */
export const TAP_HOLD_DEFAULT_TIMEOUT = 200;

/** Tapping Term デフォルト値 (ms) — TAP_HOLD_DEFAULT_TIMEOUT と同値 */
export const TAPPING_TERM_DEFAULT = TAP_HOLD_DEFAULT_TIMEOUT;

/** localStorage 保存キー */
export const STORAGE_KEY = 'kanata-web-config:editor-state';

/** localStorage 保存デバウンス時間 (ms) */
export const STORAGE_DEBOUNCE_MS = 300;

/** EditorStore コンテキストキー */
export const EDITOR_STORE_CONTEXT_KEY = 'editor-store';

/** ベースレイヤ名 */
export const BASE_LAYER_NAME = 'layer-0';

// =============================================================================
// URL 共有関連定数
// =============================================================================

/** 共有フォーマットバージョン */
export const SHARE_FORMAT_VERSION = 1;

/** URL 長警告閾値（文字数） */
export const URL_LENGTH_WARNING = 4000;

/** URL 長エラー閾値（文字数） */
export const URL_LENGTH_ERROR = 8000;

/** URL ハッシュフラグメントのプレフィックス */
export const URL_HASH_PREFIX = 'config=';

/** 共有 URL 埋め込み設定の localStorage キー */
export const EMBED_SHARE_URL_STORAGE_KEY = 'kanata-web-config:embed-share-url';

// =============================================================================
// Karabiner-Elements (KE) 関連定数
// =============================================================================

/** KE デフォルト alone timeout (ms) */
export const KE_DEFAULT_ALONE_TIMEOUT = 1000;

/** KE デフォルト held threshold (ms) */
export const KE_DEFAULT_HELD_THRESHOLD = 500;

/** haruka 修飾子 → KE modifier マッピング (左右区別) */
export const KE_MODIFIER_MAP: Record<string, string> = {
	lctl: 'left_control',
	rctl: 'right_control',
	lsft: 'left_shift',
	rsft: 'right_shift',
	lalt: 'left_option',
	ralt: 'right_option',
	lmet: 'left_command',
	rmet: 'right_command'
};

/** KE で使用できないメディアキー (kanata 専用) */
export const KE_UNSUPPORTED_KEYS = [
	'MediaPlayPause',
	'MediaTrackNext',
	'MediaTrackPrevious',
	'AudioVolumeUp',
	'AudioVolumeDown',
	'AudioVolumeMute',
	'MediaStop'
] as const;

// =============================================================================
// レガシー action ID マイグレーション
// =============================================================================

/** 旧 action ID → 新 action ID のマイグレーションマップ (eisu/kana は削除済み: v6 で正式な kanata キー名に昇格) */
export const LEGACY_ACTION_MIGRATION: Readonly<Record<string, string>> = {
};

// =============================================================================
// AutoHotkey v2 診断コード
// =============================================================================

/** AHK の blocking / notice 用コード */
export const AHK_DIAGNOSTIC_CODES = {
	TEMPLATE_UNSUPPORTED: 'AHK_TEMPLATE_UNSUPPORTED',
	KEY_NOT_MAPPED: 'AHK_KEY_NOT_MAPPED',
	ACTION_NOT_SUPPORTED: 'AHK_ACTION_NOT_SUPPORTED',
	VARIANT_NORMALIZED: 'AHK_VARIANT_NORMALIZED',
	KANATA_RECOMMENDED: 'AHK_KANATA_RECOMMENDED'
} as const;
