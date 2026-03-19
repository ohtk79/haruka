// =============================================================================
// Kanata Key Catalog — Facade over key-metadata.ts
// =============================================================================
// Derived from the unified KEY_REGISTRY. Export interface unchanged.

import { KEY_REGISTRY, CATEGORY_ORDER, getCategoryLabel } from '$lib/models/key-metadata';

export interface KanataKeyInfo {
	/** kanata キー名 */
	name: string;
	/** 表示ラベル */
	label: string;
}

export interface KanataKeyCategory {
	/** カテゴリ ID */
	id: string;
	/** カテゴリ名 */
	label: string;
	/** カテゴリに含まれるキー */
	keys: KanataKeyInfo[];
}

export const KANATA_KEY_CATEGORIES: KanataKeyCategory[] = CATEGORY_ORDER.map((cat) => ({
	id: cat.id,
	label: getCategoryLabel(cat.id),
	keys: Array.from(KEY_REGISTRY.values())
		.filter((m) => m.category === cat.id)
		.map((m) => ({ name: m.kanataName, label: m.displayLabel })),
}));

/** 全 kanata キー名のフラットリスト */
export const ALL_KANATA_KEYS: KanataKeyInfo[] = KANATA_KEY_CATEGORIES.flatMap((c) => c.keys);

/** kanata キー名 → 表示ラベル マップ */
export const KANATA_KEY_LABEL_MAP: Map<string, string> = new Map(
	ALL_KANATA_KEYS.map((k) => [k.name, k.label])
);

/**
 * JIS と US でラベルが異なるキーの US ラベルマップ
 * kanata キー名 → US 配列表示ラベル
 */
export const US_KEY_LABELS: ReadonlyMap<string, string> = new Map([
	['grv', '`'],
	['=', '='],
	['[', '['],
	[']', ']'],
	["'", "'"],
	['\\', '\\'],
	['¥', '\\'],
	['ro', 'Ro'],
	['henk', 'Henkan'],
	['mhnk', 'Muhenkan'],
	['eisu', 'LANG2'],
	['kana', 'LANG1'],
	['lang1', 'LANG1'],
	['lang2', 'LANG2'],
	['jp-kana', 'KANA'],
]);
