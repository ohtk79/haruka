// =============================================================================
// share-url-handler — Share URL の検出・インポート処理
// =============================================================================
// Depends on: services/share-url.ts, services/share-serializer.ts,
//             services/share-validator.ts, models/share-types.ts, models/types.ts
// Tested by: tests/e2e/url-share.spec.ts
// Called from: routes/+page.svelte

import type { EditorState } from '$lib/models/types';
import type { ImportSummary } from '$lib/models/share-types';
import { extractEncodedFromHash, decodeShareData, encodeShareData, generateShareUrl } from '$lib/services/share-url';
import { deserializeFromShare, serializeForShare, createImportSummary } from '$lib/services/share-serializer';
import { ShareError } from '$lib/services/share-validator';
import * as m from '$lib/paraglide/messages';

/** checkUrlHash() の戻り値 */
export interface ShareUrlCheckResult {
	state: Partial<EditorState>;
	summary: ImportSummary;
}

/**
 * URL ハッシュから共有データを検出・デコードする。
 * データの有無にかかわらず、ハッシュが存在する場合は URL から除去する。
 *
 * @returns 共有データが見つかった場合は復元用の state と summary を返す
 * @throws {ShareError} デコード・デシリアライズに失敗した場合
 */
export async function checkUrlHash(currentTemplateName: string): Promise<ShareUrlCheckResult | null> {
	const hash = window.location.hash;
	const encoded = extractEncodedFromHash(hash);
	if (!encoded) return null;

	try {
		const shareData = await decodeShareData(encoded);
		const editorState = deserializeFromShare(shareData);
		const summary = createImportSummary(shareData, currentTemplateName);
		return { state: editorState, summary };
	} finally {
		// ハッシュを除去（成功/失敗に関わらず）
		history.replaceState(null, '', window.location.pathname + window.location.search);
	}
}

/**
 * 現在のエディタ状態から共有 URL を生成する
 */
export async function generateShareUrlFromState(state: EditorState): Promise<string> {
	const shareData = serializeForShare(state);
	const encoded = await encodeShareData(shareData);
	return generateShareUrl(encoded);
}

/**
 * ShareError からユーザー向けメッセージを抽出する
 */
export function getShareErrorMessage(err: unknown): string {
	if (err instanceof ShareError) {
		return err.message;
	}
	return m.error_share_loadFailed();
}
