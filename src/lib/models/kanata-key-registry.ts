// =============================================================================
// Kanata Key Name Registry — Valid key names for haruka templates
// =============================================================================
// Depends on: (none)
// Tested by: tests/unit/kanata-key-registry.test.ts
// Called from: (validation only — referenced by tests)
//
// kanata v1.11.0 対応
// haruka がテンプレート（JIS 109 / ANSI 104）および JIS→US 変換で使用する
// キー名のみを登録。kanata の全キー名ではなくサブセット。

/** haruka が使用する kanata 有効キー名のレジストリ */
export const VALID_KANATA_KEY_NAMES: ReadonlySet<string> = new Set([
	// ファンクションキー
	'esc', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',

	// 数字行
	'grv', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'bspc',

	// QWERTY 行
	'tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']',

	// ホーム行
	'caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'ret',

	// 下段
	'lsft', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'rsft',

	// スペース行
	'lctl', 'lmet', 'lalt', 'spc', 'ralt', 'rmet', 'comp', 'rctl',

	// ナビゲーション
	'prtsc', 'slck', 'pause',
	'ins', 'home', 'pgup',
	'del', 'end', 'pgdn',
	'up', 'lft', 'down', 'rght',

	// テンキー
	'nlck', 'kp/', 'kp*', 'kp-',
	'kp7', 'kp8', 'kp9', 'kp+',
	'kp4', 'kp5', 'kp6',
	'kp1', 'kp2', 'kp3', 'kprt',
	'kp0', 'kp.',

	// JIS 固有キー
	'\\', '¥', 'ro', 'henk', 'mhnk', 'jp-kana',

	// Apple JIS 固有キー
	'eisu', 'kana',

	// 仮想キー (IME ON/OFF)
	'lang1', 'lang2',
]);
