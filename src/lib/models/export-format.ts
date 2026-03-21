// =============================================================================
// Export Format Model — Shared types for export capability and availability
// =============================================================================
// Depends on: (none)
// Tested by: tests/unit/export-format-support.test.ts, tests/unit/ahk-generator.test.ts
// Called from: models/types.ts, services/, stores/, components/, routes/

/** haruka が扱う出力形式の一覧 */
export const EXPORT_FORMAT_IDS = ['kbd', 'json', 'json-unified', 'ahk'] as const;

/** 出力形式の識別子 */
export type ExportFormatId = (typeof EXPORT_FORMAT_IDS)[number];

/** AHK 正規化対象の高度な tap-hold variant */
export type AhkNormalizedVariant = 'tap-hold-press' | 'tap-hold-release';

/** format ごとの blocking issue */
export interface ExportCompatibilityIssue {
	format: ExportFormatId;
	severity: 'error';
	code: string;
	layerName?: string;
	keyId?: string;
	message: string;
}

/** format ごとの自動変換 notice */
export interface ExportConversionNotice {
	format: 'ahk';
	code: 'AHK_VARIANT_NORMALIZED';
	layerName: string;
	keyId: string;
	originalVariant: AhkNormalizedVariant;
	convertedVariant: 'tap-hold';
	message: string;
	headerComment: string;
}

/** AHK generator の戻り値 */
export interface AhkGeneratorResult {
	text: string;
	issues: ExportCompatibilityIssue[];
	notices: ExportConversionNotice[];
}

/** UI が利用する format 単位の状態 */
export interface ExportFormatStatus {
	format: ExportFormatId;
	available: boolean;
	staticallySupported: boolean;
	issues: ExportCompatibilityIssue[];
	notices: ExportConversionNotice[];
	disabledReason: string | null;
}

/** AHK generator の空結果 */
export const EMPTY_AHK_GENERATOR_RESULT: AhkGeneratorResult = {
	text: '',
	issues: [],
	notices: []
};