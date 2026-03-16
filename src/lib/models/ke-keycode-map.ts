// =============================================================================
// kanata → Karabiner-Elements key_code マッピング
// =============================================================================
// Depends on: (none)
// Tested by: tests/unit/ke-keycode-map.test.ts
// Called from: services/ke-generator.ts
// JIS 109 テンプレートの全キー + メディアキーを網羅

/**
 * KE key_code マッピング定義
 */
export interface KeKeyMapping {
	/** KE key_code（from 用 — 入力検出） */
	fromKeyCode: string;
	/** KE key_code（to 用）— from と異なる場合のみ（henk/mhnk） */
	toKeyCode?: string;
	/** true: KE エクスポート対象外（メディアキー） */
	keUnsupported?: boolean;
}

/**
 * kanata キー名 → KE マッピングテーブル
 * JIS 109 テンプレートの全 109 キー + メディアキー 7 種
 */
export const KANATA_TO_KE_MAP: Readonly<Record<string, KeKeyMapping>> = {
	// =========================================================================
	// Alphabet keys (26)
	// =========================================================================
	a: { fromKeyCode: 'a' },
	b: { fromKeyCode: 'b' },
	c: { fromKeyCode: 'c' },
	d: { fromKeyCode: 'd' },
	e: { fromKeyCode: 'e' },
	f: { fromKeyCode: 'f' },
	g: { fromKeyCode: 'g' },
	h: { fromKeyCode: 'h' },
	i: { fromKeyCode: 'i' },
	j: { fromKeyCode: 'j' },
	k: { fromKeyCode: 'k' },
	l: { fromKeyCode: 'l' },
	m: { fromKeyCode: 'm' },
	n: { fromKeyCode: 'n' },
	o: { fromKeyCode: 'o' },
	p: { fromKeyCode: 'p' },
	q: { fromKeyCode: 'q' },
	r: { fromKeyCode: 'r' },
	s: { fromKeyCode: 's' },
	t: { fromKeyCode: 't' },
	u: { fromKeyCode: 'u' },
	v: { fromKeyCode: 'v' },
	w: { fromKeyCode: 'w' },
	x: { fromKeyCode: 'x' },
	y: { fromKeyCode: 'y' },
	z: { fromKeyCode: 'z' },

	// =========================================================================
	// Number keys (10)
	// =========================================================================
	'1': { fromKeyCode: '1' },
	'2': { fromKeyCode: '2' },
	'3': { fromKeyCode: '3' },
	'4': { fromKeyCode: '4' },
	'5': { fromKeyCode: '5' },
	'6': { fromKeyCode: '6' },
	'7': { fromKeyCode: '7' },
	'8': { fromKeyCode: '8' },
	'9': { fromKeyCode: '9' },
	'0': { fromKeyCode: '0' },

	// =========================================================================
	// Symbol keys
	// =========================================================================
	'-': { fromKeyCode: 'hyphen' },
	'=': { fromKeyCode: 'equal_sign' },
	'[': { fromKeyCode: 'open_bracket' },
	']': { fromKeyCode: 'close_bracket' },
	';': { fromKeyCode: 'semicolon' },
	"'": { fromKeyCode: 'quote' },
	'\\': { fromKeyCode: 'backslash' },
	'/': { fromKeyCode: 'slash' },
	',': { fromKeyCode: 'comma' },
	'.': { fromKeyCode: 'period' },
	grv: { fromKeyCode: 'grave_accent_and_tilde' },

	// =========================================================================
	// JIS-specific keys
	// =========================================================================
	'¥': { fromKeyCode: 'international3' },
	ro: { fromKeyCode: 'international1' },
	int1: { fromKeyCode: 'international1' },
	int3: { fromKeyCode: 'international3' },
	henk: { fromKeyCode: 'japanese_pc_xfer', toKeyCode: 'japanese_kana' },
	mhnk: { fromKeyCode: 'japanese_pc_nfer', toKeyCode: 'japanese_eisuu' },
	kana: { fromKeyCode: 'japanese_kana' },
	eisu: { fromKeyCode: 'japanese_eisuu' },
	fn: { fromKeyCode: 'fn' },

	// =========================================================================
	// Function keys (12)
	// =========================================================================
	f1: { fromKeyCode: 'f1' },
	f2: { fromKeyCode: 'f2' },
	f3: { fromKeyCode: 'f3' },
	f4: { fromKeyCode: 'f4' },
	f5: { fromKeyCode: 'f5' },
	f6: { fromKeyCode: 'f6' },
	f7: { fromKeyCode: 'f7' },
	f8: { fromKeyCode: 'f8' },
	f9: { fromKeyCode: 'f9' },
	f10: { fromKeyCode: 'f10' },
	f11: { fromKeyCode: 'f11' },
	f12: { fromKeyCode: 'f12' },
	f13: { fromKeyCode: 'f13' },
	f14: { fromKeyCode: 'f14' },
	f15: { fromKeyCode: 'f15' },
	f16: { fromKeyCode: 'f16' },
	f17: { fromKeyCode: 'f17' },
	f18: { fromKeyCode: 'f18' },
	f19: { fromKeyCode: 'f19' },

	// =========================================================================
	// Modifier keys
	// =========================================================================
	lsft: { fromKeyCode: 'left_shift' },
	rsft: { fromKeyCode: 'right_shift' },
	lctl: { fromKeyCode: 'left_control' },
	rctl: { fromKeyCode: 'right_control' },
	lalt: { fromKeyCode: 'left_option' },
	ralt: { fromKeyCode: 'right_option' },
	lmet: { fromKeyCode: 'left_command' },
	rmet: { fromKeyCode: 'right_command' },
	caps: { fromKeyCode: 'caps_lock' },

	// =========================================================================
	// Navigation / editing keys
	// =========================================================================
	esc: { fromKeyCode: 'escape' },
	tab: { fromKeyCode: 'tab' },
	ret: { fromKeyCode: 'return_or_enter' },
	spc: { fromKeyCode: 'spacebar' },
	bspc: { fromKeyCode: 'delete_or_backspace' },
	del: { fromKeyCode: 'delete_forward' },
	ins: { fromKeyCode: 'insert' },
	home: { fromKeyCode: 'home' },
	end: { fromKeyCode: 'end' },
	pgup: { fromKeyCode: 'page_up' },
	pgdn: { fromKeyCode: 'page_down' },
	up: { fromKeyCode: 'up_arrow' },
	down: { fromKeyCode: 'down_arrow' },
	lft: { fromKeyCode: 'left_arrow' },
	rght: { fromKeyCode: 'right_arrow' },

	// =========================================================================
	// System keys
	// =========================================================================
	prtsc: { fromKeyCode: 'print_screen' },
	slck: { fromKeyCode: 'scroll_lock' },
	pause: { fromKeyCode: 'pause' },
	comp: { fromKeyCode: 'application' },

	// =========================================================================
	// Numpad keys
	// =========================================================================
	nlck: { fromKeyCode: 'keypad_num_lock' },
	'kp/': { fromKeyCode: 'keypad_slash' },
	'kp*': { fromKeyCode: 'keypad_asterisk' },
	'kp-': { fromKeyCode: 'keypad_hyphen' },
	'kp+': { fromKeyCode: 'keypad_plus' },
	kprt: { fromKeyCode: 'keypad_enter' },
	'kp.': { fromKeyCode: 'keypad_period' },
	kp0: { fromKeyCode: 'keypad_0' },
	kp1: { fromKeyCode: 'keypad_1' },
	kp2: { fromKeyCode: 'keypad_2' },
	kp3: { fromKeyCode: 'keypad_3' },
	kp4: { fromKeyCode: 'keypad_4' },
	kp5: { fromKeyCode: 'keypad_5' },
	kp6: { fromKeyCode: 'keypad_6' },
	kp7: { fromKeyCode: 'keypad_7' },
	kp8: { fromKeyCode: 'keypad_8' },
	kp9: { fromKeyCode: 'keypad_9' },
	'kp=': { fromKeyCode: 'keypad_equal_sign' },

	// =========================================================================
	// Media keys (KE unsupported — kanata only)
	// =========================================================================
	volu: { fromKeyCode: 'volume_increment', keUnsupported: true },
	vold: { fromKeyCode: 'volume_decrement', keUnsupported: true },
	mute: { fromKeyCode: 'mute', keUnsupported: true },
	pp: { fromKeyCode: 'play_or_pause', keUnsupported: true },
	prev: { fromKeyCode: 'scan_previous_track', keUnsupported: true },
	next: { fromKeyCode: 'scan_next_track', keUnsupported: true },
	stop: { fromKeyCode: 'stop', keUnsupported: true }
};

/**
 * kanata キー名から KE key_code (from 用) を取得
 * @returns KE key_code, or undefined if not mapped
 */
export function getKeFromKeyCode(kanataKey: string): string | undefined {
	return KANATA_TO_KE_MAP[kanataKey]?.fromKeyCode;
}

/**
 * kanata キー名から KE key_code (to 用) を取得
 * henk/mhnk は from と異なる key_code を返す
 */
export function getKeToKeyCode(kanataKey: string): string | undefined {
	const mapping = KANATA_TO_KE_MAP[kanataKey];
	if (!mapping) return undefined;
	return mapping.toKeyCode ?? mapping.fromKeyCode;
}

/**
 * KE エクスポートでサポートされないキーか判定
 */
export function isKeUnsupported(kanataKey: string): boolean {
	return KANATA_TO_KE_MAP[kanataKey]?.keUnsupported === true;
}
