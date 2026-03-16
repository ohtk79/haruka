// =============================================================================
// Share URL — 共有 URL の生成・パースサービス
// =============================================================================
// Depends on: models/share-types.ts, models/constants.ts, utils/base64url.ts, utils/compression.ts, services/share-validator.ts
// Tested by: tests/unit/share-url.test.ts
// Called from: components/common/Header.svelte, routes/+page.svelte

import type { ShareData } from '$lib/models/share-types';
import { URL_HASH_PREFIX } from '$lib/models/constants';
import { base64urlEncode, base64urlDecode } from '$lib/utils/base64url';
import { compress, decompress } from '$lib/utils/compression';
import { validateShareData } from '$lib/services/share-validator';
import { ShareError } from '$lib/services/share-validator';

// =============================================================================
// エンコード（ShareData → Base64URL 文字列）
// =============================================================================

/**
 * ShareData を圧縮・エンコードして Base64URL 文字列に変換する
 * パイプライン: JSON.stringify → TextEncoder → compress(deflate-raw) → base64urlEncode
 */
export async function encodeShareData(data: ShareData): Promise<string> {
	const json = JSON.stringify(data);
	const bytes = new TextEncoder().encode(json);
	const compressed = await compress(bytes);
	return base64urlEncode(compressed);
}

// =============================================================================
// URL 生成
// =============================================================================

/**
 * Base64URL エンコード済み文字列からフル共有 URL を生成する
 * @param encoded encodeShareData() の結果
 * @param baseUrl ベース URL（省略時は現在の location）
 */
export function generateShareUrl(encoded: string, baseUrl?: string): string {
	const base = baseUrl ?? `${window.location.origin}${window.location.pathname}`;
	return `${base}#${URL_HASH_PREFIX}${encoded}`;
}

// =============================================================================
// デコード（Base64URL 文字列 → ShareData）
// =============================================================================

/**
 * Base64URL 文字列をデコード・展開・パース・バリデーションして ShareData に変換する
 * パイプライン: base64urlDecode → decompress(deflate-raw) → TextDecoder → JSON.parse → validate
 * @throws ShareError 各段階で失敗した場合にステージ別エラー
 */
export async function decodeShareData(encoded: string): Promise<ShareData> {
	// Stage 1: Base64URL デコード
	let bytes: Uint8Array;
	try {
		bytes = base64urlDecode(encoded);
	} catch {
		throw new ShareError('DECODE_ERROR');
	}

	// Stage 2: 展開
	let decompressed: Uint8Array;
	try {
		decompressed = await decompress(bytes);
	} catch {
		throw new ShareError('DECOMPRESS_ERROR');
	}

	// Stage 3: JSON パース
	let parsed: unknown;
	try {
		const json = new TextDecoder().decode(decompressed);
		parsed = JSON.parse(json);
	} catch {
		throw new ShareError('PARSE_ERROR');
	}

	// Stage 4: バリデーション
	const result = validateShareData(parsed);
	if (!result.valid) {
		// バリデーションエラーの種別に応じてエラーコードを分ける
		if (result.error?.includes('新しいバージョン')) {
			throw new ShareError('VERSION_TOO_NEW', result.error);
		}
		if (result.error?.includes('サポートされていません')) {
			throw new ShareError('TEMPLATE_NOT_FOUND', result.error);
		}
		throw new ShareError('VALIDATION_ERROR', result.error);
	}

	return parsed as ShareData;
}

// =============================================================================
// URL ハッシュからのエンコード文字列抽出
// =============================================================================

/**
 * URL ハッシュフラグメントから config= 以降のエンコード文字列を抽出する
 * @returns エンコード文字列。config= が見つからない場合は null
 */
export function extractEncodedFromHash(hash: string): string | null {
	const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
	if (!fragment.startsWith(URL_HASH_PREFIX)) return null;
	return fragment.slice(URL_HASH_PREFIX.length);
}
