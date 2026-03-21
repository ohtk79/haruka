// =============================================================================
// Export Share URL — エクスポートファイルへの共有 URL コメント埋め込み
// =============================================================================
// Depends on: models/export-format.ts
// Tested by: tests/unit/export-share-url.test.ts
// Called from: routes/+page.svelte

import type { ExportFormatId } from '$lib/models/export-format';

/**
 * エクスポートテキストのヘッダーコメント末尾に共有 URL コメントを埋め込む。
 * 各形式のコメント構文に従って URL 行を追加する。
 * shareUrl が空の場合は元テキストをそのまま返す。
 */
export function embedShareUrlComment(
	text: string,
	format: ExportFormatId,
	shareUrl: string
): string {
	if (!shareUrl) return text;

	switch (format) {
		case 'kbd':
			return embedKbd(text, shareUrl);
		case 'json':
		case 'json-unified':
			return embedJson(text, shareUrl);
		case 'ahk':
			return embedAhk(text, shareUrl);
	}
}

/** kbd 形式: ;; ヘッダーブロック末尾に空行 + ;; Edit: <URL> を追加 */
function embedKbd(text: string, shareUrl: string): string {
	const lines = text.split('\n');
	// 先頭から ;; で始まる連続行を検出
	let headerEnd = 0;
	while (headerEnd < lines.length && lines[headerEnd].startsWith(';;')) {
		headerEnd++;
	}

	if (headerEnd === 0) {
		// ヘッダーなし: テキスト先頭に追加
		return `;;  Edit: ${shareUrl}\n\n${text}`;
	}

	// ヘッダーブロック末尾の後に空行 + URL コメントを挿入
	const header = lines.slice(0, headerEnd);
	const rest = lines.slice(headerEnd);
	return [...header, `;;`, `;;  Edit: ${shareUrl}`, ...rest].join('\n');
}

/** json / json-unified 形式: JSON 本体の前に // Edit: <URL> 行を追加 */
function embedJson(text: string, shareUrl: string): string {
	return `// Edit: ${shareUrl}\n${text}`;
}

/** ahk 形式: ; ヘッダーブロック末尾に空行 + ; Edit: <URL> を追加 */
function embedAhk(text: string, shareUrl: string): string {
	const lines = text.split('\n');
	// 先頭から ; で始まる連続行を検出（ヘッダーブロック）
	let headerEnd = 0;
	while (headerEnd < lines.length && lines[headerEnd].startsWith(';')) {
		headerEnd++;
	}

	if (headerEnd === 0) {
		// ヘッダーなし: テキスト先頭に追加
		return `; Edit: ${shareUrl}\n\n${text}`;
	}

	// ヘッダーブロック末尾の後に空行 + URL コメントを挿入
	const header = lines.slice(0, headerEnd);
	const rest = lines.slice(headerEnd);
	return [...header, `;`, `; Edit: ${shareUrl}`, ...rest].join('\n');
}
