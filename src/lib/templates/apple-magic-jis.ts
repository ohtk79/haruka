// =============================================================================
// Apple Magic Keyboard JIS (Full-size) Template Data
// =============================================================================
// 113 keys with coordinates in key units (1u = standard key width)
// viewBox: "0 0 23 6.5"
// Cluster layout: Main(0~15u) + gap + Nav(15.5~17.5u) + gap + Numpad(19~23u)
//
// KE 専用テンプレート（kanata .kbd 非対応）
// JIS 109 との差分:
//   追加: Fn キー（kanataName なし, 最下段右端）, F13-F19, NumpadEqual (kp=)
//   追加: ContextMenu (nav cluster row 1)
//   変更: 英数(eisu)/かな(kana) を使用（無変換/変換 の代わり）
//   削除: PrtSc, ScrLk, Pause, Insert, 半角/全角
//   変更: Digit1 を 1.75u に拡大（半角/全角削除分を吸収）
//   変更: Backspace を 1.25u に拡大（左方向）
//   変更: ファンクション行が連続配置（グループ間ギャップなし）
//   変更: テンキー上段が clear/=/÷/×（NumLock, kp=, kp/, kp*）
//   変更: テンキー -/+ が各 1u（標準の 2u + は使用しない）
//   変更: Nav cluster — ContextMenu / Del / Home / End / PgUp / PgDn

import type { LayoutTemplate, PhysicalKey } from '$lib/models/types';

const keys: PhysicalKey[] = [
	// =========================================================================
	// Row 0: Function keys (y = 0) — 20 keys
	// Esc | 0.25u gap | F1-F4 | 0.25u gap | F5-F8 | 0.25u gap | F9-F12
	// =========================================================================
	{ id: 'Escape', label: 'Esc', kanataName: 'esc', x: 0, y: 0, width: 1, height: 1 },
	{ id: 'F1', label: 'F1', kanataName: 'f1', x: 1.25, y: 0, width: 1, height: 1 },
	{ id: 'F2', label: 'F2', kanataName: 'f2', x: 2.25, y: 0, width: 1, height: 1 },
	{ id: 'F3', label: 'F3', kanataName: 'f3', x: 3.25, y: 0, width: 1, height: 1 },
	{ id: 'F4', label: 'F4', kanataName: 'f4', x: 4.25, y: 0, width: 1, height: 1 },
	{ id: 'F5', label: 'F5', kanataName: 'f5', x: 5.5, y: 0, width: 1, height: 1 },
	{ id: 'F6', label: 'F6', kanataName: 'f6', x: 6.5, y: 0, width: 1, height: 1 },
	{ id: 'F7', label: 'F7', kanataName: 'f7', x: 7.5, y: 0, width: 1, height: 1 },
	{ id: 'F8', label: 'F8', kanataName: 'f8', x: 8.5, y: 0, width: 1, height: 1 },
	{ id: 'F9', label: 'F9', kanataName: 'f9', x: 9.75, y: 0, width: 1, height: 1 },
	{ id: 'F10', label: 'F10', kanataName: 'f10', x: 10.75, y: 0, width: 1, height: 1 },
	{ id: 'F11', label: 'F11', kanataName: 'f11', x: 11.75, y: 0, width: 1, height: 1 },
	{ id: 'F12', label: 'F12', kanataName: 'f12', x: 12.75, y: 0, width: 1, height: 1 },
	// Extended function keys (nav cluster area)
	{ id: 'F13', label: 'F13', kanataName: 'f13', x: 15.5, y: 0, width: 1, height: 1 },
	{ id: 'F14', label: 'F14', kanataName: 'f14', x: 16.5, y: 0, width: 1, height: 1 },
	{ id: 'F15', label: 'F15', kanataName: 'f15', x: 17.5, y: 0, width: 1, height: 1 },
	// Extended function keys (numpad area)
	{ id: 'F16', label: 'F16', kanataName: 'f16', x: 19, y: 0, width: 1, height: 1 },
	{ id: 'F17', label: 'F17', kanataName: 'f17', x: 20, y: 0, width: 1, height: 1 },
	{ id: 'F18', label: 'F18', kanataName: 'f18', x: 21, y: 0, width: 1, height: 1 },
	{ id: 'F19', label: 'F19', kanataName: 'f19', x: 22, y: 0, width: 1, height: 1 },

	// =========================================================================
	// Row 1: Number row (y = 1.5) — 21 keys
	// Apple JIS: 半角/全角 キーなし — Digit1 を 1.75u に拡大して左端に配置
	// =========================================================================
	{ id: 'Digit1', label: '1', kanataName: '1', x: 0, y: 1.5, width: 1.75, height: 1 },
	{ id: 'Digit2', label: '2', kanataName: '2', x: 1.75, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit3', label: '3', kanataName: '3', x: 2.75, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit4', label: '4', kanataName: '4', x: 3.75, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit5', label: '5', kanataName: '5', x: 4.75, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit6', label: '6', kanataName: '6', x: 5.75, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit7', label: '7', kanataName: '7', x: 6.75, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit8', label: '8', kanataName: '8', x: 7.75, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit9', label: '9', kanataName: '9', x: 8.75, y: 1.5, width: 1, height: 1 },
	{ id: 'Digit0', label: '0', kanataName: '0', x: 9.75, y: 1.5, width: 1, height: 1 },
	{ id: 'Minus', label: '-', kanataName: '-', x: 10.75, y: 1.5, width: 1, height: 1 },
	{ id: 'Equal', label: '^', kanataName: '=', x: 11.75, y: 1.5, width: 1, height: 1 },
	{ id: 'IntlYen', label: '¥', kanataName: '¥', x: 12.75, y: 1.5, width: 1, height: 1 },
	{ id: 'Backspace', label: 'Back\nspace', kanataName: 'bspc', x: 13.75, y: 1.5, width: 1.25, height: 1 },
	// Nav cluster row 1 (Apple: ContextMenu + Home + PgUp)
	{ id: 'ContextMenu', label: 'Menu', kanataName: 'comp', x: 15.5, y: 1.5, width: 1, height: 1 },
	{ id: 'Home', label: 'Home', kanataName: 'home', x: 16.5, y: 1.5, width: 1, height: 1 },
	{ id: 'PageUp', label: 'PgUp', kanataName: 'pgup', x: 17.5, y: 1.5, width: 1, height: 1 },
	// Numpad row 1 (Apple: clear/=/// instead of NumLock///*/-)
	{ id: 'NumLock', label: 'Clear', kanataName: 'nlck', x: 19, y: 1.5, width: 1, height: 1 },
	{ id: 'NumpadEqual', label: '=', kanataName: 'kp=', x: 20, y: 1.5, width: 1, height: 1 },
	{ id: 'NumpadDivide', label: '/', kanataName: 'kp/', x: 21, y: 1.5, width: 1, height: 1 },
	{ id: 'NumpadMultiply', label: '*', kanataName: 'kp*', x: 22, y: 1.5, width: 1, height: 1 },

	// =========================================================================
	// Row 2: QWERTY row (y = 2.5) — 20 keys
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
	{ id: 'BracketLeft', label: '@', kanataName: '[', x: 11.5, y: 2.5, width: 1, height: 1 },
	{ id: 'BracketRight', label: '[', kanataName: ']', x: 12.5, y: 2.5, width: 1, height: 1 },
	// JIS Enter (iso-enter shape spans row 2 and row 3)
	{ id: 'Enter', label: 'Enter', kanataName: 'ret', x: 13.5, y: 2.5, width: 1.5, height: 2, shape: 'iso-enter' },
	// Nav cluster row 2 (Apple: Del + End + PgDn)
	{ id: 'Delete', label: 'Del', kanataName: 'del', x: 15.5, y: 2.5, width: 1, height: 1 },
	{ id: 'End', label: 'End', kanataName: 'end', x: 16.5, y: 2.5, width: 1, height: 1 },
	{ id: 'PageDown', label: 'PgDn', kanataName: 'pgdn', x: 17.5, y: 2.5, width: 1, height: 1 },
	// Numpad row 2 (Apple: 7,8,9,- — each 1u)
	{ id: 'Numpad7', label: '7', kanataName: 'kp7', x: 19, y: 2.5, width: 1, height: 1 },
	{ id: 'Numpad8', label: '8', kanataName: 'kp8', x: 20, y: 2.5, width: 1, height: 1 },
	{ id: 'Numpad9', label: '9', kanataName: 'kp9', x: 21, y: 2.5, width: 1, height: 1 },
	{ id: 'NumpadSubtract', label: '-', kanataName: 'kp-', x: 22, y: 2.5, width: 1, height: 1 },

	// =========================================================================
	// Row 3: Home row (y = 3.5) — 17 keys
	// Apple JIS: Ctrl(1.75u) を Home row 左端に配置（Caps と入替）
	// =========================================================================
	{ id: 'ControlLeft', label: 'Ctrl', kanataName: 'lctl', x: 0, y: 3.5, width: 1.75, height: 1 },
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
	{ id: 'Quote', label: ':', kanataName: "'", x: 11.75, y: 3.5, width: 1, height: 1 },
	{ id: 'Backslash', label: ']', kanataName: '\\', x: 12.75, y: 3.5, width: 1, height: 1 },
	// (Enter iso-enter extends from row 2)
	// Numpad row 3 (Apple: 4,5,6,+ — each 1u)
	{ id: 'Numpad4', label: '4', kanataName: 'kp4', x: 19, y: 3.5, width: 1, height: 1 },
	{ id: 'Numpad5', label: '5', kanataName: 'kp5', x: 20, y: 3.5, width: 1, height: 1 },
	{ id: 'Numpad6', label: '6', kanataName: 'kp6', x: 21, y: 3.5, width: 1, height: 1 },
	{ id: 'NumpadAdd', label: '+', kanataName: 'kp+', x: 22, y: 3.5, width: 1, height: 1 },

	// =========================================================================
	// Row 4: Shift row (y = 4.5) — 19 keys
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
	{ id: 'IntlRo', label: 'ろ', kanataName: 'ro', x: 12.25, y: 4.5, width: 1, height: 1 },
	{ id: 'ShiftRight', label: 'Shift', kanataName: 'rsft', x: 13.25, y: 4.5, width: 1.75, height: 1 },
	// Nav cluster row 4
	{ id: 'ArrowUp', label: '↑', kanataName: 'up', x: 16.5, y: 4.5, width: 1, height: 1 },
	// Numpad row 4
	{ id: 'Numpad1', label: '1', kanataName: 'kp1', x: 19, y: 4.5, width: 1, height: 1 },
	{ id: 'Numpad2', label: '2', kanataName: 'kp2', x: 20, y: 4.5, width: 1, height: 1 },
	{ id: 'Numpad3', label: '3', kanataName: 'kp3', x: 21, y: 4.5, width: 1, height: 1 },
	{ id: 'NumpadEnter', label: 'Num\nEnter', kanataName: 'kprt', x: 22, y: 4.5, width: 1, height: 2 },

	// =========================================================================
	// Row 5: Space row (y = 5.5) — 14 keys
	// Apple JIS: Caps(1u), Opt(1u), Cmd(1.5u), 英数(1.5u), Space(3.5u), かな(1.5u), Cmd(1.5u), Opt(1u), Ctrl(1.25u), fn(1.25u) = 15u
	// Caps と Ctrl を入替（Ctrl は Row 3 に移動）
	// =========================================================================
	{ id: 'CapsLock', label: 'Caps', kanataName: 'caps', x: 0, y: 5.5, width: 1, height: 1 },
	{ id: 'AltLeft', label: 'Opt', kanataName: 'lalt', x: 1, y: 5.5, width: 1, height: 1 },
	{ id: 'MetaLeft', label: 'Cmd', kanataName: 'lmet', x: 2, y: 5.5, width: 1.5, height: 1 },
	{ id: 'Eisu', label: '英数', kanataName: 'eisu', x: 3.5, y: 5.5, width: 1.5, height: 1 },
	{ id: 'Space', label: 'Space', kanataName: 'spc', x: 5, y: 5.5, width: 3.5, height: 1 },
	{ id: 'Lang1Key', label: 'かな', kanataName: 'kana', x: 8.5, y: 5.5, width: 1.5, height: 1 },
	{ id: 'MetaRight', label: 'Cmd', kanataName: 'rmet', x: 10, y: 5.5, width: 1.5, height: 1 },
	{ id: 'AltRight', label: 'Opt', kanataName: 'ralt', x: 11.5, y: 5.5, width: 1, height: 1 },
	{ id: 'ControlRight', label: 'Ctrl', kanataName: 'rctl', x: 12.5, y: 5.5, width: 1.25, height: 1 },
	{ id: 'Fn', label: 'fn', kanataName: 'fn', x: 13.75, y: 5.5, width: 1.25, height: 1 },
	// Nav cluster row 5
	{ id: 'ArrowLeft', label: '←', kanataName: 'lft', x: 15.5, y: 5.5, width: 1, height: 1 },
	{ id: 'ArrowDown', label: '↓', kanataName: 'down', x: 16.5, y: 5.5, width: 1, height: 1 },
	{ id: 'ArrowRight', label: '→', kanataName: 'rght', x: 17.5, y: 5.5, width: 1, height: 1 },
	// Numpad row 5
	{ id: 'Numpad0', label: '0', kanataName: 'kp0', x: 19, y: 5.5, width: 2, height: 1 },
	{ id: 'NumpadDecimal', label: '.', kanataName: 'kp.', x: 21, y: 5.5, width: 1, height: 1 },
];

export const APPLE_MAGIC_JIS_TEMPLATE: LayoutTemplate = {
	id: 'apple-jis',
	name: '112(JIS) Apple専用',
	keys,
	supportedFormats: ['json'],
	keOnly: true,
};
