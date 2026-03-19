// =============================================================================
// ANSI 104 Keyboard Template Data
// =============================================================================
// 104 keys with coordinates in key units (1u = standard key width)
// viewBox: "0 0 23 6.5"
// Cluster layout: Main(0~15u) + 0.5u gap + Nav(15.5~18.5u) + 0.5u gap + Numpad(19~23u)
//
// Differences from JIS 109:
//   Removed: IntlYen, IntlRo, NonConvert, Convert, KanaMode (5 keys)
//   Changed: Backspace 2u, Enter rect 2.25u on Row 3, Backslash on Row 2 1.5u,
//            ShiftRight 2.75u, Space 6.25u, modifier key sizes adjusted
//   Labels: US layout labels (`, =, [, ], ', \)

import type { LayoutTemplate, PhysicalKey } from '$lib/models/types';

const keys: PhysicalKey[] = [
	// =========================================================================
	// Row 0: Function keys (y = 0) — 16 keys
	// =========================================================================
	{ id: 'Escape', label: 'Esc', kanataName: 'esc', x: 0, y: 0, width: 1, height: 1 },
	{ id: 'F1', label: 'F1', kanataName: 'f1', x: 2, y: 0, width: 1, height: 1 },
	{ id: 'F2', label: 'F2', kanataName: 'f2', x: 3, y: 0, width: 1, height: 1 },
	{ id: 'F3', label: 'F3', kanataName: 'f3', x: 4, y: 0, width: 1, height: 1 },
	{ id: 'F4', label: 'F4', kanataName: 'f4', x: 5, y: 0, width: 1, height: 1 },
	{ id: 'F5', label: 'F5', kanataName: 'f5', x: 6.5, y: 0, width: 1, height: 1 },
	{ id: 'F6', label: 'F6', kanataName: 'f6', x: 7.5, y: 0, width: 1, height: 1 },
	{ id: 'F7', label: 'F7', kanataName: 'f7', x: 8.5, y: 0, width: 1, height: 1 },
	{ id: 'F8', label: 'F8', kanataName: 'f8', x: 9.5, y: 0, width: 1, height: 1 },
	{ id: 'F9', label: 'F9', kanataName: 'f9', x: 11, y: 0, width: 1, height: 1 },
	{ id: 'F10', label: 'F10', kanataName: 'f10', x: 12, y: 0, width: 1, height: 1 },
	{ id: 'F11', label: 'F11', kanataName: 'f11', x: 13, y: 0, width: 1, height: 1 },
	{ id: 'F12', label: 'F12', kanataName: 'f12', x: 14, y: 0, width: 1, height: 1 },
	// Nav cluster row 0
	{ id: 'PrintScreen', label: 'PrtSc', kanataName: 'prtsc', x: 15.5, y: 0, width: 1, height: 1 },
	{ id: 'ScrollLock', label: 'ScrLk', kanataName: 'slck', x: 16.5, y: 0, width: 1, height: 1 },
	{ id: 'Pause', label: 'Pause', kanataName: 'pause', x: 17.5, y: 0, width: 1, height: 1 },

	// =========================================================================
	// Row 1: Number row (y = 1.5) — 21 keys
	// =========================================================================
	{ id: 'Backquote', label: '`', kanataName: 'grv', x: 0, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit1', label: '1', kanataName: '1', x: 1, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit2', label: '2', kanataName: '2', x: 2, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit3', label: '3', kanataName: '3', x: 3, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit4', label: '4', kanataName: '4', x: 4, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit5', label: '5', kanataName: '5', x: 5, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit6', label: '6', kanataName: '6', x: 6, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit7', label: '7', kanataName: '7', x: 7, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit8', label: '8', kanataName: '8', x: 8, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit9', label: '9', kanataName: '9', x: 9, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit0', label: '0', kanataName: '0', x: 10, y: 1.5, width: 1, height: 1 },
	{ id: 'Minus', label: '-', kanataName: '-', x: 11, y: 1.5, width: 1, height: 1 },
	{ id: 'Equal', label: '=', kanataName: '=', x: 12, y: 1.5, width: 1, height: 1 },
	// IntlYen removed — ANSI has no Yen key
	{ id: 'Backspace', label: 'Back\nspace', kanataName: 'bspc', x: 13, y: 1.5, width: 2, height: 1 },
	// Nav cluster row 1
	{ id: 'Insert', label: 'Ins', kanataName: 'ins', x: 15.5, y: 1.5, width: 1, height: 1 },
	{ id: 'Home', label: 'Home', kanataName: 'home', x: 16.5, y: 1.5, width: 1, height: 1 },
	{ id: 'PageUp', label: 'PgUp', kanataName: 'pgup', x: 17.5, y: 1.5, width: 1, height: 1 },
	// Numpad row 1
	{ id: 'NumLock', label: 'NumLk', kanataName: 'nlck', x: 19, y: 1.5, width: 1, height: 1 },
	{ id: 'NumpadDivide', label: '/', kanataName: 'kp/', x: 20, y: 1.5, width: 1, height: 1 },
	{ id: 'NumpadMultiply', label: '*', kanataName: 'kp*', x: 21, y: 1.5, width: 1, height: 1 },
	{ id: 'NumpadSubtract', label: '-', kanataName: 'kp-', x: 22, y: 1.5, width: 1, height: 1 },

	// =========================================================================
	// Row 2: QWERTY row (y = 2.5) — 21 keys
	// =========================================================================
	{ id: 'Tab', label: 'Tab', kanataName: 'tab', x: 0, y: 2.5, width: 1.5, height: 1 },
	{ id: 'KeyQ', label: 'Q', kanataName: 'q', x: 1.5, y: 2.5, width: 1, height: 1 },
	{ id: 'KeyW', label: 'W', kanataName: 'w', x: 2.5, y: 2.5, width: 1, height: 1 },
	{ id: 'KeyE', label: 'E', kanataName: 'e', x: 3.5, y: 2.5, width: 1, height: 1 },
	{ id: 'KeyR', label: 'R', kanataName: 'r', x: 4.5, y: 2.5, width: 1, height: 1 },
	{ id: 'KeyT', label: 'T', kanataName: 't', x: 5.5, y: 2.5, width: 1, height: 1 },
	{ id: 'KeyY', label: 'Y', kanataName: 'y', x: 6.5, y: 2.5, width: 1, height: 1 },
	{ id: 'KeyU', label: 'U', kanataName: 'u', x: 7.5, y: 2.5, width: 1, height: 1 },
	{ id: 'KeyI', label: 'I', kanataName: 'i', x: 8.5, y: 2.5, width: 1, height: 1 },
	{ id: 'KeyO', label: 'O', kanataName: 'o', x: 9.5, y: 2.5, width: 1, height: 1 },
	{ id: 'KeyP', label: 'P', kanataName: 'p', x: 10.5, y: 2.5, width: 1, height: 1 },
	{ id: 'BracketLeft', label: '[', kanataName: '[', x: 11.5, y: 2.5, width: 1, height: 1 },
	{ id: 'BracketRight', label: ']', kanataName: ']', x: 12.5, y: 2.5, width: 1, height: 1 },
	// Backslash moved from Row 3 to Row 2 in ANSI layout
	{ id: 'Backslash', label: '\\', kanataName: '\\', x: 13.5, y: 2.5, width: 1.5, height: 1 },
	// Nav cluster row 2
	{ id: 'Delete', label: 'Del', kanataName: 'del', x: 15.5, y: 2.5, width: 1, height: 1 },
	{ id: 'End', label: 'End', kanataName: 'end', x: 16.5, y: 2.5, width: 1, height: 1 },
	{ id: 'PageDown', label: 'PgDn', kanataName: 'pgdn', x: 17.5, y: 2.5, width: 1, height: 1 },
	// Numpad row 2
	{ id: 'Numpad7', label: '7', kanataName: 'kp7', x: 19, y: 2.5, width: 1, height: 1 },
	{ id: 'Numpad8', label: '8', kanataName: 'kp8', x: 20, y: 2.5, width: 1, height: 1 },
	{ id: 'Numpad9', label: '9', kanataName: 'kp9', x: 21, y: 2.5, width: 1, height: 1 },
	{ id: 'NumpadAdd', label: '+', kanataName: 'kp+', x: 22, y: 2.5, width: 1, height: 2 },

	// =========================================================================
	// Row 3: Home row (y = 3.5) — 16 keys
	// =========================================================================
	{ id: 'CapsLock', label: 'Caps', kanataName: 'caps', x: 0, y: 3.5, width: 1.75, height: 1 },
	{ id: 'KeyA', label: 'A', kanataName: 'a', x: 1.75, y: 3.5, width: 1, height: 1 },
	{ id: 'KeyS', label: 'S', kanataName: 's', x: 2.75, y: 3.5, width: 1, height: 1 },
	{ id: 'KeyD', label: 'D', kanataName: 'd', x: 3.75, y: 3.5, width: 1, height: 1 },
	{ id: 'KeyF', label: 'F', kanataName: 'f', x: 4.75, y: 3.5, width: 1, height: 1 },
	{ id: 'KeyG', label: 'G', kanataName: 'g', x: 5.75, y: 3.5, width: 1, height: 1 },
	{ id: 'KeyH', label: 'H', kanataName: 'h', x: 6.75, y: 3.5, width: 1, height: 1 },
	{ id: 'KeyJ', label: 'J', kanataName: 'j', x: 7.75, y: 3.5, width: 1, height: 1 },
	{ id: 'KeyK', label: 'K', kanataName: 'k', x: 8.75, y: 3.5, width: 1, height: 1 },
	{ id: 'KeyL', label: 'L', kanataName: 'l', x: 9.75, y: 3.5, width: 1, height: 1 },
	{ id: 'Semicolon', label: ';', kanataName: ';', x: 10.75, y: 3.5, width: 1, height: 1 },
	{ id: 'Quote', label: "'", kanataName: "'", x: 11.75, y: 3.5, width: 1, height: 1 },
	// Enter moved from Row 2 (iso-enter) to Row 3 (rect 2.25u) in ANSI layout
	{ id: 'Enter', label: 'Enter', kanataName: 'ret', x: 12.75, y: 3.5, width: 2.25, height: 1 },
	// Numpad row 3
	{ id: 'Numpad4', label: '4', kanataName: 'kp4', x: 19, y: 3.5, width: 1, height: 1 },
	{ id: 'Numpad5', label: '5', kanataName: 'kp5', x: 20, y: 3.5, width: 1, height: 1 },
	{ id: 'Numpad6', label: '6', kanataName: 'kp6', x: 21, y: 3.5, width: 1, height: 1 },

	// =========================================================================
	// Row 4: Shift row (y = 4.5) — 17 keys
	// =========================================================================
	{ id: 'ShiftLeft', label: 'Shift', kanataName: 'lsft', x: 0, y: 4.5, width: 2.25, height: 1 },
	{ id: 'KeyZ', label: 'Z', kanataName: 'z', x: 2.25, y: 4.5, width: 1, height: 1 },
	{ id: 'KeyX', label: 'X', kanataName: 'x', x: 3.25, y: 4.5, width: 1, height: 1 },
	{ id: 'KeyC', label: 'C', kanataName: 'c', x: 4.25, y: 4.5, width: 1, height: 1 },
	{ id: 'KeyV', label: 'V', kanataName: 'v', x: 5.25, y: 4.5, width: 1, height: 1 },
	{ id: 'KeyB', label: 'B', kanataName: 'b', x: 6.25, y: 4.5, width: 1, height: 1 },
	{ id: 'KeyN', label: 'N', kanataName: 'n', x: 7.25, y: 4.5, width: 1, height: 1 },
	{ id: 'KeyM', label: 'M', kanataName: 'm', x: 8.25, y: 4.5, width: 1, height: 1 },
	{ id: 'Comma', label: ',', kanataName: ',', x: 9.25, y: 4.5, width: 1, height: 1 },
	{ id: 'Period', label: '.', kanataName: '.', x: 10.25, y: 4.5, width: 1, height: 1 },
	{ id: 'Slash', label: '/', kanataName: '/', x: 11.25, y: 4.5, width: 1, height: 1 },
	// IntlRo removed — ANSI has no Ro key
	{ id: 'ShiftRight', label: 'Shift', kanataName: 'rsft', x: 12.25, y: 4.5, width: 2.75, height: 1 },
	// Nav cluster row 4
	{ id: 'ArrowUp', label: '↑', kanataName: 'up', x: 16.5, y: 4.5, width: 1, height: 1 },
	// Numpad row 4
	{ id: 'Numpad1', label: '1', kanataName: 'kp1', x: 19, y: 4.5, width: 1, height: 1 },
	{ id: 'Numpad2', label: '2', kanataName: 'kp2', x: 20, y: 4.5, width: 1, height: 1 },
	{ id: 'Numpad3', label: '3', kanataName: 'kp3', x: 21, y: 4.5, width: 1, height: 1 },
	{ id: 'NumpadEnter', label: 'Num\nEnter', kanataName: 'kprt', x: 22, y: 4.5, width: 1, height: 2 },

	// =========================================================================
	// Row 5: Space row (y = 5.5) — 13 keys
	// =========================================================================
	{ id: 'ControlLeft', label: 'Ctrl', kanataName: 'lctl', x: 0, y: 5.5, width: 1.25, height: 1 },
	{ id: 'MetaLeft', label: 'Meta', kanataName: 'lmet', x: 1.25, y: 5.5, width: 1.25, height: 1 },
	{ id: 'AltLeft', label: 'Alt', kanataName: 'lalt', x: 2.5, y: 5.5, width: 1.25, height: 1 },
	// NonConvert, Convert, KanaMode removed — ANSI has none of these
	{ id: 'Space', label: 'Space', kanataName: 'spc', x: 3.75, y: 5.5, width: 6.25, height: 1 },
	{ id: 'AltRight', label: 'Alt', kanataName: 'ralt', x: 10, y: 5.5, width: 1.25, height: 1 },
	{ id: 'MetaRight', label: 'Meta', kanataName: 'rmet', x: 11.25, y: 5.5, width: 1.25, height: 1 },
	{ id: 'ContextMenu', label: 'Menu', kanataName: 'comp', x: 12.5, y: 5.5, width: 1.25, height: 1 },
	{ id: 'ControlRight', label: 'Ctrl', kanataName: 'rctl', x: 13.75, y: 5.5, width: 1.25, height: 1 },
	// Nav cluster row 5
	{ id: 'ArrowLeft', label: '←', kanataName: 'lft', x: 15.5, y: 5.5, width: 1, height: 1 },
	{ id: 'ArrowDown', label: '↓', kanataName: 'down', x: 16.5, y: 5.5, width: 1, height: 1 },
	{ id: 'ArrowRight', label: '→', kanataName: 'rght', x: 17.5, y: 5.5, width: 1, height: 1 },
	// Numpad row 5
	{ id: 'Numpad0', label: '0', kanataName: 'kp0', x: 19, y: 5.5, width: 2, height: 1 },
	{ id: 'NumpadDecimal', label: '.', kanataName: 'kp.', x: 21, y: 5.5, width: 1, height: 1 }
];

export const ANSI_104_TEMPLATE: LayoutTemplate = {
	id: 'ansi-104',
	name: '104(ANSI)',
	keys,
	supportedFormats: ['kbd', 'json', 'ahk'],
	usLayout: true
};
