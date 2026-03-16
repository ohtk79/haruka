// =============================================================================
// JIS → US 16-Key Mapping Data — Facade over key-metadata.ts
// =============================================================================
// Depends on: models/key-metadata.ts
// Tested by: tests/unit/jis-us-map.test.ts
// Called from: stores/editor.svelte.ts, services/kbd-generator.ts
// Conversion-specific data (alias, normalExpr, shiftExpr) is defined here.
// Display data (jisNormal, jisShift, usNormal, usShift) is derived from the
// unified KEY_REGISTRY, with explicit overrides where semantics differ.

import { KEY_REGISTRY } from './key-metadata';

/**
 * JIS→US変換対象キー1つ分の定義
 */
export interface JisToUsMapping {
	/** PhysicalKey.id (event.code) */
	physicalKeyId: string;
	/** kanata defsrc でのキー名 */
	kanataDefsrcName: string;
	/** jus-* エイリアス名 */
	aliasName: string;
	/** 通常時のkanata出力式 */
	normalExpr: string;
	/** Shift時のkanata出力式 */
	shiftExpr: string;
	/** release-key が必要か（jus-yen, jus-ro は false） */
	needsReleaseKey: boolean;
	/** JIS配列の通常文字（表示用） */
	jisNormal: string;
	/** JIS配列のShift文字（表示用） */
	jisShift: string;
	/** US配列の通常文字（表示用） */
	usNormal: string;
	/** US配列のShift文字（表示用） */
	usShift: string;
}

// Conversion-specific entries: [kanataName, aliasName, normalExpr, shiftExpr, needsReleaseKey, displayOverrides?]
type ConvEntry = [string, string, string, string, boolean, Partial<{ jN: string; jS: string; uN: string; uS: string }>?];

const CONV_ENTRIES: ConvEntry[] = [
	['grv', 'jus-grv', 'S-[', 'S-=', true, { jS: '\u2014' }],
	['2', 'jus-2', '2', '[', true],
	['6', 'jus-6', '6', '=', true],
	['7', 'jus-7', '7', 'S-6', true],
	['8', 'jus-8', '8', "S-'", true],
	['9', 'jus-9', '9', 'S-8', true],
	['0', 'jus-0', '0', 'S-9', true],
	['-', 'jus-min', '-', 'S-ro', true],
	['=', 'jus-eq', 'S--', 'S-;', true],
	['[', 'jus-lbr', ']', 'S-]', true],
	[']', 'jus-rbr', '\\', 'S-\\', true],
	[';', 'jus-scl', ';', "'", true],
	["'", 'jus-quo', 'S-7', 'S-2', true],
	['\\', 'jus-bsl', 'ro', 'S-\u00A5', true],
	['\u00A5', 'jus-yen', 'ro', 'S-\u00A5', false],
	['ro', 'jus-ro', 'ro', 'S-\u00A5', false, { jN: '\\', uN: '\\', uS: '|' }],
];

/**
 * 16キーのJIS→USマッピングデータ
 */
export const JIS_TO_US_MAPPINGS: readonly JisToUsMapping[] = CONV_ENTRIES.map((e): JisToUsMapping => {
	const meta = KEY_REGISTRY.get(e[0])!;
	const ov = e[5];
	return {
		physicalKeyId: meta.physicalKeyId,
		kanataDefsrcName: e[0],
		aliasName: e[1],
		normalExpr: e[2],
		shiftExpr: e[3],
		needsReleaseKey: e[4],
		jisNormal: ov?.jN ?? meta.jisNormal,
		jisShift: ov?.jS ?? meta.jisShift ?? '',
		usNormal: ov?.uN ?? meta.usNormal,
		usShift: ov?.uS ?? meta.usShift ?? '',
	};
});

/**
 * physicalKeyId で高速検索するための Map
 */
export const JIS_TO_US_MAP_BY_KEY = new Map<string, JisToUsMapping>(
	JIS_TO_US_MAPPINGS.map((m) => [m.physicalKeyId, m])
);

/**
 * kanataDefsrcName で高速検索するための Map
 * リマップ先のキーがJIS→US変換対象かを判定するために使用
 */
export const JIS_TO_US_MAP_BY_KANATA_NAME = new Map<string, JisToUsMapping>(
	JIS_TO_US_MAPPINGS.map((m) => [m.kanataDefsrcName, m])
);
