// =============================================================================
// kanata → AutoHotkey v2 key mapping
// =============================================================================
// Depends on: (none)
// Tested by: tests/unit/ahk-keycode-map.test.ts
// Called from: services/ahk-generator.ts

/** AHK 送信方法 */
export type AhkSendMode = 'text' | 'key';

/** AHK key mapping 定義 */
export interface AhkKeyMapping {
	hotkeyToken: string;
	sendToken: string;
	sendMode: AhkSendMode;
	scanCode?: string;
	virtualKeyCode?: string;
	category: string;
}

/** kanata キー名 → AHK マッピング */
export const KANATA_TO_AHK_MAP: Readonly<Record<string, AhkKeyMapping>> = {
	// =========================================================================
	// Alphabet keys
	// =========================================================================
	a: { hotkeyToken: 'a', sendToken: 'a', sendMode: 'text', category: 'basic' },
	b: { hotkeyToken: 'b', sendToken: 'b', sendMode: 'text', category: 'basic' },
	c: { hotkeyToken: 'c', sendToken: 'c', sendMode: 'text', category: 'basic' },
	d: { hotkeyToken: 'd', sendToken: 'd', sendMode: 'text', category: 'basic' },
	e: { hotkeyToken: 'e', sendToken: 'e', sendMode: 'text', category: 'basic' },
	f: { hotkeyToken: 'f', sendToken: 'f', sendMode: 'text', category: 'basic' },
	g: { hotkeyToken: 'g', sendToken: 'g', sendMode: 'text', category: 'basic' },
	h: { hotkeyToken: 'h', sendToken: 'h', sendMode: 'text', category: 'basic' },
	i: { hotkeyToken: 'i', sendToken: 'i', sendMode: 'text', category: 'basic' },
	j: { hotkeyToken: 'j', sendToken: 'j', sendMode: 'text', category: 'basic' },
	k: { hotkeyToken: 'k', sendToken: 'k', sendMode: 'text', category: 'basic' },
	l: { hotkeyToken: 'l', sendToken: 'l', sendMode: 'text', category: 'basic' },
	m: { hotkeyToken: 'm', sendToken: 'm', sendMode: 'text', category: 'basic' },
	n: { hotkeyToken: 'n', sendToken: 'n', sendMode: 'text', category: 'basic' },
	o: { hotkeyToken: 'o', sendToken: 'o', sendMode: 'text', category: 'basic' },
	p: { hotkeyToken: 'p', sendToken: 'p', sendMode: 'text', category: 'basic' },
	q: { hotkeyToken: 'q', sendToken: 'q', sendMode: 'text', category: 'basic' },
	r: { hotkeyToken: 'r', sendToken: 'r', sendMode: 'text', category: 'basic' },
	s: { hotkeyToken: 's', sendToken: 's', sendMode: 'text', category: 'basic' },
	t: { hotkeyToken: 't', sendToken: 't', sendMode: 'text', category: 'basic' },
	u: { hotkeyToken: 'u', sendToken: 'u', sendMode: 'text', category: 'basic' },
	v: { hotkeyToken: 'v', sendToken: 'v', sendMode: 'text', category: 'basic' },
	w: { hotkeyToken: 'w', sendToken: 'w', sendMode: 'text', category: 'basic' },
	x: { hotkeyToken: 'x', sendToken: 'x', sendMode: 'text', category: 'basic' },
	y: { hotkeyToken: 'y', sendToken: 'y', sendMode: 'text', category: 'basic' },
	z: { hotkeyToken: 'z', sendToken: 'z', sendMode: 'text', category: 'basic' },

	// =========================================================================
	// Number keys
	// =========================================================================
	'1': { hotkeyToken: '1', sendToken: '1', sendMode: 'text', category: 'numbers' },
	'2': { hotkeyToken: '2', sendToken: '2', sendMode: 'text', category: 'numbers' },
	'3': { hotkeyToken: '3', sendToken: '3', sendMode: 'text', category: 'numbers' },
	'4': { hotkeyToken: '4', sendToken: '4', sendMode: 'text', category: 'numbers' },
	'5': { hotkeyToken: '5', sendToken: '5', sendMode: 'text', category: 'numbers' },
	'6': { hotkeyToken: '6', sendToken: '6', sendMode: 'text', category: 'numbers' },
	'7': { hotkeyToken: '7', sendToken: '7', sendMode: 'text', category: 'numbers' },
	'8': { hotkeyToken: '8', sendToken: '8', sendMode: 'text', category: 'numbers' },
	'9': { hotkeyToken: '9', sendToken: '9', sendMode: 'text', category: 'numbers' },
	'0': { hotkeyToken: '0', sendToken: '0', sendMode: 'text', category: 'numbers' },

	// =========================================================================
	// Symbol keys
	// =========================================================================
	'-': { hotkeyToken: '-', sendToken: '-', sendMode: 'text', category: 'basic' },
	'=': { hotkeyToken: '=', sendToken: '=', sendMode: 'text', category: 'basic' },
	'[': { hotkeyToken: '[', sendToken: '[', sendMode: 'text', category: 'basic' },
	']': { hotkeyToken: ']', sendToken: ']', sendMode: 'text', category: 'basic' },
	';': { hotkeyToken: ';', sendToken: ';', sendMode: 'text', category: 'basic' },
	"'": { hotkeyToken: "'", sendToken: "'", sendMode: 'text', category: 'basic' },
	'\\': { hotkeyToken: '\\', sendToken: '\\', sendMode: 'text', category: 'basic' },
	'/': { hotkeyToken: '/', sendToken: '/', sendMode: 'text', category: 'basic' },
	',': { hotkeyToken: ',', sendToken: ',', sendMode: 'text', category: 'basic' },
	'.': { hotkeyToken: '.', sendToken: '.', sendMode: 'text', category: 'basic' },
	grv: { hotkeyToken: '`', sendToken: '`', sendMode: 'text', category: 'basic' },

	// =========================================================================
	// JIS-specific keys
	// =========================================================================
	'¥': {
		hotkeyToken: 'sc07D',
		sendToken: 'sc07D',
		sendMode: 'key',
		scanCode: 'sc07D',
		category: 'jis'
	},
	ro: {
		hotkeyToken: 'sc073',
		sendToken: 'sc073',
		sendMode: 'key',
		scanCode: 'sc073',
		category: 'jis'
	},
	henk: {
		hotkeyToken: 'vk1C',
		sendToken: 'vk1C',
		sendMode: 'key',
		virtualKeyCode: 'vk1C',
		category: 'jis'
	},
	mhnk: {
		hotkeyToken: 'vk1D',
		sendToken: 'vk1D',
		sendMode: 'key',
		virtualKeyCode: 'vk1D',
		category: 'jis'
	},
	kana: {
		hotkeyToken: 'vkF2',
		sendToken: 'vkF2',
		sendMode: 'key',
		virtualKeyCode: 'vkF2',
		category: 'jis'
	},
	eisu: {
		hotkeyToken: 'vkF3',
		sendToken: 'vkF3',
		sendMode: 'key',
		virtualKeyCode: 'vkF3',
		category: 'jis'
	},
	// 新 action ID: lang1/lang2/jp-kana
	lang1: {
		hotkeyToken: 'vk16',
		sendToken: 'vk16',
		sendMode: 'key',
		virtualKeyCode: 'vk16',
		category: 'jis'
	},
	lang2: {
		hotkeyToken: 'vk1A',
		sendToken: 'vk1A',
		sendMode: 'key',
		virtualKeyCode: 'vk1A',
		category: 'jis'
	},
	'jp-kana': {
		hotkeyToken: 'vkF2',
		sendToken: 'vkF2',
		sendMode: 'key',
		virtualKeyCode: 'vkF2',
		category: 'jis'
	},

	// =========================================================================
	// Function keys
	// =========================================================================
	f1: { hotkeyToken: 'F1', sendToken: 'F1', sendMode: 'key', category: 'function' },
	f2: { hotkeyToken: 'F2', sendToken: 'F2', sendMode: 'key', category: 'function' },
	f3: { hotkeyToken: 'F3', sendToken: 'F3', sendMode: 'key', category: 'function' },
	f4: { hotkeyToken: 'F4', sendToken: 'F4', sendMode: 'key', category: 'function' },
	f5: { hotkeyToken: 'F5', sendToken: 'F5', sendMode: 'key', category: 'function' },
	f6: { hotkeyToken: 'F6', sendToken: 'F6', sendMode: 'key', category: 'function' },
	f7: { hotkeyToken: 'F7', sendToken: 'F7', sendMode: 'key', category: 'function' },
	f8: { hotkeyToken: 'F8', sendToken: 'F8', sendMode: 'key', category: 'function' },
	f9: { hotkeyToken: 'F9', sendToken: 'F9', sendMode: 'key', category: 'function' },
	f10: { hotkeyToken: 'F10', sendToken: 'F10', sendMode: 'key', category: 'function' },
	f11: { hotkeyToken: 'F11', sendToken: 'F11', sendMode: 'key', category: 'function' },
	f12: { hotkeyToken: 'F12', sendToken: 'F12', sendMode: 'key', category: 'function' },
	f13: { hotkeyToken: 'F13', sendToken: 'F13', sendMode: 'key', category: 'function' },
	f14: { hotkeyToken: 'F14', sendToken: 'F14', sendMode: 'key', category: 'function' },
	f15: { hotkeyToken: 'F15', sendToken: 'F15', sendMode: 'key', category: 'function' },
	f16: { hotkeyToken: 'F16', sendToken: 'F16', sendMode: 'key', category: 'function' },
	f17: { hotkeyToken: 'F17', sendToken: 'F17', sendMode: 'key', category: 'function' },
	f18: { hotkeyToken: 'F18', sendToken: 'F18', sendMode: 'key', category: 'function' },
	f19: { hotkeyToken: 'F19', sendToken: 'F19', sendMode: 'key', category: 'function' },

	// =========================================================================
	// Modifier keys
	// =========================================================================
	lsft: { hotkeyToken: 'LShift', sendToken: 'LShift', sendMode: 'key', category: 'modifiers' },
	rsft: { hotkeyToken: 'RShift', sendToken: 'RShift', sendMode: 'key', category: 'modifiers' },
	lctl: { hotkeyToken: 'LCtrl', sendToken: 'LCtrl', sendMode: 'key', category: 'modifiers' },
	rctl: { hotkeyToken: 'RCtrl', sendToken: 'RCtrl', sendMode: 'key', category: 'modifiers' },
	lalt: { hotkeyToken: 'LAlt', sendToken: 'LAlt', sendMode: 'key', category: 'modifiers' },
	ralt: { hotkeyToken: 'RAlt', sendToken: 'RAlt', sendMode: 'key', category: 'modifiers' },
	lmet: { hotkeyToken: 'LWin', sendToken: 'LWin', sendMode: 'key', category: 'modifiers' },
	rmet: { hotkeyToken: 'RWin', sendToken: 'RWin', sendMode: 'key', category: 'modifiers' },
	caps: { hotkeyToken: 'CapsLock', sendToken: 'CapsLock', sendMode: 'key', category: 'modifiers' },

	// =========================================================================
	// Navigation / editing keys
	// =========================================================================
	esc: { hotkeyToken: 'Esc', sendToken: 'Esc', sendMode: 'key', category: 'navigation' },
	tab: { hotkeyToken: 'Tab', sendToken: 'Tab', sendMode: 'key', category: 'navigation' },
	ret: { hotkeyToken: 'Enter', sendToken: 'Enter', sendMode: 'key', category: 'navigation' },
	spc: { hotkeyToken: 'Space', sendToken: 'Space', sendMode: 'key', category: 'navigation' },
	bspc: { hotkeyToken: 'Backspace', sendToken: 'Backspace', sendMode: 'key', category: 'navigation' },
	del: { hotkeyToken: 'Delete', sendToken: 'Delete', sendMode: 'key', category: 'navigation' },
	ins: { hotkeyToken: 'Insert', sendToken: 'Insert', sendMode: 'key', category: 'navigation' },
	home: { hotkeyToken: 'Home', sendToken: 'Home', sendMode: 'key', category: 'navigation' },
	end: { hotkeyToken: 'End', sendToken: 'End', sendMode: 'key', category: 'navigation' },
	pgup: { hotkeyToken: 'PgUp', sendToken: 'PgUp', sendMode: 'key', category: 'navigation' },
	pgdn: { hotkeyToken: 'PgDn', sendToken: 'PgDn', sendMode: 'key', category: 'navigation' },
	up: { hotkeyToken: 'Up', sendToken: 'Up', sendMode: 'key', category: 'navigation' },
	down: { hotkeyToken: 'Down', sendToken: 'Down', sendMode: 'key', category: 'navigation' },
	lft: { hotkeyToken: 'Left', sendToken: 'Left', sendMode: 'key', category: 'navigation' },
	rght: { hotkeyToken: 'Right', sendToken: 'Right', sendMode: 'key', category: 'navigation' },

	// =========================================================================
	// System keys
	// =========================================================================
	prtsc: { hotkeyToken: 'PrintScreen', sendToken: 'PrintScreen', sendMode: 'key', category: 'special' },
	slck: { hotkeyToken: 'ScrollLock', sendToken: 'ScrollLock', sendMode: 'key', category: 'special' },
	pause: { hotkeyToken: 'Pause', sendToken: 'Pause', sendMode: 'key', category: 'special' },
	comp: { hotkeyToken: 'AppsKey', sendToken: 'AppsKey', sendMode: 'key', category: 'special' },

	// =========================================================================
	// Numpad keys
	// =========================================================================
	nlck: { hotkeyToken: 'NumLock', sendToken: 'NumLock', sendMode: 'key', category: 'numpad' },
	'kp/': { hotkeyToken: 'NumpadDiv', sendToken: 'NumpadDiv', sendMode: 'key', category: 'numpad' },
	'kp*': { hotkeyToken: 'NumpadMult', sendToken: 'NumpadMult', sendMode: 'key', category: 'numpad' },
	'kp-': { hotkeyToken: 'NumpadSub', sendToken: 'NumpadSub', sendMode: 'key', category: 'numpad' },
	'kp+': { hotkeyToken: 'NumpadAdd', sendToken: 'NumpadAdd', sendMode: 'key', category: 'numpad' },
	kprt: { hotkeyToken: 'NumpadEnter', sendToken: 'NumpadEnter', sendMode: 'key', category: 'numpad' },
	'kp.': { hotkeyToken: 'NumpadDot', sendToken: 'NumpadDot', sendMode: 'key', category: 'numpad' },
	kp0: { hotkeyToken: 'Numpad0', sendToken: 'Numpad0', sendMode: 'key', category: 'numpad' },
	kp1: { hotkeyToken: 'Numpad1', sendToken: 'Numpad1', sendMode: 'key', category: 'numpad' },
	kp2: { hotkeyToken: 'Numpad2', sendToken: 'Numpad2', sendMode: 'key', category: 'numpad' },
	kp3: { hotkeyToken: 'Numpad3', sendToken: 'Numpad3', sendMode: 'key', category: 'numpad' },
	kp4: { hotkeyToken: 'Numpad4', sendToken: 'Numpad4', sendMode: 'key', category: 'numpad' },
	kp5: { hotkeyToken: 'Numpad5', sendToken: 'Numpad5', sendMode: 'key', category: 'numpad' },
	kp6: { hotkeyToken: 'Numpad6', sendToken: 'Numpad6', sendMode: 'key', category: 'numpad' },
	kp7: { hotkeyToken: 'Numpad7', sendToken: 'Numpad7', sendMode: 'key', category: 'numpad' },
	kp8: { hotkeyToken: 'Numpad8', sendToken: 'Numpad8', sendMode: 'key', category: 'numpad' },
	kp9: { hotkeyToken: 'Numpad9', sendToken: 'Numpad9', sendMode: 'key', category: 'numpad' },
	'kp=': { hotkeyToken: 'NumpadClear', sendToken: 'NumpadClear', sendMode: 'key', category: 'numpad' },

	// =========================================================================
	// Media keys
	// =========================================================================
	volu: { hotkeyToken: 'Volume_Up', sendToken: 'Volume_Up', sendMode: 'key', category: 'media' },
	vold: { hotkeyToken: 'Volume_Down', sendToken: 'Volume_Down', sendMode: 'key', category: 'media' },
	mute: { hotkeyToken: 'Volume_Mute', sendToken: 'Volume_Mute', sendMode: 'key', category: 'media' },
	pp: { hotkeyToken: 'Media_Play_Pause', sendToken: 'Media_Play_Pause', sendMode: 'key', category: 'media' },
	prev: { hotkeyToken: 'Media_Prev', sendToken: 'Media_Prev', sendMode: 'key', category: 'media' },
	next: { hotkeyToken: 'Media_Next', sendToken: 'Media_Next', sendMode: 'key', category: 'media' },
	stop: { hotkeyToken: 'Media_Stop', sendToken: 'Media_Stop', sendMode: 'key', category: 'media' }
};

/** AHK mapping を取得する */
export function getAhkKeyMapping(kanataKey: string): AhkKeyMapping | undefined {
	return KANATA_TO_AHK_MAP[kanataKey];
}

/** AHK の hotkey token を取得する */
export function getAhkHotkeyToken(kanataKey: string): string | undefined {
	return KANATA_TO_AHK_MAP[kanataKey]?.hotkeyToken;
}

/** AHK の send token を取得する */
export function getAhkSendToken(kanataKey: string): string | undefined {
	return KANATA_TO_AHK_MAP[kanataKey]?.sendToken;
}

/** AHK mapping の有無を判定する */
export function hasAhkMapping(kanataKey: string): boolean {
	return kanataKey in KANATA_TO_AHK_MAP;
}