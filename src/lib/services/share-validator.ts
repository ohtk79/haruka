// =============================================================================
// Share Validator — 共有データの構造・型・値バリデーション
// =============================================================================
// Depends on: models/share-types.ts, models/constants.ts, templates/index.ts
// Tested by: tests/unit/share-validator.test.ts
// Called from: services/share-url.ts

import type { ShareData, ShareAction, ShareActionType, ShareTapHoldVariant } from '$lib/models/share-types';
import { SHARE_FORMAT_VERSION, MAX_LAYERS, LAYER_NAME_PATTERN } from '$lib/models/constants';
import { getTemplateById } from '$lib/templates';
import * as m from '$lib/paraglide/messages';

// =============================================================================
// ShareError — エラーコード付きの共有エラー型
// =============================================================================

/** 共有処理のエラーコード */
export type ShareErrorCode =
	| 'DECODE_ERROR'
	| 'DECOMPRESS_ERROR'
	| 'PARSE_ERROR'
	| 'VALIDATION_ERROR'
	| 'VERSION_TOO_NEW'
	| 'TEMPLATE_NOT_FOUND';

/** エラーコード → ユーザー向けメッセージ */
function getErrorMessage(code: ShareErrorCode): string {
	const messages: Record<ShareErrorCode, () => string> = {
		DECODE_ERROR: m.error_share_corrupted,
		DECOMPRESS_ERROR: m.error_share_decompressFailed,
		PARSE_ERROR: m.error_share_parseFailed,
		VALIDATION_ERROR: m.error_share_invalidFormat,
		VERSION_TOO_NEW: m.error_share_newerVersion,
		TEMPLATE_NOT_FOUND: m.error_share_unsupportedTemplate
	};
	return messages[code]();
}

/** 共有処理の段階別エラー */
export class ShareError extends Error {
	readonly code: ShareErrorCode;

	constructor(code: ShareErrorCode, detail?: string) {
		const message = detail ?? getErrorMessage(code);
		super(message);
		this.name = 'ShareError';
		this.code = code;
	}
}

// =============================================================================
// バリデーション結果
// =============================================================================

/** バリデーション結果 */
export interface ValidationResult {
	valid: boolean;
	error?: string;
}

/** 有効な ShareAction type */
const VALID_ACTION_TYPES: ReadonlySet<ShareActionType> = new Set(['k', '_', 'x', 'th', 'lh', 'ls']);

/** 有効な TapHold variant */
const VALID_TAP_HOLD_VARIANTS: ReadonlySet<ShareTapHoldVariant> = new Set(['th', 'thp', 'thr']);

/**
 * ShareAction を再帰的にバリデーションする
 */
function validateAction(action: unknown): ValidationResult {
	if (typeof action !== 'object' || action === null) {
		return { valid: false, error: m.error_share_invalidFormat() };
	}

	const a = action as Record<string, unknown>;

	if (typeof a.t !== 'string' || !VALID_ACTION_TYPES.has(a.t as ShareActionType)) {
		return { valid: false, error: m.error_share_invalidFormat() };
	}

	switch (a.t) {
		case 'k':
			if (typeof a.v !== 'string') {
				return { valid: false, error: m.error_share_invalidFormat() };
			}
			if (a.m !== undefined) {
				if (!Array.isArray(a.m) || !a.m.every((m: unknown) => typeof m === 'string')) {
					return { valid: false, error: m.error_share_invalidFormat() };
				}
			}
			break;
		case 'lh':
		case 'ls':
			if (typeof a.l !== 'string') {
				return { valid: false, error: m.error_share_invalidFormat() };
			}
			break;
		case 'th': {
			if (typeof a.vr !== 'string' || !VALID_TAP_HOLD_VARIANTS.has(a.vr as ShareTapHoldVariant)) {
				return { valid: false, error: m.error_share_invalidFormat() };
			}
			if (typeof a.to !== 'number' || typeof a.ho !== 'number') {
				return { valid: false, error: m.error_share_invalidFormat() };
			}
			// tapAction バリデーション
			const taResult = validateAction(a.ta);
			if (!taResult.valid) return taResult;
			// holdAction バリデーション
			const haResult = validateAction(a.ha);
			if (!haResult.valid) return haResult;
			break;
		}
		// '_' と 'x' はフィールドなし — 追加チェック不要
	}

	return { valid: true };
}

/**
 * unknown データを ShareData としてバリデーションする
 * @returns バリデーション結果。valid=true の場合、data は ShareData として安全に使用可能
 */
export function validateShareData(data: unknown): ValidationResult {
	if (typeof data !== 'object' || data === null) {
		return { valid: false, error: m.error_share_invalidFormat() };
	}

	const d = data as Record<string, unknown>;

	// v: フォーマットバージョン
	if (typeof d.v !== 'number') {
		return { valid: false, error: m.error_share_invalidFormat() };
	}
	if (d.v > SHARE_FORMAT_VERSION) {
		return {
			valid: false,
			error: m.error_share_newerVersion()
		};
	}

	// t: テンプレート ID
	if (typeof d.t !== 'string') {
		return { valid: false, error: m.error_share_invalidFormat() };
	}
	if (!getTemplateById(d.t)) {
		return {
			valid: false,
			error: m.error_share_unsupportedTemplate()
		};
	}

	// l: レイヤ配列
	if (!Array.isArray(d.l)) {
		return { valid: false, error: m.error_share_invalidFormat() };
	}
	if (d.l.length === 0 || d.l.length > MAX_LAYERS) {
		return { valid: false, error: m.error_share_layerCountOutOfRange() };
	}

	// 各レイヤをバリデーション
	for (const layer of d.l) {
		if (typeof layer !== 'object' || layer === null) {
			return { valid: false, error: m.error_share_invalidFormat() };
		}
		const l = layer as Record<string, unknown>;

		if (typeof l.n !== 'string') {
			return { valid: false, error: m.error_share_invalidFormat() };
		}
		if (!LAYER_NAME_PATTERN.test(l.n)) {
			return { valid: false, error: m.error_share_invalidLayerName({ name: l.n }) };
		}

		if (typeof l.a !== 'object' || l.a === null || Array.isArray(l.a)) {
			return { valid: false, error: m.error_share_invalidFormat() };
		}

		// 各アクションをバリデーション
		for (const [, action] of Object.entries(l.a as Record<string, unknown>)) {
			const actionResult = validateAction(action);
			if (!actionResult.valid) return actionResult;
		}
	}

	// j: オプション boolean
	if (d.j !== undefined && typeof d.j !== 'boolean') {
		return { valid: false, error: m.error_share_invalidFormat() };
	}

	// tt: オプション number
	if (d.tt !== undefined && typeof d.tt !== 'number') {
		return { valid: false, error: m.error_share_invalidFormat() };
	}

	return { valid: true };
}
