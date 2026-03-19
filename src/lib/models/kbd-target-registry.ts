// =============================================================================
// kbd-target-registry — target-aware .kbd 変換レジストリ
// =============================================================================
// Depends on: types.ts (KbdTargetOs)
// Tested by: tests/unit/kbd-target-registry.test.ts
// Called from: kbd-generator.ts, export-format-support.ts

import type { KbdTargetOs } from './types';

/** ターゲット OS でそのまま出力可能な kanata キー名 */
export interface KbdStrategyNativeKey {
	type: 'native-key';
	kanataToken: string;
}

/** 固定の arbitrary-code S 式で置換 */
export interface KbdStrategyArbitraryCode {
	type: 'fixed-arbitrary-code';
	code: number;
	kanataExpr: string;
	description: string;
}

/** 変換定義なし — export/preview をブロック */
export interface KbdStrategyUnsupported {
	type: 'unsupported';
	reason: string;
}

export type KbdActionStrategy =
	| KbdStrategyNativeKey
	| KbdStrategyArbitraryCode
	| KbdStrategyUnsupported;

/** action ID × target OS → 変換戦略のマッピング */
export const KBD_TARGET_REGISTRY: ReadonlyMap<string, ReadonlyMap<KbdTargetOs, KbdActionStrategy>> = new Map([
	['lang1', new Map<KbdTargetOs, KbdActionStrategy>([
		['windows', { type: 'fixed-arbitrary-code', code: 22, kanataExpr: '(arbitrary-code 22)', description: 'VK_IME_ON' }],
		['macos', { type: 'native-key', kanataToken: 'kana' }],
		['linux', { type: 'unsupported', reason: 'Linux 向け LANG1 変換が未定義' }],
	])],
	['lang2', new Map<KbdTargetOs, KbdActionStrategy>([
		['windows', { type: 'fixed-arbitrary-code', code: 26, kanataExpr: '(arbitrary-code 26)', description: 'VK_IME_OFF' }],
		['macos', { type: 'native-key', kanataToken: 'eisu' }],
		['linux', { type: 'unsupported', reason: 'Linux 向け LANG2 変換が未定義' }],
	])],
	['jp-kana', new Map<KbdTargetOs, KbdActionStrategy>([
		// Windows: ビルトイン kana (OsCode 122=KEY_HANGEUL) と Interception の
		// スキャンコード 0x70 (OsCode 90=KEY_KATAKANA) が不一致するため、
		// deflocalkeys-wintercept で定義するカスタム名 katahira を使用
		['windows', { type: 'native-key', kanataToken: 'katahira' }],
		['macos', { type: 'native-key', kanataToken: 'kana' }],
		['linux', { type: 'native-key', kanataToken: 'kana' }],
	])],
]);

/**
 * action ID と target OS から変換戦略を解決。
 * レジストリに未登録の action ID は native-key としてそのまま通過。
 */
export function resolveKbdAction(actionId: string, target: KbdTargetOs): KbdActionStrategy {
	const targetMap = KBD_TARGET_REGISTRY.get(actionId);
	if (!targetMap) {
		return { type: 'native-key', kanataToken: actionId };
	}
	const strategy = targetMap.get(target);
	if (!strategy) {
		return { type: 'native-key', kanataToken: actionId };
	}
	return strategy;
}
