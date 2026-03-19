// =============================================================================
// Unified Key Metadata Registry — Single Source of Truth for all key data
// =============================================================================
// Depends on: $lib/paraglide/messages (i18n)
// Tested by: N/A (data-only module, tested via facades)
// Called from: models/shift-labels.ts, models/jis-us-map.ts, utils/kanata-keys.ts
// All label, category, and mapping data for keyboard keys are defined here.
// Other modules (shift-labels.ts, kanata-keys.ts, jis-us-map.ts) derive from
// this registry via facades, keeping their export interfaces unchanged.

import * as m from '$lib/paraglide/messages';

export interface KeyMetadata {
	/** Physical key ID (event.code) — empty string for virtual keys */
	physicalKeyId: string;
	/** Kanata defsrc name */
	kanataName: string;
	/** Display label for KeyPicker */
	displayLabel: string;
	/** JIS layout normal character */
	jisNormal: string;
	/** JIS layout Shift character (null = no dual-line display) */
	jisShift: string | null;
	/** US layout normal character */
	usNormal: string;
	/** US layout Shift character (null = no dual-line display) */
	usShift: string | null;
	/** Category for KeyPicker grouping */
	category: string;
}

// Compact tuple: [kanataName, physicalKeyId, displayLabel, category, jisNormal, jisShift, usNormal, usShift]
type E = [string, string, string, string, string, string | null, string, string | null];

const ENTRIES: E[] = [
	// =========================================================================
	// basic — alphabet keys + virtual keys
	// =========================================================================
	['_', '', 'Trans', 'basic', '_', null, '_', null],
	['XX', '', 'No-op', 'basic', 'XX', null, 'XX', null],
	['a', 'KeyA', 'A', 'basic', 'a', 'A', 'a', 'A'],
	['b', 'KeyB', 'B', 'basic', 'b', 'B', 'b', 'B'],
	['c', 'KeyC', 'C', 'basic', 'c', 'C', 'c', 'C'],
	['d', 'KeyD', 'D', 'basic', 'd', 'D', 'd', 'D'],
	['e', 'KeyE', 'E', 'basic', 'e', 'E', 'e', 'E'],
	['f', 'KeyF', 'F', 'basic', 'f', 'F', 'f', 'F'],
	['g', 'KeyG', 'G', 'basic', 'g', 'G', 'g', 'G'],
	['h', 'KeyH', 'H', 'basic', 'h', 'H', 'h', 'H'],
	['i', 'KeyI', 'I', 'basic', 'i', 'I', 'i', 'I'],
	['j', 'KeyJ', 'J', 'basic', 'j', 'J', 'j', 'J'],
	['k', 'KeyK', 'K', 'basic', 'k', 'K', 'k', 'K'],
	['l', 'KeyL', 'L', 'basic', 'l', 'L', 'l', 'L'],
	['m', 'KeyM', 'M', 'basic', 'm', 'M', 'm', 'M'],
	['n', 'KeyN', 'N', 'basic', 'n', 'N', 'n', 'N'],
	['o', 'KeyO', 'O', 'basic', 'o', 'O', 'o', 'O'],
	['p', 'KeyP', 'P', 'basic', 'p', 'P', 'p', 'P'],
	['q', 'KeyQ', 'Q', 'basic', 'q', 'Q', 'q', 'Q'],
	['r', 'KeyR', 'R', 'basic', 'r', 'R', 'r', 'R'],
	['s', 'KeyS', 'S', 'basic', 's', 'S', 's', 'S'],
	['t', 'KeyT', 'T', 'basic', 't', 'T', 't', 'T'],
	['u', 'KeyU', 'U', 'basic', 'u', 'U', 'u', 'U'],
	['v', 'KeyV', 'V', 'basic', 'v', 'V', 'v', 'V'],
	['w', 'KeyW', 'W', 'basic', 'w', 'W', 'w', 'W'],
	['x', 'KeyX', 'X', 'basic', 'x', 'X', 'x', 'X'],
	['y', 'KeyY', 'Y', 'basic', 'y', 'Y', 'y', 'Y'],
	['z', 'KeyZ', 'Z', 'basic', 'z', 'Z', 'z', 'Z'],

	// =========================================================================
	// numbers
	// =========================================================================
	['1', 'Digit1', '1', 'numbers', '1', '!', '1', '!'],
	['2', 'Digit2', '2', 'numbers', '2', '"', '2', '@'],
	['3', 'Digit3', '3', 'numbers', '3', '#', '3', '#'],
	['4', 'Digit4', '4', 'numbers', '4', '$', '4', '$'],
	['5', 'Digit5', '5', 'numbers', '5', '%', '5', '%'],
	['6', 'Digit6', '6', 'numbers', '6', '&', '6', '^'],
	['7', 'Digit7', '7', 'numbers', '7', "'", '7', '&'],
	['8', 'Digit8', '8', 'numbers', '8', '(', '8', '*'],
	['9', 'Digit9', '9', 'numbers', '9', ')', '9', '('],
	['0', 'Digit0', '0', 'numbers', '0', '\u2014', '0', ')'],

	// =========================================================================
	// modifiers
	// =========================================================================
	['lsft', 'ShiftLeft', '*Shift', 'modifiers', '*Shift', null, '*Shift', null],
	['rsft', 'ShiftRight', 'Shift*', 'modifiers', 'Shift*', null, 'Shift*', null],
	['lctl', 'ControlLeft', '*Ctrl', 'modifiers', '*Ctrl', null, '*Ctrl', null],
	['rctl', 'ControlRight', 'Ctrl*', 'modifiers', 'Ctrl*', null, 'Ctrl*', null],
	['lalt', 'AltLeft', '*Alt', 'modifiers', '*Alt', null, '*Alt', null],
	['ralt', 'AltRight', 'Alt*', 'modifiers', 'Alt*', null, 'Alt*', null],
	['lmet', 'MetaLeft', '*Meta', 'modifiers', '*Meta', null, '*Meta', null],
	['rmet', 'MetaRight', 'Meta*', 'modifiers', 'Meta*', null, 'Meta*', null],
	['caps', 'CapsLock', 'CapsLock', 'modifiers', 'Caps', null, 'Caps', null],

	// =========================================================================
	// special — editing, symbols, JIS-specific
	// =========================================================================
	['esc', 'Escape', 'Esc', 'special', 'Esc', null, 'Esc', null],
	['tab', 'Tab', 'Tab', 'special', 'Tab', null, 'Tab', null],
	['spc', 'Space', 'Space', 'special', 'Space', null, 'Space', null],
	['ret', 'Enter', 'Enter', 'special', 'Enter', null, 'Enter', null],
	['bspc', 'Backspace', 'Backspace', 'special', 'Back\nspace', null, 'Back\nspace', null],
	['del', 'Delete', 'Delete', 'special', 'Del', null, 'Del', null],
	['ins', 'Insert', 'Insert', 'special', 'Ins', null, 'Ins', null],
	['grv', 'Backquote', '\u534A\u89D2/\n\u5168\u89D2', 'special', '\u534A/\u5168', null, '`', '~'],
	['\u00A5', 'IntlYen', '\u00A5', 'special', '\u00A5', '|', '\\', '|'],
	['ro', 'IntlRo', '\u308D', 'special', '\u308D', '_', 'Ro', null],
	['henk', 'Convert', '\u5909\u63DB', 'special', '\u5909\u63DB', null, 'Hen\nkan', null],
	['mhnk', 'NonConvert', '\u7121\u5909\u63DB', 'special', '\u7121\u5909\u63DB', null, 'Muhen\nkan', null],
	['eisu', 'Eisu', '英数', 'special', '英数', null, 'LANG2', null],
	['kana', 'Lang1Key', 'かな', 'special', 'かな', null, 'LANG1', null],
	['lang1', '', 'かな', 'special', 'かな', null, 'LANG1', null],
	['lang2', '', '英数', 'special', '英数', null, 'LANG2', null],
	['jp-kana', 'KanaMode', 'カナ', 'special', 'カタカナ\nひらがな', null, 'Katakana\nHiragana', null],
	['comp', 'ContextMenu', 'Menu', 'special', 'Menu', null, 'Menu', null],
	['-', 'Minus', '-', 'special', '-', '=', '-', '_'],
	['=', 'Equal', '^', 'special', '^', '~', '=', '+'],
	['[', 'BracketLeft', '@', 'special', '@', '`', '[', '{'],
	[']', 'BracketRight', '[', 'special', '[', '{', ']', '}'],
	[';', 'Semicolon', ';', 'special', ';', '+', ';', ':'],
	["'", 'Quote', ':', 'special', ':', '*', "'", '"'],
	['\\', 'Backslash', ']', 'special', ']', '}', '\\', '|'],
	[',', 'Comma', ',', 'special', ',', '<', ',', '<'],
	['.', 'Period', '.', 'special', '.', '>', '.', '>'],
	['/', 'Slash', '/', 'special', '/', '?', '/', '?'],
	['prtsc', 'PrintScreen', 'PrtSc', 'special', 'PrtSc', null, 'PrtSc', null],
	['slck', 'ScrollLock', 'ScrLk', 'special', 'ScrLk', null, 'ScrLk', null],
	['pause', 'Pause', 'Pause', 'special', 'Pause', null, 'Pause', null],
	['nlck', 'NumLock', 'NumLk', 'special', 'Lock', 'Num', 'Lock', 'Num'],

	// =========================================================================
	// function
	// =========================================================================
	['f1', 'F1', 'F1', 'function', 'F1', null, 'F1', null],
	['f2', 'F2', 'F2', 'function', 'F2', null, 'F2', null],
	['f3', 'F3', 'F3', 'function', 'F3', null, 'F3', null],
	['f4', 'F4', 'F4', 'function', 'F4', null, 'F4', null],
	['f5', 'F5', 'F5', 'function', 'F5', null, 'F5', null],
	['f6', 'F6', 'F6', 'function', 'F6', null, 'F6', null],
	['f7', 'F7', 'F7', 'function', 'F7', null, 'F7', null],
	['f8', 'F8', 'F8', 'function', 'F8', null, 'F8', null],
	['f9', 'F9', 'F9', 'function', 'F9', null, 'F9', null],
	['f10', 'F10', 'F10', 'function', 'F10', null, 'F10', null],
	['f11', 'F11', 'F11', 'function', 'F11', null, 'F11', null],
	['f12', 'F12', 'F12', 'function', 'F12', null, 'F12', null],
	['f13', 'F13', 'F13', 'function', 'F13', null, 'F13', null],
	['f14', 'F14', 'F14', 'function', 'F14', null, 'F14', null],
	['f15', 'F15', 'F15', 'function', 'F15', null, 'F15', null],
	['f16', 'F16', 'F16', 'function', 'F16', null, 'F16', null],
	['f17', 'F17', 'F17', 'function', 'F17', null, 'F17', null],
	['f18', 'F18', 'F18', 'function', 'F18', null, 'F18', null],
	['f19', 'F19', 'F19', 'function', 'F19', null, 'F19', null],

	// =========================================================================
	// navigation
	// =========================================================================
	['up', 'ArrowUp', '\u2191', 'navigation', '\u2191', null, '\u2191', null],
	['down', 'ArrowDown', '\u2193', 'navigation', '\u2193', null, '\u2193', null],
	['lft', 'ArrowLeft', '\u2190', 'navigation', '\u2190', null, '\u2190', null],
	['rght', 'ArrowRight', '\u2192', 'navigation', '\u2192', null, '\u2192', null],
	['home', 'Home', 'Home', 'navigation', 'Home', null, 'Home', null],
	['end', 'End', 'End', 'navigation', 'End', null, 'End', null],
	['pgup', 'PageUp', 'PgUp', 'navigation', 'PgUp', null, 'PgUp', null],
	['pgdn', 'PageDown', 'PgDn', 'navigation', 'PgDn', null, 'PgDn', null],

	// =========================================================================
	// numpad
	// =========================================================================
	['kp0', 'Numpad0', 'Num 0', 'numpad', '0', 'Num', '0', 'Num'],
	['kp1', 'Numpad1', 'Num 1', 'numpad', '1', 'Num', '1', 'Num'],
	['kp2', 'Numpad2', 'Num 2', 'numpad', '2', 'Num', '2', 'Num'],
	['kp3', 'Numpad3', 'Num 3', 'numpad', '3', 'Num', '3', 'Num'],
	['kp4', 'Numpad4', 'Num 4', 'numpad', '4', 'Num', '4', 'Num'],
	['kp5', 'Numpad5', 'Num 5', 'numpad', '5', 'Num', '5', 'Num'],
	['kp6', 'Numpad6', 'Num 6', 'numpad', '6', 'Num', '6', 'Num'],
	['kp7', 'Numpad7', 'Num 7', 'numpad', '7', 'Num', '7', 'Num'],
	['kp8', 'Numpad8', 'Num 8', 'numpad', '8', 'Num', '8', 'Num'],
	['kp9', 'Numpad9', 'Num 9', 'numpad', '9', 'Num', '9', 'Num'],
	['kp/', 'NumpadDivide', 'Num /', 'numpad', '/', 'Num', '/', 'Num'],
	['kp*', 'NumpadMultiply', 'Num *', 'numpad', '*', 'Num', '*', 'Num'],
	['kp-', 'NumpadSubtract', 'Num -', 'numpad', '-', 'Num', '-', 'Num'],
	['kp+', 'NumpadAdd', 'Num +', 'numpad', '+', 'Num', '+', 'Num'],
	['kprt', 'NumpadEnter', 'Num\nEnter', 'numpad', 'Enter', 'Num', 'Enter', 'Num'],
	['kp.', 'NumpadDecimal', 'Num .', 'numpad', '.', 'Num', '.', 'Num'],
	['kp=', 'NumpadEqual', 'Num =', 'numpad', '=', 'Num', '=', 'Num'],

	// =========================================================================
	// media — virtual keys (no physicalKeyId)
	// =========================================================================
	['volu', '', 'Vol Up', 'media', 'Vol Up', null, 'Vol Up', null],
	['vold', '', 'Vol Down', 'media', 'Vol Down', null, 'Vol Down', null],
	['mute', '', 'Mute', 'media', 'Mute', null, 'Mute', null],
	['pp', '', 'Play/Pause', 'media', 'Play/Pause', null, 'Play/Pause', null],
	['prev', '', 'Previous', 'media', 'Previous', null, 'Previous', null],
	['next', '', 'Next', 'media', 'Next', null, 'Next', null],
	['stop', '', 'Stop', 'media', 'Stop', null, 'Stop', null],

	// =========================================================================
	// apple — Apple-specific keys (no kanata equivalent)
	// =========================================================================
	['fn', 'Fn', 'fn', 'apple', 'fn', null, 'fn', null],
];

function toMetadata(e: E): KeyMetadata {
	return {
		physicalKeyId: e[1],
		kanataName: e[0],
		displayLabel: e[2],
		jisNormal: e[4],
		jisShift: e[5],
		usNormal: e[6],
		usShift: e[7],
		category: e[3],
	};
}

/** Unified key metadata registry — single source of truth */
export const KEY_REGISTRY: ReadonlyMap<string, KeyMetadata> = new Map(
	ENTRIES.map((e) => [e[0], toMetadata(e)])
);

/** kanataName → physicalKeyId reverse lookup */
export const KANATA_NAME_TO_KEY_ID: ReadonlyMap<string, string> = new Map(
	ENTRIES.filter((e) => e[1] !== '').map((e) => [e[0], e[1]])
);

/** カテゴリ表示順序 */
export const CATEGORY_ORDER: readonly { id: string }[] = [
	{ id: 'basic' },
	{ id: 'numbers' },
	{ id: 'modifiers' },
	{ id: 'special' },
	{ id: 'function' },
	{ id: 'navigation' },
	{ id: 'numpad' },
	{ id: 'media' },
	{ id: 'apple' },
];

/** カテゴリの表示ラベル（ロケール対応） */
export function getCategoryLabel(id: string): string {
	const labels: Record<string, () => string> = {
		basic: m.category_basic,
		numbers: m.category_numbers,
		modifiers: m.category_modifiers,
		special: m.category_special,
		function: m.category_function,
		navigation: m.category_navigation,
		numpad: m.category_numpad,
		media: m.category_media,
		apple: m.category_apple,
	};
	return labels[id]?.() ?? id;
}
