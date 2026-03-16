// =============================================================================
// Shift Label Definitions — Facade over key-metadata.ts
// =============================================================================
// Depends on: models/key-metadata.ts
// Tested by: tests/unit/shift-labels.test.ts
// Called from: utils/key-label-resolver.ts, components/keyboard/
// Provides upper(Shift)/lower(normal) label pairs for keyboard SVG display.
// Derived from the unified KEY_REGISTRY. Export interface unchanged.

import { KEY_REGISTRY } from './key-metadata';

/**
 * キー1つ分のShiftラベル定義
 */
export interface ShiftLabelEntry {
	/** JIS配列の通常文字 */
	jisNormal: string;
	/** JIS配列のShift文字 (null = 2行表示なし) */
	jisShift: string | null;
	/** US配列の通常文字 */
	usNormal: string;
	/** US配列のShift文字 (null = 2行表示なし) */
	usShift: string | null;
}

/**
 * 全キーのShiftラベルデータ
 * Key: PhysicalKey.id (event.code)
 */
export const SHIFT_LABELS: ReadonlyMap<string, ShiftLabelEntry> = new Map<string, ShiftLabelEntry>(
	Array.from(KEY_REGISTRY.values())
		.filter((m) => m.physicalKeyId !== '')
		.map((m) => [
			m.physicalKeyId,
			{
				jisNormal: m.jisNormal,
				jisShift: m.jisShift,
				usNormal: m.usNormal,
				usShift: m.usShift,
			},
		])
);
